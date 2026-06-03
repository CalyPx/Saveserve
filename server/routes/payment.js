const express = require('express');
const router  = express.Router();
const crypto  = require('crypto');
const auth    = require('../middleware/auth');

const SECRET_KEY  = '8gBm/:&EnhH.1/q';
const PRODUCT_CODE = 'EPAYTEST';
const ESEWA_URL   = 'https://rc-epay.esewa.com.np/api/epay/main/v2/form';

// Generate HMAC-SHA256 signature
function generateSignature(message) {
  return crypto.createHmac('sha256', SECRET_KEY).update(message).digest('base64');
}

// POST /api/payment/esewa-params
// Returns signed params for eSewa ePay v2 form submission
router.post('/esewa-params', auth, (req, res) => {
  try {
    const { amount, orderId } = req.body;
    if (!amount || !orderId) return res.status(400).json({ message: 'amount and orderId required' });

    const transaction_uuid = `KD-${orderId}-${Date.now()}`;
    const total_amount     = Number(amount);

    // Signature message must match signed_field_names order
    const message   = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${PRODUCT_CODE}`;
    const signature = generateSignature(message);

    res.json({
      amount:                   total_amount,
      tax_amount:               0,
      total_amount,
      transaction_uuid,
      product_code:             PRODUCT_CODE,
      product_service_charge:   0,
      product_delivery_charge:  0,
      signed_field_names:       'total_amount,transaction_uuid,product_code',
      signature,
      esewa_url:                ESEWA_URL,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/payment/verify  — status check after redirect back
router.get('/verify', auth, async (req, res) => {
  try {
    const { data } = req.query; // base64 encoded response from eSewa
    if (!data) return res.status(400).json({ message: 'No data' });

    const decoded = JSON.parse(Buffer.from(data, 'base64').toString('utf-8'));
    // Verify signature
    const fields  = decoded.signed_field_names.split(',');
    const message = fields.map(f => `${f}=${decoded[f]}`).join(',');
    const expected = generateSignature(message);

    if (expected !== decoded.signature) {
      return res.status(400).json({ message: 'Invalid signature — possible fraud', verified: false });
    }

    res.json({ verified: true, status: decoded.status, transaction_code: decoded.transaction_code, decoded });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
