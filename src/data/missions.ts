import type { MissionTopic, Mood } from '../api/types'

/**
 * 기획서 「미션 주제 목록 (20쌍)」 (MIS-01 시드). 목업 서버가 배정에 쓴다.
 * 실서버에서는 mission_topics 시드 테이블이 기준이다.
 */
export interface TopicSeed extends MissionTopic {
  /** 이 기분일 때 먼저 주는 주제 (빈 배열 = 모든 기분) */
  priorityMoods: Mood[]
  /** 횟수형일 때 5·10·20분에 대응하는 횟수 */
  countSizes?: [number, number, number]
}

const t = (
  topicId: number,
  category: string,
  outdoorText: string,
  indoorText: string,
  sizeType: 'TIME' | 'COUNT',
  priorityMoods: Mood[],
  countSizes?: [number, number, number],
): TopicSeed => ({ topicId, category, outdoorText, indoorText, sizeType, priorityMoods, countSizes })

export const MISSION_TOPICS: TopicSeed[] = [
  t(1, 'ACTIVITY', '한 정거장 먼저 내려 걷기', '제자리 걷기', 'TIME', ['GOOD', 'OKAY']),
  t(2, 'ACTIVITY', '점심 후 건물 밖 한 바퀴', '점심 후 복도·계단 걷기', 'TIME', ['OKAY']),
  t(3, 'ACTIVITY', '엘리베이터 대신 계단', '의자에서 일어났다 앉기', 'COUNT', ['GOOD']),
  t(4, 'STRETCH', '벤치에서 목·어깨 스트레칭', '자리에서 손·목 스트레칭', 'TIME', ['TIRED']),
  t(5, 'NATURE_SUN', '햇빛 받으며 걷기', '창가에서 햇빛 쬐기', 'TIME', ['CALM', 'DEPRESSED']),
  t(6, 'NATURE_SUN', '나무 있는 길·공원 걷기', '창밖 초록 바라보기', 'TIME', ['CALM', 'TIRED']),
  t(7, 'NATURE_SUN', '하늘 올려다보며 걷기', '창밖 하늘 바라보기', 'TIME', ['TIRED']),
  t(8, 'NATURE_SUN', '꽃·식물 하나 찾아보기', '화분 돌보기 또는 자연 소리 듣기', 'TIME', ['CALM']),
  t(9, 'WEAK_TIE', '편의점·카페 직원에게 인사 한마디', '가족·룸메이트에게 먼저 인사', 'COUNT', ['LONELY']),
  t(10, 'WEAK_TIE', '가게에서 "감사합니다" 말하기', '오랜만인 사람에게 안부 메시지', 'COUNT', ['LONELY']),
  t(11, 'WEAK_TIE', '사람 있는 공간(도서관·카페)에 머물기', '좋아하는 사람과 통화', 'TIME', ['LONELY']),
  t(12, 'KINDNESS', '동료·친구에게 음료 하나 (선택)', '집안일 하나 대신 하기', 'COUNT', ['GOOD']),
  t(13, 'KINDNESS', '길에서 쓰레기 하나 줍기', '고마운 사람에게 고맙다고 메시지', 'COUNT', ['GOOD', 'LONELY']),
  t(14, 'BREATH', '벤치에 앉아 천천히 숨쉬기', '자리에서 천천히 숨쉬기', 'TIME', ['TIRED']),
  t(15, 'MINDFUL', '발걸음 세며 걷기', '몸 훑기 (머리부터 발끝까지)', 'TIME', ['TIRED', 'OKAY']),
  t(16, 'PLEASURE', '좋아하는 노래 들으며 걷기', '좋아하는 노래 듣기', 'COUNT', ['DEPRESSED'], [1, 2, 4]),
  t(17, 'PLEASURE', '안 가본 길로 돌아가기', '차 한 잔 천천히 마시기', 'TIME', ['OKAY', 'DEPRESSED']),
  t(18, 'MASTERY', '미뤄둔 작은 볼일 하나(장보기 등)', '책상·가방 정리', 'TIME', ['DEPRESSED']),
  t(19, 'MASTERY', '다 쓴 물건 버리러 나가기', '미뤄둔 메시지·작은 일 하나', 'COUNT', ['DEPRESSED', 'OKAY']),
  t(20, 'GOOD_THING', '걸으며 오늘 좋았던 일 떠올리기', '오늘 좋았던 일 하나 적기 (본인만 봄)', 'COUNT', []),
]

export const topicSeedById = (id: number) => MISSION_TOPICS.find((x) => x.topicId === id) ?? MISSION_TOPICS[0]

/** 크기 단위: 시간형은 '분', 횟수형은 주제에 맞는 단위 */
/**
 * 내 기록(GET /me/records)처럼 주제 번호 없이 분류만 있을 때의 크기 단위.
 * 횟수형 주제는 분류마다 단위가 하나라 분류로 정확히 정해진다 (계단 → 세트, 노래 → 곡, 좋았던 일 → 개, 그 외 → 번)
 */
export function recordSizeUnit(r: { sizeType: MissionTopic['sizeType']; category: string }): string {
  if (r.sizeType === 'TIME') return '분'
  if (r.category === 'ACTIVITY') return '세트'
  if (r.category === 'PLEASURE') return '곡'
  if (r.category === 'GOOD_THING') return '개'
  return '번'
}

export function sizeUnit(topic: Pick<MissionTopic, 'sizeType' | 'category' | 'topicId'>): string {
  if (topic.sizeType === 'TIME') return '분'
  if (topic.topicId === 16) return '곡'
  if (topic.topicId === 3) return '세트'
  if (topic.topicId === 20) return '개'
  return '번'
}
