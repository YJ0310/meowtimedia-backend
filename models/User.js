const mongoose = require('mongoose');

// Schema for country progress tracking
const countryProgressSchema = new mongoose.Schema({
  countrySlug: {
    type: String,
    required: true,
  },
  lastQuizTime: {
    type: Date,
  },
  lastQuizScore: {
    type: Number,
    default: 0,
  },
  highestScore: {
    type: Number,
    default: 0,
  },
  totalAttempts: {
    type: Number,
    default: 0,
  },
  stampCollectedAt: {
    type: Date, // null if stamp not earned yet
  },
}, { _id: false });

const userSchema = new mongoose.Schema({
  googleId: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  displayName: {
    type: String,
    required: true,
  },
  firstName: {
    type: String,
  },
  lastName: {
    type: String,
  },
  avatar: {
    type: String,
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'owner'],
    default: 'user',
  },
  adminExpiresAt: {
    type: Date,
  },
  // Future fields for user customization
  username: {
    type: String,
    unique: true,
    sparse: true, // Allows null values while maintaining uniqueness
  },
  bio: {
    type: String,
    maxlength: 500,
  },
  // User progress tracking - enhanced with country progress
  countriesProgress: [countryProgressSchema],
  // Feedback stamp tracking
  feedbackStampCollectedAt: {
    type: Date,
  },
  // Account metadata
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  lastLoginAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field on save
userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('User', userSchema);
