import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Workshop } from './Workshop'
import './base.css'

const root = document.getElementById('root')
if (!root) throw new Error('Không tìm thấy root workshop.')
createRoot(root).render(
  <StrictMode>
    <Workshop />
  </StrictMode>,
)
