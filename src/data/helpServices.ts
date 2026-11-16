import type { Occupation, Section } from '../types/domain'

/** 사업 목록 기준일 (공공서비스(혜택) API 조회·큐레이션) */
export const HELP_DATA_BASE_DATE = '2026-11-15'

export interface HelpRule {
  minAge?: number
  maxAge?: number
  /** 시·도가 이 값일 때만 */
  sido?: string
  occupations?: Occupation[]
}

export interface HelpService {
  id: string
  section: Section
  name: string
  /** 카드 두 번째 줄 */
  summary: string
  target: string
  howTo: string
  /** 공공서비스(혜택) API 서비스 ID */
  serviceId?: string
  phone?: string
  url?: string
  /** 카드와 상세에 함께 보여줄 주의 문구 */
  note?: string
  is24h?: boolean
  rule?: HelpRule
}

const gov24 = (serviceId: string) => `https://www.gov.kr/portal/rcvfvrSvc/dtlEx/${serviceId}`

/** 24시간 채널은 고정 목록 (앱에 고정, PWA 캐시) */
export const CRISIS_LINES: HelpService[] = [
  {
    id: 'line-109',
    section: 'crisis',
    name: '자살예방상담전화 109',
    summary: '전화 · 24시간',
    target: '누구나',
    howTo: '109로 전화',
    phone: '109',
    is24h: true,
  },
  {
    id: 'line-15770199',
    section: 'crisis',
    name: '정신건강위기상담 1577-0199',
    summary: '전화 · 24시간',
    target: '누구나',
    howTo: '1577-0199로 전화',
    phone: '1577-0199',
    is24h: true,
  },
  {
    id: 'line-1388',
    section: 'crisis',
    name: '청소년상담1388',
    summary: '만 24세 이하 · 전화·문자·카톡',
    target: '만 9~24세',
    howTo: '1388 전화, 카카오톡·문자·웹 채팅 (24시간)',
    serviceId: 'WII000000770',
    phone: '1388',
    url: 'https://www.cyber1388.kr',
    is24h: true,
    rule: { maxAge: 24 },
  },
  {
    id: 'line-120',
    section: 'crisis',
    name: '외로움안녕120',
    summary: '서울 · 120 누르고 5번 · 카톡',
    target: '외로움을 느끼는 서울시민 누구나',
    howTo: '120 전화 후 5번, 카카오톡 (24시간)',
    serviceId: '611000019639',
    phone: '120',
    url: gov24('611000019639'),
    is24h: true,
    rule: { sido: '서울특별시' },
  },
]

/** 상담받을 곳·가볍게 들를 곳. 선정과 표시 규칙은 사람이 정하고, API는 최신 정보 유지에 쓴다. */
export const HELP_SERVICES: HelpService[] = [
  {
    id: 'seoul-youth-mind',
    section: 'counsel',
    name: '서울 청년 마음건강 지원',
    summary: '서울 만 19~39세 · 1·3·7·9월 모집 · 청년몽땅정보통',
    target: '서울 거주 만 19~39세',
    howTo: '분기별 모집(1·3·7·9월), 청년몽땅정보통 온라인 신청',
    serviceId: '611000019617',
    url: gov24('611000019617'),
    rule: { sido: '서울특별시', minAge: 19, maxAge: 39 },
  },
  {
    id: 'mental-center',
    section: 'counsel',
    name: '정신건강복지센터',
    summary: '지역 주민 누구나 · 전화 또는 방문',
    target: '지역 주민 누구나',
    howTo: '사는 곳의 정신건강복지센터에 전화 또는 방문',
    serviceId: 'GMW000000140',
    url: gov24('GMW000000140'),
  },
  {
    id: 'voucher',
    section: 'counsel',
    name: '정신건강 심리상담 바우처',
    summary: '상담 8회 · 의뢰서 필요(센터·학교 상담센터에서 발급)',
    target: '우울·불안 등 정서적 어려움이 있는 만 19세 이상 (나이·소득 기준 없음)',
    howTo: '의뢰서 등 증빙을 받은 뒤 복지로 온라인 신청',
    serviceId: '135200005045',
    url: gov24('135200005045'),
    note: '정신건강복지센터나 학교 상담센터에서 의뢰서를 받아야 해요. 앱의 점검 결과는 증빙이 되지 않아요.',
    rule: { minAge: 19 },
  },
  {
    id: 'school-counsel',
    section: 'counsel',
    name: '학교 상담센터',
    summary: '재학생 누구나 · 바우처 의뢰서도 받을 수 있어요',
    target: '대학생·대학원생',
    howTo: '다니는 학교의 학생상담센터에 문의',
    rule: { occupations: ['student'] },
  },
  {
    id: 'worker-health',
    section: 'counsel',
    name: '근로자건강센터',
    summary: '50인 미만 사업장 근로자 · 센터 방문',
    target: '50인 미만 사업장 근로자, 만 18~64세',
    howTo: '가까운 근로자건강센터 방문',
    serviceId: '149200000043',
    url: gov24('149200000043'),
    rule: { occupations: ['worker'], minAge: 18, maxAge: 64 },
  },
  {
    id: 'eap',
    section: 'counsel',
    name: '근로자 지원 프로그램(EAP)',
    summary: '회사에 EAP가 있는지 확인해 보세요',
    target: '300인 미만 중소기업 사업장 (회사가 신청)',
    howTo: '회사가 신청하는 사업이라 개인은 신청할 수 없어요. 회사 가입 여부를 확인해 보세요.',
    serviceId: 'B49000100210',
    url: gov24('B49000100210'),
    rule: { occupations: ['worker'] },
  },
  {
    id: 'job-mind',
    section: 'counsel',
    name: '심리안정지원 프로그램',
    summary: '구직 중 · 고용센터 방문',
    target: '실직으로 불안·우울을 겪는 만 18~64세 (국민취업지원제도 참여자·실업급여 수급자 등)',
    howTo: '가까운 고용센터 방문',
    serviceId: '149200000146',
    url: gov24('149200000146'),
    rule: { occupations: ['jobseeker'], minAge: 18, maxAge: 64 },
  },
  {
    id: 'mind-store',
    section: 'visit',
    name: '서울마음편의점',
    summary: '외로운 서울시민 누구나 · 지점 방문',
    target: '외로움을 느끼는 서울시민 누구나',
    howTo: '가까운 지점 방문 후 이용자 등록',
    serviceId: '611000019640',
    url: gov24('611000019640'),
    rule: { sido: '서울특별시' },
  },
]
