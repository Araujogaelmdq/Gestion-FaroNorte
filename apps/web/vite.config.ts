import { createRequire } from 'module';
const require = createRequire(import.meta.url);
(globalThis as any).require = require;

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['LogoFN.jpg'],
      manifest: {
        name: 'Faro Norte - Sistema de Gestión',
        short_name: 'Faro Norte',
        description: 'Sistema web de gestión para el club de barrio Faro Norte',
        theme_color: '#E8863A',
        background_color: '#FFFFFF',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: '/LogoFN.jpg',
            sizes: '192x192',
            type: 'image/jpeg',
          },
          {
            src: '/LogoFN.jpg',
            sizes: '512x512',
            type: 'image/jpeg',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,jpg,svg}'],
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
    },
  },
});
