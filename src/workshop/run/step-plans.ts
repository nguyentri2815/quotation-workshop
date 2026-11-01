import { checkpoints, checkpointFor } from '../catalog'
import { lessons } from '../steps'
import { operationAt } from '../operations'
import { findSymbol } from '../source'
import { revisionCheckpoints, revisionOperation, stageGroups } from '../../stage2/revision'
import { revisionRunPlan } from '../../stage2/runs'
import { runPlan } from './model'
import type { JourneySegment, LearningLink, RunPlan, RunTask, SourceLink } from './model'

const form = 'pages/CreateQuotation.tsx'
const source = (symbol: string, file = form): SourceLink => ({ file, symbol })
export function learningLink(
  stage: number,
  step: number,
  sub: number,
  foundation = false,
): LearningLink {
  const op = stage === 1 ? operationAt(step, sub) : revisionOperation(stageGroups[step].ids[sub])
  return {
    checkpoint: op.after.id,
    step,
    sub,
    title: op.title,
    file: op.file,
    symbol: op.symbol,
    foundation,
  }
}
export function learningOperation(stage: number, link: LearningLink) {
  return stage === 1
    ? operationAt(link.step, link.sub, link.mark)
    : revisionOperation(link.checkpoint)
}
export const stepRunVariants = (stage: number, step: number) =>
  step === (stage === 1 ? 5 : 4)
    ? [
        ['success', 'Lưu thành công'],
        ['retry', 'Lỗi lưu → retry chủ động'],
        ...(stage === 2 ? [['legacy', 'Đọc dữ liệu A kế thừa']] : []),
      ]
    : [['success', 'Hành trình của bước']]

