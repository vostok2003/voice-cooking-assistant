import axios from 'axios';

// Determine base URL for API calls
const getBaseURL = () => {
  // First priority: environment variable
  if (import.meta.env.VITE_API_BASE) {
    return import.meta.env.VITE_API_BASE;
  }
  
  // Second priority: if in production (Vercel), use Render backend
  if (window.location.hostname.includes('vercel.app')) {
    return 'https://voice-cooking-assistant.onrender.com/api';
  }
  
  // Fallback: local development
  return 'http://localhost:5000/api';
};

const base = getBaseURL();
const instance = axios.create({ baseURL: base });

console.log('🔗 API Base URL:', base); // Debug: verify correct endpoint is used

export const setAuthToken = token => {
  if (token) instance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  else delete instance.defaults.headers.common['Authorization'];
};

export const warmUpBackend = async () => {
  try {
    const root = base.endsWith('/api') ? base.slice(0, -4) : base;
    await fetch(root, { mode: 'no-cors' });
    await new Promise(r => setTimeout(r, 1200));
  } catch (_) {}
};

export default instance;
