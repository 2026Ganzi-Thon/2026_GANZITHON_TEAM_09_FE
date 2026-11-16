import { useEffect, useState } from 'react'

/**
 * 렌더 중 Date.now()를 직접 부르지 않도록 현재 시각을 상태로 둔다.
 * intervalMs를 주면 그 간격과 화면 복귀 때마다 갱신한다 (타이머).
 */
export function useNow(intervalMs?: number): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!intervalMs) return
    const tick = () => setNow(Date.now())
    const id = window.setInterval(tick, intervalMs)
    document.addEventListener('visibilitychange', tick)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [intervalMs])
  return now
}
