// Legacy starter compatibility QA only; solutions/ is NOT the canonical product sample.
// This command never writes src/practice in the workshop checkout.
import { cp, mkdir, readFile, readdir, symlink, writeFile } from 'node:fs/promises'
import { resolve, relative } from 'node:path'
import { spawn, spawnSync } from 'node:child_process'
import { createServer } from 'node:net'
import { chromium, expect } from '@playwright/test'

// This suite verifies the frozen legacy solutions, independently of the v2 curriculum.
const legacyStages = [
  'Khám phá', 'Điểm vào', 'Types', 'Form', 'Validation', 'Tính phí',
  'Vô hiệu phí', 'Contract', 'Storage', 'Lưu', 'Đọc lại', 'Rời form', 'Đối chiếu',
].map((title, id) => ({ id, title }))

const root = resolve(import.meta.dirname, '..')
const scratch = resolve(root, '.verification', `journey-${Date.now()}`)
await mkdir(scratch, { recursive: true })
for (const path of [
  'src',
  'solutions',
  'checkpoints',
  '.workshop',
  'public',
  'index.html',
  'practice.html',
  'reference.html',
  'package.json',
  'tsconfig.json',
  'vite.config.ts',
]) {
  await cp(resolve(root, path), resolve(scratch, path), { recursive: true })
}
// Begin this author-only rehearsal from the provided starter, regardless of learner edits.
await cp(resolve(root, 'starter/practice'), resolve(scratch, 'src/practice'), { recursive: true })
await symlink(resolve(root, 'node_modules'), resolve(scratch, 'node_modules'), 'junction')
const port = await new Promise((resolvePort, reject) => {
  const probe = createServer()
  probe.on('error', reject)
  probe.listen(0, 'localhost', () => {
    const address = probe.address()
    if (!address || typeof address === 'string') {
      probe.close()
      reject(new Error('Không chọn được port QA'))
      return
    }
    probe.close(() => resolvePort(address.port))
  })
})
const base = `http://localhost:${port}`
const server = spawn(
  process.execPath,
  [
    resolve(root, 'node_modules/vite/bin/vite.js'),
    '--host',
    'localhost',
    '--port',
    String(port),
    '--strictPort',
  ],
  { cwd: scratch, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] },
)
let serverLog = ''
server.stdout.on('data', (data) => {
  serverLog = (serverLog + data.toString()).slice(-6000)
})
server.stderr.on('data', (data) => {
  serverLog = (serverLog + data.toString()).slice(-6000)
})
let browser
let qaPage
const originalStarter = await readFile(
  resolve(root, 'src/practice/pages/CreateQuotation.tsx'),
  'utf8',
)

async function allFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(
    entries.map((entry) =>
      entry.isDirectory()
        ? allFiles(resolve(directory, entry.name))
        : [resolve(directory, entry.name)],
    ),
  )
  return nested.flat()
}
function typecheck(step) {
  const result = spawnSync(
    process.execPath,
    [resolve(root, 'node_modules/typescript/bin/tsc'), '--noEmit'],
    { cwd: scratch, encoding: 'utf8', windowsHide: true },
  )
  if (result.status !== 0)
    throw new Error(`Bước ${step}: typecheck thất bại\n${result.stdout}\n${result.stderr}`)
}

