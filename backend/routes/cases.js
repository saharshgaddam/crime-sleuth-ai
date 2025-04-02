
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getCases,
  getCase,
  createCase,
  updateCase,
  deleteCase
} = require('../controllers/cases');

// Include evidence routes
const evidenceRouter = require('./evidence');
router.use('/:caseId/evidence', evidenceRouter);

router
  .route('/')
  .get(protect, getCases)
  .post(protect, authorize('investigator', 'supervisor', 'admin'), createCase);

router
  .route('/:id')
  .get(protect, getCase)
  .put(protect, authorize('investigator', 'supervisor', 'admin'), updateCase)
  .delete(protect, authorize('supervisor', 'admin'), deleteCase);

module.exports = router;