/** Output checkpoints and journeys are explicit: never infer capabilities from a title. */
export function stepRunPlan(stage: number, step: number, variant = 'success'): RunPlan {
  if (![1, 2].includes(stage))
    throw new Error(`Chặng ${stage} chưa có bộ hành trình được biên soạn; không tự suy luận.`)
  const ids =
    stage === 1
      ? ['00', '03-fields', '03', '05', '06', '09', '12']
      : ['s2-r4-00', 's2-r4-entry', 's2-r4-panel', 's2-r4-summary', 's2-r4-complete']
  const catalog = stage === 1 ? checkpoints : revisionCheckpoints
  const checkpoint = catalog.find((cp) => cp.id === ids[step])
  if (!checkpoint) throw new Error(`Không có phiên cấp bước ${stage}/${step}`)
  const title = stage === 1 ? lessons[step].title : stageGroups[step].title
  let tasks: RunTask[] = [],
    entry = '/quotations/new',
    capabilities: string[] = []
  const segments: JourneySegment[] = []
  const add = (
    id: string,
    title: string,
    actions: RunTask[],
    links: LearningLink[],
    observation: string,
    caps: string[],
    flow?: string,
  ) => {
    const named = actions.map((task, i) => ({ ...task, id: `${id}-${i}-${task.kind}` }))
    tasks.push(...named)
    segments.push({
      id,
      title,
      taskIds: named.map((t) => t.id),
      builtAt: links,
      observation,
      capabilities: caps,
      flow,
    })
  }
  const link = (sub: number, foundation = false) => learningLink(stage, step, sub, foundation)
  const observe = (title: string, target: string, sources: SourceLink[]): RunTask => ({
    id: 'observe',
    kind: 'observe',
    title,
    instruction: title,
    target,
    resultTarget: target,
    sources,
    explanation:
      'Quan sát DOM đang có. Contract/type là nền tảng từ source, không phải runtime event.',
  })
  const base = (scenario: Parameters<typeof runPlan>[1]) => runPlan(checkpoint, scenario).tasks
  const stage2 = (scenario: string) => revisionRunPlan(checkpoint, scenario).tasks
  if (stage === 1) {
    if (step === 1) {
      capabilities = ['static-ui']
      const field = {
        ...runPlan(checkpoints.find((cp) => cp.id === '03-fields')!, 'field').tasks[0],
        count: 8,
      }
      add(
        'fields',
        'Từ contract Field đến ba nhóm thông tin',
        [field],
        [link(0), link(1), link(2)],
        'Tám trường có nhãn, chỉ đọc; chưa nhập, chưa tính phí.',
        capabilities,
      )
    } else if (step === 2) {
      capabilities = ['input']
      const input = base('input')[0]
      add(
        'input',
        'Nhập rồi sửa cùng một trường',
        [
          { ...input, value: 'Khách hàng học thử' },
          {
            ...input,
            title: 'Sửa tên khách hàng',
            instruction: 'Sửa Tên khách hàng thành tên khác.',
            value: 'Khách hàng đã sửa',
          },
        ],
        [link(0, true), link(1), link(2)],
        'Giá trị input đổi qua hai lần nhập; chưa validation hoặc tính phí.',
        capabilities,
        'input-edit',
      )
    } else if (step === 3) {
      capabilities = ['input', 'validation', 'pricing']
      add(
        'invalid',
        'Đầu vào sai → lỗi tại trường',
        base('validation'),
        [link(0, true), link(1), link(4)],
        'Form rỗng báo lỗi, chưa có phí.',
        ['validation'],
        'calculate',
      )
      add(
        'price',
        'Sửa dữ liệu → tính thành công',
        base('calculate'),
        [link(0, true), link(2), link(3), link(4)],
        'Một tỷ / 365 ngày → tổng phí 1.100.000 VND.',
        ['input', 'pricing'],
        'calculate',
      )
    } else if (step === 4) {
      capabilities = ['input', 'pricing', 'fee-consistency']
      const actions = base('invalidate')
      add(
        'price',
        'Có phí ban đầu',
        actions.slice(0, 2),
        [link(0, true), link(1)],
        'Phí hợp lệ trước khi sửa.',
        ['pricing'],
        'calculate',
      )
      add(
        'unrelated',
        'Sửa tên khách hàng → giữ phí',
        [{ ...base('input')[0], value: 'Tên mới, giữ phí', preservePremium: true }],
        [link(0, true), link(1)],
        'Tên khách hàng không tham gia công thức; phí giữ nguyên.',
        ['fee-consistency'],
        'input-edit',
      )
      add(
        'related',
        'Sửa số tiền → phí hết hiệu lực → tính lại',
        actions.slice(2),
        [link(0, true), link(1)],
        'Hai tỷ → cần tính lại → tổng phí 2.200.000 VND.',
        ['fee-consistency', 'pricing'],
        'input-edit',
      )
    } else if (step >= 5) {
      capabilities = ['input', 'pricing', 'save', ...(step === 6 ? ['read', 'reload'] : [])]
      const actions = base(variant === 'retry' ? 'save-retry' : 'save')
      add(
        'prepare',
        'Dữ liệu hợp lệ và phí',
        actions.slice(0, 2),
        [learningLink(1, 3, 4), learningLink(1, 4, 1)],
        'Chuẩn bị phí trước khi lưu.',
        ['input', 'pricing'],
        'calculate',
      )
      add(
        'save',
        variant === 'retry'
          ? 'HTTP 500 → giữ form → bạn chủ động retry'
          : 'Contract → API → bản chào đã lưu',
        actions.slice(2),
        step === 5
          ? [link(0, true), link(1), link(2), link(3), link(4), link(5), link(6)]
          : [learningLink(1, 5, 5), link(1)],
        'Chỉ xác nhận từ response MSW và UI; không gửi lại khi xem source.',
        ['save'],
        'save',
      )
      if (step === 6) {
        const task = (
          kind: 'reopen' | 'reload-record',
          title: string,
          sources: SourceLink[],
        ): RunTask => ({
          id: kind,
          kind,
          title,
          instruction: title,
          target: 'saved',
          resultTarget: 'saved',
          sources,
          explanation: 'UI đọc lại và GET MSW là bằng chứng; parser/storage là diễn giải source.',
        })
        add(
          'read',
          'Danh sách → chi tiết → reload',
          [
            task('reopen', 'Về danh sách rồi mở lại bản chào', [
              source('QuotationList', 'pages/QuotationList.tsx'),
            ]),
            task('reload-record', 'Reload chi tiết đã lưu', [
              source('QuotationDetail', 'pages/QuotationDetail.tsx'),
            ]),
          ],
          [link(0), link(1), link(2), link(3)],
          'ID, số bản chào và tổng phí giữ nguyên khi đọc lại.',
          ['read', 'reload'],
          'read',
        )
      }
    }
  } else {
    if (step === 0) {
      capabilities = ['baseline']
      add(
        'baseline',
        'Nhận diện thông tin cố định của Chặng 1',
        [
          observe('Quan sát form A kế thừa; chưa có catalog Chặng 2', 'root', [
            source('CreateQuotation'),
          ]),
        ],
        [link(0)],
        'Form baseline là đích xuất phát, chưa có hành vi chọn sản phẩm.',
        capabilities,
      )
    } else {
      entry = '/products'
      if (step === 1) {
        capabilities = ['catalog', 'select-product', 'product-context', 'navigation']
        const open = { ...stage2('select-product')[0], resultTarget: 'productInfo' }
        add(
          'catalog',
          'Catalog runtime → hai thẻ A/B',
          stage2('catalog'),
          [link(0, true), link(1, true), link(2), link(3), link(4), link(5), link(6), link(7)],
          'propertyProducts được khai báo, import và map thành hai thẻ; type không phát sự kiện runtime.',
          ['catalog'],
        )
        add(
          'a',
          'Chọn A → ngữ cảnh form A',
          [
            {
              ...open,
              value: 'BASIC_PROPERTY',
              title: 'Chọn A trên trang /products',
              instruction: 'Bấm Tạo bản chào ở thẻ Tài sản cơ bản.',
            },
          ],
          [link(7), link(8), link(9)],
          'Định danh A qua route được kiểm tra rồi render ngữ cảnh A.',
          ['select-product', 'product-context'],
          'product',
        )
        add(
          'back',
          'Điều hướng thật về trang chọn',
          [
            {
              id: 'back',
              kind: 'back-products',
              title: 'Danh sách bản chào → Tạo bản chào mới',
              instruction: 'Bấm Danh sách bản chào, rồi Tạo bản chào để trở lại /products.',
              target: 'root',
              resultTarget: 'root',
              sources: [
                source('Layout', 'App.tsx'),
                source('QuotationList', 'pages/QuotationList.tsx'),
              ],
              explanation: 'Bấm Link thật trong ứng dụng, không gán URL hoặc chuyển snapshot.',
            },
          ],
          [link(8), link(9)],
          'Đi qua danh sách thật rồi trở lại catalog.',
          ['navigation'],
        )
        add(
          'b',
          'Chọn B → ngữ cảnh form B',
          [open],
          [link(0, true), link(3), link(8), link(9)],
          'Catalog → presentation → hành động chọn → ngữ cảnh B. Không mở panel, validation hoặc lưu.',
          ['select-product', 'product-context'],
          'product',
        )
      } else if (step === 2) {
        capabilities = [
          'catalog',
          'select-product',
          'pricing-a',
          'switch-product',
          'fee-consistency',
        ]
        const actions = stage2('switch')
        add(
          'prepare',
          'Chọn A, nhập draft và tính phí A',
          actions.slice(0, 3),
          [learningLink(2, 1, 8), learningLink(2, 1, 9)],
          'Có draft và phí A trước khi thử đổi.',
          ['select-product', 'pricing-a'],
          'calculate',
        )
        add(
          'cancel',
          'Mở panel, chọn tạm B rồi hủy',
          actions.slice(3, 4),
          [link(0), link(1)],
          'Hủy giữ A, draft và phí.',
          ['switch-product'],
          'product',
        )
        add(
          'apply',
          'Xác nhận B rồi trở lại A',
          actions.slice(4),
          [link(0), link(1), link(2)],
          'Xác nhận giữ draft, vô hiệu phí; chưa tính B hay lưu.',
          ['switch-product', 'fee-consistency'],
          'product',
        )
      } else if (step === 3) {
        capabilities = ['catalog', 'select-product', 'validation', 'pricing-b', 'receipt']
        const actions = stage2('b-calculate')
        add(
          'invalid',
          'Chọn B, nhập 365 ngày → lỗi',
          actions.slice(0, 3),
          [link(0, true), link(1), link(2), link(3)],
          'Quy tắc B tối đa 180 ngày; lỗi tại Ngày kết thúc.',
          ['select-product', 'validation'],
          'calculate',
        )
        add(
          'price',
          'Sửa 180 ngày → phí và receipt B',
          actions.slice(3),
          [link(4), link(5), link(6), link(7)],
          'Tổng 813.699 VND, gắn đúng sản phẩm/phiên bản; chưa lưu.',
          ['pricing-b', 'receipt'],
          'calculate',
        )
      } else if (step === 4) {
        capabilities = [
          'catalog',
          'select-product',
          'validation',
          'pricing-b',
          'save',
          'read',
          'reload',
          'legacy-adapter',
        ]
        const actions = stage2(
          variant === 'retry' ? 'retry-save' : variant === 'legacy' ? 'legacy-read' : 'b-save',
        )
        if (variant === 'legacy')
          add(
            'legacy',
            'Adapter dữ liệu A cũ → chi tiết → reload',
            actions,
            [link(0, true), link(1), link(2), link(3)],
            'Đọc bản ghi A thiếu định danh theo adapter đã ghim.',
            ['legacy-adapter', 'read', 'reload'],
            'read',
          )
        else {
          const count = variant === 'retry' ? 3 : 5
          add(
            'prepare',
            'Sản phẩm, đầu vào hợp lệ và phí',
            actions.slice(0, count),
            [learningLink(2, 1, 9), learningLink(2, 3, 2), learningLink(2, 3, 7)],
            'Chỉ lưu khi phí còn khớp sản phẩm/phiên bản.',
            ['select-product', 'validation'],
            'calculate',
          )
          add(
            'save',
            variant === 'retry' ? 'Lỗi lưu → retry chủ động → đọc lại' : 'Lưu → mở lại → reload',
            actions.slice(count),
            [link(0, true), link(1), link(2), link(3)],
            'Response và dữ liệu đọc lại giữ đúng sản phẩm, phiên bản, ID và tổng phí.',
            ['save', 'read', 'reload'],
            'save',
          )
        }
      }
    }
  }
  const supported = tasks.length > 0 && stepRunVariants(stage, step).some(([id]) => id === variant)
  const plan: RunPlan = {
    scenario: 'step',
    title: `Cả bước: ${title}`,
    checkpoint,
    entry,
    supported,
    reason: supported
      ? `Checkpoint đầu ra ${checkpoint.id}. Một hành trình liên tục, dữ liệu riêng; không tăng tiến độ.`
      : tasks.length
        ? `Hành trình “${variant}” chưa được biên soạn cho bước này; không tự chạy thay thế.`
        : 'Bước mở đầu chỉ quan sát yêu cầu; checkpoint 00 chưa có hành vi nghiệp vụ. Dùng bản tham chiếu riêng trong bài học để khám phá đích, không chạy giả tại mốc 00.',
    tasks,
    journey: {
      stage,
      revision: stage === 1 ? 'journey-2' : '4',
      step,
      title,
      outputCheckpoint: checkpoint.id,
      variant,
      initial:
        'Phiên mới có form rỗng và kho bản chào riêng. Dữ liệu mẫu được điền bằng thao tác thật trong hành trình; không đọc hoặc sửa practice.',
      observe: segments.map((s) => s.title).join(' → '),
      capabilities,
      segments,
      summary:
        'Các kết quả bên dưới lấy từ DOM/MSW của phiên. Các liên kết “Được xây tại” giải thích những phần source phối hợp; không đánh dấu hoàn thành bài học.',
    },
  }
  const errors = validateStepPlan(plan)
  if (errors.length) {
    plan.supported = false
    plan.reason = `Chưa chạy: tham chiếu hành trình không hợp lệ. ${errors.join('; ')}`
  }
  return plan
}

