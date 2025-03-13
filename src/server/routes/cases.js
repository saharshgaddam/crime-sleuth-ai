
const express = require('express');
const router = express.Router();
const Case = require('../models/Case');
const auth = require('../middleware/auth');

// Get all cases for a user
router.get('/', auth, async (req, res) => {
  try {
    const cases = await Case.find({ userId: req.user.id });
    res.json(cases);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new case
router.post('/', auth, async (req, res) => {
  try {
    const newCase = new Case({
      title: req.body.title,
      userId: req.user.id,
      status: 'Active',
      images: []
    });

    const savedCase = await newCase.save();
    res.json(savedCase);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add image to case
router.post('/:id/images', auth, async (req, res) => {
  try {
    const caseItem = await Case.findById(req.params.id);
    if (!caseItem) return res.status(404).json({ message: 'Case not found' });
    
    if (caseItem.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    caseItem.images.push(req.body.imageUrl);
    await caseItem.save();
    res.json(caseItem);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
