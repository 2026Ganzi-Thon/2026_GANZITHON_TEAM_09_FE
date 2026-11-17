import type { PingEmoji } from '../api/types'
import clover from '../assets/ping/clover.svg'
import heart from '../assets/ping/heart.svg'
import star from '../assets/ping/star.svg'
import sun from '../assets/ping/sun.svg'

/**
 * PING-01: 서버 값은 CLAP·CLOVER·MUSCLE·SUN 그대로 두고, 화면 그림만 바꿨다 (2026-11-16 사용자 결정).
 * CLAP → 반짝이는 별 '잘했어', MUSCLE → 하트 '응원해'. 모든 버튼에 텍스트 라벨 (NFR-06)
 */
export const PINGS: { type: PingEmoji; label: string; icon: string }[] = [
  { type: 'CLAP', label: '잘했어', icon: star },
  { type: 'CLOVER', label: '클로버', icon: clover },
  { type: 'MUSCLE', label: '응원해', icon: heart },
  { type: 'SUN', label: '햇살', icon: sun },
]

export const pingByType = (type: PingEmoji) => PINGS.find((p) => p.type === type) ?? PINGS[1]
