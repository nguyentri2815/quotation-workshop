import { apiBase } from '../_workshop/environment'
import { http, HttpResponse } from 'msw'
export const handlers = [http.all(apiBase, () => HttpResponse.json({ message: 'Mock nghiệp vụ chưa được xây.' }, { status: 501 })), http.all(apiBase + '/:id', () => HttpResponse.json({ message: 'Mock nghiệp vụ chưa được xây.' }, { status: 501 }))]
