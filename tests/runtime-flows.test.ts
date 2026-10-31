import { expect, it } from 'vitest'
import {readFileSync} from 'node:fs'
import {checkpoints,checkpointById} from '../src/workshop/catalog'
import {findSymbol} from '../src/workshop/source'
import {runtimeFlows,flowCheckpoint,eventAvailable,explainedEdge,normalizeFlow,outgoing} from '../src/workshop/runtime-flows'
import {dependencyGraph,dependencyBirth,dependencySource} from '../src/workshop/dependencies'
import {parseLocation, selectionHash} from '../src/workshop/navigation'
import {validLayout} from '../src/workshop/useSplitLayout'
import {lessons} from '../src/workshop/steps'

it('flow gốc có topology chung, nhánh thật và source tại mốc hình thành',()=>{
 expect(runtimeFlows.map(flow=>flow.id)).toEqual(['input-edit','calculate','save','read','leave'])
 for(const flow of runtimeFlows){
  const cp=flowCheckpoint(flow)
  expect(cp,flow.id).toBeDefined()
  expect(flow.events.length).toBeGreaterThan(2)
  for(const event of flow.events){
   for(const text of [event.input,event.output,event.branches,event.timing]) expect(text.trim().length).toBeGreaterThan(0)
   for(const source of event.sources){
    const range=findSymbol(cp!.id,source.file,source.symbol)
    expect(range,source.symbol).toBeDefined()
    if(source.file==='pages/CreateQuotation.tsx') expect(range!.end-range!.start,source.symbol).toBeLessThan(90)
   }
   expect(event.ui.try).not.toBe('')
   if(event.ui.kind==='internal') expect(event.ui.target).toBeUndefined()
  }
  expect(flow.events[0].shape).toBe('start')
  expect(flow.events.some(e=>e.shape==='end')).toBe(true)
  for(const edge of flow.edges){
   expect(flow.events.some(e=>e.id===edge.from)).toBe(true)
   expect(flow.events.some(e=>e.id===edge.to)).toBe(true)
   if(outgoing(flow,edge.from).length>1) expect(edge.label).not.toBe('')
  }
 }
 expect(flowCheckpoint(runtimeFlows[0])?.id).toBe('06')
 expect(flowCheckpoint(runtimeFlows[1])?.id).toBe('05')
 expect(flowCheckpoint(runtimeFlows[2])?.id).toBe('09')
 expect(runtimeFlows[2].events.every(e=>eventAvailable(checkpointById('03'),e))).toBe(false)
})

it('dừng ở fork chưa biết; điều kiện input xác định đường; retry cần chọn kết quả mới',()=>{
 const cp=checkpointById('12'), calculate=runtimeFlows[1], save=runtimeFlows[2]
 const base=normalizeFlow({runtimeFlow:'calculate'})
 expect(explainedEdge(calculate,'validate',base,cp)).toBeUndefined()
 expect(explainedEdge(calculate,'validate',{...base,runtimeScenario:'invalid'},cp)?.to).toBe('stop')
 expect(explainedEdge(calculate,'validate',{...base,runtimeScenario:'valid'},cp)?.to).toBe('premium')
 for(const hadPremium of [true,false]) for(const field of ['sumInsured','startDate','endDate','customerName','phone','email','assetName','address']) {
  expect(explainedEdge(runtimeFlows[0],'compare',{...base,runtimeField:field,runtimeHadPremium:hadPremium},cp)?.to).toBe(['sumInsured','startDate','endDate'].includes(field)?'invalidate':'keep')
 }
 expect(explainedEdge(save,'post',{...base,runtimeScenario:'success'},cp)?.to).toBe('handler')
 expect(explainedEdge(save,'post',{...base,runtimeScenario:'request-error'},cp)?.to).toBe('failure')
 expect(explainedEdge(save,'post',{...base,runtimeScenario:'success',runtimePath:'retry,submit,guard,pending,post'},cp)).toBeUndefined()
})

it('URL cũ ánh xạ flow/tình huống/event; history retry roundtrip và bỏ path không hợp lệ',()=>{
 for(const [old,id,scenario] of [['calculate-success','calculate','valid'],['calculate-invalid','calculate','invalid'],['save-success','save','success'],['save-error','save','request-error'],['edit-after-calculation','input-edit','edit-priced']]){
  const selected=parseLocation(`#journey=2&step=6&runtimeFlow=${old}`)
  expect(selected.runtimeFlow).toBe(id);expect(selected.runtimeScenario).toBe(scenario)
  expect(parseLocation(selectionHash(selected))).toEqual(selected)
 }
 const selected=parseLocation('#journey=2&step=5&sub=5&runtimeFlow=save&runtimeEvent=guard&path=submit,guard,pending,post,failure,catch,retry,submit,guard')
 expect(selected.runtimePath.split(',').filter(id=>id==='submit')).toHaveLength(2)
 expect(parseLocation(selectionHash(selected))).toEqual(selected)
 expect(normalizeFlow({runtimeFlow:'save',runtimePath:'submit,persist'}).runtimePath).toBe('submit')
})

