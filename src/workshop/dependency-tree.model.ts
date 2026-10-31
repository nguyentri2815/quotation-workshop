import { checkpoints, fileMeaning } from './catalog'
import type { Checkpoint } from './catalog'
import { dependencyNodes, dependencyEdges, dependencySource, dependencyBirth } from './dependencies'
import type { DependencyNode, DependencyEdge } from './dependencies'
import { findSymbol, symbolsAt, symbolBirth, sectionsAt } from './source'
import type { SymbolRange } from './source'
import type { FlowSource } from './runtime-flows'

export interface TreeDefinition extends FlowSource {
  key: string
  title: string
  role: string
  range: SymbolRange
  actual: boolean
  node?: DependencyNode
}
export const definitionKey = (file: string, symbol: string) => `${file}#${symbol}`
export const relationKey = (edge: DependencyEdge) => `${edge.from}~${edge.kind}~${edge.to}`
const definitionKinds = new Set(['FunctionDeclaration','InterfaceDeclaration','TypeAliasDeclaration','ClassDeclaration','MethodDeclaration','Handler','VariableDeclaration','Effect','Contract','CSS','HTML','FieldUse'])

export function definitionsAt(cp: Checkpoint, future = false): TreeDefinition[] {
  const definitions = new Map<string, TreeDefinition>()
  function include(file: string, range: SymbolRange, actual: boolean, node?: DependencyNode, birth = cp.id) {
    const key = definitionKey(file, range.qualified)
    if (definitions.has(key) && !node) return
    const section = sectionsAt(actual ? cp.id : birth, file).find(section => section.ranges.some(item => item.qualified === range.qualified))
    const wiring = node && checkpoints.find(item => item.id === node.since)
    const staged = actual && wiring && wiring.order > cp.order
    definitions.set(key, { key, file, symbol: range.qualified, range, actual, node, since: birth,
      title: staged ? `${range.name} · khung hiện tại` : node?.title ?? section?.title ?? range.name,
      role: staged ? `Symbol đã có trong source; vai trò dưới đây được ghép đầy đủ từ mốc ${wiring.id}. ${node?.role}` : node?.role ?? section?.role ?? fileMeaning(file),
    })
  }
  for (const file of cp.files) for (const range of symbolsAt(cp.id, file.path)) {
    if (definitionKinds.has(range.kind)) include(file.path, range, true)
  }
  for (const node of dependencyNodes) {
    const source = dependencySource(cp, node), range = findSymbol(cp.id, source.file, source.symbol)
    if (range) include(node.file, range, true, node)
    else if (future) {
      const birth = dependencyBirth(node)?.checkpoint
      const next = birth && findSymbol(birth.id, node.file, dependencySource(birth, node).symbol)
      if (birth && next && birth.order > cp.order) include(node.file, next, false, node, birth.id)
    }
  }
  return [...definitions.values()].sort((a, b) => a.file.localeCompare(b.file) || Number(b.actual) - Number(a.actual) || a.range.start - b.range.start || a.key.localeCompare(b.key))
}

export function selectedDefinition(definitions: TreeDefinition[], value: { dependencyNode: string; file: string; symbol: string }, cp: Checkpoint) {
  const explicit = definitions.find(item => item.key === value.dependencyNode || item.node?.id === value.dependencyNode)
  if (explicit) return explicit
  // A file selection stays a file selection, including empty checkpoint modules.
  if (!value.symbol) return undefined
  const requested = definitions.find(item => item.file === value.file && (item.symbol === value.symbol || item.range.name === value.symbol))
  if (requested) return requested
  const range = findSymbol(cp.id, value.file, value.symbol)
  const exact = definitions.find(item => item.file === value.file && item.symbol === range?.qualified)
  if (exact) return exact
  if (range) {
    const owner = definitions.filter(item => item.file === value.file && item.range.start <= range.start && item.range.end >= range.end)
      .sort((a, b) => (a.range.end - a.range.start) - (b.range.end - b.range.start))[0]
    if (owner) return owner
  }
  return undefined
}

