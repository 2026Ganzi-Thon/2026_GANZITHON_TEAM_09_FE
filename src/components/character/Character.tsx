import type { CharacterStage, CharacterVariant } from '../../types/domain'
import styles from './Character.module.css'

/**
 * 마스코트 캐릭터 (참고 이미지 기반 SVG).
 * 몸은 그대로이고 머리 위 식물만 단계별로 자란다: 씨앗 → 새싹 → 꽃 → 네잎클로버.
 * 원본 일러스트가 오면 이 컴포넌트 내부만 교체하면 된다.
 */
interface CharacterProps {
  stage: CharacterStage
  variant?: CharacterVariant
  size?: number
  mood?: 'default' | 'happy'
  /** 성장 직후 살짝 튀는 애니메이션 */
  bounce?: boolean
  title?: string
}

const BODY: Record<CharacterVariant, { fill: string; shade: string }> = {
  cream: { fill: '#FFF7E3', shade: '#F3E4C2' },
  mint: { fill: '#EAF7EC', shade: '#CDE9D3' },
  peach: { fill: '#FFEDE4', shade: '#F6D3C3' },
}

const OUTLINE = '#6E5646'
const LEAF = '#6CC28A'
const LEAF_DARK = '#3F8F5A'

function Sprout({ stage }: { stage: CharacterStage }) {
  switch (stage) {
    case 1:
      return (
        <g>
          <ellipse cx="60" cy="40" rx="7.5" ry="9" fill="#A8743F" stroke={OUTLINE} strokeWidth="1.6" transform="rotate(12 60 40)" />
          <ellipse cx="57.5" cy="36.5" rx="2" ry="3" fill="#D9A46C" transform="rotate(12 57.5 36.5)" />
        </g>
      )
    case 2:
      return (
        <g>
          <path d="M60 46 C60 40 60 36 60 31" stroke={LEAF_DARK} strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d="M60 32 C52 22 40 24 38 30 C44 36 54 36 60 32Z" fill={LEAF} stroke={LEAF_DARK} strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M60 32 C68 22 80 24 82 30 C76 36 66 36 60 32Z" fill={LEAF} stroke={LEAF_DARK} strokeWidth="1.6" strokeLinejoin="round" />
        </g>
      )
    case 3:
      return (
        <g>
          <path d="M60 46 C60 38 60 30 60 22" stroke={LEAF_DARK} strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d="M60 38 C52 32 44 34 43 38 C48 42 55 41 60 38Z" fill={LEAF} stroke={LEAF_DARK} strokeWidth="1.4" />
          {[0, 72, 144, 216, 288].map((deg) => (
            <circle
              key={deg}
              cx={60 + 8 * Math.sin((deg * Math.PI) / 180)}
              cy={17 - 8 * Math.cos((deg * Math.PI) / 180)}
              r="6.5"
              fill="#F4A9BA"
              stroke="#D9788F"
              strokeWidth="1.3"
            />
          ))}
          <circle cx="60" cy="17" r="5" fill="#E8A33D" stroke="#C9822A" strokeWidth="1.2" />
        </g>
      )
    default:
      return (
        <g>
          <path d="M60 46 C60 40 61 34 60 28" stroke={LEAF_DARK} strokeWidth="3" strokeLinecap="round" fill="none" />
          {[
            [52.5, 12],
            [67.5, 12],
            [52.5, 26],
            [67.5, 26],
          ].map(([cx, cy]) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="8" fill="#3F9A5C" stroke="#2C7444" strokeWidth="1.5" />
          ))}
          <circle cx="60" cy="19" r="3" fill="#8FD3A4" />
        </g>
      )
  }
}

export function Character({ stage, variant = 'cream', size = 96, mood = 'default', bounce, title }: CharacterProps) {
  const body = BODY[variant]
  const label = title ?? '그룹 캐릭터'
  return (
    <svg
      className={`${styles.root} ${bounce ? styles.bounce : ''}`}
      width={size}
      height={size}
      viewBox="0 0 120 120"
      role="img"
      aria-label={label}
    >
      <ellipse cx="60" cy="111" rx="34" ry="5" fill="#C9DDF1" opacity="0.7" />
      {stage === 1 && <Sprout stage={stage} />}
      <path
        d="M18 82 C18 58 36 44 60 44 C84 44 102 58 102 82 C102 102 86 110 60 110 C34 110 18 102 18 82Z"
        fill={body.fill}
        stroke={OUTLINE}
        strokeWidth="2"
      />
      <path d="M26 92 C34 104 86 104 94 92 C90 104 78 108 60 108 C42 108 30 104 26 92Z" fill={body.shade} />
      {stage !== 1 && <Sprout stage={stage} />}
      {mood === 'happy' ? (
        <g stroke="#3B2F2A" strokeWidth="2.6" strokeLinecap="round" fill="none">
          <path d="M43 77 Q48 71 53 77" />
          <path d="M67 77 Q72 71 77 77" />
        </g>
      ) : (
        <g fill="#3B2F2A">
          <circle cx="48" cy="76" r="3.4" />
          <circle cx="72" cy="76" r="3.4" />
          <circle cx="49.2" cy="74.8" r="1" fill="#fff" />
          <circle cx="73.2" cy="74.8" r="1" fill="#fff" />
        </g>
      )}
      <ellipse cx="38" cy="85" rx="6.5" ry="4" fill="#F7B3C2" opacity="0.8" />
      <ellipse cx="82" cy="85" rx="6.5" ry="4" fill="#F7B3C2" opacity="0.8" />
      <path
        d={mood === 'happy' ? 'M53 84 Q60 93 67 84 Z' : 'M55 84 Q60 89 65 84'}
        stroke="#3B2F2A"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={mood === 'happy' ? '#E66F86' : 'none'}
      />
      {stage === 5 && (
        <g fill="#E8A33D">
          <path d="M100 30 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z" />
          <path d="M18 40 l1.5 3.5 3.5 1.5 -3.5 1.5 -1.5 3.5 -1.5 -3.5 -3.5 -1.5 3.5 -1.5z" />
        </g>
      )}
    </svg>
  )
}
