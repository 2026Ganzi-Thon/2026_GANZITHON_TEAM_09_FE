import { CRISIS_LINES, HELP_SERVICES, type HelpService } from '../../data/helpServices'
import { MISSION_TOPICS, topicSeedById } from '../../data/missions'
import { dailyGrowth, stageOf } from '../../features/character/growth'
import { CHECK_MESSAGES, evaluateCheck, isAboveThreshold, isCheckWindow, sectionsFor, validateAnswers } from '../../features/checkin/checkinRules'
import { addDays, daysBetween, dayKeyOf, weekStartOf } from '../../features/date'
import { hashString, sizeFor } from '../../features/mission/missionRules'
import { lonely3Days, lowMoodDaysInWeek, shouldShowLightHelpCard } from '../../features/mood/moodRules'
import type { HaengunApi } from '../client'
import { ApiError } from '../errors'
import {
  MISSION_MINUTES,
  MOODS,
  PING_EMOJIS,
  REPORT_REASONS,
  type ApiErrorCode,
  type CharacterSummary,
  type GroupDetail,
  type GroupSummary,
  type HelpItem,
  type Job,
  type MissionMinutes,
  type MissionToday,
  type Place,
} from '../types'
import { emptyState, loadState, saveState, type DayRecord, type MockGroup, type MockMember, type MockState } from './state'

/* ───────── 공통 ───────── */

const DAY_MS = 86_400_000
const MAX_GROUPS = 3
const MAX_MEMBERS = 6
const INVITE_TTL_MS = 7 * DAY_MS
/** 영문 대문자·숫자, 혼동 문자 0·O·1·I 제외 (GRP-04) */
const INVITE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export const CHARACTER_KINDS = ['CREAM', 'MINT', 'PEACH'] as const

/** 시연용 초대 코드 (목업 서버에만 있는 다른 사람의 그룹) */
export const DEMO_INVITE_CODES = { join: 'HAPPYPNG', expired: 'EXPRDCDE', full: 'FULLGRPS' } as const

let s: MockState = typeof localStorage === 'undefined' ? emptyState() : loadState()

const fail = (status: number, code: ApiErrorCode, message: string): never => {
  throw new ApiError(status, code, message)
}

const nowMs = () => Date.now() + s.clockOffsetMs
const today = () => dayKeyOf(nowMs())

function delay() {
  return new Promise((r) => setTimeout(r, 60))
}

/** 요청 하나 = 상태를 읽고 고친 뒤 저장. 응답은 복사본 (화면이 서버 상태를 직접 건드리지 않게) */
async function handle<T>(fn: () => T): Promise<T> {
  await delay()
  finalizePastDays()
  const result = fn()
  saveState(s)
  return result === undefined ? result : (JSON.parse(JSON.stringify(result)) as T)
}

function requireAccount() {
  return s.account ?? fail(401, 'UNAUTHENTICATED', '계정이 없어요')
}

function requireConsent() {
  if (!requireAccount().sensitiveConsentAt) fail(403, 'CONSENT_REQUIRED', '기분·점검 기록에 동의가 필요해요')
}

/** 구성원이 아닌 그룹은 항상 404 (PRD 4절) */
function requireGroup(groupId: number): MockGroup {
  requireAccount()
  return s.groups.find((g) => g.groupId === groupId) ?? fail(404, 'NOT_FOUND', '그룹을 찾을 수 없어요')
}

const myMember = (g: MockGroup) => g.members.find((m) => m.isMe)!
const nextId = () => ++s.nextId
const randomPick = <T>(arr: readonly T[]) => arr[Math.floor(Math.random() * arr.length)]

function randomCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(8))
  return Array.from(bytes, (b) => INVITE_ALPHABET[b % INVITE_ALPHABET.length]).join('')
}

/* ───────── 그룹 기록·성장 ───────── */

