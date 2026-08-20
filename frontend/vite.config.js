import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['.trycloudflare.com'],
    proxy: {
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        headers: { Origin: 'http://localhost:5173' },
      },
      '/uploads': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
    },
  },
})
