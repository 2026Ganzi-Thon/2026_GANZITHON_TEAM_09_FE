import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { API_MODE } from '../../api'
import { errorMessage } from '../../api/errors'
import { DEMO_INVITE_CODES, getMockQueueMode, seedMockDemo, setMockQueueMode } from '../../api/mock/server'
import { useDemoClock, useMe } from '../../api/queries'
import { Character } from '../../components/character/Character'
import { Card, Page, PageHeader } from '../../components/layout/Page'
import { BottomSheet } from '../../components/ui/BottomSheet'
import { Button } from '../../components/ui/Button'
import { backupBeforeDemo, endDemo, getDemoBackupMeta, type DemoBackupMeta } from '../../device/demoBackup'
import { useToast } from '../../components/ui/Toast'
import { setDeviceProfile } from '../../device/profile'
import { clearMemories } from '../../device/memories'
import { resetDevice, updateDevice, useDevice } from '../../device/store'
import { characterNicknameOf } from '../../features/character/nickname'
import { addDays, dayKeyOf, kstHourMinute, weekdayOf, WEEKDAY_LABELS } from '../../features/date'
import { useNow } from '../../hooks/useNow'
import { useAllCharacters } from '../../features/character/useCharacters'
import { displayStage, progressLabel, stageNameOf, variantOf } from '../../features/selectors'
import styles from './my.module.css'


/** KST 날짜 + 시:분 → ISO(UTC) */
const kstIso = (day: string, hour: number, minute: number) =>
  new Date(Date.parse(`${day}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00+09:00`)).toISOString()