try {
  for (let attempt = 0; attempt < 80; attempt++) {
    try {
      if ((await fetch(base)).ok) break
    } catch (error) {
      if (attempt === 79) throw new Error(`Vite QA chưa sẵn sàng: ${String(error)}\n${serverLog}`)
    }
    await new Promise((done) => setTimeout(done, 150))
  }
  browser = await chromium.launch({ channel: 'chrome' })
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await context.newPage()
  qaPage = page
  page.setDefaultTimeout(12_000)
  page.on('pageerror', (error) => console.error(`Browser QA: ${error.message}`))
  const app = `${base}/practice.html#/quotations/new`
  const sample = async () => page.getByRole('button', { name: 'Điền dữ liệu mẫu' }).click()
  const calculate = async () => page.getByRole('button', { name: 'Tính phí', exact: true }).click()
  let savedUrl = ''
  let savedNumber = ''
  await page.goto(app)
  await expect(page.getByTestId('starter-empty')).toBeVisible()
  for (const lesson of legacyStages) {
    const id = lesson.id
    if (id >= 1 && id <= 11) {
      const folder = resolve(root, 'solutions', String(id).padStart(2, '0'))
      const files = (await allFiles(folder)).sort()
      for (const file of files) {
        const target = resolve(scratch, 'src/practice', relative(folder, file))
        if (
          !target.startsWith(resolve(scratch, 'src/practice') + '\\') &&
          !target.startsWith(resolve(scratch, 'src/practice') + '/')
        )
          throw new Error('Target ngoài scratch practice')
        await mkdir(resolve(target, '..'), { recursive: true })
        // A real IDE save advances mtime. Windows copyFile can preserve source mtime,
        // which leaves Vite serving an older transformed module during HMR.
        await writeFile(target, await readFile(file, 'utf8'), 'utf8')
      }
      typecheck(id)
    }
    if (id === 0) {
      const reference = await context.newPage()
      await reference.goto(`${base}/reference.html#/quotations`)
      await expect(reference.getByText('Công cụ riêng workshop · không thuộc source sản phẩm', { exact: true })).toBeVisible()
      await reference.getByRole('link', { name: 'Tạo bản chào', exact: true }).click()
      await reference.getByRole('button', { name: 'Điền dữ liệu mẫu' }).click()
      await reference.getByRole('button', { name: 'Tính phí', exact: true }).click()
      await expect(reference.getByText(/1\.100\.000/).first()).toBeVisible()
      await reference.getByRole('button', { name: 'Lưu bản chào' }).click()
      await expect(reference.getByText('Đã lưu bản chào thành công.')).toBeVisible()
      await reference.reload()
      await expect(reference.getByRole('heading', { name: /^Q-/ })).toBeVisible()
      await reference.close()
    }
    if (id === 1) await expect(page.getByText('Bản chào của tôi', { exact: true })).toBeVisible()
    if (id >= 3 && id <= 9) {
      await page.reload()
      await expect(
        page.getByRole('heading', { name: 'Tạo bản chào bảo hiểm', exact: true }),
      ).toBeVisible()
    }
    if (id === 3) {
      await page.getByLabel('Tên khách hàng', { exact: false }).fill('Công ty Thử Demo')
      await page.getByText('Quan sát state thật của biểu mẫu', { exact: true }).click()
      await expect(page.getByTestId('draft-state')).toContainText('Công ty Thử Demo')
      await sample()
      await expect(page.getByLabel('Số tiền bảo hiểm', { exact: false })).toHaveValue('1000000000')
      await expect(page.getByRole('button', { name: 'Lưu bản chào' })).toBeDisabled()
    }
    if (id === 4) {
      await calculate()
      await expect(page.getByText('Vui lòng nhập tên khách hàng.')).toBeVisible()
      await sample()
      await page.getByLabel('Điện thoại', { exact: false }).fill('123abc')
      await page.getByLabel('Email', { exact: false }).fill('sai@')
      await page.getByLabel('Số tiền bảo hiểm', { exact: false }).fill('999999')
      await page.getByLabel('Ngày bắt đầu', { exact: false }).fill('2026-01-01')
      await page.getByLabel('Ngày kết thúc', { exact: false }).fill('2027-01-02')
      await calculate()
      await expect(page.getByText('Điện thoại cần có 10–11 chữ số.')).toBeVisible()
      await expect(page.getByText('Email chưa đúng định dạng', { exact: false })).toBeVisible()
      await expect(page.getByText('Thời hạn bảo hiểm tối đa 365 ngày.')).toBeVisible()
      await expect(
        page.getByText('Nhập số nguyên từ 1.000.000 đến 100.000.000.000 VND.'),
      ).toBeVisible()
      await sample()
      await calculate()
      await expect(page.getByRole('alert')).toContainText('Chưa xây tính phí')
    }
    if (id === 5) {
      await sample()
      await calculate()
      await expect(page.getByText(/1\.100\.000/).first()).toBeVisible()
      await page.getByLabel('Số tiền bảo hiểm', { exact: false }).fill('1005200')
      await page.getByLabel('Ngày bắt đầu', { exact: false }).fill('2026-01-01')
      await page.getByLabel('Ngày kết thúc', { exact: false }).fill('2026-01-03')
      await calculate()
      await expect(page.getByText(/^7\s*₫$/).first()).toBeVisible()
    }
    if (id === 6) {
      await sample()
      await calculate()
      await page.getByLabel('Số tiền bảo hiểm', { exact: false }).fill('2000000000')
      await expect(page.getByText('Cần tính lại phí', { exact: false })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Lưu bản chào' })).toBeDisabled()
      await calculate()
      await page.getByLabel('Tên khách hàng', { exact: false }).fill('Tên đổi, phí giữ nguyên')
      await expect(page.getByRole('button', { name: 'Lưu bản chào' })).toBeEnabled()
      await page.getByLabel('Ngày bắt đầu', { exact: false }).fill('2026-01-01')
      await expect(page.getByRole('button', { name: 'Lưu bản chào' })).toBeDisabled()
    }
    if (id === 7 || id === 8) {
      await page.getByText('Thử contract trực tiếp · bước 7–8', { exact: true }).click()
      await page.getByRole('button', { name: 'Thử tạo qua API' }).click()
      await expect(page.getByRole('status')).toContainText(id === 7 ? 'HTTP 501' : 'API đã tạo Q-')
    }
    if (id === 8) {
      const responses = await page.evaluate(async () => {
        const input = {
          type: 'NORMAL',
          line: 'PROPERTY',
          product: 'BASIC_PROPERTY',
          currency: 'VND',
          customer: { name: 'Kiểm tra contract Demo', phone: '', email: '' },
          asset: { name: 'Kho Demo', address: 'Địa chỉ hư cấu', sumInsured: 1_000_000_000 },
          period: { startDate: '2026-01-01', endDate: '2027-01-01' },
          premium: { total: 1 },
        }
        const created = await fetch('/api/practice/quotations', {
          method: 'POST',
          body: JSON.stringify(input),
        })
        const body = await created.json()
        const invalid = await fetch('/api/practice/quotations', {
          method: 'POST',
          body: JSON.stringify({ ...input, asset: { ...input.asset, sumInsured: 1 } }),
        })
        return {
          created: created.status,
          total: body.premium.total,
          invalid: invalid.status,
          notFound: (await fetch('/api/practice/quotations/missing')).status,
        }
      })
      expect(responses).toEqual({ created: 201, total: 1_100_000, invalid: 422, notFound: 404 })
    }
    if (id === 9) {
      await sample()
      await calculate()
      await page.getByText('Công cụ thử lỗi mock · dùng từ bước 8', { exact: true }).click()
      await page.getByRole('button', { name: 'Gây lỗi lần lưu kế tiếp' }).click()
      await page.getByRole('button', { name: 'Lưu bản chào' }).click()
      await expect(page.getByRole('alert')).toContainText('Lỗi lưu có chủ đích')
      await expect(page.getByLabel('Tên khách hàng', { exact: false })).toHaveValue(
        'Công ty TNHH Mộc An Demo',
      )
      await page.getByRole('button', { name: 'Lưu bản chào' }).click()
      await expect(page.getByRole('button', { name: 'Đang lưu' })).toBeDisabled()
      await expect(
        page.getByRole('heading', { name: 'Trang chi tiết chưa được xây' }),
      ).toBeVisible()
      savedUrl = page.url()
    }
    if (id === 10) {
      await page.goto(savedUrl)
      await page.reload()
      await expect(page.getByRole('heading', { name: /^Q-/ })).toBeVisible()
      savedNumber = await page.getByRole('heading', { level: 1 }).innerText()
      await page.reload()
      await expect(page.getByRole('heading', { name: savedNumber })).toBeVisible()
      await page.getByRole('link', { name: 'Về danh sách', exact: false }).click()
      await page.getByRole('link', { name: savedNumber, exact: true }).click()
      await expect(page).toHaveURL(savedUrl)
      const backup = await page.evaluate(() =>
        localStorage.getItem('quotation-workshop.practice.v1'),
      )
      await page.evaluate(() =>
        localStorage.setItem(
          'quotation-workshop.practice.v1',
          JSON.stringify({ version: 1, quotations: [] }),
        ),
      )
      await page.goto(`${base}/practice.html#/quotations`)
      await expect(page.getByRole('heading', { name: 'Chưa có bản chào nào' })).toBeVisible()
      await page.reload()
      await expect(page.getByRole('heading', { name: 'Chưa có bản chào nào' })).toBeVisible()
      await page.evaluate((value) => {
        if (value !== null) localStorage.setItem('quotation-workshop.practice.v1', value)
      }, backup)
      await page.goto(`${base}/practice.html#/quotations/missing`)
      await expect(page.getByRole('alert')).toContainText('Không tìm thấy bản chào')
    }
    if (id === 11) {
      await page
        .getByRole('navigation')
        .getByRole('link', { name: 'Danh sách', exact: true })
        .click()
      await page
        .getByRole('navigation')
        .getByRole('link', { name: 'Tạo bản chào', exact: true })
        .click()
      await sample()
      await calculate()
      await page.getByRole('button', { name: 'Hủy', exact: true }).click()
      await expect(page.getByRole('dialog')).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(page.getByLabel('Tên khách hàng', { exact: false })).toHaveValue(
        'Công ty TNHH Mộc An Demo',
      )
      await page.evaluate(() => history.back())
      await expect(page.getByRole('dialog')).toBeVisible()
      await page.getByRole('button', { name: 'Tiếp tục nhập' }).click()
      const pending = page.waitForEvent('dialog')
      await page.evaluate(() => {
        setTimeout(() => location.reload(), 0)
      })
      const dialog = await pending
      expect(dialog.type()).toBe('beforeunload')
      await dialog.dismiss()
      const countBefore = await page.evaluate(
        () => JSON.parse(localStorage.getItem('quotation-workshop.practice.v1')).quotations.length,
      )
      await page.getByRole('button', { name: 'Lưu bản chào' }).click()
      await expect(page.getByRole('button', { name: 'Đang lưu' })).toBeDisabled()
      await expect(page.getByText('Đã lưu bản chào thành công.')).toBeVisible()
      await expect(page.getByRole('dialog')).toHaveCount(0)
      const countAfter = await page.evaluate(
        () => JSON.parse(localStorage.getItem('quotation-workshop.practice.v1')).quotations.length,
      )
      expect(countAfter).toBe(countBefore + 1)
      await page.reload()
      await expect(page.getByRole('heading', { name: /^Q-/ })).toBeVisible()
      await page.screenshot({
        path: resolve(root, 'test-results/journey-completed.png'),
        fullPage: true,
      })
    }
    console.log(
      `Bước ${String(id).padStart(2, '0')}: ${lesson.title} — đã kiểm tra trong bản sao tạm`,
    )
  }
  const built = spawnSync(
    process.execPath,
    [resolve(root, 'node_modules/vite/bin/vite.js'), 'build'],
    { cwd: scratch, encoding: 'utf8', windowsHide: true },
  )
  if (built.status !== 0)
    throw new Error(`Build bài hoàn thành thất bại\n${built.stdout}\n${built.stderr}`)
  expect(await readFile(resolve(root, 'src/practice/pages/CreateQuotation.tsx'), 'utf8')).toBe(
    originalStarter,
  )
  console.log(
    `Hành trình 0–12 đạt; typecheck từng bước + build bản hoàn thành. Starter gốc được giữ nguyên.\nBản sao QA: ${scratch}`,
  )
} catch (error) {
  if (qaPage) {
    console.error(await qaPage.locator('body').innerText())
    await qaPage.screenshot({
      path: resolve(root, 'test-results/journey-failure.png'),
      fullPage: true,
    })
  }
  console.error(serverLog)
  throw error
} finally {
  if (browser) await browser.close()
  server.kill()
}
