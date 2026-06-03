require('dotenv').config();
const express   = require('express');
const http      = require('http');
const { Server} = require('socket.io');
const cors      = require('cors');
const cron      = require('node-cron');
const connectDB = require('./config/db');
const { fetchKalimatiPrices, getShelfLife } = require('./services/kalimati');
const Listing   = require('./models/Listing');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, { cors: { origin: 'http://localhost:5173', methods: ['GET','POST','PATCH'] } });

connectDB();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/listings', require('./routes/listings'));
app.use('/api/orders',   require('./routes/orders'));
app.use('/api/impact',   require('./routes/impact'));
app.use('/api/payment',  require('./routes/payment'));
app.use('/api/kalimati', require('./routes/kalimati'));
app.use('/api/ai',       require('./routes/ai'));

// Socket.io
io.on('connection', socket => {
  console.log('Client connected:', socket.id);
  socket.on('disconnect', () => console.log('Client disconnected'));
});
app.set('io', io);

// ─── CRON: Fetch Kalimati prices daily at 6 AM ───────────────────────────
cron.schedule('0 6 * * *', () => {
  console.log('⏰ Fetching daily Kalimati prices...');
  fetchKalimatiPrices();
});

// ─── CRON: Auto-expire old listings daily at 7 AM ───────────────────────
cron.schedule('0 7 * * *', async () => {
  try {
    const now = new Date();
    // Find all available/partially_sold listings past their expiresAt
    const expired = await Listing.find({
      status: { $in: ['available','partially_sold'] },
      expiresAt: { $lte: now }
    }).populate('farmer', 'name phone');

    for (const listing of expired) {
      await Listing.findByIdAndUpdate(listing._id, { status: 'expired' });
      // Notify farmer via socket
      io.emit('listing_expired', {
        listingId: listing._id,
        crop:      listing.crop,
        farmerPhone: listing.farmer?.phone,
        nepaliMsg: `तपाईंको ${listing.crop} को सूचीको म्याद सकियो। कृपया नयाँ सूची थप्नुहोस्।`
      });
    }
    if (expired.length) console.log(`⏰ Expired ${expired.length} stale listings`);
  } catch (err) {
    console.error('Expiry cron error:', err.message);
  }
});

// Fetch prices on startup
fetchKalimatiPrices();

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