export function validateStepPlan(plan: RunPlan): string[] {
  const j = plan.journey,
    errors: string[] = []
  if (!j) return ['Thiếu metadata cấp bước']
  if (
    ![1, 2].includes(j.stage) ||
    !Number.isInteger(j.step) ||
    j.step < 0 ||
    j.step >= (j.stage === 1 ? 7 : 5)
  )
    return ['Chặng/bước chưa được biên soạn']
  const catalog = j.stage === 1 ? checkpoints : revisionCheckpoints
  if (j.outputCheckpoint !== plan.checkpoint.id) errors.push('Checkpoint phiên khác đầu ra')
  const expected =
    j.stage === 1
      ? checkpointFor(j.step, lessons[j.step].tasks.length - 1).id
      : stageGroups[j.step].ids.at(-1)
  if (expected !== j.outputCheckpoint) errors.push('Không phải checkpoint đầu ra bước')
  const visited = new Set<string>()
  for (const segment of j.segments) {
    for (const id of segment.taskIds) {
      if (!plan.tasks.some((t) => t.id === id) || visited.has(id))
        errors.push(`Task sai/trùng ${id}`)
      visited.add(id)
    }
    for (const cap of segment.capabilities)
      if (!j.capabilities.includes(cap)) errors.push(`Capability chưa hỗ trợ ${cap}`)
    for (const link of segment.builtAt) {
      const cp = catalog.find((cp) => cp.id === link.checkpoint)
      if (
        !cp ||
        cp.order > plan.checkpoint.order ||
        !findSymbol(link.checkpoint, link.file, link.symbol)
      )
        errors.push(`Source sai ${link.checkpoint}/${link.symbol}`)
      try {
        const op = learningOperation(j.stage, link)
        if (op.after.id !== link.checkpoint || op.step !== link.step || op.sub !== link.sub)
          errors.push(`Sub-step sai ${link.checkpoint}`)
      } catch {
        errors.push(`Sub-step không tồn tại ${link.step}/${link.sub}`)
      }
    }
  }
  if (visited.size !== plan.tasks.length) errors.push('Task ngoài đoạn hành trình')
  for (const task of plan.tasks)
    if (
      !task.sources.length ||
      task.sources.some((s) => !findSymbol(plan.checkpoint.id, s.file, s.symbol))
    )
      errors.push(`Source phiên sai ${task.id}`)
  return errors
}

export function stepRunUrl(plan: RunPlan, mode = 'demo') {
  const url = new URL(location.href)
  url.searchParams.set('run', plan.scenario)
  url.searchParams.set('runMode', mode)
  if (plan.journey) {
    url.searchParams.set('runScope', 'step')
    url.searchParams.set('runVariant', plan.journey.variant)
  } else {
    url.searchParams.delete('runScope')
    url.searchParams.delete('runVariant')
  }
  return url.href
}
