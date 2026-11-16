import { useEffect, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './Page.module.css'

interface PageProps {
  children: ReactNode
  /** 탭바가 있는 화면은 아래 여백을 탭바만큼 둔다 */
  withTabBar?: boolean
  gap?: number
  tone?: 'paper' | 'navy' | 'sky'
  className?: string
}

const TONE_BG = { paper: 'var(--color-paper)', navy: 'var(--color-navy-deep)', sky: 'var(--color-sky)' } as const

export function Page({ children, withTabBar, gap = 14, tone = 'paper', className }: PageProps) {
  // 높이를 지정하지 않으므로, 내용 아래 빈 영역도 화면 색과 같게 앱 기둥 배경을 맞춘다
  useEffect(() => {
    if (tone === 'paper') return
    const root = document.documentElement
    root.style.setProperty('--frame-bg', TONE_BG[tone])
    return () => {
      root.style.removeProperty('--frame-bg')
    }
  }, [tone])

  return (
    <main
      className={[styles.page, styles[tone], withTabBar ? styles.withTabBar : '', className ?? '']
        .filter(Boolean)
        .join(' ')}
      style={{ gap }}
    >
      {children}
    </main>
  )
}

interface PageHeaderProps {
  title: ReactNode
  /** 뒤로가기 표시. 문자열이면 그 경로로, true면 history back */
  back?: boolean | string
  action?: ReactNode
  size?: 'lg' | 'md'
  sub?: ReactNode
  /** back=true일 때 앱 안에서 돌아갈 기록이 없으면 갈 곳 (직접 링크로 들어온 경우) */
  backFallback?: string
}

/** 탭 화면 제목(Jua 26) / 하위 화면 제목(‹ + Jua 22) */
export function PageHeader({ title, back, action, size = back ? 'md' : 'lg', sub, backFallback = '/groups' }: PageHeaderProps) {
  const navigate = useNavigate()
  const goBack = () => {
    // React Router가 history.state.idx에 앱 안 이동 순서를 기록한다
    const canGoBack = ((window.history.state as { idx?: number } | null)?.idx ?? 0) > 0
    if (typeof back === 'string') navigate(back)
    else if (canGoBack) navigate(-1)
    else navigate(backFallback)
  }
  return (
    <header className={styles.header}>
      <div className={styles.titleRow}>
        {back ? (
          <button type="button" className={styles.back} onClick={goBack} aria-label="뒤로">
            ‹
          </button>
        ) : null}
        <h1 className={size === 'lg' ? styles.titleLg : styles.titleMd}>{title}</h1>
        {sub ? <span className={styles.titleSub}>{sub}</span> : null}
      </div>
      {action}
    </header>
  )
}

export function SectionLabel({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className={styles.sectionLabel}>
      <h2>{children}</h2>
      {aside ? <span>{aside}</span> : null}
    </div>
  )
}

export function Card({ children, className, soft }: { children: ReactNode; className?: string; soft?: boolean }) {
  return <section className={`${styles.card} ${soft ? styles.cardSoft : ''} ${className ?? ''}`}>{children}</section>
}

export function Spacer() {
  return <div className={styles.spacer} aria-hidden />
}

export function Notice({ children, tone = 'soft' }: { children: ReactNode; tone?: 'soft' | 'navy' }) {
  return <p className={`${styles.notice} ${tone === 'navy' ? styles.noticeNavy : ''}`}>{children}</p>
}

export function EmptyState({ illustration, title, children }: { illustration?: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className={styles.empty}>
      {illustration}
      <p className={styles.emptyTitle}>{title}</p>
      {children ? <div className={styles.emptyBody}>{children}</div> : null}
    </div>
  )
}
