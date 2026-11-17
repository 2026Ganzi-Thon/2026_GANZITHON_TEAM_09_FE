import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Page, PageHeader, Spacer } from '../../components/layout/Page'
import { Button } from '../../components/ui/Button'
import { TextField } from '../../components/ui/Form'
import { errorMessage } from '../../api/errors'
import { useCreateAccount, useMe, usePatchMe } from '../../api/queries'
import { validateNickname } from '../../features/profile/nickname'
import { updateDevice } from '../../device/store'
import styles from './onboarding.module.css'

/** S04 닉네임: 여기서 익명 계정을 만든다 (POST /accounts) */
export function NicknamePage() {
  const me = useMe()
  const navigate = useNavigate()
  const create = useCreateAccount()
  const patch = usePatchMe()
  const [nickname, setNickname] = useState(me.data?.nickname ?? '')
  const [touched, setTouched] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const error = validateNickname(nickname)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setTouched(true)
    if (error) return
    try {
      if (me.data) await patch.mutateAsync(nickname.trim())
      else await create.mutateAsync(nickname.trim())
      updateDevice({ onboardingStep: 'profile' })
      navigate('/onboarding/profile')
    } catch (err) {
      setServerError(errorMessage(err, '계정을 만들지 못했어요'))
    }
  }

  return (
    <Page gap={20}>
      <PageHeader title="닉네임" back={me.data ? '/welcome' : '/onboarding/install'} />
      <p className={styles.desc}>친구 그룹에서 보이는 이름이에요. 온라인 그룹에서는 그룹마다 랜덤 별칭이 대신 보여요.</p>
      <form onSubmit={submit} style={{ display: 'contents' }}>
        <TextField
          label="닉네임"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          onBlur={() => setTouched(true)}
          maxLength={10}
          placeholder="예: 소은"
          autoComplete="nickname"
          suffix={`${nickname.trim().length} / 10`}
          error={(touched ? error : null) ?? serverError}
        />
        <p className={styles.infoCard}>
          <b>로그인 없이 시작해요</b>
          이 기기에 계정이 만들어져요. 브라우저 데이터를 지우면 계정이 사라질 수 있어요.
        </p>
        <Spacer />
        <Button type="submit" disabled={touched && !!error} loading={create.isPending || patch.isPending}>
          다음
        </Button>
      </form>
    </Page>
  )
}
