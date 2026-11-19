import { useState } from 'react'
import { Link } from 'react-router-dom'
import { errorMessage } from '../../api/errors'
import { useMe, usePutMood } from '../../api/queries'
import type { Mood } from '../../api/types'
import { BottomSheet } from '../../components/ui/BottomSheet'
import { Button } from '../../components/ui/Button'
import { MoodChip } from '../../components/ui/MoodChip'
import { useToast } from '../../components/ui/useToast'
import { MOOD_OPTIONS } from '../../data/moods'
import { updateDevice } from '../../device/store'
import styles from './MoodSheet.module.css'

/**
 * P01 기분 팝업: 하루 한 번. 띄운 날짜를 기기에 저장하고 GET /me의 today와 비교한다.
 * 건너뛰면 저장하지 않는다(MOOD-03). 팝업 위에서도 도움받기로 갈 수 있다.
 */
export function MoodSheet({ open }: { open: boolean }) {
  const me = useMe()
  const toast = useToast()
  const save = usePutMood()
  const [selected, setSelected] = useState<Mood | null>(null)

  const close = () => updateDevice({ moodPromptDay: me.data?.today })

  const submit = async () => {
    if (!selected) return
    try {
      await save.mutateAsync(selected)
      close()
    } catch (e) {
      toast(errorMessage(e, '기분을 저장하지 못했어요'))
    }
  }

  return (
    <BottomSheet open={open} onClose={close} label="오늘 기분 입력" dismissible={false}>
      <div className={styles.head}>
        <h2 className={styles.title}>오늘 기분은 어때요?</h2>
        <p className={styles.sub}>하루 한 번만 물어볼게요. 기록은 나만 봐요.</p>
      </div>
      <div className={styles.grid} role="radiogroup" aria-label="오늘 기분">
        {MOOD_OPTIONS.map((m) => (
          <MoodChip key={m.id} label={m.label} color={m.color} tint={m.tint} edge={m.edge} selected={selected === m.id} onSelect={() => setSelected(m.id)} />
        ))}
      </div>
      <Button disabled={!selected} loading={save.isPending} onClick={submit}>
        기록하기
      </Button>
      <Button variant="ghost" onClick={close}>
        오늘은 건너뛰기
      </Button>
      <p className={styles.helpLink}>
        지금 많이 힘들면 <Link to="/help">도움받기 ›</Link>
      </p>
    </BottomSheet>
  )
}
