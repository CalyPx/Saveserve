require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User    = require('../models/User');
const Listing = require('../models/Listing');
const Order   = require('../models/Order');

const CROPS = [
  { name: 'Tomato',      emoji: '🍅', price: 35,  qty: 80  },
  { name: 'Potato',      emoji: '🥔', price: 28,  qty: 150 },
  { name: 'Cauliflower', emoji: '🥦', price: 45,  qty: 60  },
  { name: 'Onion',       emoji: '🧅', price: 30,  qty: 200 },
  { name: 'Orange',      emoji: '🍊', price: 42,  qty: 120 },
  { name: 'Carrot',      emoji: '🥕', price: 32,  qty: 90  },
];

const FARMERS = [
  { name: 'Ram Bahadur Shrestha', phone: '9801000001', district: 'Dhading',         location: { lat: 27.8774, lng: 84.8396 } },
  { name: 'Sita Tamang',          phone: '9801000002', district: 'Nuwakot',          location: { lat: 27.9654, lng: 85.1703 } },
  { name: 'Hari Prasad Gurung',   phone: '9801000003', district: 'Syangja',          location: { lat: 28.0124, lng: 83.8836 } },
  { name: 'Kali Maya Thapa',      phone: '9801000004', district: 'Sindhupalchok',    location: { lat: 27.9540, lng: 85.6882 } },
  { name: 'Bishnu Paudel',        phone: '9801000005', district: 'Kavrepalanchok',   location: { lat: 27.5769, lng: 85.5231 } },
];

const VENDORS = [
  { name: 'Kathmandu Fresh Mart',  phone: '9802000001', district: 'Kathmandu', location: { lat: 27.7172, lng: 85.3240 } },
  { name: 'Patan Vegetable Store', phone: '9802000002', district: 'Lalitpur',  location: { lat: 27.6644, lng: 85.3188 } },
  { name: 'Bhaktapur Traders',     phone: '9802000003', district: 'Bhaktapur', location: { lat: 27.6710, lng: 85.4298 } },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // Clear existing data
  await User.deleteMany({});
  await Listing.deleteMany({});
  await Order.deleteMany({});
  console.log('Cleared existing data');

  const password = await bcrypt.hash('password123', 10);

  // Create farmers
  const farmers = await User.insertMany(
    FARMERS.map(f => ({ ...f, password, role: 'farmer' }))
  );
  console.log(`Created ${farmers.length} farmers`);

  // Create vendors
  const vendors = await User.insertMany(
    VENDORS.map(v => ({ ...v, password, role: 'vendor' }))
  );
  console.log(`Created ${vendors.length} vendors`);

  // Create listings
  const listings = [];
  for (let i = 0; i < farmers.length; i++) {
    const crop = CROPS[i % CROPS.length];
    const listing = await Listing.create({
      farmer:     farmers[i]._id,
      crop:       crop.name,
      cropPhoto:  crop.emoji,
      quantity:   crop.qty,
      pricePerKg: crop.price,
      district:   farmers[i].district,
      location:   farmers[i].location,
      status:     'available'
    });
    listings.push(listing);
  }
  console.log(`Created ${listings.length} listings`);

  // Create some completed orders for impact stats
  for (let i = 0; i < 3; i++) {
    await Order.create({
      listing:     listings[i]._id,
      farmer:      listings[i].farmer,
      vendor:      vendors[i % vendors.length]._id,
      quantity:    Math.floor(listings[i].quantity / 2),
      agreedPrice: CROPS[i].price,
      totalAmount: Math.floor(listings[i].quantity / 2) * CROPS[i].price,
      status:      'completed'
    });
  }
  console.log('Created 3 completed orders for impact stats');

  console.log('\n✅ Seed complete!');
  console.log('Demo login credentials:');
  console.log('  Farmer: phone=9801000001, password=password123');
  console.log('  Vendor: phone=9802000001, password=password123');
  mongoose.disconnect();
}

seed().catch(err => { console.error(err); mongoose.disconnect(); });
