import manifest from '../../stage2/revision-4.json'
import type { Checkpoint } from '../workshop/catalog'
import { partForFile, partById } from '../workshop/catalog'
import type { Operation } from '../workshop/operations'

export const revisionCheckpoints = manifest.checkpoints as Checkpoint[]
export const revisionLessons = manifest.checkpoints.map(cp=>({...cp,goal:cp.why,try:cp.run}))
const titles=['Baseline và đích Product','Catalog và chọn sản phẩm','Panel đổi sản phẩm','Validation và tính phí','Lưu và đọc lại']
export const stageGroups=titles.map((title,step)=>({title,ids:revisionCheckpoints.filter(cp=>cp.step===step).map(cp=>cp.id)}))
export const phase=(cp:Checkpoint)=>manifest.checkpoints.find(item=>item.id===cp.id)?.phase??0
export const built=(cp:Checkpoint,feature:string)=>manifest.checkpoints.find(item=>item.id===cp.id)?.features.includes(feature)??false
export const lessonAt=(cp:Checkpoint)=>revisionLessons.find(item=>item.id===cp.id)!
export const coordinates=(id:string)=>{const step=Math.max(0,stageGroups.findIndex(g=>g.ids.includes(id)));return {step,sub:Math.max(0,stageGroups[step].ids.indexOf(id))}}
export const actions=stageGroups.map((g,step)=>g.ids.map((id,sub)=>({id:`${step}.${sub+1}`,sub,title:revisionCheckpoints.find(cp=>cp.id===id)!.title})))
export function revisionOperation(id:string):Operation {
 const after=revisionCheckpoints.find(cp=>cp.id===id)??revisionCheckpoints[0],before=revisionCheckpoints.find(cp=>cp.id===after.previous)??after
 const {step,sub}=coordinates(after.id),lesson=revisionLessons.find(l=>l.id===after.id)!,[file,symbol]=lesson.focus
 const basePart=file==='components/ProductInformation.tsx'?partById('form'):file==='quotation/records.ts'?partById('read'):symbol==='calculateDraftPremium'?partById('pricing'):partForFile(file,step)
 const part={...basePart,teaching:lesson.goal,files:[{path:file,symbols:[symbol],reason:lesson.goal}]}
 const kind:Operation['kind']=lesson.observe?'observe':after.kind==='source'?'create':'connect'
 const task={title:after.title,kind,file,locator:symbol,symbol,change:lesson.goal,run:lesson.try,expected:after.ui}
 return {id:`${step}.${sub+1}`,step,sub,title:task.title,kind:task.kind,symbol,file,part,before,after,task,sourceOnly:after.kind==='source',milestones:[],milestone:undefined,focus:{file,symbol,range:undefined,related:[],preview:undefined},destination:after,intention:lesson.delta,input:lesson.origin,run:lesson.try,expected:after.ui,prerequisite:before.title,parallel:'Theo phụ thuộc source tại cùng checkpoint.',next:revisionCheckpoints.find(cp=>cp.previous===after.id)?.title??'Hoàn tất Chặng 2; dừng trước Chặng 3.',group:task.title}
}
export const entryFor=(cp:Checkpoint)=>lessonAt(cp).entry
export const archiveMapping:Record<string,string>={'s2-00':'s2-r4-00','s2-01-catalog':'s2-r4-catalog','s2-02-selection':'s2-r4-entry','s2-03-switch':'s2-r4-panel','s2-04-validation':'s2-r4-validation','s2-05-pricing':'s2-r4-pricing','s2-06-consistency':'s2-r4-pricing','s2-r2-ui':'s2-r4-panel','s2-r2-complete':'s2-r4-complete'}

Object.assign(archiveMapping,{'s2-r3-00':'s2-r4-00','s2-r3-catalog':'s2-r4-actions','s2-r3-entry':'s2-r4-entry','s2-r3-panel':'s2-r4-panel','s2-r3-validation':'s2-r4-revalidate','s2-r3-pricing':'s2-r4-summary','s2-r3-complete':'s2-r4-complete'})
