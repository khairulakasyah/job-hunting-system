import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
  base: '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  // Add this block below to enable instant file syncing in Docker
  server: {
    host: true, // Allows connections from outside the container
    watch: {
      usePolling: true, // Forces Vite to detect file changes inside Docker volumes
    },
  },
})
