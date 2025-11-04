const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  language: { type: String, default: 'en-IN' }, // Default to English (Indian)
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
