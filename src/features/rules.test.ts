import { describe, expect, it } from 'vitest'
import type { HelpItem, Mood } from '../api/types'
import { dailyGrowth, growthOf, stageOf, stageProgress, withEuro } from './character/growth'
import { evaluateCheck, isCheckWindow, nextCheckDay, sectionsFor, validateAnswers } from './checkin/checkinRules'
import { addDays, ageOn, dayKeyOf, weekStartOf } from './date'
import { helpListFor } from './help/helpFilter'
import { minutesForMood, sizeFor } from './mission/missionRules'
import { lonely3Days, lowMoodDaysInWeek, lowMoodStreak, shouldShowLightHelpCard } from './mood/moodRules'
import { validateNickname } from './profile/nickname'

const rec = (members: number, completed: number) => ({
  members,
  completedMemberIds: Array.from({ length: completed }, (_, i) => i),
})
const kst = (s: string) => Date.parse(`${s}+09:00`)

describe('캐릭터 (CHR)', () => {
  it('CHR02 하루 성장 = 2 × 완료 비율 (PRD 6절 경계값)', () => {
    expect(dailyGrowth(rec(1, 1))).toBe(2)
    expect(dailyGrowth(rec(4, 3))).toBe(1.5)
    expect(dailyGrowth(rec(5, 0))).toBe(0)
    expect(dailyGrowth(rec(3, 2))).toBeCloseTo(1.3333, 3)
    expect(dailyGrowth(rec(5, 4))).toBe(1.6)
  })
  it('CHR04 시작일 이후 기록만 합산하고 100에서 멈춘다', () => {
    const character = { startDay: '2026-11-10', base: 10 }
    const records = { '2026-11-09': rec(2, 2), '2026-11-10': rec(4, 2), '2026-11-11': rec(4, 4) }
    expect(growthOf(character, records)).toBe(13)
    expect(growthOf({ ...character, base: 99.5 }, records)).toBe(100)
  })
  it('매일 전원 완료하면 50일에 다 자란다', () => {
    const records = Object.fromEntries(Array.from({ length: 50 }, (_, i) => [addDays('2026-01-01', i), rec(3, 3)]))
    expect(growthOf({ startDay: '2026-01-01', base: 0 }, records)).toBe(100)
  })
  it('CHR06 단계 구간 (표시 수치 50.1 → 3단계)', () => {
    expect([0, 24.99, 25, 49.99, 50.1, 75, 99.99, 100].map(stageOf)).toEqual([1, 1, 2, 2, 3, 4, 4, 5])
  })
  it('단계 안 진행률과 조사', () => {
    expect(stageProgress(60.7)).toMatchObject({ stage: 3, percent: 42, remainingPercent: 58 })
    expect(stageProgress(100)).toMatchObject({ stage: 5, percent: 100 })
    expect([withEuro('꽃'), withEuro('네잎클로버'), withEuro('새싹')]).toEqual(['꽃으로', '네잎클로버로', '새싹으로'])
  })
})

describe('기분 (MOOD)', () => {
  const m = (x: Record<string, Mood>) => x
  it('MOOD04 3일 연속 낮은 기분(오늘 포함) → 카드 표시', () => {
    expect(shouldShowLightHelpCard(m({ '2026-11-14': 'TIRED', '2026-11-15': 'DEPRESSED', '2026-11-16': 'LONELY' }), '2026-11-16')).toBe(true)
  })
  it('MOOD04 입력하지 않은 날이 끼면 표시 안 함', () => {
    expect(shouldShowLightHelpCard(m({ '2026-11-14': 'TIRED', '2026-11-16': 'LONELY' }), '2026-11-16')).toBe(false)
  })
  it('MOOD04 중간에 보통이에요면 표시 안 함', () => {
    expect(shouldShowLightHelpCard(m({ '2026-11-14': 'TIRED', '2026-11-15': 'OKAY', '2026-11-16': 'LONELY' }), '2026-11-16')).toBe(false)
  })
  it('MOOD04 오늘 기분이 아직 없으면 연속은 0 (오늘 포함 규칙)', () => {
    expect(lowMoodStreak(m({ '2026-11-14': 'TIRED', '2026-11-15': 'TIRED' }), '2026-11-16')).toBe(0)
  })
  it('MOOD04 닫으면 7일 동안 숨김', () => {
    const moods = m({ '2026-11-14': 'TIRED', '2026-11-15': 'DEPRESSED', '2026-11-16': 'LONELY' })
    expect(shouldShowLightHelpCard(moods, '2026-11-16', '2026-11-10')).toBe(false)
    expect(shouldShowLightHelpCard(moods, '2026-11-16', '2026-11-09')).toBe(true)
  })
  it('HELP06 lonely3Days와 CHK03 이번 주 낮은 기분 일수', () => {
    expect(lonely3Days(m({ '2026-11-14': 'LONELY', '2026-11-15': 'LONELY', '2026-11-16': 'LONELY' }), '2026-11-16')).toBe(true)
    expect(lonely3Days(m({ '2026-11-15': 'LONELY', '2026-11-16': 'LONELY' }), '2026-11-16')).toBe(false)
    // 2026-11-16(월)~11-22(일)
    expect(lowMoodDaysInWeek(m({ '2026-11-15': 'TIRED', '2026-11-16': 'TIRED', '2026-11-18': 'LONELY', '2026-11-19': 'OKAY' }), '2026-11-19')).toBe(2)
  })
})

