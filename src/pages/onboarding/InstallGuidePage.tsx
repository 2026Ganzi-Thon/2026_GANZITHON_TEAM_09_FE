import { Navigate, useNavigate } from 'react-router-dom'
import { Page, PageHeader } from '../../components/layout/Page'
import { Button } from '../../components/ui/Button'
import styles from './onboarding.module.css'

const isStandalone =
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true)

/**
 * S03 홈 화면 추가 (Figma 12). 계정 만들기(S04) 전에 안내한다.
 * 아이폰은 사파리와 홈 화면 앱의 저장소가 따로라, 추가한 앱에서 이어서 하도록 안내한다.
 */
export function InstallGuidePage() {
  const navigate = useNavigate()
  // 이미 홈 화면 앱으로 열었으면 안내할 필요가 없다
  if (isStandalone) return <Navigate to="/onboarding/nickname" replace />

  return (
    <Page gap={14}>
      <PageHeader title="홈 화면에 추가해 주세요" />
      <p className={styles.desc}>앱처럼 열고 알림을 받으려면 홈 화면에 추가해야 해요.</p>

      <section className={styles.platformCard}>
        <span className={styles.platformTitle}>아이폰 · 사파리</span>
        <ol className={styles.steps}>
          <li>아래 공유 버튼(⬆) 누르기</li>
          <li>'홈 화면에 추가' 누르기</li>
          <li>홈 화면의 행운핑으로 다시 열기</li>
        </ol>
      </section>

      <section className={styles.platformCard}>
        <span className={styles.platformTitle}>안드로이드 · 크롬</span>
        <ol className={styles.steps}>
          <li>오른쪽 위 ⋮ → '홈 화면에 추가'</li>
        </ol>
      </section>

      <p className={styles.infoCard}>
        아이폰은 꼭 추가한 앱에서 이어서 시작해 주세요. 사파리에서 만든 기록은 홈 화면 앱으로 옮겨지지 않아요.
      </p>

      <Button onClick={() => navigate('/onboarding/nickname')}>추가했어요</Button>
      <Button variant="ghost" onClick={() => navigate('/onboarding/nickname')}>
        나중에 할게요
      </Button>
    </Page>
  )
}
