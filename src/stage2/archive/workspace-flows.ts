import type { Checkpoint } from '../../workshop/catalog'
import type { RuntimeAdapter } from '../../workshop/RuntimeFlow'
import { runtimeFlows, explainedEdge, outgoing } from '../../workshop/runtime-flows'
import type { RuntimeFlow, RuntimeEvent, FlowEdge, FlowSource } from '../../workshop/runtime-flows'
import { findSymbol } from '../../workshop/source'
import { revisionCheckpoints as catalog } from './revision'

const f='pages/CreateQuotation.tsx',r='quotation/rules.ts',p='components/ProductInformation.tsx'
function source(file:string,symbol:string):FlowSource{return {file,symbol,since:catalog.find(cp=>findSymbol(cp.id,file,symbol))?.id??'s2-r2-complete'}}
function event(id:string,title:string,x:number,y:number,file:string,symbol:string,output:string,kind:RuntimeEvent['kind']='Gọi hàm',target?:string):RuntimeEvent{
 return {id,title,x,y,kind,sources:[source(file,symbol)],input:'Lựa chọn và draft hiện tại tại checkpoint.',output,branches:'Chỉ theo nhánh phù hợp source; lựa chọn graph không thực thi hành vi.',timing:'Diễn giải từ source. Không phải bằng chứng hàm/state/render đã chạy.',ui:{kind:target?'result':'internal',target,try:'Tự thao tác trên preview hoặc mở Chạy thử để ghi nhận DOM/MSW thật.'}}
}
const edge=(from:string,to:string,label=''):FlowEdge=>({id:from+'~'+to,from,to,label})
const cache=new Map<string,RuntimeAdapter>()
export function runtimeAdapter(cp:Checkpoint):RuntimeAdapter{
 const cached=cache.get(cp.id);if(cached)return cached
 const flows:RuntimeFlow[]=runtimeFlows.filter(flow=>flow.id!=='leave').map(flow=>({...flow,edges:flow.edges.map(e=>({...e})),events:flow.events.map(item=>({...item,sources:item.sources.map(s=>source(s.file,s.symbol)),ui:{...item.ui}}))}))
 const input=flows.find(flow=>flow.id==='input-edit')!
 input.events.find(e=>e.id==='draft')!.output='Dùng lại quy tắc sửa tiền/ngày làm phí hết hiệu lực từ baseline Chặng1 hoàn chỉnh.'
 input.edges=input.edges.filter(e=>e.from!=='draft'||e.to==='compare').map(e=>e.from==='draft'?{...e,label:'Dùng lại policy Chặng1'}:e)
 input.events.find(e=>e.id==='update')!.output=cp.order>=6?'setDraft(next); sau khi đã validation thì kiểm tra lại lỗi theo sản phẩm đang chọn.':'setDraft(next); phản hồi lỗi theo khả năng source tại mốc này.'
 const calculate=flows.find(flow=>flow.id==='calculate')!
 calculate.events.find(e=>e.id==='calculate')!.output=cp.order>=5?'validatedInput và calculateDraftPremium(draft, productCode) theo sản phẩm hiện tại.':'Kiểm tra khả năng sản phẩm/validatedInput theo source; B chưa nối công thức.'
 calculate.events.find(e=>e.id==='validate')!.output=cp.order>=4?'validateAndBuildInput nhận productCode; validateDraft → getPropertyProduct → giới hạn; lỗi trả về đúng trường.':'Validation A cố định ở mốc này; không giả đã có validation B.'
 const price=calculate.events.find(e=>e.id==='premium')!
 price.sources=cp.order>=5?[source(r,'calculateDraftPremium'),source(r,'calculatePremium')]:[source(r,'calculatePremium')]
 price.output=cp.order>=5?'Tra tỷ lệ sản phẩm; net=round(sum×annualRate×days/365); tax=round(net×taxRate); total=net+tax. Receipt gắn code/version/tiền/hai ngày.':'Công thức A cố định:0,1% năm; net làm tròn trước thuế10%.'
 calculate.events.find(e=>e.id==='state')!.output=cp.order>=5?'setPremium(receipt), setCalculatedBefore(true); chỉ render receipt còn khớp đầu vào theo khả năng checkpoint.':'Giữ Premium A trong state và render qua props.'
 calculate.events.find(e=>e.id==='render')!.output=cp.order>=5?'Tên sản phẩm/phiên bản, tỷ lệ, ngày và kết quả từ receipt; A365=1.100.000, B180=813.699.':'Presentation A; component không viết công thức.'
 if(cp.order>=2&&cp.order<5){
  const next=calculate.edges.find(e=>e.from==='validate'&&e.to==='premium')!;next.to='product-guard';next.id='validate~product-guard'
  calculate.events.push(event('product-guard','Sản phẩm có công thức ở mốc này?',2,2,f,'CreateQuotation.calculate','A đi tiếp; B dừng theo productSupported.','Nhánh'),event('unsupported','B chưa nối công thức → dừng',3,3,f,'CreateQuotation.productSupported','Không tạo kết quả phí B. Giữ lỗi/notice đúng source của checkpoint.','Render','productInfo'))
  calculate.edges.push(edge('product-guard','premium','A được hỗ trợ'),edge('product-guard','unsupported','B chưa hỗ trợ'))
  if(cp.order<4){
   calculate.edges=calculate.edges.filter(e=>!(e.from==='calculate'&&e.to==='validate')&&!(e.from==='validate'&&e.to==='product-guard')&&!(e.from==='product-guard'&&e.to==='premium'))
   calculate.edges.push(edge('calculate','product-guard'),edge('validate','premium','Dữ liệu A hợp lệ'))
   if(cp.order===3)calculate.edges.push(edge('product-guard','validate','A được hỗ trợ'))
   else {calculate.events.find(e=>e.id==='unsupported')!.title='Mốc1.2 tạm khóa tính/lưu cả A và B';calculate.events.find(e=>e.id==='product-guard')!.output='productSupported=false; cả A và B đều dừng tại guard trước validation.'}
  }
 }
 const save=flows.find(flow=>flow.id==='save')!
 save.events.find(e=>e.id==='guard')!.output=cp.order>=8?'saveInFlight → validatedInput theo sản phẩm → currentPremium khớp mã/phiên bản/đầu vào. Hợp lệ mới POST.':'saveInFlight và khóa B theo khả năng mốc; validatedInput/phí hợp lệ mới lưu A.'
 save.events.find(e=>e.id==='persist')!.output=cp.order>=8?'Mock parse code/version, lookup catalog và tự tính; lưu productSnapshot + premium, cấp ID, append mà không xóa row cũ.':'Mock A tự kiểm input và tính lại; chưa có contract lưu B.'
 if(cp.order>=8){save.events.find(e=>e.id==='persist')!.sources.push(source('quotation/products.ts','productTerms'),source(r,'parseQuotationInput'));save.events.find(e=>e.id==='response')!.sources=save.events.find(e=>e.id==='response')!.sources.filter(s=>s.symbol!=='parseQuotation').concat(source('quotation/records.ts','parseQuotation'))}
 if(cp.order>=2&&cp.order<8){save.events.push(event('product-unsupported','B chưa nối lưu ở mốc này',-1,3,f,'CreateQuotation.save','Guard dừng trước API; nút lưu B cũng khóa.','Render','save'));save.edges.push(edge('guard','product-unsupported','B chưa hỗ trợ'))}
 const read=flows.find(flow=>flow.id==='read')!
 if(cp.order>=8){
  read.events.find(e=>e.id==='get')!.sources.push(source('mocks/storage.ts','readQuotationReport'),source('quotation/records.ts','parseQuotation'))
  read.events.find(e=>e.id==='get')!.output='Đọc từng record bằng snapshot đã phát hành; adapter hẹp cho A gốc. Row sai bị cách ly và giữ dữ liệu gốc; GET không tái báo giá theo catalog hiện tại.'
  read.events.find(e=>e.id==='data')!.output='Hiện sản phẩm/phiên bản và phí đã lưu; không viết lại lịch sử khi GET.'
  read.events.push(event('isolated','Có row sai → cảnh báo, giữ row hợp lệ',4,2,'mocks/storage.ts','readQuotationReport','Danh sách vẫn đọc được. Không reset/seed hoặc xóa dữ liệu lỗi.','Render','readData'))
  read.edges.push(edge('get','isolated','Một phần dữ liệu không hợp lệ'))
 }
 const product:RuntimeFlow={id:'product',title:'Chọn / đổi sản phẩm',premise:'Một graph cho lựa chọn ban đầu và đổi trên draft; xác nhận/hủy có nhánh riêng. Không nhập liệu hay gửi request khi đọc.',events:[
  event('intent','Bắt đầu chọn hoặc đổi sản phẩm',1,0,f,'CreateQuotation','Chọn nhánh theo màn hình đang đọc.','Nhánh'),
  event('choose','Chọn sản phẩm → mở form',0,1,'pages/SelectProduct.tsx','QuotationEntry','URL code hợp lệ truyền initialCode; mã không hợp lệ không thành A.','Thao tác','productSelection'),
  event('panel','Mở panel / selector sản phẩm',2,1,p,cp.order>=7?'ProductInformation.jsx.textButton':'ProductInformation.selector',cp.order>=7?'Mở panel, chưa đổi form; ứng viên nằm trong state cục bộ.':'Selector ở mốc cũ đổi trực tiếp, chưa có panel xác nhận.','Thao tác','productInfo'),
  event('decision','Xác nhận hay giữ sản phẩm hiện tại?',2,2,p,'ProductInformation.candidate','Ứng viên khác mới được xác nhận. Hủy/Escape không áp dụng.','Nhánh'),
  event('cancel','Hủy → giữ draft, sản phẩm và phí',3,3,p,'ProductInformation.jsx.secondaryButton','Chỉ close dialog; không gọi onProductChange.','Thao tác','productInfo'),
  event('change','Áp dụng lựa chọn đã xác nhận',1,3,f,'CreateQuotation.changeProduct','setProductCode; giữ draft. Từ1.3 setPremium(null); từ2.3 validate lại lỗi.','State','productInfo'),
  event('same','Cùng sản phẩm / đang lưu → giữ nguyên',0,4,f,'CreateQuotation.changeProduct','Guard return; không có thay đổi hoặc POST.','State'),
  event('invalidate','Sản phẩm khác → phí hết hiệu lực',2,4,f,'CreateQuotation.changeProduct.site:call:setPremium[1]','Bỏ phí cũ ngay, không sửa tiền/ngày để ép hợp lệ; về A vẫn tính lại.','State','premiumStale'),
  event('render','Render ngữ cảnh và trạng thái mới',1,5,p,'ProductInformation','Props product đổi; draft giữ. Điều kiện validation/tính/lưu theo checkpoint.','Render','productInfo'),
 ],edges:[edge('intent','choose','Tạo bản mới'),edge('intent','panel','Đổi trên draft'),edge('choose','render'),edge('panel',cp.order>=7?'decision':'change'),edge('decision','cancel','Hủy / Escape'),edge('decision','change','Xác nhận mã khác'),edge('change','same','Cùng mã / saving'),edge('change','invalidate','Mã khác'),edge('invalidate','render'),edge('cancel','render'),edge('same','render')]}
 flows.unshift(product)
 const adapter:RuntimeAdapter={catalog,flows,consistencyOrder:0,descriptions:{product:'Catalog → lựa chọn → draft/phí','input-edit':'Nhập/sửa → state và hiệu lực phí',calculate:'Quy tắc sản phẩm → lỗi hoặc receipt',save:'Guard → mock tự tính/lưu → lỗi hoặc thành công',read:'GET → lịch sử đã lưu / adapter A gốc'},
  scenarios:{product:[['choose','Tự chọn nhánh'],['new','Tạo mới'],['change','Đổi sản phẩm']],calculate:[['choose','Tự chọn tại điểm rẽ'],['valid','Dữ liệu hợp lệ'],['invalid','Dữ liệu có lỗi']],save:[['choose','Tự chọn từng nhánh'],['success','Đủ điều kiện · thành công'],['request-error','Request lỗi'],['busy','Chặn gửi lặp'],['invalid','Input sai'],['no-premium','Phí chưa hợp lệ']]},
  mapEvidence:record=>record.event==='select'?{...record,flow:'product',event:'choose'}:record.flow==='read'&&record.event==='read'?{...record,event:'data'}:record.event==='invalidate'&&record.title.includes('đổi sản phẩm')?{...record,flow:'product'}:record,
  explain:(flow,id,s,at)=>{
   const choices=outgoing(flow,id);if(choices.length===1)return choices[0]
   if(flow.id==='product'&&id==='intent')return choices.find(e=>e.to===(s.runtimeScenario==='new'?'choose':s.runtimeScenario==='change'?'panel':undefined))
   if(flow.id==='input-edit'&&id==='draft')return choices.find(e=>e.to==='compare')
   if(flow.id==='calculate'&&id==='validate')return choices.find(e=>e.to===(s.runtimeScenario==='invalid'?'stop':s.runtimeScenario==='valid'?(at.order===4?'product-guard':'premium'):undefined))
   if(flow.id==='save'&&id==='guard'&&at.order===2)return choices.find(e=>e.to==='product-unsupported')
   return explainedEdge(flow,id,s,at)
  },
 }
 cache.set(cp.id,adapter);return adapter
}
