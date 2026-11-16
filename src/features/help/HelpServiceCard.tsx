import { useNavigate } from 'react-router-dom'
import type { HelpItem } from '../../api/types'
import { HelpCard } from '../../components/ui/HelpCard'

/** 도움받을 곳 카드. 누르면 S41 상세(/help/:serviceId)로 */
export function HelpServiceCard({ service, tone }: { service: HelpItem; tone?: 'default' | 'strong' }) {
  const navigate = useNavigate()
  const strong = tone ?? (service.section === 'CRISIS_24H' ? 'strong' : 'default')
  return <HelpCard title={service.name} sub={service.summary ?? undefined} tone={strong} onClick={() => navigate(`/help/${service.id}`)} />
}
