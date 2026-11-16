import type { Me } from '../api/types'
import type { DeviceState } from '../device/store'

/**
 * 앱을 열었을 때 갈 곳 (UserFlow 2절)
 * - 계정 없음 → 시작 화면(S01·S02)
 * - 계정은 있지만 초기 설정을 다 하지 않음 → 멈춘 단계부터
 * - 계정·초기 설정 완료 → 그룹 탭(S20). 기분 팝업은 그 위에 뜬다
 */
export function entryPath(me: Me | null | undefined, device: Pick<DeviceState, 'onboarded' | 'onboardingStep'>): string {
  if (!me) return '/welcome'
  if (!device.onboarded) return `/onboarding/${device.onboardingStep ?? 'profile'}`
  return '/groups'
}
