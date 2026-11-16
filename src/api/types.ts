/**
 * API 명세(api.md, 2026-11-16) 그대로의 요청·응답 타입.
 * 응답 필드를 바꿀 때는 api.md를 먼저 고친 뒤 여기를 맞춘다.
 */

/** KST 기준 'YYYY-MM-DD' */
export type DateString = string
/** ISO-8601 UTC */
export type InstantString = string

/* ── 열거값 ── */
export const MOODS = ['GOOD', 'CALM', 'OKAY', 'TIRED', 'DEPRESSED', 'LONELY'] as const
export type Mood = (typeof MOODS)[number]

export const PING_EMOJIS = ['CLAP', 'CLOVER', 'MUSCLE', 'SUN'] as const
export type PingEmoji = (typeof PING_EMOJIS)[number]

export const GROUP_TYPES = ['FRIEND', 'ONLINE', 'SOLO'] as const
export type GroupType = (typeof GROUP_TYPES)[number]

export const MISSION_MINUTES = [5, 10, 20] as const
export type MissionMinutes = (typeof MISSION_MINUTES)[number]

export type Place = 'OUTDOOR' | 'INDOOR'
export type SizeType = 'TIME' | 'COUNT'
export type MissionStatus = 'NOT_STARTED' | 'STARTED' | 'COMPLETED'

export const REPORT_REASONS = ['SPAM', 'HARASSMENT', 'OTHER'] as const
export type ReportReason = (typeof REPORT_REASONS)[number]

export type CheckResultCode = 'DEPRESSION' | 'ANXIETY' | 'LOW_MOOD_DAYS' | 'STABLE'
export type HelpSection = 'CRISIS_24H' | 'COUNSELING' | 'DROP_IN'
export type HelpItemKind = 'CHANNEL' | 'SERVICE' | 'LOCAL_CENTER' | 'CENTER_FINDER'
export const JOBS = ['STUDENT', 'WORKER', 'JOB_SEEKER', 'OTHER'] as const
export type Job = (typeof JOBS)[number]

/* ── 에러 ── */
export type ApiErrorCode =
  | 'VALIDATION_FAILED'
  | 'UNAUTHENTICATED'
  | 'CSRF_INVALID'
  | 'CONSENT_REQUIRED'
  | 'ADULT_CONFIRMATION_REQUIRED'
  | 'NOT_FOUND'
  | 'GROUP_LIMIT'
  | 'GROUP_FULL'
  | 'ALREADY_MEMBER'
  | 'ALREADY_QUEUED'
  | 'ALREADY_COMPLETED'
  | 'MISSION_NOT_COMPLETED'
  | 'ALREADY_PINGED'
  | 'CHECK_NOT_DUE'
  | 'NOT_ALLOWED_FOR_GROUP_TYPE'
  | 'INVITE_EXPIRED'
  | 'RATE_LIMITED'
  /** 서버에 닿지 못함 (오프라인 등) — 프론트 전용 */
  | 'NETWORK'

export interface ApiErrorBody {
  code: ApiErrorCode
  message: string
  fields?: string[]
}

/* ── 계정 ── */
export interface Me {
  nickname: string
  adultConfirmed: boolean
  sensitiveConsent: boolean
  createdAt: InstantString
  /** 서버 기준 오늘(KST). 기분 팝업 판단에 쓴다 */
  today: DateString
}

/* ── 그룹 ── */
export interface TodayCount {
  completed: number
  total: number
}

export interface CharacterSummary {
  characterId?: number
  kind: string
  /** 1~4 */
  stage: number
  /** 확정 합 + 오늘 임시 성장, 소수 첫째 자리, 최대 100 */
  progress: number
}

export interface GroupSummary {
  groupId: number
  type: GroupType
  name: string
  memberCount: number
  today: TodayCount
  character: CharacterSummary
  isDemo: boolean
  /** 완성 연출 대상이면 한 번만 */
  justCompleted?: { kind: string; completedOn: DateString }
}

