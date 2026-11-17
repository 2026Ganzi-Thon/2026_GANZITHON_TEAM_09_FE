import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiError } from '../../api/errors'
import { useJoinByInvite } from '../../api/queries'
import { Page, PageHeader, Spacer } from '../../components/layout/Page'
import { Button } from '../../components/ui/Button'
import { TextField } from '../../components/ui/Form'
import { useToast } from '../../components/ui/Toast'
import { updateDevice } from '../../device/store'
import styles from './groups.module.css'

/** UserFlow 6절 오류 문구 */
const ERROR_COPY: Record<string, string> = {
  NOT_FOUND: '코드를 다시 확인해 주세요',
  INVITE_EXPIRED: '만료된 코드예요. 친구에게 새 코드를 받아 주세요.',
  GROUP_FULL: '그룹이 가득 찼어요',
  GROUP_LIMIT: '그룹은 3개까지 참여할 수 있어요',
  ALREADY_MEMBER: '이미 참여 중인 그룹이에요',
  RATE_LIMITED: '잠시 후 다시 시도해 주세요',
}

/** 4자리씩 띄어 보이게: K7MP 2QXR */
const formatInput = (raw: string) => {
  const v = raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)
  return v.length > 4 ? `${v.slice(0, 4)} ${v.slice(4)}` : v
}

/** S10 초대 코드 입력 (Figma 17). 온보딩(S08)과 그룹 추가(S28)에서 쓴다 */
export function JoinByCodePage({ onboarding }: { onboarding?: boolean }) {
  const navigate = useNavigate()
  const toast = useToast()
  const join = useJoinByInvite()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const plain = code.replace(/\s/g, '')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (plain.length !== 8) return
    setError(null)
    try {
      const g = await join.mutateAsync(plain)
      if (onboarding) updateDevice({ onboarded: true, onboardingStep: undefined })
      toast(`'${g.name}'에 들어왔어요`)
      navigate(`/groups/${g.groupId}`, { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? (ERROR_COPY[err.code] ?? err.message) : '잠시 후 다시 시도해 주세요')
    }
  }

  return (
    <Page withTabBar={!onboarding} gap={14}>
      <PageHeader title="코드 입력" back backFallback={onboarding ? '/onboarding/group' : '/groups/new'} />
      <p className={styles.intro}>친구에게 받은 8자리 코드를 넣어 주세요.</p>
      <form onSubmit={submit} style={{ display: 'contents' }}>
        <TextField
          label="초대 코드"
          value={code}
          onChange={(e) => {
            setCode(formatInput(e.target.value))
            setError(null)
          }}
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          inputMode="text"
          placeholder="K7MP 2QXR"
          maxLength={9}
          error={error}
        />
        <Spacer />
        <Button type="submit" disabled={plain.length !== 8} loading={join.isPending}>
          참여하기
        </Button>
      </form>
    </Page>
  )
}
