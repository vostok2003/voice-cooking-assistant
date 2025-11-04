// server/controllers/recipesController.js
const Recipe = require('../models/Recipe');
const gemini = require('../utils/geminiClient');

/**
 * Try to extract JSON from Gemini response.
 * Gemini v1beta generateContent typically returns:
 * {
 *   candidates: [
 *     { content: { parts: [ { text: '...string...' } ] } }
 *   ]
 * }
 *
 * We attempt:
 *  1) take the first candidate.parts[0].text (if available)
 *  2) try JSON.parse directly
 *  3) fallback: extract first {...} or [...] substring via regex and parse
 */
function extractJsonTextFromGemini(resData) {
  // Attempt to find a text part
  const candidateText =
    resData?.candidates?.[0]?.content?.parts?.[0]?.text ||
    // some other variants
    resData?.outputs?.[0]?.content?.[0]?.text ||
    null;

  if (!candidateText) return null;

  // If the model returned pure JSON string, parse directly
  try {
    const parsed = JSON.parse(candidateText);
    return parsed;
  } catch (e) {
    // Not pure JSON — attempt to extract JSON object / array substring
    // regex: match from first '{' to last '}' (greedy) or first '[' to last ']'
    const jsonObjectMatch = candidateText.match(/\{[\s\S]*\}/);
    const jsonArrayMatch = candidateText.match(/\[[\s\S]*\]/);

    const candidateJsonString = jsonObjectMatch?.[0] || jsonArrayMatch?.[0];
    if (!candidateJsonString) {
      // no JSON-looking text
      return null;
    }

    try {
      const parsed = JSON.parse(candidateJsonString);
      return parsed;
    } catch (err) {
      return null;
    }
  }
}

/**
 * Normalize parsed recipe object into schema-friendly shape.
 * Ensures: title, prompt, summary, ingredients (array of strings), steps (array with instruction + estimateSeconds)
 */
function normalizeRecipe(parsed, prompt, titleFallback = null) {
  const recipe = {};
  recipe.prompt = prompt || '';
  recipe.title =
    (parsed && (parsed.title || parsed.name || parsed.recipeTitle)) ||
    titleFallback ||
    'Generated Recipe';
  recipe.summary = parsed?.summary || parsed?.description || '';
  // Convert ingredients to array of strings
  if (Array.isArray(parsed?.ingredients)) {
    recipe.ingredients = parsed.ingredients.map((i) =>
      typeof i === 'string' ? i : JSON.stringify(i)
    );
  } else if (typeof parsed?.ingredients === 'string') {
    // split by line breaks or commas
    recipe.ingredients = parsed.ingredients
      .split(/\r?\n|,/)
      .map((s) => s.trim())
      .filter(Boolean);
  } else {
    recipe.ingredients = [];
  }

  // steps normalization
  recipe.steps = [];
  if (Array.isArray(parsed?.steps)) {
    parsed.steps.forEach((s) => {
      if (!s) return;
      if (typeof s === 'string') {
        recipe.steps.push({ instruction: s, estimateSeconds: 0 });
      } else if (typeof s === 'object') {
        const instruction =
          s.instruction || s.step || s.action || s.description || JSON.stringify(s);
        // try common fields for time: estimateSeconds, timeSeconds, duration, minutes, secs
        let secs = 0;
        if (typeof s.estimateSeconds === 'number') secs = s.estimateSeconds;
        else if (typeof s.timeSeconds === 'number') secs = s.timeSeconds;
        else if (typeof s.duration === 'number') secs = s.duration;
        else if (typeof s.minutes === 'number') secs = Math.round(s.minutes * 60);
        else if (typeof s.secs === 'number') secs = s.secs;
        else if (typeof s.time === 'string') {
          // try parse "5 minutes" or "2 min" patterns
          const m = s.time.match(/(\d+)\s*min/);
          const m2 = s.time.match(/(\d+)\s*sec/);
          if (m) secs = parseInt(m[1], 10) * 60;
          else if (m2) secs = parseInt(m2[1], 10);
        }

        recipe.steps.push({
          instruction: instruction,
          estimateSeconds: Number.isFinite(secs) ? secs : 0
        });
      }
    });
  } else if (typeof parsed?.steps === 'string') {
    // split by lines
    recipe.steps = parsed.steps
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => ({ instruction: s, estimateSeconds: 0 }));
  }

  return recipe;
}

