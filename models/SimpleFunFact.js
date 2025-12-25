const mongoose = require('mongoose');

/**
 * Simple Fun Fact Schema
 * 
 * Stores simple fun facts for each country, used for loading screens.
 * 
 * Example document:
 * {
 *   "country": "Japan",
 *   "funfact": [
 *     "The news reports a daily forecast for cherry blossom season, just like the weather.",
 *     "Japan has millions of vending machines selling everything from hot coffee to fresh soup."
 *   ]
 * }
 */

const simpleFunFactSchema = new mongoose.Schema({
  country: {
    type: String,
    required: true,
    index: true,
  },
  funfact: {
    type: [String],
    required: true,
  },
});

module.exports = mongoose.model('SimpleFunFact', simpleFunFactSchema, 'simple_funfact');
