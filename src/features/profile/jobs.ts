import type { Job } from '../../api/types'

export const JOB_LABELS: Record<Job, string> = {
  STUDENT: '대학생·대학원생',
  WORKER: '직장인',
  JOB_SEEKER: '구직 중',
  OTHER: '그 외',
}
