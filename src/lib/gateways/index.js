const config = require('../../config');
const chapa = require('./chapa');

const manual = {
  name: 'manual',
  enabled() {
    return true;
  },
};

const GATEWAYS = { chapa, manual };

function active() {
  const mode = config.paymentMode;
  if (mode === 'chapa') return chapa;
  // 'telebirr' direct merchant integration can be added here once credentials are available.
  return manual;
}

function onlineEnabled() {
  const gw = active();
  return gw.name !== 'manual' && gw.enabled();
}

module.exports = { active, onlineEnabled, GATEWAYS };
