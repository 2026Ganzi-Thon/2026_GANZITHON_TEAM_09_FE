import { Link, Navigate, useParams } from 'react-router-dom'
import { ApiError } from '../../api/errors'
import { useCollection, useGroup } from '../../api/queries'
import { Character } from '../../components/character/Character'
import { Card, Page, PageHeader } from '../../components/layout/Page'
import { LoadError, Loading } from '../../components/ui/Loading'
import { daysBetween } from '../../features/date'
import { displayStage, progressLabel, variantOf } from '../../features/selectors'
import { formatDot, formatShortDot } from '../collection/format'
import styles from '../collection/collection.module.css'

/** S27 그룹 도감 (Figma 26). 구성원이 들어오거나 나가도 도감은 그룹에 남는다(CHR-09) */
export function GroupCollectionPage() {
  const groupId = Number(useParams().groupId)
  const group = useGroup(groupId)
  const collection = useCollection(groupId)

  if (group.isPending || collection.isPending) return <Loading />
  if (group.isError) {
    if (group.error instanceof ApiError && group.error.code === 'NOT_FOUND') return <Navigate to="/groups" replace />
    return <LoadError error={group.error} onRetry={() => group.refetch()} />
  }
  const g = group.data
  const done = [...(collection.data?.characters ?? [])].sort((a, b) => a.startedOn.localeCompare(b.startedOn))
  const first = done[0]

  return (
    <Page withTabBar gap={14}>
      <PageHeader title={`${g.name} 도감`} back backFallback={`/groups/${g.groupId}`} />
      <p className={styles.summary}>
        다 키운 캐릭터 {done.length} · 키우는 중 1
      </p>
      <ul className={styles.grid2}>
        {done.map((c) => (
          <li key={c.characterId}>
            <Link to={`/collection/${g.groupId}/${c.characterId}`} className={styles.card}>
              <Character stage={5} variant={variantOf(c.kind)} size={84} title={`${g.name}에서 다 키운 네잎클로버`} />
              <span className={styles.name}>네잎클로버</span>
              <span className={styles.sub}>
                {formatDot(c.startedOn)} ~ {formatShortDot(c.completedOn)}
              </span>
            </Link>
          </li>
        ))}
        <li>
          <Link to={`/collection/${g.groupId}/${g.character.characterId ?? 'current'}`} className={`${styles.card} ${styles.cardGrowing}`}>
            <Character stage={displayStage(g.character)} variant={variantOf(g.character.kind)} size={84} title={`${g.name}에서 키우는 중`} />
            <span className={styles.name}>키우는 중</span>
            <span className={styles.sub}>{progressLabel(g.character)}</span>
          </Link>
        </li>
      </ul>
      <Card>
        <h2 className={styles.cardTitle}>함께한 기록</h2>
        <p className={styles.record}>
          {first ? `첫 네잎클로버는 ${daysBetween(first.startedOn, first.completedOn) + 1}일 걸렸어요. ` : '아직 다 키운 캐릭터가 없어요. '}
          매일 모두 하면 50일이면 다 자라요.
        </p>
      </Card>
    </Page>
  )
}
