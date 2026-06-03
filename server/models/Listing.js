const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema({
  farmer:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  crop:           { type: String, required: true },
  cropPhoto:      { type: String },
  unit:           { type: String, enum: ['kg', 'quintal'], default: 'kg' },
  quantity:       { type: Number, required: true },     // always stored in kg internally
  originalQty:    { type: Number },                     // original quantity for reference
  pricePerKg:     { type: Number, required: true },     // always Rs per kg internally
  displayPrice:   { type: Number },                     // price as farmer entered (per kg or per quintal)
  harvestDate:    { type: Date, required: true },
  district:       { type: String, required: true },
  location:       { lat: { type: Number }, lng: { type: Number } },
  description:    { type: String },
  status: {
    type: String,
    enum: ['available', 'partially_sold', 'completed', 'expired'],
    default: 'available'
  },
  expiresAt:      { type: Date },                        // auto-calculated from harvestDate + shelf life
}, { timestamps: true });

// Index for quick available listing queries
listingSchema.index({ status: 1, crop: 1 });

module.exports = mongoose.model('Listing', listingSchema);
