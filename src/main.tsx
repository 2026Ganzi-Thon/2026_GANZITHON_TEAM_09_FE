import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import App from './app/App.tsx'
import { loadDeviceProfile } from './device/profile'

// 선택 정보(IndexedDB)를 먼저 불러 둔 뒤 그린다 (도움받기 필터가 첫 화면부터 맞게)
void loadDeviceProfile().finally(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
