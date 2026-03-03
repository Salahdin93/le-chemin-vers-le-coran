import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

/// <reference types="vitest" />
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo.png', 'logo-dark.png', 'logo.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Le Chemin Vers Le Coran',
        short_name: 'Le Chemin',
        description: 'Votre compagnon pour la lecture et la révision du Coran',
        theme_color: '#2E7D32',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'logo-dark.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'logo-dark.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'logo-dark.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    hmr: {
      protocol: 'ws',
      host: 'localhost',
    },
  },
});