it('flow/event/tình huống luôn nhất quán và history kết thúc tại occurrence đang đọc',()=>{
 const wrong=normalizeFlow({runtimeFlow:'save',runtimeEvent:'premium',runtimeScenario:'valid',runtimePath:'calculate,validate,premium'})
 expect(wrong.runtimeFlow).toBe('save')
 expect(wrong.runtimeEvent).toBe('submit')
 expect(wrong.runtimeScenario).toBe('choose')
 expect(wrong.runtimePath).toBe('submit')
 const retry='submit,guard,pending,post,failure,catch,retry,submit,guard,pending'
 const selected=normalizeFlow({runtimeFlow:'save',runtimeEvent:'guard',runtimePath:retry})
 expect(selected.runtimePath).toBe('submit,guard,pending,post,failure,catch,retry,submit,guard')
})

it('dependency mọi bước có birth/range thật; 3.5 nối callback, rule, state và props đúng file',()=>{
 for(let step=0;step<=6;step++) for(const node of dependencyGraph(step,0,'step').nodes){
  const birth=dependencyBirth(node)
  expect(birth,`${step}:${node.id}`).toBeDefined()
  const source=dependencySource(birth!.checkpoint,node)
  expect(findSymbol(birth!.checkpoint.id,source.file,source.symbol)).toBeDefined()
 }
 const graph=dependencyGraph(3,4,'current'),cp=checkpointById('05')
 for(const id of ['button','calculate','validated','build','validate','days','day','price','premium','calculated','errors','message','notice','props','summary']){
  const node=graph.nodes.find(n=>n.id===id)!
  const source=dependencySource(cp,node), range=findSymbol(cp.id,source.file,source.symbol)!
  expect(range,id).toBeDefined()
  const code=readFileSync(`checkpoints/05/${source.file}`,'utf8').split(/\r?\n/).slice(range.start-1,range.end).join('\n')
  if(id==='button') expect(code).toContain('onClick={calculate}')
  if(id==='premium') expect(code).toContain('[premium, setPremium]')
  if(id==='props') expect(code).toContain('<PremiumSummary premium={premium} stale={calculatedBefore && !premium}')
 }
})

it('layout cũ/hỏng không tạo panel âm hoặc vượt giới hạn',()=>{
 for(const value of [null,[],{code:70,preview:30},{version:1,code:NaN,preview:NaN},{version:1,code:-20,preview:120},{version:1,code:10,preview:30}]) expect(validLayout(value)).toEqual({code:70,preview:30})
 expect(validLayout({version:1,code:1,preview:99})).toEqual({code:40,preview:60})
 expect(validLayout({version:1,code:100,preview:0})).toEqual({code:100,preview:0})
})

it('nội dung tiếng Việt không mất dấu thành dấu hỏi giữa từ',()=>{
 const strings=JSON.stringify(lessons)
 expect(strings).not.toMatch(/[A-Za-zÀ-ỹ]\?[A-Za-zÀ-ỹ]/)
 for(const cp of checkpoints) expect(cp.title+' '+cp.ui).not.toMatch(/[A-Za-zÀ-ỹ]\?[A-Za-zÀ-ỹ]/)
})

it('màn hình tĩnh không dùng state; từng dependency hỗ trợ được nối trong cùng bước',()=>{
 const read=(cp:string,path:string)=>readFileSync(`checkpoints/${cp}/${path}`,'utf8')
 const staticForm=read('03-fields','pages/CreateQuotation.tsx')
 expect(staticForm).toContain('Thông tin khách hàng')
 expect(staticForm).toContain('disabled')
 expect(staticForm).not.toContain('useState')
 expect(read('03','pages/CreateQuotation.tsx')).toContain('value: draft[key]')
 expect(read('04','pages/CreateQuotation.tsx')).toContain('validateAndBuildInput(draft)')
 expect(read('05','pages/CreateQuotation.tsx')).toMatch(/setPremium\(\s*calculatePremium/)
 expect(read('09','pages/CreateQuotation.tsx')).toContain('await quotationsApi.create(input)')
 expect(read('09','pages/QuotationDetail.tsx')).toContain('parseQuotation(state.receipt)')
 expect(read('10','pages/QuotationDetail.tsx')).toContain('quotationsApi')
})
