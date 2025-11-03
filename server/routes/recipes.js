// server/routes/recipes.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { generateAndSave, getUserRecipes, getRecipe, deleteRecipe, addTasteRating, getUserTasteProfile } = require('../controllers/recipesController');

// existing routes
router.post('/generate', auth, generateAndSave);
router.get('/', auth, getUserRecipes);

// Taste profile routes
router.get('/taste-profile', auth, getUserTasteProfile);

// NEW routes - single recipe and delete
router.get('/:id', auth, getRecipe);
router.delete('/:id', auth, deleteRecipe);
router.post('/:id/taste-rating', auth, addTasteRating);

module.exports = router;