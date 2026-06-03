const express  = require('express');
const router   = express.Router();
const auth     = require('../middleware/auth');
const Listing  = require('../models/Listing');
const { getShelfLife } = require('../services/kalimati');

// GET /api/listings — vendors browse (available + partially_sold)
router.get('/', async (req, res) => {
  try {
    const { crop, district } = req.query;
    const filter = { status: { $in: ['available','partially_sold'] }, quantity: { $gt: 0 } };
    if (crop)     filter.crop = new RegExp(crop, 'i');
    if (district) filter.district = district;
    const listings = await Listing.find(filter)
      .populate('farmer', 'name phone district')
      .sort({ createdAt: -1 });
    res.json(listings);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/listings/my
router.get('/my', auth, async (req, res) => {
  try {
    const listings = await Listing.find({ farmer: req.user.id }).sort({ createdAt: -1 });
    res.json(listings);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/listings
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'farmer') return res.status(403).json({ message: 'Only farmers can post listings' });

    const { crop, cropPhoto, unit, quantity, pricePerKg, displayPrice,
            harvestDate, district, location, description, grade } = req.body;

    // Calculate expiry = harvestDate + shelfLife days
    const shelfDays = getShelfLife(crop);
    const harvest   = harvestDate ? new Date(harvestDate) : new Date();
    const expiresAt = new Date(harvest.getTime() + shelfDays * 86400000);

    // Convert quintal to kg if needed (1 quintal = 100 kg)
    const qtyKg = unit === 'quintal' ? quantity * 100 : quantity;
    const priceKg = unit === 'quintal' ? pricePerKg / 100 : pricePerKg;

    const listing = await Listing.create({
      farmer: req.user.id, crop, cropPhoto, unit,
      quantity: qtyKg, originalQty: qtyKg,
      pricePerKg: priceKg, displayPrice: displayPrice || pricePerKg,
      harvestDate: harvest, expiresAt, district, location, description, grade: grade || 'B'
    });

    req.app.get('io').emit('new_listing', listing);
    res.status(201).json(listing);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/listings/:id — single listing detail
router.get('/:id', async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id).populate('farmer','name phone district');
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    res.json(listing);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PATCH /api/listings/:id
router.patch('/:id', auth, async (req, res) => {
  try {
    const listing = await Listing.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(listing);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// DELETE /api/listings/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    await Listing.findByIdAndDelete(req.params.id);
    res.json({ message: 'Listing deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
