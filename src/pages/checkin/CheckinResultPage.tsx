import { Link, Navigate, useLocation } from 'react-router-dom'
import { useHelpItems, useHelpSignals, useMe } from '../../api/queries'
import type { CheckSubmitResponse } from '../../api/types'
import { Page, PageHeader, SectionLabel } from '../../components/layout/Page'
import { ButtonLink } from '../../components/ui/Button'
import { HelpCard } from '../../components/ui/HelpCard'
import { Loading } from '../../components/ui/Loading'
import { useDeviceProfile } from '../../device/profile'
import { helpListFor, profileBasisLabel } from '../../features/help/helpFilter'
import { HelpServiceCard } from '../../features/help/HelpServiceCard'
import { JOB_LABELS } from '../../features/profile/jobs'
import styles from './checkin.module.css'

/**
 * P03 점검 결과 (Figma 8). 점수 대신 문장(CHK-04), 결과별 구역(CHK-06).
 * 결과는 제출 응답으로만 받으므로 이 화면은 제출 직후에만 열린다.
 */
export function CheckinResultPage() {
  const location = useLocation()
  const me = useMe()
  const profile = useDeviceProfile()
  const items = useHelpItems()
  const signals = useHelpSignals()
  const result = location.state as CheckSubmitResponse | null
  if (!result?.results) return <Navigate to="/groups" replace />
  if (items.isPending) return <Loading />

  const today = me.data?.today ?? ''
  const list = helpListFor(items.data?.items ?? [], { profile, today, signals: signals.data })
  const basis = profileBasisLabel(profile, today, (j) => JOB_LABELS[j])
  const show = (s: CheckSubmitResponse['sections'][number]) => result.sections.includes(s)
  const crisisNames = list.CRISIS_24H.slice(0, 2)
    .map((s) => s.name)
    .join(' · ')

  return (
    <Page gap={10}>
      <PageHeader title="점검 결과" back="/groups" />
      <section className={styles.summary}>
        {result.messages.map((m) => (
          <h2 key={m} className={styles.summaryTitle}>
            {m}
          </h2>
        ))}
        <p className={styles.summaryDesc}>
          {result.notice}.{result.sections.length ? ' 이야기할 수 있는 곳을 찾아봤어요.' : ' 힘든 날엔 언제든 도움받기를 열어 보세요.'}
        </p>
      </section>

      {show('CRISIS_24H') ? (
        <Link className={styles.crisisLink} to="/help">
          <HelpCard as="div" tone="strong" title="지금 많이 힘들면 · 24시간" sub={crisisNames} />
        </Link>
      ) : null}

      {show('COUNSELING') ? (
        <>
          <SectionLabel>상담받을 곳{basis ? ` · ${basis}` : ''}</SectionLabel>
          <ul className={styles.list}>
            {list.COUNSELING.slice(0, 4).map((s) => (
              <li key={s.id}>
                <HelpServiceCard service={s} />
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {show('DROP_IN') ? (
        <>
          <SectionLabel>가볍게 들를 곳</SectionLabel>
          <ul className={styles.list}>
            {list.DROP_IN.map((s) => (
              <li key={s.id}>
                <HelpServiceCard service={s} />
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {show('COUNSELING') ? <p className={styles.note}>앱의 점검 결과는 바우처 등 신청 증빙이 되지 않아요.</p> : null}
      <p className={styles.note}>
        지금 힘들면 <Link to="/help">24시간 채널</Link>로 연락하세요.
      </p>
      <div className={styles.bottom}>
        <ButtonLink to="/help" variant="secondary">
          도움받기 전체 보기
        </ButtonLink>
      </div>
    </Page>
  )
}
