import { useNavigate } from 'react-router-dom'
import { Page, PageHeader, Spacer } from '../../components/layout/Page'
import { Button } from '../../components/ui/Button'
import { errorMessage } from '../../api/errors'
import { useSensitiveConsent } from '../../api/queries'
import { useToast } from '../../components/ui/Toast'
import { updateDevice } from '../../device/store'
import styles from './onboarding.module.css'

/** 민감정보(기분·점검) 수집 별도 동의 */
export function ConsentPage() {
  const toast = useToast()
  const consent = useSensitiveConsent()
  const navigate = useNavigate()

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
      <PageHeader title="기분·마음 점검 기록" back="/onboarding/profile" />
      <p className={styles.desc}>매일 기분과 주 1회 마음 점검을 기록하려면 동의가 필요해요.</p>
      <ul className={styles.consentBox}>
        <li>· 모으는 것: 매일 기분, 주 1회 마음 점검 답</li>
        <li>· 쓰는 곳: 미션 크기 추천, 도움받을 곳 안내</li>
        <li>· 보는 사람: 나만. 그룹에는 절대 보이지 않아요</li>
        <li>· 언제든 철회하고 기록을 지울 수 있어요</li>
      </ul>
      {/* 기본 선택은 '동의하고 시작하기'(주 버튼, 바로 누름). 미리 체크해 두는 방식은 쓰지 않는다 — 민감정보 별도 동의는
          사용자가 직접 눌러야 유효하다(PRD ACC-05). 동의하지 않는 길도 같은 화면에 그대로 둔다 */}
      <p className={styles.consentNote}>'동의하고 시작하기'를 누르면 건강 관련 민감정보 수집·이용에 동의해요 (선택)</p>
      <Spacer />
      <Button loading={consent.isPending && consent.variables === true} disabled={consent.isPending} onClick={() => next(true)}>
        동의하고 시작하기
      </Button>
      <Button variant="ghost" disabled={consent.isPending} onClick={() => next(false)}>
        동의하지 않고 시작하기
      </Button>
      <p className={styles.footnote}>동의하지 않아도 미션·그룹·도움받기는 모두 쓸 수 있어요.</p>
    </Page>
  )
}