describe('미션 (MIS)', () => {
  it('MIS04 우울해요+20분 → 10분, 지쳐요+10분 → 5분, 그 외는 그대로', () => {
    expect(minutesForMood('DEPRESSED', 20)).toBe(10)
    expect(minutesForMood('TIRED', 10)).toBe(5)
    expect(minutesForMood('TIRED', 5)).toBe(5)
    expect(minutesForMood('LONELY', 20)).toBe(20)
    expect(minutesForMood(undefined, 10)).toBe(10)
  })
  it('MIS04 횟수형은 5→1, 10→2, 20→3 (노래는 1·2·4곡)', () => {
    expect([5, 10, 20].map((x) => sizeFor('OKAY', x as 5 | 10 | 20, 'COUNT'))).toEqual([1, 2, 3])
    expect(sizeFor('GOOD', 20, 'COUNT', [1, 2, 4])).toBe(4)
    expect(sizeFor('DEPRESSED', 20, 'COUNT')).toBe(2)
    expect(sizeFor('CALM', 20, 'TIME')).toBe(20)
  })
})

describe('주간 점검 (CHK)', () => {
  it('CHK03 결과 판정 (PRD 6절 표)', () => {
    expect(evaluateCheck([2, 1, 0, 0], 0)).toEqual(['DEPRESSION'])
    expect(evaluateCheck([2, 1, 3, 0], 0)).toEqual(['DEPRESSION', 'ANXIETY'])
    expect(evaluateCheck([1, 1, 1, 1], 4)).toEqual(['LOW_MOOD_DAYS'])
    expect(evaluateCheck([1, 1, 1, 1], 3)).toEqual(['STABLE'])
  })
  it('CHK02 4개가 아니거나 범위 밖이면 거부', () => {
    expect(validateAnswers([0, 0, 0])).toBe(false)
    expect(validateAnswers([0, 0, 0, 4])).toBe(false)
    expect(validateAnswers([0, 1, 2, 3])).toBe(true)
  })
  it('CHK01 일요일 17:59 → 아님, 18:00 → 점검 시간', () => {
    expect(isCheckWindow(kst('2026-11-22T17:59:00'), '2026-11-22')).toBe(false)
    expect(isCheckWindow(kst('2026-11-22T18:00:00'), '2026-11-22')).toBe(true)
    expect(isCheckWindow(kst('2026-11-21T19:00:00'), '2026-11-21')).toBe(false)
    expect(nextCheckDay('2026-11-16')).toBe('2026-11-22')
  })
  it('CHK06 결과별 구역', () => {
    expect(sectionsFor(['ANXIETY'])).toEqual(['CRISIS_24H', 'COUNSELING'])
    expect(sectionsFor(['LOW_MOOD_DAYS'])).toEqual(['DROP_IN'])
    expect(sectionsFor(['STABLE'])).toEqual([])
  })
})

