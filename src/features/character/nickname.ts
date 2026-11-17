import { updateDevice, type DeviceState } from '../../device/store'

/**
 * 캐릭터 개인 별명 (#17). 나만 보는 화면(도감·성장 과정·내 기록·마이)에서만 쓰고, 서버로 보내지 않는다.
 * 캐릭터는 그룹이 함께 키우는 것이라 그룹 화면에는 그룹 이름 그대로 보인다(그룹 안 자유 텍스트 금지 원칙).
 *
 * 키는 그룹+캐릭터 ID. 캐릭터 ID가 없으면(실서버 GET /groups 목록에는 아직 없음) 다음 캐릭터로
 * 별명이 잘못 넘어갈 수 있어 붙이지 않는다.
 */
export const CHARACTER_NICKNAME_MAX = 10

export function characterKey(groupId: number, characterId: number | undefined) {
  return characterId === undefined ? null : `${groupId}:${characterId}`
}

export function characterNicknameOf(device: Pick<DeviceState, 'characterNicknames'>, groupId: number, characterId: number | undefined) {
  const key = characterKey(groupId, characterId)
  return key ? device.characterNicknames?.[key] : undefined
}

export function setCharacterNickname(groupId: number, characterId: number, nickname: string) {
  const key = `${groupId}:${characterId}`
  const value = nickname.trim().slice(0, CHARACTER_NICKNAME_MAX)
  updateDevice((d) => {
    const next = { ...(d.characterNicknames ?? {}) }
    if (value) next[key] = value
    else delete next[key]
    return { characterNicknames: next }
  })
}
