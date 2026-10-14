const crypto = require('crypto');
const config = require('../../config');

const NAME = 'chapa';

function enabled() {
  return Boolean(config.chapa.secretKey);
}

async function call(path, options = {}) {
  const res = await fetch(`${config.chapa.baseUrl}${path}`, {
    method: options.method || 'GET',
    headers: {
      Authorization: `Bearer ${config.chapa.secretKey}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  let payload = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  if (!res.ok) {
    const message = (payload && (payload.message || payload.error)) || `Chapa request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    err.payload = payload;
    throw err;
  }
  return payload;
}

function splitName(fullName) {
  const parts = String(fullName || 'Student').trim().split(/\s+/);
  const first = parts.shift() || 'Student';
  const last = parts.join(' ') || first;
  return { first, last };
}

async function initialize({ amount, txRef, student, exam, returnUrl, callbackUrl, title }) {
  const { first, last } = splitName(student.fullName);
  const body = {
    amount: Number(amount).toFixed(2),
    currency: 'ETB',
    email: student.email || `${String(student.phone).replace(/\D/g, '')}@exitprep.local`,
    first_name: first,
    last_name: last,
    phone_number: student.phone,
    tx_ref: txRef,
    callback_url: callbackUrl,
    return_url: returnUrl,
    customization: {
      title: title || 'Exit Exam Package',
      description: exam ? exam.title : 'Exit exam preparation package',
    },
    meta: { examId: exam ? exam.id : null, studentId: student.id },
  };

  const payload = await call('/transaction/initialize', { method: 'POST', body });
  const checkoutUrl = payload && payload.data && payload.data.checkout_url;
  if (!checkoutUrl) {
    throw new Error('Chapa did not return a checkout URL.');
  }
  return { checkoutUrl, providerRef: txRef, raw: payload };
}

async function verify(txRef) {
  const payload = await call(`/transaction/verify/${encodeURIComponent(txRef)}`);
  const data = (payload && payload.data) || {};
  return {
    status: data.status || 'pending',
    amount: data.amount != null ? Number(data.amount) : null,
    currency: data.currency || 'ETB',
    reference: data.trx_ref || data.reference || null,
    raw: payload,
  };
}

function verifySignature(rawBody, headers) {
  const secret = config.chapa.webhookSecret;
  if (!secret) return true;
  const signature = headers['chapa-signature'] || headers['x-chapa-signature'];
  if (!signature || !rawBody) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const a = Buffer.from(String(signature));
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

module.exports = { name: NAME, enabled, initialize, verify, verifySignature };
