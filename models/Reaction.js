const mongoose = require('mongoose');

/**
 * Reaction Schema
 * 
 * Stores user reactions to funfacts shown in the country menu on the dashboard.
 * Each reaction is tied to a specific country's funfact and user.
 * 
 * Example document:
 * {
 *   "countrySlug": "japan",
 *   "funfactId": "japan-funfact-0",
 *   "userId": "507f1f77bcf86cd799439011",
 *   "reactionType": "😍",
 *   "createdAt": "2024-12-27T10:00:00.000Z"
 * }
 */

const reactionSchema = new mongoose.Schema({
  countrySlug: {
    type: String,
    required: true,
    index: true,
  },
  funfactId: {
    type: String,
    required: true,
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  reactionType: {
    type: String,
    required: true,
    enum: ['😍', '😮', '🤯', '😂', '❤️'], // Limited set of suitable emojis
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

// Compound index for efficient queries
reactionSchema.index({ countrySlug: 1, funfactId: 1 });
reactionSchema.index({ funfactId: 1, reactionType: 1 });

// Ensure a user can only have one reaction type per funfact
reactionSchema.index({ funfactId: 1, userId: 1 }, { unique: true });

// Virtual to populate user info
reactionSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
});

// Enable virtuals in JSON output
reactionSchema.set('toJSON', { virtuals: true });
reactionSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Reaction', reactionSchema);
