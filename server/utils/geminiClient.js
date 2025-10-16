// server/utils/geminiClient.js
const axios = require('axios');

const GEMINI_BASE = process.env.GEMINI_API_BASE || 'https://generativelanguage.googleapis.com/v1';
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

if (!GEMINI_KEY) {
  throw new Error("Missing GEMINI_API_KEY in .env");
}

module.exports = {
  generateRecipe: async (prompt) => {
    try {
      const url = `${GEMINI_BASE}/models/${MODEL_NAME}:generateContent?key=${GEMINI_KEY}`;

      const body = {
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `You are a recipe generator. Respond ONLY with valid JSON in this exact format:
{
  "title": "string",
  "summary": "short summary",
  "ingredients": ["ingredient 1", "ingredient 2"],
  "steps": [
    {"instruction": "step text", "estimateSeconds": 120}
  ]
}
Given this user prompt: "${prompt}"
Return only the JSON object with no extra commentary.`
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
  }
};
