import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import styles from './Toast.module.css'

const ToastContext = createContext<(message: string) => void>(() => {})

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null)
  const timer = useRef<number | undefined>(undefined)
  const show = useCallback((msg: string) => {
    setMessage(msg)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setMessage(null), 2400)
  }, [])
  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className={styles.region} role="status" aria-live="polite">
        {message ? <div className={styles.toast}>{message}</div> : null}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
