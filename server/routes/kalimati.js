const express = require('express');
const router  = express.Router();
const { getPriceRange, getShelfLife, PRICE_DATA } = require('../services/kalimati');

// GET /api/kalimati/all — return all crop rates at once
router.get('/all', (req, res) => {
  const result = {};
  const crops = Object.keys(PRICE_DATA || {});
  crops.forEach(crop => {
    const range = getPriceRange(crop);
    if (range) result[crop] = { available: true, ...range, shelfLife: getShelfLife(crop) };
  });
  res.json(result);
});

// GET /api/kalimati/:crop
router.get('/:crop', (req, res) => {
  const range = getPriceRange(req.params.crop);
  const shelf = getShelfLife(req.params.crop);
  if (!range) return res.json({ available: false, shelfLife: shelf });
  res.json({ available: true, ...range, shelfLife: shelf });
});

module.exports = router;
