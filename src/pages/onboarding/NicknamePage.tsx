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
      <PageHeader title="" back={me.data ? undefined : '/onboarding/install'} />
      <p className={styles.step}>1 / 4</p>
      <h1 className={styles.lead}>어떻게 불러 드릴까요?</h1>
      <p className={styles.infoCard}>
        <b>로그인 없이 시작해요</b>
        이 기기에 계정이 만들어져요. 브라우저 데이터를 지우면 계정이 사라질 수 있어요.
      </p>
      <form onSubmit={submit} style={{ display: 'contents' }}>
        <TextField
          label="닉네임"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          onBlur={() => setTouched(true)}
          maxLength={10}
          placeholder="예: 소은"
          autoComplete="nickname"
          hint="친구 그룹에서만 보여요. 온라인 그룹에서는 랜덤 별칭을 써요."
          error={(touched ? error : null) ?? serverError}
        />
        <span className={styles.counter} aria-hidden>
          {nickname.trim().length} / 10
        </span>
        <Spacer />
        <Button type="submit" disabled={touched && !!error} loading={create.isPending || patch.isPending}>
          다음
        </Button>
      </form>
    </Page>
  )
}
