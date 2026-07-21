import nerdamer from 'nerdamer/all.min'
import { evaluateExpression, formatNumber } from './calculator'

function safeTrim(value) {
  return value.trim().replace(/^what is\s+/i, '').replace(/^calculate\s+/i, '')
}

function buildResponse({ title, answer, steps, explanation, confidence, latex }) {
  return {
    title,
    answer,
    steps,
    explanation,
    confidence,
    latex,
  }
}

function solvePercentage(prompt) {
  const match = prompt.match(/(\d*\.?\d+)\s*%\s*of\s*(\d*\.?\d+)/i)

  if (!match) {
    return null
  }

  const percentage = Number(match[1])
  const amount = Number(match[2])
  const result = (percentage / 100) * amount

  return buildResponse({
    title: 'Percentage calculation',
    answer: `${formatNumber(result)}`,
    steps: [`\\frac{${percentage}}{100} \\times ${amount}`, `${formatNumber(result)}`],
    explanation: `${percentage}% of ${amount} means multiplying ${amount} by ${percentage / 100}.`,
    confidence: 0.98,
    latex: `\\frac{${percentage}}{100} \\times ${amount} = ${formatNumber(result)}`,
  })
}

function solveQuadratic(prompt) {
  const expression = prompt.match(/solve\s+(.+)=0/i)?.[1] ?? prompt.match(/solve\s+(.+)/i)?.[1]

  if (!expression || !/x\^2/i.test(expression)) {
    return null
  }

  const cleaned = expression.replaceAll(' ', '')
  const simplified = nerdamer(cleaned)
  const text = simplified.toString()

  try {
    const solutions = nerdamer.solveEquations(`${cleaned}=0`, 'x')
    const solutionText = Array.isArray(solutions) ? solutions.map((solution) => solution.toString()).join(', ') : String(solutions)

    return buildResponse({
      title: 'Equation solved',
      answer: solutionText,
      steps: [`Rearrange: ${text} = 0`, 'Solve for x', `x = ${solutionText}`],
      explanation: 'The quadratic is factored or solved with the quadratic formula.',
      confidence: 0.94,
      latex: `x = ${solutionText}`,
    })
  } catch {
    return null
  }
}

function solveDifferential(prompt) {
  const match = prompt.match(/differentiat(e|ion)\s+(.+)/i)

  if (!match) {
    return null
  }

  const expression = safeTrim(match[2]).replaceAll('^', '**')

  try {
    const derivative = nerdamer(`diff(${expression}, x)`).toString()

    return buildResponse({
      title: 'Derivative',
      answer: derivative,
      steps: [`f(x) = ${expression}`, `f'(x) = ${derivative}`],
      explanation: 'The derivative is computed symbolically with the power rule and chain rule.',
      confidence: 0.96,
      latex: `f'(x) = ${derivative}`,
    })
  } catch {
    return null
  }
}

function solveIntegral(prompt) {
  const match = prompt.match(/integrat(e|ion)\s+(.+)/i)

  if (!match) {
    return null
  }

  const expression = safeTrim(match[2]).replaceAll('^', '**')

  try {
    const integral = nerdamer(`integrate(${expression}, x)`).toString()

    return buildResponse({
      title: 'Integral',
      answer: integral,
      steps: [`\\int ${expression} \\, dx`, `${integral} + C`],
      explanation: 'The antiderivative is computed symbolically and returned with a constant of integration.',
      confidence: 0.93,
      latex: `\\int ${expression} \\, dx = ${integral} + C`,
    })
  } catch {
    return null
  }
}

function simplifyExpression(prompt) {
  const match = prompt.match(/simplif(?:y|y|ication)\s+(.+)/i)

  if (!match) {
    return null
  }

  const expression = match[1].replaceAll('−', '-').replaceAll('×', '*')

  try {
    const simplified = nerdamer(expression).expand().toString()

    return buildResponse({
      title: 'Simplified expression',
      answer: simplified,
      steps: [`Original: ${expression}`, `Expanded: ${simplified}`],
      explanation: 'The expression is algebraically expanded and simplified.',
      confidence: 0.91,
      latex: simplified,
    })
  } catch {
    return null
  }
}

