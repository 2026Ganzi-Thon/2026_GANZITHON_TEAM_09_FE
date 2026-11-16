import { Link } from 'react-router-dom'
import { useHelpItems, useHelpSignals, useMe } from '../../api/queries'
import { EmptyState, Page, PageHeader, SectionLabel } from '../../components/layout/Page'
import { HelpCard } from '../../components/ui/HelpCard'
import { LoadError, Loading } from '../../components/ui/Loading'
import { useDeviceProfile } from '../../device/profile'
import { useDevice } from '../../device/store'
import { dayKeyOf, formatMonthDay } from '../../features/date'
import { helpListFor, profileIsEmpty } from '../../features/help/helpFilter'
import { HelpServiceCard } from '../../features/help/HelpServiceCard'
import { useNow } from '../../hooks/useNow'
import styles from './help.module.css'

/**
 * S40 도움받기. 계정 없이도(HELP-01), 인터넷이 끊겨도(HELP-05 캐시) 열린다.
 * 위급한 순서대로: 24시간 → 상담 → 가볍게. 이용 기록은 저장하지 않는다(HELP-08).
 */
export function HelpPage() {
  const me = useMe()
  const now = useNow()
  const device = useDevice()
  const profile = useDeviceProfile()
  const items = useHelpItems()
  const signals = useHelpSignals()
  const onboarded = !!me.data && device.onboarded
  const today = me.data?.today ?? dayKeyOf(now)

  return (
    <Page withTabBar={onboarded} gap={8}>
      <PageHeader title="도움받기" back={onboarded ? undefined : '/welcome'} />
      <p className={styles.lead}>로그인 없이도, 인터넷이 끊겨도 열려요 · 앱은 위기를 감지하지 못해요</p>

      {items.isPending ? (
        <Loading />
      ) : items.isError ? (
        <LoadError error={items.error} onRetry={() => items.refetch()} />
      ) : (
        (() => {
          const list = helpListFor(items.data.items, { profile, today, signals: signals.data })
          const base = items.data.syncedAt ? formatMonthDay(dayKeyOf(Date.parse(items.data.syncedAt))) : null
          return (
            <>
              <SectionLabel>지금 바로 이야기할 곳 · 24시간</SectionLabel>
              <ul className={styles.list}>
                {list.CRISIS_24H.map((s) => (
                  <li key={s.id}>
                    <HelpServiceCard service={s} />
                  </li>
                ))}
              </ul>

              {profileIsEmpty(profile) ? (
                <div className={styles.personalize}>
                  <HelpCard
                    title="정보를 입력하면 맞춤화된 복지 지원서비스를 찾을 수 있어요!"
                    sub="생년월일·사는 곳·지금 하는 일 (모두 선택, 이 기기에만 저장)"
                    as="div"
                    trailing={
                      <Link to={onboarded ? '/my/profile' : '/welcome'} className={styles.personalizeLink}>
                        입력
                      </Link>
                    }
                  />
                </div>
              ) : null}

              <SectionLabel>상담받을 곳</SectionLabel>
              <ul className={styles.list}>
                {list.COUNSELING.map((s) => (
                  <li key={s.id}>
                    <HelpServiceCard service={s} />
                  </li>
                ))}
              </ul>

              <SectionLabel>가볍게 들를 곳</SectionLabel>
              {list.DROP_IN.length === 0 ? (
                <EmptyState title="사는 곳 근처에 아직 안내할 곳이 없어요">
                  <p>지금은 서울 사업만 담겨 있어요. 지역을 넓혀 갈게요.</p>
                </EmptyState>
              ) : (
                <ul className={styles.list}>
                  {list.DROP_IN.map((s) => (
                    <li key={s.id}>
                      <HelpServiceCard service={s} />
                    </li>
                  ))}
                </ul>
              )}

              <p className={styles.footer}>
                이 앱은 치료 서비스가 아니고 위기를 감지하지 못해요. 지금 힘들면 24시간 채널로 연락하세요.
                {base ? (
                  <>
                    <br />
                    상담·들를 곳은 공공서비스(혜택) 정보 {base} 기준
                  </>
                ) : null}
              </p>
            </>
          )
        })()
      )}
    </Page>
  )
}
