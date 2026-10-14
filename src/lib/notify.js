const config = require('../config');

function enabled() {
  return Boolean(config.telegram.botToken && config.telegram.chatId);
}

async function send(text) {
  if (!enabled()) return false;
  const url = `https://api.telegram.org/bot${config.telegram.botToken}/sendMessage`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: config.telegram.chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    }),
  });
  return res.ok;
}

// Fire-and-forget: never let a notification failure affect the request.
function notifyAdmin(text) {
  if (!enabled()) return;
  send(text).catch((err) => {
    console.error('Telegram notification failed:', err.message);
  });
}

module.exports = { notifyAdmin, enabled };
