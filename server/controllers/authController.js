const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.register = async (req, res) => {
  const { name, email, password } = req.body;
  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ message: 'Email exists' });
  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password: hashed });
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user._id, email: user.email, name: user.name, language: user.language, speechSpeed: user.speechSpeed } });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(400).json({ message: 'Invalid credentials' });
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user._id, email: user.email, name: user.name, language: user.language, speechSpeed: user.speechSpeed } });
};

exports.updateLanguage = async (req, res) => {
  try {
    const { language } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { language },
      { new: true }
    );
    res.json({ user: { id: user._id, email: user.email, name: user.name, language: user.language, speechSpeed: user.speechSpeed } });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update language' });
  }
};

exports.updateSpeechSpeed = async (req, res) => {
  try {
    const { speechSpeed } = req.body;
    // Validate speed is within allowed range
    if (speechSpeed < 0.25 || speechSpeed > 2.25) {
      return res.status(400).json({ message: 'Speech speed must be between 0.25x and 2.25x' });
    }
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { speechSpeed },
      { new: true }
    );
    res.json({ user: { id: user._id, email: user.email, name: user.name, language: user.language, speechSpeed: user.speechSpeed } });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update speech speed' });
  }
};
