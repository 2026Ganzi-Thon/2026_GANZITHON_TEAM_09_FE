import { Card, Page, PageHeader } from '../../components/layout/Page'
import { HELP_DATA_BASE_DATE } from '../../data/helpServices'
import styles from './my.module.css'

export function MyNoticePage() {
  return (
    <Page withTabBar gap={14}>
      <PageHeader title="서비스 안내" back="/my" />
      <Card soft>
        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-navy-deep)' }}>
          이 앱은 치료 서비스가 아니고 위기를 감지하지 못해요.
          <br />
          지금 힘들면 24시간 채널로 연락하세요.
        </p>
      </Card>
      <Card>
        <h2 className={styles.h2}>알아 두면 좋은 점</h2>
        <ul className={styles.list}>
          <li>미션은 기분 전환에 도움이 될 수 있지만 치료 효과를 약속하지 않아요.</li>
          <li>마음 점검은 진단이 아니고, 바우처 등 신청 증빙이 되지 않아요.</li>
          <li>온라인 그룹의 나이 제한(만 19세 이상)은 본인 확인 없이 스스로 답한 내용을 믿어요.</li>
          <li>작은 그룹에서는 완료 현황과 핑으로 참여 여부가 짐작될 수 있어요.</li>
          <li>도움받을 곳은 공공서비스(혜택) 정보({HELP_DATA_BASE_DATE} 기준)를 사람이 골라 정리했어요. 신청 결과·예약은 각 기관에서 확인해 주세요.</li>
        </ul>
      </Card>
      <Card>
        <h2 className={styles.h2} id="privacy">개인정보 처리방침 (요약)</h2>
        <ul className={styles.list}>
          <li>
            <b>서버에 저장</b>: 닉네임, 기분·미션·마음 점검 기록, 그룹 참여·핑, 알림 설정. 기분과 점검 결과는 민감정보라 따로 동의한 경우에만 저장해요.
          </li>
          <li>
            <b>이 기기에만 저장</b>: 생년월일·지역·직업(도움받을 곳을 고르는 데만 씀), 추억 기록의 미션 사진·한 줄 메모, 캐릭터 별명. 서버로 보내지 않아요.
          </li>
          <li>
            <b>쓰는 곳</b>: 오늘 미션 고르기, 캐릭터 성장, 주간 점검 결과 안내. 광고·제3자 제공은 하지 않아요.
          </li>
          <li>
            <b>지우기</b>: 마이 › 계정 삭제로 언제든 지울 수 있어요. 그룹 캐릭터와 도감은 다른 멤버를 위해 남지만 내 이름은 남지 않아요.
          </li>
          <li>
            <b>그룹에 보이는 것</b>: 완료 합계(몇 명 중 몇 명), 캐릭터, 이름 없는 이모티콘 핑. 기분·점검 결과·도움받기 이용·개인별 참여 여부는 보이지 않아요.
          </li>
          <li>
            <b>모으지 않는 것</b>: 위치(GPS), 주민번호, 진단명, 소득, 연락처, 그룹 안 글·사진(미션 사진·메모는 이 기기에만), 도움받기 이용 기록.
          </li>
        </ul>
      </Card>
    </Page>
  )
}
