import manifest from '../../../stage2/revision-2.json'
import type { Checkpoint } from '../../workshop/catalog'
import { partForFile } from '../../workshop/catalog'
import type { Operation } from '../../workshop/operations'
import { stageTwoCheckpoints, stageTwoLessons } from '../catalog'

export const revisionCheckpoints: Checkpoint[] = [...stageTwoCheckpoints,...manifest.checkpoints as Checkpoint[]]
export const stageGroups = [
  {title:'Nhận yêu cầu mới', ids:['s2-00']},
  {title:'Chọn sản phẩm', ids:['s2-01-catalog','s2-02-selection','s2-03-switch']},
  {title:'Validation và tính phí', ids:['s2-04-validation','s2-05-pricing']},
  {title:'Nhất quán khi đổi/sửa', ids:['s2-06-consistency','s2-r2-ui']},
  {title:'Lưu và đọc lại', ids:['s2-r2-complete']},
]
export const revisionLessons = [...stageTwoLessons,
  {id:'s2-r2-ui',focus:['pages/SelectProduct.tsx','SelectProduct'],goal:'Refactor UX trước khi mở lưu B: đưa nội dung học sang Workshop, chọn sản phẩm trước form, gộp ngữ cảnh và panel xác nhận đổi. Dùng lại draft/validation/receipt và guard lưu B của Preview 2; hành vi tính/lưu tương đương.',try:'Chọn A/B → mở form. Mở Đổi sản phẩm, chọn rồi hủy: không đổi draft/phí. Xác nhận: giữ draft, phí hết hiệu lực; B tại mốc chuyển tiếp này vẫn chưa lưu.'},
  {id:'s2-r2-complete',focus:['mocks/storage.ts','createQuotation'],goal:'Mới: input có mã/phiên bản, POST lookup và tính lại theo catalog; lưu snapshot điều khoản/biểu phí và kết quả. GET đọc bản đã phát hành, adapter hẹp cho A cũ; bản lỗi bị cách ly khỏi danh sách nhưng byte gốc giữ lại. Dùng lại một form, công thức, client, MSW và lỗi/retry.',try:'A365 tính/lưu/reload; B365 lỗi →180 tính 813.699 →lưu →mở lại. Thử lỗi lưu một lần và retry chủ động; xem A cũ không ghi lại storage.'},
]
export const coordinates = (id:string) => { const step=Math.max(0,stageGroups.findIndex(group=>group.ids.includes(id)));return {step,sub:Math.max(0,stageGroups[step].ids.indexOf(id))} }
export const actions = stageGroups.map((group,step)=>group.ids.map((id,sub)=>({id:`${step}.${sub+1}`,sub,title:revisionCheckpoints.find(cp=>cp.id===id)!.title.replace(/^\d+(?:\.\d+)?[.]?\s+/,'')})))
export function revisionOperation(id:string): Operation {
  const after=revisionCheckpoints.find(cp=>cp.id===id)!, before=revisionCheckpoints.find(cp=>cp.id===after.previous)??after
  const {step,sub}=coordinates(id),lesson=revisionLessons.find(item=>item.id===id)!,[file,symbol]=lesson.focus
  const task={title:actions[step][sub].title,kind:'connect' as const,file,locator:symbol,symbol,change:lesson.goal,run:lesson.try,expected:after.ui}
  return {id:`${step}.${sub+1}`,step,sub,title:task.title,kind:task.kind,symbol,file,part:partForFile(file,step),before,after,task,sourceOnly:false,milestones:[],milestone:undefined,focus:{file,symbol,range:undefined,related:[],preview:undefined},destination:after,intention:lesson.goal,input:lesson.try,run:lesson.try,expected:after.ui,prerequisite:before.title,parallel:'Theo phụ thuộc của hành vi; helper và consumer cùng mốc.',next:revisionCheckpoints.find(cp=>cp.previous===id)?.title??'Dừng review Chặng 2; chưa triển khai Chặng 3.',group:task.title}
}
export const entryFor = (cp:Checkpoint) => cp.id.startsWith('s2-r2-')?'/products':'/quotations/new'
