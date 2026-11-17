import type { DayKey } from '../types/domain'

const DAY_MS = 86_400_000
const KST_OFFSET_MS = 9 * 3_600_000

/** 한국 시간 00:00~23:59를 하루로 본다. */
export function dayKeyOf(timestamp: number): DayKey {
  return new Date(timestamp + KST_OFFSET_MS).toISOString().slice(0, 10)
}

/** KST 기준 시(0~23)와 분 */
export function kstHourMinute(timestamp: number) {
  const d = new Date(timestamp + KST_OFFSET_MS)
  return { hour: d.getUTCHours(), minute: d.getUTCMinutes() }
}

export function addDays(day: DayKey, n: number): DayKey {
  const t = Date.parse(`${day}T00:00:00Z`) + n * DAY_MS
  return new Date(t).toISOString().slice(0, 10)
}

/** 0=일 ~ 6=토 */
export function weekdayOf(day: DayKey): number {
  return new Date(`${day}T00:00:00Z`).getUTCDay()
}

/** 그 주 월요일 (주간 점검·주간 기분의 기준) */
export function weekStartOf(day: DayKey): DayKey {
  const wd = weekdayOf(day)
  return addDays(day, wd === 0 ? -6 : 1 - wd)
}

export function daysBetween(from: DayKey, to: DayKey): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS)
}

export function ageOn(birthDate: string | undefined, day: DayKey): number | undefined {
  if (!birthDate || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) return undefined
  const [by, bm, bd] = birthDate.split('-').map(Number)
  const [y, m, d] = day.split('-').map(Number)
  let age = y - by
  if (m < bm || (m === bm && d < bd)) age -= 1
  return age
}

export function formatMonthDay(day: DayKey) {
  const [, m, d] = day.split('-').map(Number)
  return `${m}월 ${d}일`
}

export const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

const WEEK_ORDINALS = ['첫째', '둘째', '셋째', '넷째', '다섯째']

/** '11.2' (0 없이) */
export function formatShortMonthDay(day: DayKey) {
  const [, m, d] = day.split('-').map(Number)
  return `${m}.${d}`
}

/**
 * 월요일 시작 주의 이름. 그 주의 목요일이 속한 달을 기준으로 몇째 주인지 센다.
 * 예: 2026-11-02(월) 주 → '11월 첫째 주 (11.2 ~ 11.8)', 이번 주 → '이번 주 (11.16 ~ 11.22)'
 */
export function weekLabel(weekStart: DayKey, thisWeekStart?: DayKey) {
  const range = `(${formatShortMonthDay(weekStart)} ~ ${formatShortMonthDay(addDays(weekStart, 6))})`
  if (weekStart === thisWeekStart) return `이번 주 ${range}`
  const thursday = addDays(weekStart, 3)
  const [, m, d] = thursday.split('-').map(Number)
  return `${m}월 ${WEEK_ORDINALS[Math.ceil(d / 7) - 1]} 주 ${range}`
}
