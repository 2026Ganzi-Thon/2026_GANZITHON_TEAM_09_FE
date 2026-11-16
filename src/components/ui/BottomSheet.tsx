import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import styles from './BottomSheet.module.css'

interface BottomSheetProps {
  open: boolean
  onClose?: () => void
  /** 화면낭독기용 제목 (보이는 제목은 children에서) */
  label: string
  children: ReactNode
  /** 배경을 눌러 닫을 수 있는지 */
  dismissible?: boolean
}

/** Figma Sheet: 상단 손잡이, 위쪽 모서리 28px, 뒤 배경 Dim */
export function BottomSheet({ open, onClose, label, children, dismissible = true }: BottomSheetProps) {
  const ref = useRef<HTMLDivElement>(null)
  const titleId = useId()

  useEffect(() => {
    if (!open) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    ref.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dismissible) onClose?.()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [open, dismissible, onClose])

  if (!open) return null

  return createPortal(
    <div className={styles.layer}>
      <div className={styles.dim} onClick={dismissible ? onClose : undefined} aria-hidden />
      <div
        ref={ref}
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <span id={titleId} className="visually-hidden">
          {label}
        </span>
        <div className={styles.handle} aria-hidden />
        {children}
      </div>
    </div>,
    document.body,
  )
}
