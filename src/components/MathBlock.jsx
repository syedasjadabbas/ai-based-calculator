import katex from 'katex'
import { useMemo } from 'react'

export function MathBlock({ expression, displayMode = true, className = '' }) {
  const html = useMemo(() => {
    if (!expression) {
      return ''
    }

    try {
      return katex.renderToString(expression, {
        displayMode,
        throwOnError: false,
        strict: false,
      })
    } catch {
      return expression
    }
  }, [displayMode, expression])

  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />
}