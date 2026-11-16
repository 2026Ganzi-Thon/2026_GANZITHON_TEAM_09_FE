import { errorMessage } from '../../api/errors'
import { Button } from './Button'
import styles from './Loading.module.css'

/** 화면 데이터를 불러오는 중 */
export function Loading({ label = '불러오는 중' }: { label?: string }) {
  return (
    <div className={styles.wrap} role="status" aria-live="polite">
      <span className={styles.dots} aria-hidden>
        <i />
        <i />
        <i />
      </span>
      <span className="visually-hidden">{label}</span>
    </div>
  )
}

/** 불러오지 못했을 때 (오프라인이면 "연결되면 갱신돼요") */
export function LoadError({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div className={styles.error} role="alert">
      <p>{errorMessage(error, '불러오지 못했어요')}</p>
      {onRetry ? (
        <Button size="md" variant="secondary" block={false} onClick={onRetry}>
          다시 불러오기
        </Button>
      ) : null}
    </div>
  )
}
