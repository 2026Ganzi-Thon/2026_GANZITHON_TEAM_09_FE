import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { errorMessage } from '../../api/errors'
import { useGroups, useMissionToday, useSendPing } from '../../api/queries'
import type { PingEmoji } from '../../api/types'
import { Character } from '../../components/character/Character'
import { StageBar } from '../../components/character/StageProgress'
import { Page } from '../../components/layout/Page'
import { Button } from '../../components/ui/Button'
import { Loading } from '../../components/ui/Loading'
import { PingOption } from '../../components/ui/Ping'
import { useToast } from '../../components/ui/Toast'
import { sizeUnit } from '../../data/missions'
import { PINGS } from '../../data/pings'
import { updateDevice, useDevice } from '../../device/store'
import { formatGrowth, stageOf, STAGE_NAMES, withEuro } from '../../features/character/growth'
import { missionText } from '../../features/mission/missionText'
import { progressLabel, variantOf } from '../../features/selectors'
import type { CharacterStage } from '../../types/domain'
import { useMemory } from '../../device/memories'
import { isWritingMission } from '../../features/memory/format'
import type { MemoryEditState } from '../memories/MemoryEditPage'
import styles from './mission.module.css'

/** S23 완료 · 이모티콘 핑 (Figma 6). 핑은 선택이고, 한 번 보내면 내 모든 그룹에 간다 (PING-02) */
export function MissionDonePage() {
  const navigate = useNavigate()
  const toast = useToast()
  const device = useDevice()
  const mission = useMissionToday()
  const groups = useGroups()
  const send = useSendPing()
  // 추억 기록을 쓰고 돌아와도 고른 핑이 남아 있게 (기록 화면이 돌려준다)
  const returned = useLocation().state as { ping?: PingEmoji | null } | null
  const [ping, setPing] = useState<PingEmoji | null>(returned?.ping ?? null)
  const memory = useMemory(mission.data?.date)

  if (mission.isPending || groups.isPending) return <Loading />
  const m = mission.data
  if (!m || m.status !== 'COMPLETED') return <Navigate to="/groups" replace />

  const list = groups.data?.groups ?? []
  // 완료 결과(성장 전후)는 기기에 남아 있어 새로고침해도 그대로 보여준다
  const completion = device.lastCompletion?.day === m.date ? device.lastCompletion : undefined
  const main = list.find((g) => g.groupId === completion?.fromGroupId) ?? list[0]
  const result = completion?.groups.find((g) => g.groupId === main?.groupId)
  const after = result?.after ?? main?.character.progress ?? 0
  const delta = result ? Math.max(0, Math.round((result.after - result.before) * 10) / 10) : 0
  const grew = !!result && result.stageAfter > result.stageBefore
  const stageChangedGroups = (completion?.groups ?? []).filter((g) => g.stageAfter > g.stageBefore).length
  const pinged = device.pingDays.includes(m.date)
  const place = m.place ?? m.defaults.place
  const text = missionText(m, place)
  // '오늘 좋았던 일 하나 적기' 같은 미션은 적을 칸을 핑보다 먼저 보여준다 (#7)
  const writing = isWritingMission(text)
  // 기록을 저장하거나 취소하면 이 완료 화면으로 돌아와 핑을 이어서 남긴다
  const openRecord = () =>
    navigate(`/record/${m.date}`, { state: { missionText: text, writing, returnTo: '/mission/done', returnState: { ping } } satisfies MemoryEditState })

  const recordCard = (
    <section className={`${styles.recordCard} ${writing && !memory ? styles.recordCardStrong : ''}`}>
      {memory ? (
        <>
          <Link to={`/my/memories/${m.date}`} className={styles.recordSaved}>
            {memory.photo ? <img src={memory.photo} alt="오늘 남긴 사진" className={styles.photo} /> : null}
            <span className={styles.recordSavedText}>
              <b>추억 기록에 남겼어요</b>
              <span>{memory.memo ?? '사진을 남겼어요'}</span>
            </span>
          </Link>
          <button type="button" className={styles.photoButton} onClick={openRecord}>
            고치기
          </button>
        </>
      ) : (
        <>
          <p className={styles.recordTitle}>{writing ? '오늘 좋았던 일을 한 줄로 적어 보세요' : '오늘을 사진이나 한 줄 메모로 남겨 볼까요?'}</p>
          <p className={styles.recordSub}>선택 · 나만 봐요 · 이 기기에만 저장돼요</p>
          <Button size="md" variant={writing ? 'primary' : 'secondary'} onClick={openRecord}>
            {writing ? '좋았던 일 적기' : '사진·메모 남기기'}
          </Button>
        </>
      )}
    </section>
  )

  const leave = () => navigate(main ? `/groups/${main.groupId}` : '/groups', { replace: true })

  const submitPing = async () => {
    if (!ping) return
    try {
      await send.mutateAsync(ping)
      updateDevice((d) => ({ pingDays: [...d.pingDays, m.date] }))
      toast('핑을 남겼어요')
      leave()
    } catch (e) {
      if (e instanceof Error && 'code' in e && e.code === 'ALREADY_PINGED') updateDevice((d) => ({ pingDays: [...d.pingDays, m.date] }))
      toast(errorMessage(e, '핑을 남기지 못했어요'))
    }
  }

  return (
    <Page gap={14} className={styles.donePage}>
      <h1 className={styles.doneTitle}>다 했어요!</h1>
      {/* Figma 6: "내 그룹 3곳에 반영됐어요 · 우리 셋" (뒤는 아래 성장 카드의 그룹) */}
      <p className={styles.doneSub}>
        {list.length > 1 ? `내 그룹 ${list.length}곳에 반영됐어요` : '내 그룹에 반영됐어요'}
        {main ? ` · ${main.name}` : ''}
      </p>
      <p className={styles.others}>
        {text} {m.size ?? ''}
        {m.size ? sizeUnit(m.topic) : ''}
      </p>

      {main ? (
        <section className={styles.growCard}>
          <span className={styles.plus}>{delta > 0 ? `+${formatGrowth(delta)}` : '+1명'}</span>
          <Character stage={(result?.stageAfter ?? stageOf(after)) as CharacterStage} variant={variantOf(main.character.kind)} size={120} mood="happy" bounce />
          <div className={styles.growBar}>
            <StageBar growth={after} height={10} track="white" label={`${main.name} 캐릭터 성장`} />
          </div>
          {grew && result ? (
            <p className={styles.growText}>
              {STAGE_NAMES[result.stageBefore as CharacterStage]}에서 {withEuro(STAGE_NAMES[result.stageAfter as CharacterStage])}, {result.stageAfter}단계가 됐어요!
            </p>
          ) : null}
          <p className={styles.growMeta}>
            {main.name} · {progressLabel({ progress: after })} · 오늘 {result?.total ?? main.today.total}명 중 {result?.completed ?? main.today.completed}명 완료
          </p>
        </section>
      ) : null}

      {list.length > 1 ? (
        <p className={styles.others}>
          {list.filter((g) => g.groupId !== main?.groupId).map((g) => g.name).join(', ')}에도 함께 반영됐어요
          {stageChangedGroups > (grew ? 1 : 0) ? ' · 단계가 바뀐 그룹이 있어요' : ''}
        </p>
      ) : null}

      {writing ? recordCard : null}

      {pinged ? (
        <p className={styles.pingNote}>오늘 핑은 이미 남겼어요</p>
      ) : (
        <>
          <p className={styles.pingLabel}>내 그룹에 핑 남기기 (선택)</p>
          <div className={styles.pingRow} role="radiogroup" aria-label="핑 고르기">
            {PINGS.map((p) => (
              <PingOption key={p.type} type={p.type} selected={ping === p.type} onSelect={() => setPing(p.type)} />
            ))}
          </div>
          <p className={styles.pingNote}>핑은 내 모든 그룹에 이름 없이 한 번에 가요. 글은 쓸 수 없어요.</p>
        </>
      )}

      {writing ? null : recordCard}

      <div className={styles.doneActions}>
        {pinged ? (
          <Button onClick={leave}>확인</Button>
        ) : (
          <>
            <Button disabled={!ping} loading={send.isPending} onClick={submitPing}>
              핑 남기기
            </Button>
            <Button variant="ghost" onClick={leave}>
              남기지 않기
            </Button>
          </>
        )}
      </div>
    </Page>
  )
}
