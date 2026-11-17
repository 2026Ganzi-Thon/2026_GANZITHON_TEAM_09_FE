/**
 * 저장 잠금: 데이터를 통째로 바꾸는 동안(시연 종료 복구 등) 화면에서 진행 중이던 요청·상태 변경이
 * 방금 복구한 값을 다시 덮어쓰지 못하게 막는다. 잠근 뒤에는 페이지를 다시 연다.
 */
let frozen = false

export function freezePersistence() {
  frozen = true
}

export function isPersistenceFrozen() {
  return frozen
}
