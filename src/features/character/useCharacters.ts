import { useQueries } from '@tanstack/react-query'
import { api } from '../../api'
import { qk, useGroups } from '../../api/queries'
import type { GroupSummary } from '../../api/types'

export interface GrowingCharacter {
  group: GroupSummary
  characterId: number | undefined
  kind: string
  progress: number
}

export interface DoneCharacter {
  group: GroupSummary
  characterId: number
  kind: string
  startedOn: string
  completedOn: string
}

/**
 * 내 모든 그룹의 캐릭터 (S32): 키우는 중 + 다 키운 것(그룹 도감).
 * 지금 API(GET /groups, GET /groups/{id}/collection)만으로 모은다.
 */
export function useAllCharacters() {
  const groups = useGroups()
  const list = groups.data?.groups ?? []
  const collections = useQueries({
    queries: list.map((g) => ({ queryKey: qk.collection(g.groupId), queryFn: () => api.getCollection(g.groupId) })),
  })

  const growing: GrowingCharacter[] = list.map((g) => ({
    group: g,
    characterId: g.character.characterId,
    kind: g.character.kind,
    progress: g.character.progress,
  }))
  const done: DoneCharacter[] = list
    .flatMap((g, i) => (collections[i]?.data?.characters ?? []).map((c) => ({ group: g, ...c })))
    .sort((a, b) => b.completedOn.localeCompare(a.completedOn))

  /** 대표 캐릭터: 가장 많이 자란 키우는 중 캐릭터 */
  const representative = [...growing].sort((a, b) => b.progress - a.progress)[0]

  return {
    isPending: groups.isPending || collections.some((c) => c.isPending),
    isError: groups.isError,
    error: groups.error,
    refetch: groups.refetch,
    growing,
    done,
    representative,
  }
}
