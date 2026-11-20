import { useEffect } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useDismissHelpCard, useGroups, useHelpCard, useLeaveOnlineQueue, useMe, useMissionToday, useMoods } from '../../api/queries'
import { Character } from '../../components/character/Character'
import { GroupCard } from '../../components/group/GroupCard'
import { EmptyState, Page, PageHeader } from '../../components/layout/Page'
import { Button, ButtonLink } from '../../components/ui/Button'
import { HelpCard } from '../../components/ui/HelpCard'
import { LoadError, Loading } from '../../components/ui/Loading'
import { useDevice } from '../../device/store'
import { isMoodPromptDue } from '../../features/selectors'
import { useFinishMission } from '../../features/mission/useFinishMission'
import { useOnline } from '../../hooks/useOnline'
import { useNow } from '../../hooks/useNow'
import type { MissionToday } from '../../api/types'
import styles from './groups.module.css'

const MAX_GROUPS = 3

/** S20 그룹 탭 (첫 화면): 가벼운 도움 카드, 오늘의 내 미션, 내 그룹 목록 */
export function GroupsHomePage() {
  const navigate = useNavigate()
  const me = useMe()
  const device = useDevice()
  // 오늘 미션은 기분 팝업을 닫은 뒤(입력·건너뛰기) 부른다 — 주제 배정에 오늘 기분을 쓰기 때문
  const moodDue = isMoodPromptDue(me.data, device.moodPromptDay, device.onboarded)
  const groups = useGroups()
  const mission = useMissionToday(!moodDue)
  const helpCard = useHelpCard()
  const dismissCard = useDismissHelpCard()
  const leaveQueue = useLeaveOnlineQueue()

  const list = groups.data?.groups ?? []
  // S26: 다 자란 캐릭터가 있으면 그 그룹을 처음 볼 때 완성 화면을 한 번 보여준다
  const pendingDone = Object.keys(device.pendingCompletions).map(Number).find((id) => list.some((g) => g.groupId === id))
  const waiting = !!groups.data?.queue.waiting
  // 대기 중이면 배정됐는지 주기적으로 확인 (실서버는 배정되면 웹 푸시도 보낸다)
  const refetchGroups = groups.refetch
  useEffect(() => {
    if (!waiting) return
    const id = window.setInterval(() => void refetchGroups(), 10_000)
    return () => window.clearInterval(id)
  }, [waiting, refetchGroups])
  const slots = list.length + (waiting ? 1 : 0)
  const canAdd = slots < MAX_GROUPS
  const m = mission.data
  const online = useOnline()

  if (pendingDone !== undefined && !moodDue) return <Navigate to={`/groups/${pendingDone}/completed`} />

  return (
    <Page withTabBar gap={14}>
      <PageHeader
        title="내 그룹"
        action={
          canAdd ? (
            <Link to="/groups/new" className={styles.addButton} aria-label="그룹 만들기·참여">
              +
            </Link>
          ) : null
        }
      />

      {helpCard.data?.show ? (
        <HelpCard
          as="div"
          title="요즘 지친 날이 이어졌네요"
          sub={
            <>
              가볍게 들를 곳을 모아 봤어요 ·{' '}
              <button type="button" className={styles.inlineClose} onClick={() => dismissCard.mutate()}>
                닫기 ✕
              </button>
            </>
          }
          trailing={
            <button type="button" className={styles.cardChevron} onClick={() => navigate('/help')} aria-label="도움받기로 가기">
              ›
            </button>
          }
        />
      ) : null}

      {!online ? (
        <p className={styles.offline} role="status">
          인터넷 연결이 끊겼어요 · 마지막으로 받은 내용을 보여 드려요. 연결되면 갱신돼요
        </p>
      ) : null}

      {m ? <HomeMissionCard mission={m} groupCount={list.length} /> : null}

      {waiting ? (
        <section className={styles.waitCard}>
          <p className={styles.waitTitle}>함께할 사람을 찾고 있어요</p>
          <p className={styles.waitSub}>온라인 그룹 · 4명이 모이면 시작해요. 모이면 알림으로 알려드릴게요.</p>
          <Button size="md" variant="secondary" loading={leaveQueue.isPending} onClick={() => leaveQueue.mutate()}>
            기다리기 그만하기
          </Button>
        </section>
      ) : null}

      {groups.isPending ? (
        <Loading />
      ) : groups.isError ? (
        <LoadError error={groups.error} onRetry={() => groups.refetch()} />
      ) : list.length === 0 && !waiting ? (
        <EmptyState illustration={<Character stage={1} size={110} />} title="그룹을 만들어 함께 키워요">
          <p>친구와, 온라인에서 처음 만난 사람들과, 혹은 혼자서도 캐릭터를 키울 수 있어요.</p>
          <ButtonLink to="/groups/new">그룹 만들기·참여</ButtonLink>
        </EmptyState>
      ) : (
        <>
          {list.map((g) => (
            <GroupCard key={g.groupId} group={g} />
          ))}
          {!canAdd ? <p className={styles.limit}>그룹은 {MAX_GROUPS}개까지 참여할 수 있어요</p> : null}
        </>
      )}
    </Page>
  )
}

