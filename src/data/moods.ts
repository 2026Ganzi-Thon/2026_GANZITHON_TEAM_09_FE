import type { Mood } from '../api/types'

export interface MoodOption {
  id: Mood
  label: string
  /** 점 색 */
  color: string
  /** 칩 배경 (연한 감정색) */
  tint: string
  /** 선택 테두리 (진한 감정색) */
  edge: string
  /** 낮은 기분 (PRD 용어): 지쳐요·우울해요·외로워요 */
  low: boolean
}

export const MOOD_OPTIONS: MoodOption[] = [
  { id: 'GOOD', label: '기분 좋음', color: 'var(--mood-great)', tint: 'var(--mood-great-tint)', edge: 'var(--mood-great-edge)', low: false },
  { id: 'CALM', label: '편안해요', color: 'var(--mood-calm)', tint: 'var(--mood-calm-tint)', edge: 'var(--mood-calm-edge)', low: false },
  { id: 'OKAY', label: '보통이에요', color: 'var(--mood-okay)', tint: 'var(--mood-okay-tint)', edge: 'var(--mood-okay-edge)', low: false },
  { id: 'TIRED', label: '지쳐요', color: 'var(--mood-tired)', tint: 'var(--mood-tired-tint)', edge: 'var(--mood-tired-edge)', low: true },
  { id: 'DEPRESSED', label: '우울해요', color: 'var(--mood-down)', tint: 'var(--mood-down-tint)', edge: 'var(--mood-down-edge)', low: true },
  { id: 'LONELY', label: '외로워요', color: 'var(--mood-lonely)', tint: 'var(--mood-lonely-tint)', edge: 'var(--mood-lonely-edge)', low: true },
]

export const moodById = (id: Mood) => MOOD_OPTIONS.find((m) => m.id === id)!

export const isLowMood = (m: Mood | undefined) => !!m && moodById(m).low
