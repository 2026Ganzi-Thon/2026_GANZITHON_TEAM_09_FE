import { Link, Navigate } from 'react-router-dom'
import { useMe } from '../../api/queries'
import { entryPath } from '../../app/entry'
import { Character } from '../../components/character/Character'
import { ButtonLink } from '../../components/ui/Button'
import { useDevice } from '../../device/store'
import { useAccounts } from '../../device/accounts'
import styles from './onboarding.module.css'

const FEATURES = [
  { icon: '😊', title: '하루 한 번, 기분 한 번 탭' },
  { icon: '🍀', title: '각자 작은 미션, 함께 키우는 캐릭터' },
  { icon: '🤝', title: '힘든 날엔 도움받을 곳으로' },
]

/** S01·S02 시작 (Figma 11): 브랜드, 소개, 기능 소개 카드(3줄), 시작하기, 도움받기 링크 */
export function StartPage() {
  const me = useMe()
  const device = useDevice()
  const savedCount = useAccounts().accounts.length
  // 이미 계정이 있으면 시작 화면을 건너뛴다 (기존 사용자 자동 진입)
  if (me.data) return <Navigate to={entryPath(me.data, device)} replace />

  return (
    <main className={styles.start}>
      <Character stage={4} size={120} mood="happy" />
      <h1 className={styles.brand}>행운핑</h1>
      <p className={styles.tagline}>함께 하는 작은 활동으로 일상을 돌보고, 힘든 날엔 실제 도움으로 이어줘요</p>
      <ul className={styles.featureList}>
        {FEATURES.map((f) => (
          <li key={f.title}>
            <span aria-hidden>{f.icon}</span>
            {f.title}
          </li>
        ))}
      </ul>
      <div className={styles.actions}>
        <ButtonLink to="/onboarding/install">시작하기</ButtonLink>
        <Link to="/help" className={styles.textLink}>
          지금 많이 힘들면 <b>도움받기 ›</b>
        </Link>
        {/* 목업 다중 계정: 이 기기에 보관된 계정이 있으면 돌아갈 수 있게 */}
        {savedCount > 0 ? (
          <Link to="/accounts" className={styles.textLink}>
            저장된 계정 {savedCount}개 <b>계정 관리 ›</b>
          </Link>
        ) : null}
      </div>
    </main>
  )
}
