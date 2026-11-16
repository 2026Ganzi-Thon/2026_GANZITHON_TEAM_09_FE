import type { MissionMinutes, Mood, SizeType } from '../../api/types'

/** 결정적 해시 (목업 서버의 가짜 구성원·배정에 쓴다) */
export function hashString(input: string): number {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/**
 * MIS-04 기분 매핑표: 고른 시간이 최대치이고, 지쳐요·우울해요면 한 단계 낮춘다(10→5, 20→10).
 * 기분을 입력하지 않으면 '보통이에요'로 본다.
 */
export function minutesForMood(mood: Mood | undefined, chosen: MissionMinutes): MissionMinutes {
  if (mood === 'TIRED' || mood === 'DEPRESSED') {
    return chosen === 20 ? 10 : 5
  }
  return chosen
}

/**
 * 시간형은 분, 횟수형은 5→1, 10→2, 20→3 (노래 주제처럼 따로 정한 횟수가 있으면 그것).
 */
export function sizeFor(
  mood: Mood | undefined,
  chosen: MissionMinutes,
  sizeType: SizeType,
  countSizes: [number, number, number] = [1, 2, 3],
): number {
  const minutes = minutesForMood(mood, chosen)
  if (sizeType === 'TIME') return minutes
  return countSizes[minutes === 5 ? 0 : minutes === 10 ? 1 : 2]
}

/** 크기를 낮췄는지 (화면 문구 "한 단계 작게 추천했어요") */
export function isSizeLowered(mood: Mood | undefined, chosen: MissionMinutes) {
  return minutesForMood(mood, chosen) !== chosen
}
