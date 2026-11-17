import { formatMonthDay, WEEKDAY_LABELS, weekdayOf } from '../date'

/** '11월 23일 (월)' */
export const memoryDateLabel = (day: string) => `${formatMonthDay(day)} (${WEEKDAY_LABELS[weekdayOf(day)]})`

/**
 * 직접 적는 미션인지 (예: '오늘 좋았던 일 하나 적기'). 미션 데이터에 따로 표시가 없어 문구로 판단한다.
 * 이런 미션은 완료 화면에서 한 줄 메모를 먼저 권한다.
 */
export const isWritingMission = (text: string | undefined) => !!text && /적기/.test(text)
