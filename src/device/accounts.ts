import { useSyncExternalStore } from 'react'
import { API_MODE } from '../api'
import { seedMockDemo } from '../api/mock/server'
import { hasIndexedDb } from './idb'
import { freezePersistence } from './persistence'
import { setDeviceProfile } from './profile'
import { applySnapshot, clearLiveData, deleteSnapshot, getSnapshot, liveAccountInfo, putSnapshot, takeSnapshot, type Snapshot } from './snapshot'
import { updateDevice } from './store'

/**
 * 시연 계정 보관·복귀 (목업 모드 전용).
 *
 * 사용자가 계정을 고르고 바꾸는 '계정 관리' 화면은 없다 — 한 기기에서 다른 사람의 기분·점검 기록으로
 * 넘어갈 수 있는 길을 두지 않기 위해서다. 남은 용도는 시연 하나뿐이다:
 * 시연 데이터 불러오기 = 지금 계정을 보관하고 시연 계정을 만든다, 시연 종료 = 시연 계정을 지우고 보관한 계정으로 돌아간다.
 *
 * - 지금 쓰는 계정은 원래 저장 위치(localStorage 'haengunping:*', IndexedDB profile·memory:*)를 그대로 쓴다.
 * - 다른 계정은 IndexedDB 'account:{id}'에 스냅샷으로 보관한다. 전환 = 지금 계정을 보관 → 고른 계정을 되살림.
 * - 계정 목록은 localStorage 'haengunping-accounts' (스냅샷에 들어가지 않는 별도 키).
 * - 시연 데이터도 '시연 계정' 하나다. 시연 종료 = 시연 계정을 지우고 시연 전 계정으로 돌아감.
 *
 * 실서버는 로그인 쿠키(hp_session, HttpOnly)를 화면 코드가 바꿀 수 없어 계정 전환 API가 생기기 전까지 쓰지 않는다.
 * 데이터를 통째로 바꾸는 함수는 저장을 잠그고 끝난다 — 부른 쪽이 반드시 페이지를 다시 연다.
 */
export const ACCOUNTS_SUPPORTED = API_MODE === 'mock'

const REG_KEY = 'haengunping-accounts'
const slotKey = (id: string) => `account:${id}`

export interface AccountEntry {
  id: string
  nickname: string
  /** 계정을 만든 시각 (ms) */
  createdAt: number
  lastUsedAt: number
  isDemo?: boolean
  /** 시연 계정: 시연을 끝내면 돌아갈 계정 */
  demoReturnId?: string
}

interface Registry {
  version: 1
  activeId: string | null
  accounts: AccountEntry[]
  /** 다음 실행 때 할 일: 새 시연 계정 만들기 (지금 계정을 보관하고 다시 연 뒤). returnId = 시연을 끝내면 돌아갈 계정 */
  pending?: { kind: 'demo'; returnId: string | null }
}

