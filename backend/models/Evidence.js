
const mongoose = require('mongoose');

const EvidenceSchema = new mongoose.Schema({
  evidenceId: {
    type: String,
    required: [true, 'Please add an evidence ID'],
    unique: true,
    trim: true
  },
  case: {
    type: mongoose.Schema.ObjectId,
    ref: 'Case',
    required: true
  },
  type: {
    type: String,
    enum: ['image', 'document', 'audio', 'video', 'physical', 'digital', 'other'],
    required: [true, 'Please specify evidence type']
  },
  title: {
    type: String,
    required: [true, 'Please add a title']
  },
  description: {
    type: String
  },
  fileUrl: {
    type: String
  },
  fileType: {
    type: String
  },
  fileSize: {
    type: Number
  },
  metadata: {
    type: Object
  },
  location: {
    type: String
  },
  collectedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  collectionDate: {
    type: Date,
    default: Date.now
  },
  chain: [{
    handledBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    action: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    notes: String
  }],
  tags: [String],
  analysisResults: [{
    type: {
      type: String
    },
    result: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    analyst: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    confidence: Number,
    notes: String
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Evidence', EvidenceSchema);
