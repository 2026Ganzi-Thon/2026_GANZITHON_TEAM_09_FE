import { JOBS } from '../../api/types'
import { ChoiceGroup, TextField } from '../../components/ui/Form'
import formStyles from '../../components/ui/Form.module.css'
import { SEOUL, SIDO, sigunguOf } from '../../data/regions'
import type { DeviceProfile } from '../../device/profile'
import { JOB_LABELS } from './jobs'

/**
 * S05·S42 선택 정보 3가지 (모두 선택, 이 기기에만 저장). Figma 14 배치:
 * 생년월일 / 사는 곳(시·도 + 구 한 줄) / 지금 하는 일(둥근 칩)
 */
export function ProfileFields({ value, onChange, maxDate }: { value: DeviceProfile; onChange: (v: DeviceProfile) => void; maxDate: string }) {
  const subOptions = sigunguOf(value.sido)
  const legacySigungu = value.sigungu && !subOptions.includes(value.sigungu) ? value.sigungu : undefined
  return (
    <>
      <TextField
        label="생년월일"
        type="date"
        value={value.birthDate ?? ''}
        max={maxDate}
        min="1900-01-01"
        onChange={(e) => onChange({ ...value, birthDate: e.target.value || undefined })}
      />
      <div className={formStyles.field} role="group" aria-label="사는 곳">
        <span className={formStyles.label}>사는 곳</span>
        <div className={formStyles.row2}>
          <select
            aria-label="시·도"
            className={formStyles.input}
            value={value.sido ?? ''}
            onChange={(e) => onChange({ ...value, sido: e.target.value || undefined, sigungu: undefined })}
          >
            <option value="">시·도</option>
            {SIDO.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          {/* 모든 시·도: 시·도 → 시·군·구 선택 (#1). 서울은 지금처럼 '구' */}
          <select
            aria-label={value.sido === SEOUL ? '구' : '시·군·구'}
            className={formStyles.input}
            value={value.sigungu ?? ''}
            disabled={!value.sido || (subOptions.length === 0 && !legacySigungu)}
            onChange={(e) => onChange({ ...value, sigungu: e.target.value || undefined })}
          >
            <option value="">{!value.sido ? '시·군·구' : value.sido === SEOUL ? '구' : subOptions.length ? '시·군·구' : '해당 없음'}</option>
            {/* 예전에 직접 입력한 값이 목록에 없으면 지우지 않고 그대로 보여준다 (바꾸면 사라짐) */}
            {legacySigungu ? <option value={legacySigungu}>{legacySigungu} (입력한 값)</option> : null}
            {subOptions.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
      </div>
      <ChoiceGroup
        label="지금 하는 일"
        chips
        value={value.job}
        options={JOBS.map((j) => ({ value: j, label: JOB_LABELS[j] }))}
        onChange={(j) => onChange({ ...value, job: value.job === j ? undefined : j })}
      />
    </>
  )
}
