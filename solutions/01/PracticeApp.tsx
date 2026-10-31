import { useState } from 'react'
import { createHashRouter, Link, Navigate, Outlet } from 'react-router-dom'
import { CreateQuotation } from './pages/CreateQuotation'
import { QuotationList } from './pages/QuotationList'
import { QuotationDetail } from './pages/QuotationDetail'
import { armSaveFailure } from './mocks/scenario'
import styles from './practice.module.css'

// TODO WS01: đổi chuỗi này trong IDE để thấy source của bạn qua HMR.
export const practiceTitle = 'Bản chào của tôi'

function PracticeLayout() {
  const [notice, setNotice] = useState('')
  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <span className={styles.logo}>Q</span>
        <div>
          <strong>{practiceTitle}</strong>
          <small>Ứng dụng người học · src/practice</small>
        </div>
      </header>
      <nav className={styles.nav} aria-label="Điều hướng bản chào">
        <Link to="/quotations">Danh sách</Link>
        <Link to="/quotations/new">Tạo bản chào</Link>
        <span>Dữ liệu giả lập</span>
      </nav>
      <main className={styles.main}>
        <Outlet />
      </main>
      <details className={styles.tools}>
        <summary>Công cụ thử lỗi mock · dùng từ bước 8</summary>
        <p>
          Chỉ ảnh hưởng một POST tiếp theo của ứng dụng thực hành. Mock tự trở về bình thường sau
          lần đó.
        </p>
        <button
          onClick={() => {
            armSaveFailure()
            setNotice('Đã yêu cầu một lỗi HTTP 500 cho lần lưu kế tiếp.')
          }}
        >
          Gây lỗi lần lưu kế tiếp
        </button>
        <p role="status">{notice}</p>
      </details>
    </div>
  )
}

export const practiceRouter = createHashRouter([
  {
    element: <PracticeLayout />,
    children: [
      { path: '/', element: <Navigate to="/quotations/new" replace /> },
      { path: '/quotations', element: <QuotationList /> },
      { path: '/quotations/new', element: <CreateQuotation /> },
      { path: '/quotations/:id', element: <QuotationDetail /> },
      {
        path: '*',
        element: (
          <p>
            Không tìm thấy trang thực hành. <Link to="/quotations">Về danh sách</Link>
          </p>
        ),
      },
    ],
  },
])