const siteCache = new Map<string, FlowSource[]>()
export function relationSites(cp: Checkpoint, edge: DependencyEdge): FlowSource[] {
  const key = `${cp.id}:${relationKey(edge)}`
  const cached = siteCache.get(key)
  if (cached) return cached
  const from = dependencyNodes.find(node => node.id === edge.from), to = dependencyNodes.find(node => node.id === edge.to)
  if (!from || !to) return []
  const source = dependencySource(cp, from), target = dependencySource(cp, to)
  const sourceRange = findSymbol(cp.id, source.file, source.symbol), targetRange = findSymbol(cp.id, target.file, target.symbol)
  if (!sourceRange || !targetRange) return []
  const setter: Record<string, string> = { draft: 'setDraft', premium: 'setPremium', calculated: 'setCalculatedBefore', notice: 'setNotice', errors: 'setErrors', message: 'setMessage', saving: 'setSaving' }
  const apiCall: Record<string, string> = { save: 'quotationsApi.create', list: 'quotationsApi.list', detail: 'quotationsApi.get' }
  let selectors: string[] = []
  let direct: SymbolRange[] = []
  switch (edge.kind) {
    case 'Gọi': selectors = edge.to === 'blocker' ? ['call:blocker.reset', 'call:blocker.proceed'] : [`call:${edge.to === 'client' ? apiCall[edge.from] : edge.to === 'worker' ? 'worker.start' : targetRange.name}`]; break
    case 'Đọc': selectors = [`read:${targetRange.name}`]; break
    case 'Cập nhật state': selectors = [setter[edge.to] ? `call:${setter[edge.to]}` : `write:${targetRange.name}`]; break
    case 'Phụ thuộc type':
      if (targetRange.kind === 'Contract' && from.file === to.file) direct = [targetRange]
      else selectors = [`type:${targetRange.name}`]
      break
    case 'Truyền props': case 'Ghép component':
      if (targetRange.kind === 'FieldUse' && from.file === to.file) direct = [targetRange]
      else selectors = [`jsx:${targetRange.name}`]
      break
    case 'Truyền callback': direct = [sourceRange]; break
    case 'Import': {
      const range = findSymbol(cp.id, from.file, 'import:./handlers')
      if (range) direct = [range]
      break
    }
  }
  const ranges = selectors.length ? symbolsAt(cp.id, from.file).filter(range => range.kind === 'DependencySite' && selectors.some(selector => range.qualified.includes(`.site:${selector}[`)) && range.start >= sourceRange.start && range.end <= sourceRange.end) : direct.filter(range => edge.kind === 'Import' || (range.start >= sourceRange.start && range.end <= sourceRange.end))
  const result = ranges.map(range => ({ file: from.file, symbol: range.qualified, since: cp.id }))
  siteCache.set(key, result)
  return result
}
const birthCache = new Map<string, Checkpoint | undefined>()
export function relationBirth(edge: DependencyEdge) {
  const key = relationKey(edge)
  if (!birthCache.has(key)) birthCache.set(key, checkpoints.find(cp => relationSites(cp, edge).length > 0))
  return birthCache.get(key)
}
export function relationsAt(cp: Checkpoint, definitions: TreeDefinition[], future: boolean) {
  return dependencyEdges.flatMap(edge => {
    const from = definitions.find(item => item.node?.id === edge.from), to = definitions.find(item => item.node?.id === edge.to)
    if (!from || !to) return []
    const sites = relationSites(cp, edge)
    if (!sites.length && !future) return []
    const birth = sites.length ? undefined : relationBirth(edge)
    if (!sites.length && (!birth || birth.order <= cp.order)) return []
    return [{ ...edge, key: relationKey(edge), source: from, target: to, sites, birth, ready: sites.length > 0 }]
  })
}
export type TreeRelation = ReturnType<typeof relationsAt>[number]
export const definitionBirth = (item: TreeDefinition) => symbolBirth(item.file, item.symbol)

export const incomingLabel: Record<DependencyEdge['kind'], string> = {
  'Gọi': 'Được gọi bởi', 'Đọc': 'Được đọc bởi', 'Cập nhật state': 'Được cập nhật bởi', 'Truyền props': 'Được truyền props từ', 'Truyền callback': 'Được truyền làm callback từ', 'Ghép component': 'Được ghép tại', 'Phụ thuộc type': 'Được dùng làm type bởi', 'Import': 'Được import bởi',
}
