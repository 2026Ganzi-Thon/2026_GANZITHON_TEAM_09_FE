import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { API_MODE, api } from '../../api'
import { errorMessage } from '../../api/errors'
import { seedMockDemo, DEMO_INVITE_CODES } from '../../api/mock/server'
import { useDemoClock, useMe } from '../../api/queries'
import { Character } from '../../components/character/Character'
import { Card, Page, PageHeader } from '../../components/layout/Page'
import { BottomSheet } from '../../components/ui/BottomSheet'
import { Button } from '../../components/ui/Button'
import { useToast } from '../../components/ui/Toast'
import { clearDeviceProfile, setDeviceProfile, useDeviceProfile } from '../../device/profile'
import { resetDevice, updateDevice } from '../../device/store'
import { addDays, kstHourMinute, weekdayOf, WEEKDAY_LABELS } from '../../features/date'
import { JOB_LABELS } from '../../features/profile/jobs'
import { useNow } from '../../hooks/useNow'
import { useAllCharacters } from '../../features/character/useCharacters'
import { displayStage, progressLabel, stageNameOf, variantOf } from '../../features/selectors'
import styles from './my.module.css'

const MENU = [
  { to: '/collection', label: '캐릭터 도감' },
  { to: '/my/profile', label: '내 정보' },
  { to: '/my/notifications', label: '알림' },
  { to: '/my/privacy', label: '개인정보 · 기록 삭제' },
  { to: '/my/notice', label: '서비스 안내 · 고지' },
]

/** KST 날짜 + 시:분 → ISO(UTC) */
const kstIso = (day: string, hour: number, minute: number) =>
  new Date(Date.parse(`${day}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00+09:00`)).toISOString()

/** S50 마이 */
export function MyPage() {
  const me = useMe()
  const now = useNow()
  const navigate = useNavigate()
  const toast = useToast()
  const qc = useQueryClient()
  const profile = useDeviceProfile()
  const clock = useDemoClock()
  const rep = useAllCharacters().representative
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const day = me.data?.today ?? ''
  const summary = [profile.sigungu ?? profile.sido, profile.job ? JOB_LABELS[profile.job] : null].filter(Boolean).join(' · ')

  const setClock = (now: string | null, message: string) =>
    clock.mutate(now, { onSuccess: () => toast(message), onError: (e) => toast(errorMessage(e)) })

  const { hour, minute } = kstHourMinute(now)

  return (
    <Page withTabBar gap={12}>
      <PageHeader title="마이" />
      {/* 대표 캐릭터: 내 그룹 중 가장 많이 자란 캐릭터를 홈·그룹 상세와 같은 모습으로. 누르면 도감 */}
      <Link to="/collection" className={styles.profile} aria-label="캐릭터 도감 보기">
        {rep ? (
          <Character stage={displayStage(rep)} variant={variantOf(rep.kind)} size={72} title={`${rep.group.name}의 ${stageNameOf(rep)}`} />
        ) : (
          <Character stage={1} size={72} title="아직 키우는 캐릭터가 없어요" />
        )}
        <div className={styles.profileText}>
          <p className={styles.nickname}>{me.data?.nickname ?? ''}</p>
          <p className={styles.summary}>{summary || '계정은 이 기기에만 있어요'}</p>
          <p className={styles.repLabel}>
            {rep ? `${rep.group.name}의 ${stageNameOf(rep)} · ${progressLabel(rep)}` : '그룹에서 캐릭터를 키워 보세요'}
          </p>
        </div>
        <span className={styles.profileChevron} aria-hidden>
          ›
        </span>
      </Link>

      <nav className={styles.menu} aria-label="마이 메뉴">
        {MENU.map((m) => (
          <Link key={m.to} to={m.to} className={styles.menuItem}>
            {m.label}
            <span aria-hidden>›</span>
          </Link>
        ))}
      </nav>

      <p className={styles.notice}>
        이 앱은 치료 서비스가 아니고 위기를 감지하지 못해요. 지금 힘들면 <Link to="/help">24시간 채널</Link>로 연락하세요.
      </p>

      <Card className={styles.demo}>
        <h2 className={styles.demoTitle}>시연 도구 ({API_MODE === 'mock' ? '목업 서버' : '시연 서버 시계'})</h2>
        <p className={styles.summary}>서버 기준 오늘: {day} {day ? `(${WEEKDAY_LABELS[weekdayOf(day)]})` : ''}</p>
        <div className={styles.demoRow}>
          <Button size="md" variant="secondary" onClick={() => setClock(kstIso(addDays(day, 1), hour, minute), '하루를 넘겼어요')}>
            하루 넘기기
          </Button>
          <Button
            size="md"
            variant="secondary"
            onClick={() => {
              const wd = weekdayOf(day)
              setClock(kstIso(addDays(day, wd === 0 ? 0 : 7 - wd), 19, 0), '일요일 19:00으로 옮겼어요 (점검 시간)')
              navigate('/groups')
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
            <Button
              size="md"
              variant="secondary"
              onClick={async () => {
                seedMockDemo()
                setDeviceProfile({ birthDate: '2000-05-14', sido: '서울특별시', sigungu: '마포구', job: 'STUDENT' })
                resetDevice()
                updateDevice({ onboarded: true })
                await qc.resetQueries()
                toast('시연 데이터를 불러왔어요')
                navigate('/groups')
              }}
            >
              시연 데이터 불러오기 (소은)
            </Button>
            <p className={styles.summary}>
              초대 코드 시연: {DEMO_INVITE_CODES.join} (참여) · {DEMO_INVITE_CODES.expired} (만료) · {DEMO_INVITE_CODES.full} (가득 참)
            </p>
          </>
        ) : null}
      </Card>

      <Button variant="ghost" className={styles.danger} onClick={() => setConfirmDelete(true)}>
        계정 삭제
      </Button>

      <BottomSheet open={confirmDelete} onClose={() => setConfirmDelete(false)} label="계정 삭제 확인">
        <h2 className={styles.sheetTitle}>계정을 삭제할까요?</h2>
        <p className={styles.summary}>그룹에서 모두 나가고 기록이 사라져요. 함께 키운 캐릭터와 도감은 그룹에 남아요. 되돌릴 수 없어요.</p>
        <Button
          loading={deleting}
          onClick={async () => {
            setDeleting(true)
            try {
              await api.deleteMe()
              clearDeviceProfile()
              resetDevice()
              qc.clear()
              navigate('/welcome', { replace: true })
            } catch (e) {
              toast(errorMessage(e))
            } finally {
              setDeleting(false)
            }
          }}
        >
          계정 삭제
        </Button>
        <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
          취소
        </Button>
      </BottomSheet>
    </Page>
  )
}
