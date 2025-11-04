// Utility functions for scaling recipe ingredients and cooking times

/**
 * Scale a recipe to a different number of servings
 * @param {Object} recipe - Original recipe object
 * @param {number} newServings - Target number of servings
 * @returns {Object} - Scaled recipe with adjusted ingredients and times
 */
export const scaleRecipe = (recipe, newServings) => {
  if (!recipe || !newServings || newServings <= 0) {
    return recipe;
  }

  const originalServings = recipe.originalServings || 2;
  const scaleFactor = newServings / originalServings;

  // Scale ingredients
  const scaledIngredients = scaleIngredients(recipe.ingredients || [], scaleFactor);

  // Scale cooking times (increase by 10% for every doubling of servings)
  const scaledSteps = scaleSteps(recipe.steps || [], scaleFactor);

  return {
    ...recipe,
    ingredients: scaledIngredients,
    steps: scaledSteps,
    currentServings: newServings,
    scaleFactor
  };
};

/**
 * Scale ingredients based on scale factor
 * Handles various quantity formats: numbers, fractions, ranges
 */
const scaleIngredients = (ingredients, scaleFactor) => {
  return ingredients.map(ingredient => {
    return scaleIngredient(ingredient, scaleFactor);
  });
};

/**
 * Scale a single ingredient
 * Recognizes patterns like: "300g paneer", "2 cups rice", "1/2 tsp salt"
 */
export const scaleIngredient = (ingredient, scaleFactor) => {
  if (!ingredient || typeof ingredient !== 'string') {
    return ingredient;
  }

  // Common patterns to match:
  // 1. "300g paneer" -> "900g paneer"
  // 2. "2 cups rice" -> "6 cups rice"
  // 3. "1/2 tsp salt" -> "1.5 tsp salt"
  // 4. "2-3 onions" -> "6-9 onions"
  
  // Pattern 1: Decimal or whole numbers
  const decimalPattern = /^(\d+\.?\d*)\s*([a-zA-Z\/]+)?\s+(.+)$/;
  const decimalMatch = ingredient.match(decimalPattern);
  
  if (decimalMatch) {
    const [, quantity, unit, name] = decimalMatch;
    const scaled = parseFloat(quantity) * scaleFactor;
    const formatted = formatQuantity(scaled);
    return `${formatted}${unit ? ' ' + unit : ''} ${name}`;
  }

  // Pattern 2: Fractions like "1/2", "3/4"
  const fractionPattern = /^(\d+)\/(\d+)\s*([a-zA-Z]+)?\s+(.+)$/;
  const fractionMatch = ingredient.match(fractionPattern);
  
  if (fractionMatch) {
    const [, numerator, denominator, unit, name] = fractionMatch;
    const quantity = parseInt(numerator) / parseInt(denominator);
    const scaled = quantity * scaleFactor;
    const formatted = formatQuantity(scaled);
    return `${formatted}${unit ? ' ' + unit : ''} ${name}`;
  }

  // Pattern 3: Mixed fractions like "1 1/2"
  const mixedPattern = /^(\d+)\s+(\d+)\/(\d+)\s*([a-zA-Z]+)?\s+(.+)$/;
  const mixedMatch = ingredient.match(mixedPattern);
  
  if (mixedMatch) {
    const [, whole, numerator, denominator, unit, name] = mixedMatch;
    const quantity = parseInt(whole) + parseInt(numerator) / parseInt(denominator);
    const scaled = quantity * scaleFactor;
    const formatted = formatQuantity(scaled);
    return `${formatted}${unit ? ' ' + unit : ''} ${name}`;
  }

  // Pattern 4: Ranges like "2-3 onions"
  const rangePattern = /^(\d+\.?\d*)-(\d+\.?\d*)\s*([a-zA-Z]+)?\s+(.+)$/;
  const rangeMatch = ingredient.match(rangePattern);
  
  if (rangeMatch) {
    const [, min, max, unit, name] = rangeMatch;
    const scaledMin = Math.round(parseFloat(min) * scaleFactor * 10) / 10;
    const scaledMax = Math.round(parseFloat(max) * scaleFactor * 10) / 10;
    return `${scaledMin}-${scaledMax}${unit ? ' ' + unit : ''} ${name}`;
  }

  // If no pattern matches, return original
  return ingredient;
};

