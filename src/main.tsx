import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// 글꼴은 앱이 직접 준다 (외부 글꼴 서버 없이: 화면 CSP는 자기 출처만 허용, 오프라인 시연에서도 같은 글꼴).
// Jua = 제목·브랜드(--font-display), IBM Plex Sans KR = 본문(--font-body). 둘 다 SIL OFL 1.1
import '@fontsource/jua/400.css'
import '@fontsource/ibm-plex-sans-kr/400.css'
import '@fontsource/ibm-plex-sans-kr/500.css'
import '@fontsource/ibm-plex-sans-kr/600.css'
import '@fontsource/ibm-plex-sans-kr/700.css'
import './styles/global.css'
import App from './app/App.tsx'
import { initAccounts } from './device/accounts'
import { loadMemories } from './device/memories'
import { loadDeviceProfile } from './device/profile'

async function boot() {
  // 계정 목록 준비(처음이면 지금 계정을 등록만, 전환 도중 멈춘 경우 되살리기)를 가장 먼저
  const accounts = await initAccounts().catch(() => 'ok' as const)
  if (accounts === 'reload') {
    window.location.reload()
    return
  }
  // 선택 정보·추억 기록(IndexedDB)을 먼저 불러 둔 뒤 그린다 (도움받기 필터가 첫 화면부터 맞게, 예전 사진은 이때 옮긴다)
  await Promise.allSettled([loadDeviceProfile(), loadMemories()])
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void boot()
