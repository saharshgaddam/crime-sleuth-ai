
const express = require('express');
const router = express.Router();
const axios = require('axios');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect, authorize } = require('../middleware/auth');

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = './uploads/temp';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage: storage });

// ML server URL
const ML_SERVER_URL = process.env.ML_SERVER_URL || 'http://localhost:8000';

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    const response = await axios.get(`${ML_SERVER_URL}/health`, { timeout: 5000 });
    res.status(200).json({ status: 'success', message: 'ML service is available' });
  } catch (error) {
    console.error('ML service health check failed:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'ML service is unavailable',
      error: error.message
    });
  }
});

// Proxy route for image summary generation
router.post('/generate-summary', protect, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'No image file provided' });
    }

    const formData = new FormData();
    formData.append('case_id', req.body.case_id);
    formData.append('image_id', req.body.image_id);
    formData.append('image', fs.createReadStream(req.file.path));

    const response = await axios.post(`${ML_SERVER_URL}/generate-summary`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 60000 // 60 second timeout
    });

    // Clean up the temporary file
    fs.unlinkSync(req.file.path);

    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error proxying to ML service:', error);
    
    // Clean up the temporary file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to process the image with ML service',
      error: error.message
    });
  }
});

// Proxy route for case report generation
router.post('/generate-case-report', protect, async (req, res) => {
  try {
    const response = await axios.post(`${ML_SERVER_URL}/generate-case-report`, {
      case_id: req.body.case_id
    }, {
      timeout: 60000 // 60 second timeout
    });

    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error proxying to ML service:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate case report with ML service',
      error: error.message
    });
  }
});

module.exports = router;
