/** '2026-10-04' → '2026.10.4' */
export function formatDot(day: string) {
  const [y, m, d] = day.split('-').map(Number)
  return `${y}.${m}.${d}`
}

/** '2026-10-04' → '10.4' */
export function formatShortDot(day: string) {
  const [, m, d] = day.split('-').map(Number)
  return `${m}.${d}`
}
