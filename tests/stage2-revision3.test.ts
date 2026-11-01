import { expect,it } from 'vitest'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { revisionCheckpoints as catalog, revisionOperation, stageGroups, entryFor, archiveMapping } from '../src/stage2/archive3/revision'
import { runtimeAdapter } from '../src/stage2/archive3/workspace-flows'
import { changes, comparison, flowKinds } from '../src/stage2/archive3/changes'
import { revisionRunPlan, revisionScenarios, scenariosFor } from '../src/stage2/archive3/runs'
import { stageDependencies, stageOverview, stageSections, stageSectionChange } from '../src/stage2/archive3/workspace-data'
import { definitionsAt, relationsAt } from '../src/workshop/dependency-tree.model'
import { findSymbol } from '../src/workshop/source'
import { normalizeFlow } from '../src/workshop/runtime-flows'
import type { RunRecord } from '../src/workshop/run/model'
import pin from '../stage2/product-r3.json'
import frozen from '../stage2/preview2-baseline.json'
import old from '../stage2/manifest.json'

const read=(p:string)=>readFileSync(p,'utf8'),sha=(s:string)=>createHash('sha256').update(s).digest('hex')
function unembed(path:string,code:string){
 if(path==='App.tsx')return code.replaceAll('createHashRouter','createBrowserRouter')
 if(path==='main.tsx')return code.replace("import { workerOptions } from './_workshop/environment'\nimport { mountTools } from './_workshop/tools'\n",'').replace('worker.start(workerOptions)',"worker.start({ quiet: true, onUnhandledFrame: 'bypass' })").replace("mountTools()\n  const { router }",'const { router }')
 if(path==='api/quotations.ts'||path==='mocks/handlers.ts')return code.replace("import { apiBase } from '../_workshop/environment'\n",'').replaceAll("apiBase + '/:id'","'/api/quotations/:id'").replaceAll('`${apiBase}/${','`/api/quotations/${').replaceAll('apiBase',"'/api/quotations'")
 if(path==='mocks/storage.ts')return code.replace("import { storageKey } from '../_workshop/environment'\n",'').replace('STORAGE_KEY = storageKey',"STORAGE_KEY = 'quotation-product.demo.v1'")
 return code
}
it('v3 starts at Chặng1 and never navigates through an abandoned checkpoint',()=>{
 expect(old).toEqual(frozen)
 expect(stageGroups.flatMap(g=>g.ids)).toEqual(catalog.map(cp=>cp.id))
 expect(catalog).toHaveLength(7)
 for(const cp of catalog){
  expect(cp.id.startsWith('s2-r3-')).toBe(true)
  const op=revisionOperation(cp.id)
  expect(findSymbol(cp.id,op.file,op.symbol),cp.id).toBeDefined()
  expect(op.part.files[0].path).toBe(op.file)
  for(const file of cp.files){
   const code=read(`checkpoints/${cp.id}/${file.path}`)
   expect(sha(code)).toBe(file.sha256)
   if(cp.order===0)expect(code).toBe(read(`checkpoints/s2-00/${file.path}`))
  }
  const form=read(`checkpoints/${cp.id}/pages/CreateQuotation.tsx`)
  expect(form).not.toMatch(/productSupported|product-action-note|id="productCode"/)
  if(cp.order>=2){
   const info=read(`checkpoints/${cp.id}/components/ProductInformation.tsx`)
   expect(info).not.toContain('<select')
   expect(info).toContain('styles.productContext')
   expect(form).not.toContain('<FixedInformation')
  }
 }
 for(const id of Object.values(archiveMapping))expect(catalog.some(cp=>cp.id===id)).toBe(true)
})
it('final checkpoint equals pinned working-tree Product except declared embedding adapters',()=>{
 expect(sha(JSON.stringify(pin.files))).toBe(pin.sha256)
 for(const f of pin.files){
  const pinned=read('stage2/product-r3/'+f.path)
  expect(sha(pinned)).toBe(f.sha256)
  expect(unembed(f.path,read('checkpoints/s2-r3-complete/'+f.path)),f.path).toBe(pinned)
  expect(read('../quotation-product/src/'+f.path),f.path).toBe(pinned)
 }
})
it('classification is behavioral: edit/calculate/save/read change, product is new, leave unchanged',()=>{
 expect(flowKinds).toEqual({product:'new','input-edit':'changed',calculate:'changed',save:'changed',read:'changed',leave:'unchanged'})
 expect(changes.edit.after).toContain('kiểm lại lỗi')
 expect(changes.matches.after).toContain('phiên bản')
 expect(changes.record.beforeSources[0].file).toBe('quotation/rules.ts')
 expect(changes.record.afterSources[0].file).toBe('quotation/records.ts')
 for(const change of Object.values(changes)){
  for(const s of change.beforeSources)expect(findSymbol(comparison.baseline.id,s.file,s.symbol),change.id+' before '+s.symbol).toBeDefined()
  for(const s of change.afterSources)expect(findSymbol(comparison.target.id,s.file,s.symbol),change.id+' after '+s.symbol).toBeDefined()
 }
})
it('every flow/edge change has pinned source; formation and delta stay independent',()=>{
 const adapter=runtimeAdapter(catalog.at(-1)!)
 for(const flow of adapter.flows){
  expect(flow.changeKind).toBeDefined()
  for(const e of flow.events){
   expect(e.change).toBeDefined()
   if(e.change!.kind!=='removed')expect(adapter.eventAvailable!(catalog.at(-1)!,e),flow.id+'/'+e.id).toBe(true)
   for(const s of e.sources)expect(findSymbol(catalog.at(-1)!.id,s.file,s.symbol),flow.id+'/'+e.id+'/'+s.symbol).toBeDefined()
   for(const s of e.change!.beforeSources)expect(findSymbol('12',s.file,s.symbol),flow.id+'/'+e.id+' before '+s.symbol).toBeDefined()
   for(const s of e.change!.afterSources)expect(findSymbol(catalog.at(-1)!.id,s.file,s.symbol),flow.id+'/'+e.id+' after '+s.symbol).toBeDefined()
  }
  for(const e of flow.edges){expect(e.change).toBeDefined();expect(flow.events.some(n=>n.id===e.from)).toBe(true);expect(flow.events.some(n=>n.id===e.to)).toBe(true)}
 }
 const match=adapter.flows.find(f=>f.id==='input-edit')!.events.find(e=>e.id==='matches')!
 expect(match.change!.kind).toBe('new')
 expect(adapter.eventAvailable!(catalog[0],match)).toBe(false)
 expect(adapter.eventAvailable!(catalog[5],match)).toBe(true)
 expect(normalizeFlow({runtimeFlow:'product',runtimeEvent:'fixed-context'},adapter.flows).runtimeEvent).toBe('intent')
 expect(normalizeFlow({runtimeFlow:'product',runtimeEvent:'fixed-context',compareChanges:true},adapter.flows).runtimeEvent).toBe('fixed-context')
 expect(stageOverview(catalog[0]).changes.catalog).toBe('Mới ở Chặng 2')
 expect(stageOverview(catalog[0]).status(stageOverview(catalog[0]).parts.find(p=>p.id==='catalog')!,catalog[0])).toBe('future')
})
it('tasks, dependency sites, source roles and runs all resolve within the same checkpoint',()=>{
 expect(revisionRunPlan(catalog.at(-1)!,'product-switch').supported).toBe(false)
 expect(revisionRunPlan(catalog.at(-1)!,'product-switch').tasks).toEqual([])
 const before=definitionsAt(catalog[0],true,stageDependencies(catalog[0])).find(n=>n.node?.id==='record')!
 expect(before.file).toBe('quotation/rules.ts')
 expect(before.symbol).toBe('parseQuotation')
 const oldRecord=stageSections(catalog[0].id,before.file).find(s=>s.ranges.some(r=>r.qualified==='parseQuotation'))!
 expect(stageSectionChange(before.file,oldRecord)?.id).toBe(changes.record.id)
 for(const cp of catalog){
  const runtime=runtimeAdapter(cp),flow=runtime.flows.find(f=>f.id==='input-edit')!
  const record={id:'observed',session:'session',order:1,at:1,step:1,action:'Sửa tiền',kind:'ui',title:'Phí hết hiệu lực',detail:'Cần tính lại phí',sources:[],ui:'premium',flow:'input-edit',event:'render',path:['input','draft','compare','invalidate','update','render'],explanation:'DOM quan sát, path là diễn giải source.'} as RunRecord
  const path=runtime.mapEvidence!(record).path!
  for(let i=1;i<path.length;i++)expect(flow.edges.some(e=>e.from===path[i-1]&&e.to===path[i]&&e.change?.kind!=='removed'),cp.id+' '+path[i-1]+' → '+path[i]).toBe(true)
  expect(path.includes('matches')).toBe(cp.order>=5)
  const dep=stageDependencies(cp),definitions=definitionsAt(cp,true,dep)
  expect(dep.catalog).toBe(catalog)
  for(const e of relationsAt(cp,definitions,false,dep))expect(e.source.actual&&e.target.actual).toBe(true)
  for(const f of cp.files)for(const section of stageSections(cp.id,f.path))for(const range of section.ranges)expect(findSymbol(cp.id,f.path,range.qualified)).toBeDefined()
  for(const scenario of Object.keys(revisionScenarios)){
   const plan=revisionRunPlan(cp,scenario)
   expect(plan.entry).toBe(entryFor(cp))
   expect(plan.supported).toBe(scenariosFor(cp).some(([id])=>id===scenario))
   if(!plan.supported)continue
   for(const t of plan.tasks){expect(t.sources.length,cp.id+'/'+scenario+'/'+t.kind).toBeGreaterThan(0);for(const s of t.sources)expect(findSymbol(cp.id,s.file,s.symbol)).toBeDefined()}
   if(cp.order<6)expect(plan.tasks.some(t=>['save','save-error','retry','legacy-record'].includes(t.kind))).toBe(false)
   if(scenario==='switch')expect(plan.tasks.some(t=>t.kind==='cancel-product')).toBe(true)
  }
 }
})
