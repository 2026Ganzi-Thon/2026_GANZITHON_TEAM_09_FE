import { useSyncExternalStore } from 'react'
import type { Job } from '../api/types'

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

const DB_NAME = 'haengunping-device'
const STORE = 'kv'
const KEY = 'profile'

let profile: DeviceProfile = {}
const listeners = new Set<() => void>()

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function idb<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest): Promise<T> {
  const db = await openDb()
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE, mode)
    const req = fn(tx.objectStore(STORE))
    req.onsuccess = () => resolve(req.result as T)
    req.onerror = () => reject(req.error)
  })
}

/** 앱 시작 때 한 번 불러 둔다 (렌더 전에 await) */
export async function loadDeviceProfile() {
  try {
    if (typeof indexedDB === 'undefined') return
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

export function clearDeviceProfile() {
  setDeviceProfile({})
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
