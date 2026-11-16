import { Link, useNavigate } from 'react-router-dom'
import { useDismissHelpCard, useGroups, useHelpCard, useLeaveOnlineQueue, useMe, useMissionToday } from '../../api/queries'
import { Character } from '../../components/character/Character'
import { GroupCard } from '../../components/group/GroupCard'
import { EmptyState, Page, PageHeader } from '../../components/layout/Page'
import { Button, ButtonLink } from '../../components/ui/Button'
import { HelpCard } from '../../components/ui/HelpCard'
import { LoadError, Loading } from '../../components/ui/Loading'
import { useDevice } from '../../device/store'
import { isMoodPromptDue } from '../../features/selectors'
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
  const waiting = !!groups.data?.queue.waiting
  const slots = list.length + (waiting ? 1 : 0)
  const canAdd = slots < MAX_GROUPS
  const m = mission.data

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

      {m ? (
        <Link to="/mission" className={styles.missionCard}>
          <span className={styles.missionText}>
            <span className={styles.eyebrow}>
              오늘의 내 미션{m.status === 'COMPLETED' ? ' · 완료' : list.length > 1 ? ` · 내 그룹 ${list.length}곳에 함께 반영돼요` : ''}
            </span>
            <span className={styles.missionTitle}>{(m.place ?? m.defaults.place) === 'INDOOR' ? m.topic.indoorText : m.topic.outdoorText}</span>
            <span className={styles.missionSub}>
              {m.status === 'COMPLETED' ? '오늘은 이 정도면 충분해요' : m.status === 'STARTED' ? '진행 중이에요' : '크기와 밖/안은 내가 골라요'}
            </span>
          </span>
          <span className={styles.missionCta}>{m.status === 'COMPLETED' ? '완료' : m.status === 'STARTED' ? '이어하기' : '시작'}</span>
        </Link>
      ) : null}

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
