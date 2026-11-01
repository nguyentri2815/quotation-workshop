import type { Checkpoint } from '../workshop/catalog'
import type { RunPlan, RunTask, TaskKind } from '../workshop/run/model'
import { findSymbol } from '../workshop/source'
import { entryFor, phase, lessonAt } from './revision'
export const revisionScenarios:Record<string,string>={catalog:'Quan sát catalog /products','select-product':'Chọn sản phẩm rồi mở form','a-calculate':'A tính phí tại mốc','a-save':'A tính / lưu / reload','b-validation':'Validation B365 → lỗi180 ngày','b-calculate':'B180 tính phí','b-save':'B365 lỗi →180 tính / lưu / mở lại',switch:'Panel hủy / xác nhận / giữ draft / bỏ phí','retry-save':'Lưu lỗi / giữ dữ liệu / retry chủ động','legacy-read':'Đọc bản chào A gốc'}
export const scenarioMinimum:Record<string,number>={catalog:1,'select-product':2,'a-calculate':0,'a-save':6,'b-validation':4,'b-calculate':5,'b-save':6,switch:3,'retry-save':6,'legacy-read':6}
export function scenariosFor(cp:Checkpoint){return Object.entries(revisionScenarios).filter(([id])=>phase(cp)>=scenarioMinimum[id]&&(phase(cp)!==1||id==='catalog'))}
export function defaultScenario(cp:Checkpoint){return phase(cp)===0?'a-calculate':phase(cp)===1?'catalog':phase(cp)===2?'select-product':phase(cp)===3?'switch':phase(cp)===4?'b-validation':phase(cp)===5?'b-calculate':'a-save'}
export function revisionRunPlan(checkpoint:Checkpoint,requested:string):RunPlan {
 if(!Object.hasOwn(revisionScenarios,requested))return {scenario:'select-product',title:'Tình huống không được hỗ trợ',checkpoint,entry:entryFor(checkpoint),supported:false,reason:`Không có tình huống “${requested}” ở revision4; không tự chạy tình huống thay thế.`,tasks:[]}
 const scenario=Object.hasOwn(revisionScenarios,requested)?requested:defaultScenario(checkpoint)
 const task=(kind:TaskKind,title:string,target:string,file:string,symbol:string,extra:Partial<RunTask>={}):RunTask=>({id:kind,kind,title,instruction:title,target,resultTarget:target,sources:[{file,symbol}],explanation:'DOM/click/input và MSW là quan sát thật; hàm/state/render là diễn giải source.',...extra})
 const f='pages/CreateQuotation.tsx'
 const open=task('open-product','Chọn Tài sản cơ bản trên /products → Tạo bản chào','root','pages/SelectProduct.tsx','SelectProduct',{value:'BASIC_PROPERTY'})
 const openB={...open,title:'Chọn Tài sản mở rộng trên /products → Tạo bản chào',value:'EXTENDED_PROPERTY'}
 const fill=task('fill','Điền mẫu 1 tỷ /365 ngày','fill',f,'CreateQuotation.updateDraft',{resultTarget:'customer'})
 const calculate=task('calculate','Tính A · tổng1.100.000 VND','calculate',f,'CreateQuotation.calculate',{resultTarget:'premium',expectedTotal:1100000})
 const invalid={...calculate,title:'B365 → lỗi Ngày kết thúc tối đa180 ngày',expected:'invalid' as const,expectedField:'endDate',resultTarget:'endDate-error',sources:[{file:'quotation/rules.ts',symbol:'validateDraft'},{file:f,symbol:'CreateQuotation.validatedInput'}]}
 const period=task('set-period','Đặt ngày kết thúc = ngày bắt đầu +180 ngày','endDate',f,'CreateQuotation.updateDraft',{days:180,resultTarget:'period'})
 const priceB={...calculate,title:'Tính B180 · tổng813.699 VND',expectedTotal:813699,sources:[{file:'quotation/rules.ts',symbol:'calculateDraftPremium'},{file:f,symbol:'CreateQuotation.calculate'}]}
 const save=task('save','Lưu bản chào qua mock API','save',f,'CreateQuotation.save',{resultTarget:'saved'})
 const reload=task('reload-record','Reload bản chào đã lưu','saved','quotation/records.ts','parseQuotation')
 const reopen=task('reopen','Về danh sách rồi mở lại bản chào','saved','pages/QuotationList.tsx','QuotationList')
 const panelSource={file:'components/ProductInformation.tsx',symbol:'ProductInformation'}
 const change=task('switch-product','Mở panel → chọn B → xác nhận đổi','productInfo',f,'CreateQuotation.changeProduct',{resultTarget:'premium',sources:[panelSource,{file:f,symbol:'CreateQuotation.changeProduct'}]})
 let tasks:RunTask[]
 if(scenario==='catalog')tasks=[task('inspect-catalog',lessonAt(checkpoint).provenance==='single'?'Quan sát một sản phẩm A ở /products':'Quan sát hai sản phẩm ở /products','root','pages/SelectProduct.tsx','SelectProduct',{count:lessonAt(checkpoint).provenance==='single'?1:2})]
 else if(scenario==='select-product')tasks=[openB]
 else if(scenario==='a-calculate')tasks=[...(phase(checkpoint)>=2?[open]:[]),fill,calculate]
 else if(scenario==='b-validation')tasks=[openB,fill,invalid]
 else if(scenario==='b-calculate')tasks=[openB,fill,invalid,period,priceB]
 else if(scenario==='b-save')tasks=[openB,fill,invalid,period,priceB,save,reopen,reload]
 else if(scenario==='switch')tasks=[open,fill,calculate,task('cancel-product','Panel chọn B rồi hủy → giữ A, draft và phí','productInfo',panelSource.file,panelSource.symbol),change,...(phase(checkpoint)>=5?[invalid,period,priceB]:[]),task('return-product','Panel xác nhận về A → phải tính lại','productInfo',f,'CreateQuotation.changeProduct',{resultTarget:'premium'})]
 else if(scenario==='retry-save')tasks=[open,fill,calculate,task('arm-error','Gây lỗi lần lưu kế tiếp trong phiên riêng','armError','_workshop/tools.ts','mountTools',{resultTarget:'toolStatus'}),{...save,kind:'save-error',title:'Lưu → HTTP500; giữ draft/phí',resultTarget:'saveError'},{...save,kind:'retry',manual:true,title:'Bạn chủ động bấm Lưu để thử lại'},reload]
 else if(scenario==='legacy-read')tasks=[task('legacy-record','Mở bản chào A gốc trong phiên riêng','legacyRecord','_workshop/tools.ts','mountTools',{resultTarget:'saved'}),reload]
 else tasks=[open,fill,calculate,save,reload,reopen]
 const supported=scenariosFor(checkpoint).some(([id])=>id===scenario)
 return {scenario:scenario as RunPlan['scenario'],title:revisionScenarios[scenario],checkpoint,entry:entryFor(checkpoint),supported,reason:supported?'Chỉ dùng khả năng đã hình thành; dữ liệu phiên riêng, không ghi tiến độ.':'Tình huống chưa hình thành tại mốc này. Chọn mốc tương ứng trong revision4.',tasks:tasks.map((t,i)=>({...t,id:i+'-'+t.kind,sources:t.sources.filter(s=>findSymbol(checkpoint.id,s.file,s.symbol))}))}
}
