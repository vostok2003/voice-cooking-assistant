import React, { useState, useEffect } from 'react';
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

  return (
    <div className="taste-profile-info">
      <div className="taste-profile-header">
        <span className="taste-profile-icon">🍽️</span>
        <span className="taste-profile-title">Your Taste Profile</span>
      </div>
      <div className="taste-profile-content">
        <p>We've tailored this recipe based on your preferences for:</p>
        <ul>
          {sortedPreferences.map(([taste, value]) => (
            <li key={taste}>
              <strong>{taste.charAt(0).toUpperCase() + taste.slice(1)}</strong> (rating: {value.toFixed(1)})
            </li>
          ))}
        </ul>
        <p className="taste-profile-note">
          Continue rating dishes to further refine your personalized recommendations!
        </p>
      </div>
    </div>
  );
};

export default TasteProfileInfo;