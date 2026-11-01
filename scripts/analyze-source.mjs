import ts from 'typescript'
import postcss from 'postcss'
import { analysisFor } from './file-analysis.mjs'

export function analyzeSource(path, code, checkpoint) {
  const ranges = []
  if (path.endsWith('.css')) {
    const root = postcss.parse(code, { from: path })
    const sections = []
    root.each((node, i) => {
      if (node.type !== 'rule' && node.type !== 'atrule') return
      const name = node.type === 'rule' ? node.selector : '@' + node.name + ' ' + node.params
      const range = { name, qualified: name, kind: 'CSS', start: node.source.start.line, end: node.source.end.line }
      const declarations = []
      node.walkDecls(decl => declarations.push(decl.prop + ': ' + decl.value))
      ranges.push(range)
      sections.push({ id: 'css-' + i, title: name, role: path === 'styles.css' ? `Kiểu nền toàn ứng dụng cho ${name}; stylesheet được main.tsx nạp từ scaffold.` : `CSS Module cho ${name}; class được component truy cập qua styles.`, input: declarations.filter(value => value.includes('var(')).join('; ') || 'Selector và điều kiện media của quy tắc.', output: declarations.join('; ') || 'Các quy tắc CSS con trong phạm vi này.', links: [], ranges: [range] })
    })
    return { ranges, sections }
  }
  if (path === 'index.html') {
    if (!code.includes('id="root"') || !code.includes('src="./main.tsx"')) throw new Error('HTML scaffold changed')
    const range = { name: 'root + module main.tsx', qualified: 'entrypoint', kind: 'HTML', start: 2, end: 2 }
    return { ranges: [range], sections: [{ id: 'entrypoint', title: 'Entrypoint riêng của checkpoint', role: 'HTML host riêng workshop; root nhận React, script nạp đúng main.tsx cùng thư mục.', input: 'Entry URL của checkpoint và script module ./main.tsx.', output: 'DOM root trước khi worker/React khởi động.', links: [{ file: 'main.tsx', symbol: 'start', label: 'Khởi động React và mock' }], ranges: [range] }] }
  }
  if (!/\.tsx?$/.test(path)) return { ranges, sections: [] }
  const source = ts.createSourceFile(path, code, ts.ScriptTarget.Latest, true, path.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
  if (source.parseDiagnostics.length) throw new Error(`Không parse được ${checkpoint}/${path}`)
  function add(name, qualified, kind, node) {
    const start = source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1
    const end = source.getLineAndCharacterOfPosition(node.end - 1).line + 1
    const range = { name, qualified, kind, start, end }
    ranges.push(range)
    return range
  }
  const counts = new Map()
  // Narrow reference ranges for the authored workshop dependency links only.
  // This extends the checkpoint source index; it does not discover repository dependencies.
  const dependencyCalls = new Set(['formatMoney','calculatePremium','validatedInput','validateAndBuildInput','validateDraft','calendarDays','calendarDay','updateDraft','inputProps','save','setDraft','setPremium','setCalculatedBefore','setNotice','setErrors','setMessage','setSaving','sampleDraft','parseQuotation','requireQuotation','parseQuotationInput','createQuotation','readQuotations','persist','request','worker.start','quotationsApi.create','quotationsApi.list','quotationsApi.get','blocker.reset','blocker.proceed'])
  const dependencyReads = new Set(['draft','errors','premium','calculatedBefore','message','notice','saving','formRef','saveInFlight','allowLeave','dirty','router','MIN_SUM_INSURED','MAX_SUM_INSURED'])
  if (checkpoint.startsWith('s2-r4-')) {
    for (const name of ['propertyProducts','basicProperty','product','productCode','candidate','currentPremium','validated']) dependencyReads.add(name)
    for (const name of ['getPropertyProduct','calculateDraftPremium','premiumMatchesDraft','setCandidate','setProductCode','setValidated','quotationsApi.listResult']) dependencyCalls.add(name)
  }
  function site(owner, kind, target, node) {
    const key = `${owner}.site:${kind}:${target}`
    const count = (counts.get(key) ?? 0) + 1
    counts.set(key, count)
    add(node.getText(source), `${key}[${count}]`, 'DependencySite', node)
  }
  function visit(node, owner = '') {
    let name = '', kind = ''
    if (ts.isFunctionDeclaration(node) || ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node) || ts.isClassDeclaration(node) || ts.isMethodDeclaration(node)) {
      name = node.name?.getText(source) ?? ''
      kind = ts.SyntaxKind[node.kind]
    } else if (ts.isPropertyAssignment(node) && (ts.isArrowFunction(node.initializer) || ts.isFunctionExpression(node.initializer))) {
      name = node.name.getText(source); kind = 'Handler'
    } else if (ts.isVariableDeclaration(node)) {
      name = ts.isIdentifier(node.name) ? node.name.text : node.name.elements.map(el => el.name?.getText(source)).filter(Boolean)[0] ?? ''
      kind = 'VariableDeclaration'
    }
    const qualified = name ? (owner ? owner + '.' + name : name) : owner
    if (name) add(name, qualified, kind, node)
    if (ts.isImportDeclaration(node)) add(node.moduleSpecifier.text, 'import:' + node.moduleSpecifier.text, 'Import', node)
    if (node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) {
      const modifier = node.modifiers.find(m => m.kind === ts.SyntaxKind.ExportKeyword)
      const label = name || (ts.isVariableStatement(node) ? node.declarationList.declarations[0].name.getText(source) : '{}')
      add(label, 'export:' + label, 'Export', modifier)
    }
    if (ts.isExportDeclaration(node)) add(node.getText(source), 'export:{}', 'Export', node)
    if (ts.isCallExpression(node) && dependencyCalls.has(node.expression.getText(source)))
      site(owner, 'call', node.expression.getText(source), node)
    if (checkpoint.startsWith('s2-r4-') && ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === 'map' && node.expression.expression.getText(source) === 'propertyProducts')
      add('Catalog → thẻ sản phẩm', owner + '.catalog-map', 'DependencySite', node)
    if (ts.isTypeReferenceNode(node)) site(owner, 'type', node.typeName.getText(source), node)
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken && ts.isPropertyAccessExpression(node.left) && dependencyReads.has(node.left.expression.getText(source)))
      site(owner, 'write', node.left.expression.getText(source), node)
    if (ts.isIdentifier(node) && dependencyReads.has(node.text)) {
      const parent = node.parent
      const declaration = (ts.isVariableDeclaration(parent) || ts.isBindingElement(parent) || ts.isParameter(parent) || ts.isPropertySignature(parent)) && parent.name === node
      const propertyName = (ts.isPropertyAccessExpression(parent) || ts.isPropertyAssignment(parent) || ts.isJsxAttribute(parent)) && parent.name === node
      const assignment = ts.isPropertyAccessExpression(parent) && ts.isBinaryExpression(parent.parent) && parent.parent.left === parent && parent.parent.operatorToken.kind === ts.SyntaxKind.EqualsToken
      if (!declaration && !propertyName && !assignment && !ts.isImportSpecifier(parent) && !ts.isTypeReferenceNode(parent))
        site(owner, 'read', node.text, ts.isPropertyAccessExpression(parent) ? parent : node)
    }
    if (ts.isCallExpression(node) && node.expression.getText(source) === 'useEffect') {
      const key = owner + '.useEffect'
      const count = (counts.get(key) ?? 0) + 1
      counts.set(key, count)
      add(`useEffect #${count}`, key + '[' + count + ']', 'Effect', node)
    }
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && node.expression.expression.getText(source) === 'quotationsApi')
      add(node.expression.getText(source), owner + '.' + node.expression.getText(source), 'Request', node)
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
      const opening = ts.isJsxElement(node) ? node.openingElement : node
      const attrs = opening.attributes.properties.filter(ts.isJsxAttribute)
      const component = opening.tagName.getText(source)
      if (checkpoint.startsWith('s2-r4-') && attrs.some(attr=>attr.name.getText(source)==='data-priced-product'))
        add('Định danh kết quả đã tính', owner+'.receipt-identity', 'JSX', node)
      if (checkpoint.startsWith('s2-')) {
        const id = attrs.find(attr => attr.name.getText(source) === 'id')?.initializer
        if (component === 'select' && id && ts.isStringLiteral(id) && id.text === 'productCode')
          add('Selector sản phẩm', owner + '.selector', 'JSX', node)
        if (component === 'ProductInformation') add('Props ProductInformation', owner + '.props.ProductInformation', 'JSX', node)
      }
      if (['Layout','CreateQuotation','Field','PremiumSummary','AsyncMessage'].includes(component)) site(owner, 'jsx', component, node)
      if (opening.tagName.getText(source) === 'button') {
        const click = attrs.find(a => a.name.getText(source) === 'onClick')?.initializer
        if (click && ts.isJsxExpression(click) && click.expression?.getText(source) === 'calculate')
          add('Nút Tính phí → calculate', owner + '.action.calculate', 'JSX', node)
      }
      if (opening.tagName.getText(source) === 'PremiumSummary')
        add('Props PremiumSummary', owner + '.props.PremiumSummary', 'JSX', node)
      if (opening.tagName.getText(source) === 'Field') {
        const id = attrs.find(a => a.name.getText(source) === 'id')?.initializer
        if (id && ts.isStringLiteral(id)) add('Field · '+id.text, owner+'.field.'+id.text, 'FieldUse', node)
      }
      const aria = attrs.find(a => a.name.getText(source) === 'aria-labelledby')
      const cls = attrs.find(a => a.name.getText(source) === 'className')
      let label = aria?.initializer && ts.isStringLiteral(aria.initializer) ? aria.initializer.text : ''
      if (!label && cls?.initializer && ts.isJsxExpression(cls.initializer) && cls.initializer.expression && ts.isPropertyAccessExpression(cls.initializer.expression)) label = cls.initializer.expression.name.text
      if (!label && ['form', 'dialog'].includes(opening.tagName.getText(source))) label = opening.tagName.getText(source)
      if (label) add(opening.tagName.getText(source) + ' · ' + label, owner + '.jsx.' + label, 'JSX', node)
      for (const attr of attrs) {
        if (attr.name.getText(source) === 'disabled') add('disabled', owner + '.disabled:' + attr.initializer?.getText(source), 'Guard', attr)
        if (attr.name.getText(source) === 'onSubmit') add('onSubmit', owner + '.onSubmit', 'Handler', attr)
      }
    }
    const ownsScope = name && (!ts.isVariableDeclaration(node) || (node.initializer && (ts.isObjectLiteralExpression(node.initializer) || ts.isArrowFunction(node.initializer) || ts.isFunctionExpression(node.initializer))))
    ts.forEachChild(node, child => visit(child, ownsScope ? qualified : owner))
  }
  visit(source)
  // Narrow groups are resolved from AST statements; never use the whole page as a handler range.
  function span(name, qualified, nodes) {
    if (!nodes.length) return
    const first = add(name, qualified, 'Role', nodes[0])
    first.end = source.getLineAndCharacterOfPosition(nodes.at(-1).end - 1).line + 1
  }
  function details(node) {
    if (ts.isFunctionDeclaration(node) && node.name?.text === 'Field') {
      if(node.parameters[0]?.type) add('Contract Field','Field.contract','Contract',node.parameters[0].type)
      const view=node.body.statements.find(ts.isReturnStatement)
      if(view) add('Vỏ trình bày Field','Field.render','JSX',view)
    }

    if (ts.isFunctionDeclaration(node) && node.name?.text === 'inputProps') {
      const statement = node.body.statements.find(ts.isReturnStatement)
      if (statement?.expression && ts.isObjectLiteralExpression(statement.expression))
        span('props đọc state', 'CreateQuotation.inputProps.read', statement.expression.properties.filter(p => !['onChange','onBlur'].includes(p.name?.getText(source))))
    }
    if (ts.isFunctionDeclaration(node) && node.name?.text === 'calculate') {
      const statements = [...node.body.statements], index = statements.findIndex(s => s.getText(source).startsWith('setPremium('))
      if (index >= 0) span('Kết quả tính phí', 'CreateQuotation.calculate.result', statements.slice(index))
    }
    if (ts.isFunctionDeclaration(node) && node.name?.text === 'save') {
      const statements = [...node.body.statements], lock = statements.findIndex(s => s.getText(source).startsWith('saveInFlight.current = true'))
      if (lock >= 0) {
        span('Điều kiện lưu', 'CreateQuotation.save.guards', statements.slice(0,lock))
        const attempt=statements.find(ts.isTryStatement)
        span('Khóa lưu', 'CreateQuotation.save.lock', statements.slice(lock,statements.indexOf(attempt)))
        if (attempt) {
          span('Sau response thành công', 'CreateQuotation.save.success', [...attempt.tryBlock.statements].slice(1))
          if (attempt.catchClause) add('catch lưu', 'CreateQuotation.save.catch', 'Role', attempt.catchClause)
        }
      }
    }
    ts.forEachChild(node, details)
  }
  details(source)
  return { ranges, sections: analysisFor(path, ranges, code, checkpoint) }
}
