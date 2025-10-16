import React from 'react';

export default function RecipeCard({ recipe, onOpen, onDelete }){
  return (
    <div className="recipe-card">
      <div className="rc-left">
        <h5>{recipe.title}</h5>
        <p className="muted">{recipe.summary?.slice(0, 100)}</p>
      </div>

      <div className="rc-actions">
        <button className="btn-sm" onClick={onOpen}>Open</button>
        <button className="btn-sm danger" onClick={onDelete}>Delete</button>
      </div>
    </div>
  );
}

