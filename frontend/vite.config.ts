import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3001,
    host: true,
    proxy: {
      '/api/app-runtime': {
        target: 'https://apps.sarvam.ai',
        changeOrigin: true,
        secure: false,
      }
    }
  }
});