/** 오늘 기록이 없으면 만든다. 다른 구성원의 완료·핑은 결정적 해시로 흉내 낸다. */
function ensureRecord(g: MockGroup, day: string): DayRecord {
  s.records[g.groupId] ??= {}
  const existing = s.records[g.groupId][day]
  if (existing) {
    existing.members = g.members.length
    return existing
  }
  const rec: DayRecord = { members: g.members.length, completed: [], pings: [] }
  for (const m of g.members.filter((x) => !x.isMe)) {
    const h = hashString(`${g.groupId}:${m.memberId}:${day}`)
    if (h % 100 < 65) {
      rec.completed.push(m.memberId)
      if ((h >>> 7) % 100 < 55) rec.pings.push({ memberId: m.memberId, emoji: PING_EMOJIS[(h >>> 13) % PING_EMOJIS.length] })
    }
  }
  // MIS-08: 오늘 이미 완료했으면 새로 들어온 그룹에도 오늘 완료로 센다
  if (s.missions[day]?.completedAt) rec.completed.push(myMember(g).memberId)
  s.records[g.groupId][day] = rec
  return rec
}

const growthOfRecord = (r: DayRecord) => dailyGrowth({ members: r.members, completedMemberIds: r.completed })

/** 확정 성장 합 (오늘 제외) */
function confirmedSum(g: MockGroup, day: string) {
  const recs = s.records[g.groupId] ?? {}
  let total = g.character.base
  for (const [d, r] of Object.entries(recs)) if (d >= g.character.startedOn && d < day) total += growthOfRecord(r)
  return total
}

/** CHR-05: 확정 합 + 오늘 임시 성장, 소수 첫째 자리, 최대 100 */
function progressOf(g: MockGroup, day = today()) {
  const rec = s.records[g.groupId]?.[day]
  const total = confirmedSum(g, day) + (rec && day >= g.character.startedOn ? growthOfRecord(rec) : 0)
  return Math.min(100, Math.round(total * 10) / 10)
}

const stage14 = (progress: number) => Math.min(4, stageOf(progress))

function characterOf(g: MockGroup): CharacterSummary {
  const progress = progressOf(g)
  return { characterId: g.character.characterId, kind: g.character.kind, stage: stage14(progress), progress }
}

/**
 * CHR-03·07: 00:00 처리. 확정 합이 100 이상이면 완성 → 도감, 새 캐릭터를 0에서 시작.
 * 목업은 요청이 들어올 때마다 밀린 날짜를 확인한다.
 */
function finalizePastDays() {
  const day = today()
  for (const g of s.groups) {
    if (confirmedSum(g, day) >= 100) {
      const completedOn = addDays(day, -1)
      ;(s.collections[g.groupId] ??= []).push({
        characterId: g.character.characterId,
        kind: g.character.kind,
        startedOn: g.character.startedOn,
        completedOn,
      })
      s.justCompleted[g.groupId] = { kind: g.character.kind, completedOn }
      g.character = { characterId: nextId(), kind: randomPick(CHARACTER_KINDS), startedOn: day, base: 0 }
    }
  }
}

function summaryOf(g: MockGroup): GroupSummary {
  const rec = ensureRecord(g, today())
  const summary: GroupSummary = {
    groupId: g.groupId,
    type: g.type,
    name: g.name,
    memberCount: g.members.length,
    today: { completed: rec.completed.length, total: rec.members },
    character: characterOf(g),
    isDemo: g.isDemo,
  }
  if (s.justCompleted[g.groupId]) summary.justCompleted = s.justCompleted[g.groupId]
  return summary
}

function detailOf(g: MockGroup): GroupDetail {
  const day = today()
  const rec = ensureRecord(g, day)
  const me = myMember(g)
  return {
    groupId: g.groupId,
    type: g.type,
    name: g.name,
    me: { memberId: me.memberId, displayName: me.displayName },
    members: g.members.map((m) => ({ memberId: m.memberId, displayName: m.displayName })),
    today: { date: day, completed: rec.completed.length, total: rec.members },
    character: characterOf(g),
    isDemo: g.isDemo,
  }
}

function assertCanJoin() {
  if (s.groups.length + (s.queue ? 1 : 0) >= MAX_GROUPS) fail(409, 'GROUP_LIMIT', '그룹은 3개까지 참여할 수 있어요')
}

