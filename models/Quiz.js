const mongoose = require('mongoose');

/**
 * Question Schema
 * 
 * Stores individual quiz questions for different countries.
 * Each document is a single question with multiple choice options.
 * 
 * Example document:
 * {
 *   "country": "japan",
 *   "text": "When is Shogatsu celebrated?",
 *   "answer": "A",
 *   "options": {
 *     "A": "January 1",
 *     "B": "March 1",
 *     "C": "July 1",
 *     "D": "December 31"
 *   }
 * }
 */

const questionSchema = new mongoose.Schema({
  country: {
    type: String,
    required: true,
    index: true,
  },
  text: {
    type: String,
    required: true,
  },
  options: {
    A: { type: String, required: true },
    B: { type: String, required: true },
    C: { type: String, required: true },
    D: { type: String, required: true },
  },
  answer: {
    type: String,
    required: true,
    enum: ['A', 'B', 'C', 'D'],
  },
});

// Index for efficient country queries
questionSchema.index({ country: 1 });

module.exports = mongoose.model('Question', questionSchema, 'questions');
