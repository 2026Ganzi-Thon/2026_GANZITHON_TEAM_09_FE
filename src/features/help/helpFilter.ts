import type { HelpItem, HelpSection, HelpSignals } from '../../api/types'
import { SEOUL } from '../../data/regions'
import type { DeviceProfile } from '../../device/profile'
import { ageOn } from '../date'

export interface HelpContext {
  profile?: DeviceProfile
  today: string
  signals?: Partial<HelpSignals>
}

/**
 * HELP-03: 필터는 기기에서. 입력하지 않은 정보에 걸린 규칙은 통과로 본다.
 * 도움을 놓치는 것보다 대상이 아닌 카드를 보는 편이 낫다.
 */
export function isVisible(item: HelpItem, ctx: HelpContext): boolean {
  const r = item.rules ?? {}
  const p = ctx.profile ?? {}
  const age = ageOn(p.birthDate, ctx.today)
  if (age !== undefined) {
    if (r.minAge !== undefined && age < r.minAge) return false
    if (r.maxAge !== undefined && age > r.maxAge) return false
  }
  // 구 센터는 그 구를 고른 사람에게만, '센터 찾기'는 구 센터가 없을 때만 (서울 밖·구 미입력)
  if (item.kind === 'LOCAL_CENTER') return !!p.sigungu && !!r.sigungu?.includes(p.sigungu) && (!r.sido?.length || r.sido.includes(p.sido ?? ''))
  if (item.kind === 'CENTER_FINDER' && p.sido === SEOUL && p.sigungu) return false
  if (r.sido?.length && p.sido && !r.sido.includes(p.sido)) return false
  if (r.sigungu?.length && p.sigungu && !r.sigungu.includes(p.sigungu)) return false
  if (r.jobs?.length && p.job && !r.jobs.includes(p.job)) return false
  return true
}

/** 서울 밖에서 구를 알면 '○○구 정신건강복지센터 찾기'로 */
function localize(item: HelpItem, ctx: HelpContext): HelpItem {
  if (item.kind === 'CENTER_FINDER' && ctx.profile?.sigungu) {
    return { ...item, name: `${ctx.profile.sigungu} 정신건강복지센터 찾기` }
  }
  return item
}

const isCenter = (item: HelpItem) => item.id === 'mental-center' || item.kind === 'LOCAL_CENTER'

/** 기획서 「순서 규칙」: 신호에 맞는 카드를 각 구역 안에서 위로 올린다. 24시간 채널 구역은 항상 맨 위 */
export function boostReason(item: HelpItem, ctx: HelpContext): string | null {
  const seoul = ctx.profile?.sido ? ctx.profile.sido === SEOUL : true
  const { lonely3Days, checkAboveThreshold } = ctx.signals ?? {}
  if (checkAboveThreshold && (isCenter(item) || ['voucher', 'seoul-youth-mind', 'school-counsel'].includes(item.id))) return '이번 주 마음 점검 결과로 위에 보여드렸어요.'
  if (lonely3Days) {
    if (seoul && (item.id === 'line-120' || item.id === 'mind-store')) return '요즘 외로운 날이 이어져서 위에 보여드렸어요.'
    if (!seoul && isCenter(item)) return '요즘 외로운 날이 이어져서 위에 보여드렸어요.'
  }
  if (ctx.profile?.job === 'JOB_SEEKER' && item.id === 'job-mind') return '구직 중으로 입력해서 위에 보여드렸어요.'
  return null
}

const boosted = (item: HelpItem, ctx: HelpContext) => boostReason(item, ctx) !== null

/** S41 태그: 지역 · 나이 · 구역 */
export function helpTags(item: HelpItem): string[] {
  const r = item.rules ?? {}
  const tags: string[] = []
  if (r.sigungu?.length) tags.push(r.sigungu.join('·'))
  else if (r.sido?.length) tags.push(r.sido.map((s) => (s === SEOUL ? '서울' : s)).join('·'))
  if (r.minAge !== undefined && r.maxAge !== undefined) tags.push(`만 ${r.minAge}~${r.maxAge}세`)
  else if (r.minAge !== undefined) tags.push(`만 ${r.minAge}세 이상`)
  else if (r.maxAge !== undefined) tags.push(`만 ${r.maxAge}세 이하`)
  tags.push(item.section === 'CRISIS_24H' ? '24시간' : item.section === 'COUNSELING' ? '상담받을 곳' : '가볍게 들를 곳')
  return tags
}

/** 기분·점검 결과는 거르는 데 쓰지 않고 순서에만 쓴다 */
export function helpListFor(items: HelpItem[], ctx: HelpContext): Record<HelpSection, HelpItem[]> {
  const ordered = (section: HelpSection) =>
    items
      .filter((x) => x.section === section && isVisible(x, ctx))
      .map((x, i) => ({ x: localize(x, ctx), i, up: boosted(x, ctx) ? 0 : 1 }))
      .sort((a, b) => a.up - b.up || a.i - b.i)
      .map(({ x }) => x)
  return { CRISIS_24H: ordered('CRISIS_24H'), COUNSELING: ordered('COUNSELING'), DROP_IN: ordered('DROP_IN') }
}

export function findHelpItem(items: HelpItem[], id: string, ctx: HelpContext): HelpItem | undefined {
  const item = items.find((x) => x.id === id)
  return item ? localize(item, ctx) : undefined
}

export function profileIsEmpty(p?: DeviceProfile) {
  return !p?.birthDate && !p?.sido && !p?.job
}

/** "서울 마포구 · 대학생 · 만 26세 기준" */
export function profileBasisLabel(p: DeviceProfile | undefined, today: string, jobLabel?: (j: NonNullable<DeviceProfile['job']>) => string) {
  const parts: string[] = []
  if (p?.sido) {
    const sido = p.sido === SEOUL ? '서울' : p.sido.replace(/(특별자치시|특별자치도|특별시|광역시|도)$/, '')
    parts.push([sido, p.sigungu].filter(Boolean).join(' '))
  }
  if (p?.job && jobLabel) parts.push(jobLabel(p.job))
  const age = ageOn(p?.birthDate, today)
  if (age !== undefined) parts.push(`만 ${age}세`)
  return parts.join(' · ')
}

/** 하이픈 없는 전화 링크 */
export const telHref = (phone: string) => `tel:${phone.replace(/-/g, '')}`
