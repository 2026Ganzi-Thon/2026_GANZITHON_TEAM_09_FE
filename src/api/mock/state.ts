import type { CheckResultCode, GroupType, MissionMinutes, Mood, NotificationSettings, PingEmoji, Place, ReportReason } from '../types'
import { isPersistenceFrozen } from '../../device/persistence'

/**
 * 목업 서버의 저장 상태 (실서버의 PostgreSQL 대신).
 * ERD의 테이블을 단순화한 모양이다. 화면 코드는 이 파일을 직접 쓰지 않고 API로만 접근한다.
 */
export interface MockMember {
  memberId: number
  displayName: string
  isMe: boolean
}

export interface MockCharacter {
  characterId: number
  kind: string
  startedOn: string
  /** 시연 시드처럼 기록 없이 시작하는 확정 성장 */
  base: number
}

export interface MockGroup {
  groupId: number
  type: GroupType
  name: string
  members: MockMember[]
  character: MockCharacter
  isDemo: boolean
  createdAt: number
}

/** daily_group_progress + 오늘 임시 값 */
export interface DayRecord {
  members: number
  completed: number[]
  pings: { memberId: number; emoji: PingEmoji }[]
}

export interface MockState {
  version: 2
  nextId: number
  clockOffsetMs: number
  account: {
    nickname: string
    adultConfirmed: boolean
    sensitiveConsentAt: number | null
    createdAt: number
    /** 시연 시드로 만든 계정 (GET /me의 isDemo) */
    isDemo?: boolean
  } | null
  moods: Record<string, Mood>
  helpCardDismissedOn?: string
  missions: Record<
    string,
    { topicId: number; minutes?: MissionMinutes; place?: Place; size?: number; startedAt?: number; completedAt?: number }
  >
  lastChoice?: { minutes: MissionMinutes; place: Place }
  pings: Record<string, PingEmoji>
  groups: MockGroup[]
  records: Record<number, Record<string, DayRecord>>
  collections: Record<number, { characterId: number; kind: string; startedOn: string; completedOn: string }[]>
  justCompleted: Record<number, { kind: string; completedOn: string }>
  checks: Record<string, { status: 'DONE' | 'DISMISSED'; answers?: number[]; results?: CheckResultCode[]; createdAt: number }>
  blocks: number[]
  reports: { groupId: number; memberId: number; reason: ReportReason; at: number }[]
  invites: Record<number, { code: string; expiresAt: number }>
  queue: { queuedAt: number } | null
  /** 목업 전용: 다음 온라인 참여를 바로 배정할지, 대기부터 할지 (시연 도구) */
  queueMode?: 'match' | 'wait'
  notification: NotificationSettings
}

const KEY = 'haengunping:mock-server:v2'

export function emptyState(clockOffsetMs = 0): MockState {
  return {
    version: 2,
    nextId: 100,
    clockOffsetMs,
    account: null,
    moods: {},
    missions: {},
    pings: {},
    groups: [],
    records: {},
    collections: {},
    justCompleted: {},
    checks: {},
    blocks: [],
    reports: [],
    invites: {},
    queue: null,
    notification: { missionReminderTime: '12:30', weeklyCheckReminder: true },
  }
}

export function loadState(): MockState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return emptyState()
    const parsed = JSON.parse(raw) as MockState
    return parsed.version === 2 ? { ...emptyState(), ...parsed } : emptyState()
  } catch {
    return emptyState()
  }
}

export function saveState(s: MockState) {
  if (isPersistenceFrozen()) return
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    /* 저장 공간 부족 등 */
  }
}
