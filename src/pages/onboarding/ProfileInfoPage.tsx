import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Page, PageHeader } from '../../components/layout/Page'
import { Button } from '../../components/ui/Button'
import { useMe } from '../../api/queries'
import { getDeviceProfile, setDeviceProfile, type DeviceProfile } from '../../device/profile'
import { dayKeyOf } from '../../features/date'
import { ProfileFields } from '../../features/profile/ProfileFields'
import { updateDevice } from '../../device/store'
import { useNow } from '../../hooks/useNow'
import styles from './onboarding.module.css'

/** S05 선택 정보 (건너뛰기 가능, 이 기기에만 저장 — 서버로 보내지 않음) */
export function ProfileInfoPage() {
  const me = useMe()
  const now = useNow()
  const navigate = useNavigate()
  const [draft, setDraft] = useState<DeviceProfile>(getDeviceProfile())

  const save = () => {
    setDeviceProfile(draft)
    updateDevice({ onboardingStep: 'consent' })
    navigate('/onboarding/consent')
  }

  return (
    <Page gap={18}>
      <PageHeader title="" back="/onboarding/nickname" />
      <p className={styles.step}>2 / 4</p>
      <div>
        <h1 className={styles.lead}>나에게 맞는 도움을 찾아 드릴게요</h1>
        <p className={styles.desc}>모두 선택이에요. 이 기기에만 저장되고, 입력하지 않으면 전체 목록을 보여 드려요.</p>
      </div>
      <ProfileFields value={draft} onChange={setDraft} maxDate={me.data?.today ?? dayKeyOf(now)} />
      <Button onClick={save}>다음</Button>
      <Button
        variant="ghost"
        onClick={() => {
          updateDevice({ onboardingStep: 'consent' })
          navigate('/onboarding/consent')
        }}
      >
        나중에 할게요
      </Button>
    </Page>
  )
}
