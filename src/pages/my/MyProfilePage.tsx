import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { errorMessage } from '../../api/errors'
import { useMe, usePatchMe } from '../../api/queries'
import { Page, PageHeader } from '../../components/layout/Page'
import { Button } from '../../components/ui/Button'
import { TextField } from '../../components/ui/Form'
import { useToast } from '../../components/ui/Toast'
import { getDeviceProfile, setDeviceProfile, type DeviceProfile } from '../../device/profile'
import { validateNickname } from '../../features/profile/nickname'
import { ProfileFields } from '../../features/profile/ProfileFields'

/** S50 닉네임(서버) + S42 맞춤 도움 정보(이 기기에만) */
export function MyProfilePage() {
  const me = useMe()
  const navigate = useNavigate()
  const toast = useToast()
  const patch = usePatchMe()
  const [nickname, setNickname] = useState(me.data?.nickname ?? '')
  const [draft, setDraft] = useState<DeviceProfile>(getDeviceProfile())
  const nickError = validateNickname(nickname)

  const save = async () => {
    if (nickError) return
    try {
      if (nickname.trim() !== me.data?.nickname) await patch.mutateAsync(nickname.trim())
      setDeviceProfile(draft)
      toast('저장했어요')
      navigate('/my')
    } catch (e) {
      toast(errorMessage(e, '저장하지 못했어요'))
    }
  }

  return (
    <Page withTabBar gap={18}>
      <PageHeader title="내 정보" back="/my" />
      <TextField label="닉네임" value={nickname} maxLength={10} onChange={(e) => setNickname(e.target.value)} error={nickError} hint="친구 그룹에서 보여요" />
      <ProfileFields value={draft} onChange={setDraft} maxDate={me.data?.today ?? ''} />
      <p style={{ fontSize: 12, color: 'var(--color-mute)' }}>생년월일·사는 곳·지금 하는 일은 이 기기에만 저장되고 서버로 보내지 않아요.</p>
      <Button onClick={save} disabled={!!nickError} loading={patch.isPending}>
        저장하기
      </Button>
    </Page>
  )
}
