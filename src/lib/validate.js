function normalizePhone(phone) {
  if (typeof phone !== 'string') return '';
  return phone.replace(/[^\d+]/g, '').trim();
}

function isValidPhone(phone) {
  const p = normalizePhone(phone);
  if (/^\+251[79]\d{8}$/.test(p)) return true;
  if (/^0[79]\d{8}$/.test(p)) return true;
  return false;
}

function isNonEmptyString(value, min = 1) {
  return typeof value === 'string' && value.trim().length >= min;
}

function toAmount(value) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : NaN;
}

module.exports = { normalizePhone, isValidPhone, isNonEmptyString, toAmount };
