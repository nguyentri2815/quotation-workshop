import { expect, test } from '@playwright/test'

test('preview mẫu tiến triển bằng source từng mốc và quay ngược không có tính năng tương lai', async ({
  page,
}) => {
  await page.goto('/')
  async function checkpoint(id: string) {
    await page.getByLabel('Checkpoint mẫu', { exact: true }).selectOption(id)
    return page.frameLocator(`iframe[title="Preview mẫu checkpoint ${id}"]`)
  }
  let frame = await checkpoint('00')
  await expect(frame.getByTestId('starter-empty')).toBeVisible()
  frame = await checkpoint('02')
  await expect(frame.getByLabel('Tên khách hàng', {exact:false})).toBeDisabled()
  await page.getByRole('button', { name: 'Thông tin preview', exact: true }).click()
  await expect(
    page
      .getByLabel('Vùng preview', { exact: true })
      .getByText('Màn hình tĩnh giữ nguyên', { exact: false }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Đóng thông tin preview', exact: true }).click()
  frame = await checkpoint('03-fields')
  await expect(frame.getByLabel('Tên khách hàng', {exact:false})).toBeDisabled()
  frame = await checkpoint('03')
  await frame
    .getByLabel('Tên khách hàng', { exact: false })
    .fill('Người học Demo')
  await expect(frame.getByLabel('Tên khách hàng', { exact: false })).toHaveValue('Người học Demo')
  frame = await checkpoint('04')
  await frame.getByRole('button', { name: 'Tính phí', exact: true }).click()
  await expect(frame.getByText('Vui lòng nhập tên khách hàng.')).toBeVisible()
  frame = await checkpoint('05')
  await frame.getByRole('button', { name: 'Điền dữ liệu mẫu' }).click()
  await frame.getByRole('button', { name: 'Tính phí', exact: true }).click()
  await expect(frame.getByText(/1\.100\.000/).first()).toBeVisible()
  await frame.getByRole('button', { name: 'Lưu bản chào' }).click()
  await expect(frame.getByRole('alert')).toContainText(
    'Thao tác lưu chưa được xây',
  )
  frame = await checkpoint('06')
  await frame.getByRole('button', { name: 'Điền dữ liệu mẫu' }).click()
  await frame.getByRole('button', { name: 'Tính phí', exact: true }).click()
  await frame
    .getByLabel('Tên khách hàng', { exact: false })
    .fill('Tên đổi, phí giữ')
  await expect(
    frame.getByRole('button', { name: 'Lưu bản chào' }),
  ).toBeEnabled()
  await frame
    .getByLabel('Số tiền bảo hiểm', { exact: false })
    .fill('2000000000')
  await expect(
    frame.getByText('Cần tính lại phí', { exact: false }),
  ).toBeVisible()
  await expect(
    frame.getByRole('button', { name: 'Lưu bản chào' }),
  ).toBeDisabled()
  await page.screenshot({ path: 'test-results/checkpoint-invalidation.png' })
  frame = await checkpoint('07')
  await frame
    .getByText('Công cụ riêng workshop · không thuộc source sản phẩm', { exact: true })
    .click()
  await frame.getByRole('button', { name: 'Thử tạo qua API' }).click()
  await expect(frame.locator('body > details [role="status"]')).toContainText('HTTP 501')
  frame = await checkpoint('08')
  await frame
    .getByText('Công cụ riêng workshop · không thuộc source sản phẩm', { exact: true })
    .click()
  await frame.getByRole('button', { name: 'Thử tạo qua API' }).click()
  await expect(frame.locator('body > details [role="status"]')).toContainText('API đã tạo Q-')
  frame = await checkpoint('09')
  await frame.getByRole('button', { name: 'Điền dữ liệu mẫu' }).click()
  await frame.getByRole('button', { name: 'Tính phí', exact: true }).click()
  await frame
    .getByText('Công cụ riêng workshop · không thuộc source sản phẩm', { exact: true })
    .click()
  await frame.getByRole('button', { name: 'Gây lỗi lần lưu kế tiếp' }).click()
  await frame.getByRole('button', { name: 'Lưu bản chào' }).click()
  await expect(frame.getByRole('alert')).toContainText('Lỗi lưu có chủ đích')
  await expect(
    frame.getByLabel('Tên khách hàng', { exact: false }),
  ).toHaveValue('Công ty TNHH Mộc An Demo')
  await frame.getByRole('button', { name: 'Lưu bản chào' }).click()
  await expect(
    frame.getByRole('heading', { name: 'Đã lưu bản chào thành công' }),
  ).toBeVisible()
  frame = await checkpoint('03')
  await expect(
    frame.getByText('Chưa có kết quả phí', { exact: false }),
  ).toBeVisible()
  await frame.getByRole('button', { name: 'Điền dữ liệu mẫu' }).click()
  await frame.getByRole('button', { name: 'Tính phí', exact: true }).click()
  await expect(frame.getByRole('alert')).toContainText('Chưa xây kiểm tra và tính phí')
  frame = await checkpoint('00')
  await expect(frame.getByTestId('starter-empty')).toBeVisible()
  const keys = await frame
    .locator('body')
    .evaluate(() => Object.keys(localStorage))
  expect(keys).toContain('quotation-workshop.checkpoint.08.v1')
  expect(keys).toContain('quotation-workshop.checkpoint.09.v1')
  expect(keys).not.toContain('quotation-product.demo.v1')
  expect(keys).not.toContain('quotation-workshop.practice.v1')
})

test('checkpoint cuối lưu, reload, đọc lại và bảo vệ form chưa lưu', async ({
  page,
}) => {
  await page.goto('/checkpoints/11/index.html#/quotations')
  await page
    .getByRole('link', { name: 'Tạo bản chào', exact: true })
    .click()
  await page.getByRole('button', { name: 'Điền dữ liệu mẫu' }).click()
  await page.getByRole('button', { name: 'Tính phí', exact: true }).click()
  await page.getByRole('button', { name: 'Hủy', exact: true }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByRole('button', { name: 'Tiếp tục nhập' }).click()
  await page.getByRole('button', { name: 'Lưu bản chào' }).click()
  await expect(page.getByText('Đã lưu bản chào thành công.')).toBeVisible()
  const number = await page.getByRole('heading', { level: 1 }).innerText()
  await page.reload()
  await expect(
    page.getByRole('heading', { name: number, exact: true }),
  ).toBeVisible()
  await page.getByRole('link', { name: 'Về danh sách', exact: false }).click()
  await page.getByRole('link', { name: number, exact: true }).click()
  await expect(
    page.getByText('Bản chào chưa phải hợp đồng bảo hiểm.'),
  ).toBeVisible()
})

test('mẫu, tham chiếu và bài thực hành cùng mở vẫn có worker và dữ liệu độc lập', async ({
  page,
  context,
}) => {
  await page.goto('/#step=11&tab=execute')
  const sample = page.frameLocator('iframe[title="Preview mẫu checkpoint 11"]')
  await sample.getByRole('button', { name: 'Điền dữ liệu mẫu' }).click()
  await sample.getByRole('button', { name: 'Tính phí', exact: true }).click()
  await sample.getByRole('button', { name: 'Lưu bản chào' }).click()
  await expect(sample.getByRole('heading', { name: /^Q-/ })).toBeVisible()
  const reference = await context.newPage()
  await reference.goto('/reference.html#/quotations')
  await expect(
    reference.getByText('Công cụ riêng workshop · không thuộc source sản phẩm', { exact: false }),
  ).toBeVisible()
  await reference
    .getByRole('link', { name: 'Tạo bản chào', exact: true })
    .click()
  await reference.getByRole('button', { name: 'Điền dữ liệu mẫu' }).click()
  await reference.getByRole('button', { name: 'Tính phí', exact: true }).click()
  await reference.getByRole('button', { name: 'Lưu bản chào' }).click()
  await expect(reference.getByRole('heading', { name: /^Q-/ })).toBeVisible()
  await page
    .getByRole('button', { name: 'Bài tôi đang làm', exact: true })
    .click()
  await expect(
    page
      .frameLocator('iframe[title="Bài tôi đang làm · HMR"]')
      .getByTestId('starter-empty'),
  ).toBeVisible()
  const data = await page.evaluate(() =>
    Object.fromEntries(
      Object.entries(localStorage).filter(
        ([key]) =>
          key.includes('quotation-workshop.') &&
          key !== 'quotation-workshop.guide.v1' &&
          key !== 'quotation-workshop.behaviors.v2',
      ),
    ),
  )
  expect(Object.keys(data).sort()).toEqual([
    'quotation-workshop.checkpoint.11.v1',
    'quotation-workshop.reference.v1',
  ])
  const quotations = Object.values(data).map(
    (value) =>
      (JSON.parse(value) as { quotations: Array<{ id: string }> }).quotations,
  )
  expect(quotations.map((items) => items.length)).toEqual([3, 3])
  expect(quotations[0].map((item) => item.id)).not.toEqual(
    quotations[1].map((item) => item.id),
  )
  await reference.reload()
  await expect(reference.getByRole('heading', { name: /^Q-/ })).toBeVisible()
})