export interface GroupsResponse {
  groups: GroupSummary[]
  queue: { waiting: boolean; queuedAt: InstantString | null }
}

export interface GroupMember {
  memberId: number
  displayName: string
}

export interface GroupDetail {
  groupId: number
  type: GroupType
  name: string
  me: GroupMember
  members: GroupMember[]
  today: TodayCount & { date: DateString }
  character: CharacterSummary
  isDemo: boolean
}

export interface CollectionResponse {
  characters: { characterId: number; kind: string; startedOn: DateString; completedOn: DateString }[]
}

export interface InviteResponse {
  code: string
  expiresAt: InstantString
}

export type OnlineQueueResponse =
  | { status: 'MATCHED'; groupId: number }
  | { status: 'WAITING'; queuedAt: InstantString }

/* ── 기분 ── */
export interface MoodEntry {
  date: DateString
  mood: Mood
}

export interface HelpCardResponse {
  show: boolean
  reason?: 'LOW_MOOD_3_DAYS'
}

/* ── 미션 ── */
export interface MissionTopic {
  topicId: number
  category: string
  outdoorText: string
  indoorText: string
  sizeType: SizeType
}

export interface MissionToday {
  date: DateString
  topic: MissionTopic
  /** 어제 고른 값(없으면 10분·OUTDOOR) */
  defaults: { minutes: MissionMinutes; place: Place }
  /** 오늘 기분을 반영한 추천 크기. TIME이면 분, COUNT면 횟수 */
  sizeByMinutes: Record<'5' | '10' | '20', number>
  status: MissionStatus
  startedAt: InstantString | null
  completedAt: InstantString | null
  /** 시작할 때 고른 값 (STARTED·COMPLETED일 때) */
  minutes?: MissionMinutes | null
  place?: Place | null
  size?: number | null
}

export interface StartMissionRequest {
  minutes: MissionMinutes
  place: Place
  size: number
}

export interface CompleteMissionResponse {
  completedAt: InstantString
  groups: {
    groupId: number
    today: TodayCount
    character: { stage: number; progress: number; stageChanged: boolean }
  }[]
}

export interface MissionRecord {
  date: DateString
  category: string
  text: string
  size: number
  sizeType: SizeType
}

/* ── 핑 ── */
export interface GroupPingsResponse {
  date: DateString
  pings: { emoji: PingEmoji }[]
}

/* ── 점검 ── */
export interface CheckCurrent {
  weekStart: DateString
  due: boolean
  done: boolean
  dismissed: boolean
}

export interface CheckSubmitResponse {
  results: CheckResultCode[]
  messages: string[]
  notice: string
  sections: HelpSection[]
}

/* ── 도움받기 ── */
export interface HelpRules {
  minAge?: number
  maxAge?: number
  sido?: string[]
  sigungu?: string[]
  jobs?: Job[]
}

export interface HelpItem {
  id: string
  section: HelpSection
  kind?: HelpItemKind
  name: string
  phone: string | null
  url: string | null
  summary?: string | null
  address?: string | null
  applyMethod?: string | null
  deadline?: string | null
  rules: HelpRules
  sourceServiceId?: string | null
  /** 프론트 표시용 보조 정보 (서버가 주지 않으면 비어 있음) */
  target?: string | null
  note?: string | null
}

export interface HelpItemsResponse {
  version: string
  syncedAt: InstantString | null
  items: HelpItem[]
}

export interface HelpSignals {
  lonely3Days: boolean
  checkAboveThreshold: boolean
}

/* ── 알림 ── */
export interface NotificationSettings {
  /** 'HH:mm'(30분 단위) 또는 null(끔) */
  missionReminderTime: string | null
  weeklyCheckReminder: boolean
}

export interface PushSubscriptionRequest {
  endpoint: string
  keys: { p256dh: string; auth: string }
}
