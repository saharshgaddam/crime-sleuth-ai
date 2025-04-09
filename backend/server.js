
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
const axios = require('axios');
const multer = require('multer');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

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

// Create a proxy for ML API calls
const FLASK_API_URL = process.env.FLASK_API_URL || 'http://localhost:8000';

// ML API Health Check
app.get('/api/ml/health', async (req, res) => {
  try {
    const response = await axios.get(`${FLASK_API_URL}/health`, { timeout: 5000 });
    res.json({ status: 'connected', message: 'ML service is running' });
  } catch (error) {
    console.error('ML health check failed:', error.message);
    res.status(503).json({ 
      status: 'disconnected', 
      message: 'Cannot connect to ML service', 
      details: error.message 
    });
  }
});

// ML API Proxy - Generate Summary
app.post('/api/ml/generate-summary', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const formData = new FormData();
    formData.append('case_id', req.body.case_id);
    formData.append('image_id', req.body.image_id);
    
    // Create a blob from the buffer
    const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
    formData.append('image', blob, req.file.originalname);

    const response = await axios.post(`${FLASK_API_URL}/generate-summary`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000, // 30-second timeout
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error proxying to ML service:', error.message);
    res.status(500).json({ 
      error: 'Failed to generate summary', 
      details: error.message,
      hint: 'Make sure the ML service is running at ' + FLASK_API_URL
    });
  }
});

// ML API Proxy - Generate Case Report
app.post('/api/ml/generate-case-report', async (req, res) => {
  try {
    const response = await axios.post(`${FLASK_API_URL}/generate-case-report`, req.body, {
      timeout: 30000, // 30-second timeout
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error proxying to ML service:', error.message);
    res.status(500).json({ 
      error: 'Failed to generate case report', 
      details: error.message,
      hint: 'Make sure the ML service is running at ' + FLASK_API_URL
    });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/users', userRoutes);
app.use('/api/evidence', evidenceRoutes);

// Basic route for testing
app.get('/', (req, res) => {
  res.send('CrimeSleuth AI API is running');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`ML Service URL: ${FLASK_API_URL}`);
});
