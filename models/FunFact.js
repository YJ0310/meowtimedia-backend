const mongoose = require('mongoose');

/**
 * FunFact Schema
 * 
 * Stores fun facts for each country.
 * Used to display interesting tidbits about Asian countries.
 * 
 * Example document:
 * {
 *   "country": "Malaysia",
 *   "funFact": [
 *     "Fun fact 1",
 *     "Fun fact 2"
 *   ]
 * }
 */

const funFactSchema = new mongoose.Schema({
  country: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  funFact: {
    type: [String],
    required: true,
    validate: {
      validator: function(v) {
        return v.length > 0;
      },
      message: 'At least one fun fact is required',
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

module.exports = mongoose.model('FunFact', funFactSchema);
