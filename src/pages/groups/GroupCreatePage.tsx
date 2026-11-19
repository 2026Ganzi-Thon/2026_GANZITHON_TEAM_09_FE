import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { errorMessage } from '../../api/errors'
import { useAdultConfirmation, useCreateGroup, useGroups, useJoinOnlineQueue, useMe } from '../../api/queries'
import { Character } from '../../components/character/Character'
import { Page, PageHeader } from '../../components/layout/Page'
import { BottomSheet } from '../../components/ui/BottomSheet'
import { Button } from '../../components/ui/Button'
import { Checkbox, TextField } from '../../components/ui/Form'
import { useToast } from '../../components/ui/useToast'
import { updateDevice } from '../../device/store'
import { CHARACTER_NICKNAME_MAX, setCharacterNickname } from '../../features/character/nickname'
import type { GroupDetail } from '../../api/types'
import styles from './groups.module.css'

type SheetState = null | 'create' | 'solo' | 'adult' | 'searching'
const MAX_GROUPS = 3

/**
 * S08 첫 그룹 고르기 / S28 그룹 추가 (Figma 3): 친구(초대 코드) / 온라인(자동 배정 익명) / 혼자.
 * 친구 그룹을 만들면 S09 초대 화면, 코드가 있으면 S10 코드 입력 화면으로 간다.
 */
