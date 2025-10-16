import axios from 'axios';
const base = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';
const instance = axios.create({ baseURL: base });

export const setAuthToken = token => {
  if (token) instance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  else delete instance.defaults.headers.common['Authorization'];
};

export default instance;
