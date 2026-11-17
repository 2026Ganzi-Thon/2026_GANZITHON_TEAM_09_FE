import { useCallback } from 'react'
import { useMe } from '../../api/queries'
import type { GroupType } from '../../api/types'

/**
 * 화면에 보이는 그룹 이름.
 * - 1인 그룹(SOLO): 서버에 저장된 그룹 이름('나 혼자') 대신 내 닉네임을 보인다.
 *   그룹 이름 데이터는 바꾸지 않고 표시만 바꾼다 → 닉네임을 바꾸면 바로 따라 바뀐다.
 *   닉네임이 아직 없으면(불러오는 중 등) 저장된 그룹 이름을 그대로 보인다.
 * - 친구·온라인 그룹: 저장된 그룹 이름 그대로.
 */
export function groupDisplayName(group: { type: GroupType; name: string }, nickname: string | null | undefined): string {
  if (group.type === 'SOLO') return nickname?.trim() || group.name
  return group.name
}

/** 지금 계정 닉네임으로 groupDisplayName을 부르는 함수를 돌려준다 (닉네임이 바뀌면 다시 그려진다) */
export function useGroupName() {
  const nickname = useMe().data?.nickname
  return useCallback((group: { type: GroupType; name: string }) => groupDisplayName(group, nickname), [nickname])
}
