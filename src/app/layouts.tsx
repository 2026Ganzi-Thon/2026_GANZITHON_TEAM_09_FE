import { useEffect } from 'react'
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useCheckCurrent, useMe } from '../api/queries'
import { TabBar } from '../components/layout/TabBar'
import { Loading } from '../components/ui/Loading'
import { useDevice } from '../device/store'
import { CheckinSheet } from '../features/checkin/CheckinSheet'
import { MoodSheet } from '../features/mood/MoodSheet'
import { isMoodPromptDue } from '../features/selectors'
import { entryPath } from './entry'
import helpLink from './OnboardingHelpLink.module.css'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

/** 온보딩: 닉네임(계정 생성) 이후 단계는 계정이 있어야 한다. 이미 끝났으면 홈으로 */
export function OnboardingLayout() {
  const me = useMe()
  const device = useDevice()
  const { pathname } = useLocation()
  if (me.isPending) return <Loading />
  if (me.data && device.onboarded) return <Navigate to="/groups" replace />
  // 계정을 만들기 전 단계: S03 홈 화면 추가, S04 닉네임(여기서 계정 생성)
  const beforeAccount = ['/onboarding/install', '/onboarding/nickname', '/onboarding/intro', '/onboarding/login'].includes(pathname)
  if (!beforeAccount && !me.data) return <Navigate to="/onboarding/nickname" replace />
  return (
    <>
      <ScrollToTop />
      <Link to="/help" className={helpLink.link}>
        도움받기
      </Link>
      <div className={helpLink.screen}>
        <Outlet />
      </div>
    </>
  )
}

/** 앱을 열 때의 팝업: 기분(P01) → 점검(P02) 순서. 도움받기에서는 띄우지 않는다 */
function useAppPopups(isHelp: boolean) {
  const me = useMe()
  const device = useDevice()
  const moodDue = isMoodPromptDue(me.data, device.moodPromptDay, device.onboarded)
  const consent = !!me.data?.sensitiveConsent
  const check = useCheckCurrent(!!me.data && device.onboarded && consent)
  return {
    moodOpen: moodDue && !isHelp,
    checkOpen: !moodDue && !isHelp && consent && !!check.data?.due,
  }
}

/**
 * 탭 화면 공통: 탭바 + 앱 시작 팝업.
 * 도움받기(목록·상세)는 계정 없이도 열린다 (HELP-01).
 */
export function TabLayout() {
  const me = useMe()
  const device = useDevice()
  const { pathname } = useLocation()
  // 도움받기(HELP-01)는 계정 없이도 열린다. 기분·점검 팝업도 띄우지 않는다
  const isHelp = pathname === '/help' || pathname.startsWith('/help/')
  const ready = !!me.data && device.onboarded
  const popups = useAppPopups(isHelp)

  if (me.isPending) return <Loading />
  if (!ready && !isHelp) return <Navigate to={entryPath(me.data, device)} replace />

  return (
    <>
      <ScrollToTop />
      <Outlet />
      {ready ? <TabBar /> : null}
      {ready ? <MoodSheet open={popups.moodOpen} /> : null}
      {ready ? <CheckinSheet open={popups.checkOpen} /> : null}
    </>
  )
}

/** 탭바 없는 전체 화면 (타이머, 완료, 점검 결과) */
export function FullscreenLayout() {
  const me = useMe()
  const device = useDevice()
  if (me.isPending) return <Loading />
  if (!me.data || !device.onboarded) return <Navigate to={entryPath(me.data, device)} replace />
  return (
    <>
      <ScrollToTop />
      <Outlet />
    </>
  )
}
