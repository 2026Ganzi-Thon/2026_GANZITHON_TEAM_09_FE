import type { CharacterStage, CharacterState, DayKey, GroupDayRecord } from '../../types/domain'

export const MAX_GROWTH = 100
export const DAILY_FULL_GROWTH = 2

/** 하루 성장 = 2 × (완료 인원 ÷ 그날 23:59 기준 그룹 인원) */
export function dailyGrowth(record: { members: number; completedMemberIds: readonly unknown[] }): number {
  if (record.members <= 0) return 0
  const completed = Math.min(record.completedMemberIds.length, record.members)
  return (DAILY_FULL_GROWTH * completed) / record.members
}

/**
 * 진행도는 날짜별 완료 수·인원 수의 합으로 계산한다 (소수 누적 오차 방지).
 * 자라기만 하고 줄어들지 않는다.
 */
export function growthOf(character: CharacterState, records: Record<DayKey, GroupDayRecord> = {}): number {
  let total = character.base
  for (const [day, record] of Object.entries(records)) {
    if (day >= character.startDay) total += dailyGrowth(record)
  }
  return Math.min(MAX_GROWTH, Math.round(total * 100) / 100)
}

/** 0~24 1단계, 25~49 2단계, 50~74 3단계, 75~99 4단계, 100 완성 */
export function stageOf(growth: number): CharacterStage {
  if (growth >= 100) return 5
  if (growth >= 75) return 4
  if (growth >= 50) return 3
  if (growth >= 25) return 2
  return 1
}

export const STAGE_NAMES: Record<CharacterStage, string> = {
  1: '씨앗',
  2: '새싹',
  3: '꽃',
  4: '네잎클로버',
  5: '다 자란 네잎클로버',
}

export function nextStageInfo(growth: number) {
  const stage = stageOf(growth)
  if (stage >= 4) {
    return { nextName: '완성', remaining: Math.max(0, Math.round((MAX_GROWTH - growth) * 10) / 10) }
  }
  const nextAt = stage * 25
  return {
    nextName: STAGE_NAMES[(stage + 1) as CharacterStage],
    remaining: Math.round((nextAt - growth) * 10) / 10,
  }
}

export function formatGrowth(value: number) {
  return Number.isInteger(value) ? `${value}` : value.toFixed(1)
}

/** '꽃으로', '네잎클로버로' (받침 유무에 따른 조사) */
export function withEuro(word: string) {
  const code = word.charCodeAt(word.length - 1) - 0xac00
  if (code < 0 || code > 11171) return `${word}(으)로`
  const jong = code % 28
  return jong === 0 || jong === 8 ? `${word}로` : `${word}으로`
}

export const STAGE_COUNT = 4
export const STAGE_SIZE = MAX_GROWTH / STAGE_COUNT

/** 화면 표시용 짧은 단계 이름 (스텝퍼) */
export const STAGE_SHORT_NAMES = ['씨앗', '새싹', '꽃', '클로버'] as const

/**
 * 지금 단계 안에서 얼마나 자랐는지 (0~100%).
 * 소수점 성장치 대신 "N단계 · 다음 단계까지 M% 남음"으로 보여주기 위한 값.
 */
export function stageProgress(growth: number) {
  const stage = stageOf(growth)
  if (stage === 5) {
    return { stage, percent: 100, remainingPercent: 0, nextName: '완성' }
  }
  const inStage = ((growth - (stage - 1) * STAGE_SIZE) / STAGE_SIZE) * 100
  const percent = Math.min(99, Math.max(0, Math.floor(inStage)))
  return {
    stage,
    percent,
    remainingPercent: 100 - percent,
    nextName: stage === 4 ? '완성' : STAGE_NAMES[(stage + 1) as CharacterStage],
  }
}
