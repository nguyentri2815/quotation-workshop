import type { FileSection } from './source'
export const analysisRoles = ['Contract & dependencies','State ownership','Derived state & policy','Consumer & intent','Validation & normalization','Orchestration','Presentation','Effects & lifecycle'] as const
export function rolesFor(file: string, section: FileSection): string[] {
 const id=section.id
 if (['imports','exports'].includes(id) || file === 'quotation/types.ts') return [analysisRoles[0]]
 if (['leave','effect','load'].includes(id)) return [analysisRoles[7],analysisRoles[5]]
 if (file === 'quotation/rules.ts') return [analysisRoles[id === 'price' || id === 'stale' ? 2 : 4]]
 if (file.startsWith('api/') || file.startsWith('mocks/')) return [analysisRoles[0],analysisRoles[5]]
 if (['dirty','can-save'].includes(id)) return [analysisRoles[2],...(id==='can-save'?[analysisRoles[6]]:[])]
 if (['draft','errors','premium','saving','form-ref','dialog-ref','allow-leave','state'].includes(id)) return [analysisRoles[1]]
 if (id === 'validate') return [analysisRoles[4],analysisRoles[5]]
 if (['calculate','save','update','bind','change','blur','submit','request','calculate-result','save-guards','save-lock','save-success','save-error'].includes(id)) return [analysisRoles[3],analysisRoles[5]]
 if (file === 'main.tsx') return [analysisRoles[5],analysisRoles[7]]
 return [analysisRoles[6]]
}
