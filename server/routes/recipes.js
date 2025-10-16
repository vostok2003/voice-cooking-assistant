// server/routes/recipes.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { generateAndSave, getUserRecipes, getRecipe, deleteRecipe } = require('../controllers/recipesController');

// existing routes
router.post('/generate', auth, generateAndSave);
router.get('/', auth, getUserRecipes);

// NEW routes - single recipe and delete
router.get('/:id', auth, getRecipe);
router.delete('/:id', auth, deleteRecipe);

module.exports = router;
