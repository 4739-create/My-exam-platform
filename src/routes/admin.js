const express = require('express');
const db = require('../db');
const config = require('../config');
const { signToken, requireAdmin } = require('../lib/auth');

const router = express.Router();

router.post('/login', (req, res) => {
  const { name, password } = req.body || {};
  if (typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ error: 'Please enter the administrator full name.' });
  }
  if (typeof password !== 'string' || password.length === 0) {
    return res.status(400).json({ error: 'Please enter the administrator password.' });
  }
  const expectedName = String(config.adminName || '').trim().toLowerCase();
  if (name.trim().toLowerCase() !== expectedName || password !== config.adminPassword) {
    return res.status(401).json({ error: 'Incorrect administrator name or password.' });
  }
  const token = signToken({ role: 'admin', admin: true, name: config.adminName });
  return res.json({ token, role: 'admin', name: config.adminName });
});

router.get('/stats', requireAdmin, (req, res) => {
  const total = db.prepare('SELECT COUNT(*) AS c FROM payments').get().c;
  const pending = db.prepare("SELECT COUNT(*) AS c FROM payments WHERE status = 'pending'").get().c;
  const approved = db.prepare("SELECT COUNT(*) AS c FROM payments WHERE status = 'approved'").get().c;
  const rejected = db.prepare("SELECT COUNT(*) AS c FROM payments WHERE status = 'rejected'").get().c;
  const students = db.prepare("SELECT COUNT(*) AS c FROM users WHERE role = 'student'").get().c;
  const revenue = db
    .prepare("SELECT COALESCE(SUM(amount), 0) AS s FROM payments WHERE status = 'approved'")
    .get().s;
  const attempts = db.prepare('SELECT COUNT(*) AS c FROM exam_attempts').get().c;

  return res.json({ total, pending, approved, rejected, students, revenue, attempts });
});

router.get('/payments', requireAdmin, (req, res) => {
  const status = req.query.status;
  const validStatuses = ['pending', 'approved', 'rejected'];
  const filter = validStatuses.includes(status) ? status : null;

  const rows = db
    .prepare(
      `SELECT p.id, p.amount, p.payment_method, p.transaction_ref, p.sender_phone,
              p.status, p.submitted_at, p.approved_at, p.reviewed_by, p.note,
              u.full_name AS student_name, u.phone AS student_phone, u.department AS student_department,
              e.id AS exam_id, e.title AS exam_title, e.department AS exam_department
       FROM payments p
       JOIN users u ON u.id = p.student_id
       JOIN exams e ON e.id = p.exam_id
       ${filter ? 'WHERE p.status = ?' : ''}
       ORDER BY CASE p.status WHEN 'pending' THEN 0 ELSE 1 END, p.submitted_at DESC`
    )
    .all(...(filter ? [filter] : []));

  return res.json({
    payments: rows.map((r) => ({
      id: r.id,
      studentName: r.student_name,
      studentPhone: r.student_phone,
      studentDepartment: r.student_department,
      examId: r.exam_id,
      examTitle: r.exam_title,
      examDepartment: r.exam_department,
      amount: r.amount,
      method: r.payment_method,
      transactionRef: r.transaction_ref,
      senderPhone: r.sender_phone,
      status: r.status,
      submittedAt: r.submitted_at,
      approvedAt: r.approved_at,
      reviewedBy: r.reviewed_by,
      note: r.note,
    })),
  });
});

function review(req, res, status) {
  const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(req.params.id);
  if (!payment) return res.status(404).json({ error: 'Payment not found.' });
  if (payment.status === status) {
    return res.status(409).json({ error: `Payment is already ${status}.` });
  }

  const note = typeof req.body?.note === 'string' ? req.body.note.trim() : '';
  db.prepare(
    `UPDATE payments SET status = ?, approved_at = CASE WHEN ? = 'approved' THEN datetime('now') ELSE NULL END,
     reviewed_by = ?, note = ? WHERE id = ?`
  ).run(status, status, config.adminName, note, payment.id);

  db.prepare('INSERT INTO audit_log (user_id, action, details, ip) VALUES (?, ?, ?, ?)').run(
    payment.student_id,
    `payment_${status}`,
    `Payment #${payment.id} for exam #${payment.exam_id} (${payment.amount} ETB)`,
    req.ip || ''
  );

  return res.json({ id: payment.id, status });
}

router.post('/payments/:id/approve', requireAdmin, (req, res) => review(req, res, 'approved'));
router.post('/payments/:id/reject', requireAdmin, (req, res) => review(req, res, 'rejected'));

router.get('/attempts', requireAdmin, (req, res) => {
  const rows = db
    .prepare(
      `SELECT a.id, u.full_name AS student_name, u.phone AS student_phone,
              e.title AS exam_title, a.score, a.total, a.end_time
       FROM exam_attempts a
       JOIN users u ON u.id = a.student_id
       JOIN exams e ON e.id = a.exam_id
       ORDER BY a.end_time DESC LIMIT 100`
    )
    .all();
  return res.json({ attempts: rows });
});

module.exports = router;
