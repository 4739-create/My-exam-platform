require('dotenv').config();
const path = require('path');

const port = parseInt(process.env.PORT || '3000', 10);

const config = {
  port,
  jwtSecret: process.env.JWT_SECRET || 'change-this-secret-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  adminName: process.env.ADMIN_NAME || 'Demeke Biyazen',
  adminPassword: process.env.ADMIN_PASSWORD || 'demeke0929@',
  telebirrAccount: process.env.TELEBIRR_ACCOUNT || '0929853878',
  dbPath: process.env.DB_PATH || path.join(__dirname, '..', 'data', 'app.db'),
  isProduction: process.env.NODE_ENV === 'production',

  // 'manual'   -> student transfers to Telebirr account and admin approves
  // 'chapa'    -> automatic verification through Chapa (supports Telebirr, cards, wallets)
  // 'telebirr' -> direct Telebirr Merchant API (requires merchant credentials)
  paymentMode: (process.env.PAYMENT_MODE || 'manual').toLowerCase(),

  // Public base URL used for payment return/callback URLs.
  appBaseUrl: (process.env.APP_BASE_URL || `http://localhost:${port}`).replace(/\/+$/, ''),

  chapa: {
    secretKey: process.env.CHAPA_SECRET_KEY || '',
    webhookSecret: process.env.CHAPA_WEBHOOK_SECRET || '',
    baseUrl: process.env.CHAPA_BASE_URL || 'https://api.chapa.co/v1',
  },

  telebirr: {
    appId: process.env.TELEBIRR_APP_ID || '',
    appKey: process.env.TELEBIRR_APP_KEY || '',
    publicKey: process.env.TELEBIRR_PUBLIC_KEY || '',
    merchantCode: process.env.TELEBIRR_MERCHANT_CODE || '',
    baseUrl: process.env.TELEBIRR_BASE_URL || 'https://app.ethiotelecom.et:9002',
  },

  // Optional Telegram alerts so the admin is notified without watching the site.
  // Leave TELEGRAM_BOT_TOKEN empty to disable notifications.
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN || '',
    chatId: process.env.TELEGRAM_CHAT_ID || '',
  },
};

module.exports = config;
