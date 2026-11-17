import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Page, PageHeader } from '../../components/layout/Page'
import { Button } from '../../components/ui/Button'
import { updateDevice } from '../../device/store'
import { enablePush } from '../../services/notifications'
import styles from './onboarding.module.css'

/** S07 알림 허용 (Figma 24). 허용하면 웹 푸시 구독을 서버에 등록한다 */
export function NotificationsPermissionPage() {
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  const next = () => {
    updateDevice({ onboardingStep: 'group' })
    navigate('/onboarding/group')
  }

  const allow = async () => {
    setBusy(true)
    const result = await enablePush()
    setBusy(false)
    if (result === 'subscribed' || result === 'granted') return next()
    setStatus(
      result === 'unsupported'
        ? '이 브라우저에서는 알림을 받을 수 없어요. 아이폰은 홈 화면에 추가한 앱에서만 알림이 와요.'
        : '알림은 나중에 마이 › 알림에서 켤 수 있어요.',
    )
  }

  return (
    <Page gap={14}>
      <PageHeader title="알림을 켤까요?" back="/onboarding/consent" />
      <p className={styles.desc}>꼭 필요한 알림만 보내요. 언제든 마이 탭에서 끌 수 있어요.</p>
      <ul className={styles.platformCard}>
        <li className={styles.notiItem}>
          <b>미션 알림</b>
          내가 정한 시각에, 아직 미션을 안 한 날만
        </li>
        <li className={styles.notiItem}>
          <b>마음 점검 알림</b>
          일요일 저녁 6시, 한 주에 한 번
        </li>
        <li className={styles.notiItem}>
          <b>핑은 알림으로 오지 않아요</b>
          그룹 화면에서만 볼 수 있어요
        </li>
      </ul>
      <p className={styles.infoCard}>
        <b>잠금 화면에 보일 수 있어서</b>
        알림에는 기분이나 점검 내용을 쓰지 않아요.
      </p>
      {status ? (
        <p role="status" className={styles.infoCard}>
          {status}
        </p>
      ) : null}
      <Button loading={busy} onClick={status ? next : allow}>
        {status ? '다음' : '알림 켜기'}
      </Button>
      {!status ? (
        <Button variant="ghost" onClick={next}>
          나중에
        </Button>
      ) : null}
    </Page>
  )
}
