import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// BASE_PATH lets the same build serve from a subpath (e.g. GitHub Pages at /ui-playground/).
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react()],
})
