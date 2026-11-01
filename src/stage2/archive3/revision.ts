import manifest from '../../../stage2/revision-3.json'
import type { Checkpoint } from '../../workshop/catalog'
import { partForFile, partById } from '../../workshop/catalog'
import type { Operation } from '../../workshop/operations'

export const revisionCheckpoints = manifest.checkpoints as Checkpoint[]
export const stageGroups = [
 {title:'Baseline và đích Product',ids:['s2-r3-00']},
 {title:'Catalog và chọn sản phẩm',ids:['s2-r3-catalog','s2-r3-entry']},
 {title:'Panel đổi sản phẩm',ids:['s2-r3-panel']},
 {title:'Validation và tính phí',ids:['s2-r3-validation','s2-r3-pricing']},
 {title:'Lưu và đọc lại',ids:['s2-r3-complete']},
]
export const revisionLessons = [
 {id:'s2-r3-00',focus:['components/FixedInformation.tsx','FixedInformation'],goal:'Giữ Chặng 1 hoàn chỉnh làm baseline. Đích đối chiếu là Product hiện hành đã ghim theo yêu cầu người dùng; test/báo cáo không thay thế phê duyệt.',try:'Điền mẫu → tính A365 = 1.100.000. Đọc contract và FixedInformation; chưa có trang chọn sản phẩm.'},
 {id:'s2-r3-catalog',focus:['pages/SelectProduct.tsx','SelectProduct'],goal:'Thêm catalog A/B và route /products ngay từ đầu. Trang chọn render catalog, nút tạo chưa nối; form baseline vẫn nguyên. Nội dung bài học ở Workshop.',try:'Preview mở /products: hai sản phẩm, nút Tạo bản chào chưa nối. Không có catalog/selector trong form.'},
 {id:'s2-r3-entry',focus:['pages/SelectProduct.tsx','QuotationEntry'],goal:'Nối lựa chọn trên /products → URL product → kiểm mã → initialCode → một form và ngữ cảnh gọn. Mã lạ hiện lỗi, thiếu mã quay về /products. Lưu và công thức B chưa nối.',try:'Chọn A hoặc B trên /products. Form đúng tên, draft trống; chi tiết thu gọn. A vẫn tính, B chưa tính. Không có selector đổi trực tiếp.'},
 {id:'s2-r3-panel',focus:['components/ProductInformation.tsx','ProductInformation'],goal:'Thêm panel với candidate cục bộ; hủy/Escape chỉ đóng panel. Xác nhận gọi changeProduct: giữ draft, bỏ phí, guard mã trùng/đang lưu. Không ép tiền/ngày.',try:'Mở A, điền mẫu, tính → chọn B trong panel rồi hủy: giữ A/draft/phí. Mở lại và xác nhận: B, draft giữ, phí hết hiệu lực.'},
 {id:'s2-r3-validation',focus:['quotation/rules.ts','validateDraft'],goal:'Nối onBlur/validatedInput và cập nhật lỗi sau sửa/đổi vào validation nhận mã. Lấy giới hạn catalog; chuẩn hóa ProductInput có mã/phiên bản, chưa nối POST. Công thức B chưa hình thành.',try:'Chọn B, điền mẫu365 → Tính phí: lỗi tối đa180. Nhập1 triệu: lỗi tối thiểu B. Đổi A: phản hồi lỗi theo A.'},
 {id:'s2-r3-pricing',focus:['quotation/rules.ts','calculateDraftPremium'],goal:'Nối công thức và receipt mã/phiên bản/tiền/hai ngày. currentPremium kiểm receipt khớp; giữ policy sửa tiền/ngày từ Chặng1, thêm kiểm sản phẩm/phiên bản và revalidation. Lưu chưa nối.',try:'A365=1.100.000; B180=813.699. Sửa tên giữ phí; sửa tiền/ngày hoặc xác nhận đổi bỏ phí. Hủy panel giữ phí. Lưu khóa.'},
 {id:'s2-r3-complete',focus:['quotation/records.ts','parseQuotation'],goal:'Nối POST và mock tự kiểm/tính; lưu mã/phiên bản + snapshot điều khoản + phí. GET đọc lịch sử; adapter A cũ hẹp, cách ly row sai giữ byte gốc. Khớp Product ghim qua adapter công khai.',try:'A/B tính/lưu/mở lại/reload; B365 lỗi →180=813.699. Lỗi lưu giữ form, retry chủ động. Đọc A cũ không ghi lại dữ liệu.'},
]
export const coordinates=(id:string)=>{const step=Math.max(0,stageGroups.findIndex(g=>g.ids.includes(id)));return {step,sub:Math.max(0,stageGroups[step].ids.indexOf(id))}}
export const actions=stageGroups.map((g,step)=>g.ids.map((id,sub)=>({id:`${step}.${sub+1}`,sub,title:revisionCheckpoints.find(cp=>cp.id===id)!.title})))
export function revisionOperation(id:string):Operation {
 const after=revisionCheckpoints.find(cp=>cp.id===id)??revisionCheckpoints[0],before=revisionCheckpoints.find(cp=>cp.id===after.previous)??after
 const {step,sub}=coordinates(after.id),lesson=revisionLessons.find(l=>l.id===after.id)!,[file,symbol]=lesson.focus
 const basePart=file==='components/ProductInformation.tsx'?partById('form'):file==='quotation/records.ts'?partById('read'):symbol==='calculateDraftPremium'?partById('pricing'):partForFile(file,step)
 const part={...basePart,teaching:lesson.goal,files:[{path:file,symbols:[symbol],reason:lesson.goal}]}
 const task={title:after.title,kind:'connect' as const,file,locator:symbol,symbol,change:lesson.goal,run:lesson.try,expected:after.ui}
 return {id:`${step}.${sub+1}`,step,sub,title:task.title,kind:task.kind,symbol,file,part,before,after,task,sourceOnly:false,milestones:[],milestone:undefined,focus:{file,symbol,range:undefined,related:[],preview:undefined},destination:after,intention:lesson.goal,input:lesson.try,run:lesson.try,expected:after.ui,prerequisite:before.title,parallel:'Theo phụ thuộc source tại cùng checkpoint.',next:revisionCheckpoints.find(cp=>cp.previous===after.id)?.title??'Hoàn tất Chặng 2; dừng trước Chặng 3.',group:task.title}
}
export const entryFor=(cp:Checkpoint)=>cp.order===0?'/quotations/new':'/products'
export const archiveMapping:Record<string,string>={'s2-00':'s2-r3-00','s2-01-catalog':'s2-r3-catalog','s2-02-selection':'s2-r3-entry','s2-03-switch':'s2-r3-panel','s2-04-validation':'s2-r3-validation','s2-05-pricing':'s2-r3-pricing','s2-06-consistency':'s2-r3-pricing','s2-r2-ui':'s2-r3-panel','s2-r2-complete':'s2-r3-complete'}
