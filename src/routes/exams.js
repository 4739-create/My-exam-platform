const express = require('express');
const db = require('../db');
const { verifyToken } = require('../lib/auth');
const { hasApprovedAccess, hasPendingPayment } = require('../lib/access');

const router = express.Router();

function optionalAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : req.cookies && req.cookies.token;
  const payload = token ? verifyToken(token) : null;
  if (payload && payload.sub) req.user = payload;
  return next();
}

function accessState(userId, examId) {
  if (!userId) return 'guest';
  if (hasApprovedAccess(userId, examId)) return 'approved';
  if (hasPendingPayment(userId, examId)) return 'pending';
  return 'locked';
}

router.get('/', optionalAuth, (req, res) => {
  const exams = db
    .prepare(
      `SELECT e.id, e.title, e.department, e.price, e.duration, e.description,
              (SELECT COUNT(*) FROM questions q WHERE q.exam_id = e.id) AS question_count
       FROM exams e ORDER BY e.department`
    )
    .all();

  const data = exams.map((e) => ({
    id: e.id,
    title: e.title,
    department: e.department,
    price: e.price,
    duration: e.duration,
    description: e.description,
    questionCount: e.question_count,
    access: accessState(req.user && req.user.sub, e.id),
  }));

  return res.json({ exams: data });
});

router.get('/:id', optionalAuth, (req, res) => {
  const exam = db
    .prepare(
      `SELECT e.id, e.title, e.department, e.price, e.duration, e.description,
              (SELECT COUNT(*) FROM questions q WHERE q.exam_id = e.id) AS question_count
       FROM exams e WHERE e.id = ?`
    )
    .get(req.params.id);

  if (!exam) return res.status(404).json({ error: 'Exam package not found.' });

  return res.json({
    exam: {
      id: exam.id,
      title: exam.title,
      department: exam.department,
      price: exam.price,
      duration: exam.duration,
      description: exam.description,
      questionCount: exam.question_count,
      access: accessState(req.user && req.user.sub, exam.id),
    },
  });
});

router.get('/:id/document', optionalAuth, (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Please log in to continue.' });

  const exam = db.prepare('SELECT * FROM exams WHERE id = ?').get(req.params.id);
  if (!exam) return res.status(404).json({ error: 'Exam package not found.' });

  if (!hasApprovedAccess(req.user.sub, exam.id)) {
    return res.status(403).json({ error: 'Access locked. Payment approval is required to open this document.' });
  }

  const student = db.prepare('SELECT full_name, phone FROM users WHERE id = ?').get(req.user.sub);

  return res.json({
    document: exam.document,
    title: exam.title,
    watermark: `${student.full_name} | ${student.phone}`,
  });
});

router.get('/:id/questions', optionalAuth, (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Please log in to continue.' });

  const exam = db.prepare('SELECT * FROM exams WHERE id = ?').get(req.params.id);
  if (!exam) return res.status(404).json({ error: 'Exam package not found.' });

  if (!hasApprovedAccess(req.user.sub, exam.id)) {
    return res.status(403).json({ error: 'Access locked. Payment approval is required to take this mock exam.' });
  }

  const questions = db
    .prepare(
      `SELECT id, question_text, option_a, option_b, option_c, option_d, order_index
       FROM questions WHERE exam_id = ? ORDER BY order_index`
    )
    .all(exam.id)
    .map((q) => ({
      id: q.id,
      text: q.question_text,
      options: { A: q.option_a, B: q.option_b, C: q.option_c, D: q.option_d },
    }));

  return res.json({
    exam: { id: exam.id, title: exam.title, duration: exam.duration, questionCount: questions.length },
    questions,
  });
});

router.post('/:id/submit', optionalAuth, (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Please log in to continue.' });

  const exam = db.prepare('SELECT * FROM exams WHERE id = ?').get(req.params.id);
  if (!exam) return res.status(404).json({ error: 'Exam package not found.' });

  if (!hasApprovedAccess(req.user.sub, exam.id)) {
    return res.status(403).json({ error: 'Access locked. Payment approval is required to submit this exam.' });
  }

  const answers = (req.body && req.body.answers) || {};
  const questions = db
    .prepare('SELECT * FROM questions WHERE exam_id = ? ORDER BY order_index')
    .all(exam.id);

  let score = 0;
  const review = questions.map((q) => {
    const selected = typeof answers[q.id] === 'string' ? answers[q.id].toUpperCase() : null;
    const correct = selected === q.correct_option;
    if (correct) score += 1;
    return {
      id: q.id,
      text: q.question_text,
      options: { A: q.option_a, B: q.option_b, C: q.option_c, D: q.option_d },
      selected,
      correctOption: q.correct_option,
      isCorrect: correct,
      explanation: q.explanation,
    };
  });

  const total = questions.length;
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO exam_attempts (student_id, exam_id, start_time, end_time, score, total, answers_json)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(req.user.sub, exam.id, now, now, score, total, JSON.stringify(answers));

  return res.json({
    score,
    total,
    percentage: total ? Math.round((score / total) * 100) : 0,
    review,
  });
});

module.exports = router;
