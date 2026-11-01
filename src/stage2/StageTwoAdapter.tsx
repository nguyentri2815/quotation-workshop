import { RunScopePicker } from '../workshop/run/RunScopePicker'
import { stepRunPlan } from '../workshop/run/step-plans'
import type { RunPlan } from '../workshop/run/model'
import { useEffect, useRef, useState } from 'react'
import { Check } from 'lucide-react'
import { WorkshopFrame } from '../workshop/WorkshopFrame'
import { SubstepProgress } from '../workshop/SubstepProgress'
import { BuildSession } from '../workshop/BuildSession'
import { Overview } from '../workshop/Overview'
import { Preview } from '../workshop/Preview'
import { PreviewGuideProvider } from '../workshop/PreviewGuide'
import { useSplitLayout } from '../workshop/useSplitLayout'
import { useRunSession } from '../workshop/run/useRunSession'
import { RunPreview, RunToolbar } from '../workshop/run/RunControls'
import { RunWorkspace } from '../workshop/run/RunWorkspace'
import type { Selection } from '../workshop/navigation'
import { selectionAt, useSelection } from '../workshop/navigation'
import { normalizeFlow } from '../workshop/runtime-flows'
import { actions, archiveMapping, coordinates, entryFor, revisionCheckpoints, revisionLessons, revisionOperation, stageGroups } from './revision'
import { revisionRunPlan, scenariosFor, defaultScenario } from './runs'
import { stageOverview, stageDependencies, stageSections, stageRole, stageSectionChange, taskFocus } from './workspace-data'
import { runtimeAdapter } from './workspace-flows'
import styles from './revision.module.css'
import shell from '../workshop/workshop.module.css'

type StageSelection=Selection&{requirement:string}
function initialSelection(hash=location.hash):StageSelection {
  const p=new URLSearchParams(hash.slice(1)),requested=p.get('checkpoint')
  const step=Number(p.get('step')??0),sub=Number(p.get('sub')??0)
  const id=revisionCheckpoints.find(cp=>cp.id===requested)?.id??stageGroups[step]?.ids[sub]??'s2-r4-00'
  const op=revisionOperation(id),base=selectionAt(0),cp=p.get('side')==='before'?op.before:op.after
  const value={...base,...coordinates(id),mark:id,file:p.get('file')??op.file,symbol:p.get('symbol')??op.symbol,requirement:p.get('impact')??''}
  const flow=normalizeFlow({compareChanges:p.get('compareChanges')==='true',overviewMode:p.get('overviewMode')==='runtime'||p.get('view')==='flow'?'runtime':'structure',runtimeFlow:p.get('runtimeFlow')??'input-edit',runtimeEvent:p.get('runtimeEvent')??undefined,runtimeScenario:p.get('scenario')??'choose',runtimeField:p.get('field')??'customerName',runtimeHadPremium:p.get('hadPremium')==='true',runtimePath:p.get('path')??''},runtimeAdapter(cp).flows)
  return {...value,...flow,compareChanges:p.get('compareChanges')==='true',component:(p.get('component')??'form') as Selection['component'],tab:p.get('tab')==='overview'||p.get('view')==='flow'?'overview':'build',side:p.get('side')==='before'?'before':p.get('side')==='diff'||p.get('view')==='diff'?'diff':'after',buildView:p.get('buildView')==='dependencies'||p.get('view')==='dependencies'?'dependencies':'code',explorer:p.get('explorer')==='physical'?'physical':'functional',section:p.get('section')??'',position:Math.max(0,Number(p.get('position'))||0),dependencyScope:p.get('dependencyScope')==='step'?'step':'current',dependencyNode:p.get('dependencyNode')??'',dependencyRelation:p.get('dependencyRelation')??'',dependencyLocation:Math.max(0,Number(p.get('dependencyLocation'))||0)}
}
interface StageProgress {checked:number[];notes:Record<string,string>}
const progressKey='quotation-workshop.stage2.progress.v4'
function loadProgress():StageProgress {try{const value=JSON.parse(localStorage.getItem(progressKey)??'{}');return {checked:Array.isArray(value.checked)?value.checked.filter((n:unknown)=>Number.isInteger(n)&&Number(n)>=0&&Number(n)<5):[],notes:value.notes&&typeof value.notes==='object'?value.notes:{}}}catch{return {checked:[],notes:{}}}}

