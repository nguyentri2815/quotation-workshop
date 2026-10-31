// Workshop-only embedding adapter. No business feature switches.
const match = window.location.pathname.match(/^\/checkpoints\/([^/]+)\//)
export const checkpointId = match?.[1] ?? 'reference'
export const apiBase = match ? '/api/checkpoints/' + checkpointId + '/quotations' : '/api/reference/quotations'
export const storageKey = match ? 'quotation-workshop.checkpoint.' + checkpointId + '.v1' : 'quotation-workshop.reference.v1'
export const workerOptions = { quiet: true, onUnhandledFrame: 'bypass' as const, serviceWorker: { url: '/mockServiceWorker.js?' + checkpointId, options: { scope: match ? '/checkpoints/' + checkpointId + '/' : '/reference.html' } } }
