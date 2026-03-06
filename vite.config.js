import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true
      },
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],
        globIgnores: ['assets/icons/*'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/open\.er-api\.com\/v6\/latest\/USD$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'usd-rate-cache',
              networkTimeoutSeconds: 4,
              expiration: {
                maxEntries: 6,
                maxAgeSeconds: 24 * 60 * 60
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      manifest: {
        id: '/',
        name: 'TradeEase',
        short_name: 'TradeEase',
        description: 'Import calculator, invoices & debt ledger for Nigerian traders',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#0B1120',
        theme_color: '#00C896',
        orientation: 'portrait',
        icons: [
          {
            src: '/assets/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/assets/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
});
