import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * `base` is set by CI from the repository name, because a GitHub Pages
 * project site is served from /<repo>/ rather than the domain root.
 */
export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [react(), tailwindcss()],
})
