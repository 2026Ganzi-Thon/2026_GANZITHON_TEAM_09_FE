import type {
  CheckCurrent,
  CheckSubmitResponse,
  CollectionResponse,
  CompleteMissionResponse,
  GroupDetail,
  GroupPingsResponse,
  GroupsResponse,
  HelpCardResponse,
  HelpItemsResponse,
  HelpSignals,
  InviteResponse,
  Me,
  MyRecordsResponse,
  MissionToday,
  Mood,
  MoodEntry,
  NotificationSettings,
  OnlineQueueResponse,
  PingEmoji,
  PushSubscriptionRequest,
  ReportReason,
  StartMissionRequest,
} from './types'

/**
 * api.md의 엔드포인트 하나당 함수 하나.
 * mock(기기 안의 가짜 서버)과 http(실서버) 두 구현이 같은 모양을 지킨다.
 */
export interface HaengunApi {
  /* 계정 (ACC) */
  createAccount(body: { nickname: string }): Promise<Pick<Me, 'nickname' | 'adultConfirmed' | 'sensitiveConsent'>>
  getMe(): Promise<Me>
  patchMe(body: { nickname: string }): Promise<Me>
  putSensitiveConsent(body: { agreed: boolean }): Promise<void>
  putAdultConfirmation(body: { confirmed: true }): Promise<void>
  deleteHealthRecords(): Promise<void>
  deleteMe(): Promise<void>

  /* 그룹 (GRP) */
  getGroups(): Promise<GroupsResponse>
  createGroup(body: { type: 'FRIEND'; name: string } | { type: 'SOLO'; name?: string }): Promise<GroupDetail>
  getGroup(groupId: number): Promise<GroupDetail>
  getCollection(groupId: number): Promise<CollectionResponse>
  createInvite(groupId: number): Promise<InviteResponse>
  joinByInvite(code: string): Promise<GroupDetail>
  joinOnlineQueue(): Promise<OnlineQueueResponse>
  leaveOnlineQueue(): Promise<void>
  leaveGroup(groupId: number): Promise<void>
  blockMember(groupId: number, memberId: number): Promise<void>
  unblockMember(groupId: number, memberId: number): Promise<void>
  reportMember(groupId: number, memberId: number, body: { reason: ReportReason }): Promise<void>

  /* 기분 (MOOD) */
  putMoodToday(body: { mood: Mood }): Promise<MoodEntry>
  getMoods(from: string, to: string): Promise<{ moods: MoodEntry[] }>
  getHelpCard(): Promise<HelpCardResponse>
  dismissHelpCard(): Promise<void>

  /* 미션 (MIS) */
  getMissionToday(): Promise<MissionToday>
  startMission(body: StartMissionRequest): Promise<MissionToday>
  completeMission(): Promise<CompleteMissionResponse>
  getMyRecords(month: string): Promise<MyRecordsResponse>

  /* 핑 (PING) */
  sendPing(body: { emoji: PingEmoji }): Promise<{ groupIds: number[] }>
  getGroupPings(groupId: number): Promise<GroupPingsResponse>

  /* 점검 (CHK) */
  getCheckCurrent(): Promise<CheckCurrent>
  submitCheck(body: { answers: number[] }): Promise<CheckSubmitResponse>
  dismissCheck(): Promise<void>

  /* 도움받기 (HELP) — 인증 없이 열림 */
  getHelpItems(): Promise<HelpItemsResponse>
  getHelpSignals(): Promise<HelpSignals>

  /* 알림 (NOTI) */
  getNotificationSettings(): Promise<NotificationSettings>
  putNotificationSettings(body: NotificationSettings): Promise<NotificationSettings>
  addPushSubscription(body: PushSubscriptionRequest): Promise<void>
  removePushSubscription(body: { endpoint: string }): Promise<void>
  getVapidPublicKey(): Promise<{ publicKey: string }>

  /* 시연 (DEMO) — demo 프로필에서만 */
  putDemoClock(body: { now: string | null }): Promise<void>
}
