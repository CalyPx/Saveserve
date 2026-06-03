const express  = require('express');
const router   = express.Router();
const { getShelfLife } = require('../services/kalimati');

const GEMINI_KEY = 'AIzaSyBAw9ggyLYum8fm-YqvoSN4qCqqBMccyhQ';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;

function estimateDeliveryHours(distanceKm, fromDistrict) {
  const HILLY = ['Dhading','Nuwakot','Sindhupalchok','Kavrepalanchok','Gorkha','Lamjung','Syangja','Palpa','Gulmi'];
  const speed = HILLY.includes(fromDistrict) ? 30 : 48;
  return Math.ceil((distanceKm || 50) / speed) + 12;
}

// POST /api/ai/feasibility
router.post('/feasibility', async (req, res) => {
  try {
    const { crop, harvestDate, distanceKm, fromDistrict, quantity } = req.body;
    const shelfLifeDays  = getShelfLife(crop);
    const harvestDaysAgo = Math.floor((Date.now() - new Date(harvestDate)) / 86400000);
    const deliveryHours  = estimateDeliveryHours(distanceKm, fromDistrict);
    const deliveryDays   = deliveryHours / 24;
    const daysRemaining  = shelfLifeDays - harvestDaysAgo - deliveryDays;

    // Try Gemini first
    try {
      const prompt = `You are an agricultural logistics expert for Nepal. Analyze this produce transport feasibility:
Crop: ${crop}, Harvest: ${harvestDaysAgo} days ago, Shelf life: ${shelfLifeDays} days, Distance: ${distanceKm || 50}km, Delivery: ${deliveryHours}h, Days left after delivery: ${daysRemaining.toFixed(1)}
Return JSON only, no markdown:
{"status":"feasible"|"risky"|"not_feasible","vendorMessage":"2 sentences max","farmerMessage":"2 sentences in simple Nepali","daysRemaining":"${daysRemaining.toFixed(1)}"}`;

      const gemRes = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents:[{parts:[{text:prompt}]}], generationConfig:{temperature:0.2,maxOutputTokens:250} }),
        signal: AbortSignal.timeout(8000)
      });
      const gemData = await gemRes.json();
      let raw = gemData.candidates?.[0]?.content?.parts?.[0]?.text || '';
      raw = raw.replace(/```json|```/g,'').trim();
      const result = JSON.parse(raw);
      return res.json({ ...result, deliveryHours, shelfLifeDays, harvestDaysAgo });
    } catch (_) { /* fall through to rule-based */ }

    // Rule-based fallback
    let status = daysRemaining >= 2 ? 'feasible' : daysRemaining >= 1 ? 'risky' : 'not_feasible';
    res.json({
      status,
      vendorMessage: status === 'feasible'
        ? `${crop} will arrive fresh with ~${daysRemaining.toFixed(1)} days shelf life remaining.`
        : `Warning: ${crop} may not stay fresh during transport. Only ${daysRemaining.toFixed(1)} days remaining after estimated delivery.`,
      farmerMessage: status === 'not_feasible'
        ? `तपाईंको ${crop} ढुवानीमा खराब हुन सक्छ। नजिकको बजारमा बेच्नु राम्रो हुन्छ।`
        : `तपाईंको ${crop} राम्रोसँग पुग्छ।`,
      daysRemaining: daysRemaining.toFixed(1),
      deliveryHours, shelfLifeDays, harvestDaysAgo,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/ai/suggest-price
router.post('/suggest-price', async (req, res) => {
  const { kalimatiAvg, kalimatiMin } = req.body;
  if (!kalimatiAvg) return res.json({ suggested: null });
  res.json({
    suggested:   Math.round(kalimatiAvg * 0.75),
    absoluteMax: Math.round(kalimatiAvg * 1.75),
  });
});

module.exports = router;
