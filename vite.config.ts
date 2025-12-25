import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Removed "define: process.env" block. 
  // We no longer need to inject the API Key into the frontend bundle.
  // The key now lives securely in the Vercel Backend Environment.
});