const newId = () => `a${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

function readRegistry(): Registry | null {
  try {
    const raw = localStorage.getItem(REG_KEY)
    return raw ? (JSON.parse(raw) as Registry) : null
  } catch {
    return null
  }
}

function writeRegistry(r: Registry) {
  localStorage.setItem(REG_KEY, JSON.stringify(r))
  listeners.forEach((l) => l())
}

function registry(): Registry {
  return readRegistry() ?? { version: 1, activeId: null, accounts: [] }
}

const listeners = new Set<() => void>()
export function subscribeAccounts(l: () => void) {
  listeners.add(l)
  return () => listeners.delete(l)
}

let cachedRaw: string | null | undefined
let cached: { activeId: string | null; accounts: AccountEntry[] } = { activeId: null, accounts: [] }

/** 계정 목록 (useSyncExternalStore용으로 같은 값이면 같은 객체를 돌려준다) */
export function getAccounts(): { activeId: string | null; accounts: AccountEntry[] } {
  let raw: string | null = null
  try {
    raw = localStorage.getItem(REG_KEY)
  } catch {
    /* noop */
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw
    const r = registry()
    cached = { activeId: r.activeId, accounts: r.accounts }
  }
  return cached
}

export function useAccounts() {
  return useSyncExternalStore(subscribeAccounts, getAccounts, getAccounts)
}

function entryFromLive(id: string): AccountEntry | null {
  const live = liveAccountInfo()
  if (!live) return null
  return { id, nickname: live.nickname, createdAt: live.createdAt, lastUsedAt: Date.now(), isDemo: live.isDemo || undefined }
}

/**
 * 앱을 열 때 한 번 (렌더 전에).
 * 1) 처음이면: 지금 있는 계정을 '지금 계정'으로 등록만 한다 (데이터는 옮기지 않음 → 중복·손실 없음)
 * 2) 예전 시연 백업('backup:demo')이 있으면 보관 계정으로 바꾼다
 * 3) 전환 도중 멈췄던 경우를 되살린다
 * 4) 새 시연 계정 만들기가 예약돼 있으면 시연 데이터를 넣는다
 * 'reload'를 돌려주면 이미 읽어 둔 메모리 상태가 낡았으니 페이지를 다시 연다.
 */
export async function initAccounts(): Promise<'ok' | 'reload'> {
  if (!ACCOUNTS_SUPPORTED || !hasIndexedDb()) return 'ok'
  let r = readRegistry()
  if (!r) {
    r = { version: 1, activeId: null, accounts: [] }
    const live = entryFromLive(newId())
    if (live) {
      r.accounts.push(live)
      r.activeId = live.id
    }
    writeRegistry(r)
  }

  // 2) 예전 시연 백업 → 보관 계정
  const legacy = await getSnapshot('backup:demo').catch(() => undefined)
  if (legacy) {
    const id = newId()
    const meta = legacy as Snapshot & { nickname?: string }
    let createdAt = meta.createdAt
    try {
      createdAt = JSON.parse(meta.localStorage['haengunping:mock-server:v2']).account.createdAt ?? createdAt
    } catch {
      /* 그대로 */
    }
    await putSnapshot(slotKey(id), { version: 1, createdAt: meta.createdAt, localStorage: meta.localStorage, idb: meta.idb })
    r.accounts.push({ id, nickname: meta.nickname ?? '이전 계정', createdAt, lastUsedAt: meta.createdAt })
    const active = r.accounts.find((a) => a.id === r!.activeId)
    if (active?.isDemo && !active.demoReturnId) active.demoReturnId = id
    writeRegistry(r)
    await deleteSnapshot('backup:demo')
  }

  // 3) 전환 도중 멈춘 경우: 지금 계정 자리에 보관본이 남아 있다
  if (r.activeId) {
    const leftover = await getSnapshot(slotKey(r.activeId)).catch(() => undefined)
    if (leftover) {
      const live = liveAccountInfo()
      const activeEntry = r.accounts.find((a) => a.id === r!.activeId)
      // 지금 자리에 이미 그 계정이 되살려져 있으면 남은 보관본만 정리한다
      if (live && activeEntry && live.createdAt === activeEntry.createdAt) {
        await deleteSnapshot(slotKey(r.activeId))
      } else {
        // 지금 자리가 비었거나, 이전 계정이 아직 남아 있다(비우기 전에 멈춤).
        // 이전 계정은 이미 보관이 끝난 경우에만 비우고 되살린다 — 보관본이 없으면 아무것도 지우지 않는다
        const liveEntry = live ? r.accounts.find((a) => a.createdAt === live.createdAt && a.id !== r!.activeId) : undefined
        const liveIsSaved = !live || (liveEntry ? !!(await getSnapshot(slotKey(liveEntry.id)).catch(() => undefined)) : false)
        if (liveIsSaved) {
          freezePersistence()
          await clearLiveData()
          await applySnapshot(leftover)
          await deleteSnapshot(slotKey(r.activeId))
          return 'reload'
        }
      }
    }
  }

  // 4) 새 시연 계정 (지금 계정은 이미 보관하고 비운 상태로 다시 열림)
  if (r.pending?.kind === 'demo' && !liveAccountInfo()) {
    seedMockDemo()
    setDeviceProfile({ birthDate: '2000-05-14', sido: '서울특별시', sigungu: '마포구', job: 'STUDENT' })
    updateDevice({ onboarded: true })
    const entry = entryFromLive(newId())
    if (entry) {
      entry.demoReturnId = r.pending.returnId ?? undefined
      r.accounts.push(entry)
      r.activeId = entry.id
    }
    delete r.pending
    writeRegistry(r)
  } else if (r.pending && liveAccountInfo()) {
    delete r.pending
    writeRegistry(r)
  }
  return 'ok'
}

/** GET /me를 받을 때마다: 새로 만든 계정을 등록하고, 닉네임 바뀐 것을 목록에 맞춘다 */
export function syncActiveAccount(me: { nickname: string; createdAt: string; isDemo?: boolean }) {
  if (!ACCOUNTS_SUPPORTED) return
  const r = registry()
  const active = r.accounts.find((a) => a.id === r.activeId)
  if (!active) {
    const entry: AccountEntry = { id: newId(), nickname: me.nickname, createdAt: Date.parse(me.createdAt), lastUsedAt: Date.now(), isDemo: me.isDemo || undefined }
    r.accounts.push(entry)
    r.activeId = entry.id
    writeRegistry(r)
  } else if (active.nickname !== me.nickname || !!active.isDemo !== !!me.isDemo) {
    active.nickname = me.nickname
    active.isDemo = me.isDemo || undefined
    writeRegistry(r)
  }
}

/** 지금 계정을 보관한다 (계정이 있을 때만). 확인까지 끝나야 돌아온다 */
async function stashActive(r: Registry) {
  if (!r.activeId || !liveAccountInfo()) return
  await putSnapshot(slotKey(r.activeId), await takeSnapshot())
  const active = r.accounts.find((a) => a.id === r.activeId)
  if (active) active.lastUsedAt = Date.now()
}

/** 보관된 시연 계정으로 전환. 지금 계정은 보관되고 지워지지 않는다. 끝나면 페이지를 다시 연다 */
async function switchAccount(targetId: string) {
  const r = registry()
  if (targetId === r.activeId) return
  const target = await getSnapshot(slotKey(targetId))
  if (!target) throw new Error('보관된 계정을 찾지 못했어요')
  freezePersistence()
  await stashActive(r)
  // 순서: 목록의 '지금 계정'을 먼저 바꾼다 → 비우기 → 되살리기 → 보관본 지우기
  // (중간에 멈추면 다음 실행 때 initAccounts가 보관본으로 되살린다)
  r.activeId = targetId
  const entry = r.accounts.find((a) => a.id === targetId)
  if (entry) entry.lastUsedAt = Date.now()
  writeRegistry(r)
  await clearLiveData()
  await applySnapshot(target)
  await deleteSnapshot(slotKey(targetId))
}

/** 내 데이터 › 계정 삭제가 끝난 뒤: 목록에서 지금 계정을 뺀다 (보관된 다른 계정은 그대로) */
export function forgetActiveAccount() {
  if (!ACCOUNTS_SUPPORTED) return
  const r = registry()
  r.accounts = r.accounts.filter((a) => a.id !== r.activeId)
  for (const a of r.accounts) if (a.demoReturnId === r.activeId) delete a.demoReturnId
  r.activeId = null
  writeRegistry(r)
}

/* ── 시연 계정 ── */

export function activeAccount(): AccountEntry | undefined {
  const r = registry()
  return r.accounts.find((a) => a.id === r.activeId)
}

/**
 * 시연 데이터 불러오기. 지금 계정을 보관하고(확인까지) 비운 뒤, 다시 열면 initAccounts가 시연 계정을 만든다.
 * 보관된 시연 계정이 이미 있으면 새로 만들지 않고 그 계정으로 전환한다.
 */
export async function startDemoAccount(): Promise<'created' | 'switched'> {
  const r = registry()
  const savedDemo = r.accounts.find((a) => a.isDemo && a.id !== r.activeId)
  if (savedDemo) {
    await switchAccount(savedDemo.id)
    return 'switched'
  }
  freezePersistence()
  await stashActive(r)
  r.pending = { kind: 'demo', returnId: r.activeId }
  r.activeId = null
  writeRegistry(r)
  await clearLiveData()
  return 'created'
}

/** 시연 종료: 시연 계정을 지우고 시연 전 계정으로 돌아간다. 돌아갈 계정이 없으면 시작 화면 */
export async function endDemoAccount(): Promise<'restored' | 'none'> {
  const r = registry()
  const demo = r.accounts.find((a) => a.id === r.activeId)
  const returnId = demo?.demoReturnId
  const target = returnId ? await getSnapshot(slotKey(returnId)) : undefined
  freezePersistence()
  r.accounts = r.accounts.filter((a) => a.id !== r.activeId)
  r.activeId = target && returnId ? returnId : null
  writeRegistry(r)
  await clearLiveData()
  if (!target || !returnId) return 'none'
  await applySnapshot(target)
  await deleteSnapshot(slotKey(returnId))
  return 'restored'
}
