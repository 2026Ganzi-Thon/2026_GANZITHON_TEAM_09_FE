import type { PingEmoji } from '../api/types'
import clap from '../assets/ping/clap.svg'
import clover from '../assets/ping/clover.svg'
import muscle from '../assets/ping/muscle.svg'
import sun from '../assets/ping/sun.svg'

/** PING-01: CLAP 👏, CLOVER 🍀, MUSCLE 💪, SUN ☀️ — 모든 버튼에 텍스트 라벨 (NFR-06) */
export const PINGS: { type: PingEmoji; label: string; icon: string }[] = [
  { type: 'CLAP', label: '박수', icon: clap },
  { type: 'CLOVER', label: '클로버', icon: clover },
  { type: 'MUSCLE', label: '힘내', icon: muscle },
  { type: 'SUN', label: '햇살', icon: sun },
]

export const pingByType = (type: PingEmoji) => PINGS.find((p) => p.type === type) ?? PINGS[1]
