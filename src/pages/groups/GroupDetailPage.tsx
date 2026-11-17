import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ApiError, errorMessage } from '../../api/errors'
import { useGroup, useGroupPings, useGroups, useLeaveGroup, useMe, useMissionToday } from '../../api/queries'
import { isMoodPromptDue } from '../../features/selectors'
import type { GroupMember } from '../../api/types'
import { Character } from '../../components/character/Character'
import { StageBar, StageStepper } from '../../components/character/StageProgress'
import { BottomSheet } from '../../components/ui/BottomSheet'
import { Button, ButtonLink } from '../../components/ui/Button'
import { LoadError, Loading } from '../../components/ui/Loading'
import { PingBadge } from '../../components/ui/Ping'
import { useToast } from '../../components/ui/Toast'
import { useDevice } from '../../device/store'
import { MemberSheet } from '../../features/group/MemberSheet'
import { MissionPanel } from '../../features/mission/MissionPanel'
import { displayStage, groupMetaLabel, progressLabel, stageNameOf, variantOf } from '../../features/selectors'
import styles from './groups.module.css'

type Sheet = null | 'menu' | 'leave'

/** S24 그룹 상세 + S21 미션 준비 (Figma 4) */
export function GroupDetailPage() {
  const groupId = Number(useParams().groupId)
  const location = useLocation()
  const navigate = useNavigate()
  const toast = useToast()
  const device = useDevice()
  const group = useGroup(groupId)
  const pings = useGroupPings(groupId)
  const leave = useLeaveGroup()
  const me = useMe()
  // 오늘 미션은 개인 단위라 내 모든 그룹에 같은 상태다 (MIS-08). 기분 팝업이 닫힌 뒤에만 부른다
  const missionToday = useMissionToday(!isMoodPromptDue(me.data, device.moodPromptDay, device.onboarded))
  const myMission = missionToday.data?.status
  const myGroups = useGroups().data?.groups ?? []
  const [sheet, setSheet] = useState<Sheet>(null)
  const [member, setMember] = useState<GroupMember | null>(null)
  // 온라인 그룹에 막 배정됐을 때 별칭 소개 (UserFlow 6절)
  const justJoined = (location.state as { joinedOnline?: boolean } | null)?.joinedOnline

  if (!Number.isFinite(groupId)) return <Navigate to="/groups" replace />
  if (device.pendingCompletions[groupId]) return <Navigate to={`/groups/${groupId}/completed`} replace />
  if (group.isPending) return <Loading />
  if (group.isError) {
    // 구성원이 아니면 404 (PRD 4절) → 목록으로
    if (group.error instanceof ApiError && group.error.code === 'NOT_FOUND') return <Navigate to="/groups" replace />
    return <LoadError error={group.error} onRetry={() => group.refetch()} />
  }

  const g = group.data
  const meta = groupMetaLabel({ type: g.type, memberCount: g.members.length })

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
        {/* 그룹이 여러 개면 여기서 바로 다른 그룹으로 (각 그룹은 캐릭터를 따로 키운다) */}
        {myGroups.length > 1 ? (
          <nav className={styles.switcher} aria-label="내 그룹 바꾸기">
            {myGroups.map((x) => (
              <Link
                key={x.groupId}
                to={`/groups/${x.groupId}`}
                replace
                className={`${styles.switchPill} ${x.groupId === g.groupId ? styles.switchOn : ''}`}
                aria-current={x.groupId === g.groupId ? 'page' : undefined}
              >
                {x.name}
              </Link>
            ))}
          </nav>
        ) : null}
        {justJoined && g.type === 'ONLINE' ? (
          <p className={styles.aliasCard} role="status">
            이 그룹에서 당신은 <b>'{g.me.displayName}'</b>이에요
          </p>
        ) : null}
        <Link to={`/collection/${g.groupId}/${g.character.characterId ?? 'current'}`} className={styles.heroCharacter} aria-label="성장 과정 보기">
          <Character stage={displayStage(g.character)} variant={variantOf(g.character.kind)} size={112} title={`${g.name}의 ${stageNameOf(g.character)}`} />
        </Link>
        <p className={styles.charName}>
          {g.name}의 {stageNameOf(g.character)}
        </p>        <StageStepper growth={g.character.progress} />
        <div className={styles.heroBar}>
          <StageBar growth={g.character.progress} height={8} track="white" label="캐릭터 성장" />
        </div>
        <p className={styles.heroCount}>
          {progressLabel(g.character)} · 그룹 전체 오늘 {g.today.total}명 중 {g.today.completed}명 완료
        </p>
        {/* 그룹 합계와 헷갈리지 않게 내 상태는 따로 (#19). 이름은 이 그룹에서 보이는 내 이름(친구: 닉네임, 온라인: 별칭) */}
        <p className={styles.myStatus}>
          <span className={styles.myName}>나 · {g.me.displayName}</span>
          {myMission ? (
            <span className={myMission === 'COMPLETED' ? styles.myDone : styles.myTodo}>
              {myMission === 'COMPLETED' ? '오늘 미션 완료' : myMission === 'STARTED' ? '미션 하는 중' : '아직 안 했어요'}
            </span>
          ) : null}
        </p>
        <div className={styles.pingRow}>
          <span>그룹이 오늘 받은 핑</span>
          {!pings.data?.pings.length ? (
            <span className={styles.heroMeta}>아직 없어요</span>
          ) : (
            pings.data.pings.slice(0, 6).map((p, i) => <PingBadge key={i} type={p.emoji} />)
          )}
        </div>
      </header>

      <main className={styles.body}>
        {/* 구성원 (S24): GET /groups/{id}의 members. 친구 그룹은 닉네임, 온라인은 이 그룹 전용 별칭. 누가 했는지는 없다(CHR-10) */}
        <section className={styles.memberCard} aria-label="구성원">
          <div className={styles.memberHead}>
            <h2>구성원 {g.members.length}명</h2>
            <span>{g.type === 'ONLINE' ? '이 그룹에서만 쓰는 별칭' : g.type === 'FRIEND' ? '친구 그룹 · 닉네임' : '1인 그룹'}</span>
          </div>
          <ul className={styles.memberChips}>
            {g.members.map((m) => {
              const isMe = m.memberId === g.me.memberId
              const blocked = device.blockedMemberIds.includes(m.memberId)
              const label = `${m.displayName}${isMe ? ' (나)' : ''}${blocked ? ' · 차단함' : ''}`
              return (
                <li key={m.memberId}>
                  {g.type === 'ONLINE' && !isMe ? (
                    <button type="button" className={styles.memberChip} onClick={() => setMember(m)} aria-label={`${label} · 신고·차단`}>
                      {label}
                    </button>
                  ) : (
                    <span className={`${styles.memberChip} ${isMe ? styles.memberChipMe : ''}`}>{label}</span>
                  )}
                </li>
              )
            })}
          </ul>
          <p className={styles.memberNote}>
            누가 미션을 했는지는 보이지 않아요.{g.type === 'ONLINE' ? ' 구성원을 누르면 차단·신고할 수 있어요.' : ''}
          </p>
          {g.type === 'FRIEND' && g.members.length < 6 ? (
            <Link to={`/groups/${g.groupId}/invite`} className={styles.memberInvite}>
              친구 초대하기 ›
            </Link>
          ) : null}
        </section>
        <MissionPanel fromGroupId={g.groupId} />
      </main>

      <BottomSheet open={sheet === 'menu'} onClose={() => setSheet(null)} label="그룹 메뉴">
        <h2 className={styles.sheetTitle}>{g.name}</h2>

        {g.type === 'FRIEND' ? (
          <ButtonLink to={`/groups/${g.groupId}/invite`} size="md">
            친구 초대 · {g.members.length}/6명
          </ButtonLink>
        ) : null}

        <p className={styles.intro}>
          그룹에는 '몇 명 중 몇 명'만 보이고, 누가 했는지는 보이지 않아요. 기분·점검·도움받기 기록도 보이지 않아요.
        </p>
        <ButtonLink to={`/groups/${g.groupId}/collection`} variant="secondary" size="md">
          그룹 도감
        </ButtonLink>
        <Button variant="ghost" className={styles.danger} onClick={() => setSheet('leave')}>
          그룹 나가기
        </Button>
      </BottomSheet>

      <MemberSheet groupId={g.groupId} groupName={g.name} member={member} onClose={() => setMember(null)} />

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
