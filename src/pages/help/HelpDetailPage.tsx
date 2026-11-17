import { Navigate, useParams } from 'react-router-dom'
import { useHelpItems, useHelpSignals, useMe } from '../../api/queries'
import { Page, PageHeader } from '../../components/layout/Page'
import { LoadError, Loading } from '../../components/ui/Loading'
import { useDeviceProfile } from '../../device/profile'
import { useDevice } from '../../device/store'
import { dayKeyOf } from '../../features/date'
import { boostReason, findHelpItem, helpTags, profileBasisLabel, profileIsEmpty, telHref } from '../../features/help/helpFilter'
import { JOB_LABELS } from '../../features/profile/jobs'
import { useNow } from '../../hooks/useNow'
import styles from './HelpDetailPage.module.css'

const GOV24 = (id: string) => `https://www.gov.kr/portal/rcvfvrSvc/dtlEx/${id}`

/**
 * S41 도움받을 곳 상세 (Figma 27): 제목에 사업 이름, 태그, 누가·무엇을·어떻게, 이 카드가 보이는 이유,
 * 공식 페이지 버튼, 정보 기준일. 계정 없이, 오프라인에서도 열린다. 이용 기록은 저장하지 않는다.
 */
export function HelpDetailPage() {
  const { serviceId = '' } = useParams()
  const me = useMe()
  const now = useNow()
  const device = useDevice()
  const profile = useDeviceProfile()
  const items = useHelpItems()
  const signals = useHelpSignals()
  const onboarded = !!me.data && device.onboarded
  const today = me.data?.today ?? dayKeyOf(now)

  if (items.isPending) return <Loading />
  if (items.isError) return <LoadError error={items.error} onRetry={() => items.refetch()} />
  const ctx = { profile, today, signals: signals.data }
  const service = findHelpItem(items.data.items, serviceId, ctx)
  if (!service) return <Navigate to="/help" replace />

  // 연락처가 아직 없는 구 센터는 정부24 정신건강복지센터 안내로
  const officialUrl = service.url ?? (service.sourceServiceId ? GOV24(service.sourceServiceId) : null)
  const basis = profileBasisLabel(profile, today, (j) => JOB_LABELS[j])
  const why = [
    profileIsEmpty(profile) ? '입력한 정보가 없어서 모든 분께 보여 드리는 곳이에요.' : `${basis}로 입력했어요.`,
    boostReason(service, ctx),
  ]
    .filter(Boolean)
    .join(' ')
  const baseDate = items.data.syncedAt ? dayKeyOf(Date.parse(items.data.syncedAt)).replace(/-/g, '.') : null

  return (
    <Page withTabBar={onboarded} gap={14}>
      <PageHeader title={service.name} back backFallback="/help" />
      <ul className={styles.tags}>
        {helpTags(service).map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
      <dl className={styles.info}>
        <div>
          <dt>누가</dt>
          <dd>{service.target ?? '누구나'}</dd>
        </div>
        {service.summary ? (
          <div>
            <dt>무엇을</dt>
            <dd>{service.summary}</dd>
          </div>
        ) : null}
        {service.applyMethod ? (
          <div>
            <dt>어떻게</dt>
            <dd>
              {service.applyMethod}
              {service.deadline ? ` · ${service.deadline}` : ''}
            </dd>
          </div>
        ) : null}
        {service.address ? (
          <div>
            <dt>어디서</dt>
            <dd>{service.address}</dd>
          </div>
        ) : null}
      </dl>
      {service.note ? <p className={styles.note}>{service.note}</p> : null}
      <section className={styles.why}>
        <h2>이 카드가 보이는 이유</h2>
        <p>{why}</p>
      </section>
      {service.phone ? (
        <a className={officialUrl ? styles.link : styles.call} href={telHref(service.phone)}>
          {service.phone} 전화하기
        </a>
      ) : null}
      {officialUrl ? (
        <a className={styles.call} href={officialUrl} target="_blank" rel="noopener noreferrer">
          {service.url ? '공식 페이지에서 신청하기 ↗' : '연락처·위치 찾기 (정부24) ↗'}
        </a>
      ) : null}
      <p className={styles.basis}>
        {baseDate ? `정보 기준일 ${baseDate} · ` : ''}행정안전부 공공서비스(혜택) 정보
        <br />
        신청 결과와 일정은 각 기관에서 확인해 주세요.
      </p>
    </Page>
  )
}
