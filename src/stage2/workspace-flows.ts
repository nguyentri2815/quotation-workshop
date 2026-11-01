import type { Checkpoint } from '../workshop/catalog'
import type { RuntimeAdapter } from '../workshop/RuntimeFlow'
import type { RuntimeEvent, FlowEdge } from '../workshop/runtime-flows'
import { runtimeFlows as baselineFlows, explainedEdge, outgoing } from '../workshop/runtime-flows'
import { findSymbol } from '../workshop/source'
import { runtimeAdapter as archivedAdapter } from './archive/workspace-flows'
import { revisionCheckpoints as catalog, phase, built } from './revision'
import { comparison, eventChange, flowKinds, changes } from './changes'

const cache=new Map<string,RuntimeAdapter>()
const source=(file:string,symbol:string)=>({file,symbol,since:catalog.find(cp=>findSymbol(cp.id,file,symbol))?.id??catalog.at(-1)!.id})
const edge=(from:string,to:string,label=''):FlowEdge=>({id:from+'~'+to,from,to,label})
export function runtimeAdapter(cp:Checkpoint):RuntimeAdapter {
 const cached=cache.get(cp.id);if(cached)return cached
 // The archive is data-only: use its final graph as context, then remap every
 // source and capability to revision 4. No archive checkpoint enters navigation.
 const seed=archivedAdapter({...cp,id:'s2-r2-complete',order:8})
 const flows=structuredClone([...seed.flows,...baselineFlows.filter(f=>f.id==='leave')])
 for(const flow of flows)for(const e of flow.events){
  e.sources=e.sources.map(s=>source(s.file,s.symbol))
  e.ui.try='Tự thao tác ở preview đúng checkpoint hoặc mở Chạy thử. Đọc graph không thực hiện hành động nghiệp vụ.'
 }
 const input=flows.find(f=>f.id==='input-edit')!
 input.events.find(e=>e.id==='draft')!.output='Giữ policy Chặng 1: so số tiền, ngày bắt đầu, ngày kết thúc; sửa tên không bỏ phí.'
 input.events.find(e=>e.id==='update')!.output=built(cp,'revalidate')?'setDraft(next); nếu đã validation thì kiểm lại lỗi theo sản phẩm.':'setDraft(next), xóa message/notice và lỗi trường sửa theo baseline.'
 input.events.find(e=>e.id==='render')!.sources.push(source('pages/CreateQuotation.tsx','CreateQuotation.currentPremium'))
 input.events.find(e=>e.id==='render')!.output=built(cp,'receipt')?'Render draft mới; chỉ hiện phí khi receipt khớp mã, phiên bản và ba đầu vào.':built(cp,'pricing')?'Render draft và Premium A/B; receipt định danh chưa hình thành.':'Đích receipt chưa hình thành; mốc này còn phí A theo baseline.'
 input.events.find(e=>e.id==='render')!.branches='Không tự tính lại phí. Sửa tên giữ phí; sửa tiền/ngày hoặc xác nhận đổi sản phẩm bỏ phí.'
 const matches:RuntimeEvent={id:'matches',title:'Receipt còn khớp sản phẩm / phiên bản?',kind:'Nhánh',x:1,y:5,input:'premium, draft và productCode hiện tại.',output:'So code/version và ba đầu vào. Chỉ receipt khớp mới thành currentPremium.',branches:'Không tính lại phí; không POST.',timing:'Diễn giải source; không gọi helper khi đọc graph.',sources:[source('quotation/rules.ts','premiumMatchesDraft')],ui:{kind:'internal',try:'Tính phí rồi sửa/đổi sản phẩm trong preview.'}}
 input.events.push(matches);input.events.find(e=>e.id==='render')!.y=6
 input.edges=input.edges.filter(e=>!(e.from==='update'&&e.to==='render'))
 input.edges.push(edge('update','matches'),edge('matches','render','Khớp → hiện phí; không khớp → cần tính lại'))
 const calculate=flows.find(f=>f.id==='calculate')!
 const price=calculate.events.find(e=>e.id==='premium')!
 price.sources=built(cp,'receipt')?[source('quotation/rules.ts','calculateDraftPremium'),source('quotation/rules.ts','calculatePremium')]:[source('quotation/rules.ts','calculatePremium')]
 calculate.events.find(e=>e.id==='calculate')!.output=built(cp,'receipt')?'validatedInput → calculateDraftPremium(draft, productCode) → setPremium(receipt).':built(cp,'pricing')?'validatedInput → calculatePremium với productCode → setPremium(Premium).':built(cp,'validation')?'Validation nhận mã; B lỗi hiện tại trường, B hợp lệ dừng vì công thức chưa nối. A tính được.':'Validation và tính A theo baseline; B chưa nối.'
 calculate.events.find(e=>e.id==='validate')!.output=built(cp,'validation')?'Form truyền mã → validateAndBuildInput → validateDraft → lookup giới hạn; errors về Field.':built(cp,'validator')?'Validator nhận mã tùy chọn; consumer form còn dùng mặc định A.':'Consumer và validation A của baseline.'
 price.output=built(cp,'receipt')?'Tra tham số → net→tax; receipt giữ mã/phiên bản và đầu vào.':built(cp,'formula')?'Công thức đã nhận mã; net=round(sum×annualRate×days/365), tax=round(net×taxRate). '+(built(cp,'pricing')?'Handler đã truyền mã A/B.':'Consumer hiện vẫn gọi mặc định A.'):'Công thức A cố định:0,1% năm, thuế10%.'
 calculate.events.find(e=>e.id==='state')!.output=built(cp,'receipt')?'setPremium(receipt); currentPremium kiểm code/version và đầu vào.':'Giữ Premium hoặc null; receipt định danh chưa hình thành.'
 calculate.events.find(e=>e.id==='render')!.output=built(cp,'summary')?'Render định danh receipt, tỷ lệ/ngày/tổng từ props.':built(cp,'pricing')?'Render kết quả A/B từ props; chưa có hàng định danh receipt.':'Presentation phí A theo baseline.'
 // Before persistence is introduced, resolve readers at their actual baseline
 // location instead of claiming a records.ts file that does not exist yet.
 if(!built(cp,'record'))for(const flow of flows)for(const e of flow.events){
  e.sources=e.sources.filter(s=>!['productTerms','readQuotationReport'].includes(s.symbol)).map(s=>s.file==='quotation/records.ts'?source('quotation/rules.ts',s.symbol):s)
 }
 const save=flows.find(f=>f.id==='save')!
 if(built(cp,'entry')&&!built(cp,'complete'))save.events.find(e=>e.id==='guard')!.output='Lưu chưa nối tại mốc này; nút bị khóa, handler không gửi POST.'
 const read=flows.find(f=>f.id==='read')!
 read.events.find(e=>e.id==='get')!.output=built(cp,'record')?'GET → parser snapshot sản phẩm/phiên bản; adapter A gốc chỉ đọc, giữ byte row sai.':'GET đọc Quotation A theo contract baseline; parser trong rules.ts, chưa có snapshot phiên bản.'
 read.events.find(e=>e.id==='data')!.output=built(cp,'read')?'Render sản phẩm/phiên bản và biểu phí đã lưu; reload không tái báo giá.':'Presentation đọc A của baseline; hàng sản phẩm lịch sử chưa nối.'
 save.events.find(e=>e.id==='persist')!.output=built(cp,'record')?'Mock kiểm mã/phiên bản, tự tính và lưu snapshot; giữ row cũ.':'Mock A baseline tự kiểm input, tính phí và lưu contract cũ.'
 const product=flows.find(f=>f.id==='product')!
 product.events.find(e=>e.id==='intent')!.sources=[source('pages/SelectProduct.tsx','SelectProduct')]
 product.events.find(e=>e.id==='panel')!.title='Mở panel Đổi sản phẩm'
 product.events.find(e=>e.id==='choose')!.output=built(cp,'entry')?'Mã hợp lệ → initialCode → form/ngữ cảnh. Thiếu mã về /products; sai mã hiện lỗi.':built(cp,'route')?'Link truyền mã → QuotationEntry đọc/kiểm mã; mới render tên/mô tả, chưa mở form.':'Trang chọn chưa nối hành động mở form.'
 product.events.find(e=>e.id==='panel')!.output=built(cp,'candidate')?'Mở panel và reset ứng viên từ mã đang áp dụng.':'Mở shell panel; chưa có lựa chọn tạm, chỉ hủy/đóng.'
 product.events.find(e=>e.id==='decision')!.output=built(cp,'panel')?'Khác mã → xác nhận gọi callback; hủy/Escape không áp dụng.':'Lựa chọn tạm hoạt động; nút xác nhận còn khóa, chưa gọi callback.'
 product.events.find(e=>e.id==='change')!.output='Xác nhận mới đổi mã, giữ draft, setPremium(null); từ mốc validation cập nhật lỗi theo sản phẩm.'
 product.events.push({id:'fixed-context',title:'Thông tin A cố định trên form',kind:'Render',x:-1,y:2,sources:[],input:'Baseline A.',output:'FixedInformation đã rời form hiện hành.',branches:'Chỉ là thành phần so sánh, không tham gia đường chạy.',timing:'Không thực thi.',ui:{kind:'internal',try:'Xem source trước/sau.'}})
 for(const flow of flows){
  flow.changeKind=flowKinds[flow.id]
  for(const e of flow.events)e.change=eventChange(flow.id,e.id,e.sources)
  for(const e of flow.edges){
   const added=flow.id==='product'||flow.id==='input-edit'&&[e.from,e.to].includes('matches')||flow.id==='read'&&e.to==='isolated'
   const changed=(flow.id==='calculate'&&e.from==='validate'&&e.to==='premium')||(flow.id==='save'&&['guard~pending','handler~persist','persist~response'].includes(e.id))
   const reference=flow.events.find(n=>n.id===(changed?e.from:e.to))!.change!
   e.change={...reference,id:'edge.'+flow.id+'.'+e.id,kind:e.to==='fixed-context'?'removed':added?'new':changed?'changed':'unchanged',before:e.to==='fixed-context'?reference.before:added?'Chưa có quan hệ này ở Chặng 1.':changed?reference.before:'Giữ điều kiện và thứ tự xử lý ở Chặng 1.',after:added?reference.after:changed?reference.after:'Cùng quan hệ giữa hai trách nhiệm.'}
  }
 }
 input.edges.push({...edge('update','render','Trước: truyền trực tiếp premium'),change:changes.directPremium})
 // Do not infer completeness merely because a handler name already existed.
 const formed=(at:Checkpoint,e:RuntimeEvent)=>{
  if(e.change?.kind==='removed')return false
  if([changes.matches.id,changes.current.id].includes(e.change?.id??'')&&phase(at)<5)return false
  if(e.sources.some(s=>!findSymbol(at.id,s.file,s.symbol)))return false
  if(e.sources.some(s=>s.file==='pages/CreateQuotation.tsx'&&s.symbol==='CreateQuotation.save')&&built(at,'entry')&&!built(at,'complete'))return false
  return e.sources.length>0
 }
 const adapter:RuntimeAdapter={catalog,flows,comparison,consistencyOrder:0,eventAvailable:formed,descriptions:{...seed.descriptions,leave:'Bảo vệ rời form được kế thừa nguyên hành vi'},scenarios:seed.scenarios,
  mapEvidence:record=>{
   const mapped=seed.mapEvidence?.(record)??record
   if(mapped.flow!=='input-edit'||!mapped.path)return mapped
   const branch=mapped.path.includes('invalidate')||mapped.title.includes('hết hiệu lực')?'invalidate':'keep'
   const path=['input','draft','compare',branch,'update']
   // The target receipt policy is future at early checkpoints. Stop the
   // source explanation there; the rendered DOM remains observed separately.
   if(phase(cp)>=5)path.push('matches','render')
   return {...mapped,path}
  },
  explain:(flow,id,s,at)=>{
   const choices=outgoing(flow,id).filter(e=>e.change?.kind!=='removed')
   if(choices.length===1)return choices[0]
   if(flow.id==='product'&&id==='intent')return choices.find(e=>e.to===(s.runtimeScenario==='new'?'choose':s.runtimeScenario==='change'?'panel':undefined))
   if(flow.id==='input-edit'&&id==='draft')return choices.find(e=>e.to==='compare')
   return explainedEdge(flow,id,s,at)
  },
 }
 cache.set(cp.id,adapter);return adapter
}
