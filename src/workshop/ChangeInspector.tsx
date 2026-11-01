import type { ComponentChange, StageComparison } from './change-model'
import { changeLabel } from './change-model'
import { findSymbol } from './source'
import { FlowCode } from './RuntimeFlow'

export function ChangeInspector({change,comparison}:{change:ComponentChange;comparison:StageComparison}) {
 return <section aria-label="Thay đổi so với Chặng 1" data-change-id={change.id}>
  <h3>Thay đổi so với Chặng 1 · {changeLabel[change.kind]}</h3>
  <dl><dt>Trước · Chặng 1 hoàn chỉnh / {comparison.baseline.id}</dt><dd>{change.before}</dd><dt>Sau · Chặng 2 hiện hành / {comparison.target.id}</dt><dd>{change.after}</dd><dt>Lý do</dt><dd>{change.reason}</dd></dl>
  {(['before','after'] as const).map(side=>{const cp=side==='before'?comparison.baseline:comparison.target,sources=side==='before'?change.beforeSources:change.afterSources;return <div key={side}>
   <strong>Source {side==='before'?'trước':'sau'} · {cp.id}</strong>
   {sources.length?sources.map(s=>{const range=findSymbol(cp.id,s.file,s.symbol);return <details key={s.file+'#'+s.symbol}><summary>{s.file} · {s.symbol}{range?` · dòng ${range.start}–${range.end}`:' · chưa có source tương ứng'}</summary>{range&&<FlowCode checkpoint={cp} source={{...s,since:cp.id}}/>}</details>}):<p>{side==='before'?'Chưa có thành phần này ở Chặng 1.':'Thành phần đã rời đường chạy hiện hành.'}</p>}
  </div>})}
 </section>
}
