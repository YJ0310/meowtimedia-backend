const mongoose = require('mongoose');

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
  // User progress tracking
  countriesVisited: [{
    type: String, // country slug
  }],
  stampsCollected: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stamp',
  }],
  quizzesCompleted: [{
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz',
    },
    score: Number,
    completedAt: Date,
  }],
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
