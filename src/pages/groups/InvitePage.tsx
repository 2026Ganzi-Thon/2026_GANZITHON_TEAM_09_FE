import { useEffect, useRef } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { ApiError, errorMessage } from '../../api/errors'
import { useCreateInvite, useGroup } from '../../api/queries'
import { Card, Page, PageHeader } from '../../components/layout/Page'
import { Button } from '../../components/ui/Button'
import { LoadError, Loading } from '../../components/ui/Loading'
import { useToast } from '../../components/ui/Toast'
import { updateDevice, useDevice } from '../../device/store'
import { useNow } from '../../hooks/useNow'
import styles from './groups.module.css'

const formatCode = (code: string) => (code.length === 8 ? `${code.slice(0, 4)} ${code.slice(4)}` : code)
const formatUntil = (iso: string) => {
  const d = new Date(iso)
  return `${d.getMonth() + 1}월 ${d.getDate()}일까지 쓸 수 있어요`
}

/**
 * S09 친구 초대 (Figma 16). 친구 그룹 구성원만. 코드는 8자, 7일 뒤 만료, 새로 만들면 이전 코드는 무효(GRP-04).
 */
export function InvitePage() {
  const groupId = Number(useParams().groupId)
  const toast = useToast()
  const now = useNow()
  const device = useDevice()
  const group = useGroup(groupId)
  const create = useCreateInvite()
  const requested = useRef(false)

  const invite = device.invites[groupId]
  const valid = !!invite && Date.parse(invite.expiresAt) > now

  const makeCode = async (announce: boolean) => {
    try {
      const res = await create.mutateAsync(groupId)
      updateDevice((d) => ({ invites: { ...d.invites, [groupId]: res } }))
      if (announce) toast('새 코드를 만들었어요. 이전 코드는 더 이상 쓸 수 없어요')
    } catch (e) {
      toast(errorMessage(e))
    }
  }

  // 들어왔을 때 쓸 수 있는 코드가 없으면 한 번 만든다
  useEffect(() => {
    if (group.data?.type === 'FRIEND' && !valid && !requested.current) {
      requested.current = true
      void makeCode(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group.data?.type, valid])

  if (group.isPending) return <Loading />
  if (group.isError) {
    if (group.error instanceof ApiError && group.error.code === 'NOT_FOUND') return <Navigate to="/groups" replace />
    return <LoadError error={group.error} onRetry={() => group.refetch()} />
  }
  const g = group.data
  if (g.type !== 'FRIEND') return <Navigate to={`/groups/${g.groupId}`} replace />

  const copy = async () => {
    if (!invite) return
    try {
      await navigator.clipboard.writeText(invite.code)
      toast('코드를 복사했어요')
    } catch {
      toast(`코드: ${formatCode(invite.code)}`)
    }
  }

  const share = async () => {
    if (!invite) return
    const text = `행운핑에서 같이 미션해요! 초대 코드: ${formatCode(invite.code)}`
    try {
      if (navigator.share) await navigator.share({ text })
      else await copy()
    } catch {
      /* 공유를 취소함 */
    }
  }

  return (
    <Page withTabBar gap={14}>
      <PageHeader title="친구 초대" back backFallback={`/groups/${g.groupId}`} />
      <p className={styles.intro}>
        {g.name} · 친구 그룹 {g.members.length}/6명
      </p>
      <section className={styles.inviteBox}>
        <span className={styles.inviteLabel}>초대 코드</span>
        {valid && invite ? (
          <>
            <span className={styles.inviteCode}>{formatCode(invite.code)}</span>
            <span className={styles.codeMeta}>{formatUntil(invite.expiresAt)}</span>
          </>
        ) : (
          <Loading label="코드를 만드는 중" />
        )}
      </section>
      <div className={styles.row}>
        <Button variant="secondary" disabled={!valid} onClick={copy}>
          코드 복사
        </Button>
        <Button disabled={!valid} onClick={share}>
          공유하기
        </Button>
      </div>
      <Card>
        <h2 className={styles.optionTitle}>친구가 할 일</h2>
        <p className={styles.intro}>행운핑을 열고 그룹 탭 + → '코드 입력'에 이 코드를 넣으면 돼요.</p>
      </Card>
      {g.members.length >= 6 ? <p className={styles.error}>그룹이 가득 찼어요. 6명까지 함께할 수 있어요.</p> : null}
      <p className={styles.notice}>새 코드를 만들면 지금 코드는 더 이상 쓸 수 없어요.</p>
      <Button variant="ghost" loading={create.isPending && valid} onClick={() => makeCode(true)}>
        새 코드 만들기
      </Button>
    </Page>
  )
}
