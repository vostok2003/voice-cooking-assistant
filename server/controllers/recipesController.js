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
    const { prompt, title } = req.body;
    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ message: 'Prompt is required' });
    }

    // Call Gemini via your geminiClient wrapper
    const gen = await gemini.generateRecipe(prompt);

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

    // Persist to DB
    const newRecipe = await Recipe.create({
      user: req.user.id,
      title: finalRecipe.title,
      prompt: prompt,
      summary: finalRecipe.summary || '',
      ingredients: finalRecipe.ingredients || [],
      steps: finalRecipe.steps || [],
      geminiRaw: gen
    });

    return res.status(201).json(newRecipe);
  } catch (err) {
    console.error('Error in generateAndSave:', err);
    return res.status(500).json({ message: 'Failed to generate recipe', error: err.message });
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
