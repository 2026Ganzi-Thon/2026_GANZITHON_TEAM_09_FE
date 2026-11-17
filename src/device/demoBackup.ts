import { hasIndexedDb, idb } from './idb'
import { freezePersistence } from './persistence'
import { applySnapshot, clearLiveData, deleteSnapshot, getSnapshot, liveAccountInfo, putSnapshot, takeSnapshot, type Snapshot } from './snapshot'

/**
 * 시연 데이터 백업·복구 (목업 모드 전용). 한 기기에는 익명 계정 하나만 쓴다(MVP).
 *
 * '시연 데이터 불러오기' 전에 지금 계정 데이터 전체(localStorage 'haengunping:*' + IndexedDB의 profile·memory:*)를
 * IndexedDB 'backup:demo'에 한 덩어리로 남기고, '시연 종료' 때 그대로 되돌린다.
 * - 백업은 하나만. 이미 있으면(시연 중) 덮어쓰지 않는다 → 시연 데이터가 원래 데이터를 덮지 않는다
 * - 백업은 다시 읽어 확인한 뒤에만 성공. 실패하면 시연 데이터를 불러오지 않는다
 * - 복구는 저장을 잠근 뒤 하고, 끝나면 백업을 지운다. 부른 쪽이 페이지를 다시 연다
 */
const BACKUP_KEY = 'backup:demo'

export interface DemoBackupMeta {
  createdAt: number
  /** 백업한 계정의 닉네임 (확인 문구용) */
  nickname?: string
}

type DemoBackup = Snapshot & { nickname?: string }

export async function getDemoBackupMeta(): Promise<DemoBackupMeta | null> {
  if (!hasIndexedDb()) return null
  const b = (await getSnapshot(BACKUP_KEY)) as DemoBackup | undefined
  return b ? { createdAt: b.createdAt, nickname: b.nickname } : null
}

/** 시연 데이터를 불러오기 직전에. 이미 백업이 있으면 그대로 둔다('kept') */
export async function backupBeforeDemo(nickname: string | undefined): Promise<'created' | 'kept'> {
  if (!hasIndexedDb()) throw new Error('IndexedDB를 쓸 수 없어요')
  if (await getDemoBackupMeta()) return 'kept'
  await putSnapshot(BACKUP_KEY, { ...(await takeSnapshot()), nickname } as DemoBackup)
  return 'created'
}

/**
 * 시연 종료: 지금(시연) 데이터를 비우고 백업으로 되돌린다. 백업이 없으면 시연 데이터만 비운다('none' → 시작 화면).
 * 부른 뒤에는 반드시 페이지를 다시 연다.
 */
export async function endDemo(): Promise<'restored' | 'none'> {
  if (!hasIndexedDb()) throw new Error('IndexedDB를 쓸 수 없어요')
  const backup = await getSnapshot(BACKUP_KEY)
  freezePersistence()
  await clearLiveData()
  if (!backup) return 'none'
  // 다 쓴 뒤에만 백업을 지운다 (중간에 실패하면 백업이 남아 다시 시도할 수 있다)
  await applySnapshot(backup)
  await deleteSnapshot(BACKUP_KEY)
  return 'restored'
}

/**
 * 한때 있던 다중 계정 기능(2026-11-17, MVP에서 제외)의 흔적 정리. 앱을 열 때 한 번 (렌더 전에).
 * - 시연 계정으로 바꿔 둔 기기: 시연 전 계정 보관본을 'backup:demo'로 옮겨 시연 종료로 돌아갈 수 있게 한다
 * - 전환 도중 멈춰 지금 자리가 빈 기기: 지금 계정 보관본을 되살린다 ('reload')
 * - 그 밖에 보관된 계정('account:*')은 지우지 않고 둔다 (데이터를 임의로 지우지 않는다)
 */
const LEGACY_REGISTRY = 'haengunping-accounts'

export async function migrateLegacyAccounts(): Promise<'ok' | 'reload'> {
  if (!hasIndexedDb()) return 'ok'
  let raw: string | null = null
  try {
    raw = localStorage.getItem(LEGACY_REGISTRY)
  } catch {
    return 'ok'
  }
  if (!raw) return 'ok'
  const reg = JSON.parse(raw) as {
    activeId: string | null
    accounts: { id: string; nickname: string; isDemo?: boolean; demoReturnId?: string }[]
    pending?: { kind: 'demo'; returnId: string | null }
  }
  const slot = (id: string) => `account:${id}`
  const live = liveAccountInfo()

  // 지금 자리가 비었는데 되살릴 보관본이 있다 (전환·시연 시작 도중 멈춤)
  const restoreId = !live ? (reg.activeId ?? reg.pending?.returnId ?? null) : null
  if (restoreId) {
    const snap = await getSnapshot(slot(restoreId))
    if (snap) {
      freezePersistence()
      await clearLiveData()
      await applySnapshot(snap)
      await deleteSnapshot(slot(restoreId))
      localStorage.removeItem(LEGACY_REGISTRY)
      return 'reload'
    }
  }

  // 시연 계정이면 돌아갈 계정을 시연 백업으로
  const active = reg.accounts.find((a) => a.id === reg.activeId)
  if (live && active?.isDemo && active.demoReturnId && !(await getDemoBackupMeta())) {
    const snap = await getSnapshot(slot(active.demoReturnId))
    if (snap) {
      const nickname = reg.accounts.find((a) => a.id === active.demoReturnId)?.nickname
      await putSnapshot(BACKUP_KEY, { ...snap, nickname } as DemoBackup)
      await deleteSnapshot(slot(active.demoReturnId))
    }
  }
  localStorage.removeItem(LEGACY_REGISTRY)
  // 지금 계정 자리에 남은 보관본(전환 직후 멈춤)은 지금 데이터와 같으므로 정리
  if (live && reg.activeId) await idb('readwrite', (s) => s.delete(slot(reg.activeId!)), { force: true }).catch(() => {})
  return 'ok'
}
