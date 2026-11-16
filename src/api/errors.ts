import type { ApiErrorCode } from './types'

/** 서버 에러 응답 `{ code, message }`를 그대로 담는다. 화면은 code로 분기한다. */
export class ApiError extends Error {
  readonly code: ApiErrorCode
  readonly status: number
  readonly fields?: string[]

  constructor(status: number, code: ApiErrorCode, message: string, fields?: string[]) {
    super(message)
    this.status = status
    this.code = code
    this.fields = fields
  }
}

/** 화면에 보여줄 문구. 서버 message가 있으면 그것을, 없으면 기본 문구 */
export function errorMessage(e: unknown, fallback = '잠시 후 다시 시도해 주세요'): string {
  if (e instanceof ApiError) {
    if (e.code === 'NETWORK') return '연결되면 다시 시도해 주세요'
    return e.message || fallback
  }
  return fallback
}
