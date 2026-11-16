import { useQueries } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api'
import { qk, useCheckCurrent, useGroups, useMe, useMoods, useRecords } from '../../api/queries'
import { Character } from '../../components/character/Character'
import { Card, EmptyState, Page, PageHeader } from '../../components/layout/Page'
import { HelpCard } from '../../components/ui/HelpCard'
import { sizeUnit } from '../../data/missions'
import { moodById } from '../../data/moods'
import { useDevice } from '../../device/store'
import { CheckinSheet } from '../../features/checkin/CheckinSheet'
import { nextCheckDay } from '../../features/checkin/checkinRules'
import { addDays, formatMonthDay, weekStartOf } from '../../features/date'
import { displayStage, stageNameOf, variantOf } from '../../features/selectors'
import styles from './records.module.css'

const WEEK_LABELS = ['월', '화', '수', '목', '금', '토', '일']

/** S30~S32 내 기록 (Figma 10): 기분 흐름, 참여한 미션, 캐릭터 도감. 빠진 날은 아무 표시도 하지 않는다. */
export function RecordsPage() {
  const me = useMe()
  const device = useDevice()
  const day = me.data?.today ?? ''
  const consent = !!me.data?.sensitiveConsent
  const [weekOffset, setWeekOffset] = useState(0)
  const [checkinOpen, setCheckinOpen] = useState(false)

  const weekStart = day ? addDays(weekStartOf(day), weekOffset * 7) : ''
  const weekDays = WEEK_LABELS.map((_, i) => (weekStart ? addDays(weekStart, i) : ''))
  const month = day.slice(0, 7)
  const moods = useMoods(weekStart, weekDays[6], consent && !!weekStart)
  const records = useRecords(month)
  const groups = useGroups()
  const check = useCheckCurrent(consent)
  const collections = useQueries({
    queries: (groups.data?.groups ?? []).map((g) => ({ queryKey: qk.collection(g.groupId), queryFn: () => api.getCollection(g.groupId) })),
  })

  const moodOf = (d: string) => moods.data?.moods.find((x) => x.date === d)?.mood
  const missions = records.data?.missions ?? []
  const monthPings = device.pingDays.filter((d) => d.startsWith(month)).length
  const done = (groups.data?.groups ?? []).flatMap((g, i) =>
    (collections[i]?.data?.characters ?? []).map((c) => ({ ...c, groupName: g.name, groupId: g.groupId })),
  )
  const growing = groups.data?.groups ?? []
  const canCheckNow = consent && !!check.data?.due
  const nextDay = day ? nextCheckDay(check.data?.done || check.data?.dismissed ? addDays(day, 1) : day) : ''

  return (
    <Page withTabBar gap={12}>
      <PageHeader title="내 기록" />

      <Card>
        <div className={styles.cardHead}>
          <h2>{weekOffset === 0 ? '이번 주 기분' : `${formatMonthDay(weekStart)} 주 기분`}</h2>
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
          <p className={styles.muted}>기분 기록에 동의하면 여기에 흐름이 보여요. 마이 › 개인정보에서 바꿀 수 있어요.</p>
        )}
      </Card>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <strong>{missions.length}회</strong>
          <span>이번 달 미션</span>
        </div>
        <div className={styles.stat}>
          <strong>{monthPings}번</strong>
          <span>남긴 핑</span>
        </div>
      </div>

      <Card>
        <div className={styles.cardHead}>
          <h2>캐릭터 도감</h2>
          <Link to="/collection" className={styles.more}>
            다 키운 {done.length}마리 · 전체 보기 ›
          </Link>
        </div>
        <div className={styles.dex}>
          {done.map((c) => (
            <Link key={c.characterId} to={`/collection/${c.groupId}/${c.characterId}`} className={styles.dexItem}>
              <Character stage={5} variant={variantOf(c.kind)} size={64} title={`${c.groupName}에서 다 키운 캐릭터`} />
              <span>
                {c.groupName} · {Number(c.completedOn.slice(5, 7))}월
              </span>
            </Link>
          ))}
          {growing.map((g) => (
            <Link key={g.groupId} to={`/collection/${g.groupId}/${g.character.characterId ?? 'current'}`} className={styles.dexItem}>
              <Character stage={displayStage(g.character)} variant={variantOf(g.character.kind)} size={64} title={`${g.name}에서 키우는 중`} />
              <span>
                키우는 중
                <br />
                {stageNameOf(g.character)} · {Math.min(displayStage(g.character), 4)}단계
              </span>
            </Link>
          ))}
        </div>
        {done.length === 0 && growing.length === 0 ? (
          <EmptyState title="아직 키운 캐릭터가 없어요">
            <p>그룹에서 함께 미션하면 캐릭터가 자라요.</p>
          </EmptyState>
        ) : null}
      </Card>

      <Card>
        <div className={styles.cardHead}>
          <h2>참여한 미션</h2>
          <span>이번 달 {missions.length}개</span>
        </div>
        {missions.length === 0 ? (
          <p className={styles.muted}>하고 싶은 날 미션을 해 보세요. 빠진 날은 표시하지 않아요.</p>
        ) : (
          <ul className={styles.missions}>
            {missions.map((m) => (
              <li key={m.date}>
                {device.missionPhotos[m.date] ? <img src={device.missionPhotos[m.date]} alt="" className={styles.thumb} /> : null}
                <span className={styles.missionName}>
                  {m.text} · {m.size}
                  {sizeUnit({ sizeType: m.sizeType, category: m.category, topicId: 0 })}
                </span>
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
