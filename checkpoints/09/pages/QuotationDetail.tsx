// Temporary teaching acknowledgment; full GET detail is introduced at checkpoint 10.
import { Link, useLocation, useParams } from 'react-router-dom'
import { isRecord, parseQuotation } from '../quotation/rules'
import { formatMoney } from '../quotation/format'
export function QuotationDetail() {
  const { id } = useParams()
  const state: unknown = useLocation().state
  const receipt = isRecord(state) && state.created === true ? parseQuotation(state.receipt) : null
  const confirmed = receipt && receipt.id === id ? receipt : null
  return <section>
    <h1>{confirmed ? 'Đã lưu bản chào thành công' : 'Trang chi tiết chưa được xây'}</h1>
    {confirmed ? <div role="status"><p>Số bản chào: {confirmed.number}</p><p>ID: {confirmed.id}</p><p>Khách hàng: {confirmed.customer.name}</p><p>Tổng phí: {formatMoney(confirmed.premium.total)}</p><p>Trạng thái: Đã tạo</p></div> : <p>Không có response tạo được xác nhận cho URL này.</p>}
    <p>Đây là xác nhận từ response POST. Đọc lại độc lập bằng GET và reload được xây ở bước 6. Mỗi checkpoint có dữ liệu demo riêng.</p>
    <Link to="/quotations/new">Tạo bản chào mới</Link>{' · '}<Link to="/quotations">Danh sách</Link>
  </section>
}
