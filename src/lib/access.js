const db = require('../db');

function hasApprovedAccess(userId, examId) {
  const row = db
    .prepare(
      "SELECT id FROM payments WHERE student_id = ? AND exam_id = ? AND status = 'approved' LIMIT 1"
    )
    .get(userId, examId);
  return Boolean(row);
}

function hasPendingPayment(userId, examId) {
  const row = db
    .prepare(
      "SELECT id FROM payments WHERE student_id = ? AND exam_id = ? AND status = 'pending' LIMIT 1"
    )
    .get(userId, examId);
  return Boolean(row);
}

module.exports = { hasApprovedAccess, hasPendingPayment };
