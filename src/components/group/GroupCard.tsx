import { Link } from 'react-router-dom'
import type { GroupSummary } from '../../api/types'
import { displayStage, groupMetaLabel, progressLabel, stageNameOf, variantOf } from '../../features/selectors'
import { Character } from '../character/Character'
import { StageBar } from '../character/StageProgress'
import styles from './GroupCard.module.css'

/** Figma GroupCard (화면 2): 캐릭터 + 이름 + 메타 + "오늘 N명 중 M명 완료" + 진행 막대 + "52.7 / 100 · 3단계" */
export function GroupCard({ group }: { group: GroupSummary }) {
  const { character, today } = group
  return (
    <Link to={`/groups/${group.groupId}`} className={styles.card}>
      <span className={styles.thumb}>
        <Character stage={displayStage(character)} variant={variantOf(character.kind)} size={68} title={`${group.name}의 ${stageNameOf(character)}`} />
      </span>
      <span className={styles.body}>
        <span className={styles.name}>
          {group.name}
          {group.isDemo ? <span className={styles.demo}>시연 데이터</span> : null}
        </span>
        <span className={styles.meta}>{groupMetaLabel(group)}</span>
        <span className={styles.today}>
          그룹 오늘 {today.total}명 중 {today.completed}명 완료
        </span>
        <StageBar growth={character.progress} label={`${group.name} 캐릭터 성장`} />
        <span className={styles.count}>{progressLabel(character)}</span>
      </span>
    </Link>
  )
}
