import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import api from '../utils/api';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

const TasteRadarChart = () => {
  const [tasteProfile, setTasteProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTasteProfile();
  }, []);

  const fetchTasteProfile = async () => {
    try {
      setLoading(true);
      console.log('Fetching taste profile for radar chart...');
      const response = await api.get('/recipes/taste-profile');
      console.log('Taste profile response for radar chart:', response.data);
      setTasteProfile(response.data);
    } catch (err) {
      console.error('Error fetching taste profile:', err);
      setError('Failed to load taste profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="taste-chart-loading">Loading taste profile...</div>;
  if (error) return <div className="taste-chart-error">{error}</div>;
  if (!tasteProfile) return <div className="taste-chart-empty">No taste profile data available</div>;

  // Check if all values are zero
  const hasPreferences = Object.values(tasteProfile).some(value => value > 0);
  if (!hasPreferences) {
    return <div className="taste-chart-empty">No taste preferences recorded yet.</div>;
  }

  // Prepare data for the radar chart
  const labels = Object.keys(tasteProfile).map(taste => 
    taste.charAt(0).toUpperCase() + taste.slice(1)
  );
  
  const dataValues = Object.values(tasteProfile);

  const data = {
    labels: labels,
    datasets: [
      {
        label: 'Your Taste Preferences',
        data: dataValues,
        backgroundColor: 'rgba(91, 107, 232, 0.2)',
        borderColor: 'rgba(91, 107, 232, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(255, 77, 126, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(255, 77, 126, 1)'
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Your Taste Profile'
      }
    },
    scales: {
      r: {
        angleLines: {
          display: true
        },
        suggestedMin: 0,
        suggestedMax: 5
      }
    }
  };

  return (
    <div className="taste-radar-chart">
      <Radar data={data} options={options} />
    </div>
  );
};

export default TasteRadarChart;