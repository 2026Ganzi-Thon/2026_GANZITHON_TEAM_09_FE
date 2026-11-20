import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useGroups, useMissionToday } from '../../api/queries'
import { Page } from '../../components/layout/Page'
import { BottomSheet } from '../../components/ui/BottomSheet'
import { Button } from '../../components/ui/Button'
import { Loading } from '../../components/ui/Loading'
import { sizeUnit } from '../../data/missions'
import { useDevice } from '../../device/store'
import { useFinishMission } from '../../features/mission/useFinishMission'
import { useOnline } from '../../hooks/useOnline'
import { missionText } from '../../features/mission/missionText'
import { useNow } from '../../hooks/useNow'
import styles from './mission.module.css'

const RING_R = 105
const RING_C = 2 * Math.PI * RING_R

function format(sec: number) {
  const s = Math.max(0, Math.ceil(sec))
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

/** S22 타이머 (Figma 5). 시작 시각 기준으로 경과 시간을 계산해 화면을 꺼도 이어진다 (MIS-06) */
export function MissionTimerPage() {
  const navigate = useNavigate()
  const device = useDevice()
  const mission = useMissionToday()
  const groups = useGroups()
  const { finish, isPending: finishing } = useFinishMission()
  const online = useOnline()
  const now = useNow(500)
  const [confirmStop, setConfirmStop] = useState(false)

  if (mission.isPending) return <Loading />
  const m = mission.data
  if (!m || finishing) return <Loading />
  // 기기 캐시로 먼저 그린 값이 '진행 중'이 아니면, 서버에서 새로 받을 때까지 기다린 뒤 이동한다
  if (m.status !== 'STARTED' && mission.isFetching) return <Loading />
  if (m.status === 'COMPLETED') return <Navigate to="/mission/done" replace />
  if (m.status !== 'STARTED') return <Navigate to="/mission" replace />

  // 고른 값: 서버 응답에 있으면 그것, 없으면 시작할 때 기기에 남긴 값
  const choice = device.missionChoice?.day === m.date ? device.missionChoice : undefined
  const minutes = m.minutes ?? choice?.minutes ?? m.defaults.minutes
  const place = m.place ?? choice?.place ?? m.defaults.place
  const size = m.size ?? choice?.size ?? minutes
  const startedAt = choice?.startedAtLocal ?? (m.startedAt ? Date.parse(m.startedAt) : now)
  // 시간형은 기분을 반영한 크기(분)만큼, 횟수형은 고른 시간만큼 잰다
  const total = (m.topic.sizeType === 'TIME' ? size : minutes) * 60
  const elapsed = (now - startedAt) / 1000
  const remaining = total - elapsed
  const ratio = Math.min(1, Math.max(0, elapsed / total))
  const groupCount = groups.data?.groups.length ?? 0

  const done = () => finish(m.date)

  return (
    <Page tone="navy" gap={18} className={styles.timerPage}>
      <h1 className={styles.timerTitle}>
        {missionText(m, place)} · {size}
        {sizeUnit(m.topic)}
      </h1>
      <p className={styles.timerSub}>
        오늘의 내 미션 · {place === 'OUTDOOR' ? '밖에서' : '안에서'}
        {groupCount > 1 ? ` · 내 그룹 ${groupCount}곳에 반영` : ''}
      </p>

      <div className={styles.ring} role="timer" aria-live="off" aria-label={`남은 시간 ${format(remaining)}`}>
        <svg width="230" height="230" viewBox="0 0 230 230" aria-hidden>
          <circle cx="115" cy="115" r={RING_R} stroke="var(--color-navy)" strokeWidth="10" fill="none" />
          <circle
            cx="115"
            cy="115"
            r={RING_R}
            stroke="var(--color-sky)"
            strokeWidth="10"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={RING_C}
            strokeDashoffset={RING_C * (1 - ratio)}
            transform="rotate(-90 115 115)"
            style={{ transition: 'stroke-dashoffset 0.5s linear' }}
          />
        </svg>
        <div className={styles.ringText}>
          <span className={styles.time}>{format(remaining)}</span>
          <span className={styles.timeLabel}>{remaining <= 0 ? '시간이 다 됐어요' : '남은 시간'}</span>
        </div>
      </div>

      <p className={styles.timerNote}>화면을 꺼도 시간은 계속 흘러요</p>

      <div className={styles.timerActions}>
        <Button variant="secondary" disabled={!online} onClick={done}>
          {online ? '다 했어요' : '연결되면 완료할 수 있어요'}
        </Button>
        <Button variant="ghostOnNavy" onClick={() => setConfirmStop(true)}>
          그만하기
        </Button>
      </div>

      <BottomSheet open={confirmStop} onClose={() => setConfirmStop(false)} label="미션 그만하기">
        <h2 className={styles.sheetTitle}>오늘은 여기까지 할까요?</h2>
        <p className={styles.sheetDesc}>괜찮아요. 오늘 안에 언제든 다시 이어서 할 수 있어요.</p>
        <Button onClick={() => navigate(device.missionFromGroupId ? `/groups/${device.missionFromGroupId}` : '/groups', { replace: true })}>
          그만하기
        </Button>
        <Button variant="ghost" onClick={() => setConfirmStop(false)}>
          계속하기
        </Button>
      </BottomSheet>
    </Page>
  )
}
