import type { Checkpoint } from '../../workshop/catalog'
import type { RunPlan, RunTask, TaskKind } from '../../workshop/run/model'
import { findSymbol } from '../../workshop/source'
export const revisionScenarios:Record<string,string>={ 'select-product':'Chọn sản phẩm rồi tạo bản chào','a-save':'A tính / lưu / reload','b-save':'B365 lỗi →180 tính / lưu / mở lại','switch':'Đổi sản phẩm làm phí hết hiệu lực','retry-save':'Lưu lỗi / giữ dữ liệu / retry chủ động','legacy-read':'Đọc bản chào A gốc' }
export function revisionRunPlan(checkpoint:Checkpoint, requested:string):RunPlan {
  const scenario=Object.hasOwn(revisionScenarios,requested)?requested:'a-save'
  const task=(kind:TaskKind,title:string,target:string,file:string,symbol:string,extra:Partial<RunTask>={}):RunTask=>({id:kind,kind,title,instruction:title,target,resultTarget:target,sources:[{file,symbol}],explanation:'DOM/click/input, nội dung UI và request/response MSW được quan sát thật. Hàm, state, render và persistence bên trong là diễn giải source.',...extra})
  const form='pages/CreateQuotation.tsx'
  const open=task('open-product','Chọn Tài sản cơ bản → Tạo bản chào','root','pages/SelectProduct.tsx','SelectProduct',{value:'BASIC_PROPERTY'})
  const fill=task('fill','Điền dữ liệu mẫu 1 tỷ /365 ngày','fill',form,'CreateQuotation.updateDraft',{resultTarget:'customer'})
  const calculate=task('calculate','Tính phí A · tổng1.100.000 VND','calculate',form,'CreateQuotation.calculate',{resultTarget:'premium',expectedTotal:1100000})
  const save=task('save','Lưu bản chào qua mock API','save',form,'CreateQuotation.save',{resultTarget:'saved'})
  const reload=task('reload-record','Reload bản chào đã lưu','saved','quotation/records.ts','parseQuotation')
  const reopen=task('reopen','Về danh sách rồi mở lại bản chào','saved','pages/QuotationList.tsx','QuotationList')
  const switchB=task('switch-product','Đổi sản phẩm → chọn B → xác nhận','productInfo',form,'CreateQuotation.changeProduct',{resultTarget:'premium'})
  const invalid={...calculate,title:'B giữ365 ngày → lỗi tại Ngày kết thúc',expected:'invalid' as const,expectedField:'endDate',resultTarget:'endDate-error'}
  const period=task('set-period','Đặt ngày kết thúc = ngày bắt đầu +180 ngày','endDate',form,'CreateQuotation.updateDraft',{days:180,resultTarget:'period'})
  const b={...calculate,title:'Tính B · tổng813.699 VND',expectedTotal:813699}
  let tasks:RunTask[]
  if(scenario==='select-product')tasks=[open]
  else if(scenario==='b-save')tasks=[{...open,title:'Chọn Tài sản mở rộng → Tạo bản chào',value:'EXTENDED_PROPERTY'},fill,invalid,period,b,save,reopen,reload]
  else if(scenario==='switch')tasks=[open,fill,calculate,switchB,invalid,period,b,task('return-product','Đổi về A → xác nhận · cần tính lại','productInfo',form,'CreateQuotation.changeProduct',{resultTarget:'premium'})]
  else if(scenario==='retry-save')tasks=[open,fill,calculate,task('arm-error','Bật lỗi lần lưu kế tiếp','armError','_workshop/tools.ts','mountTools',{resultTarget:'toolStatus'}),{...save,kind:'save-error',title:'Lưu → HTTP500, giữ draft/phí',resultTarget:'saveError'},{...save,kind:'retry',manual:true,title:'Bạn bấm Lưu lần nữa để chủ động retry'},reload]
  else if(scenario==='legacy-read')tasks=[task('legacy-record','Mở bản A gốc từ công cụ của phiên riêng','legacyRecord','_workshop/tools.ts','mountTools',{resultTarget:'saved'}),reload]
  else tasks=[open,fill,calculate,save,reload,reopen]
  const supported=checkpoint.id==='s2-r2-complete'||['select-product','switch','a-save','retry-save'].includes(scenario)
  return {scenario:scenario as RunPlan['scenario'],title:revisionScenarios[scenario],checkpoint,entry:'/products',supported,reason:supported?'Phiên dữ liệu riêng, không ảnh hưởng review hoặc tiến độ.':'Mốc refactor còn giữ khóa lưu B; chọn mốc hoàn chỉnh để chạy kịch bản lưu/đọc.',tasks:tasks.map((item,index)=>({...item,id:`${index}-${item.kind}`,sources:item.sources.map(link=>!findSymbol(checkpoint.id,link.file,link.symbol)&&link.symbol==='parseQuotation'?{file:'quotation/rules.ts',symbol:'parseQuotation'}:link).filter(link=>findSymbol(checkpoint.id,link.file,link.symbol))}))}
}
