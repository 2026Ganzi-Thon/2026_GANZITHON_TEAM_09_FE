import { Link } from 'react-router-dom'
import { Character } from '../../components/character/Character'
import { EmptyState, Page, PageHeader, SectionLabel } from '../../components/layout/Page'
import { ButtonLink } from '../../components/ui/Button'
import { LoadError, Loading } from '../../components/ui/Loading'
import { useDevice } from '../../device/store'
import { characterNicknameOf } from '../../features/character/nickname'
import { daysBetween } from '../../features/date'
import { useAllCharacters } from '../../features/character/useCharacters'
import { displayStage, progressLabel, stageNameOf, variantOf } from '../../features/selectors'
import { formatDot } from './format'
import styles from './collection.module.css'
import { useGroupName } from '../../features/group/groupName'

/** S32 캐릭터 도감 (내 모든 그룹). 내 기록·마이에서 들어온다. 캐릭터를 누르면 성장 과정 */
export function CollectionPage() {
  const groupName = useGroupName()
  const chars = useAllCharacters()
  const device = useDevice()

  return (
    <Page withTabBar gap={14}>
      <PageHeader title="캐릭터 도감" back backFallback="/records" />
      {chars.isPending ? (
        <Loading />
      ) : chars.isError ? (
        <LoadError error={chars.error} onRetry={() => chars.refetch()} />
      ) : chars.growing.length === 0 && chars.done.length === 0 ? (
        <EmptyState illustration={<Character stage={1} size={110} />} title="아직 키운 캐릭터가 없어요">
          <p>그룹에서 함께 미션하면 캐릭터가 자라요.</p>
          <ButtonLink to="/groups/new">그룹 만들기·참여</ButtonLink>
        </EmptyState>
      ) : (
        <>
          <p className={styles.summary}>
            다 키운 캐릭터 {chars.done.length} · 키우는 중 {chars.growing.length}
          </p>

          <SectionLabel>키우는 중</SectionLabel>
          <ul className={styles.grid}>
            {chars.growing.map((c) => (
              <li key={c.group.groupId}>
                <Link to={`/collection/${c.group.groupId}/${c.characterId ?? 'current'}`} className={styles.card}>
                  <Character stage={displayStage(c)} variant={variantOf(c.kind)} size={72} title={`${groupName(c.group)}의 ${stageNameOf(c)}`} />
                  <span className={styles.name}>{characterNicknameOf(device, c.group.groupId, c.characterId) ?? groupName(c.group)}</span>
                  <span className={styles.sub}>{progressLabel(c)}</span>
                </Link>
              </li>
            ))}
          </ul>

          {chars.done.length ? (
            <>
              <SectionLabel>다 키운 캐릭터</SectionLabel>
              <ul className={styles.grid}>
                {chars.done.map((c) => (
                  <li key={c.characterId}>
                    <Link to={`/collection/${c.group.groupId}/${c.characterId}`} className={styles.card}>
                      <Character stage={5} variant={variantOf(c.kind)} size={72} title={`${groupName(c.group)}에서 다 키운 네잎클로버`} />
                      <span className={styles.name}>{characterNicknameOf(device, c.group.groupId, c.characterId) ?? groupName(c.group)}</span>
                      <span className={styles.sub}>
                        {formatDot(c.completedOn)} · {daysBetween(c.startedOn, c.completedOn) + 1}일
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </>
      )}
    </Page>
  )
}
