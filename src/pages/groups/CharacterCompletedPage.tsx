import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Character } from '../../components/character/Character'
import { Page } from '../../components/layout/Page'
import { Button } from '../../components/ui/Button'
import { updateDevice, useDevice } from '../../device/store'
import { completionKey, markCompletionSeen } from '../../features/character/completions'
import { useGroupName } from '../../features/group/groupName'
import { variantOf } from '../../features/selectors'
import styles from './completed.module.css'

const formatKoreanDate = (day: string) => {
  const [y, m, d] = day.split('-').map(Number)
  return `${y}년 ${m}월 ${d}일`
}

/**
 * S26 캐릭터 완성 (Figma 25). 00:00 확정 처리에서 100이 된 캐릭터를 그룹을 처음 볼 때 한 번 보여준다.
 * 100을 넘은 만큼은 버리고, 다음 캐릭터는 0에서 무작위로 시작한다(CHR-07).
 */
export function CharacterCompletedPage() {
  const groupId = Number(useParams().groupId)
  const navigate = useNavigate()
  const device = useDevice()
  const groupName = useGroupName()
  const done = device.pendingCompletions[groupId]
  if (!done) return <Navigate to={`/groups/${groupId}`} replace />
  const name = done.groupType ? groupName({ type: done.groupType, name: done.groupName }) : done.groupName

  const seen = (to: string) => {
    updateDevice((d) => {
      const rest = { ...d.pendingCompletions }
      delete rest[groupId]
      // 본 완성은 기억해 둔다: 실서버는 그날 하루 동안 justCompleted를 계속 준다
      return { pendingCompletions: rest, seenCompletions: markCompletionSeen(d.seenCompletions, completionKey(groupId, done.completedOn)) }
    })
    navigate(to, { replace: true })
  }

  return (
    <Page withTabBar gap={14} className={styles.page}>
      <p className={styles.meta}>
        {name} · {formatKoreanDate(done.completedOn)}
      </p>
      <h1 className={styles.title}>다 자랐어요!</h1>
      <section className={styles.card}>
        <Character stage={5} variant={variantOf(done.kind)} size={140} mood="happy" bounce title={`${name}의 네잎클로버`} />
        <p className={styles.name}>{name}의 네잎클로버</p>
        <p className={styles.sub}>100 / 100 · {done.memberCount}명이 함께 키웠어요</p>
      </section>
      <p className={styles.note}>그룹 도감에 담았어요. 캐릭터는 그룹에 남아요.</p>
      <section className={styles.next}>
        <Character stage={1} size={48} />
        <div>
          <p className={styles.nextTitle}>다음 캐릭터가 찾아왔어요</p>
          <p className={styles.nextSub}>오늘부터 다시 0에서 함께 키워요</p>
        </div>
      </section>
      <Button onClick={() => seen(`/groups/${groupId}`)}>그룹으로 가기</Button>
      <Button variant="ghost" onClick={() => seen(`/groups/${groupId}/collection`)}>
        도감 보기
      </Button>
    </Page>
  )
}
