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
  // 닫기 함수는 화면이 다시 그려질 때마다 새로 만들어진다. 효과의 의존값에 넣으면 글자를 칠 때마다
  // 효과가 다시 돌아 시트로 포커스를 옮겨 입력이 끊긴다 → 최신 값을 ref로만 읽는다
  const onCloseRef = useRef(onClose)
  const dismissibleRef = useRef(dismissible)
  useEffect(() => {
    onCloseRef.current = onClose
    dismissibleRef.current = dismissible
  })

  // 열릴 때 한 번만: 스크롤 잠금, 시트로 포커스, Esc로 닫기
  useEffect(() => {
    if (!open) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    ref.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dismissibleRef.current) onCloseRef.current?.()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

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
