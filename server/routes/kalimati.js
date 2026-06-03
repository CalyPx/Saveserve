const express = require('express');
const router  = express.Router();
const { getPriceRange, getShelfLife } = require('../services/kalimati');

// GET /api/kalimati/:crop
router.get('/:crop', (req, res) => {
  const range = getPriceRange(req.params.crop);
  const shelf = getShelfLife(req.params.crop);
  if (!range) return res.json({ available: false, shelfLife: shelf });
  res.json({ available: true, ...range, shelfLife: shelf });
});

module.exports = router;
