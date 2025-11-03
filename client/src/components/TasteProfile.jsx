import React, { useState, useEffect } from 'react';
import api from '../utils/api';

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

  if (loading) return <div className="taste-profile-loading">Loading taste profile...</div>;
  if (error) return <div className="taste-profile-error">{error}</div>;
  if (!tasteProfile) return <div className="taste-profile-empty">No taste profile data available</div>;

  // Check if all values are zero
  const hasPreferences = Object.values(tasteProfile).some(value => value > 0);
  if (!hasPreferences) {
    return <div className="taste-profile-empty">No taste preferences recorded yet. Complete and rate recipes to build your taste profile!</div>;
  }

  // Calculate the maximum value for scaling the bars
  const maxValue = Math.max(...Object.values(tasteProfile));

  return (
    <div className="taste-profile-container">
      <h3>Your Taste Profile</h3>
      <div className="taste-profile-chart">
        {Object.entries(tasteProfile).map(([taste, value]) => (
          <div key={taste} className="taste-bar">
            <div className="taste-label">
              {taste.charAt(0).toUpperCase() + taste.slice(1)}
            </div>
            <div className="taste-bar-container">
              <div 
                className="taste-bar-fill"
                style={{
                  width: maxValue > 0 ? `${(value / maxValue) * 100}%` : '0%'
                }}
              />
            </div>
            <div className="taste-value">{value.toFixed(1)}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TasteProfile;