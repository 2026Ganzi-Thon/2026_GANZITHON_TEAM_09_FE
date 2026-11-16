import { api } from '../api'

/**
 * 웹 푸시 (MVP 1종). 권한 요청은 기기에서, 정해진 시각 발송은 서버(VAPID)가 맡는다.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
  if (Notification.permission !== 'default') return Notification.permission
  try {
    return await Notification.requestPermission()
  } catch {
    return 'denied'
  }
}

export function notificationPermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
  return Notification.permission
}

function base64UrlToBytes(base64: string) {
  const pad = '='.repeat((4 - (base64.length % 4)) % 4)
  const raw = atob((base64 + pad).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(raw, (c) => c.charCodeAt(0))
}

/**
 * 알림 켜기: 권한 → [백엔드 연동] VAPID 공개키 받기 → 브라우저 구독 → 서버에 구독 등록.
 * 공개키가 비어 있으면(목업 서버·서버 미설정) 권한까지만 받고 'granted'를 돌려준다.
 */
export async function enablePush(): Promise<'subscribed' | 'granted' | 'denied' | 'unsupported'> {
  const permission = await requestNotificationPermission()
  if (permission === 'unsupported') return 'unsupported'
  if (permission !== 'granted') return 'denied'
  try {
    // [백엔드 연동] GET /push/vapid-public-key → POST /me/push-subscriptions
    const { publicKey } = await api.getVapidPublicKey()
    if (!publicKey || !('serviceWorker' in navigator) || !('PushManager' in window)) return 'granted'
    const reg = await navigator.serviceWorker.ready
    const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64UrlToBytes(publicKey) }))
    const json = sub.toJSON()
    await api.addPushSubscription({ endpoint: sub.endpoint, keys: { p256dh: json.keys?.p256dh ?? '', auth: json.keys?.auth ?? '' } })
    return 'subscribed'
  } catch {
    // 구독 실패는 앱 사용을 막지 않는다 (알림은 나중에 다시 켤 수 있음)
    return 'granted'
  }
}
