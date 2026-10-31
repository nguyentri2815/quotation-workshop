import { checkpointFor, checkpointById, partForFile, partById } from './catalog'
import { lessons } from './steps'
import { findSymbol, sectionsAt } from './source'
import { milestonesFor } from './milestones'
export type OperationKind = 'create' | 'edit' | 'connect' | 'observe'
export const kindLabels = { create: 'Tạo file', edit: 'Bổ sung file có sẵn', connect: 'Nối các thành phần', observe: 'Quan sát / kiểm tra' }
export function operationAt(step: number, sub: number, mark = '') {
 const lesson = lessons[step], task = lesson.tasks[sub]
 const { title, kind } = task
 const milestones = milestonesFor(step, sub)
 const milestone = milestones.find(item => item.id === mark)
 const milestoneIndex = milestone ? milestones.indexOf(milestone) : -1
 const priorMilestone = milestones[milestoneIndex - 1]
 const nextMilestone = milestone ? milestones[milestoneIndex + 1] : undefined
 const symbol = milestone?.symbol ?? task.symbol
 const after = milestone ? checkpointById(milestone.id) : checkpointFor(step, sub)
 const before = kind === 'observe' ? after : checkpointById(after.previous ?? after.id)
 const file = task.file.startsWith('checkpoints/') ? task.file.split('/').slice(2).join('/') : task.file.slice('sample/product/'.length)
 const part = file === 'quotation/rules.ts' && ['calculatePremium', 'pricingInputsChanged'].includes(symbol) ? partById('pricing') : partForFile(file, step)
 const sourceOnly = after.kind === 'source'
 const primaryRange = findSymbol(after.id, file, symbol)
 const primarySection = sectionsAt(after.id, file).find(section => section.ranges.some(range => range.qualified === primaryRange?.qualified))
 const focus = { file, symbol, range: primaryRange, related: primarySection?.links ?? [], preview: milestone?.preview }
 const next = lesson.tasks[sub + 1]
 return { id: step + '.' + (sub + 1), step, sub, title, kind, symbol, file, part, before, after, task, sourceOnly, milestones, milestone, focus, destination: checkpointFor(step, sub),
 intention: milestone?.change ?? task.change, input: task.run, run: milestone?.verify ?? task.run, expected: milestone?.verify ?? task.expected,
 prerequisite: priorMilestone ? priorMilestone.title + ': ' + priorMilestone.change : sub === 0 ? lesson.before : lesson.tasks[sub - 1].expected,
 parallel: step === 3 ? 'Sau contract Premium, presentation và công thức có thể làm độc lập; bài chọn validation → công thức → presentation → ghép calculate.' : step === 5 ? 'Sau contract, client và mock có thể làm độc lập; bài chọn client → probe → storage/mock → ghép save.' : 'Theo phụ thuộc của hành vi hiện tại.',
 next: nextMilestone ? nextMilestone.title + ' · ' + nextMilestone.symbol : next ? next.title + ' · ' + next.symbol : step < 6 ? lessons[step + 1].title : 'Dừng Chặng 1 để người học review.',
 group: title + ' · ' + symbol }
}
export type Operation = ReturnType<typeof operationAt>
export const operationsFor = (step: number) => lessons[step].tasks.map((_, sub) => operationAt(step, sub))
export function defaultSymbol(checkpoint: string, file: string, preferred = '') {
 if (preferred && findSymbol(checkpoint, file, preferred)) return preferred
 const part = partForFile(file, checkpointById(checkpoint).step)
 return part.files.find(item => item.path === file)?.symbols.find(symbol => findSymbol(checkpoint, file, symbol)) ?? ''
}
