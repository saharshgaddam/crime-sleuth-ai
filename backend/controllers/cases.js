
const Case = require('../models/Case');

// @desc      Get all cases
// @route     GET /api/cases
// @access    Private
exports.getCases = async (req, res) => {
  try {
    let query;

    // Copy req.query
    const reqQuery = { ...req.query };

    // Fields to exclude
    const removeFields = ['select', 'sort', 'page', 'limit'];

    // Remove fields from reqQuery
    removeFields.forEach(param => delete reqQuery[param]);

    // Create query string
    let queryStr = JSON.stringify(reqQuery);

    // Create operators ($gt, $gte, etc)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    // Finding resource
    query = Case.find(JSON.parse(queryStr));

    // Select fields
    if (req.query.select) {
      const fields = req.query.select.split(',').join(' ');
      query = query.select(fields);
    }

    // Sort
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-dateOpened');
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Case.countDocuments();

    query = query.skip(startIndex).limit(limit);

    // Executing query
    const cases = await query;

    // Pagination result
    const pagination = {};

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }

    res.status(200).json({
      success: true,
      count: cases.length,
      pagination,
      data: cases
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc      Get single case
// @route     GET /api/cases/:id
// @access    Private
exports.getCase = async (req, res) => {
  try {
    const caseData = await Case.findById(req.params.id).populate({
      path: 'evidence',
      select: 'evidenceId title type fileUrl collectionDate'
    });

    if (!caseData) {
      return res.status(404).json({ success: false, error: `Case not found with id of ${req.params.id}` });
    }

    res.status(200).json({ success: true, data: caseData });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc      Create new case
// @route     POST /api/cases
// @access    Private
exports.createCase = async (req, res) => {
  try {
    // Add user to req.body
    req.body.createdBy = req.user.id;

    const caseData = await Case.create(req.body);

    res.status(201).json({ success: true, data: caseData });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc      Update case
// @route     PUT /api/cases/:id
// @access    Private
exports.updateCase = async (req, res) => {
  try {
    let caseData = await Case.findById(req.params.id);

    if (!caseData) {
      return res.status(404).json({ success: false, error: `Case not found with id of ${req.params.id}` });
    }

    // Make sure user is case creator or admin
    if (
      caseData.createdBy.toString() !== req.user.id &&
      req.user.role !== 'admin' &&
      req.user.role !== 'supervisor'
    ) {
      return res
        .status(401)
        .json({ success: false, error: `User ${req.user.id} is not authorized to update this case` });
    }

    caseData = await Case.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({ success: true, data: caseData });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc      Delete case
// @route     DELETE /api/cases/:id
// @access    Private
exports.deleteCase = async (req, res) => {
  try {
    const caseData = await Case.findById(req.params.id);

    if (!caseData) {
      return res.status(404).json({ success: false, error: `Case not found with id of ${req.params.id}` });
    }

    // Make sure user is case creator or admin
    if (
      caseData.createdBy.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return res
        .status(401)
        .json({ success: false, error: `User ${req.user.id} is not authorized to delete this case` });
    }

    await caseData.remove();

    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
