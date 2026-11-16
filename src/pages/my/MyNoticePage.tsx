import { Card, Page, PageHeader } from '../../components/layout/Page'
import { HELP_DATA_BASE_DATE } from '../../data/helpServices'
import styles from './my.module.css'

export function MyNoticePage() {
  return (
    <Page withTabBar gap={14}>
      <PageHeader title="서비스 안내 · 고지" back="/my" />
      <Card soft>
        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-navy-deep)' }}>
          이 앱은 치료 서비스가 아니고 위기를 감지하지 못해요. 지금 힘들면 24시간 채널로 연락하세요.
        </p>
      </Card>
      <Card>
        <h2 className={styles.h2}>알아 두면 좋은 점</h2>
        <ul className={styles.list}>
          <li>미션은 기분 전환에 도움이 될 수 있지만 치료 효과를 약속하지 않아요.</li>
          <li>마음 점검은 진단이 아니고, 바우처 등 신청 증빙이 되지 않아요.</li>
          <li>온라인 그룹의 나이 제한은 직접 입력한 생년월일 기준이에요.</li>
          <li>작은 그룹에서는 완료 현황과 핑으로 참여 여부가 짐작될 수 있어요.</li>
          <li>도움받을 곳은 공공서비스(혜택) 정보({HELP_DATA_BASE_DATE} 기준)를 사람이 골라 정리했어요. 신청 결과·예약은 각 기관에서 확인해 주세요.</li>
        </ul>
      </Card>
    </Page>
  )
}
