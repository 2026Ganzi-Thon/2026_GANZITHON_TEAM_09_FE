import type { Mood } from '../../api/types'
import { isLowMood } from '../../data/moods'
import { addDays, daysBetween, weekStartOf } from '../date'

export const LOW_STREAK_DAYS = 3
export const HELP_CARD_SNOOZE_DAYS = 7

type MoodMap = Record<string, Mood>

/**
 * MOOD-04: 오늘을 포함해 거슬러 올라가며 낮은 기분이 이어진 날 수.
 * 기분을 입력하지 않은 날이 있으면 끊긴다.
 */
export function lowMoodStreak(moods: MoodMap, today: string): number {
  let streak = 0
  let day = today
  while (isLowMood(moods[day])) {
    streak += 1
    day = addDays(day, -1)
  }
  return streak
}

/** MOOD-04: 낮은 기분 3일 연속(오늘 포함)이면 표시, 닫으면 7일 동안 숨김 */
export function shouldShowLightHelpCard(moods: MoodMap, today: string, dismissedOn?: string): boolean {
  if (dismissedOn && daysBetween(dismissedOn, today) < HELP_CARD_SNOOZE_DAYS) return false
  return lowMoodStreak(moods, today) >= LOW_STREAK_DAYS
}

/** HELP-06 lonely3Days: '외로워요' 3일 연속(오늘 포함) */
export function lonely3Days(moods: MoodMap, today: string): boolean {
  return [0, 1, 2].every((n) => moods[addDays(today, -n)] === 'LONELY')
}

/** CHK-03: 그 주(월~오늘) 낮은 기분 일수 */
export function lowMoodDaysInWeek(moods: MoodMap, today: string): number {
  let count = 0
  for (let day = weekStartOf(today); day <= today; day = addDays(day, 1)) {
    if (isLowMood(moods[day])) count += 1
  }
  return count
}