const stageCodec={
  owns:(hash:string)=>!Object.hasOwn(archiveMapping,new URLSearchParams(hash.slice(1)).get('checkpoint')??''),
  parse:(hash:string)=>initialSelection(hash),
  hash:(next:StageSelection)=>{
    const p=new URLSearchParams({checkpoint:next.mark,step:String(next.step),sub:String(next.sub),file:next.file,symbol:next.symbol,tab:next.tab,side:next.side,buildView:next.buildView,explorer:next.explorer,overviewMode:next.overviewMode,section:next.section,position:String(next.position),component:next.component,impact:next.requirement,runtimeFlow:next.runtimeFlow,runtimeEvent:next.runtimeEvent,scenario:next.runtimeScenario,field:next.runtimeField,hadPremium:String(next.runtimeHadPremium),path:next.runtimePath,compareChanges:String(next.compareChanges??false),dependencyScope:next.dependencyScope,dependencyNode:next.dependencyNode,dependencyRelation:next.dependencyRelation,dependencyLocation:String(next.dependencyLocation)})
    // The project Evolution screen owns `requirement`; workspace filtering
    // owns `impact`. Preserve the project field without using it as selection.
    const projectRequirement=new URLSearchParams(location.hash.slice(1)).get('requirement')
    if(projectRequirement)p.set('requirement',projectRequirement)
    return '#'+p.toString()
  },
  normalize:(value:StageSelection):StageSelection=>{const op=revisionOperation(value.mark),cp=value.side==='before'?op.before:op.after;return {...value,...normalizeFlow(value,runtimeAdapter(cp).flows)}}
}