/**
 * Format quantity to readable format
 * Converts decimals to fractions when appropriate
 */
const formatQuantity = (quantity) => {
  // Round to 2 decimal places
  const rounded = Math.round(quantity * 100) / 100;
  
  // Convert common decimals to fractions
  const fractions = {
    0.25: '1/4',
    0.33: '1/3',
    0.5: '1/2',
    0.66: '2/3',
    0.75: '3/4',
    1.25: '1 1/4',
    1.33: '1 1/3',
    1.5: '1 1/2',
    1.66: '1 2/3',
    1.75: '1 3/4',
    2.25: '2 1/4',
    2.33: '2 1/3',
    2.5: '2 1/2',
    2.66: '2 2/3',
    2.75: '2 3/4'
  };

  // Check if the rounded value is close to a common fraction
  for (const [decimal, fraction] of Object.entries(fractions)) {
    if (Math.abs(rounded - parseFloat(decimal)) < 0.05) {
      return fraction;
    }
  }

  // Return as decimal, removing trailing zeros
  return rounded.toString().replace(/\.?0+$/, '');
};

/**
 * Scale cooking times based on serving size
 * Cooking time increases logarithmically, not linearly
 */
const scaleSteps = (steps, scaleFactor) => {
  return steps.map(step => {
    if (!step.estimateSeconds || step.estimateSeconds === 0) {
      return step;
    }

    // Time scaling logic:
    // - Doubling ingredients doesn't double time
    // - Use logarithmic scaling: time_new = time_old * (1 + log(scaleFactor) * 0.2)
    // - This means 2x servings = ~20% more time, 4x servings = ~40% more time
    
    let timeMultiplier = 1;
    if (scaleFactor > 1) {
      timeMultiplier = 1 + (Math.log2(scaleFactor) * 0.2);
    } else if (scaleFactor < 1) {
      // For reducing servings, slightly decrease time
      timeMultiplier = 1 - (Math.log2(1 / scaleFactor) * 0.1);
    }

    const newTime = Math.round(step.estimateSeconds * timeMultiplier);

    return {
      ...step,
      estimateSeconds: newTime,
      originalSeconds: step.estimateSeconds
    };
  });
};

/**
 * Get time adjustment description for speech
 */
export const getTimeAdjustmentText = (originalServings, newServings, language = 'en-IN') => {
  if (originalServings === newServings) {
    return '';
  }

  const scaleFactor = newServings / originalServings;
  let percentChange = 0;
  
  if (scaleFactor > 1) {
    percentChange = Math.round((Math.log2(scaleFactor) * 0.2) * 100);
  } else {
    percentChange = -Math.round((Math.log2(1 / scaleFactor) * 0.1) * 100);
  }

  // Language-specific messages
  const messages = {
    'en-IN': percentChange > 0 
      ? `Cooking time increases by approximately ${percentChange}% for ${newServings} servings.`
      : `Cooking time decreases by approximately ${Math.abs(percentChange)}% for ${newServings} servings.`,
    'hi-IN': percentChange > 0
      ? `${newServings} सर्विंग्स के लिए खाना पकाने का समय लगभग ${percentChange}% बढ़ जाता है।`
      : `${newServings} सर्विंग्स के लिए खाना पकाने का समय लगभग ${Math.abs(percentChange)}% कम हो जाता है।`,
    'bn-IN': percentChange > 0
      ? `${newServings} পরিবেশনের জন্য রান্নার সময় প্রায় ${percentChange}% বৃদ্ধি পায়।`
      : `${newServings} পরিবেশনের জন্য রান্নার সময় প্রায় ${Math.abs(percentChange)}% হ্রাস পায়।`,
    'ta-IN': percentChange > 0
      ? `${newServings} பரிமாறுதல்களுக்கு சமையல் நேரம் சுமார் ${percentChange}% அதிகரிக்கிறது।`
      : `${newServings} பரிமாறுதல்களுக்கு சமையல் நேரம் சுமார் ${Math.abs(percentChange)}% குறைகிறது।`,
  };

  return messages[language] || messages['en-IN'];
};
