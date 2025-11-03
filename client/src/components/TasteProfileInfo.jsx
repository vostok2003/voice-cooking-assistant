import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../utils/api';

const TasteProfileInfo = () => {
  const [tasteProfile, setTasteProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasteProfile();
  }, []);

  const fetchTasteProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/recipes/taste-profile');
      setTasteProfile(response.data);
    } catch (err) {
      console.error('Error fetching taste profile:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null;
  if (!tasteProfile) return null;

  // Check if user has any taste preferences recorded
  const hasPreferences = Object.values(tasteProfile).some(value => value > 0);

  if (!hasPreferences) return null;

  // Find top 2 preferences
  const sortedPreferences = Object.entries(tasteProfile)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2);

  // Emoji mapping for tastes
  const tasteEmojis = {
    sweet: '🍯',
    salty: '🧂',
    spicy: '🌶️',
    sour: '🍋',
    bitter: '☕',
    umami: '🍄'
  };

  return (
    <motion.div 
      className="taste-profile-info-card"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="taste-info-header">
        <div className="taste-info-icon">🎯</div>
        <h4 className="taste-info-title">Personalized for You</h4>
      </div>
      
      <div className="taste-info-content">
        <p className="taste-info-text">
          This recipe matches your taste preferences:
        </p>
        
        <div className="taste-preferences-grid">
          {sortedPreferences.map(([taste, value]) => (
            <motion.div 
              key={taste} 
              className="taste-preference-item"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <span className="taste-pref-emoji">{tasteEmojis[taste]}</span>
              <div className="taste-pref-info">
                <span className="taste-pref-name">{taste.charAt(0).toUpperCase() + taste.slice(1)}</span>
                <div className="taste-pref-bar">
                  <motion.div 
                    className="taste-pref-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${(value / 5) * 100}%` }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                  />
                </div>
                <span className="taste-pref-value">{value.toFixed(1)}</span>
              </div>
            </motion.div>
          ))}
        </div>
        
        <div className="taste-info-footer">
          <span className="footer-icon">⭐</span>
          <span className="footer-text">Rate more recipes to improve recommendations</span>
        </div>
      </div>
    </motion.div>
  );
};

export default TasteProfileInfo;