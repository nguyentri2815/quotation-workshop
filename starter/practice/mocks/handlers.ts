import { http, HttpResponse } from 'msw'

// TODO WS08: thay các response 501 bằng validation, lưu trữ và GET thật của mock.
const notBuilt = () =>
  HttpResponse.json({ message: 'Mock API chưa được xây. Hoàn thành bước 8.' }, { status: 501 })
export const handlers = [
  http.get('/api/practice/quotations', notBuilt),
  http.get('/api/practice/quotations/:id', notBuilt),
  http.post('/api/practice/quotations', notBuilt),
]
