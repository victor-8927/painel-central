import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// VitePWA removido: incompatível com Vite 8 (Rolldown).
// manifest.webmanifest servido como arquivo estático em public/.
// Service Worker não utilizado por ora (app é online-first).
export default defineConfig({
  plugins: [react()],
})
