import type { CharacterStage, CharacterVariant } from '../../types/domain'
import { STAGE_NAMES } from '../../features/character/growth'
import { Character } from './Character'
import styles from './StageGallery.module.css'

/**
 * 성장 과정 4단계 그림: 씨앗 → 새싹 → 꽃 → 네잎클로버.
 * 지금 단계까지는 또렷하게, 아직 안 온 단계는 흐리게. 완성(5)이면 모두 또렷하게.
 */
export function StageGallery({ stage, variant }: { stage: CharacterStage; variant: CharacterVariant }) {
  return (
    <ol className={styles.gallery} aria-label="성장 과정">
      {([1, 2, 3, 4] as const).map((n) => {
        const reached = n <= stage
        const current = n === stage
        return (
          <li key={n} className={`${styles.item} ${reached ? '' : styles.todo} ${current ? styles.current : ''}`}>
            <span className={styles.art}>
              <Character stage={n} variant={variant} size={64} title={`${n}단계 ${STAGE_NAMES[n]}`} mood={current ? 'happy' : 'default'} />
            </span>
            <span className={styles.label}>
              {n}단계
              <br />
              <b>{STAGE_NAMES[n]}</b>
            </span>
            <span className="visually-hidden">{reached ? (current ? '지금 단계' : '지난 단계') : '아직'}</span>
          </li>
        )
      })}
    </ol>
  )
}