function newGroup(type: MockGroup['type'], name: string, members: MockMember[], isDemo = false): MockGroup {
  const g: MockGroup = {
    groupId: nextId(),
    type,
    name,
    members,
    character: { characterId: nextId(), kind: randomPick(CHARACTER_KINDS), startedOn: today(), base: 0 },
    isDemo,
    createdAt: nowMs(),
  }
  s.groups.push(g)
  ensureRecord(g, today())
  return g
}

const meMember = (displayName: string): MockMember => ({ memberId: nextId(), displayName, isMe: true })

/* 온라인 그룹 별칭 (GRP-10) */
const ALIAS_ADJ = ['산책하는', '졸린', '느긋한', '조용한', '부지런한', '꾸준한', '차분한', '포근한', '반짝이는', '천천히 걷는']
const ALIAS_ANIMAL = ['수달', '고양이', '다람쥐', '펭귄', '토끼', '고슴도치', '부엉이', '여우', '판다', '오리']
const ONLINE_NAMES = ['아침 산책단', '햇살 모임', '느린 걸음', '하늘 보기 모임', '작은 걸음단', '오후 산책단']

function alias(taken: Set<string>) {
  for (let i = 0; i < 50; i++) {
    const name = `${randomPick(ALIAS_ADJ)} ${randomPick(ALIAS_ANIMAL)}`
    if (!taken.has(name)) {
      taken.add(name)
      return name
    }
  }
  return `익명 ${taken.size + 1}`
}

/* ───────── 미션 ───────── */

function missionToday(): MissionToday {
  const day = today()
  const mood = s.moods[day]
  // MIS-02: 처음 조회할 때 배정. 오늘 기분(없으면 OKAY)의 우선 주제 중 최근 3일 주제를 빼고 무작위
  if (!s.missions[day]) {
    const recent = new Set([1, 2, 3].map((n) => s.missions[addDays(day, -n)]?.topicId))
    const m = mood ?? 'OKAY'
    const preferred = MISSION_TOPICS.filter((t) => m === 'OKAY' || t.priorityMoods.length === 0 || t.priorityMoods.includes(m))
    let candidates = preferred.filter((t) => !recent.has(t.topicId))
    if (!candidates.length) candidates = MISSION_TOPICS.filter((t) => !recent.has(t.topicId))
    s.missions[day] = { topicId: randomPick(candidates).topicId }
  }
  const rec = s.missions[day]
  const seed = topicSeedById(rec.topicId)
  const size = (min: MissionMinutes) => sizeFor(mood, min, seed.sizeType, seed.countSizes)
  return {
    date: day,
    topic: { topicId: seed.topicId, category: seed.category, outdoorText: seed.outdoorText, indoorText: seed.indoorText, sizeType: seed.sizeType },
    defaults: s.lastChoice ?? { minutes: 10, place: 'OUTDOOR' },
    sizeByMinutes: { '5': size(5), '10': size(10), '20': size(20) },
    status: rec.completedAt ? 'COMPLETED' : rec.startedAt ? 'STARTED' : 'NOT_STARTED',
    startedAt: rec.startedAt ? new Date(rec.startedAt).toISOString() : null,
    completedAt: rec.completedAt ? new Date(rec.completedAt).toISOString() : null,
    minutes: rec.minutes ?? null,
    place: rec.place ?? null,
    size: rec.size ?? null,
  }
}

/* ───────── 도움받기 데이터 (help_items 시드) ───────── */

const JOB_OF: Record<string, Job> = { student: 'STUDENT', worker: 'WORKER', jobseeker: 'JOB_SEEKER', other: 'OTHER' }
const SECTION_OF = { crisis: 'CRISIS_24H', counsel: 'COUNSELING', visit: 'DROP_IN' } as const

