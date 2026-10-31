import { useEffect, useRef, useState } from 'react'
import { createHighlighterCore } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'
import type { CodeRow, SymbolRange } from './source'
import styles from './workshop.module.css'

const languages = {
  tsx: () => import('shiki/langs/tsx.mjs').then((m) => m.default),
  typescript: () => import('shiki/langs/typescript.mjs').then((m) => m.default),
  css: () => import('shiki/langs/css.mjs').then((m) => m.default),
  html: () => import('shiki/langs/html.mjs').then((m) => m.default),
}
const highlighter = createHighlighterCore({
  themes: [import('shiki/themes/github-light.mjs').then((m) => m.default)],
  langs: [],
  engine: createJavaScriptRegexEngine(),
})
type Token = { content: string; color?: string; fontStyle?: number }
export function CodeBlock({
  rows,
  path,
  range,
  oldRange,
  diff = false,
  jump = 0,
  targetKey = '',
}: {
  rows: CodeRow[]
  path: string
  range?: SymbolRange
  oldRange?: SymbolRange
  diff?: boolean
  jump?: number
  targetKey?: string
}) {
  const [tokens, setTokens] = useState<Token[][]>([])
  const [error, setError] = useState('')
  const scroll = useRef<HTMLDivElement>(null)
  const code = rows.map((row) => row.text).join('\n')
  const language = path.endsWith('.tsx')
    ? 'tsx'
    : path.endsWith('.css')
      ? 'css'
      : path.endsWith('.html')
        ? 'html'
        : 'typescript'
  useEffect(() => {
    let active = true
    setTokens([])
    setError('')
    async function render() {
      const engine = await highlighter
      if (!engine.getLoadedLanguages().includes(language))
        await engine.loadLanguage(languages[language]())
      const result = engine.codeToTokens(code, {
        lang: language,
        theme: 'github-light',
      })
      if (active) setTokens(result.tokens)
    }
    render().catch((reason: unknown) => {
      if (active)
        setError(
          reason instanceof Error
            ? reason.message
            : 'Không nạp được màu cú pháp',
        )
    })
    return () => {
      active = false
    }
  }, [code, language])
  useEffect(() => {
    const container = scroll.current
    const target = container?.querySelector<HTMLElement>(
      '[data-explained="true"]',
    )
    if (container && target)
      container.scrollTo({
        top:
          container.scrollTop +
          target.getBoundingClientRect().top -
          container.getBoundingClientRect().top -
          container.clientHeight / 3,
        behavior: 'instant',
      })
  }, [jump, targetKey, path, range?.qualified, range?.start, range?.end, diff])
  return (
    <div
      className={styles.codeScroll}
      ref={scroll}
      tabIndex={0}
      aria-label="Vùng code có thể cuộn"
      data-testid="code-scroll"
    >
      {error && (
        <p role="alert" className={styles.codeWarning}>
          Màu cú pháp chưa sẵn sàng: {error}. Code nguyên văn bên dưới.
        </p>
      )}
      <div
        className={styles.codeLines}
        data-testid="highlighted-code"
        data-ready={tokens.length > 0}
      >
        {rows.map((row, i) => {
          const line = row.line ?? row.newLine
          const explained =
            Boolean(
              range && line && line >= range.start && line <= range.end,
            ) ||
            Boolean(
              row.kind === 'remove' &&
                oldRange &&
                row.oldLine &&
                row.oldLine >= oldRange.start &&
                row.oldLine <= oldRange.end,
            )
          return (
            <div
              key={i}
              className={`${styles.codeLine} ${diff ? styles.diffLine : ''} ${row.kind ? styles[row.kind] : ''} ${explained ? styles.explained : ''}`}
              data-line={row.line}
              data-old-line={row.oldLine}
              data-new-line={row.newLine}
              data-explained={explained}
              title={explained ? `Đang giải thích: ${range?.name ?? oldRange?.name}` : undefined}
            >
              {diff ? (
                <>
                  <span className={styles.lineNumber} aria-hidden>
                    {row.oldLine ?? ''}
                  </span>
                  <span className={styles.lineNumber} aria-hidden>
                    {row.newLine ?? ''}
                  </span>
                  <span className={styles.diffSign} aria-hidden>
                    {row.kind === 'add'
                      ? '+'
                      : row.kind === 'remove'
                        ? '−'
                        : ''}
                  </span>
                </>
              ) : (
                <span className={styles.lineNumber} aria-hidden>
                  {row.line}
                </span>
              )}
              <code data-testid="source-line">
                {tokens[i]
                  ? tokens[i].map((token, j) => (
                      <span
                        key={j}
                        style={{
                          color: token.color,
                          fontStyle:
                            token.fontStyle && token.fontStyle & 1
                              ? 'italic'
                              : undefined,
                          fontWeight:
                            token.fontStyle && token.fontStyle & 2
                              ? 600
                              : undefined,
                        }}
                      >
                        {token.content}
                      </span>
                    ))
                  : row.text}
              </code>
            </div>
          )
        })}
      </div>
    </div>
  )
}
