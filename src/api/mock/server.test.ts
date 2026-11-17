import { beforeEach, describe, expect, it } from 'vitest'
import { ApiError } from '../errors'
import { DEMO_INVITE_CODES, mockApi as api, seedMockDemo } from './server'

/** 목업 서버가 api.md의 응답 모양·에러 코드를 지키는지 (실서버와 바꿔 끼울 수 있게) */
async function code(p: Promise<unknown>) {
  try {
    await p
    return 'OK'
  } catch (e) {
    return e instanceof ApiError ? `${e.status} ${e.code}` : String(e)
  }
}

const kstIso = (s: string) => new Date(Date.parse(`${s}+09:00`)).toISOString()

beforeEach(async () => {
  await api.putDemoClock({ now: kstIso('2026-11-16T10:00:00') }) // 월요일 오전
  await api.createAccount({ nickname: '테스트' })
})

describe('계정', () => {
  it('ACC04 닉네임 11자 → 400', async () => {
    expect(await code(api.createAccount({ nickname: '가'.repeat(11) }))).toBe('400 VALIDATION_FAILED')
  })
  it('SEC01 계정 없이 인증 필요 요청 → 401', async () => {
    await api.deleteMe()
    expect(await code(api.getGroups())).toBe('401 UNAUTHENTICATED')
  })
  it('GET /me는 서버 기준 오늘(KST)을 준다', async () => {
    expect((await api.getMe()).today).toBe('2026-11-16')
  })
  it('GET /me isDemo: 일반 계정 false, 시연 시드 계정 true', async () => {
    expect((await api.getMe()).isDemo).toBe(false)
    seedMockDemo()
    expect((await api.getMe()).isDemo).toBe(true)
  })
})

describe('시연 시드 (MIS-04)', () => {
  it('지난 미션 크기: 10분을 고른 횟수형은 2번, 시간형은 10분 (기분이 낮으면 한 단계 작게)', async () => {
    seedMockDemo()
    const { missions } = await api.getMyRecords('2026-11')
    expect(missions.length).toBeGreaterThan(0)
    for (const m of missions) {
      if (m.sizeType === 'COUNT') expect([1, 2]).toContain(m.size)
      else expect([5, 10]).toContain(m.size)
    }
    expect(missions.some((m) => m.sizeType === 'COUNT')).toBe(true)
  })
})

describe('미션 고른 값 (백엔드 회신 2026-11-16)', () => {
  it('NOT_STARTED면 minutes·place·size가 null, 시작하면 고른 값, 완료 뒤에도 남는다', async () => {
    const before = await api.getMissionToday()
    expect([before.status, before.minutes, before.place, before.size]).toEqual(['NOT_STARTED', null, null, null])
    const started = await api.startMission({ minutes: 20, place: 'INDOOR', size: 15 })
    expect([started.status, started.minutes, started.place, started.size]).toEqual(['STARTED', 20, 'INDOOR', 15])
    await api.completeMission()
    const done = await api.getMissionToday()
    expect([done.status, done.minutes, done.place, done.size]).toEqual(['COMPLETED', 20, 'INDOOR', 15])
  })
  it('다시 시작하면 고른 값과 startedAt을 새로 쓴다', async () => {
    const first = await api.startMission({ minutes: 5, place: 'OUTDOOR', size: 5 })
    await new Promise((r) => setTimeout(r, 5))
    const again = await api.startMission({ minutes: 10, place: 'INDOOR', size: 10 })
    expect([again.minutes, again.place, again.size]).toEqual([10, 'INDOOR', 10])
    expect(Date.parse(again.startedAt!)).toBeGreaterThan(Date.parse(first.startedAt!))
  })
})

describe('기분', () => {
  it('ACC05 동의 없이 기분 저장 → 403 CONSENT_REQUIRED', async () => {
    expect(await code(api.putMoodToday({ mood: 'LONELY' }))).toBe('403 CONSENT_REQUIRED')
  })
  it('MOOD01 정의 밖 값 → 400, MOOD02 같은 날 덮어쓰기', async () => {
    await api.putSensitiveConsent({ agreed: true })
    // @ts-expect-error 잘못된 값 시험
    expect(await code(api.putMoodToday({ mood: 'happy' }))).toBe('400 VALIDATION_FAILED')
    await api.putMoodToday({ mood: 'TIRED' })
    await api.putMoodToday({ mood: 'LONELY' })
    expect((await api.getMoods('2026-11-16', '2026-11-16')).moods).toEqual([{ date: '2026-11-16', mood: 'LONELY' }])
  })
  it('MOOD05 93일 초과 조회 → 400', async () => {
    expect(await code(api.getMoods('2026-01-01', '2026-11-16'))).toBe('400 VALIDATION_FAILED')
  })
})

