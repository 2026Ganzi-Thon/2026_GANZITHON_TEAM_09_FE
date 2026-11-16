import { useSyncExternalStore } from 'react'
import type { MissionMinutes, Place } from '../api/types'

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
  /** 미션 사진은 개인 기록용, 기기에만 (그룹에 공유하지 않음) */
  missionPhotos: Record<string, string>
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
  missionPhotos: {},
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
