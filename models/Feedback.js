const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // Question 1: First Impressions
  firstImpression: {
    type: String,
    enum: ['learning', 'planning', 'games', 'not-sure', 'other'],
    required: true,
  },
  firstImpressionOther: {
    type: String,
    maxlength: 200,
  },
  // Question 2: How Easy Was It? (1-5)
  easeOfUse: {
    type: Number,
    min: 1,
    max: 5,
    required: true,
  },
  // Question 3: Did Anything Break?
  issues: [{
    type: String,
    enum: ['none', 'slow', 'loading', 'sound', 'button', 'other'],
  }],
  issuesOther: {
    type: String,
    maxlength: 200,
  },
  // Question 4: Would You Share It? (1-5)
  recommendation: {
    type: Number,
    min: 1,
    max: 5,
    required: true,
  },
  // Question 5: Any Other Thoughts?
  additionalFeedback: {
    type: String,
    maxlength: 1000,
  },
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now,
  },
  userAgent: {
    type: String,
  },
});

// Prevent duplicate feedback from same user
feedbackSchema.index({ userId: 1 }, { unique: true });

module.exports = mongoose.model('Feedback', feedbackSchema);
