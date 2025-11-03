import React, { useEffect, useState, useContext } from 'react';
import { motion } from 'framer-motion';
import Header from '../components/Header';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';
import ConfirmDialog from '../components/ConfirmDialog';
import RecipeCard from '../components/RecipeCard';
import { AuthContext } from '../context/AuthContext';
import TasteProfile from '../components/TasteProfile';
import TasteRadarChart from '../components/TasteRadarChart';
import './dashboard.css';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" }
  }
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.4 }
  }
};

export default function Dashboard(){
  const [recipes, setRecipes] = useState([]);
  const [confirm, setConfirm] = useState({ open: false, id: null });
  const nav = useNavigate();
  const { user } = useContext(AuthContext);

  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async() => {
    try {
      const res = await api.get('/recipes');
      setRecipes(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const onDelete = (id) => setConfirm({ open: true, id });

  const confirmDelete = async (ok) => {
    if (!ok) return setConfirm({ open: false, id: null });
    try {
      await api.delete(`/recipes/${confirm.id}`);
      setRecipes(r => r.filter(x => x._id !== confirm.id));
    } catch (err) { console.error(err) }
    setConfirm({ open: false, id: null });
  };

  return (
    <div className="dashboard">
      {/* Animated background gradients */}
      <div className="dashboard-gradient-bg">
        <div className="dashboard-orb dashboard-orb-1"></div>
        <div className="dashboard-orb dashboard-orb-2"></div>
        <div className="dashboard-orb dashboard-orb-3"></div>
      </div>

      <Header />
      
      <motion.main 
        className="dashboard-main"
        initial="hidden"
        animate="show"
        variants={container}
      >
        <div className="dashboard-left">
          <motion.div className="welcome-card glass-card" variants={fadeIn}>
            <div className="welcome-content">
              <div className="welcome-icon">👋</div>
              <h2 className="welcome-title">
                Hello, {user?.name || user?.email}!
              </h2>
              <p className="welcome-subtitle">
                Ready to create something delicious?
              </p>
              <button 
                className="btn-dashboard-primary"
                onClick={() => nav('/chat')}
              >
                <span>✨ Start New Recipe</span>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </motion.div>

          <motion.section className="recipes-section" variants={fadeIn}>
            <div className="section-header">
              <h3 className="section-title">
                <span className="title-icon">📖</span>
                Your Recipes
              </h3>
              <span className="recipe-count">{recipes.length} {recipes.length === 1 ? 'recipe' : 'recipes'}</span>
            </div>
            
            <div className="recipes-grid">
              {recipes.length === 0 ? (
                <motion.div className="empty-state glass-card" variants={cardVariants}>
                  <div className="empty-icon">🍳</div>
                  <h4>No recipes yet</h4>
                  <p>Start by creating your first recipe!</p>
                </motion.div>
              ) : (
                recipes.map((r, index) => (
                  <motion.div
                    key={r._id}
                    variants={cardVariants}
                    custom={index}
                  >
                    <RecipeCard
                      recipe={r}
                      onOpen={() => nav(`/chat/${r._id}`)}
                      onDelete={() => onDelete(r._id)}
                    />
                  </motion.div>
                ))
              )}
            </div>
          </motion.section>
        </div>

        <div className="dashboard-right">
          <motion.div className="taste-profile-card glass-card" variants={fadeIn}>
            <div className="card-header">
              <h3 className="card-title">
                <span className="title-icon">🍽️</span>
                Your Taste Profile
              </h3>
            </div>
            
            <TasteProfile />
            <TasteRadarChart />
            
            <div className="taste-info">
              <p className="info-text">
                💡 Your taste preferences help us generate recipes tailored to your liking.
              </p>
              <p className="info-text">
                ⭐ Complete and rate more recipes to improve your personalized experience.
              </p>
            </div>
          </motion.div>
        </div>
      </motion.main>

      <ConfirmDialog 
        open={confirm.open} 
        onClose={() => confirmDelete(false)} 
        onConfirm={() => confirmDelete(true)} 
        message="Are you sure you want to delete this recipe?" 
      />
    </div>
  );
}