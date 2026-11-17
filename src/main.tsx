import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import App from './app/App.tsx'
import { migrateLegacyAccounts } from './device/demoBackup'
import { loadMemories } from './device/memories'
import { loadDeviceProfile } from './device/profile'

async function boot() {
  // 한때 있던 다중 계정 기능의 흔적 정리 (시연 전 계정 → 시연 백업, 도중에 멈춘 경우 되살리기)
  const migrated = await migrateLegacyAccounts().catch(() => 'ok' as const)
  if (migrated === 'reload') {
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
