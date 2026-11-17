import { idb } from './idb'

/**
 * 이 기기의 '지금 계정' 데이터 한 덩어리 (계정 전환·시연 계정에서 쓴다).
 *
 * 지금 계정 데이터 = localStorage의 'haengunping:*' 전부(목업 서버 상태·기기 상태·화면 캐시)
 *                 + IndexedDB 'kv'에서 보관용 키('account:*', 'backup:*')를 뺀 전부(맞춤 정보 profile, 추억 기록 memory:*)
 * 계정 목록('haengunping-accounts')은 접두어가 달라 스냅샷에 들어가지 않는다.
 * 사진이 들어 있어 스냅샷은 localStorage가 아니라 IndexedDB에 둔다.
 */
export interface Snapshot {
  version: 1
  createdAt: number
  localStorage: Record<string, string>
  idb: [IDBValidKey, unknown][]
}

const LS_PREFIX = 'haengunping:'
const MOCK_STATE_KEY = 'haengunping:mock-server:v2'

export const isLiveIdbKey = (k: IDBValidKey) => !/^(account|backup):/.test(String(k))

function liveLocalStorageKeys() {
  return Object.keys(localStorage).filter((k) => k.startsWith(LS_PREFIX))
}

/** 지금(목업) 계정의 기본 정보. 계정이 없으면 null */
export function liveAccountInfo(): { nickname: string; createdAt: number; isDemo: boolean } | null {
  try {
    const raw = localStorage.getItem(MOCK_STATE_KEY)
    const a = raw ? JSON.parse(raw).account : null
    return a ? { nickname: a.nickname, createdAt: a.createdAt, isDemo: !!a.isDemo } : null
  } catch {
    return null
  }
}

export async function takeSnapshot(): Promise<Snapshot> {
  const keys = (await idb<IDBValidKey[]>('readonly', (s) => s.getAllKeys())).filter(isLiveIdbKey)
  const values = await Promise.all(keys.map((k) => idb<unknown>('readonly', (s) => s.get(k))))
  return {
    version: 1,
    createdAt: Date.now(),
    localStorage: Object.fromEntries(liveLocalStorageKeys().map((k) => [k, localStorage.getItem(k) ?? ''])),
    idb: keys.map((k, i) => [k, values[i]]),
  }
}

/** 스냅샷을 보관하고 다시 읽어 확인한다. 확인이 안 되면 throw (그 뒤 단계로 가지 않게) */
export async function putSnapshot(key: string, snap: Snapshot) {
  await idb('readwrite', (s) => s.put(snap, key), { force: true })
  const check = await idb<Snapshot | undefined>('readonly', (s) => s.get(key))
  if (!check || Object.keys(check.localStorage).length !== Object.keys(snap.localStorage).length || check.idb.length !== snap.idb.length) {
    throw new Error('보관한 데이터를 확인하지 못했어요')
  }
}

export const getSnapshot = (key: string) => idb<Snapshot | undefined>('readonly', (s) => s.get(key))

export const deleteSnapshot = (key: string) => idb('readwrite', (s) => s.delete(key), { force: true })

/** 지금 계정 데이터를 비운다 (보관된 계정·계정 목록은 그대로) */
export async function clearLiveData() {
  for (const k of liveLocalStorageKeys()) localStorage.removeItem(k)
  const keys = (await idb<IDBValidKey[]>('readonly', (s) => s.getAllKeys())).filter(isLiveIdbKey)
  for (const k of keys) await idb('readwrite', (s) => s.delete(k), { force: true })
}

/** 보관한 계정을 지금 계정 자리에 되살린다 (먼저 clearLiveData) */
export async function applySnapshot(snap: Snapshot) {
  for (const [k, v] of Object.entries(snap.localStorage)) localStorage.setItem(k, v)
  for (const [k, v] of snap.idb) await idb('readwrite', (s) => s.put(v, k), { force: true })
}
