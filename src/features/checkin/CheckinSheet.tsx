import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { errorMessage } from '../../api/errors'
import { useDismissCheck, useSubmitCheck } from '../../api/queries'
import { BottomSheet } from '../../components/ui/BottomSheet'
import { Button } from '../../components/ui/Button'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { useToast } from '../../components/ui/Toast'
import { CHECKIN_OPTIONS, CHECKIN_QUESTIONS } from '../../data/checkin'
import styles from './CheckinSheet.module.css'

/** P02 주간 마음 점검. 닫으면 그 주에는 다시 띄우지 않는다 (POST /checks/current/dismiss) */
export function CheckinSheet({ open, onClose }: { open: boolean; onClose?: () => void }) {
  const navigate = useNavigate()
  const toast = useToast()
  const submit = useSubmitCheck()
  const dismiss = useDismissCheck()
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<(number | undefined)[]>([])

  const total = CHECKIN_QUESTIONS.length
  const question = CHECKIN_QUESTIONS[step]
  const current = answers[step]

  const reset = () => {
    setStep(0)
    setAnswers([])
  }

  const close = () => {
    dismiss.mutate()
    reset()
    onClose?.()
  }

  const next = async () => {
    if (current === undefined) return
    if (step < total - 1) {
      setStep(step + 1)
      return
    }
    try {
      const result = await submit.mutateAsync(answers as number[])
      reset()
      onClose?.()
      // 결과(문장·구역)는 화면 이동 상태로만 넘긴다. 점수는 받지 않는다 (CHK-04)
      navigate('/checkin/result', { state: result })
    } catch (e) {
      toast(errorMessage(e, '점검을 저장하지 못했어요'))
    }
  }

  return (
    <BottomSheet open={open} onClose={close} label="이번 주 마음 점검">
      <div className={styles.head}>
        <h2 className={styles.title}>이번 주 마음 점검</h2>
        <button type="button" className={styles.close} onClick={close} aria-label="점검 닫기">
          ✕
        </button>
      </div>
      <div className={styles.progressRow}>
        <ProgressBar value={step + 1} max={total} label="점검 진행" />
        <span className={styles.step}>
          {step + 1} / {total}
        </span>
      </div>
      <p className={styles.question} id="checkin-q">
        {question.text}
      </p>
      <div className={styles.options} role="radiogroup" aria-labelledby="checkin-q">
        {CHECKIN_OPTIONS.map((label, value) => (
          <button
            key={label}
            type="button"
            role="radio"
            aria-checked={current === value}
            className={`${styles.option} ${current === value ? styles.optionOn : ''}`}
            onClick={() => setAnswers((a) => Object.assign([...a], { [step]: value }))}
          >
            {label}
          </button>
        ))}
      </div>
      <p className={styles.note}>진단이 아니에요 · 응답은 나만 봐요</p>
      <Button disabled={current === undefined} loading={submit.isPending} onClick={next}>
        {step < total - 1 ? '다음' : '결과 보기'}
      </Button>
      {step > 0 ? (
        <Button variant="ghost" onClick={() => setStep(step - 1)}>
          이전 문항
        </Button>
      ) : (
        <Button variant="ghost" onClick={close}>
          이번 주는 건너뛰기
        </Button>
      )}
      <p className={styles.helpLink}>
        지금 많이 힘들면 <Link to="/help">도움받기 ›</Link>
      </p>
    </BottomSheet>
  )
}
