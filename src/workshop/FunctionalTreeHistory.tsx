import { useState } from 'react'
import { checkpoints } from './catalog'
import { findSymbol } from './source'
import { rangeText, sourceKey, useRoleSources } from './FunctionalTree.model'
import styles from './FunctionalTree.module.css'

export function FunctionalTreeHistory({ file, symbol, onCheckpoint }: {
  file: string
  symbol: string
  onCheckpoint: (id: string, file?: string, symbol?: string) => void
}) {
  const [open, setOpen] = useState(false)
  return <details className={styles.history} onToggle={event => setOpen(event.currentTarget.open)}>
    <summary>Lịch sử checkpoint · {symbol}</summary>
    {open && <HistoryEntries file={file} symbol={symbol} onCheckpoint={onCheckpoint} />}
  </details>
}

function HistoryEntries({ file, symbol, onCheckpoint }: Omit<Parameters<typeof FunctionalTreeHistory>[0], never>) {
  const relevant = checkpoints.filter(cp => findSymbol(cp.id, file, symbol))
  const { sources, error } = useRoleSources(relevant.map(cp => ({ checkpoint: cp.id, file })))
  if (error) return <p role="alert">{error}</p>
  if (relevant.some(cp => sources[sourceKey(cp.id, file)] === undefined)) return <p role="status">Đang đối chiếu các phiên bản…</p>
  let previous: string | undefined
  let present = false
  return <>
    <p>Trình tự tái dựng để học, không phải lịch sử Git. Chỉ liệt kê mốc hình thành, thay đổi hoặc gỡ symbol.</p>
    <ul>{checkpoints.map(cp => {
      const range = findSymbol(cp.id, file, symbol)
      if (!range) {
        if (!present) return null
        present = false
        previous = undefined
        return <li key={cp.id}>{cp.id} · Không còn symbol tại mốc này</li>
      }
      const text = rangeText(sources[sourceKey(cp.id, file)], range)
      const changed = text !== previous
      const label = !present ? 'Hình thành' : 'Đã sửa'
      previous = text
      present = true
      return changed ? <li key={cp.id}><button onClick={() => onCheckpoint(cp.id, file, symbol)}>{cp.id} · {label} · dòng {range.start}–{range.end}</button></li> : null
    })}</ul>
  </>
}
