import type { CompleteMissionResponse, GroupSummary } from '../../api/types'
import type { LastCompletion } from '../../device/store'
import { stageOf } from '../character/growth'

/**
 * '다 했어요' 응답 → 완료 화면에 쓸 그룹별 성장 전후.
 * 진행 중 캐릭터가 없는 그룹은 응답의 character가 null이다(api.md 5절, 2026-11-19).
 * 그때는 완료 전 목록의 성장치를 그대로 쓰고(변화 없음), 그것도 없으면 그 그룹은 뺀다.
 */
export function completionGroups(res: CompleteMissionResponse, before: GroupSummary[]): LastCompletion['groups'] {
  return res.groups.flatMap((g) => {
    const prev = before.find((x) => x.groupId === g.groupId)?.character?.progress
    const after = g.character?.progress ?? prev
    if (after === undefined) return []
    const b = prev ?? after
    return [
      {
        groupId: g.groupId,
        before: b,
        after,
        stageBefore: stageOf(b),
        stageAfter: stageOf(after),
        completed: g.today.completed,
        total: g.today.total,
      },
    ]
  })
}
