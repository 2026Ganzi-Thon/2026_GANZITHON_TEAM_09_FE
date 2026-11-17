/**
 * 시작 화면(S01·S02) 기능 소개 아이콘. 이모지 대신 캐릭터 '핑'(components/character/Character.tsx)과
 * 같은 색·선 굵기·둥근 끝으로 그린다: 크림 몸 + 갈색 테두리, 분홍 볼, 초록 잎, 분홍 꽃잎.
 */
const OUTLINE = '#6E5646'
const FACE = '#3B2F2A'
const CREAM = '#FFF7E3'
const CREAM_SHADE = '#F3E4C2'
const CHEEK = '#F7B3C2'
const LEAF = '#6CC28A'
const LEAF_DARK = '#3F8F5A'
const PETAL = '#F4A9BA'
const PETAL_DARK = '#D9788F'

const svgProps = { width: 24, height: 24, viewBox: '0 0 24 24', 'aria-hidden': true, focusable: false } as const

/** 하루 한 번, 기분 한 번 탭 — 웃는 핑 얼굴 */
export function MoodIcon() {
  return (
    <svg {...svgProps}>
      <circle cx="12" cy="12.5" r="8.6" fill={CREAM} stroke={OUTLINE} strokeWidth="1.5" />
      <g stroke={FACE} strokeWidth="1.3" strokeLinecap="round" fill="none">
        <path d="M8.2 11.9 Q9.4 10.5 10.6 11.9" />
        <path d="M13.4 11.9 Q14.6 10.5 15.8 11.9" />
      </g>
      <ellipse cx="7.6" cy="14.4" rx="1.5" ry="0.95" fill={CHEEK} />
      <ellipse cx="16.4" cy="14.4" rx="1.5" ry="0.95" fill={CHEEK} />
      <path d="M10.5 14.6 Q12 16.4 13.5 14.6 Z" fill="#E66F86" stroke={FACE} strokeWidth="1" strokeLinejoin="round" />
    </svg>
  )
}

/** 각자 작은 미션, 함께 키우는 캐릭터 — 핑 머리 위 잎과 같은 새싹 */
export function SproutIcon() {
  return (
    <svg {...svgProps}>
      <path d="M4.5 20.2 C6.2 16.6 17.8 16.6 19.5 20.2 Z" fill={CREAM_SHADE} stroke={OUTLINE} strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M12 18.2 C12 15 12 12.5 12 10" stroke={LEAF_DARK} strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <path d="M12 12 C9 7.8 4.6 8.4 4.2 10.8 C6.6 13.8 10.2 13.6 12 12 Z" fill={LEAF} stroke={LEAF_DARK} strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M12 10 C14.4 5.4 19.4 5 20.2 7.6 C18.4 11 14.4 11.6 12 10 Z" fill={LEAF} stroke={LEAF_DARK} strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  )
}

/** 힘든 날엔 도움받을 곳으로 — 핑 꽃잎 색 하트 */
export function HeartIcon() {
  return (
    <svg {...svgProps}>
      <path
        d="M12 20 C7 16.5 3.8 13.6 3.8 9.9 C3.8 7.5 5.7 5.8 7.9 5.8 C9.6 5.8 11 6.8 12 8.3 C13 6.8 14.4 5.8 16.1 5.8 C18.3 5.8 20.2 7.5 20.2 9.9 C20.2 13.6 17 16.5 12 20 Z"
        fill={PETAL}
        stroke={PETAL_DARK}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <ellipse cx="8.1" cy="9.6" rx="1.4" ry="0.95" fill="#fff" opacity="0.75" transform="rotate(-25 8.1 9.6)" />
    </svg>
  )
}
