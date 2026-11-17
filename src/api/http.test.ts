import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from './errors'
import { httpApi } from './http'

/** 실서버 클라이언트의 에러 처리·CSRF 재시도 (백엔드 회신 2026-11-16 · 3절) */
type Reply = { status: number; body?: string }

let cookie = ''
let calls: { method: string; xsrf: string | undefined }[] = []

function serve(...replies: Reply[]) {
  calls = []
  const queue = [...replies]
  vi.stubGlobal('fetch', async (_url: string, init: RequestInit) => {
    const headers = init.headers as Record<string, string>
    calls.push({ method: init.method ?? 'GET', xsrf: headers['X-XSRF-TOKEN'] })
    const r = queue.shift() ?? { status: 204 }
    // 서버는 모든 응답에 새 XSRF-TOKEN 쿠키를 심는다
    cookie = `XSRF-TOKEN=token-${calls.length}`
    return new Response(r.body ?? null, { status: r.status })
  })
}

async function code(p: Promise<unknown>) {
  try {
    await p
    return 'OK'
  } catch (e) {
    return e instanceof ApiError ? `${e.status} ${e.code}` : String(e)
  }
}

const body = (code: string) => JSON.stringify({ code, message: '메시지' })

beforeEach(() => {
  cookie = 'XSRF-TOKEN=token-0'
  vi.stubGlobal('document', {
    get cookie() {
      return cookie
    },
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('CSRF', () => {
  it('상태 변경 요청에 쿠키 값을 X-XSRF-TOKEN 헤더로 붙인다', async () => {
    serve({ status: 204 })
    await httpApi.dismissCheck()
    expect(calls).toEqual([{ method: 'POST', xsrf: 'token-0' }])
  })
  it('CSRF_INVALID를 받으면 새 쿠키로 한 번만 다시 보낸다', async () => {
    serve({ status: 403, body: body('CSRF_INVALID') }, { status: 204 })
    expect(await code(httpApi.dismissCheck())).toBe('OK')
    expect(calls).toEqual([
      { method: 'POST', xsrf: 'token-0' },
      { method: 'POST', xsrf: 'token-1' },
    ])
  })
  it('다시 보내도 CSRF_INVALID면 그대로 실패한다 (무한 반복 없음)', async () => {
    serve({ status: 403, body: body('CSRF_INVALID') }, { status: 403, body: body('CSRF_INVALID') })
    expect(await code(httpApi.dismissCheck())).toBe('403 CSRF_INVALID')
    expect(calls).toHaveLength(2)
  })
  it('GET에는 헤더를 붙이지 않는다', async () => {
    serve({ status: 200, body: '{"weekStart":"2026-11-16","due":false,"done":false,"dismissed":false}' })
    await httpApi.getCheckCurrent()
    expect(calls).toEqual([{ method: 'GET', xsrf: undefined }])
  })
})

describe('에러 본문 {code, message}', () => {
  it.each([
    [400, 'MALFORMED_REQUEST'],
    [405, 'METHOD_NOT_ALLOWED'],
    [500, 'INTERNAL_ERROR'],
    [401, 'UNAUTHENTICATED'],
  ])('%i %s 를 그대로 넘긴다', async (status, c) => {
    serve({ status, body: body(c) })
    expect(await code(httpApi.getMe())).toBe(`${status} ${c}`)
  })
  it.each([
    [401, 'UNAUTHENTICATED'],
    [405, 'METHOD_NOT_ALLOWED'],
    [502, 'INTERNAL_ERROR'],
    [400, 'VALIDATION_FAILED'],
  ])('본문이 비었거나 JSON이 아니면(%i) 상태 코드로 %s', async (status, c) => {
    serve({ status, body: '<html>Bad Gateway</html>' })
    expect(await code(httpApi.getMe())).toBe(`${status} ${c}`)
  })
})