function toHelpItem(x: HelpService): HelpItem {
  return {
    id: x.id,
    section: SECTION_OF[x.section],
    kind: x.section === 'crisis' ? 'CHANNEL' : 'SERVICE',
    name: x.name,
    phone: x.phone ?? null,
    url: x.url ?? null,
    summary: x.summary,
    applyMethod: x.howTo,
    rules: {
      ...(x.rule?.minAge !== undefined ? { minAge: x.rule.minAge } : {}),
      ...(x.rule?.maxAge !== undefined ? { maxAge: x.rule.maxAge } : {}),
      ...(x.rule?.sido ? { sido: [x.rule.sido] } : {}),
      ...(x.rule?.occupations ? { jobs: x.rule.occupations.map((o) => JOB_OF[o]) } : {}),
    },
    sourceServiceId: x.serviceId ?? null,
    target: x.target,
    note: x.note ?? null,
  }
}

/* ───────── API ───────── */

export const mockApi: HaengunApi = {
  /* 계정 */
  createAccount: (b) =>
    handle(() => {
      const nickname = (b?.nickname ?? '').trim()
      if (!nickname || nickname.length > 10) fail(400, 'VALIDATION_FAILED', '닉네임은 1~10자로 입력해 주세요')
      s = emptyState(s.clockOffsetMs)
      s.account = { nickname, adultConfirmed: false, sensitiveConsentAt: null, createdAt: nowMs() }
      return { nickname, adultConfirmed: false, sensitiveConsent: false }
    }),
  getMe: () =>
    handle(() => {
      const a = requireAccount()
      return {
        nickname: a.nickname,
        adultConfirmed: a.adultConfirmed,
        sensitiveConsent: !!a.sensitiveConsentAt,
        createdAt: new Date(a.createdAt).toISOString(),
        today: today(),
      }
    }),
  patchMe: (b) =>
    handle(() => {
      const a = requireAccount()
      const nickname = (b?.nickname ?? '').trim()
      if (!nickname || nickname.length > 10) fail(400, 'VALIDATION_FAILED', '닉네임은 1~10자로 입력해 주세요')
      a.nickname = nickname
      for (const g of s.groups) if (g.type !== 'ONLINE') myMember(g).displayName = nickname
      return { nickname, adultConfirmed: a.adultConfirmed, sensitiveConsent: !!a.sensitiveConsentAt, createdAt: new Date(a.createdAt).toISOString(), today: today() }
    }),
  putSensitiveConsent: (b) =>
    handle(() => {
      requireAccount().sensitiveConsentAt = b.agreed ? nowMs() : null
    }),
  putAdultConfirmation: (b) =>
    handle(() => {
      if (b.confirmed !== true) fail(400, 'VALIDATION_FAILED', '되돌릴 수 없어요')
      requireAccount().adultConfirmed = true
    }),
  deleteHealthRecords: () =>
    handle(() => {
      requireAccount()
      s.moods = {}
      s.checks = {}
      s.helpCardDismissedOn = undefined
    }),
  deleteMe: () =>
    handle(() => {
      requireAccount()
      s = emptyState(s.clockOffsetMs)
    }),

  /* 그룹 */
  getGroups: () =>
    handle(() => {
      requireAccount()
      const groups = s.groups.map(summaryOf)
      s.justCompleted = {} // 완성 연출은 한 번만
      return { groups, queue: { waiting: !!s.queue, queuedAt: s.queue ? new Date(s.queue.queuedAt).toISOString() : null } }
    }),
  createGroup: (b) =>
    handle(() => {
      const a = requireAccount()
      assertCanJoin()
      if (b.type === 'FRIEND') {
        const name = (b.name ?? '').trim()
        if (!name || name.length > 12) fail(400, 'VALIDATION_FAILED', '그룹 이름은 1~12자로 입력해 주세요')
        return detailOf(newGroup('FRIEND', name, [meMember(a.nickname)]))
      }
      if (b.type === 'SOLO') return detailOf(newGroup('SOLO', b.name?.trim() || '나 혼자', [meMember(a.nickname)]))
      return fail(400, 'VALIDATION_FAILED', '잘못된 그룹 종류예요')
    }),
  getGroup: (id) => handle(() => detailOf(requireGroup(id))),
  getCollection: (id) =>
    handle(() => {
      requireGroup(id)
      return { characters: s.collections[id] ?? [] }
    }),
  createInvite: (id) =>
    handle(() => {
      const g = requireGroup(id)
      if (g.type !== 'FRIEND') fail(409, 'NOT_ALLOWED_FOR_GROUP_TYPE', '친구 그룹만 초대할 수 있어요')
      // 새로 만들면 이전 코드는 무효
      s.invites[id] = { code: randomCode(), expiresAt: nowMs() + INVITE_TTL_MS }
      return { code: s.invites[id].code, expiresAt: new Date(s.invites[id].expiresAt).toISOString() }
    }),
  joinByInvite: (raw) =>
    handle(() => {
      const a = requireAccount()
      const code = raw.replace(/\s/g, '').toUpperCase()
      if (Object.values(s.invites).some((i) => i.code === code)) fail(409, 'ALREADY_MEMBER', '이미 참여 중인 그룹이에요')
      if (code === DEMO_INVITE_CODES.expired) fail(410, 'INVITE_EXPIRED', '만료된 코드예요. 친구에게 새 코드를 받아 주세요.')
      if (code === DEMO_INVITE_CODES.full) fail(409, 'GROUP_FULL', '그룹이 가득 찼어요')
      if (code !== DEMO_INVITE_CODES.join) fail(404, 'NOT_FOUND', '코드를 다시 확인해 주세요')
      if (s.groups.some((g) => g.name === '산책 메이트')) fail(409, 'ALREADY_MEMBER', '이미 참여 중인 그룹이에요')
      assertCanJoin()
      const g = newGroup('FRIEND', '산책 메이트', [
        { memberId: nextId(), displayName: '서윤', isMe: false },
        { memberId: nextId(), displayName: '도현', isMe: false },
        meMember(a.nickname),
      ])
      if (g.members.length > MAX_MEMBERS) fail(409, 'GROUP_FULL', '그룹이 가득 찼어요')
      return detailOf(g)
    }),
  joinOnlineQueue: () =>
    handle(() => {
      const a = requireAccount()
      if (!a.adultConfirmed) fail(403, 'ADULT_CONFIRMATION_REQUIRED', '만 19세 이상 확인이 필요해요')
      if (s.queue) fail(409, 'ALREADY_QUEUED', '이미 기다리는 중이에요')
      assertCanJoin()
      // 목업: 빈자리가 있는 4~5명 그룹이 있다고 보고 바로 배정한다 (대기 흉내는 그룹 단계에서)
      const taken = new Set<string>()
      const others = 3 + Math.floor(Math.random() * 2)
      const members: MockMember[] = Array.from({ length: others }, () => ({ memberId: nextId(), displayName: alias(taken), isMe: false }))
      members.push({ memberId: nextId(), displayName: alias(taken), isMe: true })
      const used = new Set(s.groups.map((g) => g.name))
      const g = newGroup('ONLINE', ONLINE_NAMES.find((n) => !used.has(n)) ?? '함께 걷기', members)
      return { status: 'MATCHED' as const, groupId: g.groupId }
    }),
  leaveOnlineQueue: () =>
    handle(() => {
      requireAccount()
      s.queue = null
    }),
  leaveGroup: (id) =>
    handle(() => {
      requireGroup(id)
      s.groups = s.groups.filter((g) => g.groupId !== id)
      delete s.invites[id]
    }),
  blockMember: (gid, mid) =>
    handle(() => {
      const g = requireGroup(gid)
      if (g.type !== 'ONLINE') fail(409, 'NOT_ALLOWED_FOR_GROUP_TYPE', '온라인 그룹에서만 차단할 수 있어요')
      if (myMember(g).memberId === mid) fail(400, 'VALIDATION_FAILED', '자기 자신은 차단할 수 없어요')
      if (!g.members.some((m) => m.memberId === mid)) fail(404, 'NOT_FOUND', '구성원을 찾을 수 없어요')
      if (!s.blocks.includes(mid)) s.blocks.push(mid)
    }),
  unblockMember: (gid, mid) =>
    handle(() => {
      requireGroup(gid)
      s.blocks = s.blocks.filter((x) => x !== mid)
    }),
  reportMember: (gid, mid, b) =>
    handle(() => {
      const g = requireGroup(gid)
      if (!REPORT_REASONS.includes(b?.reason)) fail(400, 'VALIDATION_FAILED', '신고 사유를 골라 주세요')
      if (!g.members.some((m) => m.memberId === mid && !m.isMe)) fail(404, 'NOT_FOUND', '구성원을 찾을 수 없어요')
      if (!s.reports.some((r) => r.groupId === gid && r.memberId === mid)) s.reports.push({ groupId: gid, memberId: mid, reason: b.reason, at: nowMs() })
    }),

  /* 기분 */
  putMoodToday: (b) =>
    handle(() => {
      requireConsent()
      if (!MOODS.includes(b?.mood)) fail(400, 'VALIDATION_FAILED', '잘못된 기분 값이에요')
      s.moods[today()] = b.mood
      return { date: today(), mood: b.mood }
    }),
  getMoods: (from, to) =>
    handle(() => {
      requireAccount()
      if (daysBetween(from, to) > 93 || daysBetween(from, to) < 0) fail(400, 'VALIDATION_FAILED', '기간은 93일까지 조회할 수 있어요')
      return {
        moods: Object.entries(s.moods)
          .filter(([d]) => d >= from && d <= to)
          .sort(([x], [y]) => x.localeCompare(y))
          .map(([date, mood]) => ({ date, mood })),
      }
    }),
  getHelpCard: () =>
    handle(() => {
      requireAccount()
      const show = shouldShowLightHelpCard(s.moods, today(), s.helpCardDismissedOn)
      return show ? { show, reason: 'LOW_MOOD_3_DAYS' as const } : { show }
    }),
  dismissHelpCard: () =>
    handle(() => {
      requireAccount()
      s.helpCardDismissedOn = today()
    }),

  /* 미션 */
  getMissionToday: () =>
    handle(() => {
      requireAccount()
      return missionToday()
    }),
  startMission: (b) =>
    handle(() => {
      requireAccount()
      if (!MISSION_MINUTES.includes(b?.minutes) || !['OUTDOOR', 'INDOOR'].includes(b?.place) || !Number.isInteger(b?.size) || b.size < 1) {
        fail(400, 'VALIDATION_FAILED', '잘못된 값이에요')
      }
      missionToday()
      const rec = s.missions[today()]
      if (rec.completedAt) fail(409, 'ALREADY_COMPLETED', '오늘 미션은 이미 했어요')
      Object.assign(rec, { minutes: b.minutes, place: b.place as Place, size: b.size, startedAt: nowMs() })
      s.lastChoice = { minutes: b.minutes, place: b.place }
      return missionToday()
    }),
  completeMission: () =>
    handle(() => {
      requireAccount()
      missionToday()
      const day = today()
      const rec = s.missions[day]
      if (rec.completedAt) fail(409, 'ALREADY_COMPLETED', '오늘 미션은 이미 했어요')
      rec.completedAt = nowMs()
      return {
        completedAt: new Date(rec.completedAt).toISOString(),
        groups: s.groups.map((g) => {
          const before = progressOf(g, day)
          const r = ensureRecord(g, day)
          const me = myMember(g).memberId
          if (!r.completed.includes(me)) r.completed.push(me)
          const after = progressOf(g, day)
          return {
            groupId: g.groupId,
            today: { completed: r.completed.length, total: r.members },
            character: { stage: stage14(after), progress: after, stageChanged: stage14(after) !== stage14(before) },
          }
        }),
      }
    }),
  getMyRecords: (month) =>
    handle(() => {
      requireAccount()
      return {
        missions: Object.entries(s.missions)
          .filter(([d, m]) => d.startsWith(month) && m.completedAt)
          .sort(([x], [y]) => y.localeCompare(x))
          .map(([date, m]) => {
            const t = topicSeedById(m.topicId)
            return {
              date,
              category: t.category,
              text: m.place === 'INDOOR' ? t.indoorText : t.outdoorText,
              size: m.size ?? 10,
              sizeType: t.sizeType,
            }
          }),
      }
    }),

  /* 핑 */
  sendPing: (b) =>
    handle(() => {
      requireAccount()
      if (!PING_EMOJIS.includes(b?.emoji)) fail(400, 'VALIDATION_FAILED', '잘못된 핑이에요')
      const day = today()
      if (!s.missions[day]?.completedAt) fail(409, 'MISSION_NOT_COMPLETED', '미션을 마친 뒤에 핑을 남길 수 있어요')
      if (s.pings[day]) fail(409, 'ALREADY_PINGED', '핑은 하루 한 번이에요')
      s.pings[day] = b.emoji
      for (const g of s.groups) ensureRecord(g, day).pings.push({ memberId: myMember(g).memberId, emoji: b.emoji })
      return { groupIds: s.groups.map((g) => g.groupId) }
    }),
  getGroupPings: (id) =>
    handle(() => {
      const g = requireGroup(id)
      const day = today()
      // 보낸 사람·시각 없이 이모티콘만, 순서는 섞는다 (PING-03). 차단한 구성원은 뺀다 (GRP-14)
      const pings = ensureRecord(g, day)
        .pings.filter((p) => !s.blocks.includes(p.memberId))
        .map((p) => ({ emoji: p.emoji }))
        .sort(() => Math.random() - 0.5)
      return { date: day, pings }
    }),

  /* 점검 */
  getCheckCurrent: () =>
    handle(() => {
      requireAccount()
      const week = weekStartOf(today())
      const c = s.checks[week]
      return {
        weekStart: week,
        due: !c && isCheckWindow(nowMs(), today()),
        done: c?.status === 'DONE',
        dismissed: c?.status === 'DISMISSED',
      }
    }),
  submitCheck: (b) =>
    handle(() => {
      requireConsent()
      if (!validateAnswers(b?.answers)) fail(400, 'VALIDATION_FAILED', '4문항에 0~3으로 답해 주세요')
      const week = weekStartOf(today())
      if (s.checks[week] || !isCheckWindow(nowMs(), today())) fail(409, 'CHECK_NOT_DUE', '이번 주 점검 기간이 아니에요')
      const results = evaluateCheck(b.answers, lowMoodDaysInWeek(s.moods, today()))
      s.checks[week] = { status: 'DONE', answers: b.answers, results, createdAt: nowMs() }
      return { results, messages: results.map((r) => CHECK_MESSAGES[r]), notice: '진단이 아니라 참고예요', sections: sectionsFor(results) }
    }),
  dismissCheck: () =>
    handle(() => {
      requireAccount()
      const week = weekStartOf(today())
      s.checks[week] ??= { status: 'DISMISSED', createdAt: nowMs() }
    }),

  /* 도움받기 (인증 없이) */
  getHelpItems: () =>
    handle(() => ({
      version: '2026-11-16',
      syncedAt: '2026-11-15T19:00:00Z',
      items: [...CRISIS_LINES, ...HELP_SERVICES].map(toHelpItem),
    })),
  getHelpSignals: () =>
    handle(() => {
      if (!s.account) return { lonely3Days: false, checkAboveThreshold: false }
      const weekAgo = nowMs() - 7 * DAY_MS
      return {
        lonely3Days: lonely3Days(s.moods, today()),
        checkAboveThreshold: Object.values(s.checks).some((c) => c.status === 'DONE' && c.createdAt >= weekAgo && isAboveThreshold(c.results ?? [])),
      }
    }),

  /* 알림 */
  getNotificationSettings: () =>
    handle(() => {
      requireAccount()
      return s.notification
    }),
  putNotificationSettings: (b) =>
    handle(() => {
      requireAccount()
      const t = b?.missionReminderTime
      if (t !== null && !/^([01]\d|2[0-3]):(00|30)$/.test(t ?? '')) fail(400, 'VALIDATION_FAILED', '30분 단위로 골라 주세요')
      s.notification = { missionReminderTime: t, weeklyCheckReminder: !!b.weeklyCheckReminder }
      return s.notification
    }),
  addPushSubscription: () => handle(() => void requireAccount()),
  removePushSubscription: () => handle(() => void requireAccount()),
  getVapidPublicKey: () => handle(() => ({ publicKey: '' })),

  /* 시연 시계 */
  putDemoClock: (b) =>
    handle(() => {
      s.clockOffsetMs = b.now ? Date.parse(b.now) - Date.now() : 0
    }),
}

