import type { CSSProperties } from 'react'
import styles from './MoodChip.module.css'

/**
 * Figma MoodChip: 상태=기본 / 선택. 색 점 + 텍스트 라벨 (화면낭독기 대응, NFR-06).
 * 감정마다 연한 배경색을 깔고, 선택하면 진한 테두리와 ✓로 표시한다.
 */
interface MoodChipProps {
  label: string
  color: string
  tint: string
  edge: string
  selected: boolean
  onSelect: () => void
}

export function MoodChip({ label, color, tint, edge, selected, onSelect }: MoodChipProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      className={`${styles.chip} ${selected ? styles.selected : ''}`}
      style={{ '--dot': color, '--tint': tint, '--edge': edge } as CSSProperties}
      onClick={onSelect}
    >
      <span className={styles.dot} aria-hidden />
      <span className={styles.label}>
        {selected ? (
          <span className={styles.check} aria-hidden>
            ✓{' '}
          </span>
        ) : null}
        {label}
      </span>
    </button>
  )
}
