import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Build timestamp: 2025-12-02T14:45:00Z
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