export function StageTwoAdapter(){
  const [selection,navigate]=useSelection(0,stageCodec)
  const [progress,setProgress]=useState(loadProgress),[warning,setWarning]=useState('')
  const operation=revisionOperation(selection.mark),lesson=revisionLessons.find(item=>item.id===selection.mark)!
  const checkpoint=selection.side==='before'?operation.before:operation.after
  const split=useSplitLayout('quotation-workshop.stage2.layout.v1')
  const runContext=useRef<{view:ReturnType<typeof split.capture>;mobile:'guide'|'preview'}|null>(null)
  const runner=useRunSession({capture:()=>{runContext.current={view:split.capture(),mobile}},restore:()=>{const saved=runContext.current;if(saved){split.restore(saved.view);setMobile(saved.mobile);runContext.current=null}}}),run=runner.session
  const [mobile,setMobile]=useState<'guide'|'preview'>('guide'),[collapsed,setCollapsed]=useState<string[]>([]),[scenario,setScenario]=useState(()=>defaultScenario(checkpoint))
  const auto=useRef(false)
  function chooseCheckpoint(id:string,file?:string,symbol?:string){if(run)return;const op=revisionOperation(id);navigate({...coordinates(id),mark:id,file:file??op.file,symbol:symbol??op.symbol,section:'',position:0,side:'after',dependencyNode:'',dependencyRelation:'',dependencyLocation:0})}
  const chooseAction=(step:number,sub=0)=>chooseCheckpoint(stageGroups[step]?.ids[sub]??'s2-r4-00')
  function update(next:StageProgress){setProgress(next);try{localStorage.setItem(progressKey,JSON.stringify(next));setWarning('')}catch{setWarning('Chưa lưu được tiến độ; source và dữ liệu preview giữ nguyên.')}}
  function code(file:string,symbol:string){navigate({file,symbol,section:'',position:0,tab:'build',buildView:'code',dependencyNode:'',dependencyRelation:''})}
  function build(id:string){chooseCheckpoint(id);navigate({tab:'build',buildView:'code'})}
  function clearRunLink(){const url=new URL(location.href);url.searchParams.delete('run');url.searchParams.delete('runMode');history.replaceState(history.state,'',url)}
  function exitRun(){clearRunLink();runner.exit()}
  function start(mode:'demo'|'guided',requested=scenario,explicit?:RunPlan){const plan=explicit??(requested==='step'?stepRunPlan(2,selection.step,new URLSearchParams(location.search).get('runVariant')??'success'):revisionRunPlan(checkpoint,requested));if(!plan.supported){setWarning(plan.reason);clearRunLink();return}setWarning('');runner.start(plan,mode);split.reveal();setMobile(split.small?'preview':'guide')}
  useEffect(()=>{const params=new URLSearchParams(location.search),requested=params.get('run');if(requested&&!auto.current){auto.current=true;start(params.get('runMode')==='guided'?'guided':'demo',requested)}return()=>{auto.current=false}},[checkpoint.id])
  useEffect(()=>setScenario(defaultScenario(checkpoint)),[checkpoint.id])
  const supportedPlan=revisionRunPlan(checkpoint,scenario)
  const check=(close:()=>void=()=>{})=><div className={styles.check}>
    <p>{lesson.try}</p><RunScopePicker stage={2} step={selection.step} current={supportedPlan} onRun={(plan,mode)=>{close();start(mode,scenario,plan)}}>
      <label>Tình huống chạy<select aria-label="Tình huống Chặng 2" value={scenario} onChange={event=>setScenario(event.target.value)}>{scenariosFor(checkpoint).map(([id,title])=><option key={id} value={id}>{title}</option>)}</select></label>
    </RunScopePicker>
    <label><input type="checkbox" checked={progress.checked.includes(selection.step)} onChange={()=>update({...progress,checked:progress.checked.includes(selection.step)?progress.checked.filter(id=>id!==selection.step):[...progress.checked,selection.step]})}/>Tôi đã tự kiểm tra bước này</label>
    <label>Ghi chú<textarea aria-label="Ghi chú" value={progress.notes[selection.step]??''} onChange={event=>update({...progress,notes:{...progress.notes,[selection.step]:event.target.value}})}/></label>
  </div>
  return <PreviewGuideProvider mode="sample" onReveal={()=>{split.reveal();setMobile('preview')}}><WorkshopFrame runState={run}
    header={{stage:2,total:5,title:run?run.plan.title:stageGroups[selection.step].title,context:run?`${run.plan.journey?"Cả bước":"Sub-step"} · checkpoint phiên ${run.plan.checkpoint.id}`:`Chặng nghiệp vụ 2 / Bài học v4 / ${operation.id} · ${checkpoint.id}`,tab:run?(run.pane==='flow'?'overview':'build'):selection.tab,onOverview:()=>run?runner.pane('flow'):navigate({tab:'overview'}),onBuild:()=>run?runner.pane('code'):navigate({tab:'build'}),onReturn:()=>navigate({tab:'overview'}),workMode:split.workMode,onWorkMode:mode=>{split.mode(mode);setMobile(mode==='preview'?'preview':'guide')},collapsed:split.collapsed,onToggle:split.toggle,onPreset:split.preset,onCopy:()=>void navigator.clipboard.writeText(location.href),completed:progress.checked.length,running:Boolean(run)}}
    sidebar={<><h2>Các bước Chặng 2</h2><nav aria-label="Các bước thực hành">{stageGroups.map((group,index)=><button key={group.title} aria-current={selection.step===index?'step':undefined} disabled={Boolean(run)} onClick={()=>chooseAction(index)}><span className={progress.checked.includes(index)?shell.checkedIndex:shell.stepIndex}>{progress.checked.includes(index)?<Check aria-hidden/>:String(index).padStart(2,'0')}</span><span>{group.title}</span></button>)}</nav><p className={styles.legend}>Chặng 2 · v4 dùng source ghim. Practice Chặng1 và tiến độ v1/v2/v3 được giữ nguyên; không tự hoàn thành bước mới từ tiến độ cũ.</p></>}
    substeps={selection.tab==='build'&&!run?<SubstepProgress step={selection.step} sub={selection.sub} onAction={chooseAction} actions={actions} steps={5}/>:undefined}
    split={split} mobile={mobile} onMobile={setMobile} runToolbar={run&&<RunToolbar controller={{...runner,exit:exitRun}}/>}
    preview={<><div className={shell.previewContent} hidden={Boolean(run)}><Preview checkpoint={checkpoint} catalog={revisionCheckpoints} entry={entryFor(checkpoint)} practiceAvailable={false} mode="sample" onMode={()=>{}} onCheckpoint={chooseCheckpoint} comparison={`${selection.side} · ${operation.before.id} → ${operation.after.id}`} onExpand={()=>{split.mode('preview');setMobile('preview')}}/></div>{run&&<RunPreview controller={runner}/>}</>}
  >
    <div className={shell.tabPanels} hidden={Boolean(run)}>
      <div className={shell.overviewTab} hidden={selection.tab!=='overview'}><Overview adapter={stageOverview(checkpoint)} checkpoint={checkpoint} selected={selection.component} selectedFile={selection.file} collapsed={collapsed} onCollapse={setCollapsed} onSelect={component=>navigate({component})} onFile={file=>navigate({file,symbol:'',section:'',position:0})} onCheckpoint={chooseCheckpoint} active={selection.tab==='overview'} onCode={code} onBuild={build} flowSelection={selection} onFlowSelection={navigate} requirement={selection.requirement} onRequirement={requirement=>navigate({requirement})}/></div>
      <div className={shell.buildTab} hidden={selection.tab!=='build'}><BuildSession operation={operation} checkpoint={checkpoint} selection={selection} collapsed={collapsed} onCollapse={setCollapsed} onChange={navigate} onFile={file=>navigate({file,symbol:'',section:'',position:0})} onCheckpoint={chooseCheckpoint} onTry={()=>{split.reveal();setMobile('preview')}} checked={progress.checked.includes(selection.step)} note={progress.notes[selection.step]??''} onNote={()=>{}} onCheck={()=>{}} onRun={(plan,mode)=>runner.start(plan,mode)} adapter={{catalog:revisionCheckpoints,goal:lesson.goal,lesson,functional:{comparison:stageOverview(checkpoint).comparison,change:stageSectionChange,catalog:revisionCheckpoints,sections:stageSections,group:stageRole,focus:taskFocus(selection.mark)},dependencies:stageDependencies(checkpoint),check}}/></div>
    </div>
    {run&&<RunWorkspace key={run.id} controller={runner} flowData={runtimeAdapter(run.plan.checkpoint)}/>} {warning&&<p role="status">{warning}</p>}
  </WorkshopFrame></PreviewGuideProvider>
}
