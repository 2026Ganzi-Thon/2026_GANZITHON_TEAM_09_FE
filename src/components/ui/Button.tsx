import type { ButtonHTMLAttributes } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import styles from './Button.module.css'

/** Figma Button: 종류=Primary / Secondary / Ghost (+ onNavy 변형: 어두운 배경 위) */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'ghostOnNavy'
type Size = 'lg' | 'md'

function cls(variant: ButtonVariant, size: Size, block: boolean, extra?: string) {
  return [styles.button, styles[variant], styles[size], block ? styles.block : '', extra ?? '']
    .filter(Boolean)
    .join(' ')
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: Size
  block?: boolean
  loading?: boolean
}

export function Button({
  variant = 'primary',
  size = 'lg',
  block = true,
  loading,
  className,
  children,
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cls(variant, size, block, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <span className={styles.spinner} aria-hidden /> : null}
      <span>{children}</span>
    </button>
  )
}

interface ButtonLinkProps extends LinkProps {
  variant?: ButtonVariant
  size?: Size
  block?: boolean
}

export function ButtonLink({ variant = 'primary', size = 'lg', block = true, className, ...rest }: ButtonLinkProps) {
  return <Link className={cls(variant, size, block, className)} {...rest} />
}
