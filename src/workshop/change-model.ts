import type { Checkpoint } from './catalog'
export type ChangeKind = 'unchanged' | 'changed' | 'new' | 'removed'
export interface ChangeSource { file:string; symbol:string }
export interface ComponentChange {
 id:string; kind:ChangeKind; before:string; after:string; reason:string
 beforeSources:ChangeSource[]; afterSources:ChangeSource[]
}
export interface StageComparison { baseline:Checkpoint; target:Checkpoint }
export const changeLabel:Record<ChangeKind,string>={unchanged:'Kế thừa, không đổi',changed:'Kế thừa, có thay đổi',new:'Mới ở Chặng 2',removed:'Đã loại bỏ'}
export const shortChangeLabel:Record<ChangeKind,string>={unchanged:'',changed:'Thay đổi',new:'Mới',removed:'Đã loại bỏ'}
