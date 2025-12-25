const mongoose = require('mongoose');

/**
 * Content Schema
 * 
 * Stores festival, food, and funfact content for each country.
 * Structure matches the meowtimedia.funfacts collection in MongoDB.
 */

const contentItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  date: {
    type: String, // e.g., "Jan 1", "Late March – Early April"
  },
  content: {
    type: String,
    required: true,
  },
  picture_url: {
    type: String,
  },
  date_created: {
    type: Date,
    default: Date.now,
  },
}, { _id: false });

const contentSchema = new mongoose.Schema({
  country: {
    type: String,
    required: true,
    index: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['festival', 'food', 'funfact'],
    index: true,
  },
  date_updated: {
    type: Date,
    default: Date.now,
  },
  contents: {
    type: [contentItemSchema],
    required: true,
  },
});

// Compound index for efficient country + type queries
contentSchema.index({ country: 1, type: 1 });

module.exports = mongoose.model('Content', contentSchema, 'funfacts');
