import { Link, useParams } from 'react-router-dom'
// TODO WS10-DETAIL: GET bằng id trong URL, xử lý loading, lỗi và không tìm thấy.
export function QuotationDetail() {
  const { id } = useParams()
  return (
    <section>
      <h1>Trang chi tiết chưa được xây</h1>
      <p>ID từ URL: {id}</p>
      <p>
        Nếu vừa nhận response tạo thành công, bản chào đã lưu trong mock; bước 10 sẽ đọc lại bằng
        GET.
      </p>
      <Link to="/quotations">Về danh sách</Link>
    </section>
  )
}
