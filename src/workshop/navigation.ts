import { useEffect, useRef, useState } from 'react'
import { parts } from './catalog'
import { legacySelection } from './steps'
import type { ComponentId } from './catalog'
import { operationAt, operationsFor } from './operations'
import { milestonesFor } from './milestones'
import { normalizeFlow } from './runtime-flows'
import { dependencyNodes, dependencySource } from './dependencies'
import { findSymbol } from './source'

const legacyCheckpoints = [
  ['00', '00', '00'], ['01', '01'], ['02', '02'], ['03-fields', '03-summary', '03'],
  ['04-rules', '04'], ['05-rules', '05'], ['06-rules', '06'], ['07-contract', '07-client', '07'],
  ['08-storage', '08'], ['09', '09'], ['10-list', '10'], ['11', '11'], ['12', '12', '12'],
]
export interface Selection {
  explorer: 'functional' | 'physical'
  overviewMode: 'structure' | 'runtime'
  runtimeFlow: string
  runtimeEvent: string
  runtimeScenario: string
  runtimeField: string
  runtimeHadPremium: boolean
  runtimePath: string
  compareChanges?: boolean
  buildView: 'code' | 'dependencies'
  dependencyScope: 'step' | 'current'
  dependencyNode: string
  dependencyRelation: string
  dependencyLocation: number
  step: number
  sub: number
  mark: string
  component: ComponentId
  file: string
  symbol: string
  section: string
  position: number
  notice: string
  tab: 'overview' | 'build'
  side: 'before' | 'after' | 'diff'
  scope: 'related' | 'full'
  mode: 'sample' | 'mine'
}
export function selectionAt(step: number, sub = 0, mark = ''): Selection {
  const operation = operationAt(step, sub, mark)
  return {
    explorer: 'functional',
    overviewMode: 'structure',
    runtimeFlow: 'input-edit',
    runtimeEvent: 'input',
    runtimeScenario: 'choose',
    runtimeField: 'customerName',
    runtimeHadPremium: false,
    runtimePath: 'input',
    buildView: 'code',
    dependencyScope: 'current',
    dependencyNode: '',
    dependencyRelation: '',
    dependencyLocation: 0,
    step,
    sub,
    mark: operation.milestone?.id ?? '',
    component: operation.part.id,
    file: operation.file,
    symbol: operation.symbol,
    section: '',
    position: 0,
    notice: '',
    tab: 'build',
    side: 'after',
    scope: 'full',
    mode: 'sample',
  }
}
export function parseLocation(hash: string, fallback = 0): Selection {
  const params = new URLSearchParams(hash.replace(/^#/, ''))
  const legacy = params.has('step') && params.get('journey') !== '2'
  const oldStep = Number(params.get('step'))
  const oldSub = Number(params.get('sub') ?? 0)
  let migrationNotice = ''
  if (legacy && Number.isInteger(oldStep) && legacyCheckpoints[oldStep]) {
    const mapped = legacySelection(oldStep, oldSub)
    params.set('step', String(mapped.step))
    params.set('sub', String(mapped.sub))
    migrationNotice = 'Liên kết hành trình cũ ' + oldStep + '.' + (oldSub + 1) + ' → bước ' + mapped.step + ', thao tác ' + (mapped.sub + 1) + '. Nội dung và tiêu chí đã đổi; tiến độ cũ được giữ riêng.'
  }
  const n = Number(params.get('step') ?? fallback)
  const step = Number.isInteger(n) && n >= 0 && n <= 6 ? n : fallback
  const child = Number(params.get('sub') ?? 0)
  const sub =
    Number.isInteger(child) && child >= 0 && child < operationsFor(step).length
      ? child
      : 0
  const mark = params.get('mark') ?? ''
  const selection = selectionAt(step, sub, mark)
  selection.tab = [
    'build',
    'source',
    'order',
    'execute',
    'guide',
    'instructions',
    'instruction',
  ].includes(params.get('tab') ?? '')
    ? 'build'
    : 'overview'
  selection.component =
    parts.find((part) => part.id === params.get('part'))?.id ??
    selection.component
  const file = params.get('file')
  const aliases: Record<string, [string, string]> = {
    'PracticeApp.tsx': ['App.tsx', 'Layout'],
    'components/PremiumPanel.tsx': ['components/PremiumSummary.tsx', 'PremiumSummary'],
    'components/FormFields.tsx': ['pages/CreateQuotation.tsx', 'Field'],
    'components/ApiProbe.tsx': ['_workshop/tools.ts', 'probe'],
    'checkpoint-environment.ts': ['_workshop/environment.ts', 'apiBase'],
    'mocks/scenario.ts': ['_workshop/tools.ts', 'mountTools'],
  }
  if (file) selection.file = (aliases[file]?.[0] ?? file).slice(0, 250)
  if (params.has('symbol'))
    selection.symbol = (params.get('symbol') ?? '').slice(0, 150)
  if (file && aliases[file]) {
    selection.notice = `Liên kết starter cũ: ${file} → ${selection.file}. Đây là đối chiếu trách nhiệm đã khảo sát; bài thực hành của bạn không bị di chuyển.`
    selection.symbol = aliases[file][1]
  } else selection.notice = migrationNotice || params.get('notice')?.slice(0, 500) || ''
  selection.explorer = params.get('explorer') === 'physical' ? 'physical' : 'functional'
  selection.overviewMode = params.get('overviewMode') === 'runtime' ? 'runtime' : 'structure'
  selection.runtimeFlow = params.get('runtimeFlow')?.slice(0, 80) || 'input-edit'
  selection.runtimeEvent = params.get('runtimeEvent')?.slice(0, 80) || 'input'
  Object.assign(selection, normalizeFlow({
    overviewMode: selection.overviewMode,
    runtimeFlow: selection.runtimeFlow,
    runtimeEvent: selection.runtimeEvent,
    runtimeScenario: params.get('scenario') ?? 'choose',
    runtimeField: params.get('field') ?? '',
    runtimeHadPremium: params.get('hadPremium') === 'true',
    runtimePath: (params.get('path') ?? '').slice(0, 3000),
  }))
  selection.buildView = params.get('buildView') === 'dependencies' ? 'dependencies' : 'code'
  selection.dependencyScope = params.get('dependencyScope') === 'step' ? 'step' : 'current'
  selection.dependencyNode = (params.get('dependencyNode') ?? '').slice(0, 400)
  selection.dependencyRelation = (params.get('dependencyRelation') ?? '').slice(0, 250)
  const location = Number(params.get('dependencyLocation') ?? 0)
  selection.dependencyLocation = Number.isInteger(location) && location >= 0 ? Math.min(location, 1000) : 0
  selection.section = params.get('section')?.slice(0, 100) ?? ''
  const position = Number(params.get('position') ?? 0)
  selection.position = Number.isInteger(position) && position >= 0 ? position : 0
  selection.side =
    params.get('side') === 'before'
      ? 'before'
      : params.get('side') === 'diff'
        ? 'diff'
        : 'after'
  selection.scope = 'full'
  selection.mode = params.get('mode') === 'mine' ? 'mine' : 'sample'
  // Legacy canvas ids keep their source authority; current tree links also carry file/symbol.
  const legacyDependency = dependencyNodes.find(item => item.id === selection.dependencyNode)
  if (legacyDependency) {
    const operation = operationAt(step, sub, selection.mark)
    const cp = selection.side === 'before' ? operation.before : operation.after
    const source = dependencySource(cp, legacyDependency)
    selection.file = source.file
    selection.symbol = findSymbol(cp.id, source.file, source.symbol)?.qualified ?? source.symbol
  }
  if ((params.has('step') && step !== n) || (params.has('sub') && child !== sub))
    selection.notice = `Bước/thao tác trong URL không tồn tại. Đang mở bước ${step}, thao tác ${sub + 1}.`
  if (params.has('part') && !parts.some(part => part.id === params.get('part')))
    selection.notice = 'Thành phần trong URL không tồn tại; đang dùng thành phần chính của thao tác.'
  if (mark && !milestonesFor(step, sub).some(item => item.id === mark))
    selection.notice = 'Mốc nhỏ trong URL không tồn tại; đang mở đích của sub-step này.'
  return selection
}
export function selectionHash(value: Selection) {
  return (
    '#' +
    new URLSearchParams({
      journey: '2',
      explorer: value.explorer,
      overviewMode: value.overviewMode,
      runtimeFlow: value.runtimeFlow,
      runtimeEvent: value.runtimeEvent,
      scenario: value.runtimeScenario,
      field: value.runtimeField,
      hadPremium: String(value.runtimeHadPremium),
      path: value.runtimePath,
      buildView: value.buildView,
      dependencyScope: value.dependencyScope,
      dependencyNode: value.dependencyNode,
      dependencyRelation: value.dependencyRelation,
      dependencyLocation: String(value.dependencyLocation),
      step: String(value.step),
      sub: String(value.sub),
      mark: value.mark,
      part: value.component,
      file: value.file,
      symbol: value.symbol,
      section: value.section,
      position: String(value.position),
      notice: value.notice,
      tab: value.tab,
      side: value.side,
      scope: value.scope,
      mode: value.mode,
    }).toString()
  )
}
export interface SelectionCodec<T extends Selection> {
  owns?:(hash:string)=>boolean
  parse:(hash:string,defaultStep:number)=>T
  hash:(selection:T)=>string
  normalize:(selection:T)=>T
}
type SelectionController<T extends Selection> = readonly [T,(patch:Partial<T>)=>void]
export function useSelection(defaultStep:number):SelectionController<Selection>
export function useSelection<T extends Selection>(defaultStep:number,adapter:SelectionCodec<T>):SelectionController<T>
export function useSelection<T extends Selection>(defaultStep: number, adapter?:SelectionCodec<T>):SelectionController<T> {
  // The overload without a codec returns the baseline Selection. Extended
  // selections must provide their codec; history/reset behavior stays shared.
  const codec=adapter??({parse:parseLocation,hash:selectionHash,normalize:(value:Selection)=>({...value,...normalizeFlow(value)})} as unknown as SelectionCodec<T>)
  const [selection, setSelection] = useState(() =>
    codec.parse(window.location.hash, defaultStep),
  )
  const current = useRef(selection)
  useEffect(() => {
    // A project screen can keep the workspace mounted in the background.
    // Its URL belongs to that screen until the learner returns to the workspace.
    if(!new URLSearchParams(window.location.search).has('screen')&&(codec.owns?.(window.location.hash)??true))window.history.replaceState(window.history.state,'',codec.hash(current.current))
    const restore = () => {
      if(codec.owns&&!codec.owns(window.location.hash))return
      const next = codec.parse(window.location.hash, defaultStep)
      if (codec.hash(next) !== codec.hash(current.current)) {
        current.current = next
        setSelection(next)
      }
    }
    window.addEventListener('popstate', restore)
    window.addEventListener('hashchange', restore)
    return () => {
      window.removeEventListener('popstate', restore)
      window.removeEventListener('hashchange', restore)
    }
  }, [defaultStep])
  function navigate(patch: Partial<T>) {
    const resets = patch.file !== undefined || patch.symbol !== undefined
      ? { section: '', position: 0, notice: '', dependencyNode: '', dependencyRelation: '', dependencyLocation: 0 } : {}
    const merged = { ...current.current, ...resets, ...patch, scope: 'full' as const }
    const next = codec.normalize(merged)
    const hash = codec.hash(next)
    if (hash === codec.hash(current.current)) return
    window.history.pushState(null, '', hash)
    window.dispatchEvent(new Event('workshop:navigation'))
    current.current = next
    setSelection(next)
  }
  return [selection, navigate] as const
}
