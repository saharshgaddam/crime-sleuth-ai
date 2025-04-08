
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const passport = require('passport');
const session = require('express-session');
const authRoutes = require('./routes/auth');
const caseRoutes = require('./routes/cases');
const userRoutes = require('./routes/users');
const evidenceRoutes = require('./routes/evidence');
const mlRoutes = require('./routes/ml');
const axios = require('axios');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'crimesleuth-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  }
}));

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/users', userRoutes);
app.use('/api/evidence', evidenceRoutes);
app.use('/api/ml', mlRoutes);

// ML Service health check
const ML_SERVER_URL = process.env.ML_SERVER_URL || 'http://localhost:8000';
app.get('/api/ml-health', async (req, res) => {
  try {
    await axios.get(`${ML_SERVER_URL}/health`, { timeout: 5000 });
    res.status(200).json({ status: 'success', message: 'ML service is available' });
  } catch (error) {
    console.error('ML service health check failed:', error);
    res.status(503).json({ 
      status: 'error', 
      message: 'ML service is unavailable',
      error: error.message
    });
  }
});

// Basic route for testing
app.get('/', (req, res) => {
  res.send('CrimeSleuth AI API is running');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
