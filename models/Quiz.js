const mongoose = require('mongoose');

/**
 * Quiz Schema
 * 
 * Stores quiz data for different countries and topics.
 * Each quiz contains multiple choice questions.
 * 
 * Example document:
 * {
 *   "country": "Malaysia",
 *   "quiz_title": "Kuala Lumpur Landmarks",
 *   "difficulty": "Easy",
 *   "description": "A quick test on the most famous sites in Malaysia's capital city.",
 *   "questions": [
 *     {
 *       "id": 1,
 *       "text": "What is the name of the iconic twin skyscrapers in Kuala Lumpur?",
 *       "options": {
 *         "A": "Menara Kuala Lumpur",
 *         "B": "Petronas Twin Towers",
 *         "C": "Exchange 106",
 *         "D": "The St. Regis KL"
 *       },
 *       "correctAnswer": "B"
 *     }
 *   ]
 * }
 */

const questionSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
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
  correctAnswer: {
    type: String,
    required: true,
    enum: ['A', 'B', 'C', 'D'],
  },
}, { _id: false });

const quizSchema = new mongoose.Schema({
  country: {
    type: String,
    required: true,
    index: true,
  },
  quiz_title: {
    type: String,
    required: true,
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['Easy', 'Medium', 'Hard'],
  },
  description: {
    type: String,
  },
  questions: {
    type: [questionSchema],
    required: true,
    validate: {
      validator: function(v) {
        return v.length > 0;
      },
      message: 'A quiz must have at least one question',
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for efficient country queries
quizSchema.index({ country: 1, difficulty: 1 });

module.exports = mongoose.model('Quiz', quizSchema);
