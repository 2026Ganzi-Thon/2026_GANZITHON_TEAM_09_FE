import { QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './index'
import { getDevice, updateDevice } from '../device/store'
import { unseenCompletions } from '../features/character/completions'
import { isPersistenceFrozen } from '../device/persistence'
import { syncActiveAccount } from '../device/accounts'
import { ApiError } from './errors'
import type { GroupsResponse, MissionToday, Mood, NotificationSettings, PingEmoji, ReportReason, StartMissionRequest } from './types'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // 계정 없음·권한 없음은 다시 시도해도 같다
      retry: (count, e) => !(e instanceof ApiError && e.status >= 400 && e.status < 500) && count < 2,
      refetchOnWindowFocus: true,
    },
  },
})

/** 쿼리 키 한곳에서 관리 (무엇을 다시 불러올지 헷갈리지 않게) */
export const qk = {
  me: ['me'] as const,
  groups: ['groups'] as const,
  group: (id: number) => ['group', id] as const,
  pings: (id: number) => ['group', id, 'pings'] as const,
  collection: (id: number) => ['group', id, 'collection'] as const,
  mission: ['mission', 'today'] as const,
  helpCard: ['help-card'] as const,
  moods: (from: string, to: string) => ['moods', from, to] as const,
  records: (month: string) => ['records', month] as const,
  check: ['check', 'current'] as const,
  helpItems: ['help', 'items'] as const,
  helpSignals: ['help', 'signals'] as const,
  notification: ['notification-settings'] as const,
}

/* ── 조회 ── */

/** GET /me. 계정이 없으면 data = null (401을 '계정 없음'으로 본다) */
export function useMe() {
  return useQuery({
    queryKey: qk.me,
    queryFn: async () => {
      try {
        const me = await api.getMe()
        writeCache('me', { today: me.today })
        // 목업 다중 계정: 새로 만든 계정 등록·닉네임 맞추기 (저장 잠금 중에는 하지 않음)
        if (!isPersistenceFrozen()) syncActiveAccount(me)
        return me
      } catch (e) {
        if (e instanceof ApiError && e.code === 'UNAUTHENTICATED') return null
        throw e
      }
    },
  })
}

/*
 * 오프라인 대비 (UserFlow S20 '오프라인'): 그룹 목록·오늘 미션은 마지막으로 받은 값을 기기에 남겨 두고,
 * 앱을 다시 열었을 때 먼저 보여준 뒤 연결되면 새로 받는다.
 */
const CACHE_PREFIX = 'haengunping:cache:'

function readCache<T>(key: string): T | undefined {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key)
    return raw ? (JSON.parse(raw) as T) : undefined
  } catch {
    return undefined
  }
}

function writeCache(key: string, value: unknown) {
  if (isPersistenceFrozen()) return
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(value))
  } catch {
    /* 저장 공간 부족 등 */
  }
}

/** 계정 삭제 등에서 기기에 남긴 서버 응답을 지운다 */
export function clearPersistedCache() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(CACHE_PREFIX))
      .forEach((k) => localStorage.removeItem(k))
  } catch {
    /* noop */
  }
}

/**
 * GET /groups. 완성 연출 대상(justCompleted)은 받자마자 기기에 남긴다 (S26).
 * 실서버는 그날 하루 동안 계속 주므로 이미 본 완성은 다시 넣지 않는다.
 */
async function fetchGroups() {
  const res = await api.getGroups()
  writeCache('groups', { ...res, groups: res.groups.map(({ justCompleted: _drop, ...g }) => g) })
  const done = unseenCompletions(res.groups, getDevice().seenCompletions)
  if (done.length) {
    updateDevice((d) => ({
      pendingCompletions: {
        ...d.pendingCompletions,
        ...Object.fromEntries(
          done.map((g) => [g.groupId, { groupName: g.name, groupType: g.type, kind: g.justCompleted!.kind, completedOn: g.justCompleted!.completedOn, memberCount: g.memberCount }]),
        ),
      },
    }))
  }
  return res
}

export const useGroups = (enabled = true) =>
  useQuery({
    queryKey: qk.groups,
    queryFn: fetchGroups,
    enabled,
    initialData: () => readCache<GroupsResponse>('groups'),
    initialDataUpdatedAt: 0,
  })
export const useGroup = (id: number) => useQuery({ queryKey: qk.group(id), queryFn: () => api.getGroup(id), enabled: id > 0 })
export const useGroupPings = (id: number) => useQuery({ queryKey: qk.pings(id), queryFn: () => api.getGroupPings(id), enabled: id > 0 })
export const useCollection = (id: number) =>
  useQuery({ queryKey: qk.collection(id), queryFn: () => api.getCollection(id), enabled: id > 0 })
export const useMissionToday = (enabled = true) =>
  useQuery({
    queryKey: qk.mission,
    queryFn: async () => {
      const res = await api.getMissionToday()
      writeCache('mission', res)
      return res
    },
    enabled,
    // 날짜가 지난 캐시는 쓰지 않는다
    initialData: () => {
      const cached = readCache<MissionToday>('mission')
      return cached && cached.date === readCache<{ today: string }>('me')?.today ? cached : undefined
    },
    initialDataUpdatedAt: 0,
  })
export const useHelpCard = (enabled = true) => useQuery({ queryKey: qk.helpCard, queryFn: api.getHelpCard, enabled })
export const useMoods = (from: string, to: string, enabled = true) =>
  useQuery({ queryKey: qk.moods(from, to), queryFn: () => api.getMoods(from, to), enabled: enabled && !!from })
export const useRecords = (month: string, enabled = true) =>
  useQuery({ queryKey: qk.records(month), queryFn: () => api.getMyRecords(month), enabled: enabled && !!month })
