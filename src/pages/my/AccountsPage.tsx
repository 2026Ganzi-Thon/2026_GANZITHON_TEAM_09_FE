import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Page, PageHeader } from '../../components/layout/Page'
import { BottomSheet } from '../../components/ui/BottomSheet'
import { Button } from '../../components/ui/Button'
import { Checkbox } from '../../components/ui/Form'
import { useToast } from '../../components/ui/Toast'
import { ACCOUNTS_SUPPORTED, deleteSavedAccount, startNewAccount, switchAccount, useAccounts, type AccountEntry } from '../../device/accounts'
import styles from './accounts.module.css'

const formatDay = (ms: number) => {
  const d = new Date(ms)
  return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`
}

type Sheet = null | { kind: 'switch'; account: AccountEntry } | { kind: 'new' } | { kind: 'delete'; account: AccountEntry }

/**
 * 계정 관리 (/accounts, 목업 모드): 이 기기에 저장된 익명 계정 목록 · 전환 · 새 계정 · 보관 계정 삭제.
 * 계정이 없어도(시작 화면에서) 열린다. 전환·새 계정은 지금 계정을 보관한 뒤 페이지를 다시 연다.
 */
export function AccountsPage() {
  const { activeId, accounts } = useAccounts()
  const qc = useQueryClient()
  const toast = useToast()
  const [sheet, setSheet] = useState<Sheet>(null)
  const [busy, setBusy] = useState(false)
  const [agree, setAgree] = useState(false)

  if (!ACCOUNTS_SUPPORTED) return <Navigate to="/my" replace />

  const active = accounts.find((a) => a.id === activeId)
  const others = [...accounts.filter((a) => a.id !== activeId)].sort((a, b) => b.lastUsedAt - a.lastUsedAt)
  const label = (a: AccountEntry) => `${a.nickname}${a.isDemo ? ' (시연)' : ''}`

  // 데이터를 통째로 바꾸므로 끝나면 새로 연다. 실패해도 새로 열면 다음 실행 때 되살림 단계가 정리한다
  const run = async (fn: () => Promise<unknown>, to: string) => {
    setBusy(true)
    try {
      await fn()
      qc.clear()
      window.location.replace(to)
    } catch {
      window.location.reload()
    }
  }

  const close = () => {
    setSheet(null)
    setAgree(false)
  }

  return (
    <Page withTabBar={!!active} gap={14}>
      <PageHeader title="계정 관리" back backFallback={active ? '/my' : '/welcome'} />
      <p className={styles.note}>이 기기에 저장된 익명 계정이에요. 다른 계정으로 바꿔도 각 계정의 기록은 그대로 남아요.</p>

      <section className={styles.card} aria-label="지금 쓰는 계정">
        <h2 className={styles.cardTitle}>지금 쓰는 계정</h2>
        {active ? (
          <div className={styles.row}>
            <span className={styles.name}>
              {label(active)}
              <small>{formatDay(active.createdAt)} 시작</small>
            </span>
            <span className={styles.badge}>사용 중</span>
          </div>
        ) : (
          <p className={styles.empty}>지금 쓰는 계정이 없어요. 아래에서 고르거나 새 계정을 만들어 주세요.</p>
        )}
      </section>

      <section className={styles.card} aria-label="저장된 다른 계정">
        <h2 className={styles.cardTitle}>저장된 다른 계정 {others.length}개</h2>
        {others.length === 0 ? (
          <p className={styles.empty}>아직 없어요.</p>
        ) : (
          <ul className={styles.list}>
            {others.map((a) => (
              <li key={a.id} className={styles.row}>
                <span className={styles.name}>
                  {label(a)}
                  <small>최근 사용 {formatDay(a.lastUsedAt)}</small>
                </span>
                <span className={styles.actions}>
                  <Button size="md" variant="secondary" block={false} onClick={() => setSheet({ kind: 'switch', account: a })}>
                    전환
                  </Button>
                  <button type="button" className={styles.delete} onClick={() => setSheet({ kind: 'delete', account: a })}>
                    삭제
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Button variant="secondary" onClick={() => setSheet({ kind: 'new' })}>
        새 계정 만들기
      </Button>
      {active ? <p className={styles.note}>지금 쓰는 계정을 지우려면 마이페이지 › 내 데이터 › 계정 삭제를 이용해 주세요.</p> : null}

      {/* 전환 확인 */}
      <BottomSheet open={sheet?.kind === 'switch'} onClose={close} label="계정 전환 확인">
        <h2 className={styles.sheetTitle}>'{sheet?.kind === 'switch' ? label(sheet.account) : ''}' 계정으로 바꿀까요?</h2>
        <p className={styles.sheetText}>
          {active ? `지금 계정('${label(active)}')의 기록은 지워지지 않고 이 기기에 보관돼요. 언제든 다시 바꿀 수 있어요.` : '선택한 계정의 기록을 불러와요.'}
        </p>
        <Button loading={busy} onClick={() => sheet?.kind === 'switch' && run(() => switchAccount(sheet.account.id), '/')}>
          전환하기
        </Button>
        <Button variant="ghost" onClick={close}>
          취소
        </Button>
      </BottomSheet>

      {/* 새 계정 확인 */}
      <BottomSheet open={sheet?.kind === 'new'} onClose={close} label="새 계정 만들기 확인">
        <h2 className={styles.sheetTitle}>새 계정을 만들까요?</h2>
        <p className={styles.sheetText}>
          {active ? `지금 계정('${label(active)}')은 지워지지 않고 보관돼요. ` : ''}시작 화면에서 처음부터 새로 시작해요.
        </p>
        <Button loading={busy} onClick={() => run(startNewAccount, '/welcome')}>
          새 계정 만들기
        </Button>
        <Button variant="ghost" onClick={close}>
          취소
        </Button>
      </BottomSheet>

      {/* 보관 계정 삭제 (명시적 동의) */}
      <BottomSheet open={sheet?.kind === 'delete'} onClose={close} label="계정 삭제 확인">
        <h2 className={styles.sheetTitle}>'{sheet?.kind === 'delete' ? label(sheet.account) : ''}' 계정을 지울까요?</h2>
        <p className={styles.sheetText}>이 계정의 미션·그룹·캐릭터·기분 기록과 추억 기록(사진·메모)이 이 기기에서 모두 지워지고 되돌릴 수 없어요. 다른 계정에는 영향이 없어요.</p>
        <Checkbox label="이 계정의 데이터가 모두 지워지는 것을 이해했어요" checked={agree} onChange={setAgree} />
        <Button
          disabled={!agree}
          loading={busy}
          className={styles.dangerButton}
          onClick={async () => {
            if (sheet?.kind !== 'delete') return
            setBusy(true)
            try {
              await deleteSavedAccount(sheet.account.id)
              toast('계정을 지웠어요')
              close()
            } catch {
              toast('계정을 지우지 못했어요')
            } finally {
              setBusy(false)
            }
          }}
        >
          계정 삭제
        </Button>
        <Button variant="ghost" onClick={close}>
          취소
        </Button>
      </BottomSheet>
    </Page>
  )
}
