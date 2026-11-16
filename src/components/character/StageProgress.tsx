import { STAGE_COUNT, STAGE_SHORT_NAMES, stageProgress } from '../../features/character/growth'
import styles from './StageProgress.module.css'

type Tone = 'onSky' | 'onCard'

/**
 * 단계 스텝퍼: 씨앗 · 새싹 · 꽃 · 클로버. 지난 단계는 채우고, 지금 단계는 링으로 강조.
 */
export function StageStepper({ growth, tone = 'onSky' }: { growth: number; tone?: Tone }) {
  const { stage } = stageProgress(growth)
  return (
    <ol className={`${styles.stepper} ${styles[tone]}`} aria-label={`성장 ${Math.min(stage, STAGE_COUNT)}단계 / ${STAGE_COUNT}단계`}>
      {STAGE_SHORT_NAMES.map((name, i) => {
        const n = i + 1
        const state = n < stage || stage === 5 ? 'done' : n === stage ? 'current' : 'todo'
        return (
          <li key={name} className={`${styles.step} ${styles[state]}`} aria-current={state === 'current' ? 'step' : undefined}>
            <span className={styles.dot} aria-hidden>
              {state === 'done' ? '✓' : n}
            </span>
            <span className={styles.name}>{name}</span>
          </li>
        )
      })}
    </ol>
  )
}

/**
 * 4칸 구간 막대: 한 칸 = 한 단계(성장치 25). 지금 단계 칸은 단계 안 진행률만큼 채운다.
 */
export function StageBar({
  growth,
  height = 6,
  track = 'soft',
  label,
}: {
  growth: number
  height?: 6 | 8 | 10
  track?: 'soft' | 'white'
  label: string
}) {
  const { stage, percent } = stageProgress(growth)
  return (
    <div
      className={`${styles.bar} ${track === 'white' ? styles.white : ''}`}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(growth)}
      aria-valuetext={stage === 5 ? '다 자랐어요' : `${stage}단계, 단계 안 ${percent}%`}
    >
      {Array.from({ length: STAGE_COUNT }, (_, i) => {
        const n = i + 1
        const fill = n < stage || stage === 5 ? 100 : n === stage ? percent : 0
        return (
          <span key={n} className={styles.segment} style={{ height, borderRadius: height / 2 }}>
            <span className={styles.fill} style={{ width: `${fill}%` }} />
          </span>
        )
      })}
    </div>
  )
}

/** "꽃 · 3단계" 배지 */
export function StageBadge({ growth, stageName, tone = 'soft' }: { growth: number; stageName: string; tone?: 'soft' | 'navy' }) {
  const { stage } = stageProgress(growth)
  return (
    <span className={`${styles.badge} ${tone === 'navy' ? styles.badgeNavy : ''}`}>
      {stage === 5 ? '완성' : `${stageName} · ${stage}단계`}
    </span>
  )
}