exports.generateAndSave = async (req, res) => {
  try {
    const { prompt, title, language } = req.body;
    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ message: 'Prompt is required' });
    }

    // Get user's taste profile to influence recipe generation
    const userId = req.user.id;
    const recipes = await Recipe.find({ user: userId, tasteRating: { $exists: true } });
    
    let tasteProfile = null;
    if (recipes.length > 0) {
      // Calculate average taste preferences
      tasteProfile = {
        sweet: 0,
        salty: 0,
        spicy: 0,
        sour: 0,
        bitter: 0,
        umami: 0
      };
      
      recipes.forEach(recipe => {
        Object.keys(tasteProfile).forEach(taste => {
          tasteProfile[taste] += recipe.tasteRating[taste] || 0;
        });
      });
      
      // Calculate averages
      Object.keys(tasteProfile).forEach(taste => {
        tasteProfile[taste] = Math.round(tasteProfile[taste] / recipes.length * 100) / 100;
      });
      
      // Only include tastes with non-zero values
      const hasPreferences = Object.values(tasteProfile).some(value => value > 0);
      if (!hasPreferences) {
        tasteProfile = null;
      }
    }

    // Call Gemini via your geminiClient wrapper, passing taste profile and language
    const languageCode = language || 'en-IN';
    const gen = await gemini.generateRecipe(prompt, tasteProfile, languageCode);

    // Extract and parse JSON recipe from response
    const parsed = extractJsonTextFromGemini(gen);

    // If parsing failed, attempt to fallback: if the API returned a simple text,
    // store it in summary and save a minimal recipe
    let finalRecipe;
    if (parsed && (parsed.title || parsed.ingredients || parsed.steps)) {
      // Looks like a full recipe object
      finalRecipe = normalizeRecipe(parsed, prompt, title);
    } else if (typeof gen === 'string') {
      finalRecipe = {
        prompt,
        title: title || 'Generated Recipe',
        summary: gen,
        ingredients: [],
        steps: []
      };
    } else {
      // try to take raw text (candidate text) and store it in summary
      const rawText =
        gen?.candidates?.[0]?.content?.parts?.[0]?.text ||
        gen?.outputs?.[0]?.content?.[0]?.text ||
        JSON.stringify(gen);

      finalRecipe = {
        prompt,
        title: title || 'Generated Recipe',
        summary: rawText,
        ingredients: [],
        steps: []
      };
    }

    // Attach user and save
    finalRecipe.user = userId;
    const saved = await Recipe.create(finalRecipe);

    res.status(201).json(saved);
  } catch (err) {
    console.error('Recipe generation error:', err);
    res.status(500).json({ message: 'Failed to generate recipe' });
  }
};

exports.getUserRecipes = async (req, res) => {
  try {
    const recipes = await Recipe.find({ user: req.user.id }).sort({ createdAt: -1 });
    return res.json(recipes);
  } catch (err) {
    console.error('Error fetching user recipes:', err);
    return res.status(500).json({ message: 'Failed to fetch recipes' });
  }
};

/**
 * Get a single recipe (only owner allowed)
 */
exports.getRecipe = async (req, res) => {
  try {
    const recipeId = req.params.id;
    const recipe = await Recipe.findById(recipeId);
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });

    // authorize: only owner can fetch (since recipes are per-user)
    if (recipe.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to view this recipe' });
    }

    return res.json(recipe);
  } catch (err) {
    console.error('getRecipe error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Delete a recipe (only owner allowed)
 */
exports.deleteRecipe = async (req, res) => {
  try {
    const recipeId = req.params.id;
    const recipe = await Recipe.findById(recipeId);
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });

    // authorize: only owner can delete
    if (recipe.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this recipe' });
    }

    await Recipe.findByIdAndDelete(recipeId);
    return res.json({ message: 'Recipe deleted' });
  } catch (err) {
    console.error('deleteRecipe error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Add taste rating to a recipe
exports.addTasteRating = async (req, res) => {
  try {
    const recipeId = req.params.id; // Changed from req.params.recipeId to req.params.id
    const { tasteRating, userTasteNotes } = req.body;
    
    console.log('Adding taste rating for recipe:', recipeId);
    console.log('Taste rating data:', tasteRating);
    console.log('User notes:', userTasteNotes);
    
    // Validate taste rating object
    const validTastes = ['sweet', 'salty', 'spicy', 'sour', 'bitter', 'umami'];
    const updatedRating = {};
    
    validTastes.forEach(taste => {
      updatedRating[taste] = tasteRating && typeof tasteRating[taste] === 'number' ? 
        Math.max(0, tasteRating[taste]) : 0;
    });
    
    console.log('Updated rating:', updatedRating);
    
    // Update the recipe with taste rating
    const recipe = await Recipe.findByIdAndUpdate(
      recipeId,
      { 
        $set: { 
          tasteRating: updatedRating,
          userTasteNotes: userTasteNotes || ''
        }
      },
      { new: true, runValidators: true }
    );
    
    if (!recipe) {
      console.log('Recipe not found:', recipeId);
      return res.status(404).json({ message: 'Recipe not found' });
    }
    
    console.log('Recipe updated with taste rating:', recipe.tasteRating);
    res.json(recipe);
  } catch (err) {
    console.error('Error adding taste rating:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user's taste profile (aggregate from all recipes)
exports.getUserTasteProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('Fetching taste profile for user:', userId);
    
    // Aggregate taste ratings from all user's recipes
    const recipes = await Recipe.find({ user: userId, tasteRating: { $exists: true } });
    console.log('Found recipes with taste ratings:', recipes.length);
    
    // Calculate average taste preferences
    const tasteProfile = {
      sweet: 0,
      salty: 0,
      spicy: 0,
      sour: 0,
      bitter: 0,
      umami: 0
    };
    
    if (recipes.length > 0) {
      recipes.forEach(recipe => {
        console.log('Recipe taste rating:', recipe.tasteRating);
        Object.keys(tasteProfile).forEach(taste => {
          tasteProfile[taste] += recipe.tasteRating[taste] || 0;
        });
      });
      
      // Calculate averages
      Object.keys(tasteProfile).forEach(taste => {
        tasteProfile[taste] = Math.round(tasteProfile[taste] / recipes.length * 100) / 100;
      });
    }
    
    console.log('Final taste profile:', tasteProfile);
    res.json(tasteProfile);
  } catch (err) {
    console.error('Error getting taste profile:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
