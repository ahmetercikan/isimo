import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import pkg from './package.json';

// base: './' → GitHub Pages alt yolu (kullanici.github.io/isimo/) ve Capacitor paketi aynı build ile çalışır.
export default defineConfig({
  base: './',
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  build: { chunkSizeWarningLimit: 900 },
  plugins: [
    react(),
    // "Ana ekrana ekle": telefonda/tablette uygulama gibi açılır (ikon: scripts/make-icons.mts)
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'icons/*.png'],
      manifest: {
        name: 'İsim Şehir — Online Kelime Oyunu',
        short_name: 'İsim Şehir',
        description: 'Arkadaşlarınla online İsim Şehir oyna: harfi çevir, elinle yaz, ilk sen STOP de!',
        lang: 'tr',
        theme_color: '#16a6c4',
        background_color: '#cfeee6',
        display: 'standalone',
        orientation: 'any',
        start_url: './',
        scope: './',
        categories: ['games', 'education', 'entertainment'],
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,webp,woff2,woff}'],
        globIgnores: ['**/node_modules/**/*', 'voice/**/*'],
        runtimeCaching: [
          {
            // Sunucu sesleri: çalındıkça önbelleğe alınır
            urlPattern: ({ url }) => url.pathname.includes('/voice/') && url.pathname.endsWith('.mp3'),
            handler: 'CacheFirst',
            options: { cacheName: 'voice', expiration: { maxEntries: 120 }, cacheableResponse: { statuses: [200] } },
          },
          {
            urlPattern: ({ url }) => url.pathname.endsWith('/voice/manifest.json'),
            handler: 'NetworkFirst',
            options: { cacheName: 'voice-manifest', networkTimeoutSeconds: 3, expiration: { maxEntries: 2 } },
          },
        ],
      },
    }),
  ],
  test: {
    environment: 'node',
    exclude: ['**/node_modules/**', '**/dist/**'],
  },
});