describe('미션·핑', () => {
  it('MIS03 같은 날 다시 조회해도 같은 주제', async () => {
    const a = await api.getMissionToday()
    const b = await api.getMissionToday()
    expect(a.topic.topicId).toBe(b.topic.topicId)
    expect(a.status).toBe('NOT_STARTED')
  })
  it('MIS07 시작하지 않아도 완료 가능, 두 번째 → 409 ALREADY_COMPLETED', async () => {
    await api.createGroup({ type: 'SOLO' })
    const res = await api.completeMission()
    expect(res.groups[0].today).toEqual({ completed: 1, total: 1 })
    expect(res.groups[0].character.progress).toBe(2)
    expect(await code(api.completeMission())).toBe('409 ALREADY_COMPLETED')
  })
  it('PING02 미완료 → 409, 하루 두 번 → 409, PING01 정의 밖 값 → 400', async () => {
    expect(await code(api.sendPing({ emoji: 'CLOVER' }))).toBe('409 MISSION_NOT_COMPLETED')
    await api.completeMission()
    // @ts-expect-error 잘못된 값 시험
    expect(await code(api.sendPing({ emoji: 'HEART' }))).toBe('400 VALIDATION_FAILED')
    await api.sendPing({ emoji: 'CLOVER' })
    expect(await code(api.sendPing({ emoji: 'SUN' }))).toBe('409 ALREADY_PINGED')
  })
  it('MIS08 완료 뒤 새로 들어간 그룹에도 오늘 완료로 센다', async () => {
    await api.completeMission()
    const g = await api.createGroup({ type: 'FRIEND', name: '새 그룹' })
    expect(g.today.completed).toBe(1)
  })
})

describe('그룹', () => {
  it('GRP02 그룹 3개 → 409 GROUP_LIMIT', async () => {
    await api.createGroup({ type: 'SOLO' })
    await api.createGroup({ type: 'FRIEND', name: '하나' })
    await api.createGroup({ type: 'FRIEND', name: '둘' })
    expect(await code(api.createGroup({ type: 'FRIEND', name: '셋' }))).toBe('409 GROUP_LIMIT')
  })
  it('SEC02 구성원이 아닌 그룹 → 404', async () => {
    expect(await code(api.getGroup(99999))).toBe('404 NOT_FOUND')
  })
  it('GRP04 초대 코드 8자, 만료 410, 가득 참 409, 없음 404 / GRP16 1인 그룹 → 409', async () => {
    const g = await api.createGroup({ type: 'FRIEND', name: '우리' })
    const inv = await api.createInvite(g.groupId)
    expect(inv.code).toMatch(/^[A-HJ-NP-Z2-9]{8}$/)
    expect(await code(api.joinByInvite(inv.code))).toBe('409 ALREADY_MEMBER')
    expect(await code(api.joinByInvite(DEMO_INVITE_CODES.expired))).toBe('410 INVITE_EXPIRED')
    expect(await code(api.joinByInvite(DEMO_INVITE_CODES.full))).toBe('409 GROUP_FULL')
    expect(await code(api.joinByInvite('ABCDEFGH'))).toBe('404 NOT_FOUND')
    const solo = await api.createGroup({ type: 'SOLO' })
    expect(await code(api.createInvite(solo.groupId))).toBe('409 NOT_ALLOWED_FOR_GROUP_TYPE')
  })
  it('ACC09 만 19세 확인 전 온라인 대기열 → 403', async () => {
    expect(await code(api.joinOnlineQueue())).toBe('403 ADULT_CONFIRMATION_REQUIRED')
    await api.putAdultConfirmation({ confirmed: true })
    const res = await api.joinOnlineQueue()
    expect(res.status).toBe('MATCHED')
  })
  it('GRP09 그룹 응답에 userId가 없다 / CHR10 구성원별 완료 여부가 없다', async () => {
    const g = await api.createGroup({ type: 'FRIEND', name: '우리' })
    const json = JSON.stringify(await api.getGroup(g.groupId))
    expect(json).not.toMatch(/userId|completedMemberIds|mood/)
  })
})

describe('점검', () => {
  it('CHK01 월요일에는 due=false, 일요일 18:00 이후 due=true', async () => {
    expect((await api.getCheckCurrent()).due).toBe(false)
    await api.putDemoClock({ now: kstIso('2026-11-22T18:00:00') })
    expect((await api.getCheckCurrent()).due).toBe(true)
  })
  it('CHK04·05 점수 없이 결과·문장·구역, 같은 주 두 번째 → 409', async () => {
    await api.putSensitiveConsent({ agreed: true })
    await api.putDemoClock({ now: kstIso('2026-11-22T19:00:00') })
    const res = await api.submitCheck({ answers: [2, 1, 0, 0] })
    expect(res).toEqual({
      results: ['DEPRESSION'],
      messages: ['요즘 많이 지쳐 있었던 것 같아요'],
      notice: '진단이 아니라 참고예요',
      sections: ['CRISIS_24H', 'COUNSELING'],
    })
    expect(await code(api.submitCheck({ answers: [0, 0, 0, 0] }))).toBe('409 CHECK_NOT_DUE')
    expect((await api.getHelpSignals()).checkAboveThreshold).toBe(true)
  })
})

describe('도움받기', () => {
  it('HELP01 계정 없이도 목록 200, 신호는 둘 다 false', async () => {
    await api.deleteMe()
    const res = await api.getHelpItems()
    expect(res.items.length).toBeGreaterThan(8)
    expect(res.items[0].section).toBe('CRISIS_24H')
    expect(await api.getHelpSignals()).toEqual({ lonely3Days: false, checkAboveThreshold: false })
  })
})

describe('시연 (DEMO)', () => {
  it('DEMO03 아침 산책단 49.8(2단계) → 소은 완료 시 50.2(3단계)', async () => {
    await api.putDemoClock({ now: null })
    seedMockDemo()
    const before = (await api.getGroups()).groups.find((g) => g.name === '아침 산책단')!
    expect(before.character).toMatchObject({ progress: 49.8, stage: 2 })
    expect(before.today).toEqual({ completed: 4, total: 5 })
    const res = await api.completeMission()
    const after = res.groups.find((g) => g.groupId === before.groupId)!
    expect(after.character).toEqual({ stage: 3, progress: 50.2, stageChanged: true })
    expect(after.today).toEqual({ completed: 5, total: 5 })
  })
})
