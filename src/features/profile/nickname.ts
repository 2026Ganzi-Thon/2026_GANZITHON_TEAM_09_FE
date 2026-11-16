/** ACC-04: 닉네임 1~10자, 공백만은 안 된다 */
export function validateNickname(v: string): string | null {
  const t = v.trim()
  if (!t) return '닉네임을 입력해 주세요'
  if (t.length > 10) return '10자 이내로 입력해 주세요'
  return null
}
