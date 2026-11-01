// Stage 2 embedding only; no business feature switches.
const match = window.location.pathname.match(/^\/checkpoints\/([^/]+)\//)
export const checkpointId = match?.[1] ?? 's2-reference'
export const apiBase = '/api/checkpoints/' + checkpointId + '/quotations'
export const storageKey = 'quotation-workshop.stage2.checkpoint.' + checkpointId + '.v1'
export const workerOptions = { quiet: true, onUnhandledFrame: 'bypass' as const, serviceWorker: { url: '/mockServiceWorker.js?' + checkpointId, options: { scope: '/checkpoints/' + checkpointId + '/' } } }
