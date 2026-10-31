// Author QA: edit a disposable copy of the real practice source, never the learner's files.
import { cp, mkdir, readFile, symlink, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { createServer } from 'node:net'
import { resolve } from 'node:path'
import { spawn } from 'node:child_process'
import { chromium, expect } from '@playwright/test'

const root = resolve(import.meta.dirname, '..')
const scratch = resolve(root, '.verification', `hmr-${Date.now()}`)
await mkdir(resolve(scratch, 'src'), { recursive: true })
for (const path of ['src/practice', 'public', 'practice.html', 'package.json']) {
  await cp(resolve(root, path), resolve(scratch, path), { recursive: true })
}
await symlink(resolve(root, 'node_modules'), resolve(scratch, 'node_modules'), 'junction')
await writeFile(
  resolve(scratch, 'vite.config.mjs'),
  "import react from '@vitejs/plugin-react'\nexport default { plugins: [react()] }\n",
)
const sourcePath = 'src/practice/pages/CreateQuotation.tsx'
const original = await readFile(resolve(root, sourcePath))
const hash = (value) => createHash('sha256').update(value).digest('hex')
const port = await new Promise((done, reject) => {
  const probe = createServer().on('error', reject)
  probe.listen(0, 'localhost', () => {
    const address = probe.address()
    if (!address || typeof address === 'string') return reject(new Error('Không chọn được port QA'))
    probe.close(() => done(address.port))
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
let logs = ''
server.stdout.on('data', (value) => {
  logs = (logs + value).slice(-4000)
})
server.stderr.on('data', (value) => {
  logs = (logs + value).slice(-4000)
})
let browser
try {
  for (let attempt = 0; attempt < 80; attempt++) {
    try {
      if ((await fetch(base + '/practice.html')).ok) break
    } catch (error) {
      if (attempt === 79) throw new Error(`${String(error)}\n${logs}`)
    }
    await new Promise((done) => setTimeout(done, 150))
  }
  browser = await chromium.launch({ channel: 'chrome' })
  const page = await browser.newPage()
  await page.goto(base + '/practice.html#/quotations/new')
  const marker = 'HMR đã nhận source thực hành'
  const before = original.toString('utf8')
  if (!before.includes('Biểu mẫu chưa được xây'))
    throw new Error(
      'Ca QA này dành cho khung khởi đầu; không tự thay source người học để chạy test.',
    )
  await expect(page.getByRole('heading', { name: 'Biểu mẫu chưa được xây' })).toBeVisible()
  const timeOrigin = await page.evaluate(() => performance.timeOrigin)
  await writeFile(resolve(scratch, sourcePath), before.replace('Biểu mẫu chưa được xây', marker))
  await expect(page.getByRole('heading', { name: marker })).toBeVisible()
  expect(await page.evaluate(() => performance.timeOrigin)).toBe(timeOrigin)
  // Keep the two saves outside the filesystem watcher's short debounce window.
  await new Promise((done) => setTimeout(done, 250))
  await writeFile(resolve(scratch, sourcePath), original)
  await expect(page.getByRole('heading', { name: 'Biểu mẫu chưa được xây' })).toBeVisible()
  expect(hash(await readFile(resolve(root, sourcePath)))).toBe(hash(original))
  console.log(
    'HMR: sửa → thấy thay đổi không reload → khôi phục trong bản sao riêng. Source gốc không đổi.\n' +
      scratch,
  )
} finally {
  await writeFile(resolve(scratch, sourcePath), original)
  if (browser) await browser.close()
  server.kill()
}
