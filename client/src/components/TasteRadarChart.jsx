import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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

  if (loading) return (
    <div className="taste-chart-loading">
      <div className="chart-loading-spinner"></div>
      <p>Generating radar chart...</p>
    </div>
  );
  
  if (error) return <div className="taste-chart-error">{error}</div>;
  if (!tasteProfile) return <div className="taste-chart-empty">No taste profile data available</div>;

  // Check if all values are zero
  const hasPreferences = Object.values(tasteProfile).some(value => value > 0);
  if (!hasPreferences) {
    return (
      <div className="taste-chart-empty">
        <div className="chart-empty-icon">📊</div>
        <p>No chart data available yet</p>
      </div>
    );
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
        label: 'Your Taste DNA',
        data: dataValues,
        backgroundColor: 'rgba(102, 126, 234, 0.35)',
        borderColor: 'rgba(102, 126, 234, 1)',
        borderWidth: 3,
        pointBackgroundColor: 'rgba(240, 147, 251, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 3,
        pointRadius: 7,
        pointHoverRadius: 9,
        pointHoverBackgroundColor: 'rgba(240, 147, 251, 1)',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 4
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(10px)',
        padding: 12,
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        displayColors: false,
        callbacks: {
          label: function(context) {
            return `${context.label}: ${context.parsed.r.toFixed(1)}`;
          }
        }
      }
    },
    scales: {
      r: {
        angleLines: {
          display: true,
          color: 'rgba(255, 255, 255, 0.15)'
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.15)'
        },
        pointLabels: {
          color: '#ffffff',
          font: {
            size: 14,
            weight: '700'
          }
        },
        ticks: {
          display: false,
          stepSize: 1
        },
        suggestedMin: 0,
        suggestedMax: Math.max(...dataValues) * 1.2
      }
    }
  };

  // Dark theme adjustments
  if (document.documentElement.getAttribute('data-theme') === 'light') {
    options.scales.r.angleLines.color = 'rgba(0, 0, 0, 0.15)';
    options.scales.r.grid.color = 'rgba(0, 0, 0, 0.15)';
    options.scales.r.pointLabels.color = '#1e293b';
    data.datasets[0].backgroundColor = 'rgba(102, 126, 234, 0.25)';
    data.datasets[0].borderColor = 'rgba(102, 126, 234, 0.9)';
  }

  return (
    <motion.div 
      className="taste-radar-chart"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.8 }}
    >
      <div className="radar-chart-header">
        <h4 className="radar-title">🎯 Taste Radar</h4>
      </div>
      <div className="radar-chart-wrapper">
        <Radar data={data} options={options} />
      </div>
    </motion.div>
  );
};

export default TasteRadarChart;