const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  listing:      { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
  farmer:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  vendor:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  quantity:     { type: Number, required: true },
  agreedPrice:  { type: Number, required: true },
  totalAmount:  { type: Number, required: true },
  depositAmount:{ type: Number, default: 0 },
  status: {
    type: String,
    enum: ['pending','confirmed','deposit_paid','ready','completed','cancelled'],
    default: 'pending'
  },
  note: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
