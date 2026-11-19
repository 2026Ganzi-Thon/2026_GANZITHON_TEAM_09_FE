import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useMe } from '../../api/queries'
import { Character } from '../../components/character/Character'
import { useDevice } from '../../device/store'
import { entryPath } from '../../app/entry'
import styles from './launch.module.css'

/** 브랜드와 캐릭터를 보여주는 최소 시간 약 2초 (계정 확인이 더 오래 걸리면 그만큼 더 보인다) */
const MIN_SHOW_MS = 2000

/**
 * 앱 실행 스플래시 (`/`, PWA start_url).
 * 버튼 없이 계정(GET /me)과 기기 온보딩 상태를 확인해 자동으로 다음 화면으로 간다.
 */
export function LaunchSplashPage() {
  const me = useMe()
  const device = useDevice()
  const [minShown, setMinShown] = useState(false)

  useEffect(() => {
    const id = window.setTimeout(() => setMinShown(true), MIN_SHOW_MS)
    return () => window.clearTimeout(id)
  }, [])

  // 서버에 닿지 못해도(오프라인) 시작은 할 수 있게: 계정 확인 실패 → 기존 사용자면 홈, 아니면 시작 화면
  const ready = minShown && !me.isPending
  if (ready) return <Navigate to={me.isError ? (device.onboarded ? '/groups' : '/welcome') : entryPath(me.data, device)} replace />

  return (
    <main className={styles.splash} aria-busy="true">
      <div className={styles.character}>
        <Character stage={4} size={150} />
      </div>
      <h1 className={styles.brand}>행운핑</h1>
      <p className={styles.tagline}>함께 하는 작은 활동, 힘든 날엔 도움으로</p>
      <span className="visually-hidden" role="status">
        행운핑을 여는 중
      </span>
    </main>
  )
}
