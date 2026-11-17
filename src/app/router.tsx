import { createBrowserRouter, Navigate } from 'react-router-dom'
import { CheckinResultPage } from '../pages/checkin/CheckinResultPage'
import { CharacterDetailPage } from '../pages/collection/CharacterDetailPage'
import { CollectionPage } from '../pages/collection/CollectionPage'
import { CharacterCompletedPage } from '../pages/groups/CharacterCompletedPage'
import { GroupCollectionPage } from '../pages/groups/GroupCollectionPage'
import { GroupCreatePage } from '../pages/groups/GroupCreatePage'
import { GroupDetailPage } from '../pages/groups/GroupDetailPage'
import { GroupsHomePage } from '../pages/groups/GroupsHomePage'
import { InvitePage } from '../pages/groups/InvitePage'
import { JoinByCodePage } from '../pages/groups/JoinByCodePage'
import { HelpDetailPage } from '../pages/help/HelpDetailPage'
import { HelpPage } from '../pages/help/HelpPage'
import { MemoriesPage } from '../pages/memories/MemoriesPage'
import { MemoryDetailPage } from '../pages/memories/MemoryDetailPage'
import { MemoryEditPage } from '../pages/memories/MemoryEditPage'
import { MissionDonePage } from '../pages/mission/MissionDonePage'
import { MissionPage } from '../pages/mission/MissionPage'
import { MissionTimerPage } from '../pages/mission/MissionTimerPage'
import { MyNoticePage } from '../pages/my/MyNoticePage'
import { MyNotificationsPage } from '../pages/my/MyNotificationsPage'
import { MyPage } from '../pages/my/MyPage'
import { MyPrivacyPage } from '../pages/my/MyPrivacyPage'
import { MyProfilePage } from '../pages/my/MyProfilePage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { ConsentPage } from '../pages/onboarding/ConsentPage'
import { InstallGuidePage } from '../pages/onboarding/InstallGuidePage'
import { NicknamePage } from '../pages/onboarding/NicknamePage'
import { ProfileInfoPage } from '../pages/onboarding/ProfileInfoPage'
import { NotificationsPermissionPage } from '../pages/onboarding/NotificationsPermissionPage'
import { StartPage } from '../pages/onboarding/StartPage'
import { LaunchSplashPage } from '../pages/launch/LaunchSplashPage'
import { RecordsPage } from '../pages/records/RecordsPage'
import { FullscreenLayout, OnboardingLayout, TabLayout } from './layouts'

export const router = createBrowserRouter([
  // 앱 실행 스플래시 → 계정 확인 → 시작 화면 / 멈춘 온보딩 단계 / 그룹 탭
  { path: '/', element: <LaunchSplashPage /> },
  // S01·S02 시작
  { path: '/welcome', element: <StartPage /> },
  {
    path: '/onboarding',
    element: <OnboardingLayout />,
    children: [
      // UserFlow 3절 순서: S03 → S04(계정 생성) → S05 → S06 → S07 → S08
      { path: 'install', element: <InstallGuidePage /> },
      { path: 'nickname', element: <NicknamePage /> },
      { path: 'profile', element: <ProfileInfoPage /> },
      { path: 'consent', element: <ConsentPage /> },
      { path: 'notifications', element: <NotificationsPermissionPage /> },
      { path: 'group', element: <GroupCreatePage onboarding /> },
      { path: 'join', element: <JoinByCodePage onboarding /> },
      // 예전 주소 (로그인 화면·소개 슬라이드는 시작 화면으로 합침)
      { path: 'intro', element: <Navigate to="/welcome" replace /> },
      { path: 'login', element: <Navigate to="/welcome" replace /> },
    ],
  },
  {
    element: <TabLayout />,
    children: [
      { path: '/groups', element: <GroupsHomePage /> },
      { path: '/groups/new', element: <GroupCreatePage /> },
      { path: '/groups/join', element: <JoinByCodePage /> },
      { path: '/groups/:groupId/invite', element: <InvitePage /> },
      { path: '/groups/:groupId', element: <GroupDetailPage /> },
      { path: '/groups/:groupId/completed', element: <CharacterCompletedPage /> },
      { path: '/groups/:groupId/collection', element: <GroupCollectionPage /> },
      { path: '/mission', element: <MissionPage /> },
      { path: '/records', element: <RecordsPage /> },
      // S32 캐릭터 도감(내 모든 그룹) · 캐릭터 성장 과정
      { path: '/collection', element: <CollectionPage /> },
      { path: '/collection/:groupId/:characterId', element: <CharacterDetailPage /> },
      // 도움받기는 로그인 없이도 열린다 (TabLayout에서 예외 처리)
      { path: '/help', element: <HelpPage /> },
      { path: '/help/:serviceId', element: <HelpDetailPage /> },
      { path: '/my', element: <MyPage /> },
      { path: '/my/profile', element: <MyProfilePage /> },
      { path: '/my/notifications', element: <MyNotificationsPage /> },
      { path: '/my/privacy', element: <MyPrivacyPage /> },
      { path: '/my/notice', element: <MyNoticePage /> },
      // 추억 기록: 미션 사진·한 줄 메모 (이 기기에만)
      { path: '/my/memories', element: <MemoriesPage /> },
      { path: '/my/memories/:date', element: <MemoryDetailPage /> },
    ],
  },
  {
    element: <FullscreenLayout />,
    children: [
      { path: '/mission/timer', element: <MissionTimerPage /> },
      { path: '/mission/done', element: <MissionDonePage /> },
      { path: '/checkin/result', element: <CheckinResultPage /> },
      { path: '/record/:date', element: <MemoryEditPage /> },
    ],
  },
  { path: '/home', element: <Navigate to="/groups" replace /> },
  { path: '*', element: <NotFoundPage /> },
])
