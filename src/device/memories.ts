import { useSyncExternalStore } from 'react'
import { getDevice, updateDevice } from './store'
import { hasIndexedDb, idb, idbGetAllByPrefix } from './idb'

/**
 * 추억 기록: 미션을 한 날의 사진·한 줄 메모. **이 기기의 IndexedDB에만** 저장하고 서버로 보내지 않는다
 * (PRD: 그룹 안 사진 공유 없음, 미션 사진은 이 기기에만).
 * 하루에 기록 하나 (키 'memory:YYYY-MM-DD').
 */
export interface Memory {
  /** 미션 날짜 (KST) */
  date: string
  /** 저장할 때의 미션 문구. 예전 사진(이전 저장소에서 옮긴 것)은 없을 수 있다 */
  missionText?: string
  /** 480px로 줄인 JPEG data URL */
  photo?: string
  /** 한 줄 메모 (MEMO_MAX자 이내) */
  memo?: string
  updatedAt: number
}

export const MEMO_MAX = 40
const PREFIX = 'memory:'

let memories: Memory[] = []
const listeners = new Set<() => void>()

const sortDesc = (list: Memory[]) => [...list].sort((a, b) => b.date.localeCompare(a.date))

function emit(next: Memory[]) {
  memories = sortDesc(next)
  listeners.forEach((l) => l())
}

/**
 * 예전 저장소(localStorage의 기기 상태 missionPhotos)의 사진을 IndexedDB로 옮긴다.
 * - 같은 날 기록이 이미 있으면 그 기록을 그대로 두고 사진만 비어 있을 때 채운다
 * - 모든 쓰기가 끝난 뒤에만 예전 값을 지운다 (중간에 실패하면 다음 실행 때 다시 옮긴다)
 */
async function migrateLegacyPhotos(existing: Memory[]): Promise<Memory[]> {
  const legacy = getDevice().missionPhotos ?? {}
  const dates = Object.keys(legacy)
  if (!dates.length) return existing
  const byDate = new Map(existing.map((m) => [m.date, m]))
  for (const date of dates) {
    const prev = byDate.get(date)
    if (prev?.photo) continue
    const next: Memory = { ...prev, date, photo: legacy[date], updatedAt: prev?.updatedAt ?? Date.now() }
    await idb('readwrite', (s) => s.put(next, PREFIX + date))
    byDate.set(date, next)
  }
  updateDevice({ missionPhotos: {} })
  return [...byDate.values()]
}

/** 앱 시작 때 한 번 (렌더 전에 await). 실패해도 앱은 연다 */
export async function loadMemories() {
  if (!hasIndexedDb()) return
  try {
    const stored = await idbGetAllByPrefix<Memory>(PREFIX)
    emit(await migrateLegacyPhotos(stored))
  } catch {
    // 읽기·옮기기 실패: 예전 사진은 기기 상태에 그대로 남아 있어 다음 실행 때 다시 시도한다
  }
}

export function getMemory(date: string): Memory | undefined {
  return memories.find((m) => m.date === date)
}

/** 사진·메모를 저장한다. 둘 다 비면 기록을 지운다 */
export async function saveMemory(date: string, patch: Partial<Omit<Memory, 'date' | 'updatedAt'>>) {
  const prev = getMemory(date)
  const next: Memory = { ...prev, ...patch, date, updatedAt: Date.now() }
  if (next.memo !== undefined) next.memo = next.memo.trim().slice(0, MEMO_MAX) || undefined
  if (!next.photo && !next.memo) return deleteMemory(date)
  await idb('readwrite', (s) => s.put(next, PREFIX + date))
  emit([...memories.filter((m) => m.date !== date), next])
}

export async function deleteMemory(date: string) {
  await idb('readwrite', (s) => s.delete(PREFIX + date))
  emit(memories.filter((m) => m.date !== date))
}

/** 계정 삭제·시연 데이터 불러오기: 이 기기의 추억 기록을 모두 지운다 */
export async function clearMemories() {
  const dates = memories.map((m) => m.date)
  emit([])
  if (!hasIndexedDb()) return
  try {
    const keys = await idb<IDBValidKey[]>('readonly', (s) => s.getAllKeys(IDBKeyRange.bound(PREFIX, `${PREFIX}￿`)))
    for (const k of new Set([...keys, ...dates.map((d) => PREFIX + d)])) await idb('readwrite', (s) => s.delete(k))
  } catch {
    /* noop */
  }
}

export function useMemories(): Memory[] {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => memories,
    () => memories,
  )
}

export function useMemory(date: string | undefined): Memory | undefined {
  return useMemories().find((m) => m.date === date)
}
