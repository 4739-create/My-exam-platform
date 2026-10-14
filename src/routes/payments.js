const express = require('express');
const db = require('../db');
const config = require('../config');
const { requireAuth } = require('../lib/auth');
const { isNonEmptyString, isValidPhone } = require('../lib/validate');
const gateways = require('../lib/gateways');
const { verifyAndSettle, findPaymentByRef } = require('../lib/paymentService');
const { notifyAdmin } = require('../lib/notify');

const router = express.Router();

// Manual transfer: student submits the Telebirr reference, admin approves.
router.post('/', requireAuth, (req, res) => {
  const { examId, transactionRef, senderPhone } = req.body || {};

  const exam = db.prepare('SELECT * FROM exams WHERE id = ?').get(examId);
  if (!exam) return res.status(404).json({ error: 'Exam package not found.' });

  if (!isNonEmptyString(transactionRef, 4)) {
    return res.status(400).json({ error: 'Please enter a valid Telebirr transaction reference or M-PESA/Telebirr SMS code.' });
  }
  if (senderPhone && !isValidPhone(senderPhone)) {
    return res.status(400).json({ error: 'The sender phone number is not valid (e.g. 0912345678).' });
  }

  const approved = db
    .prepare("SELECT id FROM payments WHERE student_id = ? AND exam_id = ? AND status = 'approved'")
    .get(req.user.sub, exam.id);
  if (approved) {
    return res.status(409).json({ error: 'You already have approved access to this exam package.' });
  }

  const pending = db
    .prepare("SELECT id FROM payments WHERE student_id = ? AND exam_id = ? AND status = 'pending' AND provider = 'manual'")
    .get(req.user.sub, exam.id);

  const student = db.prepare('SELECT full_name, phone FROM users WHERE id = ?').get(req.user.sub);
  const studentLabel = student ? `${student.full_name} (${student.phone})` : `Student #${req.user.sub}`;

  if (pending) {
    db.prepare(
      "UPDATE payments SET transaction_ref = ?, sender_phone = ?, submitted_at = datetime('now') WHERE id = ?"
    ).run(transactionRef.trim(), senderPhone || '', pending.id);
    notifyAdmin(
      `💳 <b>Payment reference updated (manual)</b>\n` +
        `Student: ${studentLabel}\n` +
        `Exam: ${exam.title}\n` +
        `Amount: ${exam.price} ETB\n` +
        `Ref: ${transactionRef.trim()}\n` +
        `Awaiting your approval.`
    );
    return res.json({
      paymentId: pending.id,
      status: 'pending',
      message: 'Your payment reference was updated and is awaiting administrator approval.',
    });
  }

  const info = db
    .prepare(
      `INSERT INTO payments (student_id, exam_id, amount, payment_method, transaction_ref, sender_phone, status, provider)
       VALUES (?, ?, ?, 'Telebirr', ?, ?, 'pending', 'manual')`
    )
    .run(req.user.sub, exam.id, exam.price, transactionRef.trim(), senderPhone || '');

  notifyAdmin(
    `💳 <b>New payment submitted (manual)</b>\n` +
      `Student: ${studentLabel}\n` +
      `Exam: ${exam.title}\n` +
      `Amount: ${exam.price} ETB\n` +
      `Ref: ${transactionRef.trim()}\n` +
      `Awaiting your approval in the admin portal.`
  );

  return res.status(201).json({
    paymentId: Number(info.lastInsertRowid),
    status: 'pending',
    message: 'Payment submitted. It is Pending until the administrator verifies it.',
  });
});

