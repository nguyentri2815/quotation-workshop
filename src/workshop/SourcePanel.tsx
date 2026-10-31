import { useEffect, useRef, useState } from 'react'
import { Copy, LocateFixed, FileCode2, ArrowLeft, X } from 'lucide-react'
import { checkpoints, fileMeaning } from './catalog'
import type { Checkpoint } from './catalog'
import type { Operation } from './operations'
import type { Selection } from './navigation'
import { readSource, symbolsAt, findSymbol, symbolBirth, sourceRows, diffRows, sourceDiff, sectionsAt } from './source'
import { analysisRoles, rolesFor } from './analysis-roles'
import { CodeBlock } from './CodeBlock'
import styles from './workshop.module.css'
import sourceReview from '../../docs/CHANG-1-SOURCE-REVIEW.md?url'
import { PointOnPreview, previewTarget } from './PreviewGuide'

export function SourcePanel({ checkpoint, operation, selection, onChange, onCheckpoint, focusEpoch = 0 }: {
  focusEpoch?: number
  checkpoint: Checkpoint
  operation: Operation
  selection: Selection
  onChange: (patch: Partial<Selection>) => void
  onCheckpoint: (id: string, file?: string, symbol?: string) => void
}) {
  const [loaded, setLoaded] = useState({ before: '', after: '', error: '', loading: true })
  const [notice, setNotice] = useState('')
  const [jump, setJump] = useState(0)
  const [insideOpen, setInsideOpen] = useState(false)
  const panel = useRef<HTMLElement>(null)
  const { file, symbol, side, section, position } = selection
  const info = checkpoint.files.find(item => item.path === file)
  const beforeInfo = operation.before.files.find(item => item.path === file)
  const afterInfo = operation.after.files.find(item => item.path === file)
  useEffect(() => {
    let active = true
    setLoaded({ before: '', after: '', error: '', loading: true })
    setNotice('')
    Promise.all([
      beforeInfo ? readSource(operation.before.id, file) : Promise.resolve(''),
      afterInfo ? readSource(operation.after.id, file) : Promise.resolve(''),
    ]).then(([before, after]) => {
      if (active) setLoaded({ before, after, error: '', loading: false })
    }).catch((error: unknown) => {
      if (active) setLoaded({ before: '', after: '', loading: false, error: error instanceof Error ? error.message : 'Không đọc được source' })
    })
    return () => { active = false }
  }, [file, beforeInfo, afterInfo, operation.before.id, operation.after.id])
  const sections = sectionsAt(checkpoint.id, file)
  const symbolRange = symbol ? findSymbol(checkpoint.id, file, symbol) : undefined
  const selected = section ? sections.find(item => item.id === section) : sections.find(item => item.ranges.some(range => range.qualified === symbolRange?.qualified))
  const selectedPosition = section ? position : Math.max(0, selected?.ranges.findIndex(range => range.qualified === symbolRange?.qualified) ?? 0)
  const range = section ? selected?.ranges[position] : symbolRange
  const missing = Boolean((section || symbol) && !range)
  const invalidPosition = Boolean(section && selected && position >= selected.ranges.length)
  const birth = section
    ? checkpoints.find(cp => sectionsAt(cp.id, file).some(item => item.id === section))
    : symbol ? symbolBirth(file, symbol) : checkpoints.find(cp => cp.files.some(item => item.path === file))
  const oldRange = section
    ? sectionsAt(operation.before.id, file).find(item => item.id === section)?.ranges[position]
    : findSymbol(operation.before.id, file, symbol)
  const code = side === 'before' ? loaded.before : loaded.after
  const rows = side === 'diff' ? diffRows(file, loaded.before, loaded.after) : sourceRows(code)
  const targetKey = `${checkpoint.id}:${file}:${section}:${position}:${symbol}:${side}`
  function reveal(id: string, next = 0) {
    onChange({ section: id, position: next, symbol: '' })
    setJump(value => value + 1)
    if ((panel.current?.clientWidth ?? 0) < 900) setInsideOpen(false)
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(side === 'diff' ? sourceDiff(file, loaded.before, loaded.after, operation.before.id, operation.after.id) : code)
      setNotice('Đã chép code, không kèm số dòng.')
    } catch { setNotice('Không truy cập clipboard; bạn có thể chọn code để chép.') }
  }
  return <section ref={panel} className={styles.codePanel} aria-label="Source mẫu" data-checkpoint={checkpoint.id} data-file={file}>
    <div className={styles.fileBar}>
      <FileCode2 aria-hidden /><strong title={file}>{file}</strong><span className={styles.badge}>Mẫu {checkpoint.id}</span>
    </div>
    <div className={styles.codeToolbar}>
      <div className={styles.segmented} aria-label="Mốc source">
        {(['before', 'after', 'diff'] as const).map(value => <button key={value} aria-pressed={side === value} onClick={() => onChange({ side: value })}>{value === 'before' ? 'Trước' : value === 'after' ? 'Sau' : 'Diff'}</button>)}
      </div>
      <label className={styles.symbolPicker}><span className={styles.srOnly}>Symbol</span>
        <select aria-label="Symbol" value={section ? '' : range?.qualified ?? ''} onChange={event => onChange({ symbol: event.target.value })}>
          <option value="">{missing ? 'Phần chưa hình thành' : 'Chọn symbol'}</option>
          {symbolsAt(checkpoint.id, file).filter(item => !['Import', 'Export', 'JSX', 'Guard', 'DependencySite'].includes(item.kind)).map((item, i) => <option key={item.qualified + i} value={item.qualified}>{item.qualified}</option>)}
        </select>
      </label>
      <button onClick={() => void copy()} disabled={loaded.loading || !info}><Copy aria-hidden />Chép</button>
      <button aria-expanded={insideOpen} aria-controls="inside-file" onClick={() => setInsideOpen(!insideOpen)}>Bên trong file</button>
    </div>
    <div className={styles.codeContext}>
      <span>{info?.origin === 'workshop' ? 'Riêng workshop' : 'Source sản phẩm mẫu'} · {side === 'before' ? `Trước: ${operation.before.id}` : side === 'diff' ? `${operation.before.id} → ${operation.after.id} · preview chạy Sau` : `Sau: ${operation.after.id}`}{selection.mode === 'mine' ? ' · preview là bài thực hành' : ''}</span>
      <details><summary>Thông tin kỹ thuật</summary><p>{fileMeaning(file)}</p><p>{info?.scaffold ? 'File scaffold có sẵn từ mốc 00; các bước sau bổ sung nội dung.' : info ? `File hình thành ở ${info.first}.` : 'File không có ở mốc này.'}</p><p>{info?.origin === 'adapted' ? 'Có adapter nhúng tối thiểu.' : info?.origin === 'workshop' ? 'Host/adapter riêng, không phải source sản phẩm.' : 'Cấu trúc và nội dung theo source sản phẩm đã ghim.'}</p><a href={sourceReview} target="_blank" rel="noreferrer">Bảng đối chiếu và khác biệt scaffold ↗</a><p><code>SHA-256 {info?.sha256 ?? '—'}</code></p><p>Range từ AST, xác minh hash snapshot; source hiển thị và chạy preview dùng chung file.</p></details>
    </div>
    {selection.notice && <p className={styles.missingSymbol} role="status">{selection.notice}</p>}
    {missing && <div className={styles.missingSymbol} role="status"><strong>{invalidPosition ? `Vị trí ${position + 1} không tồn tại trong nhóm ${section}` : `Chưa hình thành ở checkpoint này: ${section || symbol}`}</strong><span>Không có phần tương ứng trong {file} tại {checkpoint.id}; không highlight phần khác.</span>{invalidPosition && <button onClick={() => reveal(section)}>Về vị trí đầu của nhóm</button>}{birth && birth.id !== checkpoint.id && <button onClick={() => onCheckpoint(birth.id, file, section ? sectionsAt(birth.id, file).find(item => item.id === section)?.ranges[0]?.qualified : symbol)}>Đến mốc {birth.id}</button>}</div>}
    {!info ? <div className={styles.codeEmpty}><strong>{birth ? 'File chưa hình thành' : 'Không tìm thấy file trong chuỗi checkpoint'}: {file}</strong>{birth && <button onClick={() => onCheckpoint(birth.id, file)}>Đến mốc tạo file {birth.id}</button>}</div>
      : loaded.loading ? <p role="status">Đang đọc source…</p>
      : loaded.error ? <p role="alert" className={styles.error}>{loaded.error}</p>
      : <>
        <div className={styles.rangeBar}>
          <span>{range ? `${selected?.title ?? range.name} · ${range.qualified} · dòng ${range.start}–${range.end}` : 'Toàn file · chưa chọn nhóm code'}{range && <small>▶ Nhóm đang giải thích · toàn bộ phần trước/sau vẫn ở bên dưới</small>}</span>
          {selected && selected.ranges.length > 1 && <button onClick={() => reveal(selected.id, (selectedPosition + 1) % selected.ranges.length)}>Tiếp vị trí ({selectedPosition + 1}/{selected.ranges.length})</button>}
          <button disabled={!range} onClick={() => setJump(value => value + 1)}><LocateFixed aria-hidden />Đến đoạn liên quan</button>
          <PointOnPreview target={range && previewTarget(file, range.qualified)} />
        </div>
        {side === 'diff' && <div className={styles.diffLegend}><span>Trái: dòng Trước · phải: dòng Sau · toàn bộ ngữ cảnh</span><span>+ Thêm · − Xóa</span></div>}
        <div className={`${styles.codeWithInside} ${insideOpen ? styles.insideOpen : ''}`}>
          {side === 'diff' && loaded.before === loaded.after ? <div className={styles.codeEmpty}>File giữ nguyên giữa hai mốc. Chọn Trước/Sau để đọc toàn file.</div> : <CodeBlock rows={rows} path={file} range={range} oldRange={oldRange} diff={side === 'diff'} jump={jump + focusEpoch} targetKey={targetKey} />}
          {insideOpen && <aside id="inside-file" className={styles.fileInside} aria-label="Bên trong file" onKeyDown={event => { if (event.key === 'Escape') setInsideOpen(false) }}>
            <div className={styles.insideHeading}><strong>Bên trong file</strong><button aria-label="Đóng phân tích" onClick={() => setInsideOpen(false)}><X aria-hidden /></button></div>
            <p className={styles.insidePath}>{file} · mốc {checkpoint.id}</p>
            <button onClick={() => window.history.back()}><ArrowLeft aria-hidden />Quay lại lựa chọn trước</button>
            {!sections.length && <p>Chưa có nhóm phân tích được xác minh cho loại file này. Toàn bộ nội dung đang hiển thị.</p>}
            <p>Mô hình phân tích trách nhiệm trong file hiện tại. Một đoạn có thể vừa nhận intent vừa điều phối; các nhãn không tạo thêm file hoặc layer.</p>
            {analysisRoles.filter(role => sections.some(item => rolesFor(file,item)[0] === role)).map(role => <section key={role} aria-label={role}><h3>{role}</h3>{sections.filter(item => rolesFor(file,item)[0] === role).map(item => <article key={item.id} data-section={item.id} data-active={item.id === selected?.id} className={item.id === selected?.id ? styles.activeAnalysis : ''}>
              <h3>{item.title}{item.id === selected?.id ? ' · Đang chọn' : ''}</h3>
              <code>{[...new Set(item.ranges.map(r => r.qualified))].join(' · ')}</code>
              <small>{rolesFor(file,item).join(" · ")} · {item.ranges.map(r => "dòng " + r.start + "–" + r.end).join(", ")}</small><p>{item.role}</p><dl><dt>Đọc / đầu vào</dt><dd>{item.input}</dd><dt>Cập nhật / đầu ra</dt><dd>{item.output}</dd></dl>
              <button onClick={() => reveal(item.id)}>Xem trong code</button>
              {item.ranges.length > 1 && <div className={styles.insidePositions}>{item.ranges.map((r, i) => <button key={r.qualified + i} aria-pressed={item.id === selected?.id && selectedPosition === i} onClick={() => reveal(item.id, i)}>{i + 1}. {r.name} · {r.start}–{r.end}</button>)}</div>}
              {item.links.length > 0 && <div className={styles.insideLinks}><strong>Quan hệ</strong>{item.links.map((link, i) => <button key={link.file + link.symbol + i} onClick={() => { onChange({ file: link.file, symbol: link.symbol }); if ((panel.current?.clientWidth ?? 0) < 900) setInsideOpen(false) }}>↗ {link.label}</button>)}</div>}
            </article>)}</section>)}
          </aside>}
        </div>
      </>}
    {notice && <p className={styles.copyNotice} role="status">{notice}</p>}
  </section>
}
