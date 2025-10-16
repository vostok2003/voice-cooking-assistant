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
  geminiRaw: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

module.exports = mongoose.model('Recipe', recipeSchema);
