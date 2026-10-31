import { useLayoutEffect, useRef, useState } from 'react'
import { PointOnPreview, previewTarget } from './PreviewGuide'
import type { FileSection } from './source'
import { checkpoints } from './catalog'
import type { Checkpoint } from './catalog'
import type { Selection } from './navigation'
import { findSymbol, sectionsAt, symbolBirth } from './source'
import { roleGroups, roleGroup, roleStatusLabel, rangeStatus, sectionStatus, useRoleSources } from './FunctionalTree.model'
import { FunctionalTreeHistory } from './FunctionalTreeHistory'
import styles from './FunctionalTree.module.css'
import { operationAt } from './operations'

export function FunctionalTree({ checkpoint, destination, focusEpoch, selection, future, onFuture, onChange, onCheckpoint }: {
  checkpoint: Checkpoint
  destination: Checkpoint
  focusEpoch: number
  selection: Selection
  future: boolean
  onFuture: (value: boolean) => void
  onChange: (value: Partial<Selection>) => void
  onCheckpoint: (id: string, file?: string, symbol?: string) => void
}) {
  const previous = checkpoints.find(cp => cp.id === checkpoint.previous)
  const { sources, error } = useRoleSources([checkpoint, ...(previous ? [previous] : [])].flatMap(cp => cp.files.map(file => ({ checkpoint: cp.id, file: file.path }))))
  const selectedSymbol = findSymbol(checkpoint.id, selection.file, selection.symbol)?.qualified
  const files = [...new Set((future ? [checkpoint, destination] : [checkpoint]).flatMap(cp => cp.files.map(file => file.path)))]
  const entries = files.filter(file => !file.endsWith(".css")).flatMap(file => [...new Map([...(future ? sectionsAt(destination.id, file) : []), ...sectionsAt(checkpoint.id, file)].map(section => [section.id, section])).values()].filter(section => !['imports','exports'].includes(section.id)).map(section => ({ file, section })))
  const taskFocus = operationAt(selection.step, selection.sub, selection.mark).focus
  function related(file: string, id: string) {
    if (selection.step === 3) return file === 'quotation/rules.ts' && ['validate','build','price'].includes(id) || file === 'pages/CreateQuotation.tsx' && ['calculate','validate','errors','actions','summary','bind','blur','premium'].includes(id)
    if (selection.step === 5) return file === 'pages/CreateQuotation.tsx' && ['save','submit','request','save-lock','save-success','save-error','errors','actions'].includes(id) || ['api/quotations.ts','mocks/handlers.ts','mocks/storage.ts'].includes(file)
    const section = entries.find(entry => entry.file === file && entry.section.id === id)?.section
    return Boolean(section?.ranges.some(range => taskFocus.related.some(link => link.file === file && (link.symbol === range.qualified || link.symbol === range.name))))
  }
  const groups = roleGroups.map(group => ({ ...group, entries: entries.filter(entry => roleGroup(entry.file, entry.section) === group.id).sort((a,b) => Number(related(b.file,b.section.id)) - Number(related(a.file,a.section.id))) }))
  const body = useRef<HTMLDivElement>(null)
  const [opened, setOpened] = useState<string[]>([])
  const [openGroups, setOpenGroups] = useState<string[]>([])
  const selectedEntry = entries.find(entry => entry.file === selection.file && (selection.section ? entry.section.id === selection.section : entry.section.ranges.some(range => range.qualified === selectedSymbol)))
  const selectedKey = selectedEntry ? selectedEntry.file + ':' + selectedEntry.section.id : ''
  function parent(section: FileSection) {
    if (['field-contract','field-view'].includes(section.id)) return 'field'
    const id = section.id.replace('field-use-', '')
    if (['customerName','phone','email'].includes(id)) return 'customer'
    if (['assetName','address','sumInsured'].includes(id)) return 'asset'
    if (['startDate','endDate'].includes(id)) return 'period'
    return ''
  }
  const parentKey = selectedEntry && parent(selectedEntry.section) ? selectedEntry.file + ':' + parent(selectedEntry.section) : ''
  const groupKey = selectedEntry ? roleGroup(selectedEntry.file, selectedEntry.section) : ''
  const sourceReady = Boolean(error) || Object.keys(sources).length > 0
  useLayoutEffect(() => {
    setOpened([selectedKey, parentKey].filter(Boolean))
    setOpenGroups(groupKey ? [groupKey] : [])
  }, [checkpoint.id, selectedKey, parentKey, groupKey, focusEpoch])
  useLayoutEffect(() => {
    const tick = requestAnimationFrame(() => {
      const host = body.current, item = host?.querySelector<HTMLElement>('[data-selected="true"]')
      if (sourceReady && host && item && item.offsetHeight) host.scrollTop += item.getBoundingClientRect().top - host.getBoundingClientRect().top - 8
    })
    return () => cancelAnimationFrame(tick)
  }, [checkpoint.id, selectedKey, focusEpoch, sourceReady])


  function show(file: string, section: string, position: number) {
    onChange({ file, section, position, symbol: '', scope: 'full', notice: '' })
  }
  function relation(file: string, symbol: string) {
    onChange({ file, symbol, section: '', position: 0, scope: 'full', notice: '' })
  }
  function renderEntry({ file, section }: { file: string; section: FileSection }): React.ReactNode {
          const current = sectionsAt(checkpoint.id, file).find(item => item.id === section.id)
          const status = sectionStatus(checkpoint, file, section, sources)
          const selected = selection.file === file && (selection.section === section.id || (!selection.section && section.ranges.some(range => range.qualified === selectedSymbol)))
          const born = checkpoints.find(cp => sectionsAt(cp.id, file).some(item => item.id === section.id))
          const rangeCheckpoint = current ? checkpoint.id : born?.id
          return <details className={styles.role} key={`${file}:${section.id}`} data-section={section.id} data-file={file} data-selected={selected} data-related={related(file,section.id)} open={opened.includes(file + ':' + section.id)}>
            <summary onClick={event => { event.preventDefault(); if (current) { if (selected) setOpened(old => old.includes(file + ':' + section.id) ? old.filter(key => key !== file + ':' + section.id) : [...old, file + ':' + section.id]); else show(file, section.id, 0) } else setOpened(old => old.includes(file + ':' + section.id) ? old.filter(key => key !== file + ':' + section.id) : [...old, file + ':' + section.id]) }}>{section.title}<span className={styles.status} data-status={status}>{status ? roleStatusLabel[status] : error ? 'Chưa đối chiếu được' : 'Đang đối chiếu…'}</span>{selected && ' · Đang xem'}{!current && ' · Chưa hình thành'}<small className={styles.path}>{file}</small></summary>
            {related(file,section.id) && <small>Liên quan hành vi đang xây</small>}
            <PointOnPreview target={current && previewTarget(file, section.ranges[0]?.qualified ?? '') || undefined} /><p>{section.role}</p>
            <details><summary>Đầu vào · đầu ra · UI</summary><dl><dt>Đọc / đầu vào</dt><dd>{section.input}</dd><dt>Đầu ra / UI quan sát</dt><dd>{section.output}</dd></dl></details>
            <div className={styles.ranges}>{section.ranges.map((range, position) => {
              const state = rangeStatus(checkpoint, file, range.qualified, sources)
              return <button key={range.qualified + position} aria-pressed={selected && (selection.section ? selection.position === position : selectedSymbol === range.qualified)} onClick={() => current ? show(file, section.id, position) : onCheckpoint(rangeCheckpoint ?? checkpoint.id, file, range.qualified)}>
                {current ? 'Xem trong code' : 'Đến mốc hình thành'} · {range.qualified}<br />Mốc {rangeCheckpoint} · dòng {range.start}–{range.end}<span className={styles.status} data-status={state}>{state ? roleStatusLabel[state] : error ? 'Chưa đối chiếu được' : 'Đang đối chiếu…'}</span>
              </button>
            })}</div>
            {section.links.length > 0 && <div className={styles.links}><strong>Quan hệ được mô tả từ source</strong>{section.links.map((link, i) => {
              const target = findSymbol(checkpoint.id, link.file, link.symbol)
              const birth = target ? undefined : symbolBirth(link.file, link.symbol)
              return <button key={link.file + link.symbol + i} onClick={() => relation(link.file, link.symbol)}>↗ {link.label}<small className={styles.path}>{link.file} · {link.symbol}{target ? ` · dòng ${target.start}–${target.end}` : birth ? ` · chưa có; hình thành ở ${birth.id}` : ' · không có range đã xác minh'}</small></button>
            })}</div>}
            {section.ranges.map(range => <FunctionalTreeHistory key={range.qualified + range.start} file={file} symbol={range.qualified} onCheckpoint={onCheckpoint} />)}
            {entries.filter(entry => entry.file === file && parent(entry.section) === section.id).map(renderEntry)}
          </details>
  }
  return <div className={styles.explorer} aria-label={`Cấu trúc tính năng checkpoint ${checkpoint.id}`}>
    <p className={styles.legend}>Vai trò / bao chứa · mốc {checkpoint.id}. Badge Thêm/Sửa so với {checkpoint.previous ?? 'khởi đầu'}. Quan hệ gọi/truyền nằm trong từng mục.</p>
    <button className={styles.return} onClick={() => window.history.back()}>← Quay lại lựa chọn trước</button>
    {error && <p role="alert" className={styles.legend}>{error}</p>}
    <div className={styles.body} ref={body}>
      {groups.filter(group => group.entries.length).map(group => <details className={styles.group} key={group.id} data-group={group.id} open={openGroups.includes(group.id)}>
        <summary onClick={event => { event.preventDefault(); setOpenGroups(old => old.includes(group.id) ? old.filter(id => id !== group.id) : [...old, group.id]) }}>{group.title} · {group.entries.length} vai trò</summary>
        <p>{group.description}</p>
        {group.entries.filter(entry => !group.entries.some(candidate => candidate.file === entry.file && candidate.section.id === parent(entry.section))).map(renderEntry)}
      </details>)}
      {!groups.some(group => group.entries.length) && <p>Chưa có vai trò được phân tích tại checkpoint này.</p>}
    </div>
    <label className={styles.future}><input type="checkbox" checked={future} onChange={event => onFuture(event.target.checked)} />Xem đích của sub-step</label>
  </div>
}
