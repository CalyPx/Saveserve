const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Order = require('../models/Order');
const Listing = require('../models/Listing');

// POST /api/orders
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'vendor') return res.status(403).json({ message: 'Only vendors can place orders' });
    const { listingId, quantity } = req.body;
    const listing = await Listing.findById(listingId).populate('farmer');
    if (!listing || listing.status !== 'available') return res.status(400).json({ message: 'Listing not available' });

    const totalAmount  = quantity * listing.pricePerKg;
    const depositAmount = Math.round(totalAmount * 0.20);

    const order = await Order.create({
      listing:    listingId,
      farmer:     listing.farmer._id,
      vendor:     req.user.id,
      quantity,
      agreedPrice:  listing.pricePerKg,
      totalAmount,
      depositAmount,
      status: 'pending'
    });

    await Listing.findByIdAndUpdate(listingId, { status: 'ordered' });
    req.app.get('io').emit('new_order', { orderId: order._id, farmerPhone: listing.farmer.phone, crop: listing.crop, quantity });
    res.status(201).json(order);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/orders/my
router.get('/my', auth, async (req, res) => {
  try {
    const filter = req.user.role === 'farmer' ? { farmer: req.user.id } : { vendor: req.user.id };
    const orders = await Order.find(filter)
      .populate('listing', 'crop cropPhoto quantity pricePerKg district')
      .populate('farmer', 'name phone district')
      .populate('vendor', 'name phone district')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PATCH /api/orders/:id
router.patch('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    if (req.body.status === 'completed') {
      await Listing.findByIdAndUpdate(order.listing, { status: 'completed' });
      req.app.get('io').emit('order_completed', { orderId: order._id });
    }
    if (req.body.status === 'deposit_paid') {
      // Notify farmer via socket that deposit received — vendor is committed
      req.app.get('io').emit('deposit_paid', { orderId: order._id, farmerId: order.farmer });
    }
    res.json(order);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
