import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Use '/' as base for Vercel, keep './' for GitHub Pages compatibility
  base: process.env.VERCEL ? '/' : './',
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
})
