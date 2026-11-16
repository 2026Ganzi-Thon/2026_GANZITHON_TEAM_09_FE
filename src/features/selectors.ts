import type { CharacterSummary, GroupSummary, Me } from '../api/types'
import type { CharacterStage, CharacterVariant } from '../types/domain'
import { formatGrowth, stageOf, STAGE_NAMES } from './character/growth'

/** 캐릭터 종류(kind) → 마스코트 색. 종류는 디자이너 확정 전 임시 3종(PRD Q5) */
export function variantOf(kind: string | undefined): CharacterVariant {
  const k = (kind ?? '').toLowerCase()
  return k === 'mint' || k === 'peach' ? k : 'cream'
}

/** 표시 수치로 단계를 정한다 (CHR-06). 100이면 완성(5) */
export function displayStage(c: Pick<CharacterSummary, 'progress'>): CharacterStage {
  return stageOf(c.progress)
}

export const stageNameOf = (c: Pick<CharacterSummary, 'progress'>) => STAGE_NAMES[displayStage(c)]

/** Figma 문구: "52.7 / 100 · 3단계" */
export function progressLabel(c: Pick<CharacterSummary, 'progress'>) {
  const stage = displayStage(c)
  return `${formatGrowth(c.progress)} / 100 · ${stage === 5 ? '완성' : `${stage}단계`}`
}

export function groupMetaLabel(g: Pick<GroupSummary, 'type' | 'memberCount'>) {
  if (g.type === 'FRIEND') return `친구 그룹 · ${g.memberCount}명`
  if (g.type === 'ONLINE') return `온라인 그룹 · 익명 ${g.memberCount}명`
  return '1인 그룹'
}

/** 기분 팝업: 동의한 사용자에게 하루 한 번 (기기에 띄운 날짜를 저장해 me.today와 비교) */
export function isMoodPromptDue(me: Me | null | undefined, moodPromptDay: string | undefined, onboarded: boolean) {
  return !!me && onboarded && me.sensitiveConsent && moodPromptDay !== me.today
}
