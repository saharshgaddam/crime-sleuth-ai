
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
    console.error('Error fetching cases:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a single case by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const caseItem = await Case.findById(req.params.id);
    
    if (!caseItem) {
      return res.status(404).json({ message: 'Case not found' });
    }
    
    // Make sure user owns the case
    if (caseItem.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to access this case' });
    }
    
    res.json(caseItem);
  } catch (error) {
    console.error('Error fetching case:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new case
router.post('/', auth, async (req, res) => {
  try {
    const newCase = new Case({
      title: req.body.title || `New Case #${Date.now()}`,
      userId: req.user.id,
      status: req.body.status || 'New',
      images: []
    });

    const savedCase = await newCase.save();
    res.json(savedCase);
  } catch (error) {
    console.error('Error creating case:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a case
router.put('/:id', auth, async (req, res) => {
  try {
    let caseItem = await Case.findById(req.params.id);
    
    if (!caseItem) {
      return res.status(404).json({ message: 'Case not found' });
    }
    
    // Make sure user owns the case
    if (caseItem.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to update this case' });
    }
    
    const updatedCase = await Case.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    
    res.json(updatedCase);
  } catch (error) {
    console.error('Error updating case:', error);
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
    console.error('Error adding image:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a case
router.delete('/:id', auth, async (req, res) => {
  try {
    const caseItem = await Case.findById(req.params.id);
    
    if (!caseItem) {
      return res.status(404).json({ message: 'Case not found' });
    }
    
    // Make sure user owns the case
    if (caseItem.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to delete this case' });
    }
    
    await Case.findByIdAndRemove(req.params.id);
    
    res.json({ message: 'Case removed' });
  } catch (error) {
    console.error('Error deleting case:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
