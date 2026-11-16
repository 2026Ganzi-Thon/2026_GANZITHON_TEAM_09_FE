/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
  // http 모드: 화면과 API를 같은 도메인처럼 쓰도록 /api를 백엔드로 넘긴다 (쿠키 SameSite=Lax)
  server: {
    proxy: {
      '/api': { target: env.VITE_API_PROXY || 'http://localhost:8080', changeOrigin: false },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon.svg'],
      manifest: {
        name: '행운핑',
        short_name: '행운핑',
        description: '함께 하는 작은 활동으로 일상을 돌보고, 힘든 날엔 실제 도움으로 이어주는 앱',
        lang: 'ko',
        start_url: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#f5f9fd',
        theme_color: '#f5f9fd',
        icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
      },
      workbox: {
        // 도움받기 탭은 오프라인에서도 열려야 하므로 앱 셸 전체를 프리캐시한다.
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            // HELP-05: 도움받을 곳 목록은 오프라인에서도 보이게 (stale-while-revalidate)
            urlPattern: ({ url }) => url.pathname === '/api/v1/help/items',
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'help-items', cacheableResponse: { statuses: [0, 200] } },
          },
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
  }
})