export function GroupCreatePage({ onboarding }: { onboarding?: boolean }) {
  const navigate = useNavigate()
  const toast = useToast()
  const me = useMe()
  const groups = useGroups()
  const createGroup = useCreateGroup()
  const joinOnline = useJoinOnlineQueue()
  const confirmAdult = useAdultConfirmation()

  const [sheet, setSheet] = useState<SheetState>(null)
  const [groupName, setGroupName] = useState(`${me.data?.nickname || '우리'}의 그룹`)
  const [adult, setAdult] = useState(false)
  /** 나만 보는 캐릭터 별명 (선택). 처음 정하는 곳은 그룹 만들기뿐이고, 이후에는 성장 과정 화면에서 바꾼다 */
  const [charNickname, setCharNickname] = useState('')
  const [error, setError] = useState<string | null>(null)

  const slots = (groups.data?.groups.length ?? 0) + (groups.data?.queue.waiting ? 1 : 0)
  const full = slots >= MAX_GROUPS

  /** 그룹에 들어가면 온보딩이 끝난다 (홈으로 가면 오늘 기분 팝업이 이어서 뜬다) */
  const finishOnboarding = () => {
    if (onboarding) updateDevice({ onboarded: true, onboardingStep: undefined })
  }

  const openSheet = (s: SheetState) => {
    setError(null)
    if (s === 'create' || s === 'solo') setCharNickname('')
    setSheet(s)
  }

  /** 만들기 응답(GET /groups/{id}와 같은 모양)의 characterId로 별명을 이 기기에 저장 */
  const saveCharNickname = (g: GroupDetail) => {
    const value = charNickname.trim()
    if (value && g.character.characterId !== undefined) setCharacterNickname(g.groupId, g.character.characterId, value)
  }

  const nicknameField = (
    <TextField
      label="캐릭터 별명"
      optional
      value={charNickname}
      maxLength={CHARACTER_NICKNAME_MAX}
      placeholder="나만 보여요"
      hint="나에게만 보여요. 성장 과정에서 바꿀 수 있어요"
      suffix={`${charNickname.length} / ${CHARACTER_NICKNAME_MAX}`}
      onChange={(e) => setCharNickname(e.target.value.slice(0, CHARACTER_NICKNAME_MAX))}
    />
  )

  const makeFriendGroup = async () => {
    setError(null)
    try {
      const g = await createGroup.mutateAsync({ type: 'FRIEND', name: groupName.trim() })
      saveCharNickname(g)
      finishOnboarding()
      setSheet(null)
      navigate(`/groups/${g.groupId}/invite`, { replace: true })
    } catch (e) {
      setError(errorMessage(e))
    }
  }

  const makeSoloGroup = async () => {
    setError(null)
    try {
      const g = await createGroup.mutateAsync({ type: 'SOLO' })
      saveCharNickname(g)
      finishOnboarding()
      setSheet(null)
      toast('혼자 시작했어요')
      navigate(onboarding ? '/groups' : `/groups/${g.groupId}`, { replace: true })
    } catch (e) {
      setError(errorMessage(e))
    }
  }

  const enterOnline = async (justConfirmed = false) => {
    setError(null)
    // S11: 처음 한 번 '만 19세 이상이에요' 자기 확인
    if (!justConfirmed && !me.data?.adultConfirmed) {
      openSheet('adult')
      return
    }
    setSheet('searching')
    try {
      const res = await joinOnline.mutateAsync()
      setSheet(null)
      finishOnboarding()
      if (res.status === 'MATCHED') {
        navigate(`/groups/${res.groupId}`, { replace: true, state: { joinedOnline: true } })
      } else {
        toast('함께할 사람을 찾고 있어요. 4명이 모이면 알려드릴게요')
        navigate('/groups', { replace: true })
      }
    } catch (e) {
      setSheet(null)
      setError(errorMessage(e))
    }
  }

  return (
    <Page withTabBar={!onboarding} gap={14}>
      <PageHeader title="그룹 만들기·참여" back={onboarding ? '/onboarding/notifications' : '/groups'} />
      <p className={styles.intro}>함께 미션하고 캐릭터를 키워요. 대화는 없고, 미션을 마치면 이모티콘만 남겨요.</p>
      {full ? <p className={styles.error}>그룹은 {MAX_GROUPS}개까지 참여할 수 있어요. 다른 그룹을 나간 뒤 다시 시도해 주세요.</p> : null}
      {error && !sheet ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}

      <section className={styles.option}>
        <span className={styles.optionTitle}>친구와 함께</span>
        <span className={styles.optionSub}>초대 코드로 2~6명</span>
        <div className={styles.row}>
          <Button size="md" variant="secondary" disabled={full} onClick={() => openSheet('create')}>
            코드 만들기
          </Button>
          <Button size="md" variant="secondary" disabled={full} onClick={() => navigate(onboarding ? '/onboarding/join' : '/groups/join')}>
            코드 입력
          </Button>
        </div>
      </section>

      <section className={styles.option}>
        <span className={styles.optionTitle}>온라인 그룹 들어가기</span>
        <span className={styles.optionSub}>익명 4~6명. 4명이 모이면 시작해요</span>
        <ul className={styles.bullets}>
          <li>· 이름 대신 랜덤 별칭 (예: 산책하는 수달)</li>
          <li>· 대화 없이 이모티콘 핑만</li>
          <li>· 만 19세 이상(자기 확인), 신고·차단·나가기</li>
        </ul>
        <Button size="md" disabled={full} onClick={() => enterOnline()}>
          온라인 그룹 들어가기
        </Button>
      </section>

      <button
        type="button"
        className={styles.option}
        disabled={full || createGroup.isPending}
        onClick={() => openSheet('solo')}
      >
        <span className={styles.optionTitle}>혼자 시작하기</span>
        <span className={styles.optionSub}>1인 그룹. 그룹은 모두 3개까지 참여할 수 있어요</span>
      </button>

      {/* 친구 그룹 이름 → 만들면 S09 초대 화면 */}
      <BottomSheet open={sheet === 'create'} onClose={() => setSheet(null)} label="친구 그룹 만들기">
        <h2 className={styles.sheetTitle}>친구 그룹 만들기</h2>
        <TextField label="그룹 이름" value={groupName} maxLength={12} onChange={(e) => setGroupName(e.target.value)} error={error} hint="1~12자" />
        {nicknameField}
        <Button loading={createGroup.isPending} disabled={!groupName.trim()} onClick={makeFriendGroup}>
          만들고 초대 코드 받기
        </Button>
      </BottomSheet>

      {/* 1인 그룹: 캐릭터 별명(선택)만 받고 시작 */}
      <BottomSheet open={sheet === 'solo'} onClose={() => setSheet(null)} label="혼자 시작하기">
        <h2 className={styles.sheetTitle}>혼자 시작하기</h2>
        {nicknameField}
        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}
        <Button loading={createGroup.isPending} onClick={makeSoloGroup}>
          시작하기
        </Button>
      </BottomSheet>

      {/* S11 온라인 그룹 · 나이 확인 (자기 확인, ACC-09) */}
      <BottomSheet open={sheet === 'adult'} onClose={() => setSheet(null)} label="온라인 그룹 들어가기">
        <h2 className={styles.sheetTitle}>온라인 그룹 들어가기</h2>
        <p className={styles.intro}>모르는 사람 4~6명과 익명으로 함께해요.</p>
        <ul className={styles.bullets}>
          <li>· 이름 대신 이 그룹에서만 쓰는 랜덤 별칭</li>
          <li>· 대화 없이 미션 완료 이모티콘만</li>
          <li>· 불편하면 신고·차단·나가기</li>
          <li>· 같은 그룹에서 2명에게 신고받으면 그룹에서 나가게 돼요</li>
        </ul>
        <Checkbox label="만 19세 이상이에요" checked={adult} onChange={setAdult} />
        <p className={styles.intro}>나이는 따로 확인하지 않고 답한 대로 믿어요.</p>
        {error ? <p className={styles.error}>{error}</p> : null}
        <Button
          disabled={!adult}
          loading={confirmAdult.isPending}
          onClick={async () => {
            try {
              await confirmAdult.mutateAsync()
              setSheet(null)
              void enterOnline(true)
            } catch (e) {
              setError(errorMessage(e))
            }
          }}
        >
          들어가기
        </Button>
        <Button variant="ghost" onClick={() => setSheet(null)}>
          취소
        </Button>
      </BottomSheet>

      {/* 배정 대기 */}
      <BottomSheet open={sheet === 'searching'} label="온라인 그룹 찾는 중" dismissible={false}>
        <div className={styles.searching} aria-busy="true">
          <span className={styles.pulse}>
            <Character stage={2} size={96} />
          </span>
          <p>함께할 그룹을 찾고 있어요</p>
          <span className={styles.intro}>대기 순서대로 4~6명씩 모여요</span>
        </div>
      </BottomSheet>
    </Page>
  )
}
