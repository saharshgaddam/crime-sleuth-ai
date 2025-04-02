
const mongoose = require('mongoose');

const CaseSchema = new mongoose.Schema({
  caseNumber: {
    type: String,
    required: [true, 'Please add a case number'],
    unique: true,
    trim: true
  },
  title: {
    type: String,
    required: [true, 'Please add a title']
  },
  description: {
    type: String,
    required: [true, 'Please add a description']
  },
  status: {
    type: String,
    enum: ['open', 'active', 'pending', 'closed', 'archived'],
    default: 'open'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  assignedTo: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  dateOpened: {
    type: Date,
    default: Date.now
  },
  dateClosed: {
    type: Date
  },
  tags: [String],
  location: {
    type: String
  },
  evidenceCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Reverse populate with evidence
CaseSchema.virtual('evidence', {
  ref: 'Evidence',
  localField: '_id',
  foreignField: 'case',
  justOne: false
});

module.exports = mongoose.model('Case', CaseSchema);
