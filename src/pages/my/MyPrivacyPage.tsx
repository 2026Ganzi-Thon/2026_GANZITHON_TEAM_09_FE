import { useState } from 'react'
import { Card, Page, PageHeader } from '../../components/layout/Page'
import { BottomSheet } from '../../components/ui/BottomSheet'
import { Button } from '../../components/ui/Button'
import { Toggle } from '../../components/ui/Form'
import { useToast } from '../../components/ui/Toast'
import { errorMessage } from '../../api/errors'
import { useDeleteHealthRecords, useMe, useSensitiveConsent } from '../../api/queries'
import styles from './my.module.css'

/** 개인정보: 민감정보 동의 관리, 기분·점검 기록 삭제, 수집·공개 범위 */
export function MyPrivacyPage() {
  const me = useMe()
  const toast = useToast()
  const setConsent = useSensitiveConsent()
  const deleteRecords = useDeleteHealthRecords()
  const [confirm, setConfirm] = useState(false)
  const consent = !!me.data?.sensitiveConsent

  return (
    <Page withTabBar gap={14}>
      <PageHeader title="개인정보" back="/my" />
      <Card>
        <Toggle
          label="기분·마음 점검 기록 동의"
          sub="건강 관련 민감정보 · 나만 봐요"
          checked={consent}
          onChange={(v) =>
            setConsent.mutate(v, {
              onSuccess: () => toast(v ? '동의했어요. 기분을 물어볼게요' : '이후 기분·점검을 기록하지 않아요'),
              onError: (e) => toast(errorMessage(e)),
            })
          }
        />
        <p className={styles.summary}>동의를 철회해도 지금까지의 기록은 아래에서 따로 지워야 사라져요.</p>
        <Button variant="ghost" className={styles.danger} onClick={() => setConfirm(true)}>
          기분·점검 기록 모두 삭제
        </Button>
      </Card>

      <Card>
        <h2 className={styles.h2}>그룹에 보이는 것과 안 보이는 것</h2>
        <ul className={styles.list}>
          <li>보임: 그룹 완료 합계(몇 명 중 몇 명), 캐릭터, 이름 없는 이모티콘 핑</li>
          <li>안 보임: 기분, 점검 결과, 도움받기 이용, 개인별 참여 여부</li>
        </ul>
      </Card>

      <Card>
        <h2 className={styles.h2}>수집하지 않는 것</h2>
        <ul className={styles.list}>
          <li>위치(GPS), 주민번호, 진단명, 소득, 연락처 목록</li>
          <li>그룹 안 글·사진 (미션 사진은 이 기기에만 저장)</li>
          <li>도움받기 이용 기록</li>
        </ul>
      </Card>

      <BottomSheet open={confirm} onClose={() => setConfirm(false)} label="기록 삭제 확인">
        <h2 className={styles.sheetTitle}>기분·점검 기록을 삭제할까요?</h2>
        <p className={styles.summary}>삭제하면 되돌릴 수 없어요. 미션·그룹 기록은 그대로예요.</p>
        <Button
          loading={deleteRecords.isPending}
          onClick={() =>
            deleteRecords.mutate(undefined, {
              onSuccess: () => {
                setConfirm(false)
                toast('기분·점검 기록을 삭제했어요')
              },
              onError: (e) => toast(errorMessage(e)),
            })
          }
        >
          삭제하기
        </Button>
        <Button variant="ghost" onClick={() => setConfirm(false)}>
          취소
        </Button>
      </BottomSheet>
    </Page>
  )
}
