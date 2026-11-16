import type { HaengunApi } from './client'
import { ApiError } from './errors'
import type { ApiErrorBody } from './types'

/**
 * 실서버 구현. 화면과 API는 같은 도메인(`/api/v1`)이라 쿠키(hp_session)가 자동으로 붙는다.
 * 상태 변경 요청에는 XSRF-TOKEN 쿠키 값을 X-XSRF-TOKEN 헤더로 보낸다(Spring CookieCsrfTokenRepository).
 */
const BASE = '/api/v1'

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (method !== 'GET') {
    const xsrf = readCookie('XSRF-TOKEN')
    if (xsrf) headers['X-XSRF-TOKEN'] = xsrf
  }

  let res: Response
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      credentials: 'same-origin',
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, 'NETWORK', '연결되면 다시 시도해 주세요')
  }

  if (res.status === 204) return undefined as T
  const text = await res.text()
  const data = text ? JSON.parse(text) : undefined
  if (!res.ok) {
    const err = (data ?? {}) as Partial<ApiErrorBody>
    throw new ApiError(res.status, err.code ?? 'VALIDATION_FAILED', err.message ?? '', err.fields)
  }
  return data as T
}

const get = <T>(path: string) => request<T>('GET', path)
const post = <T>(path: string, body?: unknown) => request<T>('POST', path, body)
const put = <T>(path: string, body?: unknown) => request<T>('PUT', path, body)
const patch = <T>(path: string, body?: unknown) => request<T>('PATCH', path, body)
const del = <T>(path: string, body?: unknown) => request<T>('DELETE', path, body)
const q = encodeURIComponent

export const httpApi: HaengunApi = {
  createAccount: (b) => post('/accounts', b),
  getMe: () => get('/me'),
  patchMe: (b) => patch('/me', b),
  putSensitiveConsent: (b) => put('/me/consents/sensitive', b),
  putAdultConfirmation: (b) => put('/me/adult-confirmation', b),
  deleteHealthRecords: () => del('/me/health-records'),
  deleteMe: () => del('/me'),

  getGroups: () => get('/groups'),
  createGroup: (b) => post('/groups', b),
  getGroup: (id) => get(`/groups/${id}`),
  getCollection: (id) => get(`/groups/${id}/collection`),
  createInvite: (id) => post(`/groups/${id}/invites`),
  joinByInvite: (code) => post(`/invites/${q(code)}/join`),
  joinOnlineQueue: () => post('/groups/online-queue'),
  leaveOnlineQueue: () => del('/groups/online-queue'),
  leaveGroup: (id) => del(`/groups/${id}/members/me`),
  blockMember: (g, m) => post(`/groups/${g}/members/${m}/block`),
  unblockMember: (g, m) => del(`/groups/${g}/members/${m}/block`),
  reportMember: (g, m, b) => post(`/groups/${g}/members/${m}/reports`, b),

  putMoodToday: (b) => put('/moods/today', b),
  getMoods: (from, to) => get(`/moods?from=${q(from)}&to=${q(to)}`),
  getHelpCard: () => get('/help-card'),
  dismissHelpCard: () => post('/help-card/dismiss'),

  getMissionToday: () => get('/missions/today'),
  startMission: (b) => post('/missions/today/start', b),
  completeMission: () => post('/missions/today/complete'),
  getMyRecords: (month) => get(`/me/records?month=${q(month)}`),

  sendPing: (b) => post('/pings', b),
  getGroupPings: (id) => get(`/groups/${id}/pings`),

  getCheckCurrent: () => get('/checks/current'),
  submitCheck: (b) => post('/checks', b),
  dismissCheck: () => post('/checks/current/dismiss'),

  getHelpItems: () => get('/help/items'),
  getHelpSignals: () => get('/help/signals'),

  getNotificationSettings: () => get('/me/notification-settings'),
  putNotificationSettings: (b) => put('/me/notification-settings', b),
  addPushSubscription: (b) => post('/me/push-subscriptions', b),
  removePushSubscription: (b) => del('/me/push-subscriptions', b),
  getVapidPublicKey: () => get('/push/vapid-public-key'),

  putDemoClock: (b) => put('/demo/clock', b),
}
