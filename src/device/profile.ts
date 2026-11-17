import { useSyncExternalStore } from 'react'
import type { Job } from '../api/types'
import { hasIndexedDb, idb } from './idb'

/**
 * 선택 정보 3가지(생년월일·거주 지역·지금 하는 일)는 기기에만 저장한다 (architecture 5절).
 * IndexedDB에 두고, 어떤 API 요청에도 싣지 않는다. 도움받기 필터 전용.
 */
export interface DeviceProfile {
  birthDate?: string
  sido?: string
  sigungu?: string
  job?: Job
}

const KEY = 'profile'

let profile: DeviceProfile = {}
const listeners = new Set<() => void>()

/** 앱 시작 때 한 번 불러 둔다 (렌더 전에 await) */
export async function loadDeviceProfile() {
  try {
    if (!hasIndexedDb()) return
    profile = ((await idb<DeviceProfile | undefined>('readonly', (s) => s.get(KEY))) ?? {}) as DeviceProfile
  } catch {
    profile = {}
  }
}

export function getDeviceProfile(): DeviceProfile {
  return profile
}

export function setDeviceProfile(next: DeviceProfile) {
  // 빈 값은 지운다 (모르는 정보는 숨기는 조건으로 쓰지 않으므로 '없음'과 같다)
  profile = Object.fromEntries(Object.entries(next).filter(([, v]) => v !== undefined && v !== '')) as DeviceProfile
  listeners.forEach((l) => l())
  void idb('readwrite', (s) => s.put(profile, KEY)).catch(() => {})
}

/** 계정 삭제: 빈 값으로 덮지 않고 저장 키 자체를 지운다 */
export function clearDeviceProfile() {
  profile = {}
  listeners.forEach((l) => l())
  void idb('readwrite', (s) => s.delete(KEY)).catch(() => {})
}

export function useDeviceProfile(): DeviceProfile {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    getDeviceProfile,
    getDeviceProfile,
  )
}
