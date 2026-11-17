import { Link, Navigate } from 'react-router-dom'
import { useMe } from '../../api/queries'
import { entryPath } from '../../app/entry'
import { Character } from '../../components/character/Character'
import { ButtonLink } from '../../components/ui/Button'
import { useDevice } from '../../device/store'
import styles from './onboarding.module.css'

/** 기능 소개 아이콘: 둥근 선의 단순한 라인 아이콘 (하늘색 배지 위 네이비 선) */
const SmileIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="9" cy="10.5" r="0.9" fill="currentColor" stroke="none" />
    <circle cx="15" cy="10.5" r="0.9" fill="currentColor" stroke="none" />
    <path d="M9 14.2c1.6 1.6 4.4 1.6 6 0" />
  </svg>
)

const SproutIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20v-7.5" />
    <path d="M12 14C12 10.5 9.5 8.5 6 8.5c0 3.5 2.5 5.5 6 5.5Z" fill="var(--color-sky)" />
    <path d="M12 12.5C12 9 14.5 6.5 18 6.5c0 3.5-2.5 6-6 6Z" fill="var(--color-sky)" />
    <path d="M8.5 20h7" />
  </svg>
)

const HeartIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path
      d="M12 19.5S4.5 15 4.5 9.8A3.8 3.8 0 0 1 12 8.3a3.8 3.8 0 0 1 7.5 1.5C19.5 15 12 19.5 12 19.5Z"
      fill="var(--color-sky)"
    />
  </svg>
)

const FEATURES = [
  { icon: <SmileIcon />, title: '하루 한 번, 기분 한 번 탭' },
  { icon: <SproutIcon />, title: '각자 작은 미션, 함께 키우는 캐릭터' },
  { icon: <HeartIcon />, title: '힘든 날엔 도움받을 곳으로' },
]

/** S01·S02 시작 (Figma 11): 브랜드, 소개, 기능 소개 카드(3줄), 시작하기, 도움받기 링크 */
export function StartPage() {
  const me = useMe()
  const device = useDevice()
  // 이미 계정이 있으면 시작 화면을 건너뛴다 (기존 사용자 자동 진입)
  if (me.data) return <Navigate to={entryPath(me.data, device)} replace />

  return (
    <main className={styles.start}>
      <Character stage={4} size={120} mood="happy" />
      <h1 className={styles.brand}>행운핑</h1>
      <p className={styles.tagline}>
        <span>함께 하는 작은 활동으로 일상을 돌보고,</span>
        <span>힘든 날엔 실제 도움으로 이어줘요</span>
      </p>
      <ul className={styles.featureList}>
        {FEATURES.map((f) => (
          <li key={f.title}>
            <span className={styles.featureIcon} aria-hidden>
              {f.icon}
            </span>
            {f.title}
          </li>
        ))}
      </ul>
      <div className={styles.actions}>
        <ButtonLink to="/onboarding/install">시작하기</ButtonLink>
        <Link to="/help" className={styles.textLink}>
          지금 많이 힘들면 <b>도움받기 ›</b>
        </Link>
      </div>
    </main>
  )
}
