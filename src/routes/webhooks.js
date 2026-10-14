const express = require('express');
const db = require('../db');
const chapa = require('../lib/gateways/chapa');
const { verifyAndSettle, findPaymentByRef } = require('../lib/paymentService');

const router = express.Router();

// Chapa posts here after a payment attempt. We re-verify with the API before unlocking.
router.post('/chapa', async (req, res) => {
  const rawBody = req.rawBody ? req.rawBody.toString('utf8') : '';

  if (!chapa.verifySignature(rawBody, req.headers)) {
    return res.status(401).json({ error: 'Invalid webhook signature.' });
  }

  const body = req.body || {};
  const data = body.data || body;
  const txRef = body.tx_ref || body.trx_ref || data.tx_ref || data.trx_ref;

  if (!txRef) {
    return res.status(200).json({ received: true, ignored: 'no tx_ref' });
  }

  const payment = findPaymentByRef(txRef);
  if (!payment) {
    return res.status(200).json({ received: true, ignored: 'unknown reference' });
  }

  if (payment.status !== 'approved' && payment.provider === 'chapa') {
    try {
      await verifyAndSettle(payment, chapa);
    } catch {
      // Acknowledge the webhook; the student's return page will retry verification.
    }
  }

  return res.status(200).json({ received: true });
});

module.exports = router;
