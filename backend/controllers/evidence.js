
const Evidence = require('../models/Evidence');
const Case = require('../models/Case');
const path = require('path');
const fs = require('fs');

// @desc      Get evidence for a case
// @route     GET /api/cases/:caseId/evidence
// @access    Private
exports.getEvidence = async (req, res) => {
  try {
    let query;

    if (req.params.caseId) {
      query = Evidence.find({ case: req.params.caseId });
    } else {
      query = Evidence.find();
    }

    // Add pagination, filtering, etc. as needed
    query = query.populate({
      path: 'collectedBy',
      select: 'name'
    });

    const evidence = await query;

    res.status(200).json({
      success: true,
      count: evidence.length,
      data: evidence
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc      Get single evidence item
// @route     GET /api/evidence/:id
// @access    Private
exports.getEvidenceItem = async (req, res) => {
  try {
    const evidence = await Evidence.findById(req.params.id).populate([
      {
        path: 'case',
        select: 'caseNumber title'
      },
      {
        path: 'collectedBy',
        select: 'name'
      },
      {
        path: 'chain.handledBy',
        select: 'name'
      },
      {
        path: 'analysisResults.analyst',
        select: 'name'
      }
    ]);

    if (!evidence) {
      return res.status(404).json({ success: false, error: `Evidence not found with id of ${req.params.id}` });
    }

    res.status(200).json({ success: true, data: evidence });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc      Add evidence item
// @route     POST /api/cases/:caseId/evidence
// @access    Private
exports.addEvidenceItem = async (req, res) => {
  try {
    req.body.case = req.params.caseId;
    req.body.collectedBy = req.user.id;

    const caseData = await Case.findById(req.params.caseId);

    if (!caseData) {
      return res.status(404).json({ success: false, error: `Case not found with id of ${req.params.caseId}` });
    }

    // Create the evidence item
    const evidence = await Evidence.create(req.body);

    // Update the case's evidence count
    await Case.findByIdAndUpdate(req.params.caseId, { 
      $inc: { evidenceCount: 1 } 
    });

    res.status(201).json({ success: true, data: evidence });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc      Update evidence item
// @route     PUT /api/evidence/:id
// @access    Private
exports.updateEvidenceItem = async (req, res) => {
  try {
    let evidence = await Evidence.findById(req.params.id);

    if (!evidence) {
      return res.status(404).json({ success: false, error: `Evidence not found with id of ${req.params.id}` });
    }

    // Add to chain of custody
    if (!req.body.chain) {
      req.body.chain = evidence.chain || [];
    }
    
    req.body.chain.push({
      handledBy: req.user.id,
      action: 'updated',
      notes: req.body.notes || 'Evidence details updated'
    });

    // Update evidence
    evidence = await Evidence.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({ success: true, data: evidence });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc      Delete evidence item
// @route     DELETE /api/evidence/:id
// @access    Private
exports.deleteEvidenceItem = async (req, res) => {
  try {
    const evidence = await Evidence.findById(req.params.id);

    if (!evidence) {
      return res.status(404).json({ success: false, error: `Evidence not found with id of ${req.params.id}` });
    }

    // Check if user has permission
    if (req.user.role !== 'admin' && req.user.role !== 'supervisor') {
      return res.status(403).json({
        success: false,
        error: 'User is not authorized to delete evidence'
      });
    }

    // If there is a file associated with this evidence, delete it
    if (evidence.fileUrl) {
      const filePath = path.join(__dirname, '../public/uploads', evidence.fileUrl.split('/').pop());
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Update the case's evidence count
    await Case.findByIdAndUpdate(evidence.case, { 
      $inc: { evidenceCount: -1 } 
    });

    await evidence.remove();

    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc      Upload evidence file
// @route     POST /api/evidence/:id/upload
// @access    Private
exports.uploadEvidenceFile = async (req, res) => {
  try {
    const evidence = await Evidence.findById(req.params.id);

    if (!evidence) {
      return res.status(404).json({ success: false, error: `Evidence not found with id of ${req.params.id}` });
    }

    // In a real application, you would process file uploads here
    // This is a simplified placeholder
    res.status(200).json({
      success: true,
      data: {
        message: 'File upload endpoint (to be implemented with multer)'
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc      Analyze evidence
// @route     POST /api/evidence/:id/analyze
// @access    Private
exports.analyzeEvidence = async (req, res) => {
  try {
    let evidence = await Evidence.findById(req.params.id);

    if (!evidence) {
      return res.status(404).json({ success: false, error: `Evidence not found with id of ${req.params.id}` });
    }

    // In a real app, we would connect to AI analysis services
    // For now, we'll just add a placeholder result
    const newAnalysis = {
      type: req.body.analysisType || 'basic',
      result: req.body.result || 'Analysis pending',
      analyst: req.user.id,
      confidence: req.body.confidence || 0.8,
      notes: req.body.notes || 'Analysis requested'
    };

    // Update evidence with new analysis
    evidence.analysisResults = [...(evidence.analysisResults || []), newAnalysis];
    
    // Add to chain of custody
    evidence.chain.push({
      handledBy: req.user.id,
      action: 'analyzed',
      notes: `Analysis of type ${newAnalysis.type} conducted`
    });

    await evidence.save();

    res.status(200).json({ success: true, data: evidence });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
