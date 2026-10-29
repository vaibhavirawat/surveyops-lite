import axios from 'axios'

// Every request goes to /api/... on the same address as the page.
// In development Vite forwards it to Express (see vite.config.ts).
export const client = axios.create({
  baseURL: '/api',
  timeout: 10_000,
})
