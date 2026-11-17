/**
 * 이 기기 전용 IndexedDB (DB 'haengunping-device', 저장소 'kv' 하나).
 * 버전을 올리지 않고 키 이름으로 구분한다: 'profile', 'memory:YYYY-MM-DD' …
 * (버전을 올리면 이전 버전으로 여는 코드가 실패하므로 저장소는 하나로 둔다)
 */
import { isPersistenceFrozen } from './persistence'

const DB_NAME = 'haengunping-device'
const STORE = 'kv'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export const hasIndexedDb = () => typeof indexedDB !== 'undefined'

/**
 * 요청 하나를 트랜잭션으로 실행. 쓰기는 트랜잭션이 끝난 뒤(디스크 반영) resolve.
 * 저장 잠금(persistence.ts) 중에는 일반 쓰기를 건너뛴다 — 복구 코드만 force로 쓴다.
 */
export async function idb<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest, opts?: { force?: boolean }): Promise<T> {
  if (mode !== 'readonly' && isPersistenceFrozen() && !opts?.force) return undefined as T
  const db = await openDb()
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE, mode)
    const req = fn(tx.objectStore(STORE))
    let result: T
    req.onsuccess = () => {
      result = req.result as T
    }
    tx.oncomplete = () => {
      db.close()
      resolve(result)
    }
    tx.onerror = () => {
      db.close()
      reject(tx.error ?? req.error)
    }
    tx.onabort = () => {
      db.close()
      reject(tx.error ?? new Error('aborted'))
    }
  })
}

/** 접두어로 시작하는 키의 값을 모두 */
export async function idbGetAllByPrefix<T>(prefix: string): Promise<T[]> {
  const range = IDBKeyRange.bound(prefix, `${prefix}￿`)
  return idb<T[]>('readonly', (s) => s.getAll(range))
}