/** S50 마이 (Figma 21): 대표 캐릭터, 값이 보이는 목록, 알아 두세요. 시연 도구는 맨 아래 접힌 영역 */
export function MyPage() {
  const me = useMe()
  const now = useNow()
  const navigate = useNavigate()
  const toast = useToast()
  const qc = useQueryClient()
  const device = useDevice()
  const clock = useDemoClock()
  const rep = useAllCharacters().representative
  const [queueMode, setQueueMode] = useState(getMockQueueMode())
  const isDemo = !!me.data?.isDemo
  const [backupMeta, setBackupMeta] = useState<DemoBackupMeta | null>(null)
  const [confirmEnd, setConfirmEnd] = useState(false)
  const [demoBusy, setDemoBusy] = useState(false)
  useEffect(() => {
    if (API_MODE !== 'mock') return
    getDemoBackupMeta()
      .then(setBackupMeta)
      .catch(() => setBackupMeta(null))
  }, [isDemo])

  /**
   * 시연 데이터 불러오기: 시연 중이 아니면 지금 계정 데이터를 먼저 백업하고(다시 읽어 확인까지), 성공했을 때만 바꾼다.
   * 시연 중이면 백업은 그대로 두고 시연 데이터만 처음부터 다시 넣는다.
   */
  const loadDemo = async () => {
    if (!isDemo && backupMeta) {
      toast('시연 전 백업이 남아 있어 지금 데이터를 덮어쓰지 않았어요')
      return
    }
    setDemoBusy(true)
    try {
      if (!isDemo) await backupBeforeDemo(me.data?.nickname)
    } catch {
      setDemoBusy(false)
      toast('지금 데이터를 백업하지 못해 시연 데이터를 불러오지 않았어요')
      return
    }
    seedMockDemo()
    setDeviceProfile({ birthDate: '2000-05-14', sido: '서울특별시', sigungu: '마포구', job: 'STUDENT' })
    resetDevice()
    await clearMemories()
    updateDevice({ onboarded: true })
    await qc.resetQueries()
    setDemoBusy(false)
    toast(isDemo ? '시연 데이터를 처음부터 다시 불러왔어요' : '시연 데이터를 불러왔어요')
    navigate('/groups')
  }

  /** 시연 종료: 백업으로 되돌린 뒤 새로 연다 (백업이 없으면 시연 데이터만 지우고 시작 화면) */
  const finishDemo = async () => {
    setDemoBusy(true)
    try {
      const result = await endDemo()
      qc.clear()
      window.location.replace(result === 'restored' ? '/' : '/welcome')
    } catch {
      window.location.reload()
    }
  }
  const day = me.data?.today ?? ''
  // 시연 도구: 실서버는 시연 계정(GET /me isDemo)에만, 목업은 로컬 개발·시연용이라 항상
  const showDemoTools = API_MODE === 'mock' || !!me.data?.isDemo
  const startedOn = me.data ? dayKeyOf(Date.parse(me.data.createdAt)).replace(/-/g, '.') : ''
  const repNickname = rep ? characterNicknameOf(device, rep.group.groupId, rep.characterId) : undefined
  // 메뉴 제목만 (설명 없이) — 자세한 내용은 각 화면에서
  const menu = [
    { to: '/my/profile', label: '내 정보' },
    { to: '/my/memories', label: '추억 기록' },
    { to: '/collection', label: '캐릭터 도감' },
    { to: '/my/notifications', label: '알림 설정' },
    { to: '/my/privacy', label: '내 데이터' },
    { to: '/my/notice', label: '서비스 안내' },
  ]

  /**
   * 시연 시계. useDemoClock이 모든 조회를 다시 불러온 뒤(새 날짜의 GET /me 포함) 이 onSuccess가 불린다.
   * 날짜를 바꾸면 홈으로 가서 새 날의 기분 팝업(동의한 사용자)부터 이어지게 한다.
   */
  const setClock = (now: string | null, message: string, goHome = false) =>
    clock.mutate(now, {
      onSuccess: () => {
        toast(message)
        if (goHome) navigate('/groups')
      },
      onError: (e) => toast(errorMessage(e)),
    })

  const { hour, minute } = kstHourMinute(now)

  return (
    <Page withTabBar gap={12}>
      <PageHeader title="마이페이지" />
      {/* 대표 캐릭터: 내 그룹 중 가장 많이 자란 캐릭터를 홈·그룹 상세와 같은 모습으로. 누르면 도감 */}
      <Link to="/collection" className={styles.profile} aria-label="캐릭터 도감 보기">
        {rep ? (
          <Character stage={displayStage(rep)} variant={variantOf(rep.kind)} size={72} title={`${rep.group.name}의 ${stageNameOf(rep)}`} />
        ) : (
          <Character stage={1} size={72} title="아직 키우는 캐릭터가 없어요" />
        )}
        <div className={styles.profileText}>
          <p className={styles.nickname}>{me.data?.nickname ?? ''}</p>
          <p className={styles.summary}>{startedOn} 시작</p>
          <p className={styles.repLabel}>
            {rep ? `${repNickname ?? `${rep.group.name}의 ${stageNameOf(rep)}`} · ${progressLabel(rep)}` : '그룹에서 캐릭터를 키워 보세요'}
          </p>
        </div>
        <span className={styles.profileChevron} aria-hidden>
          ›
        </span>
      </Link>

      <nav className={styles.menu} aria-label="마이페이지 메뉴">
        {menu.map((m) => (
          <Link key={m.label} to={m.to} className={styles.menuItem}>
            <span className={styles.menuText}>
              <b>{m.label}</b>
            </span>
            <span aria-hidden>›</span>
          </Link>
        ))}
      </nav>

      <section className={styles.knowCard}>
        <h2>알아 두세요</h2>
        <p>
          이 앱은 치료 서비스가 아니고 위기를 감지하지 못해요.
          <br />
          지금 힘들면 <a href="tel:109">109</a> 또는 <a href="tel:15770199">1577-0199</a>로 연락하세요.
        </p>
      </section>

      {showDemoTools ? (
      <details className={styles.demoWrap}>
        <summary>시연 도구</summary>
      <Card className={styles.demo}>
        <h2 className={styles.demoTitle}>시연 도구 ({API_MODE === 'mock' ? '목업 서버' : '시연 서버 시계'})</h2>
        <p className={styles.summary}>서버 기준 오늘: {day} {day ? `(${WEEKDAY_LABELS[weekdayOf(day)]})` : ''}</p>
        <div className={styles.demoRow}>
          <Button size="md" variant="secondary" onClick={() => setClock(kstIso(addDays(day, 1), hour, minute), '하루를 넘겼어요', true)}>
            하루 넘기기
          </Button>
          <Button
            size="md"
            variant="secondary"
            onClick={() => {
              const wd = weekdayOf(day)
              setClock(kstIso(addDays(day, wd === 0 ? 0 : 7 - wd), 19, 0), '일요일 19:00으로 옮겼어요 (점검 시간)', true)
            }}
          >
            일요일 19시로
          </Button>
        </div>
        <Button size="md" variant="ghost" onClick={() => setClock(null, '실제 시각으로 돌아왔어요')}>
          실제 시각으로 돌아가기
        </Button>
        {API_MODE === 'mock' ? (
          <>
            <Button size="md" variant="secondary" loading={demoBusy} onClick={loadDemo}>
              {isDemo ? '시연 데이터 처음부터 다시 불러오기' : '시연 데이터 불러오기 (소은)'}
            </Button>
            {/* 시연 종료: 시연 계정일 때만 (목업 모드 시연 도구 안) */}
            {isDemo ? (
              <Button size="md" variant="secondary" className={styles.danger} onClick={() => setConfirmEnd(true)}>
                시연 종료
              </Button>
            ) : null}
            <Button
              size="md"
              variant="ghost"
              onClick={() => {
                const next = queueMode === 'wait' ? 'match' : 'wait'
                setMockQueueMode(next)
                setQueueMode(next)
                toast(next === 'wait' ? '다음 온라인 참여는 대기부터 시작해요 (20초 뒤 배정)' : '다음 온라인 참여는 바로 배정돼요')
              }}
            >
              온라인 참여: {queueMode === 'wait' ? '대기부터 (20초 뒤 배정)' : '바로 배정'}
            </Button>
            <p className={styles.summary}>
              초대 코드 시연: {DEMO_INVITE_CODES.join} (참여) · {DEMO_INVITE_CODES.expired} (만료) · {DEMO_INVITE_CODES.full} (가득 참)
            </p>
          </>
        ) : null}
      </Card>
      </details>
      ) : null}

      <BottomSheet open={confirmEnd} onClose={() => setConfirmEnd(false)} label="시연 종료 확인">
        <h2 className={styles.sheetTitle}>시연을 끝낼까요?</h2>
        <p className={styles.summary}>
          {backupMeta
            ? `시연 데이터는 지워지고, 시연 전에 쓰던 ${backupMeta.nickname ? `'${backupMeta.nickname}' ` : ''}데이터로 돌아가요. 그 데이터의 기록은 그대로예요.`
            : '시연 전에 백업한 데이터가 없어요. 시연 데이터를 지우고 시작 화면으로 가요.'}
        </p>
        <Button loading={demoBusy} onClick={finishDemo}>
          시연 종료
        </Button>
        <Button variant="ghost" onClick={() => setConfirmEnd(false)}>
          취소
        </Button>
      </BottomSheet>
    </Page>
  )
}
