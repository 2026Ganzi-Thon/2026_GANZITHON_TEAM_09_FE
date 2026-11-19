import { useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Page, PageHeader } from '../../components/layout/Page'
import { Button } from '../../components/ui/Button'
import { TextField } from '../../components/ui/Form'
import { useToast } from '../../components/ui/useToast'
import { MEMO_MAX, saveMemory, useMemory } from '../../device/memories'
import { memoryDateLabel } from '../../features/memory/format'
import { shrinkImage } from '../../features/memory/image'
import { useMissionTexts } from '../../features/memory/useMissionTexts'
import styles from './memories.module.css'

export interface MemoryEditState {
  /** 완료 화면에서 넘기는 오늘 미션 문구 */
  missionText?: string
  /** '적기' 미션이면 메모 칸을 먼저 */
  writing?: boolean
  /** 저장·취소 뒤 돌아갈 화면 (완료 화면에서 오면 '/mission/done' — 핑을 이어서 남길 수 있게) */
  returnTo?: string
  /** 돌아갈 때 그대로 넘겨줄 화면 상태 (완료 화면에서 고른 핑) */
  returnState?: unknown
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

/**
 * 추억 기록 남기기·고치기 (/record/:date): 사진 미리보기 + 한 줄 메모(40자).
 * 이 기기에만 저장한다. 완료 화면(S23)과 추억 기록 상세에서 들어온다.
 */
export function MemoryEditPage() {
  const { date = '' } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const state = (useLocation().state as MemoryEditState | null) ?? {}
  const existing = useMemory(date)
  const textOf = useMissionTexts(existing ? [existing] : [])
  const missionText = state.missionText ?? (existing ? textOf(existing) : undefined)
  const [photo, setPhoto] = useState(existing?.photo)
  const [memo, setMemo] = useState(existing?.memo ?? '')
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  if (!DATE_RE.test(date)) return <Navigate to="/my/memories" replace />

  // 들어온 곳이 정해져 있으면(완료 화면) 그곳으로. 뒤로가기 기록에 기대지 않는다 — 새로 연 앱이나 화면 교체 뒤에는 기록이 없어
  // 완료 화면 대신 추억 기록 상세로 가 버려 핑을 남기지 못하던 문제
  const leave = () => {
    if (state.returnTo) {
      navigate(state.returnTo, { replace: true, state: state.returnState })
      return
    }
    const canGoBack = ((window.history.state as { idx?: number } | null)?.idx ?? 0) > 0
    if (canGoBack) navigate(-1)
    else navigate(`/my/memories/${date}`, { replace: true })
  }

  const empty = !photo && !memo.trim()
  const save = async () => {
    setSaving(true)
    try {
      await saveMemory(date, { photo, memo, missionText })
      toast(empty ? '기록을 지웠어요' : '추억 기록에 남겼어요')
      leave()
    } catch {
      toast('기록을 저장하지 못했어요. 기기 저장 공간을 확인해 주세요')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Page gap={14}>
      <PageHeader title={existing ? '기록 고치기' : '기록 남기기'} back backFallback={`/my/memories/${date}`} />
      <div>
        <p className={styles.eyebrow}>{memoryDateLabel(date)} · 오늘의 내 미션</p>
        {missionText ? <p className={styles.mission}>{missionText}</p> : null}
      </div>

      {photo ? (
        <>
          <img src={photo} alt="고른 사진 미리보기" className={styles.photo} />
          <div className={styles.photoActions}>
            <Button size="md" variant="secondary" onClick={() => fileRef.current?.click()}>
              사진 바꾸기
            </Button>
            <Button size="md" variant="ghost" onClick={() => setPhoto(undefined)}>
              사진 빼기
            </Button>
          </div>
        </>
      ) : (
        <button type="button" className={styles.pick} onClick={() => fileRef.current?.click()}>
          사진 고르기
          <small>선택 · 찍거나 앨범에서 골라요</small>
        </button>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={async (e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (!file) return
          try {
            setPhoto(await shrinkImage(file))
          } catch {
            toast('사진을 불러오지 못했어요')
          }
        }}
      />

      <TextField
        label={state.writing ? '오늘 좋았던 일' : '한 줄 메모'}
        optional
        value={memo}
        maxLength={MEMO_MAX}
        autoFocus={state.writing}
        placeholder={state.writing ? '예: 점심이 맛있었어요' : '예: 바람이 시원했어요'}
        suffix={`${memo.length} / ${MEMO_MAX}`}
        onChange={(e) => setMemo(e.target.value.slice(0, MEMO_MAX))}
      />
      <p className={styles.note}>사진과 메모는 이 기기에만 저장돼요. 그룹에는 보이지 않아요.</p>

      <div className={styles.actions}>
        <Button loading={saving} disabled={empty && !existing} onClick={save}>
          {empty && existing ? '기록 지우기' : '저장하기'}
        </Button>
        <Button variant="ghost" onClick={leave}>
          취소
        </Button>
      </div>
    </Page>
  )
}
