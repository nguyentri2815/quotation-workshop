import type { SetupWorker } from 'msw/browser'

export interface NetworkEvidence {
  session: string; order: number; requestId: string; kind: 'request' | 'response' | 'network-error'
  method: string; url: string; status?: number; at: number
}
export interface RunBridge {
  version: 1; session: string; checkpoint: string; apiBase: string; storageKey: string
  network: NetworkEvidence[]; pending: Set<string>
}
declare global { interface Window { __workshopRun?: RunBridge } }

export function runEnvironment(checkpoint: string): RunBridge | undefined {
  const session = new URLSearchParams(window.location.search).get('workshopRun')
  if (!session || !/^[a-zA-Z0-9_-]{8,80}$/.test(session) || !/^[a-zA-Z0-9-]+$/.test(checkpoint)) return
  if (window.__workshopRun?.session === session) return window.__workshopRun
  const bridge: RunBridge = {
    version: 1, session, checkpoint, apiBase: `/api/checkpoints/${checkpoint}/run/${session}/quotations`,
    storageKey: `quotation-workshop.run.${session}.${checkpoint}.v1`, network: [], pending: new Set(),
  }
  window.__workshopRun = bridge
  return bridge
}

export function observeRunWorker(worker: SetupWorker) {
  const bridge = window.__workshopRun
  if (!bridge) return
  const relevant = (request: Request) => {
    const url = new URL(request.url)
    return url.origin === location.origin && (url.pathname === bridge.apiBase || url.pathname.startsWith(bridge.apiBase + '/'))
  }
  const append = (kind: NetworkEvidence['kind'], request: Request, requestId: string, status?: number) => {
    if (!relevant(request)) return
    if (kind === 'request') bridge.pending.add(requestId)
    else bridge.pending.delete(requestId)
    bridge.network.push({ session: bridge.session, order: bridge.network.length + 1, kind, requestId, method: request.method, url: request.url, status, at: performance.now() })
  }
  worker.events.on('request:start', ({ request, requestId }) => append('request', request, requestId))
  worker.events.on('response:mocked', ({ request, requestId, response }) => append('response', request, requestId, response.status))
  worker.events.on('response:bypass', ({ request, requestId, response }) => append('response', request, requestId, response.status))
  worker.events.on('unhandledException', ({ request, requestId }) => append('network-error', request, requestId))
}
