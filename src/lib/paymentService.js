const db = require('../db');
const { notifyAdmin } = require('./notify');

function mapProviderStatus(providerStatus) {
  if (providerStatus === 'success') return 'approved';
  if (providerStatus === 'failed' || providerStatus === 'cancelled') return 'rejected';
  return 'pending';
}

function findPaymentByRef(txRef) {
  return db.prepare('SELECT * FROM payments WHERE provider_ref = ?').get(txRef);
}

async function verifyAndSettle(payment, gateway) {
  if (!gateway || typeof gateway.verify !== 'function') {
    return { providerStatus: payment.provider_status || 'unknown', status: payment.status };
  }

  const result = await gateway.verify(payment.provider_ref);
  let status = mapProviderStatus(result.status);
  let note = payment.note;

  if (status === 'approved' && result.amount != null && Math.abs(result.amount - payment.amount) > 0.01) {
    status = 'pending';
    note = `Amount mismatch: received ${result.amount} ETB, expected ${payment.amount} ETB.`;
  }

  db.prepare(
    `UPDATE payments
     SET status = ?, provider_status = ?, raw_response = ?, note = ?,
         approved_at = CASE WHEN ? = 'approved' THEN datetime('now') ELSE approved_at END,
         reviewed_by = CASE WHEN ? = 'approved' THEN 'auto' ELSE reviewed_by END
     WHERE id = ?`
  ).run(status, result.status, JSON.stringify(result.raw || {}), note, status, status, payment.id);

  if (status === 'approved') {
    db.prepare('INSERT INTO audit_log (user_id, action, details, ip) VALUES (?, ?, ?, ?)').run(
      payment.student_id,
      'payment_auto_approved',
      `Payment #${payment.id} verified via ${payment.provider} (${result.reference || payment.provider_ref})`,
      ''
    );

    const info = db
      .prepare(
        `SELECT u.full_name, u.phone, e.title AS exam_title
         FROM payments p
         JOIN users u ON u.id = p.student_id
         JOIN exams e ON e.id = p.exam_id
         WHERE p.id = ?`
      )
      .get(payment.id);

    notifyAdmin(
      `✅ <b>Payment approved automatically (${payment.provider})</b>\n` +
        (info ? `Student: ${info.full_name} (${info.phone})\nExam: ${info.exam_title}\n` : '') +
        `Amount: ${payment.amount} ETB\n` +
        `Ref: ${result.reference || payment.provider_ref}`
    );
  }

  return { providerStatus: result.status, status, amount: result.amount };
}

module.exports = { verifyAndSettle, findPaymentByRef, mapProviderStatus };
