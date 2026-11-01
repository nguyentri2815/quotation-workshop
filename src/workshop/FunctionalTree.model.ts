import { useEffect, useState } from 'react'
import { checkpoints } from './catalog'
import type { Checkpoint } from './catalog'
import { findSymbol, readSource, sectionsAt } from './source'
import type { FileSection, SymbolRange } from './source'

export type RoleStatus = 'available' | 'new' | 'modified' | 'future'
export const roleStatusLabel: Record<RoleStatus, string> = {
  available: 'Đã có', new: 'Thêm ở bước này', modified: 'Sửa ở bước này', future: 'Chưa có',
}
export const sourceKey = (checkpoint: string, file: string) => `${checkpoint}/${file}`
export const rangeText = (code: string, range: SymbolRange) =>
  code.split(/\r?\n/).slice(range.start - 1, range.end).join('\n').trim()

// Compare the selected symbol's text, not the containing file's hash or line offsets.
export function rangeStatus(checkpoint: Checkpoint, file: string, symbol: string, sources: Record<string, string>): RoleStatus | undefined {
  const range = findSymbol(checkpoint.id, file, symbol)
  if (!range) return 'future'
  if (!checkpoint.previous) return 'available'
  const previous = findSymbol(checkpoint.previous, file, symbol)
  if (!previous) return 'new'
  const currentCode = sources[sourceKey(checkpoint.id, file)]
  const previousCode = sources[sourceKey(checkpoint.previous, file)]
  if (currentCode === undefined || previousCode === undefined) return undefined
  return rangeText(currentCode, range) === rangeText(previousCode, previous) ? 'available' : 'modified'
}

export function sectionStatus(checkpoint: Checkpoint, file: string, section: FileSection, sources: Record<string, string>, getSections:typeof sectionsAt=sectionsAt): RoleStatus | undefined {
  const current = getSections(checkpoint.id, file).find(item => item.id === section.id)
  if (!current) return 'future'
  const previous = checkpoint.previous && getSections(checkpoint.previous, file).find(item => item.id === section.id)
  if (checkpoint.previous && !previous) return 'new'
  const states = current.ranges.map(range => rangeStatus(checkpoint, file, range.qualified, sources))
  if (previous && (previous.ranges.length !== current.ranges.length || states.some(status => status === 'modified' || status === 'new'))) return 'modified'
  return states.includes(undefined) ? undefined : 'available'
}

export function useRoleSources(requests: Array<{ checkpoint: string; file: string }>): { sources: Record<string, string>; error: string } {
  const key = JSON.stringify([...new Map(requests.map(request => [sourceKey(request.checkpoint, request.file), request])).values()])
  const [state, setState] = useState<{ key: string; sources: Record<string, string>; error: string }>({ key: '', sources: {}, error: '' })
  useEffect(() => {
    let active = true
    const entries: Array<{ checkpoint: string; file: string }> = JSON.parse(key)
    Promise.all(entries.map(async entry => [sourceKey(entry.checkpoint, entry.file), await readSource(entry.checkpoint, entry.file)] as const))
      .then(values => { if (active) setState({ key, sources: Object.fromEntries(values), error: '' }) })
      .catch((error: unknown) => { if (active) setState({ key, sources: {}, error: error instanceof Error ? error.message : 'Không đối chiếu được source.' }) })
    return () => { active = false }
  }, [key])
  return state.key === key ? state : { sources: {}, error: '' }
}

export function roleSections(file: string, checkpoint: Checkpoint, future: boolean) {
  const sections = new Map(sectionsAt(checkpoint.id, file).map(section => [section.id, section]))
  if (future) for (const next of checkpoints.filter(cp => cp.order > checkpoint.order)) {
    for (const section of sectionsAt(next.id, file)) if (!sections.has(section.id)) sections.set(section.id, section)
  }
  return [...sections.values()].filter(section => !['imports', 'exports'].includes(section.id))
}

export const roleGroups = [
 { id: 'host', title: 'Entry & màn hình', description: 'Entrypoint, router và scaffold được cung cấp.' },
 { id: 'contract', title: 'Public contract & dữ liệu', description: 'Kiểu dữ liệu dùng chung; không đồng nhất types với state.' },
 { id: 'intent', title: 'Consumer & intent', description: 'Người dùng làm gì; callback/handler tiếp nhận và điều phối. Đây là vai trò, không phải layer hoặc file mới.' },
 { id: 'state', title: 'State & policy', description: 'Ownership, kết quả dẫn xuất, guard và vòng đời.' },
 { id: 'rules', title: 'Validation & pricing', description: 'Kiểm tra, chuẩn hóa và công thức thuần được consumer sử dụng.' },
 { id: 'presentation', title: 'Presentation', description: 'JSX/component, props/callback và phản hồi; không coi toàn CreateQuotation là presentation.' },
 { id: 'io', title: 'API & mock persistence', description: 'HTTP client, phía nhận giả lập và lưu trữ.' },
 { id: 'read', title: 'Đọc kết quả', description: 'Danh sách/chi tiết qua API, điều hướng và reload.' },
] as const
export function roleGroup(file: string, section: FileSection): typeof roleGroups[number]['id'] {
 if (section.id.startsWith('field-')) return 'presentation'
 if (file === 'quotation/types.ts') return 'contract'
 if (file === 'quotation/rules.ts') return 'rules'
 if (file.startsWith('pages/Quotation')) return 'read'
 if (file.startsWith('api/') || file.startsWith('mocks/')) return 'io'
 if (file.endsWith('.css') || file.startsWith('components/') || file === 'quotation/format.ts') return 'presentation'
 if (!file.startsWith('pages/')) return 'host'
 if (['can-save','dirty','draft','errors','premium','saving','form-ref','dialog-ref','allow-leave','leave'].includes(section.id)) return 'state'
 if (['field','bind-read','customer','asset','period','summary','actions','dialog','view','heading'].includes(section.id)) return 'presentation'
 return 'intent'
}
