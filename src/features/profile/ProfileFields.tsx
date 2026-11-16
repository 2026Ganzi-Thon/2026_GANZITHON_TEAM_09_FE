import { JOBS } from '../../api/types'
import { ChoiceGroup, SelectField, TextField } from '../../components/ui/Form'
import { SEOUL, SEOUL_GU, SIDO } from '../../data/regions'
import type { DeviceProfile } from '../../device/profile'
import { JOB_LABELS } from './jobs'

/** S05·S42 선택 정보 3가지 (모두 선택, 이 기기에만 저장) */
export function ProfileFields({ value, onChange, maxDate }: { value: DeviceProfile; onChange: (v: DeviceProfile) => void; maxDate: string }) {
  return (
    <>
      <TextField
        label="생년월일"
        optional
        type="date"
        value={value.birthDate ?? ''}
        max={maxDate}
        min="1900-01-01"
        onChange={(e) => onChange({ ...value, birthDate: e.target.value || undefined })}
        hint="나이에 맞는 지원을 찾는 데만 써요"
      />
      <SelectField
        label="사는 곳 (시·도)"
        optional
        options={SIDO}
        value={value.sido ?? ''}
        onChange={(e) => onChange({ ...value, sido: e.target.value || undefined, sigungu: undefined })}
      />
      {value.sido === SEOUL ? (
        <SelectField
          label="시·군·구"
          optional
          options={SEOUL_GU}
          value={value.sigungu ?? ''}
          onChange={(e) => onChange({ ...value, sigungu: e.target.value || undefined })}
          hint="내 구의 정신건강복지센터를 보여 드려요"
        />
      ) : value.sido ? (
        <TextField
          label="시·군·구"
          optional
          value={value.sigungu ?? ''}
          maxLength={10}
          placeholder="예: 수원시"
          onChange={(e) => onChange({ ...value, sigungu: e.target.value.trim() || undefined })}
        />
      ) : null}
      <ChoiceGroup
        label="지금 하는 일"
        columns={2}
        value={value.job}
        options={JOBS.map((j) => ({ value: j, label: JOB_LABELS[j] }))}
        onChange={(j) => onChange({ ...value, job: value.job === j ? undefined : j })}
      />
    </>
  )
}
