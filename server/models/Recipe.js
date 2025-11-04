const mongoose = require('mongoose');

const stepSchema = new mongoose.Schema({
  instruction: String,
  estimateSeconds: { type: Number, default: 0 }
}, { _id: false });

const recipeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: String,
  prompt: String,
  summary: String,
  ingredients: [String],
  steps: [stepSchema],
  originalServings: { type: Number, default: 2 }, // Original servings from Gemini
  geminiRaw: { type: mongoose.Schema.Types.Mixed },
  // Taste profile fields
  tasteRating: {
    sweet: { type: Number, default: 0 },
    salty: { type: Number, default: 0 },
    spicy: { type: Number, default: 0 },
    sour: { type: Number, default: 0 },
    bitter: { type: Number, default: 0 },
    umami: { type: Number, default: 0 }
  },
  userTasteNotes: String // User's custom notes about the dish
}, { timestamps: true });

module.exports = mongoose.model('Recipe', recipeSchema);