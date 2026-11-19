import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api'
import { errorMessage } from '../../api/errors'
import { clearPersistedCache, useDeleteHealthRecords, useMe, useSensitiveConsent } from '../../api/queries'
import { Card, Page, PageHeader } from '../../components/layout/Page'
import { BottomSheet } from '../../components/ui/BottomSheet'
import { Button } from '../../components/ui/Button'
import { TextField, Toggle } from '../../components/ui/Form'
import { useToast } from '../../components/ui/useToast'
import { forgetActiveAccount } from '../../device/accounts'
import { clearMemories } from '../../device/memories'
import { clearDeviceProfile } from '../../device/profile'
import { resetDevice } from '../../device/store'
import styles from './my.module.css'

/**
 * S53 내 데이터 (Figma 23): 기록 동의 · 기록 지우기 · 계정 삭제.
 * 동의 철회는 이후 저장만 멈추고, 지우기는 따로 한다. 계정 삭제는 두 번 확인한다.
 */
export function MyPrivacyPage() {
  const me = useMe()
  const toast = useToast()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const setConsent = useSensitiveConsent()
  const deleteRecords = useDeleteHealthRecords()
  const [sheet, setSheet] = useState<null | 'records' | 'account1' | 'account2'>(null)
  const [deleteWord, setDeleteWord] = useState('')
  const [deleting, setDeleting] = useState(false)
  const consent = !!me.data?.sensitiveConsent

  const deleteAccount = async () => {
    setDeleting(true)
    try {
      await api.deleteMe()
      clearDeviceProfile()
      await clearMemories()
      // 계정 목록에서 이 계정만 뺀다 (이 기기에 보관된 다른 계정은 그대로)
      forgetActiveAccount()
      clearPersistedCache()
      resetDevice()
      qc.clear()
      navigate('/welcome', { replace: true })
    } catch (e) {
      toast(errorMessage(e))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Page withTabBar gap={12}>
      <PageHeader title="내 데이터" back="/my" />

      <Card>
        <Toggle
          label="기분·마음 점검 기록 동의"
          sub="끄면 이후 기분·점검을 기록하지 않아요. 지난 기록은 남아요"
          checked={consent}
          onChange={(v) =>
            setConsent.mutate(v, {
              onSuccess: () => toast(v ? '동의했어요. 기분을 물어볼게요' : '이후 기분·점검을 기록하지 않아요'),
              onError: (e) => toast(errorMessage(e)),
            })
          }
        />
      </Card>

      <button type="button" className={styles.dataCard} onClick={() => setSheet('records')}>
        <b>기분·마음 점검 기록 지우기</b>
        <small>지금까지의 기분과 점검 답을 모두 지워요.</small>
      </button>

      <button
        type="button"
        className={`${styles.dataCard} ${styles.dataCardDanger}`}
        onClick={() => {
          setDeleteWord('')
          setSheet('account1')
        }}
      >
        <b>계정 삭제</b>
        <small>모든 그룹에서 나가고 내 기록이 사라져요. 함께 키운 캐릭터와 도감은 그룹에 남아요. 되돌릴 수 없어요.</small>
      </button>

      <BottomSheet open={sheet === 'records'} onClose={() => setSheet(null)} label="기록 삭제 확인">
        <h2 className={styles.sheetTitle}>기분·점검 기록을 지울까요?</h2>
        <p className={styles.summary}>지우면 되돌릴 수 없어요. 미션·그룹 기록은 그대로예요.</p>
        <Button
          loading={deleteRecords.isPending}
          onClick={() =>
            deleteRecords.mutate(undefined, {
              onSuccess: () => {
                setSheet(null)
                toast('기분·점검 기록을 지웠어요')
              },
              onError: (e) => toast(errorMessage(e)),
            })
          }
        >
          지우기
        </Button>
        <Button variant="ghost" onClick={() => setSheet(null)}>
          취소
        </Button>
      </BottomSheet>

      {/* 계정 삭제 1/2 */}
      <BottomSheet open={sheet === 'account1'} onClose={() => setSheet(null)} label="계정 삭제 확인">
        <h2 className={styles.sheetTitle}>계정을 삭제할까요?</h2>
        <p className={styles.summary}>모든 그룹에서 나가고 기분·미션·점검 기록이 사라져요. 함께 키운 캐릭터와 도감은 그룹에 남아요.</p>
        <Button variant="secondary" onClick={() => setSheet('account2')}>
          계속하기
        </Button>
        <Button variant="ghost" onClick={() => setSheet(null)}>
          취소
        </Button>
      </BottomSheet>

      {/* 계정 삭제 2/2: '삭제' 직접 입력 */}
      <BottomSheet open={sheet === 'account2'} onClose={() => setSheet(null)} label="계정 삭제 마지막 확인">
        <h2 className={styles.sheetTitle}>정말 삭제할까요?</h2>
        <p className={styles.summary}>되돌릴 수 없어요. 이 기기에 저장한 생년월일·지역·직업과 추억 기록(사진·메모)도 함께 지워요. 확인을 위해 아래에 ‘삭제’라고 적어 주세요.</p>
        <TextField label="확인 문구" value={deleteWord} placeholder="삭제" maxLength={4} onChange={(e) => setDeleteWord(e.target.value)} />
        <Button disabled={deleteWord.trim() !== '삭제'} loading={deleting} onClick={deleteAccount}>
          계정 삭제
        </Button>
        <Button variant="ghost" onClick={() => setSheet(null)}>
          취소
        </Button>
      </BottomSheet>
    </Page>
  )
}
