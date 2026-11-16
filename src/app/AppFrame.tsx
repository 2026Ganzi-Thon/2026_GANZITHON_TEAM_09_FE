import type { ReactNode } from 'react'
import { Character } from '../components/character/Character'
import styles from './AppFrame.module.css'

/**
 * 모바일 앱형 프레임: 최대 430px, PC에서는 가운데 정렬.
 * 휴대폰을 가로로 돌리면 세로 안내를 띄운다 (가로 화면 미지원).
 */
export function AppFrame({ children }: { children: ReactNode }) {
  return (
    <div className={styles.frame}>
      {children}
      <div className={styles.rotate} role="alert">
        <Character stage={2} size={88} mood="happy" />
        <p>화면을 세로로 돌려 주세요</p>
        <span>행운핑은 세로 화면에서 쓸 수 있어요</span>
      </div>
    </div>
  )
}
