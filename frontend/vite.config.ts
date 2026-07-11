import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true, // reachable across the LAN / homelab
    // Local FastAPI during dev? Uncomment and set VITE_API_URL=/ in .env.local:
    // proxy: { '/api': 'http://localhost:8000' },
  },
});
