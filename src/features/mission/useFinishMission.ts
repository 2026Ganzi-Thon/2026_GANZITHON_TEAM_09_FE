import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { errorMessage } from '../../api/errors'
import { qk, useCompleteMission } from '../../api/queries'
import type { GroupsResponse } from '../../api/types'
import { useToast } from '../../components/ui/useToast'
import { getDevice, updateDevice } from '../../device/store'
import { stageOf } from '../character/growth'

/**
 * '다 했어요' (MIS-07, 정직 기반). 타이머·홈 카드·미션 준비 어디서든 같은 처리:
 * 반영 전 성장치를 잡아 두고 → 완료 → 그룹별 전후를 기기에 남기고 → S23 완료 화면.
 * 시작하지 않은 미션도 완료할 수 있다.
 */
export function useFinishMission() {
  const navigate = useNavigate()
  const toast = useToast()
  const qc = useQueryClient()
  const complete = useCompleteMission()

  const finish = async (day: string, fromGroupId?: number) => {
    const before = qc.getQueryData<GroupsResponse>(qk.groups)?.groups ?? []
    try {
      const res = await complete.mutateAsync()
      updateDevice({
        lastCompletion: {
          day,
          fromGroupId: fromGroupId ?? getDevice().missionFromGroupId,
          groups: res.groups.map((g) => {
            const b = before.find((x) => x.groupId === g.groupId)?.character.progress ?? g.character.progress
            return {
              groupId: g.groupId,
              before: b,
              after: g.character.progress,
              stageBefore: stageOf(b),
              stageAfter: stageOf(g.character.progress),
              completed: g.today.completed,
              total: g.today.total,
            }
          }),
        },
      })
      navigate('/mission/done', { replace: true })
    } catch (e) {
      toast(errorMessage(e, '완료를 저장하지 못했어요'))
    }
  }

  return { finish, isPending: complete.isPending }
}
