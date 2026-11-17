import { useNavigate } from 'react-router-dom'
import type { HelpItem } from '../../api/types'
import { HelpCard } from '../../components/ui/HelpCard'
import { telHref } from './helpFilter'

/**
 * 도움받을 곳 카드. 24시간 채널은 누르면 바로 전화를 건다 (UserFlow 7 · 한 번의 탭으로 연결).
 * 그 밖의 카드는 S41 상세(/help/:serviceId)로.
 */
export function HelpServiceCard({ service, tone }: { service: HelpItem; tone?: 'default' | 'strong' }) {
  const navigate = useNavigate()
  const crisis = service.section === 'CRISIS_24H'
  const strong = tone ?? (crisis ? 'strong' : 'default')
  if (crisis && service.phone) {
    const phone = service.phone
    return (
      <HelpCard
        title={service.name}
        sub={service.summary ?? undefined}
        tone={strong}
        onClick={() => {
          window.location.href = telHref(phone)
        }}
        trailing={
          <span aria-label={`${phone}로 전화`} style={{ fontSize: 18 }}>
            📞
          </span>
        }
      />
    )
  }
  return <HelpCard title={service.name} sub={service.summary ?? undefined} tone={strong} onClick={() => navigate(`/help/${service.id}`)} />
}
