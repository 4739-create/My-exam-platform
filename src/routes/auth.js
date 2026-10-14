const express = require('express');
const db = require('../db');
const { hashPassword, verifyPassword, signToken, requireAuth } = require('../lib/auth');
const { normalizePhone, isValidPhone, isNonEmptyString } = require('../lib/validate');
const { notifyAdmin } = require('../lib/notify');

const router = express.Router();

router.post('/register', (req, res) => {
  const { fullName, phone, department, password } = req.body || {};

  if (!isNonEmptyString(fullName, 3)) {
    return res.status(400).json({ error: 'Please enter your full name (at least 3 characters).' });
  }
  if (!isValidPhone(phone)) {
    return res.status(400).json({ error: 'Please enter a valid Ethiopian phone number (e.g. 0912345678).' });
  }
  if (!isNonEmptyString(department, 2)) {
    return res.status(400).json({ error: 'Please enter your department.' });
  }
  if (!isNonEmptyString(password, 6)) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  const normalized = normalizePhone(phone);
  const existing = db.prepare('SELECT id FROM users WHERE phone = ?').get(normalized);
  if (existing) {
    return res.status(409).json({ error: 'This phone number is already registered. Please log in.' });
  }

  const info = db
    .prepare(
      'INSERT INTO users (full_name, phone, department, password_hash, role) VALUES (?, ?, ?, ?, ?)'
    )
    .run(fullName.trim(), normalized, department.trim(), hashPassword(password), 'student');

  const userId = Number(info.lastInsertRowid);
  const token = signToken({ sub: userId, role: 'student' });

  notifyAdmin(
    `🆕 <b>New registration</b>\n` +
      `Name: ${fullName.trim()}\n` +
      `Phone: ${normalized}\n` +
      `Department: ${department.trim()}\n` +
      `Open the admin portal to view students.`
  );

  res.cookie('token', token, { httpOnly: true, sameSite: 'lax' });
  return res.status(201).json({
    token,
    user: {
      id: userId,
      fullName: fullName.trim(),
      phone: normalized,
      department: department.trim(),
      role: 'student',
    },
  });
});

router.post('/login', (req, res) => {
  const { phone, password } = req.body || {};
  if (!isValidPhone(phone) || !isNonEmptyString(password, 1)) {
    return res.status(400).json({ error: 'Please enter your phone number and password.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(normalizePhone(phone));
  if (!user || !verifyPassword(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid phone number or password.' });
  }

  const token = signToken({ sub: user.id, role: user.role });
  res.cookie('token', token, { httpOnly: true, sameSite: 'lax' });
  return res.json({
    token,
    user: {
      id: user.id,
      fullName: user.full_name,
      phone: user.phone,
      department: user.department,
      role: user.role,
    },
  });
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  return res.json({ ok: true });
});

router.get('/me', requireAuth, (req, res) => {
  const user = db
    .prepare('SELECT id, full_name, phone, department, role, created_at FROM users WHERE id = ?')
    .get(req.user.sub);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  return res.json({
    user: {
      id: user.id,
      fullName: user.full_name,
      phone: user.phone,
      department: user.department,
      role: user.role,
      createdAt: user.created_at,
    },
  });
});

module.exports = router;
