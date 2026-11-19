import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCheckCurrent, useGroups, useMe, useMoods, useRecords } from '../../api/queries'
import { Character } from '../../components/character/Character'
import { Card, EmptyState, Page, PageHeader } from '../../components/layout/Page'
import { HelpCard } from '../../components/ui/HelpCard'
import { LoadError, Loading } from '../../components/ui/Loading'
import { recordSizeUnit } from '../../data/missions'
import { moodById } from '../../data/moods'
import { useMemories } from '../../device/memories'
import { useDevice } from '../../device/store'
import { characterNicknameOf } from '../../features/character/nickname'
import { CheckinSheet } from '../../features/checkin/CheckinSheet'
import { nextCheckDay } from '../../features/checkin/checkinRules'
import { addDays, formatMonthDay, weekLabel, weekStartOf } from '../../features/date'
import { displayStage, stageNameOf, variantOf } from '../../features/selectors'
import styles from './records.module.css'
import { useGroupName } from '../../features/group/groupName'

const WEEK_LABELS = ['월', '화', '수', '목', '금', '토', '일']

/** S30~S32 내 기록 (Figma 10): 기분 흐름, 참여한 미션, 캐릭터 도감. 빠진 날은 아무 표시도 하지 않는다. */
export function RecordsPage() {
  const groupName = useGroupName()
  const me = useMe()
  const device = useDevice()
  const day = me.data?.today ?? ''
  const consent = !!me.data?.sensitiveConsent
  const [weekOffset, setWeekOffset] = useState(0)
  const [checkinOpen, setCheckinOpen] = useState(false)

  const thisWeekStart = day ? weekStartOf(day) : ''
  const weekStart = day ? addDays(thisWeekStart, weekOffset * 7) : ''
  const weekDays = WEEK_LABELS.map((_, i) => (weekStart ? addDays(weekStart, i) : ''))
  const month = day.slice(0, 7)
  const moods = useMoods(weekStart, weekDays[6], consent && !!weekStart)
  const records = useRecords(month)
  const groups = useGroups()
  const check = useCheckCurrent(consent)
  const memories = useMemories()

  const moodOf = (d: string) => moods.data?.moods.find((x) => x.date === d)?.mood
  const missions = records.data?.missions ?? []
  const memoryDays = new Set(memories.map((m) => m.date))
  // '내가 남긴 핑': 서버가 pings를 주면 그 값, 아직 없으면(실서버 핑 기능 전) 이 기기에서 보낸 날을 센다 (백엔드 회신(2) 1절 #1)
  const serverPings = records.data?.pings
  const monthPings = serverPings ? serverPings.length : device.pingDays.filter((d) => d.startsWith(month)).length
  // 내 기록에는 키우는 중인 캐릭터만 (다 키운 캐릭터는 도감 전체 보기에서, #18)
  const growing = groups.data?.groups ?? []
  const canCheckNow = consent && !!check.data?.due
  const nextDay = day ? nextCheckDay(check.data?.done || check.data?.dismissed ? addDays(day, 1) : day) : ''

  return (
    <Page withTabBar gap={12}>
      <PageHeader title="내 기록" />

      <Card>
        <div className={styles.cardHead}>
          <h2>{weekStart ? `${weekLabel(weekStart, thisWeekStart)} 기분` : '이번 주 기분'}</h2>
          <span>나만 봐요</span>
        </div>
        {consent ? (
          <>
            <div className={styles.week}>
              {weekDays.map((d, i) => {
                const mood = moodOf(d)
                const info = mood ? moodById(mood) : null
                return (
                  <div key={d} className={styles.day}>
                    <span
                      className={styles.moodDot}
                      style={info ? { background: info.color } : undefined}
                      role="img"
                      aria-label={`${WEEK_LABELS[i]}요일 ${info ? info.label : '기록 없음'}`}
                    />
                    <span className={`${styles.dayLabel} ${d === day ? styles.today : ''}`}>{WEEK_LABELS[i]}</span>
                  </div>
                )
              })}
            </div>
            <div className={styles.weekNav}>
              <button type="button" onClick={() => setWeekOffset(weekOffset - 1)}>
                ‹ 지난주
              </button>
              {weekOffset < 0 ? (
                <button type="button" onClick={() => setWeekOffset(weekOffset + 1)}>
                  다음 주 ›
                </button>
              ) : null}
            </div>
          </>
        ) : (
          <p className={styles.muted}>기분 기록에 동의하면 여기에 흐름이 보여요. 마이 › 내 데이터에서 바꿀 수 있어요.</p>
        )}
      </Card>

      {/* 불러오는 중에는 0 대신 자리만 (#추가 오류 2) */}
      <div className={styles.stats}>
        <div className={styles.stat}>
          <strong>{records.isPending ? '–' : `${missions.length}회`}</strong>
          <span>이번 달 내 미션</span>
        </div>
        <div className={styles.stat}>
          <strong>{records.isPending ? '–' : `${monthPings}번`}</strong>
          <span>{serverPings || records.isPending ? '이번 달 내가 남긴 핑' : '이번 달 내가 남긴 핑 · 이 기기 기준'}</span>
        </div>
      </div>

      <Card>
        <div className={styles.cardHead}>
          <h2>키우는 캐릭터</h2>
          <Link to="/collection" className={styles.more}>
            도감 전체 보기 ›
          </Link>
        </div>
        {groups.isPending ? (
          <Loading />
        ) : groups.isError ? (
          <LoadError error={groups.error} onRetry={() => groups.refetch()} />
        ) : growing.length === 0 ? (
          <EmptyState title="아직 키우는 캐릭터가 없어요">
            <p>그룹에서 함께 미션하면 캐릭터가 자라요.</p>
          </EmptyState>
        ) : (
          <div className={styles.dex}>
            {growing.map((g) => {
              const nickname = characterNicknameOf(device, g.groupId, g.character.characterId)
              return (
                <Link key={g.groupId} to={`/collection/${g.groupId}/${g.character.characterId ?? 'current'}`} className={styles.dexItem}>
                  <Character stage={displayStage(g.character)} variant={variantOf(g.character.kind)} size={64} title={`${groupName(g)}에서 키우는 중`} />
                  <span>
                    {nickname ?? groupName(g)}
                    <br />
                    {stageNameOf(g.character)} · {Math.min(displayStage(g.character), 4)}단계
                  </span>
                </Link>
              )
            })}
          </div>
        )}
      </Card>

      <Card>
        <div className={styles.cardHead}>
          <h2>참여한 미션</h2>
          <span>{records.isPending ? '' : `이번 달 ${missions.length}개`}</span>
        </div>
        {records.isPending ? (
          <Loading />
        ) : records.isError ? (
          <LoadError error={records.error} onRetry={() => records.refetch()} />
        ) : missions.length === 0 ? (
          <p className={styles.muted}>하고 싶은 날 미션을 해 보세요. 빠진 날은 표시하지 않아요.</p>
        ) : (
          <ul className={styles.missions}>
            {missions.map((m) => (
              <li key={m.date}>
                <span className={styles.missionName}>
                  {m.text}
                  {/* 시작하지 않고 완료한 날은 크기가 없다 (size null) */}
                  {m.size != null ? ` · ${m.size}${recordSizeUnit(m)}` : null}
                </span>
                {/* 사진은 추억 기록에서 본다 — 여기서는 기록이 있다는 표시만 (#9 중복 노출 줄이기) */}
                {memoryDays.has(m.date) ? (
                  <Link to={`/my/memories/${m.date}`} className={styles.memoryLink}>
                    기록 ›
                  </Link>
                ) : null}
                <span className={styles.muted}>{formatMonthDay(m.date)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {consent ? (
        <HelpCard
          title={canCheckNow ? '오늘은 마음 점검 날이에요' : '다음 마음 점검'}
          sub={
            canCheckNow
              ? '1~2분이면 돼요 · 닫아도 괜찮아요'
              : `${nextDay === day ? '오늘' : formatMonthDay(nextDay)} 일요일 저녁 · 닫아도 괜찮아요`
          }
          onClick={canCheckNow ? () => setCheckinOpen(true) : undefined}
          trailing={canCheckNow ? undefined : <span />}
        />
      ) : null}
      <CheckinSheet open={checkinOpen} onClose={() => setCheckinOpen(false)} />
    </Page>
  )
}
