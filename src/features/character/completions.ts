import type { GroupSummary } from '../../api/types'

/**
 * S26 캐릭터 완성 연출을 '한 번만' 보여 주기.
 * 서버는 어제 완성된 캐릭터를 오늘 하루 동안 GET /groups의 justCompleted에 계속 넣는다(api.md 3절, 2026-11-19).
 * 한 번만 보여 주는 것은 프론트 몫이라, 본 완성은 `그룹ID:완성일`로 기기에 남겨 다시 띄우지 않는다.
 */
export const completionKey = (groupId: number, completedOn: string) => `${groupId}:${completedOn}`

/** 아직 보지 않은 완성만 */
export function unseenCompletions(groups: GroupSummary[], seen: readonly string[]): GroupSummary[] {
  return groups.filter((g) => g.justCompleted && !seen.includes(completionKey(g.groupId, g.justCompleted.completedOn)))
}

/** 본 완성 목록에 더한다. 오래된 것부터 버려 최근 30개만 남긴다 */
export function markCompletionSeen(seen: readonly string[], key: string): string[] {
  return [...seen.filter((k) => k !== key), key].slice(-30)
}