const pad = (n: number) => String(n).padStart(2, '0')

/** 홈의 오늘 미션 카드. 진행 중이면 지난 시간과 '다 했어요'를 바로 보여준다 (S20 · MIS-07) */
function HomeMissionCard({ mission: m, groupCount }: { mission: MissionToday; groupCount: number }) {
  const device = useDevice()
  const me = useMe()
  const online = useOnline()
  const { finish, isPending } = useFinishMission()
  // 미션 카드는 기분 팝업을 닫은 뒤에야 보이므로 '기분을 고른 뒤 정해져요'는 맞지 않는다.
  // 동의하고 오늘 기분을 남긴 사람에게만 기분에 맞춘 추천이라고 알려 준다 (MIS-02)
  const consent = !!me.data?.sensitiveConsent
  const moods = useMoods(m.date, m.date, consent)
  const moodToday = consent && !!moods.data?.moods.some((x) => x.date === m.date)
  const sub = m.status === 'COMPLETED' ? '오늘은 이 정도면 충분해요' : moodToday ? '오늘 기분에 맞춰 크기를 추천했어요 · 바꿀 수 있어요' : '크기와 밖/안은 내가 골라요'
  const started = m.status === 'STARTED'
  const now = useNow(started ? 1000 : 60_000)
  const title = (m.place ?? m.defaults.place) === 'INDOOR' ? m.topic.indoorText : m.topic.outdoorText
  const eyebrow = `오늘의 내 미션${m.status === 'COMPLETED' ? ' · 완료' : groupCount > 1 ? ` · 내 그룹 ${groupCount}곳에 함께 반영돼요` : ''}`

  if (started) {
    const choice = device.missionChoice?.day === m.date ? device.missionChoice : undefined
    const startedAt = choice?.startedAtLocal ?? (m.startedAt ? Date.parse(m.startedAt) : now)
    const sec = Math.max(0, Math.floor((now - startedAt) / 1000))
    const elapsed = sec >= 3600 ? `${Math.floor(sec / 3600)}:${pad(Math.floor((sec % 3600) / 60))}:${pad(sec % 60)}` : `${pad(Math.floor(sec / 60))}:${pad(sec % 60)}`
    return (
      <section className={styles.missionCard}>
        <Link to="/mission/timer" className={styles.missionText}>
          <span className={styles.eyebrow}>{eyebrow}</span>
          <span className={styles.missionTitle}>{title}</span>
          <span className={styles.missionSub}>
            진행 중 · <span className={styles.elapsed}>{elapsed}</span> 지났어요 ›
          </span>
        </Link>
        <button type="button" className={styles.missionCta} disabled={!online || isPending} onClick={() => void finish(m.date)}>
          다 했어요
        </button>
      </section>
    )
  }

  return (
    <Link to="/mission" className={styles.missionCard}>
      <span className={styles.missionText}>
        <span className={styles.eyebrow}>{eyebrow}</span>
        <span className={styles.missionTitle}>{title}</span>
        <span className={styles.missionSub}>{sub}</span>
      </span>
      <span className={styles.missionCta}>{m.status === 'COMPLETED' ? '완료' : '시작'}</span>
    </Link>
  )
}
