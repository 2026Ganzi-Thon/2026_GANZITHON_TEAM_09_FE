/**
 * 화면·규칙 함수에서만 쓰는 타입. 서버와 주고받는 타입은 api/types.ts가 기준이다.
 */

/** 'YYYY-MM-DD' (한국 시간 기준 하루) */
export type DayKey = string

/** 1~4단계 + 5(완성) */
export type CharacterStage = 1 | 2 | 3 | 4 | 5
export const CHARACTER_VARIANTS = ['cream', 'mint', 'peach'] as const
export type CharacterVariant = (typeof CHARACTER_VARIANTS)[number]

/** 성장 계산 규칙 함수 입력 (테스트·목업 서버 공용) */
export interface CharacterState {
  startDay: DayKey
  base: number
}

export interface GroupDayRecord {
  members: number
  completedMemberIds: readonly unknown[]
}

/* 도움받기 시드 데이터(data/helpServices.ts)용 */
export type Occupation = 'student' | 'worker' | 'jobseeker' | 'other'
export type Section = 'crisis' | 'counsel' | 'visit'
