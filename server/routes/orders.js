const express  = require('express');
const router   = express.Router();
const auth     = require('../middleware/auth');
const Order    = require('../models/Order');
const Listing  = require('../models/Listing');

// POST /api/orders — place order, subtract quantity from listing
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'vendor') return res.status(403).json({ message: 'Only vendors can place orders' });

    const { listingId, quantity } = req.body;
    const listing = await Listing.findById(listingId).populate('farmer');

    if (!listing || !['available','partially_sold'].includes(listing.status))
      return res.status(400).json({ message: 'Listing not available' });

    if (quantity > listing.quantity)
      return res.status(400).json({ message: `Only ${listing.quantity} kg available` });

    const totalAmount   = quantity * listing.pricePerKg;
    const depositAmount = totalAmount; // 100% upfront

    // Subtract quantity from listing
    const newQty = listing.quantity - quantity;
    const newStatus = newQty <= 0 ? 'completed' : 'partially_sold';
    await Listing.findByIdAndUpdate(listingId, { quantity: newQty, status: newStatus });

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

    // Real-time notification
    req.app.get('io').emit('new_order', {
      orderId:     order._id,
      farmerPhone: listing.farmer.phone,
      crop:        listing.crop,
      quantity,
      remaining:   newQty,
    });

    res.status(201).json(order);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/orders/my
router.get('/my', auth, async (req, res) => {
  try {
    const filter = req.user.role === 'farmer' ? { farmer: req.user.id } : { vendor: req.user.id };
    const orders = await Order.find(filter)
      .populate('listing', 'crop cropPhoto quantity pricePerKg district unit harvestDate')
      .populate('farmer', 'name phone district')
      .populate('vendor',  'name phone district')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PATCH /api/orders/:id
router.patch('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    if (req.body.status === 'completed')
      req.app.get('io').emit('order_completed', { orderId: order._id });
    if (req.body.status === 'deposit_paid')
      req.app.get('io').emit('deposit_paid', { orderId: order._id, farmerId: order.farmer });
    res.json(order);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
