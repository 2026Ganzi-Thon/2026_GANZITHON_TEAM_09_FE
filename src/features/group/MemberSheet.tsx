import { useState } from 'react'
import { errorMessage } from '../../api/errors'
import { useBlockMember, useReportMember } from '../../api/queries'
import { REPORT_REASONS, type GroupMember, type ReportReason } from '../../api/types'
import { BottomSheet } from '../../components/ui/BottomSheet'
import { Button } from '../../components/ui/Button'
import { HelpCard } from '../../components/ui/HelpCard'
import { useToast } from '../../components/ui/useToast'
import { updateDevice, useDevice } from '../../device/store'
import styles from '../../pages/groups/groups.module.css'

const REASON_LABELS: Record<ReportReason, string> = { SPAM: '스팸', HARASSMENT: '괴롭힘', OTHER: '기타' }

/**
 * S25 구성원 신고·차단 (Figma 20, 온라인 그룹만).
 * 차단하면 그 사람의 핑이 나에게 안 보인다(GRP-14). 신고 사유는 정해진 3개(GRP-15), 상대에게 알리지 않는다.
 */
export function MemberSheet({
  groupId,
  groupName,
  member,
  onClose,
}: {
  groupId: number
  groupName: string
  member: GroupMember | null
  onClose: () => void
}) {
  const toast = useToast()
  const device = useDevice()
  const block = useBlockMember()
  const report = useReportMember()
  const [reason, setReason] = useState<ReportReason | null>(null)
  const blocked = !!member && device.blockedMemberIds.includes(member.memberId)

  const close = () => {
    setReason(null)
    onClose()
  }

  if (!member) return null

  const toggleBlock = () =>
    block.mutate(
      { groupId, memberId: member.memberId, block: !blocked },
      {
        onSuccess: () => {
          updateDevice((d) => ({
            blockedMemberIds: blocked ? d.blockedMemberIds.filter((x) => x !== member.memberId) : [...d.blockedMemberIds, member.memberId],
          }))
          toast(blocked ? '차단을 풀었어요' : '차단했어요. 이 사람이 보낸 핑이 나에게 안 보여요')
          close()
        },
        onError: (e) => toast(errorMessage(e)),
      },
    )

  const submitReport = () => {
    if (!reason) return
    report.mutate(
      { groupId, memberId: member.memberId, reason },
      {
        onSuccess: () => {
          toast('신고를 접수했어요')
          close()
        },
        onError: (e) => toast(errorMessage(e)),
      },
    )
  }

  return (
    <BottomSheet open onClose={close} label={`${member.displayName} 신고·차단`}>
      <h2 className={styles.sheetTitle}>{member.displayName}</h2>
      <p className={styles.sheetSub}>{groupName} 구성원 · 이 그룹에서만 쓰는 별칭이에요</p>
      <HelpCard
        title={blocked ? '차단 풀기' : '차단하기'}
        sub={blocked ? '이 사람의 핑이 다시 보여요' : '이 사람이 보낸 핑이 나에게 안 보여요'}
        onClick={toggleBlock}
      />
      <section className={styles.option}>
        <span className={styles.optionTitle}>신고하기</span>
        <div className={styles.reasonRow} role="radiogroup" aria-label="신고 사유">
          {REPORT_REASONS.map((r) => (
            <button
              key={r}
              type="button"
              role="radio"
              aria-checked={reason === r}
              className={`${styles.reason} ${reason === r ? styles.reasonOn : ''}`}
              onClick={() => setReason(r)}
            >
              {REASON_LABELS[r]}
            </button>
          ))}
        </div>
      </section>
      <p className={styles.intro}>신고한 사실은 상대에게 알리지 않아요.</p>
      <Button disabled={!reason} loading={report.isPending} onClick={submitReport}>
        신고하기
      </Button>
      <Button variant="ghost" onClick={close}>
        취소
      </Button>
    </BottomSheet>
  )
}
