import { Character } from '../components/character/Character'
import { EmptyState, Page } from '../components/layout/Page'
import { ButtonLink } from '../components/ui/Button'

export function NotFoundPage() {
  return (
    <Page>
      <EmptyState illustration={<Character stage={1} size={110} />} title="길을 잃었어요">
        <p>찾는 화면이 없어요.</p>
        <ButtonLink to="/">처음으로</ButtonLink>
      </EmptyState>
    </Page>
  )
}
