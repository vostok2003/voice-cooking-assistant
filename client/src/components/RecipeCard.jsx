import React from 'react';
import { motion } from 'framer-motion';

export default function RecipeCard({ recipe, onOpen, onDelete }){
  return (
    <motion.div 
      className="recipe-card glass-card"
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.3 }}
    >
      <div className="recipe-card-content">
        <div className="recipe-icon">🍽️</div>
        <div className="recipe-info">
          <h5 className="recipe-title">{recipe.title}</h5>
          <p className="recipe-summary">{recipe.summary?.slice(0, 120) || 'No description available'}</p>
        </div>
      </div>

      <div className="recipe-card-actions">
        <motion.button 
          className="btn-recipe-open"
          onClick={onOpen}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 2L8 14M2 8L14 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" opacity="0.3"/>
          </svg>
          <span>Open</span>
        </motion.button>
        
        <motion.button 
          className="btn-recipe-delete"
          onClick={onDelete}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 4H13M5 4V3C5 2.44772 5.44772 2 6 2H10C10.5523 2 11 2.44772 11 3V4M6.5 7V11M9.5 7V11M4 4L4.5 13C4.5 13.5523 4.94772 14 5.5 14H10.5C11.0523 14 11.5 13.5523 11.5 13L12 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Delete</span>
        </motion.button>
      </div>
    </motion.div>
  );
}

