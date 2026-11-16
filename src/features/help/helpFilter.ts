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
  if (r.sido?.length && p.sido && !r.sido.includes(p.sido)) return false
  if (r.sigungu?.length && p.sigungu && !r.sigungu.includes(p.sigungu)) return false
  if (r.jobs?.length && p.job && !r.jobs.includes(p.job)) return false
  return true
}

/** 구를 알면 그 구 센터 이름으로 (서울 25개 구 센터 데이터가 오기 전까지) */
function localize(item: HelpItem, ctx: HelpContext): HelpItem {
  if (item.id === 'mental-center' && ctx.profile?.sigungu) {
    return { ...item, name: `${ctx.profile.sigungu} 정신건강복지센터` }
  }
  return item
}

/** 기획서 「순서 규칙」: 신호에 맞는 카드를 각 구역 안에서 위로 올린다. 24시간 채널 구역은 항상 맨 위 */
function boosted(item: HelpItem, ctx: HelpContext): boolean {
  const seoul = ctx.profile?.sido ? ctx.profile.sido === SEOUL : true
  const { lonely3Days, checkAboveThreshold } = ctx.signals ?? {}
  if (lonely3Days) {
    if (seoul && (item.id === 'line-120' || item.id === 'mind-store')) return true
    if (!seoul && item.id === 'mental-center') return true
  }
  if (checkAboveThreshold && ['mental-center', 'voucher', 'seoul-youth-mind', 'school-counsel'].includes(item.id)) return true
  if (ctx.profile?.job === 'JOB_SEEKER' && item.id === 'job-mind') return true
  return false
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
