import { Navigate, useParams } from 'react-router-dom'
import { useHelpItems, useMe } from '../../api/queries'
import { Page, PageHeader } from '../../components/layout/Page'
import { LoadError, Loading } from '../../components/ui/Loading'
import { useDeviceProfile } from '../../device/profile'
import { useDevice } from '../../device/store'
import { dayKeyOf, formatMonthDay } from '../../features/date'
import { findHelpItem } from '../../features/help/helpFilter'
import { useNow } from '../../hooks/useNow'
import styles from './HelpDetailPage.module.css'

/** S41 도움받을 곳 상세 (/help/:serviceId). 계정 없이, 오프라인에서도 열린다. 이용 기록은 저장하지 않는다 */
export function HelpDetailPage() {
  const { serviceId = '' } = useParams()
  const me = useMe()
  const now = useNow()
  const device = useDevice()
  const profile = useDeviceProfile()
  const items = useHelpItems()
  const onboarded = !!me.data && device.onboarded

  if (items.isPending) return <Loading />
  if (items.isError) return <LoadError error={items.error} onRetry={() => items.refetch()} />
  const service = findHelpItem(items.data.items, serviceId, { profile, today: me.data?.today ?? dayKeyOf(now) })
  if (!service) return <Navigate to="/help" replace />
  const is24h = service.section === 'CRISIS_24H'

  return (
    <Page withTabBar={onboarded} gap={14}>
      <PageHeader title="도움받을 곳" back backFallback="/help" />
      <div className={styles.head}>
        {is24h ? <span className={styles.badge}>24시간</span> : null}
        <h2 className={styles.title}>{service.name}</h2>
      </div>
      <dl className={styles.info}>
        {service.target ? (
          <div>
            <dt>대상</dt>
            <dd>{service.target}</dd>
          </div>
        ) : null}
        {service.applyMethod ? (
          <div>
            <dt>이용 방법</dt>
            <dd>{service.applyMethod}</dd>
          </div>
        ) : null}
        {service.deadline ? (
          <div>
            <dt>기한</dt>
            <dd>{service.deadline}</dd>
          </div>
        ) : null}
        {service.address ? (
          <div>
            <dt>주소</dt>
            <dd>{service.address}</dd>
          </div>
        ) : null}
      </dl>
      {service.note ? <p className={styles.note}>{service.note}</p> : null}
      {service.phone ? (
        <a className={styles.call} href={`tel:${service.phone.replace(/-/g, '')}`}>
          {service.phone} 전화하기
        </a>
      ) : null}
      {service.url ? (
        <a className={styles.link} href={service.url} target="_blank" rel="noopener noreferrer">
          공식 페이지 열기 ↗
        </a>
      ) : null}
      <p className={styles.basis}>
        {items.data.syncedAt ? `공공서비스(혜택) 정보 · ${formatMonthDay(dayKeyOf(Date.parse(items.data.syncedAt)))} 기준. ` : ''}
        신청 결과와 일정은 각 기관에서 확인해 주세요.
      </p>
    </Page>
  )
}