export const useCheckCurrent = (enabled = true) => useQuery({ queryKey: qk.check, queryFn: api.getCheckCurrent, enabled })
export const useHelpItems = () => useQuery({ queryKey: qk.helpItems, queryFn: api.getHelpItems, staleTime: 5 * 60_000 })
export const useHelpSignals = () => useQuery({ queryKey: qk.helpSignals, queryFn: api.getHelpSignals })
export const useNotificationSettings = () => useQuery({ queryKey: qk.notification, queryFn: api.getNotificationSettings })

/* ── 변경 ── 성공하면 영향 받는 조회를 다시 부른다 */

function useInvalidate() {
  const qc = useQueryClient()
  return (...keys: readonly (readonly unknown[])[]) => Promise.all(keys.map((queryKey) => qc.invalidateQueries({ queryKey })))
}

export function useCreateAccount() {
  const inv = useInvalidate()
  return useMutation({ mutationFn: (nickname: string) => api.createAccount({ nickname }), onSuccess: () => inv(qk.me) })
}

export function usePatchMe() {
  const inv = useInvalidate()
  return useMutation({ mutationFn: (nickname: string) => api.patchMe({ nickname }), onSuccess: () => inv(qk.me, ['group']) })
}

export function useSensitiveConsent() {
  const inv = useInvalidate()
  return useMutation({ mutationFn: (agreed: boolean) => api.putSensitiveConsent({ agreed }), onSuccess: () => inv(qk.me) })
}

export function useAdultConfirmation() {
  const inv = useInvalidate()
  return useMutation({ mutationFn: () => api.putAdultConfirmation({ confirmed: true }), onSuccess: () => inv(qk.me) })
}

export function useDeleteHealthRecords() {
  const inv = useInvalidate()
  return useMutation({ mutationFn: api.deleteHealthRecords, onSuccess: () => inv(['moods'], qk.helpCard, qk.check, qk.helpSignals) })
}

export function usePutMood() {
  const inv = useInvalidate()
  return useMutation({ mutationFn: (mood: Mood) => api.putMoodToday({ mood }), onSuccess: () => inv(['moods'], qk.helpCard, qk.helpSignals, qk.mission) })
}

export function useDismissHelpCard() {
  const inv = useInvalidate()
  return useMutation({ mutationFn: api.dismissHelpCard, onSuccess: () => inv(qk.helpCard) })
}

export function useCreateGroup() {
  const inv = useInvalidate()
  return useMutation({
    mutationFn: (b: { type: 'FRIEND'; name: string } | { type: 'SOLO' }) => api.createGroup(b),
    onSuccess: () => inv(qk.groups),
  })
}

export function useCreateInvite() {
  return useMutation({ mutationFn: (groupId: number) => api.createInvite(groupId) })
}

export function useJoinByInvite() {
  const inv = useInvalidate()
  return useMutation({ mutationFn: (code: string) => api.joinByInvite(code), onSuccess: () => inv(qk.groups) })
}

export function useJoinOnlineQueue() {
  const inv = useInvalidate()
  return useMutation({ mutationFn: api.joinOnlineQueue, onSuccess: () => inv(qk.groups) })
}

export function useLeaveOnlineQueue() {
  const inv = useInvalidate()
  return useMutation({ mutationFn: api.leaveOnlineQueue, onSuccess: () => inv(qk.groups) })
}

export function useLeaveGroup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (groupId: number) => api.leaveGroup(groupId),
    onSuccess: (_d, groupId) => {
      qc.removeQueries({ queryKey: ['group', groupId] })
      return qc.invalidateQueries({ queryKey: qk.groups })
    },
  })
}

export function useBlockMember() {
  const inv = useInvalidate()
  return useMutation({
    mutationFn: ({ groupId, memberId, block }: { groupId: number; memberId: number; block: boolean }) =>
      block ? api.blockMember(groupId, memberId) : api.unblockMember(groupId, memberId),
    onSuccess: (_d, v) => inv(qk.pings(v.groupId)),
  })
}

export function useReportMember() {
  return useMutation({
    mutationFn: ({ groupId, memberId, reason }: { groupId: number; memberId: number; reason: ReportReason }) =>
      api.reportMember(groupId, memberId, { reason }),
  })
}

export function useStartMission() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (b: StartMissionRequest) => api.startMission(b),
    onSuccess: (data) => {
      qc.setQueryData(qk.mission, data)
      // 기기 캐시도 '진행 중'으로 바꿔 둔다. 안 그러면 새로고침 때 '시작 전' 캐시를 먼저 보고 타이머에서 튕긴다
      writeCache('mission', data)
    },
  })
}

export function useCompleteMission() {
  const inv = useInvalidate()
  return useMutation({ mutationFn: api.completeMission, onSuccess: () => inv(qk.mission, qk.groups, ['group'], ['records']) })
}

export function useSendPing() {
  const inv = useInvalidate()
  return useMutation({ mutationFn: (emoji: PingEmoji) => api.sendPing({ emoji }), onSuccess: () => inv(['group']) })
}

export function useSubmitCheck() {
  const inv = useInvalidate()
  return useMutation({ mutationFn: (answers: number[]) => api.submitCheck({ answers }), onSuccess: () => inv(qk.check, qk.helpSignals) })
}

export function useDismissCheck() {
  const inv = useInvalidate()
  return useMutation({ mutationFn: api.dismissCheck, onSuccess: () => inv(qk.check) })
}

export function usePutNotificationSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (b: NotificationSettings) => api.putNotificationSettings(b),
    onSuccess: (data) => qc.setQueryData(qk.notification, data),
  })
}

export function useDemoClock() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: (now: string | null) => api.putDemoClock({ now }), onSuccess: () => qc.invalidateQueries() })
}
