import { describe, expect, it } from 'vitest'
import type { CompleteMissionResponse, GroupSummary } from '../api/types'
import { completionKey, markCompletionSeen, unseenCompletions } from './character/completions'
import { completionGroups } from './mission/completion'

/** 백엔드 api.md(2026-11-19)에서 바뀐 실서버 동작에 맞춘 처리 */

const group = (groupId: number, progress: number, justCompleted?: GroupSummary['justCompleted']): GroupSummary => ({
  groupId,
  type: 'FRIEND',
  name: `그룹${groupId}`,
  memberCount: 3,
  today: { completed: 1, total: 3 },
  character: { characterId: groupId * 10, kind: 'CLOVER', stage: 1, progress },
  isDemo: false,
  justCompleted,
})

describe('S26 완성 연출 한 번만 (서버는 justCompleted를 그날 하루 동안 계속 줌)', () => {
  const done = { kind: 'SEED', completedOn: '2026-11-18' }

  it('아직 안 본 완성만 대기열에 넣는다', () => {
    const groups = [group(1, 0, done), group(2, 30)]
    expect(unseenCompletions(groups, []).map((g) => g.groupId)).toEqual([1])
  })
  it('한 번 본 완성은 같은 날 다시 받아도 넣지 않는다', () => {
    const seen = markCompletionSeen([], completionKey(1, '2026-11-18'))
    expect(unseenCompletions([group(1, 0, done)], seen)).toEqual([])
  })
  it('같은 그룹이라도 다른 날 완성은 새로 보여 준다', () => {
    const seen = markCompletionSeen([], completionKey(1, '2026-11-18'))
    expect(unseenCompletions([group(1, 0, { kind: 'MINT', completedOn: '2026-12-20' })], seen)).toHaveLength(1)
  })
  it('본 목록은 겹치지 않고 최근 30개만 남는다', () => {
    let seen: string[] = []
    for (let i = 0; i < 40; i++) seen = markCompletionSeen(seen, completionKey(i, '2026-11-18'))
    seen = markCompletionSeen(seen, completionKey(39, '2026-11-18'))
    expect(seen).toHaveLength(30)
    expect(seen[0]).toBe('10:2026-11-18')
    expect(seen.at(-1)).toBe('39:2026-11-18')
  })
})

describe('MIS-07 다 했어요 응답의 character가 null인 그룹', () => {
  const res = (groups: CompleteMissionResponse['groups']): CompleteMissionResponse => ({ completedAt: '2026-11-19T03:00:00Z', groups })

  it('character가 있으면 완료 전 목록과 비교해 성장 전후를 만든다', () => {
    const out = completionGroups(res([{ groupId: 1, today: { completed: 2, total: 3 }, character: { stage: 3, progress: 50.2, stageChanged: true } }]), [group(1, 49.8)])
    expect(out).toEqual([{ groupId: 1, before: 49.8, after: 50.2, stageBefore: 2, stageAfter: 3, completed: 2, total: 3 }])
  })
  it('character가 null이면 깨지지 않고 완료 전 값 그대로(변화 없음)', () => {
    const out = completionGroups(res([{ groupId: 1, today: { completed: 2, total: 3 }, character: null }]), [group(1, 30)])
    expect(out).toEqual([{ groupId: 1, before: 30, after: 30, stageBefore: 2, stageAfter: 2, completed: 2, total: 3 }])
  })
  it('character가 null이고 완료 전 값도 없으면 그 그룹은 뺀다', () => {
    const out = completionGroups(
      res([
        { groupId: 1, today: { completed: 1, total: 1 }, character: null },
        { groupId: 2, today: { completed: 1, total: 2 }, character: { stage: 1, progress: 2, stageChanged: false } },
      ]),
      [],
    )
    expect(out.map((g) => g.groupId)).toEqual([2])
  })
})
