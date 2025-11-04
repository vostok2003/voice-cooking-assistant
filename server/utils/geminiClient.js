// server/utils/geminiClient.js
const axios = require('axios');

const GEMINI_BASE = process.env.GEMINI_API_BASE || 'https://generativelanguage.googleapis.com/v1';
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

if (!GEMINI_KEY) {
  throw new Error("Missing GEMINI_API_KEY in .env");
}

// Fallback keyword-based ingredient classification
const fallbackClassification = (ingredients) => {
  const categories = {
    dairy: [],
    vegetables: [],
    spices: [],
    proteins: [],
    grains: [],
    condiments: [],
    herbs: [],
    other: []
  };

  const patterns = {
    dairy: /milk|cream|butter|cheese|yogurt|ghee|paneer|curd/i,
    vegetables: /onion|tomato|potato|carrot|peas|beans|capsicum|pepper|brinjal|eggplant|cauliflower|cabbage|spinach|garlic|ginger/i,
    spices: /cumin|turmeric|coriander powder|chili|pepper|cardamom|cinnamon|clove|nutmeg|saffron|masala|paprika/i,
    proteins: /chicken|mutton|fish|egg|paneer|tofu|meat|dal|lentil|chickpea/i,
    grains: /rice|wheat|flour|bread|roti|naan|pasta|semolina|oats/i,
    condiments: /oil|salt|sugar|vinegar|sauce|paste|honey/i,
    herbs: /coriander leaves|mint|basil|parsley|cilantro|curry leaves|bay leaf/i
  };

  ingredients.forEach(ingredient => {
    // Remove quantity prefix (e.g., "300g", "2 cups")
    const cleaned = ingredient.replace(/^[\d\/\.\s]+(?:g|kg|ml|l|cup|cups|tbsp|tsp|oz|lb)?\s*/i, '').trim();
    
    let categorized = false;
    for (const [category, pattern] of Object.entries(patterns)) {
      if (pattern.test(cleaned)) {
        categories[category].push(ingredient);
        categorized = true;
        break;
      }
    }
    
    if (!categorized) {
      categories.other.push(ingredient);
    }
  });

  // Remove empty categories
  Object.keys(categories).forEach(key => {
    if (categories[key].length === 0) {
      delete categories[key];
    }
  });

  return categories;
};

module.exports = {
  generateRecipe: async (prompt, tasteProfile = null, languageCode = 'en-IN') => {
    try {
      const url = `${GEMINI_BASE}/models/${MODEL_NAME}:generateContent?key=${GEMINI_KEY}`;

      // Map language codes to human-readable language names
      const languageNames = {
        'en-IN': 'English',
        'en-GB': 'English',
        'en-US': 'English',
        'hi-IN': 'Hindi',
        'mr-IN': 'Marathi',
        'bn-IN': 'Bengali',
        'pa-IN': 'Punjabi',
        'ta-IN': 'Tamil',
        'te-IN': 'Telugu',
        'kn-IN': 'Kannada',
        'ml-IN': 'Malayalam',
        'gu-IN': 'Gujarati',
        'es-ES': 'Spanish',
        'fr-FR': 'French',
        'de-DE': 'German',
        'ar-SA': 'Arabic'
      };
      
      const targetLanguage = languageNames[languageCode] || 'English';
      
      // Enhance prompt with taste profile if available
      let enhancedPrompt = prompt;
      if (tasteProfile) {
        const tastePreferences = [];
        Object.keys(tasteProfile).forEach(taste => {
          if (tasteProfile[taste] > 0) {
            tastePreferences.push(`${taste}: ${tasteProfile[taste]}`);
          }
        });
        
        if (tastePreferences.length > 0) {
          enhancedPrompt = `Create a recipe for someone with these taste preferences: ${tastePreferences.join(', ')}. ${prompt}`;
        }
      }

      const body = {
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `You are a recipe generator. You MUST respond in ${targetLanguage} language. Respond ONLY with valid JSON in this exact format:
{
  "title": "string (in ${targetLanguage})",
  "summary": "short summary (in ${targetLanguage})",
  "servings": 2,
  "ingredients": ["300g ingredient 1 (in ${targetLanguage})", "2 cups ingredient 2 (in ${targetLanguage})"],
  "steps": [
    {"instruction": "step text (in ${targetLanguage})", "estimateSeconds": 120}
  ]
}
IMPORTANT: 
- All text fields (title, summary, ingredients, instructions) MUST be in ${targetLanguage} language.
- Include quantities with units in ingredients (e.g., "300g paneer", "2 cups rice", "1 tbsp oil").
- Set servings to 2 by default.
- Provide realistic cooking times in estimateSeconds.
${enhancedPrompt}
Return only the JSON object with no extra commentary. Remember: respond entirely in ${targetLanguage}.`
              }
            ]
          }
        ]
      };

      const res = await axios.post(url, body, {
        headers: { "Content-Type": "application/json" }
      });

      return res.data;
    } catch (err) {
      if (err.response) {
        console.error("Gemini API error:", {
          status: err.response.status,
          data: err.response.data
        });
      } else {
        console.error("Gemini API error:", err.message);
      }
      throw new Error("Failed to generate recipe from Gemini");
    }
  },

  // Classify ingredients into categories using Gemini AI
  classifyIngredients: async (ingredients) => {
    try {
      const url = `${GEMINI_BASE}/models/${MODEL_NAME}:generateContent?key=${GEMINI_KEY}`;

      const body = {
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Classify these ingredients into categories. Return ONLY valid JSON in this exact format:
{
  "dairy": ["milk", "butter"],
  "vegetables": ["onion", "tomato"],
  "spices": ["cumin", "turmeric"],
  "proteins": ["chicken", "paneer"],
  "grains": ["rice", "flour"],
  "condiments": ["oil", "salt"],
  "herbs": ["coriander", "mint"],
  "other": ["water"]
}

Ingredients to classify:
${ingredients.join('\n')}

Rules:
- Extract just the ingredient name (remove quantities like "300g", "2 cups")
- Categorize each ingredient into ONE category
- Use these categories: dairy, vegetables, spices, proteins, grains, condiments, herbs, other
- Return ONLY the JSON object, no extra text`
              }
            ]
          }
        ]
      };

      const res = await axios.post(url, body, {
        headers: { "Content-Type": "application/json" }
      });

      // Extract JSON from response
      const rawText = res.data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Fallback to simple classification if Gemini fails
      return fallbackClassification(ingredients);
    } catch (err) {
      console.error('Gemini classification error:', err.message);
      // Fallback to simple keyword-based classification
      return fallbackClassification(ingredients);
    }
  }
};