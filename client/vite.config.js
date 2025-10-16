// client/vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // allow imports like: import api from '@/utils/api'
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
