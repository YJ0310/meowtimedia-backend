const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema({
  suggestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  candidateName: {
    type: String,
    required: true,
  },
  candidateEmail: {
    type: String,
    required: true,
  },
  reason: {
    type: String,
    required: true,
  },
  suggestedRole: {
    type: String,
    enum: ['admin', 'moderator'], // Just examples
    default: 'admin',
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Candidate', candidateSchema);
