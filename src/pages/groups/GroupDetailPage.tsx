import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { ApiError, errorMessage } from '../../api/errors'
import { useBlockMember, useCreateInvite, useGroup, useGroupPings, useLeaveGroup, useReportMember } from '../../api/queries'
import { Character } from '../../components/character/Character'
import { StageBar, StageStepper } from '../../components/character/StageProgress'
import { BottomSheet } from '../../components/ui/BottomSheet'
import { Button } from '../../components/ui/Button'
import { LoadError, Loading } from '../../components/ui/Loading'
import { PingBadge } from '../../components/ui/Ping'
import { useToast } from '../../components/ui/Toast'
import { updateDevice, useDevice } from '../../device/store'
import { MissionPanel } from '../../features/mission/MissionPanel'
import { displayStage, groupMetaLabel, progressLabel, stageNameOf, variantOf } from '../../features/selectors'
import { useNow } from '../../hooks/useNow'
import styles from './groups.module.css'

type Sheet = null | 'menu' | 'leave'

const formatCode = (code: string) => (code.length === 8 ? `${code.slice(0, 4)} ${code.slice(4)}` : code)

/** S24 그룹 상세 + S21 미션 준비 (Figma 4) */
export function GroupDetailPage() {
  const groupId = Number(useParams().groupId)
  const now = useNow()
  const navigate = useNavigate()
  const toast = useToast()
  const device = useDevice()
  const group = useGroup(groupId)
  const pings = useGroupPings(groupId)
  const invite = useCreateInvite()
  const leave = useLeaveGroup()
  const block = useBlockMember()
  const report = useReportMember()
  const [sheet, setSheet] = useState<Sheet>(null)

  if (!Number.isFinite(groupId)) return <Navigate to="/groups" replace />
  if (group.isPending) return <Loading />
  if (group.isError) {
    // 구성원이 아니면 404 (PRD 4절) → 목록으로
    if (group.error instanceof ApiError && group.error.code === 'NOT_FOUND') return <Navigate to="/groups" replace />
    return <LoadError error={group.error} onRetry={() => group.refetch()} />
  }

  const g = group.data
  const meta = groupMetaLabel({ type: g.type, memberCount: g.members.length })
  const lastInvite = device.invites[g.groupId]
  const inviteValid = lastInvite && Date.parse(lastInvite.expiresAt) > now

  const makeInvite = async () => {
    try {
      const res = await invite.mutateAsync(g.groupId)
      updateDevice((d) => ({ invites: { ...d.invites, [g.groupId]: res } }))
      toast('새 초대 코드를 만들었어요. 이전 코드는 더 이상 쓸 수 없어요')
    } catch (e) {
      toast(errorMessage(e))
    }
  }

  return (
    <>
      <header className={styles.hero}>
        <div className={styles.heroTop}>
          <div className={styles.heroTitle}>
            <button type="button" className={styles.heroBack} onClick={() => navigate('/groups')} aria-label="뒤로">
              ‹
            </button>
            <h1 className={styles.heroName}>{g.name}</h1>
            <span className={styles.heroMeta}>{meta}</span>
          </div>
          <button type="button" className={styles.more} onClick={() => setSheet('menu')} aria-label="그룹 메뉴">
            ⋯
          </button>
        </div>
        <Link to={`/collection/${g.groupId}/${g.character.characterId ?? 'current'}`} className={styles.heroCharacter} aria-label="성장 과정 보기">
          <Character stage={displayStage(g.character)} variant={variantOf(g.character.kind)} size={112} title={`${g.name}의 ${stageNameOf(g.character)}`} />
        </Link>
        <p className={styles.charName}>
          {g.name}의 {stageNameOf(g.character)}
        </p>
        <StageStepper growth={g.character.progress} />
        <div className={styles.heroBar}>
          <StageBar growth={g.character.progress} height={8} track="white" label="캐릭터 성장" />
        </div>
        <p className={styles.heroCount}>
          {progressLabel(g.character)} · 오늘 {g.today.total}명 중 {g.today.completed}명 완료
        </p>
        <div className={styles.pingRow}>
          <span>오늘 받은 핑</span>
          {!pings.data?.pings.length ? (
            <span className={styles.heroMeta}>아직 없어요</span>
          ) : (
            pings.data.pings.slice(0, 6).map((p, i) => <PingBadge key={i} type={p.emoji} />)
          )}
        </div>
      </header>

      <main className={styles.body}>
        <MissionPanel fromGroupId={g.groupId} />
      </main>

      <BottomSheet open={sheet === 'menu'} onClose={() => setSheet(null)} label="그룹 메뉴">
        <h2 className={styles.sheetTitle}>{g.name}</h2>

        {g.type === 'FRIEND' ? (
          <div className={styles.codeBox}>
            {inviteValid ? (
              <>
                <span className={styles.code}>{formatCode(lastInvite.code)}</span>
                <span className={styles.codeMeta}>
                  초대 코드 · {g.members.length}/6명 · {new Date(lastInvite.expiresAt).toLocaleDateString('ko-KR')}까지
                </span>
              </>
            ) : (
              <span className={styles.codeMeta}>친구를 부르려면 초대 코드를 만들어 주세요 · {g.members.length}/6명</span>
            )}
            <Button size="md" variant="secondary" loading={invite.isPending} onClick={makeInvite}>
              {inviteValid ? '새 코드 만들기' : '초대 코드 만들기'}
            </Button>
          </div>
        ) : null}

        <div className={styles.memberList}>
          {g.members.map((m) => {
            const isMe = m.memberId === g.me.memberId
            const blocked = device.blockedMemberIds.includes(m.memberId)
            return (
              <div key={m.memberId} className={styles.memberRow}>
                <span>
                  {m.displayName}
                  {isMe ? ' (나)' : ''}
                  {blocked ? ' · 차단함' : ''}
                </span>
                {g.type === 'ONLINE' && !isMe ? (
                  <span className={styles.memberActions}>
                    <button
                      type="button"
                      onClick={() =>
                        report.mutate(
                          { groupId: g.groupId, memberId: m.memberId, reason: 'OTHER' },
                          { onSuccess: () => toast('신고를 접수했어요. 신고한 사실은 상대에게 알리지 않아요'), onError: (e) => toast(errorMessage(e)) },
                        )
                      }
                    >
                      신고
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        block.mutate(
                          { groupId: g.groupId, memberId: m.memberId, block: !blocked },
                          {
                            onSuccess: () => {
                              updateDevice((d) => ({
                                blockedMemberIds: blocked ? d.blockedMemberIds.filter((x) => x !== m.memberId) : [...d.blockedMemberIds, m.memberId],
                              }))
                              toast(blocked ? '차단을 풀었어요' : '차단했어요. 이 사람이 보낸 핑이 나에게 안 보여요')
                            },
                            onError: (e) => toast(errorMessage(e)),
                          },
                        )
                      }
                    >
                      {blocked ? '차단 풀기' : '차단'}
                    </button>
                  </span>
                ) : null}
              </div>
            )
          })}
        </div>
        <p className={styles.intro}>
          그룹에는 '몇 명 중 몇 명'만 보이고, 누가 했는지는 보이지 않아요. 기분·점검·도움받기 기록도 보이지 않아요.
        </p>
        <Button variant="ghost" className={styles.danger} onClick={() => setSheet('leave')}>
          그룹 나가기
        </Button>
      </BottomSheet>

      <BottomSheet open={sheet === 'leave'} onClose={() => setSheet(null)} label="그룹 나가기 확인">
        <h2 className={styles.sheetTitle}>'{g.name}'에서 나갈까요?</h2>
        <p className={styles.intro}>캐릭터는 그룹에 남아요.</p>
        <Button
          loading={leave.isPending}
          onClick={() =>
            leave.mutate(g.groupId, {
              onSuccess: () => {
                toast('그룹에서 나왔어요')
                navigate('/groups', { replace: true })
              },
              onError: (e) => toast(errorMessage(e)),
            })
          }
        >
          나가기
        </Button>
        <Button variant="ghost" onClick={() => setSheet(null)}>
          취소
        </Button>
      </BottomSheet>
    </>
  )
}
