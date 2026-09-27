import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFile } from 'node:fs/promises'

function spaFallback() {
  return {
    name: 'spa-fallback',
    apply: 'build',
    async closeBundle() {
      await copyFile('dist/index.html', 'dist/404.html')
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), spaFallback()],
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
