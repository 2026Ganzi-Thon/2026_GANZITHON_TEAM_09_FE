import type { CheckResultCode, HelpSection } from '../../api/types'
import { CHECKIN_QUESTIONS, CHECKIN_THRESHOLD } from '../../data/checkin'
import { addDays, kstHourMinute, weekdayOf } from '../date'

/** CHK-02: 4문항, 각 0~3 정수 */
export function validateAnswers(answers: unknown): answers is number[] {
  return (
    Array.isArray(answers) &&
    answers.length === CHECKIN_QUESTIONS.length &&
    answers.every((a) => Number.isInteger(a) && a >= 0 && a <= 3)
  )
}

/**
 * CHK-03 결과 판정 (위에서부터): 우울 합 ≥ 3 → DEPRESSION, 불안 합 ≥ 3 → ANXIETY(둘 다면 둘 다),
 * 둘 다 미만이고 이번 주 낮은 기분 4일 이상 → LOW_MOOD_DAYS, 그 외 STABLE.
 * 점수는 결과에 담지 않는다(CHK-04).
 */
export function evaluateCheck(answers: number[], lowMoodDays: number): CheckResultCode[] {
  if (!validateAnswers(answers)) throw new Error('invalid answers')
  const [d1, d2, a1, a2] = answers
  const results: CheckResultCode[] = []
  if (d1 + d2 >= CHECKIN_THRESHOLD) results.push('DEPRESSION')
  if (a1 + a2 >= CHECKIN_THRESHOLD) results.push('ANXIETY')
  if (results.length) return results
  return [lowMoodDays >= 4 ? 'LOW_MOOD_DAYS' : 'STABLE']
}

/** 기획서 「결과 기준」 표: 결과 문장 */
export const CHECK_MESSAGES: Record<CheckResultCode, string> = {
  DEPRESSION: '요즘 많이 지쳐 있었던 것 같아요',
  ANXIETY: '걱정이 많았던 한 주였던 것 같아요',
  LOW_MOOD_DAYS: '기분이 가라앉은 날이 많았네요',
  STABLE: '이번 주는 크게 흔들리지 않았던 것 같아요',
}

/** 결과별로 보여줄 도움받기 구역 */
export function sectionsFor(results: CheckResultCode[]): HelpSection[] {
  if (results.includes('DEPRESSION') || results.includes('ANXIETY')) return ['CRISIS_24H', 'COUNSELING']
  if (results.includes('LOW_MOOD_DAYS')) return ['DROP_IN']
  return []
}

export const isAboveThreshold = (results: CheckResultCode[]) =>
  results.includes('DEPRESSION') || results.includes('ANXIETY')

/** CHK-01: 일요일 18:00~23:59(KST) */
export function isCheckWindow(nowMs: number, day: string): boolean {
  return weekdayOf(day) === 0 && kstHourMinute(nowMs).hour >= 18
}

/** 다음 점검 일요일 (오늘이 일요일이면 오늘) */
export function nextCheckDay(today: string): string {
  let day = today
  while (weekdayOf(day) !== 0) day = addDays(day, 1)
  return day
}
