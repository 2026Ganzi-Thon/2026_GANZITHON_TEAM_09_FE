import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Page, PageHeader, Spacer } from '../../components/layout/Page'
import { Button } from '../../components/ui/Button'
import { Checkbox } from '../../components/ui/Form'
import { errorMessage } from '../../api/errors'
import { useMe, useSensitiveConsent } from '../../api/queries'
import { useToast } from '../../components/ui/Toast'
import { updateDevice } from '../../device/store'
import styles from './onboarding.module.css'

/** 민감정보(기분·점검) 수집 별도 동의 */
export function ConsentPage() {
  const me = useMe()
  const toast = useToast()
  const consent = useSensitiveConsent()
  const navigate = useNavigate()
  const [agree, setAgree] = useState(me.data?.sensitiveConsent ?? false)

  const next = (value: boolean) => {
    consent.mutate(value, {
      onSuccess: () => {
        updateDevice({ onboardingStep: 'notifications' })
        navigate('/onboarding/notifications')
      },
      onError: (e) => toast(errorMessage(e)),
    })
  }

  return (
    <Page gap={18}>
      <PageHeader title="" back="/onboarding/profile" />
      <p className={styles.step}>3 / 4</p>
      <div>
        <h1 className={styles.lead}>기분과 마음 점검 기록에 동의해 주세요</h1>
        <p className={styles.desc}>건강과 관련된 민감정보라 따로 동의를 받아요.</p>
      </div>
      <div className={styles.consentBox}>
        <table className={styles.table}>
          <tbody>
            <tr>
              <th scope="row">항목</th>
              <td>오늘의 기분(6가지 중 선택), 주 1회 마음 점검 응답</td>
            </tr>
            <tr>
              <th scope="row">목적</th>
              <td>미션 크기 추천, 내 기록, 도움받을 곳 연결</td>
            </tr>
            <tr>
              <th scope="row">공개 범위</th>
              <td>나만 봐요. 그룹에는 절대 보이지 않아요.</td>
            </tr>
            <tr>
              <th scope="row">보관</th>
              <td>마이 › 개인정보에서 언제든 삭제할 수 있어요.</td>
            </tr>
          </tbody>
        </table>
        <Checkbox label="(선택) 기분·마음 점검 기록 수집에 동의해요" checked={agree} onChange={setAgree} />
      </div>
      <p className={styles.desc} style={{ fontSize: 12.5 }}>
        동의하지 않아도 미션과 그룹, 도움받기는 쓸 수 있어요. 다만 기분 팝업과 마음 점검은 뜨지 않아요.
      </p>
      <Spacer />
      <Button loading={consent.isPending} onClick={() => next(agree)}>{agree ? '동의하고 다음' : '동의하지 않고 다음'}</Button>
    </Page>
  )
}