/* ───────── 목업 전용: 시연 시드 (실서버는 demo 프로필 시드가 맡는다) ───────── */

export function seedMockDemo() {
  const offset = s.clockOffsetMs
  s = emptyState(offset)
  const day = today()
  s.account = { nickname: '소은', adultConfirmed: true, sensitiveConsentAt: nowMs(), createdAt: nowMs() }
  s.moods = { [addDays(day, -2)]: 'TIRED', [addDays(day, -1)]: 'TIRED', [addDays(day, -4)]: 'OKAY', [addDays(day, -5)]: 'CALM' }

  const friendMe = meMember('소은')
  const friends: MockMember[] = [friendMe, { memberId: nextId(), displayName: '지민', isMe: false }, { memberId: nextId(), displayName: '하준', isMe: false }]
  const walkers: MockMember[] = [
    { memberId: nextId(), displayName: '느긋한 수달', isMe: false },
    { memberId: nextId(), displayName: '졸린 고양이', isMe: false },
    { memberId: nextId(), displayName: '부지런한 다람쥐', isMe: false },
    { memberId: nextId(), displayName: '포근한 펭귄', isMe: false },
    { memberId: nextId(), displayName: '산책하는 수달', isMe: true },
  ]
  // DEMO-03: 아침 산책단 확정 합 48.2, 4명 완료(49.8, 2단계) → 소은 완료 시 50.2(3단계)
  const friend: MockGroup = {
    groupId: nextId(), type: 'FRIEND', name: '우리 셋', members: friends, isDemo: true, createdAt: nowMs(),
    character: { characterId: nextId(), kind: 'CREAM', startedOn: '2026-10-05', base: 52.03 },
  }
  const online: MockGroup = {
    groupId: nextId(), type: 'ONLINE', name: '아침 산책단', members: walkers, isDemo: true, createdAt: nowMs(),
    character: { characterId: nextId(), kind: 'MINT', startedOn: '2026-11-09', base: 48.2 },
  }
  s.groups = [friend, online]
  s.records = {
    [friend.groupId]: { [day]: { members: 3, completed: [friends[1].memberId], pings: [{ memberId: friends[1].memberId, emoji: 'CLOVER' }] } },
    [online.groupId]: {
      [day]: {
        members: 5,
        completed: walkers.filter((m) => !m.isMe).map((m) => m.memberId),
        pings: [{ memberId: walkers[0].memberId, emoji: 'CLOVER' }, { memberId: walkers[2].memberId, emoji: 'SUN' }],
      },
    },
  }
  s.collections = {
    [friend.groupId]: [{ characterId: nextId(), kind: 'PEACH', startedOn: '2026-08-02', completedOn: '2026-10-04' }],
    [online.groupId]: [{ characterId: nextId(), kind: 'CREAM', startedOn: '2026-09-20', completedOn: '2026-11-08' }],
  }
  // 이번 달 미션 기록 몇 개 (오늘 주제는 '햇빛 받으며 걷기'로 고정 — 시연 시나리오 2단계)
  for (const [i, back] of [3, 4, 6, 7, 9].entries()) {
    const d = addDays(day, -back)
    s.missions[d] = { topicId: [1, 4, 14, 6, 9][i], minutes: 10, place: i % 2 ? 'INDOOR' : 'OUTDOOR', size: 10, startedAt: nowMs(), completedAt: nowMs() }
  }
  s.missions[day] = { topicId: 5 }
  s.lastChoice = { minutes: 10, place: 'OUTDOOR' }
  saveState(s)
}

/** 목업 전용: 현재 시각(시연 시계 반영) — 시연 도구 표시용 */
export function mockNow() {
  return nowMs()
}

