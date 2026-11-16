import styles from './ProgressBar.module.css'

/** Figma Progress (6px) / 그룹 상세(10px, 흰 트랙) */
interface ProgressBarProps {
  value: number
  max?: number
  height?: 6 | 10
  track?: 'soft' | 'white'
  label: string
  width?: number | string
}

export function ProgressBar({ value, max = 100, height = 6, track = 'soft', label, width = '100%' }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div
      className={`${styles.track} ${track === 'white' ? styles.white : ''}`}
      style={{ height, borderRadius: height / 2, width }}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.round(value * 10) / 10}
      aria-label={label}
    >
      <div className={styles.fill} style={{ width: `${pct}%`, borderRadius: height / 2 }} />
    </div>
  )
}
