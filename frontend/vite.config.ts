// vite.config.ts: Configuration file for the Vite build tool.
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'



// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // Explicitly set port for consistency
    proxy: {
      // Proxy API requests to the backend server during development
      '/api': {
        target: process.env.VITE_DEV_API_URL || 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
