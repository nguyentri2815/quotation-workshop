import { useLayoutEffect, useRef, useState } from 'react'
import { PointOnPreview, previewTarget } from './PreviewGuide'
import type { FileSection } from './source'
import { checkpoints as baselineCatalog } from './catalog'
import type { Checkpoint } from './catalog'
import type { Selection } from './navigation'
import { findSymbol, sectionsAt, symbolBirth } from './source'
import { roleGroups, roleGroup, roleStatusLabel, rangeStatus, sectionStatus, useRoleSources } from './FunctionalTree.model'
import { FunctionalTreeHistory } from './FunctionalTreeHistory'
import styles from './FunctionalTree.module.css'
import { operationAt } from './operations'
import type { ComponentChange, StageComparison } from './change-model'
import { changeLabel } from './change-model'
import { ChangeInspector } from './ChangeInspector'

export function FunctionalTree({ checkpoint, destination, focusEpoch, selection, future, onFuture, onChange, onCheckpoint, compact = false, adapter }: {
  adapter?: {comparison?:StageComparison;change?:(file:string,section:FileSection)=>ComponentChange|undefined;catalog:Checkpoint[];sections:typeof sectionsAt;group:typeof roleGroup;focus:{file:string;symbol:string;related:Array<{file:string;symbol:string}>}}
  checkpoint: Checkpoint
  destination: Checkpoint
  focusEpoch: number
  selection: Selection
  future: boolean
  onFuture: (value: boolean) => void
  onChange: (value: Partial<Selection>) => void
  onCheckpoint: (id: string, file?: string, symbol?: string) => void
  compact?: boolean
}) {
  const checkpoints=adapter?.catalog??baselineCatalog, getSections=adapter?.sections??sectionsAt, groupFor=adapter?.group??roleGroup
  const previous = checkpoints.find(cp => cp.id === checkpoint.previous)
  const { sources, error } = useRoleSources([checkpoint, ...(previous ? [previous] : [])].flatMap(cp => cp.files.map(file => ({ checkpoint: cp.id, file: file.path }))))
  const selectedSymbol = findSymbol(checkpoint.id, selection.file, selection.symbol)?.qualified
  const files = [...new Set((future ? [checkpoint, destination] : [checkpoint]).flatMap(cp => cp.files.map(file => file.path)))]
  const entries = files.filter(file => !file.endsWith(".css")).flatMap(file => [...new Map([...(future ? getSections(destination.id, file) : []), ...getSections(checkpoint.id, file)].map(section => [section.id, section])).values()].filter(section => !['imports','exports'].includes(section.id)).map(section => ({ file, section })))
  const taskFocus = adapter?.focus??operationAt(selection.step, selection.sub, selection.mark).focus
  function related(file: string, id: string) {
    if (adapter) { const section=entries.find(entry=>entry.file===file&&entry.section.id===id)?.section; return Boolean(section?.ranges.some(range=>taskFocus.related.some(link=>link.file===file&&(link.symbol===range.qualified||link.symbol===range.name)))) }
    if (selection.step === 3) return file === 'quotation/rules.ts' && ['validate','build','price'].includes(id) || file === 'pages/CreateQuotation.tsx' && ['calculate','validate','errors','actions','summary','bind','blur','premium'].includes(id)
    if (selection.step === 5) return file === 'pages/CreateQuotation.tsx' && ['save','submit','request','save-lock','save-success','save-error','errors','actions'].includes(id) || ['api/quotations.ts','mocks/handlers.ts','mocks/storage.ts'].includes(file)
    const section = entries.find(entry => entry.file === file && entry.section.id === id)?.section
    return Boolean(section?.ranges.some(range => taskFocus.related.some(link => link.file === file && (link.symbol === range.qualified || link.symbol === range.name))))
  }
  const groups = roleGroups.map(group => ({ ...group, entries: entries.filter(entry => groupFor(entry.file, entry.section) === group.id).sort((a,b) => Number(related(b.file,b.section.id)) - Number(related(a.file,a.section.id))) }))
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
  const groupKey = selectedEntry ? groupFor(selectedEntry.file, selectedEntry.section) : ''
  const sourceReady = Boolean(error) || Object.keys(sources).length > 0
  const explored=useRef(false)
  useLayoutEffect(()=>{explored.current=false},[checkpoint.id,selectedKey,focusEpoch])
  useLayoutEffect(() => {
    setOpened([selectedKey, parentKey].filter(Boolean))
    setOpenGroups([...new Set([groupKey,...(adapter?entries.filter(entry=>related(entry.file,entry.section.id)).map(entry=>groupFor(entry.file,entry.section)):[])])].filter(Boolean))
  }, [checkpoint.id, selectedKey, parentKey, groupKey, focusEpoch])
  useLayoutEffect(() => {
    const host = body.current
    if (!sourceReady || !host) return
    let pending = true
    const reveal = () => {
      const item = host.querySelector<HTMLElement>('[data-selected="true"]')
      if (pending && !explored.current && host.clientHeight && item?.offsetHeight) {
        host.scrollTop += item.getBoundingClientRect().top - host.getBoundingClientRect().top - 8
        pending = false
      }
    }
    const tick = requestAnimationFrame(reveal)
    // A mounted, collapsed explorer has no readable height yet. Reveal once on
    // opening, then leave the learner's scroll alone on later layout changes.
    const observer = new ResizeObserver(reveal)
    observer.observe(host)
    return () => { cancelAnimationFrame(tick); observer.disconnect() }
  }, [checkpoint.id, selectedKey, focusEpoch, sourceReady])


  function show(file: string, section: string, position: number) {
    onChange({ file, section, position, symbol: '', scope: 'full', notice: '' })
  }
  function relation(file: string, symbol: string) {
    onChange({ file, symbol, section: '', position: 0, scope: 'full', notice: '' })
  }
  function renderEntry({ file, section }: { file: string; section: FileSection }): React.ReactNode {
          const delta=adapter?.change?.(file,section)
          const current = getSections(checkpoint.id, file).find(item => item.id === section.id)
          const status = sectionStatus(checkpoint, file, section, sources, getSections)
          const selected = selection.file === file && (selection.section === section.id || (!selection.section && section.ranges.some(range => range.qualified === selectedSymbol)))
          const born = checkpoints.find(cp => getSections(cp.id, file).some(item => item.id === section.id))
          const rangeCheckpoint = current ? checkpoint.id : born?.id
          return <details className={styles.role} key={`${file}:${section.id}`} data-section={section.id} data-file={file} data-selected={selected} data-related={related(file,section.id)} open={opened.includes(file + ':' + section.id)}>
            <summary onClick={event => { event.preventDefault(); if (current) { if (selected) setOpened(old => old.includes(file + ':' + section.id) ? old.filter(key => key !== file + ':' + section.id) : [...old, file + ':' + section.id]); else show(file, section.id, 0) } else setOpened(old => old.includes(file + ':' + section.id) ? old.filter(key => key !== file + ':' + section.id) : [...old, file + ':' + section.id]) }}>{section.title}{delta&&<small title="Thay đổi so với Chặng 1">{changeLabel[delta.kind]}</small>}<span className={styles.status} data-status={status}>{status ? roleStatusLabel[status] : error ? 'Chưa đối chiếu được' : 'Đang đối chiếu…'}</span>{selected && ' · Đang xem'}{!current && ' · Chưa hình thành'}<small className={styles.path} title={file}>{file}</small></summary>
            {related(file,section.id) && <small>Liên quan hành vi đang xây</small>}
            <PointOnPreview target={current && previewTarget(file, section.ranges[0]?.qualified ?? '') || undefined} /><p>{section.role}</p>
            <details><summary>Đầu vào · đầu ra · UI</summary><dl><dt>Đọc / đầu vào</dt><dd>{section.input}</dd><dt>Đầu ra / UI quan sát</dt><dd>{section.output}</dd></dl></details>
            <div className={styles.ranges}>{section.ranges.map((range, position) => {
              const state = rangeStatus(checkpoint, file, range.qualified, sources)
              return <button key={range.qualified + position} title={range.qualified} aria-pressed={selected && (selection.section ? selection.position === position : selectedSymbol === range.qualified)} onClick={() => current ? show(file, section.id, position) : onCheckpoint(rangeCheckpoint ?? checkpoint.id, file, range.qualified)}>
                {current ? 'Xem trong code' : 'Đến mốc hình thành'} · <code>{range.qualified}</code><br />Mốc {rangeCheckpoint} · dòng {range.start}–{range.end}<span className={styles.status} data-status={state}>{state ? roleStatusLabel[state] : error ? 'Chưa đối chiếu được' : 'Đang đối chiếu…'}</span>
              </button>
            })}</div>
            {section.links.length > 0 && <div className={styles.links}><strong>Quan hệ được mô tả từ source</strong>{section.links.map((link, i) => {
              const target = findSymbol(checkpoint.id, link.file, link.symbol)
              const birth = target ? undefined : (adapter?checkpoints.find(cp=>findSymbol(cp.id,link.file,link.symbol)):symbolBirth(link.file, link.symbol))
              return <button key={link.file + link.symbol + i} onClick={() => relation(link.file, link.symbol)}>↗ {link.label}<small className={styles.path} title={link.file+" · "+link.symbol}>{link.file} · {link.symbol}{target ? ` · dòng ${target.start}–${target.end}` : birth ? ` · chưa có; hình thành ở ${birth.id}` : ' · không có range đã xác minh'}</small></button>
            })}</div>}
            {delta&&adapter?.comparison&&<details><summary>So sánh với Chặng 1</summary><ChangeInspector change={delta} comparison={adapter.comparison}/></details>}
            {section.ranges.map(range => <FunctionalTreeHistory catalog={checkpoints} key={range.qualified + range.start} file={file} symbol={range.qualified} onCheckpoint={onCheckpoint} />)}
            {entries.filter(entry => entry.file === file && parent(entry.section) === section.id).map(renderEntry)}
          </details>
  }
  return <div className={styles.explorer} aria-label={`Cấu trúc tính năng checkpoint ${checkpoint.id}`}>
    {!compact && <details className={styles.legend}><summary>Cách đọc cây</summary><p>Vai trò / bao chứa · mốc {checkpoint.id}. Badge Thêm/Sửa so với {checkpoint.previous ?? 'khởi đầu'}. Quan hệ gọi/truyền nằm trong từng mục.</p></details>}
    {!compact && <button className={styles.return} onClick={() => window.history.back()}>← Quay lại lựa chọn trước</button>}
    {error && <p role="alert" className={styles.legend}>{error}</p>}
    <div className={styles.body} ref={body} onPointerDown={()=>{explored.current=true}} onWheel={()=>{explored.current=true}} onKeyDown={()=>{explored.current=true}}>
      {groups.filter(group => group.entries.length).map(group => <details className={styles.group} key={group.id} data-group={group.id} open={openGroups.includes(group.id)}>
        <summary onClick={event => { event.preventDefault(); setOpenGroups(old => old.includes(group.id) ? old.filter(id => id !== group.id) : [...old, group.id]) }}>{group.title} · {group.entries.length} vai trò</summary>
        <p>{group.description}</p>
        {group.entries.filter(entry => !group.entries.some(candidate => candidate.file === entry.file && candidate.section.id === parent(entry.section))).map(renderEntry)}
      </details>)}
      {!groups.some(group => group.entries.length) && <p>Chưa có vai trò được phân tích tại checkpoint này.</p>}
    </div>
    {!compact && <label className={styles.future}><input type="checkbox" checked={future} onChange={event => onFuture(event.target.checked)} />Xem đích của sub-step</label>}
  </div>
}
