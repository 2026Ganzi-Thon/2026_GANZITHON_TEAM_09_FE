import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Page, PageHeader } from '../../components/layout/Page'
import { BottomSheet } from '../../components/ui/BottomSheet'
import { Button, ButtonLink } from '../../components/ui/Button'
import { useToast } from '../../components/ui/Toast'
import { deleteMemory, useMemory } from '../../device/memories'
import { memoryDateLabel } from '../../features/memory/format'
import { useMissionTexts } from '../../features/memory/useMissionTexts'
import styles from './memories.module.css'

/** 추억 기록 상세 (/my/memories/:date): 날짜 · 미션명 · 사진 · 메모 */
export function MemoryDetailPage() {
  const { date = '' } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const memory = useMemory(date)
  const textOf = useMissionTexts(memory ? [memory] : [])
  const [confirm, setConfirm] = useState(false)

  if (!memory) return <Navigate to="/my/memories" replace />

  const remove = async () => {
    try {
      await deleteMemory(date)
      toast('기록을 지웠어요')
      navigate('/my/memories', { replace: true })
    } catch {
      toast('기록을 지우지 못했어요')
    }
  }

  return (
    <Page withTabBar gap={14}>
      <PageHeader title={memoryDateLabel(date)} back backFallback="/my/memories" />
      <div>
        <p className={styles.eyebrow}>오늘의 내 미션</p>
        <p className={styles.mission}>{textOf(memory) ?? '미션 이름을 불러오지 못했어요'}</p>
      </div>
      {memory.photo ? <img src={memory.photo} alt={`${memoryDateLabel(date)} 미션 사진`} className={styles.photo} /> : null}
      {memory.memo ? <p className={styles.memo}>{memory.memo}</p> : null}
      <div className={styles.actions}>
        <ButtonLink to={`/record/${date}`} variant="secondary">
          고치기
        </ButtonLink>
        <Button variant="ghost" onClick={() => setConfirm(true)}>
          기록 지우기
        </Button>
      </div>

      <BottomSheet open={confirm} onClose={() => setConfirm(false)} label="기록 지우기 확인">
        <h2 className={styles.sheetTitle}>이 날의 기록을 지울까요?</h2>
        <p className={styles.note}>사진과 메모가 이 기기에서 지워지고 되돌릴 수 없어요. 미션 완료 기록은 그대로예요.</p>
        <Button onClick={remove}>지우기</Button>
        <Button variant="ghost" onClick={() => setConfirm(false)}>
          취소
        </Button>
      </BottomSheet>
    </Page>
  )
}
