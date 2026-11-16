/**
 * 주간 마음 점검 문항 (미정 #4 임시안: 우울 2 + 불안 2, 최근 2주).
 * 검증된 한국어판으로 교체 예정. 자해 생각을 직접 묻는 문항은 넣지 않는다.
 */
export interface CheckinQuestion {
  id: string
  scale: 'depression' | 'anxiety'
  text: string
}

export const CHECKIN_QUESTIONS: CheckinQuestion[] = [
  { id: 'd1', scale: 'depression', text: '최근 2주 동안, 일에 흥미나 즐거움을 거의 느끼지 못한 적이 얼마나 자주 있었나요?' },
  { id: 'd2', scale: 'depression', text: '최근 2주 동안, 기분이 가라앉거나 우울하다고 느낀 적이 얼마나 자주 있었나요?' },
  { id: 'a1', scale: 'anxiety', text: '최근 2주 동안, 초조하거나 불안하거나 조마조마하게 느낀 적이 얼마나 자주 있었나요?' },
  { id: 'a2', scale: 'anxiety', text: '최근 2주 동안, 걱정하는 것을 멈추거나 조절하기 어려웠던 적이 얼마나 자주 있었나요?' },
]

export const CHECKIN_OPTIONS = ['전혀 없었어요', '며칠 있었어요', '1주일 넘게 있었어요', '거의 매일 있었어요'] as const

/** 각 척도 합계가 이 값 이상이면 '기준 이상' */
export const CHECKIN_THRESHOLD = 3

/** 점검 요일 (0=일요일). 미정 #4 임시안: 일요일 */
export const CHECKIN_WEEKDAY = 0
