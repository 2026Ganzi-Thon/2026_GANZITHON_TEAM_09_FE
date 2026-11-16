import type { MissionToday, Place } from '../../api/types'

/** 고른 장소(밖/안)에 맞는 미션 문구 */
export const missionText = (m: Pick<MissionToday, 'topic'>, place: Place) => (place === 'INDOOR' ? m.topic.indoorText : m.topic.outdoorText)