// Automatic checkout: creates a payment and returns the gateway checkout URL.
router.post('/checkout', requireAuth, async (req, res) => {
  const gateway = gateways.active();
  if (!gateways.onlineEnabled()) {
    return res.status(400).json({
      error:
        'Online payment is not enabled. Transfer manually to Telebirr and submit your reference, or configure CHAPA_SECRET_KEY and PAYMENT_MODE=chapa.',
    });
  }

  const { examId } = req.body || {};
  const exam = db.prepare('SELECT * FROM exams WHERE id = ?').get(examId);
  if (!exam) return res.status(404).json({ error: 'Exam package not found.' });

  const approved = db
    .prepare("SELECT id FROM payments WHERE student_id = ? AND exam_id = ? AND status = 'approved'")
    .get(req.user.sub, exam.id);
  if (approved) {
    return res.status(409).json({ error: 'You already have approved access to this exam package.' });
  }

  const student = db.prepare('SELECT id, full_name, phone FROM users WHERE id = ?').get(req.user.sub);
  const txRef = `EXIT-${student.id}-${exam.id}-${Date.now()}`;

  const existing = db
    .prepare(
      "SELECT * FROM payments WHERE student_id = ? AND exam_id = ? AND provider = ? AND status = 'pending' ORDER BY id DESC LIMIT 1"
    )
    .get(student.id, exam.id, gateway.name);

  let paymentId;
  if (existing) {
    db.prepare(
      "UPDATE payments SET provider_ref = ?, amount = ?, checkout_url = '', provider_status = 'initializing', submitted_at = datetime('now') WHERE id = ?"
    ).run(txRef, exam.price, existing.id);
    paymentId = existing.id;
  } else {
    const info = db
      .prepare(
        `INSERT INTO payments (student_id, exam_id, amount, payment_method, transaction_ref, status, provider, provider_ref, provider_status)
         VALUES (?, ?, ?, ?, '', 'pending', ?, ?, 'initializing')`
      )
      .run(student.id, exam.id, exam.price, gateway.name === 'chapa' ? 'Chapa (Telebirr / Card)' : gateway.name, gateway.name, txRef);
    paymentId = Number(info.lastInsertRowid);
  }

  const returnUrl = `${config.appBaseUrl}/payment-result.html?tx_ref=${encodeURIComponent(txRef)}`;
  const callbackUrl = `${config.appBaseUrl}/api/webhooks/${gateway.name}`;

  try {
    const init = await gateway.initialize({
      amount: exam.price,
      txRef,
      student: { id: student.id, fullName: student.full_name, phone: student.phone },
      exam,
      returnUrl,
      callbackUrl,
    });

    db.prepare("UPDATE payments SET checkout_url = ?, provider_status = 'pending', transaction_ref = ? WHERE id = ?").run(
      init.checkoutUrl,
      txRef,
      paymentId
    );

    return res.status(201).json({ paymentId, txRef, checkoutUrl: init.checkoutUrl });
  } catch (err) {
    db.prepare("UPDATE payments SET provider_status = 'failed', note = ? WHERE id = ?").run(
      `Checkout failed: ${err.message}`,
      paymentId
    );
    return res.status(502).json({ error: `Could not start the payment: ${err.message}` });
  }
});

// Verifies the payment status with the gateway (used by the return page and polling).
router.get('/verify', requireAuth, async (req, res) => {
  const txRef = req.query.tx_ref;
  if (!isNonEmptyString(txRef, 3)) {
    return res.status(400).json({ error: 'A transaction reference is required.' });
  }

  const payment = findPaymentByRef(txRef);
  if (!payment || payment.student_id !== req.user.sub) {
    return res.status(404).json({ error: 'Payment not found for this reference.' });
  }

  const gateway = gateways.GATEWAYS[payment.provider];
  if (!gateway || payment.provider === 'manual') {
    return res.json({ status: payment.status, canAccess: payment.status === 'approved' });
  }

  try {
    const result = await verifyAndSettle(payment, gateway);
    return res.json({
      status: result.status,
      providerStatus: result.providerStatus,
      canAccess: result.status === 'approved',
    });
  } catch (err) {
    return res.status(502).json({ error: `Could not verify the payment: ${err.message}`, status: payment.status });
  }
});

router.get('/mine', requireAuth, (req, res) => {
  const rows = db
    .prepare(
      `SELECT p.id, p.exam_id, e.title AS exam_title, e.department, e.duration,
              p.amount, p.payment_method, p.transaction_ref, p.sender_phone, p.provider,
              p.status, p.submitted_at, p.approved_at, p.note
       FROM payments p JOIN exams e ON e.id = p.exam_id
       WHERE p.student_id = ? ORDER BY p.submitted_at DESC`
    )
    .all(req.user.sub);

  return res.json({
    payments: rows.map((r) => ({
      id: r.id,
      examId: r.exam_id,
      examTitle: r.exam_title,
      department: r.department,
      duration: r.duration,
      amount: r.amount,
      method: r.payment_method,
      provider: r.provider,
      transactionRef: r.transaction_ref,
      senderPhone: r.sender_phone,
      status: r.status,
      submittedAt: r.submitted_at,
      approvedAt: r.approved_at,
      note: r.note,
    })),
  });
});

module.exports = router;
