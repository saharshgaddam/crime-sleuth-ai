
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const passport = require('passport');
const session = require('express-session');
const axios = require('axios');
const authRoutes = require('./routes/auth');
const caseRoutes = require('./routes/cases');
const userRoutes = require('./routes/users');
const evidenceRoutes = require('./routes/evidence');
const fileUpload = require('express-fileupload');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const FLASK_API_URL = process.env.FLASK_API_URL || 'https://crimesleuth-ml-api.onrender.com';

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(fileUpload()); // Add file upload middleware

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

// ML Model Proxy - Forward requests to Flask API
app.post('/api/ml/generate-summary', async (req, res) => {
  try {
    console.log('Proxying request to ML API for summary generation');
    
    // Create FormData for the request
    const formData = new FormData();
    
    // Add case_id and image_id to formData
    if (req.body.case_id) {
      formData.append('case_id', req.body.case_id);
    }
    
    if (req.body.image_id) {
      formData.append('image_id', req.body.image_id);
    }
    
    // Handle file if present
    if (req.files && req.files.image) {
      const imageFile = req.files.image;
      formData.append('image', imageFile.data, { 
        filename: imageFile.name,
        contentType: imageFile.mimetype
      });
    }
    
    // Call the Flask API
    console.log('Calling Flask API at', `${FLASK_API_URL}/generate-summary`);
    const response = await axios.post(
      `${FLASK_API_URL}/generate-summary`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000 // 30 second timeout
      }
    );
    
    console.log('Flask API response:', response.data);
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error proxying to ML API:', error);
    res.status(500).json({ 
      error: 'Failed to connect to ML service',
      details: error.message
    });
  }
});

// ML Model Proxy - Forward case report requests to Flask API
app.post('/api/ml/generate-case-report', async (req, res) => {
  try {
    console.log('Proxying request to ML API for case report generation');
    const response = await axios.post(
      `${FLASK_API_URL}/generate-case-report`,
      req.body,
      { timeout: 30000 } // 30 second timeout
    );
    
    console.log('ML API Response for case report:', response.data);
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error proxying to ML API:', error);
    res.status(500).json({ 
      error: 'Failed to connect to ML service',
      details: error.message
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

// Health check endpoint for ML API
app.get('/api/ml/health', async (req, res) => {
  try {
    const response = await axios.get(`${FLASK_API_URL}/health`, { timeout: 5000 });
    res.status(200).json({ status: 'ML service is connected', details: response.data });
  } catch (error) {
    res.status(503).json({ 
      status: 'ML service is unreachable', 
      error: error.message,
      details: 'Please ensure your Flask API is running at ' + FLASK_API_URL
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
