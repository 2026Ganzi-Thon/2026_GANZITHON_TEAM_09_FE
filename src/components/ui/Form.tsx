import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react'
import styles from './Form.module.css'

interface FieldProps {
  label: string
  /** 입력칸 안 오른쪽에 붙는 보조 표시 (예: 글자 수 2 / 10) */
  suffix?: ReactNode
  hint?: ReactNode
  error?: string | null
  optional?: boolean
}

export function TextField({ label, hint, error, optional, suffix, ...rest }: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId()
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
        {optional ? <span className={styles.optional}>선택</span> : null}
      </label>
      <span className={suffix ? styles.inputWrap : undefined} style={suffix ? undefined : { display: 'contents' }}>
        <input
          id={id}
          className={`${styles.input} ${error ? styles.invalid : ''} ${suffix ? styles.withSuffix : ''}`}
          aria-invalid={!!error || undefined}
          aria-describedby={error || hint ? `${id}-desc` : undefined}
          {...rest}
        />
        {suffix ? (
          <span className={styles.suffix} aria-hidden>
            {suffix}
          </span>
        ) : null}
      </span>
      {error || hint ? (
        <p id={`${id}-desc`} className={error ? styles.error : styles.hint}>
          {error ?? hint}
        </p>
      ) : null}
    </div>
  )
}

export function SelectField({
  label,
  hint,
  error,
  optional,
  options,
  placeholder = '선택해 주세요',
  ...rest
}: FieldProps & SelectHTMLAttributes<HTMLSelectElement> & { options: readonly string[] | { value: string; label: string }[]; placeholder?: string }) {
  const id = useId()
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
        {optional ? <span className={styles.optional}>선택</span> : null}
      </label>
      <select id={id} className={styles.input} {...rest}>
        <option value="">{placeholder}</option>
        {options.map((o) =>
          typeof o === 'string' ? (
            <option key={o} value={o}>
              {o}
            </option>
          ) : (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ),
        )}
      </select>
      {error || hint ? <p className={error ? styles.error : styles.hint}>{error ?? hint}</p> : null}
    </div>
  )
}

interface ChoiceGroupProps<T extends string | number> {
  label: string
  value: T | undefined
  options: { value: T; label: string }[]
  onChange: (value: T) => void
  columns?: number
  hideLabel?: boolean
  /** 둥근 칩으로 줄바꿈 배치 (Figma 14 '지금 하는 일') */
  chips?: boolean
}

/** 시간(5·10·20분), 지금 하는 일 등 버튼형 단일 선택 */
export function ChoiceGroup<T extends string | number>({ label, value, options, onChange, columns, hideLabel, chips }: ChoiceGroupProps<T>) {
  return (
    <div className={styles.field} role="radiogroup" aria-label={label}>
      {hideLabel ? null : <span className={styles.label}>{label}</span>}
      <div
        className={chips ? styles.chips : styles.choices}
        style={chips ? undefined : { gridTemplateColumns: `repeat(${columns ?? options.length}, minmax(0, 1fr))` }}
      >
        {options.map((o) => (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            className={`${chips ? styles.chip : styles.choice} ${value === o.value ? styles.choiceOn : ''}`}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export function Toggle({ label, sub, checked, onChange }: { label: string; sub?: string; checked: boolean; onChange: (v: boolean) => void }) {
  const id = useId()
  return (
    <label htmlFor={id} className={styles.toggleRow}>
      <span className={styles.toggleText}>
        <span className={styles.toggleLabel}>{label}</span>
        {sub ? <span className={styles.hint}>{sub}</span> : null}
      </span>
      <input id={id} type="checkbox" role="switch" className={styles.switch} checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  )
}

export function Checkbox({ label, checked, onChange, children }: { label: ReactNode; checked: boolean; onChange: (v: boolean) => void; children?: ReactNode }) {
  const id = useId()
  return (
    <div className={styles.checkWrap}>
      <label htmlFor={id} className={styles.checkRow}>
        <input id={id} type="checkbox" className={styles.check} checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className={styles.checkLabel}>{label}</span>
      </label>
      {children}
    </div>
  )
}
