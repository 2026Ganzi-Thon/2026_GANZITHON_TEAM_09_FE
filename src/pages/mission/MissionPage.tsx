import { Page, PageHeader } from '../../components/layout/Page'
import { MissionPanel } from '../../features/mission/MissionPanel'

/** 홈의 '오늘의 내 미션' 카드에서 들어오는 S21 미션 준비. 그룹이 없어도 개인 미션은 할 수 있다 */
export function MissionPage() {
  return (
    <Page withTabBar gap={12}>
      <PageHeader title="오늘의 내 미션" back="/groups" />
      <MissionPanel />
    </Page>
  )
}
