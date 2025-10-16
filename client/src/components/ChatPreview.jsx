// src/components/ChatPreview.jsx
import React from "react";
import { motion } from "framer-motion";

export default function ChatPreview({ recipe }) {
  if (!recipe) return null;

  return (
    <motion.div
      className="chat-preview-card"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      role="region"
      aria-label="Recipe preview"
    >
      <div className="cp-header">
        <div className="cp-title">{recipe.title}</div>
        <div className="cp-badge">Preview</div>
      </div>

      <div className="cp-section">
        <div className="cp-section-title">Summary</div>
        <div className="cp-summary">{recipe.summary}</div>
      </div>

      <div className="cp-section">
        <div className="cp-section-title">Ingredients</div>
        <ul className="cp-ingredients">
          {recipe.ingredients.map((ing, i) => (
            <li key={i}>{ing}</li>
          ))}
        </ul>
      </div>

      <div className="cp-section">
        <div className="cp-section-title">Recipe</div>
        <ol className="cp-steps">
          {recipe.steps.map((s, i) => (
            <li key={i}><span className="step-index">{i + 1}.</span> {s}</li>
          ))}
        </ol>
      </div>

      <div className="cp-footer">
        <button className="btn-primary small" onClick={() => (window.location.href = "/chat")}>Open in chat</button>
        <button className="btn-outline small" onClick={() => alert("Saved to your recipes (demo)")}>Save</button>
      </div>
    </motion.div>
  );
}
