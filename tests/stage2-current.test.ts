import { expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { format, check } from 'prettier'
import type { Options } from 'prettier'
import manifest from '../stage2/revision-4.json'
import pin from '../stage2/product-r3.json'
import { revisionCheckpoints as catalog, revisionOperation, phase, stageGroups, entryFor, archiveMapping, lessonAt } from '../src/stage2/revision'
import { provenanceFor } from '../src/stage2/provenance'
import { runtimeAdapter } from '../src/stage2/workspace-flows'
import { comparison, changes } from '../src/stage2/changes'
import { stageDependencies, stageSections } from '../src/stage2/workspace-data'
import { definitionsAt, relationsAt } from '../src/workshop/dependency-tree.model'
import { findSymbol } from '../src/workshop/source'
import { revisionRunPlan, scenariosFor } from '../src/stage2/runs'

const read=(path:string)=>readFileSync(path,'utf8')
const hash=(text:string)=>createHash('sha256').update(text).digest('hex')
const code=(id:string,path:string)=>read(`checkpoints/s2-r4-${id}/${path}`)
const p='quotation/products.ts',v='components/ProductInformation.tsx',f='pages/CreateQuotation.tsx',page='pages/SelectProduct.tsx'
it('26 incremental checkpoints share exact source/preview bytes and actual AST focus',()=>{
 expect(catalog).toHaveLength(26)
 expect(stageGroups.flatMap(g=>g.ids)).toEqual(catalog.map(cp=>cp.id))
 for(const [i,cp]of catalog.entries()){
  const op=revisionOperation(cp.id),lesson=lessonAt(cp)
  expect(cp.previous).toBe(catalog[i-1]?.id??null)
  expect(findSymbol(cp.id,op.file,op.symbol),cp.id).toBeDefined()
  for(const file of cp.files)expect(hash(read(`checkpoints/${cp.id}/${file.path}`)),cp.id+'/'+file.path).toBe(file.sha256)
  for(const field of ['why','origin','consumer','delta','ui','run'] as const)expect(lesson[field].length).toBeGreaterThan(15)
  if(i)expect(cp.files.some(file=>file.status!=='unchanged'),cp.id).toBe(true)
  expect(entryFor(cp)).toBe(i<3?'/quotations/new':'/products')
  expect(read(`checkpoints/${cp.id}/${f}`)).not.toMatch(/id="productCode"|productSupported|product-action-note/)
 }
 for(const id of Object.values(archiveMapping))expect(catalog.some(cp=>cp.id===id)).toBe(true)
})
it('catalog is constructed data → import → render → array/map → presentation → route/form',()=>{
 expect(code('contract',p)).not.toContain('export const')
 expect(code('data',p)).toContain('export const basicProperty: PropertyProduct')
 expect(code('data',p)).not.toContain("code: 'EXTENDED_PROPERTY'")
 expect(code('page',page)).toContain('import { basicProperty }')
 expect(code('page',page)).not.toMatch(/map\(|className|button|Link/)
 expect(code('catalog',p)).not.toContain('basicProperty')
 expect(code('catalog',page)).toContain('propertyProducts.map')
 expect(code('heading',page)).toContain('styles.pageHeading')
 expect(code('heading',page)).not.toContain('styles.card')
 expect(code('cards',page)).not.toContain('styles.productGrid')
 expect(code('layout',page)).not.toMatch(/<button|<Link/)
 expect(code('actions',page)).toContain('disabled')
 expect(code('actions',page)).not.toContain('<Link')
 expect(code('route',page)).toContain('product=${product.code}')
 expect(code('route',page)).toContain("query.get('product')")
 expect(code('route',page)).not.toContain('<CreateQuotation')
 expect(code('entry',page)).toContain('<CreateQuotation initialCode={product.code}')
 expect(code('entry',v)).not.toContain('<dialog')
 expect(code('panel-open',v)).toContain('showModal()')
 expect(code('panel-open',v)).not.toContain('candidate')
 expect(code('candidate',v)).not.toContain('onProductChange?.(candidate)')
 expect(code('panel',v)).toContain('onProductChange?.(candidate)')
 expect(code('panel',f)).toContain('setPremium(null)')
 expect(code('validation','quotation/types.ts')).not.toContain('CalculatedPremium')
 expect(code('receipt','quotation/types.ts')).toContain('CalculatedPremium')
})
it('provenance resolves checkpoint files, import ranges and narrow map site',()=>{
 for(const cp of catalog){
  const provenance=provenanceFor(cp)
  if(!provenance)continue
  expect(provenance.links.length,cp.id).toBeGreaterThanOrEqual(2)
  for(const link of provenance.links)expect(findSymbol(cp.id,link.file,link.symbol),cp.id+'/'+link.label).toBeDefined()
 }
 const data=catalog.find(c=>c.id==='s2-r4-data')!
 expect(definitionsAt(data,true,stageDependencies(data)).find(n=>n.node?.id==='catalog')?.symbol).toBe('basicProperty')
 const origin=provenanceFor(catalog.find(c=>c.id==='s2-r4-catalog')!)!
 expect(origin.links.map(l=>l.label)).toEqual(['Định nghĩa','Import','Nơi dùng'])
 expect(origin.links[1].symbol).toBe('import:../quotation/products')
 expect(origin.links[2].symbol).toBe('SelectProduct.catalog-map')
 expect(origin.explanation).toContain('catalog runtime được khai báo trong quotation/products.ts')
})
it('every unique TS/TSX source is formatted; final equals the formatted pinned target/adapters',async()=>{
 const seen=new Set<string>()
 for(const cp of catalog)for(const file of cp.files.filter(f=>/\.tsx?$/.test(f.path))){
  if(seen.has(file.sha256))continue
  seen.add(file.sha256)
  expect(await check(read(`checkpoints/${cp.id}/${file.path}`),{...manifest.formatter as Options,filepath:file.path}),cp.id+'/'+file.path).toBe(true)
 }
 // Revision3's independent tests verify the unembedding byte for byte.
 for(const file of catalog.at(-1)!.files){
  const original=read('checkpoints/s2-r3-complete/'+file.path)
  const expected=/\.tsx?$/.test(file.path)?await format(original,{...manifest.formatter as Options,filepath:file.path}):original
  expect(read('checkpoints/s2-r4-complete/'+file.path),file.path).toBe(expected)
 }
 expect(manifest.productHash).toBe(pin.sha256)
},20000)
it('change evidence, formation, dependencies and run suggestions resolve this revision',()=>{
 for(const change of Object.values(changes)){
  for(const s of change.beforeSources)expect(findSymbol(comparison.baseline.id,s.file,s.symbol),change.id).toBeDefined()
  for(const s of change.afterSources)expect(findSymbol(comparison.target.id,s.file,s.symbol),change.id).toBeDefined()
 }
 for(const cp of catalog){
  const deps=stageDependencies(cp),defs=definitionsAt(cp,true,deps)
  for(const rel of relationsAt(cp,defs,false,deps))expect(rel.source.actual&&rel.target.actual).toBe(true)
  for(const file of cp.files)for(const section of stageSections(cp.id,file.path))for(const range of section.ranges)expect(findSymbol(cp.id,file.path,range.qualified)).toBeDefined()
  for(const [scenario]of scenariosFor(cp)){
   const plan=revisionRunPlan(cp,scenario)
   expect(plan.supported).toBe(true)
   expect(plan.entry).toBe(entryFor(cp))
   for(const task of plan.tasks){expect(task.sources.length).toBeGreaterThan(0);for(const s of task.sources)expect(findSymbol(cp.id,s.file,s.symbol)).toBeDefined()}
   if(phase(cp)<6)expect(plan.tasks.some(t=>['save','save-error','retry'].includes(t.kind))).toBe(false)
  }
  const runtime=runtimeAdapter(cp),matches=runtime.flows.find(f=>f.id==='input-edit')!.events.find(e=>e.id==='matches')!
  expect(matches.change?.kind).toBe('new')
  expect(runtime.eventAvailable!(cp,matches)).toBe(phase(cp)>=5)
 }
})
