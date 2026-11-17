import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
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
