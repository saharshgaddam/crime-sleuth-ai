
const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect, authorize } = require('../middleware/auth');
const {
  getEvidence,
  getEvidenceItem,
  addEvidenceItem,
  updateEvidenceItem,
  deleteEvidenceItem,
  uploadEvidenceFile,
  analyzeEvidence
} = require('../controllers/evidence');

router
  .route('/')
  .get(protect, getEvidence)
  .post(protect, authorize('investigator', 'analyst', 'supervisor', 'admin'), addEvidenceItem);

router
  .route('/:id')
  .get(protect, getEvidenceItem)
  .put(protect, authorize('investigator', 'analyst', 'supervisor', 'admin'), updateEvidenceItem)
  .delete(protect, authorize('supervisor', 'admin'), deleteEvidenceItem);

router
  .route('/:id/upload')
  .post(protect, authorize('investigator', 'analyst', 'supervisor', 'admin'), uploadEvidenceFile);

router
  .route('/:id/analyze')
  .post(protect, authorize('analyst', 'supervisor', 'admin'), analyzeEvidence);

module.exports = router;
