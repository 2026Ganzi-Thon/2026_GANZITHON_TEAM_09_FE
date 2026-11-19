/*
 * 웹 푸시 받기 (NOTI-02·03). vite.config.ts의 workbox.importScripts로 서비스 워커에 붙는다.
 * 서버가 보내는 내용: {"title","body","url"} (백엔드 PushMessage, 회신(2) 2-3절).
 * 문구는 서버 고정값이고 기분·점검 내용이 없다(NOTI-04). 누르면 앱의 url(기본 '/')로 간다.
 */
self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = {}
  }
  const title = typeof data.title === 'string' && data.title ? data.title : '행운핑'
  const body = typeof data.body === 'string' ? data.body : ''
  const url = typeof data.url === 'string' ? data.url : '/'
  event.waitUntil(self.registration.showNotification(title, { body, icon: '/icon.svg', badge: '/icon.svg', data: { url } }))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  // 앱 안 주소만 연다 (다른 사이트로 나가는 링크를 두지 않는다)
  let target = new URL('/', self.location.origin)
  try {
    const u = new URL(event.notification.data?.url || '/', self.location.origin)
    if (u.origin === self.location.origin) target = u
  } catch {
    // 잘못된 주소면 '/'
  }
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
      const open = wins.find((w) => new URL(w.url).origin === self.location.origin)
      if (open) return open.focus().then((w) => (w && 'navigate' in w ? w.navigate(target.href) : w))
      return self.clients.openWindow(target.href)
    }),
  )
})