describe('날짜 (KST)', () => {
  it('KST 자정 기준으로 하루가 바뀐다', () => {
    expect(dayKeyOf(Date.parse('2026-11-15T15:00:00Z'))).toBe('2026-11-16')
    expect(dayKeyOf(Date.parse('2026-11-15T14:59:59Z'))).toBe('2026-11-15')
  })
  it('주는 월요일 시작', () => {
    expect(weekStartOf('2026-11-22')).toBe('2026-11-16')
    expect(weekStartOf('2026-11-16')).toBe('2026-11-16')
  })
  it('만 나이', () => {
    expect(ageOn('2000-05-14', '2026-11-16')).toBe(26)
    expect(ageOn('2000-12-01', '2026-11-16')).toBe(25)
    expect(ageOn(undefined, '2026-11-16')).toBeUndefined()
  })
})

describe('계정 (ACC)', () => {
  it('ACC04 닉네임 1~10자, 공백만은 안 된다', () => {
    expect(validateNickname('소은')).toBeNull()
    expect(validateNickname('   ')).not.toBeNull()
    expect(validateNickname('가'.repeat(11))).not.toBeNull()
    expect(validateNickname('가'.repeat(10))).toBeNull()
  })
})

describe('도움받기 필터·순서 (HELP)', () => {
  const item = (id: string, section: HelpItem['section'], rules: HelpItem['rules'] = {}): HelpItem => ({ id, section, name: id, phone: null, url: null, rules })
  const items = [
    item('line-109', 'CRISIS_24H'),
    item('line-1388', 'CRISIS_24H', { maxAge: 24 }),
    item('line-120', 'CRISIS_24H', { sido: ['서울특별시'] }),
    item('seoul-youth-mind', 'COUNSELING', { sido: ['서울특별시'], minAge: 19, maxAge: 39 }),
    item('mental-center', 'COUNSELING'),
    item('voucher', 'COUNSELING', { minAge: 19 }),
    item('school-counsel', 'COUNSELING', { jobs: ['STUDENT'] }),
    item('job-mind', 'COUNSELING', { jobs: ['JOB_SEEKER'], minAge: 18, maxAge: 64 }),
    item('mind-store', 'DROP_IN', { sido: ['서울특별시'] }),
  ]
  const ids = (l: HelpItem[]) => l.map((x) => x.id)
  const today = '2026-11-16'

  it('HELP03 입력하지 않은 정보로는 숨기지 않는다 (생년월일 없는 기기 → 1388도 보인다)', () => {
    const l = helpListFor(items, { today })
    expect(ids(l.CRISIS_24H)).toEqual(['line-109', 'line-1388', 'line-120'])
    expect(l.COUNSELING.length).toBe(5)
  })
  it('서울 마포구 26세 대학생 (시연 인물)', () => {
    const l = helpListFor(items, { today, profile: { birthDate: '2000-05-14', sido: '서울특별시', sigungu: '마포구', job: 'STUDENT' } })
    expect(ids(l.CRISIS_24H)).toEqual(['line-109', 'line-120'])
    expect(ids(l.COUNSELING)).toEqual(['seoul-youth-mind', 'mental-center', 'voucher', 'school-counsel'])
    expect(l.COUNSELING[1].name).toBe('마포구 정신건강복지센터')
  })
  it('순서 규칙: 외로움 3일(서울) → 120·마음편의점, 점검 기준 이상 → 센터·바우처·청년·학교, 구직 중 → 심리안정', () => {
    const lonely = helpListFor(items, { today, profile: { sido: '서울특별시' }, signals: { lonely3Days: true } })
    expect(lonely.CRISIS_24H[0].id).toBe('line-120')
    const above = helpListFor(items, { today, signals: { checkAboveThreshold: true } })
    expect(ids(above.COUNSELING).slice(0, 4)).toEqual(['seoul-youth-mind', 'mental-center', 'voucher', 'school-counsel'])
    const seeker = helpListFor(items, { today, profile: { job: 'JOB_SEEKER' } })
    expect(seeker.COUNSELING[0].id).toBe('job-mind')
  })
  it('외로움 3일인데 서울 밖이면 정신건강복지센터를 위로', () => {
    const l = helpListFor(items, { today, profile: { sido: '부산광역시' }, signals: { lonely3Days: true } })
    expect(l.COUNSELING[0].id).toBe('mental-center')
  })
})
