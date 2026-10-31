import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import './base.css'

async function start() {
  const { worker } = await import('./mocks/browser')
  await worker.start({
    quiet: true,
    onUnhandledFrame: 'bypass',
    serviceWorker: { url: '/mockServiceWorker.js?practice', options: { scope: '/practice.html' } },
  })
  const { practiceRouter } = await import('./PracticeApp')
  const root = document.getElementById('root')
  if (!root) throw new Error('Không tìm thấy root của thực hành.')
  createRoot(root).render(
    <StrictMode>
      <RouterProvider router={practiceRouter} />
    </StrictMode>,
  )
}

start().catch((error: unknown) => {
  console.error(error)
  const root = document.getElementById('root')
  if (root)
    root.textContent =
      'Không mở được ứng dụng thực hành. Kiểm tra lỗi import/biên dịch trong Console hoặc terminal rồi tải lại. Nếu lỗi Service Worker, hãy dùng localhost.'
})
