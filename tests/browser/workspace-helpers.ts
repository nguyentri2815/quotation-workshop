import type { Page } from '@playwright/test'
export async function setWidthPreset(page: Page, value: string) {
  await page.getByRole('button', { name: 'Tùy chọn bố cục', exact: true }).click()
  await page.getByLabel('Độ rộng vùng làm việc', { exact: true }).selectOption(value)
  await page.getByRole('button', { name: 'Đóng tùy chọn bố cục', exact: true }).click()
}
export async function togglePreview(page: Page, name: 'Thu preview' | 'Mở preview') {
  await page.getByRole('button', { name: 'Tùy chọn bố cục', exact: true }).click()
  await page.getByRole('button', { name, exact: true }).click()
  await page.getByRole('button', { name: 'Đóng tùy chọn bố cục', exact: true }).click()
}
export async function selectBehavior(page: Page, id: string) {
  const picker = page.getByLabel('Thao tác cần theo', { exact: true })
  if (await picker.isVisible()) await picker.selectOption(id)
  else {
    const names: Record<string, string> = { 'input-edit': 'Nhập / sửa dữ liệu', calculate: 'Tính phí', save: 'Lưu bản chào', read: 'Đọc dữ liệu đã lưu', leave: 'Rời form' }
    await page.getByRole('group', { name: 'Hành vi', exact: true }).getByRole('button', { name: names[id], exact: true }).click()
  }
}
export async function selectFlowEvent(page: Page, id: string) {
  await page.getByRole('button', { name: 'Mở danh sách sự kiện', exact: true }).click()
  await page.getByLabel('Chọn event', { exact: true }).selectOption(id)
}
export function flowEvent(page: Page) {
  return page.locator('[data-event][aria-current="step"]')
}
export async function selectScenario(page: Page, title: string) {
  await page.getByRole('button', { name: 'Tình huống bắt đầu', exact: true }).click()
  await page.getByRole('dialog', { name: 'Tình huống bắt đầu' }).getByRole('button', { name: title, exact: true }).click()
  await page.getByRole('button', { name: 'Đóng tình huống', exact: true }).click()
}
export async function editScenario(page: Page, field?: string, priced?: boolean) {
  await page.getByRole('button', { name: 'Tình huống bắt đầu', exact: true }).click()
  if (field) await page.getByLabel('Trường đang sửa', { exact: true }).selectOption(field)
  if (priced !== undefined) await page.getByRole('dialog', { name: 'Tình huống bắt đầu' }).getByRole('button', { name: priced ? 'Đã có phí' : 'Chưa có phí', exact: true }).click()
  await page.getByRole('button', { name: 'Đóng tình huống', exact: true }).click()
}
export async function selectDependency(page: Page, id: string) {
  const queries: Record<string, string> = { button: 'CreateQuotation.action.calculate', premium: 'premium', props: 'props', calculate: 'calculate' }
  await page.getByRole('searchbox', { name: 'Tìm symbol trên cây', exact: true }).fill(queries[id] ?? id)
  await page.locator(`[data-search-result="${id}"]`).click()
}
export async function showFuture(page: Page) {
  await page.getByRole('button', { name: 'Tùy chọn', exact: true }).click()
  await page.getByLabel('Xem phần chưa hình thành', { exact: true }).check()
  await page.getByRole('button', { name: 'Đóng tùy chọn', exact: true }).click()
}
