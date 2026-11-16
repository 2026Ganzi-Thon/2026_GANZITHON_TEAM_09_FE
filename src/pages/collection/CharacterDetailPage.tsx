import { Navigate, useParams } from 'react-router-dom'
import { Character } from '../../components/character/Character'
import { StageGallery } from '../../components/character/StageGallery'
import { StageBar } from '../../components/character/StageProgress'
import { Card, Page, PageHeader } from '../../components/layout/Page'
import { ButtonLink } from '../../components/ui/Button'
import { LoadError, Loading } from '../../components/ui/Loading'
import { stageProgress } from '../../features/character/growth'
import { useAllCharacters } from '../../features/character/useCharacters'
import { daysBetween } from '../../features/date'
import { displayStage, progressLabel, stageNameOf, variantOf } from '../../features/selectors'
import { formatDot } from './format'
import styles from './collection.module.css'

/** 매일 모두 하면 다 자라는 날 수 (하루 2 × 50일 = 100) */
const FULL_DAYS = 50

/**
 * 캐릭터 성장 과정 (/collection/:groupId/:characterId).
 * 지금 API로 보여줄 수 있는 것: 4단계 그림, 지금 단계·수치, 다 키운 기간과 걸린 날.
 * [백엔드 연동] 단계별 도달일·날짜별 그래프는 성장 기록 API가 생기면 이 화면에 더한다.
 */
export function CharacterDetailPage() {
  const { groupId, characterId } = useParams()
  const chars = useAllCharacters()

  if (chars.isPending) return <Loading />
  if (chars.isError) return <LoadError error={chars.error} onRetry={() => chars.refetch()} />

  const gid = Number(groupId)
  const growing = chars.growing.find(
    (c) => c.group.groupId === gid && (characterId === 'current' || String(c.characterId) === characterId),
  )
  const done = chars.done.find((c) => c.group.groupId === gid && String(c.characterId) === characterId)
  if (!growing && !done) return <Navigate to="/collection" replace />

  const group = (growing ?? done)!.group
  const kind = (growing ?? done)!.kind
  const variant = variantOf(kind)

  return (
    <Page withTabBar gap={14}>
      <PageHeader title={`${group.name} 캐릭터`} back backFallback="/collection" />

      <section className={styles.hero}>
        {growing ? (
          <>
            <Character stage={displayStage(growing)} variant={variant} size={130} mood="happy" title={`${group.name}의 ${stageNameOf(growing)}`} />
            <p className={styles.heroName}>
              {group.name}의 {stageNameOf(growing)}
            </p>
            <div className={styles.heroBar}>
              <StageBar growth={growing.progress} height={10} track="white" label="캐릭터 성장" />
            </div>
            <p className={styles.heroMeta}>
              {progressLabel(growing)} · {stageProgress(growing.progress).nextName}까지 {stageProgress(growing.progress).remainingPercent}% 남았어요
            </p>
          </>
        ) : done ? (
          <>
            <Character stage={5} variant={variant} size={130} mood="happy" title={`${group.name}의 네잎클로버`} />
            <p className={styles.heroName}>{group.name}의 네잎클로버 · 다 자랐어요</p>
            <p className={styles.heroMeta}>100 / 100 · 그룹 도감에 담겨 있어요</p>
          </>
        ) : null}
      </section>

      <Card>
        <h2 className={styles.cardTitle}>성장 과정</h2>
        <StageGallery stage={growing ? displayStage(growing) : 5} variant={variant} />
        <p className={styles.note}>성장 수치 25마다 한 단계씩 자라고, 100이 되면 다 자라요. 캐릭터는 줄어들지 않아요.</p>
      </Card>

      <Card>
        <h2 className={styles.cardTitle}>함께한 기록</h2>
        {done ? (
          <p className={styles.record}>
            {formatDot(done.startedOn)} ~ {formatDot(done.completedOn)}
            <br />
            <b>{daysBetween(done.startedOn, done.completedOn) + 1}일</b> 걸렸어요. 매일 모두 하면 {FULL_DAYS}일이면 다 자라요.
          </p>
        ) : growing ? (
          <p className={styles.record}>
            지금 <b>{group.name}</b>에서 키우고 있어요. 오늘 {group.today.total}명 중 {group.today.completed}명이 미션을 했어요.
            <br />
            매일 모두 하면 {FULL_DAYS}일이면 다 자라요.
          </p>
        ) : null}
      </Card>

      <ButtonLink to={`/groups/${group.groupId}`} variant="secondary">
        그룹으로 가기
      </ButtonLink>
    </Page>
  )
}
