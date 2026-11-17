import { describe, expect, it } from 'vitest'
import { groupDisplayName } from './groupName'

describe('그룹 표시 이름', () => {
  it('1인 그룹은 저장된 이름 대신 닉네임을 보인다', () => {
    expect(groupDisplayName({ type: 'SOLO', name: '나 혼자' }, '소은')).toBe('소은')
  })

  it('1인 그룹인데 닉네임이 없으면 저장된 그룹 이름(기본 이름)을 보인다', () => {
    expect(groupDisplayName({ type: 'SOLO', name: '나 혼자' }, undefined)).toBe('나 혼자')
    expect(groupDisplayName({ type: 'SOLO', name: '나 혼자' }, '  ')).toBe('나 혼자')
  })

  it('친구·온라인 그룹은 저장된 그룹 이름 그대로', () => {
    expect(groupDisplayName({ type: 'FRIEND', name: '우리 셋' }, '소은')).toBe('우리 셋')
    expect(groupDisplayName({ type: 'ONLINE', name: '아침 산책단' }, '소은')).toBe('아침 산책단')
  })
})
