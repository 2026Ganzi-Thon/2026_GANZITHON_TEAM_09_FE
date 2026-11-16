import type { HaengunApi } from './client'
import { httpApi } from './http'
import { mockApi } from './mock/server'

/**
 * VITE_API_MODE=http 이면 실서버(/api/v1), 그 외에는 기기 안의 목업 서버.
 * 화면 코드는 이 `api`만 쓴다.
 */
export const API_MODE: 'mock' | 'http' = import.meta.env.VITE_API_MODE === 'http' ? 'http' : 'mock'

export const api: HaengunApi = API_MODE === 'http' ? httpApi : mockApi

export { ApiError, errorMessage } from './errors'
export type * from './types'
