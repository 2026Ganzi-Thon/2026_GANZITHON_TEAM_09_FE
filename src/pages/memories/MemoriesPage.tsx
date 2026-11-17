import { Link } from 'react-router-dom'
import { Character } from '../../components/character/Character'
import { EmptyState, Page, PageHeader } from '../../components/layout/Page'
import { useMemories } from '../../device/memories'
import { memoryDateLabel } from '../../features/memory/format'
import { useMissionTexts } from '../../features/memory/useMissionTexts'
import styles from './memories.module.css'

/**
 * 마이 › 추억 기록 (/my/memories): 사진이나 메모를 남긴 날만 날짜순으로.
 * 미션만 하고 기록을 남기지 않은 날은 내 기록 › 참여한 미션에 있으므로 여기서는 뺀다.
 */
export function MemoriesPage() {
  const memories = useMemories()
  const textOf = useMissionTexts(memories)

  return (
    <Page withTabBar gap={12}>
      <PageHeader title="추억 기록" back="/my" />
      <p className={styles.note}>미션을 한 날 남긴 사진과 한 줄 메모예요.</p>
      {memories.length === 0 ? (
        <EmptyState illustration={<Character stage={2} size={96} />} title="아직 남긴 기록이 없어요">
          <p>미션을 마친 화면에서 사진이나 한 줄 메모를 남기면 여기에 날짜별로 모여요.</p>
        </EmptyState>
      ) : (
        <ul className={styles.list}>
          {memories.map((m) => (
            <li key={m.date}>
              <Link to={`/my/memories/${m.date}`} className={styles.item}>
                {m.photo ? (
                  <img src={m.photo} alt="" className={styles.thumb} />
                ) : (
                  <span className={`${styles.thumb} ${styles.thumbMemo}`} aria-hidden>
                    메모
                  </span>
                )}
                <span className={styles.itemText}>
                  <span className={styles.itemDate}>{memoryDateLabel(m.date)}</span>
                  <span className={styles.itemMission}>{textOf(m) ?? '오늘의 내 미션'}</span>
                  {m.memo ? <span className={styles.itemMemo}>{m.memo}</span> : null}
                </span>
                <span className={styles.chevron} aria-hidden>
                  ›
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Page>
  )
}
