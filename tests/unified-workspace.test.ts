import { describe,it,expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { revisionCheckpoints as catalog } from '../src/stage2/archive/revision'
import { stageDependencies,stageOverview,stageSections,taskFocus } from '../src/stage2/archive/workspace-data'
import { runtimeAdapter } from '../src/stage2/archive/workspace-flows'
import { definitionsAt,relationsAt,selectedDefinition } from '../src/workshop/dependency-tree.model'
import { findSymbol } from '../src/workshop/source'
import { normalizeFlow } from '../src/workshop/runtime-flows'
const cp=(id:string)=>catalog.find(cp=>cp.id===id)!
describe('dữ liệu Chặng2 trên controller dùng chung',()=>{
 it('overload trỏ thân triển khai và consumer → validation → catalog có site đúng source',()=>{
  const at=cp('s2-04-validation'),adapter=stageDependencies(at),definitions=definitionsAt(at,true,adapter),edges=relationsAt(at,definitions,false,adapter)
  const implementation=findSymbol(at.id,'quotation/rules.ts','validateAndBuildInput')!
  expect(implementation.end-implementation.start).toBeGreaterThan(10)
  for(const [from,to] of [['validated','build'],['build','validate'],['validate','lookup'],['lookup','catalog']]){
   const relation=edges.find(e=>e.from===from&&e.to===to);expect(relation,from+' → '+to).toBeDefined()
   for(const site of relation!.sites){const range=findSymbol(at.id,site.file,site.symbol)!;expect(range.start).toBeGreaterThanOrEqual(relation!.source.range.start);expect(range.end).toBeLessThanOrEqual(relation!.source.range.end)}
  }
  expect(selectedDefinition(definitions,{file:'quotation/rules.ts',symbol:'doesNotExist',dependencyNode:''},at)).toBeUndefined()
 })
 it('mọi quan hệ và vai trò đều dùng range checkpoint; không fallback symbol thiếu',()=>{
  for(const at of catalog){const adapter=stageDependencies(at),definitions=definitionsAt(at,true,adapter)
   for(const edge of relationsAt(at,definitions,false,adapter)){expect(edge.sites.length).toBeGreaterThan(0);expect(edge.source.actual&&edge.target.actual).toBe(true)}
   for(const file of at.files)for(const section of stageSections(at.id,file.path))for(const range of section.ranges)expect(findSymbol(at.id,file.path,range.qualified)).toBeDefined()
  }
  expect(taskFocus('s2-04-validation').symbol).toBe('validateDraft')
  expect(taskFocus('s2-04-validation').related.map(s=>s.symbol)).toContain('CreateQuotation.validatedInput')
 })
 it('yêu cầu tác động giữ nền context, tách delta của chặng khỏi trạng thái checkpoint',()=>{
  const old=stageOverview(cp('s2-00')),final=stageOverview(cp('s2-r2-complete'))
  expect(final.parts).toHaveLength(10);expect(final.parts.filter(p=>final.changes[p.id]==='Mới ở Chặng 2').map(p=>p.id)).toEqual(['catalog'])
  const catalogPart=final.parts.find(p=>p.id==='catalog')!
  expect(old.status(catalogPart,cp('s2-00'))).toBe('future');expect(final.status(catalogPart,cp('s2-r2-complete'))).toBe('existing')
  expect(final.requirements.find(r=>r.id==='validation')?.nodes).toEqual(['catalog','validation','form'])
  expect(final.relations.some(e=>e.requirements?.includes('validation')&&e.from==='validation'&&e.to==='catalog')).toBe(true)
 })
 it('một graph có nhánh, hợp nhất và retry; normalize giữ URL product, không gọi nghiệp vụ',()=>{
  const at=cp('s2-r2-complete'),adapter=runtimeAdapter(at)
  expect(adapter.flows.map(f=>f.id)).toEqual(['product','input-edit','calculate','save','read'])
  for(const flow of adapter.flows)for(const edge of flow.edges){expect(flow.events.some(e=>e.id===edge.from)).toBe(true);expect(flow.events.some(e=>e.id===edge.to)).toBe(true)}
  const state=normalizeFlow({runtimeFlow:'product',runtimeEvent:'change',runtimePath:'intent,panel,decision,change'},adapter.flows)
  expect(state.runtimePath).toBe('intent,panel,decision,change')
  const input=adapter.flows.find(f=>f.id==='input-edit')!
  expect(adapter.explain(input,'draft',normalizeFlow({runtimeFlow:'input-edit'},adapter.flows),at)?.to).toBe('compare')
  expect(adapter.flows.find(f=>f.id==='save')?.edges.some(e=>e.from==='retry')).toBe(true)
  expect(readFileSync('src/stage2/StageTwoAdapter.tsx','utf8')).not.toContain('StageFlow')
 })
})
