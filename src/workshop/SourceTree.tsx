import { useLayoutEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { ChevronDown, ChevronRight, Folder, FolderOpen, FileCode2, Link2, Eye } from 'lucide-react'
import { checkpoints, fileStatusText } from './catalog'
import type { Checkpoint } from './catalog'
import styles from './workshop.module.css'

export function SourceTree({ checkpoint, selectedFile, related, collapsed, onCollapse, onSelect, future = false, onFuture, active = true, renderSymbols, expandedFiles = [], onExpandFile, label, compact = false }: {
  checkpoint: Checkpoint
  selectedFile: string
  related: string[]
  collapsed: string[]
  before?: Checkpoint
  onCollapse: (folders: string[]) => void
  onSelect: (file: string) => void
  future?: boolean
  onFuture?: (value: boolean) => void
  active?: boolean
  renderSymbols?: (file: string) => ReactNode
  expandedFiles?: string[]
  onExpandFile?: (file: string) => void
  label?: string
  compact?: boolean
}) {
  const scroll = useRef<HTMLDivElement>(null)
  const lastTarget = useRef('')
  const pending = useRef(false)
  const files = future ? (checkpoints.at(-1)?.files ?? []) : checkpoint.files
  useLayoutEffect(() => {
    if (!active) return
    const target = `${checkpoint.id}:${selectedFile}:${future}`
    if (lastTarget.current !== target) {
      lastTarget.current = target
      pending.current = true
      const segments = selectedFile.split('/').slice(0, -1)
      const ancestors = segments.map((_, i) => segments.slice(0, i + 1).join('/'))
      const next = collapsed.filter(folder => !ancestors.includes(folder))
      if (next.length !== collapsed.length) { onCollapse(next); return }
    }
    if (!pending.current) return
    const container = scroll.current
    const reveal = () => {
      const button = container?.querySelector<HTMLElement>('[data-selected="true"]')
      if (pending.current && container && button && container.clientHeight) {
        container.scrollTo({ top: container.scrollTop + button.getBoundingClientRect().top - container.getBoundingClientRect().top - (container.clientHeight - button.offsetHeight) / 2, behavior: 'instant' })
        pending.current = false
      }
    }
    reveal()
    if (pending.current && container) {
      const observer = new ResizeObserver(reveal)
      observer.observe(container)
      return () => observer.disconnect()
    }
  }, [selectedFile, checkpoint.id, future, collapsed, onCollapse, active])
  function fileButton(path: string) {
    const info = checkpoint.files.find(file => file.path === path)
    const linked = related.includes(path), selected = selectedFile === path
    const status = info?.status ?? 'unchanged'
    return <li key={path} data-tree-file={path}><div className={renderSymbols ? styles.treeFileRow : undefined}>{renderSymbols && <button aria-label={`Symbol trong ${path}`} aria-expanded={expandedFiles.includes(path)} className={styles.treeFileToggle} onClick={() => onExpandFile?.(path)}>{expandedFiles.includes(path) ? <ChevronDown aria-hidden /> : <ChevronRight aria-hidden />}</button>}<button className={`${styles.treeFile} ${linked ? styles.relatedFile : ''} ${selected ? styles.selectedFile : ''} ${!info ? styles.futureFile : ''}`}
      data-file={path} data-related={linked} data-selected={selected} aria-pressed={selected}
      aria-label={`${path}${selected ? ' · Đang xem' : ''}${linked ? ' · liên quan' : ''}${!info ? ' · Chưa hình thành' : ''}`}
      title={`${path} · ${info?.origin === 'workshop' ? 'Riêng workshop' : info?.origin === 'adapted' ? 'Sản phẩm + adapter nhúng' : 'Source sản phẩm'} · ${!info ? 'Chưa hình thành' : fileStatusText[status]}${info?.scaffold ? ' · có khung từ đầu' : ''}`}
      onClick={() => onSelect(path)}>
      <FileCode2 aria-hidden /><span className={styles.treeName}>{path.split('/').at(-1)}</span>
      <span className={styles.treeMarks}>{selected && <small className={styles.viewingMark}><Eye aria-hidden />Đang xem</small>}{linked && <span title="File liên quan" aria-label="File liên quan"><Link2 aria-hidden /></span>}{status !== 'unchanged' && <small className={styles.fileStatus}>{fileStatusText[status]}</small>}{!info && <small>Chưa có</small>}{info?.origin === 'workshop' && <small>Workshop</small>}</span>
    </button></div>{renderSymbols && expandedFiles.includes(path) && <ul className={styles.treeChildren} aria-label={`Symbol của ${path}`}>{renderSymbols(path)}</ul>}</li>
  }
  function branch(prefix = '') {
    const children = [...new Set(files.filter(file => file.path.startsWith(prefix)).map(file => file.path.slice(prefix.length).split('/')[0]))]
    return children.map(name => {
      const path = prefix + name
      if (files.some(file => file.path === path)) return fileButton(path)
      return <li key={path}><button className={styles.treeFolder} aria-expanded={!collapsed.includes(path)} onClick={() => onCollapse(collapsed.includes(path) ? collapsed.filter(item => item !== path) : [...collapsed, path])}>
        {collapsed.includes(path) ? <ChevronRight aria-hidden /> : <ChevronDown aria-hidden />}{collapsed.includes(path) ? <Folder aria-hidden /> : <FolderOpen aria-hidden />}<strong>{name}</strong>
      </button>{!collapsed.includes(path) && <ul className={styles.treeChildren}>{branch(path + '/')}</ul>}</li>
    })
  }
  return <div className={styles.sourceTree} aria-label={label ?? `Cây ứng dụng checkpoint ${checkpoint.id}`}>
    <div className={styles.treeRoot}><FolderOpen aria-hidden /><strong>src mẫu · {checkpoint.id}</strong><span>{checkpoint.files.length} file</span></div>
    {!compact && <p className={styles.treeLegend}>Đang xem ≠ liên quan. Mới / Đã sửa: so với checkpoint trước, không phải Git. _workshop và index.html là phần nhúng riêng.</p>}
    <div className={styles.treeScroll} ref={scroll} data-testid="tree-scroll"><ul>{branch()}</ul></div>
    {onFuture && <label className={styles.checkLabel}><input type="checkbox" checked={future} onChange={event => onFuture(event.target.checked)} />Xem cấu trúc cuối chặng</label>}
  </div>
}
