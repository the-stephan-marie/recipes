import { defineConfig } from 'vite';

export default defineConfig({
  base: '/recipes/', // GitHub Pages project path
  server: {
    host: '0.0.0.0', // Listen on all network interfaces for mobile access
    port: 5173,
    // Note: HTTPS is provided by GitHub Pages in production
    // For local dev, you may need to use a proxy or serve over HTTPS manually
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
});

