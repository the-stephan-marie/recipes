import { defineConfig } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
  plugins: [basicSsl()],
  server: {
    host: '0.0.0.0', // Listen on all network interfaces for mobile access
    port: 5173,
    https: true, // Enable HTTPS for camera features
  },
});