function unitConversion(prompt) {
  const match = prompt.match(/convert\s+(\d*\.?\d+)\s+(miles?|kilometers?|kilometres?|km)\s+to\s+(km|miles?|kilometers?|kilometres?)/i)

  if (!match) {
    return null
  }

  const value = Number(match[1])
  const from = match[2].toLowerCase()
  const to = match[3].toLowerCase()

  const milesToKm = 1.609344
  const kmToMiles = 1 / milesToKm

  let result = null

  if (from.startsWith('mile') && to.startsWith('km')) {
    result = value * milesToKm
  }

  if ((from.startsWith('km') || from.startsWith('kilo')) && to.startsWith('mile')) {
    result = value * kmToMiles
  }

  if (result === null) {
    return null
  }

  return buildResponse({
    title: 'Unit conversion',
    answer: `${formatNumber(result)} ${to.startsWith('mile') ? 'miles' : 'km'}`,
    steps: [`Use the conversion rate between ${from} and ${to}`, `${formatNumber(result)} ${to.startsWith('mile') ? 'miles' : 'km'}`],
    explanation: 'The value is converted using a fixed conversion factor.',
    confidence: 0.97,
    latex: `${formatNumber(result)} \\text{ ${to.startsWith('mile') ? 'miles' : 'km'} }`,
  })
}

function explainArithmetic(prompt) {
  if (!/2\s*\+\s*2\s*=\s*4/.test(prompt)) {
    return null
  }

  return buildResponse({
    title: 'Why 2 + 2 = 4',
    answer: '4',
    steps: ['Start with two objects.', 'Add two more objects.', 'You have four objects in total.'],
    explanation: 'Addition combines quantities. Two plus two counts to four.',
    confidence: 1,
    latex: '2 + 2 = 4',
  })
}

function fallbackExpression(prompt) {
  const expression = prompt
    .replace(/what is/i, '')
    .replace(/calculate/i, '')
    .replaceAll('×', '*')
    .replaceAll('÷', '/')
    .replaceAll('−', '-')

  try {
    const result = evaluateExpression(expression)

    return buildResponse({
      title: 'Calculated result',
      answer: result.display,
      steps: [`Expression: ${expression.trim()}`, `Result: ${result.display}`],
      explanation: 'The expression is evaluated numerically.',
      confidence: 0.9,
      latex: `${result.tex} = ${result.display}`,
    })
  } catch {
    return null
  }
}

export async function generateAiResponse(prompt, settings = {}) {
  const cleanedPrompt = prompt.trim()

  if (!cleanedPrompt) {
    throw new Error('Enter a question or calculation')
  }

  if (settings.aiProvider !== 'local' && settings.apiKey) {
    const response = await fetch(settings.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${settings.apiKey}`,
      },
      body: JSON.stringify({
        model: settings.aiModel,
        messages: [
          {
            role: 'system',
            content: 'You are a precise calculator assistant. Return answer, steps, short explanation, and confidence.',
          },
          { role: 'user', content: cleanedPrompt },
        ],
        temperature: 0.2,
      }),
    })

    if (!response.ok) {
      throw new Error('AI request failed')
    }

    const data = await response.json()
    const message = data.choices?.[0]?.message?.content ?? 'No response returned by the model.'

    return buildResponse({
      title: 'AI response',
      answer: message,
      steps: ['Remote AI provider response received.'],
      explanation: 'The configured API returned a direct response.',
      confidence: 0.88,
      latex: message,
    })
  }

  return solvePercentage(cleanedPrompt)
    || solveQuadratic(cleanedPrompt)
    || solveDifferential(cleanedPrompt)
    || solveIntegral(cleanedPrompt)
    || simplifyExpression(cleanedPrompt)
    || unitConversion(cleanedPrompt)
    || explainArithmetic(cleanedPrompt)
    || fallbackExpression(cleanedPrompt)
    || buildResponse({
      title: 'No direct match',
      answer: 'I could not parse that request locally.',
      steps: ['Try rephrasing the prompt, or configure an AI API key for richer reasoning.'],
      explanation: 'Local mode only supports common calculator and symbolic math requests.',
      confidence: 0.42,
      latex: '\\text{No direct match}',
    })
}