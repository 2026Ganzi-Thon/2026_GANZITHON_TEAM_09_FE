import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { errorMessage } from '../../api/errors'
import { useMe, useMissionToday, useMoods, useStartMission } from '../../api/queries'
import { MISSION_MINUTES, type MissionMinutes, type Place } from '../../api/types'
import { Button } from '../../components/ui/Button'
import { ChoiceGroup } from '../../components/ui/Form'
import { LoadError, Loading } from '../../components/ui/Loading'
import { useToast } from '../../components/ui/Toast'
import { sizeUnit } from '../../data/missions'
import { moodById } from '../../data/moods'
import { updateDevice, useDevice } from '../../device/store'
import { isMoodPromptDue } from '../selectors'
import { isSizeLowered } from './missionRules'
import { missionText } from './missionText'
import styles from './MissionPanel.module.css'

/**
 * S21 미션 준비 (Figma 4): 오늘의 내 미션(개인, 하루 1개, 내 모든 그룹에 반영).
 * 밖/안과 쓸 시간을 고르면 기분을 반영한 크기를 보여준다(MIS-04·05). 어느 크기든 1회.
 */
export function MissionPanel({ fromGroupId }: { fromGroupId?: number }) {
  const navigate = useNavigate()
  const toast = useToast()
  const me = useMe()
  const device = useDevice()
  const moodDue = isMoodPromptDue(me.data, device.moodPromptDay, device.onboarded)
  const mission = useMissionToday(!moodDue)
  const today = me.data?.today ?? ''
  const moods = useMoods(today, today, !!me.data?.sensitiveConsent)
  const start = useStartMission()
  const [place, setPlace] = useState<Place | undefined>()
  const [minutes, setMinutes] = useState<MissionMinutes | undefined>()

  if (moodDue) return null
  if (mission.isPending) return <Loading />
  if (mission.isError) return <LoadError error={mission.error} onRetry={() => mission.refetch()} />
  const m = mission.data

  if (m.status === 'COMPLETED') {
    return (
      <div className={styles.topic}>
        <span className={styles.eyebrow}>오늘의 내 미션 · 완료</span>
        <p className={styles.title}>{missionText(m, m.place ?? m.defaults.place)}</p>
        <p className={styles.desc}>오늘은 이 정도면 충분해요. 내일 또 만나요.</p>
      </div>
    )
  }

  const started = m.status === 'STARTED'
  const curPlace = place ?? m.place ?? m.defaults.place
  const curMinutes = minutes ?? m.minutes ?? m.defaults.minutes
  const size = m.sizeByMinutes[String(curMinutes) as '5' | '10' | '20']
  const unit = sizeUnit(m.topic)
  const mood = moods.data?.moods[0]?.mood
  const reason =
    mood && isSizeLowered(mood, curMinutes)
      ? `오늘 기분 '${moodById(mood).label}'라 한 단계 작게 추천했어요 · 바꿀 수 있어요`
      : m.topic.sizeType === 'COUNT'
        ? `${curMinutes}분이면 ${size}${unit}이 알맞아요 · 어느 크기든 똑같이 1회예요`
        : '어느 크기든 똑같이 1회예요 · 바꿀 수 있어요'

  const begin = async (choice: { minutes: MissionMinutes; place: Place }) => {
    const sz = m.sizeByMinutes[String(choice.minutes) as '5' | '10' | '20']
    try {
      if (!started) await start.mutateAsync({ ...choice, size: sz })
      if (!started || !device.missionChoice) {
        updateDevice({ missionChoice: { day: m.date, ...choice, size: sz, startedAtLocal: Date.now() }, missionFromGroupId: fromGroupId })
      }
      navigate('/mission/timer')
    } catch (e) {
      toast(errorMessage(e, '미션을 시작하지 못했어요'))
    }
  }

  return (
    <>
      <div className={styles.topic}>
        <span className={styles.eyebrow}>오늘의 내 미션 · 내 모든 그룹에 반영</span>
        <p className={styles.title}>{missionText(m, curPlace)}</p>
        <p className={styles.desc}>
          {curPlace === 'OUTDOOR' ? `안에서 하면: ${m.topic.indoorText}` : `밖에서 하면: ${m.topic.outdoorText}`}
        </p>
      </div>
      {!started ? (
        <>
          <ChoiceGroup
            label="어디서 할까요"
            hideLabel
            value={curPlace}
            options={[
              { value: 'OUTDOOR' as Place, label: '밖에서' },
              { value: 'INDOOR' as Place, label: '안에서' },
            ]}
            onChange={setPlace}
          />
          <ChoiceGroup
            label="내 크기"
            value={curMinutes}
            options={MISSION_MINUTES.map((x) => ({ value: x, label: `${x}분` }))}
            onChange={setMinutes}
          />
          <p className={styles.reason}>{reason}</p>
        </>
      ) : null}
      <Button loading={start.isPending} onClick={() => begin({ minutes: curMinutes, place: curPlace })}>
        {started ? '진행 중인 미션 이어하기' : '시작하기'}
      </Button>
      {!started ? (
        <Button variant="ghost" onClick={() => begin(m.defaults)}>
          그냥 하나 골라줘
        </Button>
      ) : null}
    </>
  )
}
