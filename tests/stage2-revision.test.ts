import { expect,it } from 'vitest'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { actions, coordinates, revisionCheckpoints, revisionOperation, stageGroups } from '../src/stage2/archive/revision'
import { revisionRunPlan, revisionScenarios } from '../src/stage2/archive/runs'
import { findSymbol } from '../src/workshop/source'
import frozen from '../stage2/preview2-baseline.json'
import published from '../stage2/manifest.json'
const read=(path:string)=>readFileSync(path,'utf8')
it('bảy mốc phát hành không đổi; revision dùng năm bước lớn và trình tự source có căn cứ',()=>{
  expect(published).toEqual(frozen)
  expect(stageGroups).toHaveLength(5)
  expect(stageGroups.flatMap(group=>group.ids)).toEqual(revisionCheckpoints.map(cp=>cp.id))
  for(const cp of revisionCheckpoints){const {step,sub}=coordinates(cp.id);expect(actions[step][sub]).toBeDefined();const op=revisionOperation(cp.id);expect(op.after.id).toBe(cp.id);expect(findSymbol(cp.id,op.file,op.symbol)).toBeDefined()}
})
it('hai mốc chuyển tiếp có hash/range source thật và mỗi kịch bản có consumer trong mốc hỗ trợ',()=>{
  for(const cp of revisionCheckpoints.slice(-2))for(const file of cp.files)expect(createHash('sha256').update(read(`checkpoints/${cp.id}/${file.path}`)).digest('hex')).toBe(file.sha256)
  for(const cp of revisionCheckpoints.slice(-2))for(const scenario of Object.keys(revisionScenarios)){
    const plan=revisionRunPlan(cp,scenario)
    if(!plan.supported)continue
    for(const task of plan.tasks){expect(task.sources.length,task.kind).toBeGreaterThan(0);for(const link of task.sources)expect(findSymbol(cp.id,link.file,link.symbol),task.kind).toBeDefined()}
    if(scenario==='retry-save')expect(plan.tasks.find(task=>task.kind==='retry')?.manual).toBe(true)
  }
})
it('hai chặng dùng cùng khung và các vùng đọc/preview, không còn shell Chặng2 riêng',()=>{
  for(const path of ['src/workshop/Workshop.tsx','src/stage2/StageTwoAdapter.tsx'])expect(read(path)).toContain('<WorkshopFrame')
  for(const component of ['BuildSession','SourcePanel','Preview','SubstepProgress'])expect(read('src/workshop/'+component+'.tsx')).toContain('export function')
  expect(read('src/stage2/StageTwoWorkshop.tsx')).not.toContain('className=')
})
