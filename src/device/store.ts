import { useSyncExternalStore } from 'react'
import type { GroupType, MissionMinutes, Place } from '../api/types'
import { isPersistenceFrozen } from './persistence'

/**
 * 서버에 두지 않는, 이 기기만의 화면 상태.
 * (서버 데이터는 API로, 선택 정보 3가지는 device/profile.ts의 IndexedDB로)
 */
export interface DeviceState {
  /** 온보딩을 끝냈는지 (계정 생성 이후 단계 진행 여부) */
  onboarded: boolean
  /** 계정을 만든 뒤 멈춘 온보딩 단계 (다음 실행 때 여기서 이어서) */
  onboardingStep?: OnboardingStep
  /** 기분 팝업을 마지막으로 띄운 날 — GET /me의 today와 비교 (UserFlow 2절) */
  moodPromptDay?: string
  /** 미션을 시작한 그룹 화면 (완료 화면에서 대표로 보여줄 그룹) */
  missionFromGroupId?: number
  /** 시작할 때 고른 값 (서버 응답에 없을 때 타이머가 쓴다) */
  missionChoice?: { day: string; minutes: MissionMinutes; place: Place; size: number; startedAtLocal: number }
  /** 완료 직후 결과 (성장 전후). 새로고침해도 완료 화면을 그대로 보여준다 */
  lastCompletion?: LastCompletion
  /** 핑을 보낸 날들 (내 기록 '남긴 핑' — API에 없는 값이라 기기에서 센다) */
  pingDays: string[]
  /** 내가 차단한 구성원 (화면 표시용, 실제 차단은 서버) */
  blockedMemberIds: number[]
  /** 그룹별 마지막으로 만든 초대 코드 */
  invites: Record<number, { code: string; expiresAt: string }>
  /**
   * S26 완성 연출 대기열: GET /groups의 justCompleted를 받는 즉시 여기에 남기고,
   * 사용자가 완성 화면을 보면 지운다.
   */
  pendingCompletions: Record<number, { groupName: string; kind: string; completedOn: string; memberCount: number; /** 1인 그룹이면 닉네임으로 보이게 (예전 기록엔 없음) */ groupType?: GroupType }>
  /**
   * 이미 본 완성 연출 (`그룹ID:완성일`, 최근 30개). 실서버는 justCompleted를 그날 하루 동안 계속 주므로
   * 본 것은 다시 대기열에 넣지 않는다 (features/character/completions.ts)
   */
  seenCompletions: string[]
  /**
   * (예전 저장소) 미션 사진. 2026-11-17부터 추억 기록은 IndexedDB(device/memories.ts)에 둔다.
   * 앱을 열 때 남아 있는 값을 옮기고 비운다 — 새로 쓰지 않는다.
   */
  missionPhotos: Record<string, string>
  /**
   * 캐릭터 개인 별명 (나만 보는 화면에서만, 서버로 보내지 않음).
   * 키는 `${groupId}:${characterId}` — characterId가 없으면 별명을 붙이지 않는다
   */
  characterNicknames: Record<string, string>
}

/** 계정(S04) 이후의 온보딩 단계: S05 선택 정보 → S06 동의 → S07 알림 → S08 첫 그룹 */
export type OnboardingStep = 'profile' | 'consent' | 'notifications' | 'group'

export interface LastCompletion {
  day: string
  fromGroupId?: number
  groups: {
    groupId: number
    before: number
    after: number
    stageBefore: number
    stageAfter: number
    completed: number
    total: number
  }[]
}

const KEY = 'haengunping:device:v1'

const empty = (): DeviceState => ({
  onboarded: false,
  pingDays: [],
  blockedMemberIds: [],
  invites: {},
  pendingCompletions: {},
  seenCompletions: [],
  missionPhotos: {},
  characterNicknames: {},
})

function load(): DeviceState {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...empty(), ...JSON.parse(raw) } : empty()
  } catch {
    return empty()
  }
}

let state: DeviceState = typeof localStorage === 'undefined' ? empty() : load()
const listeners = new Set<() => void>()

export function getDevice(): DeviceState {
  return state
}

export function updateDevice(patch: Partial<DeviceState> | ((s: DeviceState) => Partial<DeviceState>)) {
  const next = typeof patch === 'function' ? patch(state) : patch
  state = { ...state, ...next }
  if (isPersistenceFrozen()) return
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // 저장 공간 부족 등. 화면 동작은 계속한다.
  }
  listeners.forEach((l) => l())
}

export function resetDevice() {
  state = empty()
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* noop */
  }
  listeners.forEach((l) => l())
}

export function useDevice(): DeviceState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    getDevice,
    getDevice,
  )
}
