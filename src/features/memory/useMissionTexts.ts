import { useQueries } from '@tanstack/react-query'
import { api } from '../../api'
import { qk } from '../../api/queries'
import type { Memory } from '../../device/memories'

/**
 * 추억 기록의 미션 이름. 저장할 때 남긴 문구가 우선이고,
 * 없으면(예전 사진) 그달 내 기록(GET /me/records)에서 찾는다.
 */
export function useMissionTexts(memories: Memory[]) {
  const months = [...new Set(memories.filter((m) => !m.missionText).map((m) => m.date.slice(0, 7)))]
  const results = useQueries({
    queries: months.map((month) => ({ queryKey: qk.records(month), queryFn: () => api.getMyRecords(month) })),
  })
  const fromRecords = new Map(results.flatMap((r) => r.data?.missions ?? []).map((m) => [m.date, m.text]))
  return (m: Memory) => m.missionText ?? fromRecords.get(m.date)
}
