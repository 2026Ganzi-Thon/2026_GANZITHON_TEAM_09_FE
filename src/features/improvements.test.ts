import { describe, expect, it } from 'vitest'
import { SIDO, SIGUNGU, sigunguOf } from '../data/regions'
import { weekLabel } from './date'
import { characterKey, characterNicknameOf } from './character/nickname'
import { isWritingMission } from './memory/format'

describe('#13 주차 표기 (목요일이 속한 달 기준)', () => {
  it('11월 첫째 주 = 11.2 ~ 11.8 (2026)', () => {
    expect(weekLabel('2026-11-02', '2026-11-16')).toBe('11월 첫째 주 (11.2 ~ 11.8)')
  })
  it('이번 주는 "이번 주 (범위)"', () => {
    expect(weekLabel('2026-11-16', '2026-11-16')).toBe('이번 주 (11.16 ~ 11.22)')
  })
  it('목요일이 앞 달이면 앞 달의 주로 센다 (10.26 ~ 11.1 → 10월 다섯째 주)', () => {
    expect(weekLabel('2026-10-26', '2026-11-16')).toBe('10월 다섯째 주 (10.26 ~ 11.1)')
  })
  it('목요일이 다음 달이면 다음 달 첫째 주 (2026-11-30 ~ 12.6 → 12월 첫째 주)', () => {
    expect(weekLabel('2026-11-30', '2026-11-16')).toBe('12월 첫째 주 (11.30 ~ 12.6)')
  })
})

describe('#1 시·군·구 목록', () => {
  it('모든 시·도에 목록이 있다 (세종은 없음)', () => {
    for (const sido of SIDO) expect(Array.isArray(SIGUNGU[sido])).toBe(true)
    expect(sigunguOf('세종특별자치시')).toEqual([])
  })
  it('기초자치단체 수 (2026-07 인천 개편 반영)', () => {
    const counts = Object.fromEntries(SIDO.map((s) => [s, SIGUNGU[s].length]))
    expect(counts).toMatchObject({ 서울특별시: 25, 부산광역시: 16, 대구광역시: 9, 인천광역시: 11, 경기도: 31, 강원특별자치도: 18, 경상북도: 22, 경상남도: 18, 전라남도: 22 })
  })
  it('경기도에서 수원시·안양시·성남시를 고를 수 있고, 같은 시·도 안에 중복이 없다', () => {
    expect(sigunguOf('경기도')).toEqual(expect.arrayContaining(['수원시', '안양시', '성남시']))
    for (const sido of SIDO) expect(new Set(SIGUNGU[sido]).size).toBe(SIGUNGU[sido].length)
  })
})

describe('#17 캐릭터 개인 별명', () => {
  it('캐릭터 ID가 없으면 별명을 붙이지 않는다 (다음 캐릭터로 넘어가지 않게)', () => {
    expect(characterKey(1, undefined)).toBeNull()
    expect(characterNicknameOf({ characterNicknames: { '1:7': '클로버' } }, 1, undefined)).toBeUndefined()
    expect(characterNicknameOf({ characterNicknames: { '1:7': '클로버' } }, 1, 7)).toBe('클로버')
    expect(characterNicknameOf({ characterNicknames: { '1:7': '클로버' } }, 1, 8)).toBeUndefined()
  })
})

describe('#7 적기 미션', () => {
  it('"적기" 문구만 작성형으로 본다', () => {
    expect(isWritingMission('오늘 좋았던 일 하나 적기 (본인만 봄)')).toBe(true)
    expect(isWritingMission('걸으며 오늘 좋았던 일 떠올리기')).toBe(false)
    expect(isWritingMission(undefined)).toBe(false)
  })
})

describe('내 기록 미션 크기 단위 (주제 번호 없이 분류로)', () => {
  it('횟수형은 분류마다 시드 주제와 같은 단위', async () => {
    const { MISSION_TOPICS, recordSizeUnit, sizeUnit } = await import('../data/missions')
    for (const t of MISSION_TOPICS) expect(recordSizeUnit(t)).toBe(sizeUnit(t))
  })
  it("'걸으며 오늘 좋았던 일 떠올리기' 2 → '2개' (2번으로 보이던 오류)", async () => {
    const { recordSizeUnit } = await import('../data/missions')
    expect(recordSizeUnit({ sizeType: 'COUNT', category: 'GOOD_THING' })).toBe('개')
  })
})
