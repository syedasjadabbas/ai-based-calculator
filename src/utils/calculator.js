import { all, create } from 'mathjs'

const math = create(all, {})

function normalizeExpression(expression) {
  return expression
    .replaceAll('×', '*')
    .replaceAll('÷', '/')
    .replaceAll('−', '-')
    .replaceAll('π', 'pi')
    .replace(/\bln\(/gi, 'ln(')
    .replace(/\blog\(/gi, 'log10(')
    .replace(/\bsin\(/gi, 'sin(')
    .replace(/\bcos\(/gi, 'cos(')
    .replace(/\btan\(/gi, 'tan(')
    .replace(/\babs\(/gi, 'abs(')
}

function createScope(angleMode, answer, memory) {
  const toRadians = (value) => (angleMode === 'deg' ? (value * Math.PI) / 180 : value)

  return {
    pi: Math.PI,
    e: Math.E,
    ans: answer,
    m: memory,
    sin: (value) => Math.sin(toRadians(value)),
    cos: (value) => Math.cos(toRadians(value)),
    tan: (value) => Math.tan(toRadians(value)),
    asin: (value) => (angleMode === 'deg' ? (Math.asin(value) * 180) / Math.PI : Math.asin(value)),
    acos: (value) => (angleMode === 'deg' ? (Math.acos(value) * 180) / Math.PI : Math.acos(value)),
    atan: (value) => (angleMode === 'deg' ? (Math.atan(value) * 180) / Math.PI : Math.atan(value)),
    sqrt: Math.sqrt,
    abs: Math.abs,
    log10: Math.log10,
    ln: Math.log,
    exp: Math.exp,
    pow: Math.pow,
    floor: Math.floor,
    ceil: Math.ceil,
    round: Math.round,
  }
}

export function formatNumber(value) {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      return value.toString()
    }

    const rounded = Number.parseFloat(value.toPrecision(12))
    return Number.isInteger(rounded) ? String(rounded) : String(rounded)
  }

  if (math.typeOf(value) === 'BigNumber') {
    return value.toString()
  }

  return String(value)
}

export function evaluateExpression(expression, { angleMode = 'deg', answer = 0, memory = 0 } = {}) {
  const normalized = normalizeExpression(expression)

  if (!normalized.trim()) {
    throw new Error('Enter an expression first')
  }

  const scope = createScope(angleMode, answer, memory)
  const result = math.evaluate(normalized, scope)

  return {
    value: result,
    display: formatNumber(result),
    tex: math.parse(normalized).toTex({ parenthesis: 'keep' }),
  }
}

export function insertPercent(expression) {
  const match = expression.match(/(.*?)(-?\d*\.?\d+)$/)

  if (!match) {
    return `${expression}(100%)`
  }

  const [, prefix, number] = match
  return `${prefix}(${number}/100)`
}

export function toggleSign(expression) {
  const match = expression.match(/(.*?)(-?\d*\.?\d+)$/)

  if (!match) {
    return expression.startsWith('-') ? expression.slice(1) : `-${expression}`
  }

  const [, prefix, number] = match
  const signless = number.startsWith('-') ? number.slice(1) : `-${number}`
  return `${prefix}${signless}`
}

export function applyScientificToken(token) {
  const tokens = {
    'π': 'pi',
    e: 'e',
    'x²': '^2',
    '^': '^',
    '√': 'sqrt(',
    ln: 'ln(',
    log: 'log10(',
    sin: 'sin(',
    cos: 'cos(',
    tan: 'tan(',
    abs: 'abs(',
    '!': '!',
  }

  return tokens[token] ?? token
}

export function buildGraphPoints(expression, { angleMode = 'deg' } = {}) {
  const normalized = normalizeExpression(expression)
  const scope = createScope(angleMode, 0, 0)
  const points = []

  for (let index = 0; index <= 80; index += 1) {
    const x = -10 + (index * 20) / 80

    try {
      const result = math.evaluate(normalized, { ...scope, x })
      const y = Number(result)

      if (Number.isFinite(y)) {
        points.push({ x, y })
      }
    } catch {
      return []
    }
  }

  return points
}