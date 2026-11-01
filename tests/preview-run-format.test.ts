import { expect, it } from 'vitest'
import { previewRunPlugin } from '../scripts/preview-run-plugin'

it('run namespace wraps complete multi-line initializers and leaves raw source untouched',()=>{
 const plugin=previewRunPlugin()
 const transform=plugin.transform as (code:string,id:string)=>string|undefined
 const code=`export const checkpointId = 'test'
export const apiBase = '/api/checkpoints/' + checkpointId + '/quotations'
export const storageKey =
  'quotation-workshop.stage2.checkpoint.' + checkpointId + '.v1'
`
 const id='/workspace/checkpoints/s2-r4-page/_workshop/environment.ts'
 const result=transform(code,id)!
 expect(result).toContain("runEnvironment(checkpointId)?.storageKey ?? ('quotation-workshop.stage2.checkpoint.' + checkpointId + '.v1')")
 expect(result).toContain('runEnvironment(checkpointId)?.apiBase ?? (')
 expect(transform(code,id+'?raw')).toBeUndefined()
 expect(transform(code,id+'?url')).toBeUndefined()
})
