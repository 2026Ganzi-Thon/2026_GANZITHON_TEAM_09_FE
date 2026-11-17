import { pingByType } from '../../data/pings'
import type { PingEmoji } from '../../api/types'
import styles from './Ping.module.css'

/** Figma Ping: 종류=잘했어(별) / 클로버 / 응원해(하트) / 햇살 (44px 원) */
export function PingBadge({ type, size = 44 }: { type: PingEmoji; size?: number }) {
  const ping = pingByType(type)
  return (
    <span className={styles.badge} style={{ width: size, height: size }} role="img" aria-label={`${ping.label} 핑`}>
      <img src={ping.icon} width={24} height={24} alt="" />
    </span>
  )
}

interface PingOptionProps {
  type: PingEmoji
  selected: boolean
  onSelect: () => void
}

/** 완료 화면의 핑 선택. 선택되면 바깥 테두리 링(54px) */
export function PingOption({ type, selected, onSelect }: PingOptionProps) {
  const ping = pingByType(type)
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={ping.label}
      className={`${styles.option} ${selected ? styles.selected : ''}`}
      onClick={onSelect}
    >
      <span className={styles.badge}>
        <img src={ping.icon} width={24} height={24} alt="" />
      </span>
      <span className={styles.optionLabel}>{ping.label}</span>
    </button>
  )
}
