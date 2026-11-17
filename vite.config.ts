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
            // 글꼴(앱이 직접 주는 Jua·IBM Plex Sans KR). 글자 범위별 조각이 450개(6MB)라 미리 다 받지 않고,
            // 화면에 나온 글자의 조각만 받은 뒤 기기에 남긴다. 파일 이름에 해시가 있어 바뀌면 새로 받는다.
            urlPattern: ({ url, sameOrigin }) => sameOrigin && /\.woff2?$/.test(url.pathname),
            handler: 'CacheFirst',
            options: {
              cacheName: 'fonts',
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [200] },
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
