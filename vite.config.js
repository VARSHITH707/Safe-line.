import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // WebXR requires HTTPS in production. For local dev, use a tunnel (ngrok / cloudflared).
  // Uncomment below when you're ready to expose via HTTPS:
  // server: { https: true, host: true },
  server: {
    port: 5173,
    open: true,
  },
});
