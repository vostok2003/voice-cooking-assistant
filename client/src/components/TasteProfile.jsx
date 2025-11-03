import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../utils/api';

const barVariants = {
  hidden: { width: 0 },
  show: (custom) => ({
    width: custom,
    transition: {
      duration: 1,
      delay: 0.2,
      ease: "easeOut"
    }
  })
};

const TasteProfile = () => {
  const [tasteProfile, setTasteProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTasteProfile();
  }, []);


  const fetchTasteProfile = async () => {
    try {
      setLoading(true);
      console.log('Fetching taste profile...');
      const response = await api.get('/recipes/taste-profile');
      console.log('Taste profile response:', response.data);
      setTasteProfile(response.data);
    } catch (err) {
      console.error('Error fetching taste profile:', err);
      setError('Failed to load taste profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="taste-profile-loading">
      <div className="loading-spinner"></div>
      <p>Loading your taste profile...</p>
    </div>
  );
  
  if (error) return <div className="taste-profile-error">{error}</div>;
  if (!tasteProfile) return <div className="taste-profile-empty">No taste profile data available</div>;

  // Check if all values are zero
  const hasPreferences = Object.values(tasteProfile).some(value => value > 0);
  if (!hasPreferences) {
    return (
      <div className="taste-profile-empty">
        <div className="empty-icon">🎯</div>
        <p>No taste preferences recorded yet.</p>
        <p className="empty-hint">Complete and rate recipes to build your taste profile!</p>
      </div>
    );
  }

  // Calculate the maximum value for scaling the bars
  const maxValue = Math.max(...Object.values(tasteProfile));

  // Taste emoji mapping with vibrant gradient colors
  const tasteData = {
    sweet: { 
      emoji: '🍯', 
      color: '#f093fb', 
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      shadow: 'rgba(240, 147, 251, 0.5)'
    },
    salty: { 
      emoji: '🧂', 
      color: '#4facfe', 
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      shadow: 'rgba(79, 172, 254, 0.5)'
    },
    spicy: { 
      emoji: '🌶️', 
      color: '#fa709a', 
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      shadow: 'rgba(250, 112, 154, 0.5)'
    },
    sour: { 
      emoji: '🍋', 
      color: '#fccb90', 
      gradient: 'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)',
      shadow: 'rgba(252, 203, 144, 0.5)'
    },
    bitter: { 
      emoji: '☕', 
      color: '#a8edea', 
      gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      shadow: 'rgba(168, 237, 234, 0.5)'
    },
    umami: { 
      emoji: '🍄', 
      color: '#667eea', 
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      shadow: 'rgba(102, 126, 234, 0.5)'
    }
  };

  return (
    <motion.div 
      className="taste-profile-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="taste-profile-stats">
        <motion.div 
          className="stat-item"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring" }}
        >
          <div className="stat-number">{Object.keys(tasteProfile).length}</div>
          <div className="stat-label">Tastes</div>
        </motion.div>
        <motion.div 
          className="stat-item"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.4, type: "spring" }}
        >
          <div className="stat-number">{Math.max(...Object.values(tasteProfile)).toFixed(1)}</div>
          <div className="stat-label">Highest</div>
        </motion.div>
        <motion.div 
          className="stat-item"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: "spring" }}
        >
          <div className="stat-number">{(Object.values(tasteProfile).reduce((a, b) => a + b, 0) / Object.values(tasteProfile).length).toFixed(1)}</div>
          <div className="stat-label">Average</div>
        </motion.div>
      </div>

      <div className="taste-profile-chart">
        {Object.entries(tasteProfile).map(([taste, value], index) => {
          const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
          return (
            <motion.div 
              key={taste} 
              className="taste-bar-wrapper"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index, duration: 0.4 }}
            >
              <div className="taste-bar-header">
                <div className="taste-label">
                  <motion.span 
                    className="taste-emoji"
                    animate={{ 
                      scale: [1, 1.2, 1],
                      rotate: [0, 10, -10, 0]
                    }}
                    transition={{ 
                      duration: 2,
                      delay: 0.1 * index,
                      repeat: Infinity,
                      repeatDelay: 3
                    }}
                  >
                    {tasteData[taste].emoji}
                  </motion.span>
                  <span className="taste-name">{taste.charAt(0).toUpperCase() + taste.slice(1)}</span>
                </div>
                <motion.div 
                  className="taste-value"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8 + (0.1 * index), type: "spring" }}
                >
                  {value.toFixed(1)}
                </motion.div>
              </div>
              <div className="taste-bar-container">
                <motion.div 
                  className="taste-bar-fill"
                  style={{
                    background: tasteData[taste].gradient,
                    boxShadow: `0 0 20px ${tasteData[taste].shadow}`
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{
                    duration: 1.2,
                    delay: 0.3 + (0.1 * index),
                    ease: [0.43, 0.13, 0.23, 0.96]
                  }}
                >
                  <motion.div 
                    className="taste-bar-glow"
                    animate={{
                      opacity: [0.5, 1, 0.5]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                </motion.div>
                <div className="taste-bar-percentage">{percentage.toFixed(0)}%</div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <motion.div 
        className="taste-profile-footer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        <div className="footer-sparkle">✨</div>
        <p>Your unique flavor profile</p>
      </motion.div>
    </motion.div>
  );
};

export default TasteProfile;