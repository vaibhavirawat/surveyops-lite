import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // During development, requests to /api are forwarded to the Express server.
    // The browser thinks everything is one site, so no CORS problems and no hardcoded API address in the code.
    proxy: {
      '/api': 'http://localhost:4001',
    },
  },
})
