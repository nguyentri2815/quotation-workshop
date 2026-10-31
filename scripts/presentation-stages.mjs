import ts from 'typescript'

function parse(code) { return ts.createSourceFile('stage.tsx',code,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX) }
function transform(code, select) {
  const source=parse(code), edits=[]
  function visit(node) {
    const next=select(node,source)
    if(next!==undefined) edits.push([node.getStart(source),node.end+(next===''&&code[node.end]===','?1:0),next])
    else ts.forEachChild(node,visit)
  }
  visit(source)
  for(const [start,end,next] of edits.sort((a,b)=>b[0]-a[0])) code=code.slice(0,start)+next+code.slice(end)
  return code
}
// These are different executable sources, never a complete form hidden by a stage flag.
export function fieldStage(staticCode, stage) {
  const allowed=stage==='contract'||stage==='example'?['id','label','children']:stage==='first'?['id','label','children','wide']:stage==='customer'?['id','label','children','wide','optional']:['id','label','children','wide','optional','hint']
  const source=parse(staticCode)
  const definition=source.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='Field')
  const properties=definition.parameters[0].type.members.filter(p=>allowed.includes(p.name.getText(source)))
  const contract='export type FieldProps = {\n'+properties.map(p=>'  '+p.getText(source)).join('\n')+'\n}\n'
  if(stage==='contract') return "import type { ReactNode } from 'react'\n"+contract+"export function CreateQuotation() { return <section data-testid=\"starter-empty\"><h1>Biểu mẫu chưa được xây</h1><p>Scaffold có sẵn; xem các bước tiếp theo.</p></section> }\n"
  let field=transform(definition.getText(source),node=>{
    if(ts.isObjectBindingPattern(node)&&ts.isParameter(node.parent)) return '{ '+allowed.join(', ')+' }'
    if(ts.isTypeLiteralNode(node)) return 'FieldProps'
    if(ts.isJsxAttribute(node)&&node.name.getText()==='className'&&!allowed.includes('wide')) return 'className={styles.field}'
    if(ts.isJsxExpression(node)) {
      const text=node.expression?.getText()??''
      if(text.startsWith('error &&')||text.startsWith('hint &&')&&!allowed.includes('hint')) return ''
      if(text.startsWith('optional ?')&&!allowed.includes('optional')) return ''
    }
  })
  if(stage==='example') return "import type { ReactNode } from 'react'\nimport styles from '../components/ui.module.css'\n"+contract+field+`\nexport function CreateQuotation() {
  return <section aria-labelledby="field-example"><h1 id="field-example">Minh họa Field · chưa ghép vào form</h1>
    <p>Một định nghĩa nhận label và children. Input chỉ đọc; bước 2 mới nối state.</p>
    <Field id="fieldExample" label="Trường minh họa"><input id="fieldExample" readOnly placeholder="Chưa nối dữ liệu" /></Field>
  </section>
}\n`
  const body=transform(staticCode,(node)=>{
    if(ts.isFunctionDeclaration(node)&&node.name?.text==='Field') return contract+field
    if(ts.isJsxElement(node)) {
      const open=node.openingElement
      const attr=name=>open.attributes.properties.find(a=>ts.isJsxAttribute(a)&&a.name.getText()===name)?.initializer
      const area=attr('aria-labelledby')?.text
      if(area==='period-heading'||area==='asset-heading'&&stage!=='asset')return ''
      if(open.tagName.getText()==='Field'&&stage==='first'&&attr('id')?.text!=='customerName')return ''
      const css=attr('className')?.getText()
      if(css==='{styles.premiumAside}'||css==='{styles.actionBar}')return ''
    }
    if(ts.isJsxText(node)&&node.getText().includes('Màn hình tĩnh: đủ trường'))return 'Trình bày tĩnh: chỉ các trường đã xây ở mốc này. Bước 2 mới nối dữ liệu.'
  })
  return body
}

export function draftStage(code, stage) {
  return transform(code,node=>{
    if(ts.isImportSpecifier(node)&&node.name.text==='ChangeEvent'&&stage==='draft')return ''
    if(ts.isFunctionDeclaration(node)&&node.name?.text==='updateDraft'&&stage==='draft')return ''
    if(ts.isPropertyAssignment(node)&&node.name.getText()==='onChange'&&stage==='draft')return ''
    if(ts.isJsxAttribute(node)&&node.name.getText()==='onClick'&&node.getText().includes('updateDraft(sampleDraft())')) return 'disabled title="Điền mẫu được nối ở mốc tiếp theo"'
    if(ts.isImportDeclaration(node)&&node.moduleSpecifier.text==='../quotation/types'&&!node.importClause.isTypeOnly)return "import { emptyDraft } from '../quotation/types'"
    if(ts.isVariableStatement(node)&&node.declarationList.declarations[0].name.getText()==='[draft, setDraft]'&&stage==='draft')return 'const [draft] = useState<QuotationDraft>({ ...emptyDraft })'
    if(ts.isVariableStatement(node)&&node.declarationList.declarations[0].name.getText()==='[errors, setErrors]'&&stage==='draft')return 'const [errors] = useState<FieldErrors>({})'
    if(ts.isVariableStatement(node)&&node.declarationList.declarations[0].name.getText()==='[notice, setNotice]'&&stage==='draft')return "const [notice] = useState('Draft đã khởi tạo; input chỉ đọc. Mốc tiếp nối onChange.')"
    if(ts.isJsxSpreadAttribute(node)&&stage==='draft')return node.getText()+' readOnly'
  })
}
