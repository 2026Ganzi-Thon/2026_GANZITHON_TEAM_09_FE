import { useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
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
import styles from './mission.module.css'

/** 사진은 개인 기록용: 작게 줄여 기기에만 저장 */
async function shrinkImage(file: File): Promise<string> {
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image()
      i.onload = () => resolve(i)
      i.onerror = reject
      i.src = url
    })
    const scale = Math.min(1, 480 / Math.max(img.width, img.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(img.width * scale)
    canvas.height = Math.round(img.height * scale)
    canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', 0.75)
  } finally {
    URL.revokeObjectURL(url)
  }
}

/** S23 완료 · 이모티콘 핑 (Figma 6). 핑은 선택이고, 한 번 보내면 내 모든 그룹에 간다 (PING-02) */
export function MissionDonePage() {
  const navigate = useNavigate()
  const toast = useToast()
  const device = useDevice()
  const mission = useMissionToday()
  const groups = useGroups()
  const send = useSendPing()
  const [ping, setPing] = useState<PingEmoji | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

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
  const photo = device.missionPhotos[m.date]
  const place = m.place ?? m.defaults.place

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
      <p className={styles.doneSub}>
        {missionText(m, place)} {m.size ?? ''}
        {m.size ? sizeUnit(m.topic) : ''} · 내 그룹 {list.length}곳에 반영됐어요
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

      <div className={styles.photoRow}>
        {photo ? <img src={photo} alt="오늘 미션 사진" className={styles.photo} /> : null}
        <button type="button" className={styles.photoButton} onClick={() => fileRef.current?.click()}>
          {photo ? '사진 바꾸기' : '사진 남기기 (선택 · 나만 봐요)'}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={async (e) => {
            const file = e.target.files?.[0]
            if (!file) return
            try {
              const dataUrl = await shrinkImage(file)
              updateDevice((d) => ({ missionPhotos: { ...d.missionPhotos, [m.date]: dataUrl } }))
              toast('사진을 내 기록에 남겼어요')
            } catch {
              toast('사진을 불러오지 못했어요')
            }
          }}
        />
      </div>

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
