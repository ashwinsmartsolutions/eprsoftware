// CACHE BUSTER - Force reload of modified modules
const cacheBuster = Date.now();
console.log('[Server] Cache buster:', cacheBuster);

// Clear require cache for our route files to ensure fresh code
['./routes/production', './middleware/auth'].forEach(module => {
  const key = require.resolve(module);
  if (require.cache[key]) {
    delete require.cache[key];
    console.log('[Server] Cleared cache for:', module);
  }
});

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const { startStatusCheckJob } = require('./jobs/statusCheck');

dotenv.config();

const app = express();

// Trust proxy for rate limiter to work correctly with X-Forwarded-For header
app.set('trust proxy', 1);

// Middleware
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000'
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());

// Rate limiting - Increased limits to prevent 429 errors
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all requests
app.use(limiter);

// Health check endpoint for Render
app.get('/api/auth/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth routes - no additional rate limiting to prevent login failures
app.use('/api/auth', require('./routes/auth'));
app.use('/api/franchises', require('./routes/franchises'));
app.use('/api/shops', require('./routes/shops'));
app.use('/api/stock', require('./routes/stock'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/production', require('./routes/production'));
app.use('/api/franchise-production', require('./routes/franchiseProduction'));

const PORT = process.env.PORT || 5000;

// FORCE RELOAD - Clear any require cache issues
console.log('[Server] Starting with updated routes - v2');

// Connect to MongoDB with Atlas-compatible options
mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
})
.then(() => {
  console.log('MongoDB connected successfully');
  // Start the inactive user status check job
  startStatusCheckJob();
})
.catch((err) => console.log('MongoDB connection error:', err));

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
