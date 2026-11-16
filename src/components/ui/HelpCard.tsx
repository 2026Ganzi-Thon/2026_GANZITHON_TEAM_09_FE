import type { ReactNode } from 'react'
import styles from './HelpCard.module.css'

/** Figma HelpCard: 톤=기본 / 강조 */
interface HelpCardProps {
  title: ReactNode
  sub?: ReactNode
  tone?: 'default' | 'strong'
  onClick?: () => void
  /** 오른쪽 › 대신 다른 요소 (예: 닫기) */
  trailing?: ReactNode
  as?: 'button' | 'div'
}

export function HelpCard({ title, sub, tone = 'default', onClick, trailing, as }: HelpCardProps) {
  const Tag = as ?? (onClick ? 'button' : 'div')
  return (
    <Tag
      className={`${styles.card} ${tone === 'strong' ? styles.strong : ''}`}
      onClick={onClick}
      type={Tag === 'button' ? 'button' : undefined}
    >
      <span className={styles.text}>
        <span className={styles.title}>{title}</span>
        {sub ? <span className={styles.sub}>{sub}</span> : null}
      </span>
      {trailing ?? (
        <span className={styles.chevron} aria-hidden>
          ›
        </span>
      )}
    </Tag>
  )
}
