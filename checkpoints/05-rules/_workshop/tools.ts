// Workshop-only host; not a component of the product.
import { checkpointId } from './environment'

export function mountTools() {
  const host = document.createElement('details')
  host.style.cssText = 'padding:8px;background:#eff6ff;font:13px system-ui;position:relative;z-index:1'
  const summary = document.createElement('summary')
  summary.textContent = 'Công cụ riêng workshop · không thuộc source sản phẩm'
  host.append(summary)
  const identity = document.createElement('div')
  identity.style.cssText = 'padding:4px 8px;background:#eff6ff;font:12px system-ui'
  identity.textContent = checkpointId === 'reference' ? 'BẢN HOÀN CHỈNH THAM CHIẾU · source sản phẩm mẫu' : 'Source sản phẩm mẫu · checkpoint ' + checkpointId
  document.body.prepend(identity)
  
  document.body.prepend(host)
}

