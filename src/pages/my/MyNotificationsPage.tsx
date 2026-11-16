import { useState } from 'react'
import { errorMessage } from '../../api/errors'
import { useNotificationSettings, usePutNotificationSettings } from '../../api/queries'
import type { NotificationSettings } from '../../api/types'
import { Card, Notice, Page, PageHeader } from '../../components/layout/Page'
import { Button } from '../../components/ui/Button'
import { SelectField, Toggle } from '../../components/ui/Form'
import { LoadError, Loading } from '../../components/ui/Loading'
import { useToast } from '../../components/ui/Toast'
import { notificationPermission, requestNotificationPermission } from '../../services/notifications'

/** 30분 단위 시각 (NOTI-02) */
const TIMES = Array.from({ length: 48 }, (_, i) => `${String(Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`)
const timeLabel = (t: string) => {
  const [h, m] = t.split(':').map(Number)
  return `${h < 12 ? '오전' : '오후'} ${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, '0')}`
}

/** S51 알림 설정 */
export function MyNotificationsPage() {
  const toast = useToast()
  const settings = useNotificationSettings()
  const put = usePutNotificationSettings()
  const [permission, setPermission] = useState(notificationPermission())

  const save = (next: NotificationSettings) => put.mutate(next, { onError: (e) => toast(errorMessage(e)) })

  return (
    <Page withTabBar gap={14}>
      <PageHeader title="알림" back="/my" />
      {permission !== 'granted' ? (
        <Card soft>
          <p style={{ fontSize: 13 }}>
            {permission === 'unsupported'
              ? '이 브라우저에서는 알림을 받을 수 없어요. 아이폰은 홈 화면에 추가한 앱에서만 알림이 와요.'
              : permission === 'denied'
                ? '브라우저 설정에서 알림이 꺼져 있어요. 설정에서 허용해 주세요.'
                : '기기 알림 권한이 필요해요.'}
          </p>
          {permission === 'default' ? (
            <Button size="md" onClick={async () => setPermission(await requestNotificationPermission())}>
              알림 권한 허용하기
            </Button>
          ) : null}
        </Card>
      ) : null}
      {settings.isPending ? (
        <Loading />
      ) : settings.isError ? (
        <LoadError error={settings.error} onRetry={() => settings.refetch()} />
      ) : (
        <Card>
          <Toggle
            label="미션 알림"
            sub="아직 미션을 안 한 날만, 하루 한 번"
            checked={settings.data.missionReminderTime !== null}
            onChange={(on) => save({ ...settings.data, missionReminderTime: on ? '12:30' : null })}
          />
          {settings.data.missionReminderTime !== null ? (
            <SelectField
              label="알림 시각"
              value={settings.data.missionReminderTime}
              options={TIMES.map((t) => ({ value: t, label: timeLabel(t) }))}
              onChange={(e) => save({ ...settings.data, missionReminderTime: e.target.value || '12:30' })}
            />
          ) : null}
          <Toggle
            label="일요일 마음 점검 알림"
            sub="일요일 저녁 6시"
            checked={settings.data.weeklyCheckReminder}
            onChange={(on) => save({ ...settings.data, weeklyCheckReminder: on })}
          />
        </Card>
      )}
      <Notice>잠금 화면에 보일 수 있어서 기분·점검 내용은 알림에 넣지 않아요. 예: "오늘의 미션이 기다리고 있어요"</Notice>
    </Page>
  )
}
