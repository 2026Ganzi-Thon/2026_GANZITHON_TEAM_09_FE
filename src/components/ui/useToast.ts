import { createContext, useContext } from 'react'

/** 토스트 띄우기 함수. 값은 Toast.tsx의 ToastProvider가 넣는다 */
export const ToastContext = createContext<(message: string) => void>(() => {})

export const useToast = () => useContext(ToastContext)
