import { useEffect, useMemo, useState } from 'react'
import { AppProvider, useAppContext } from './context/AppContext'
import { MathBlock } from './components/MathBlock'
import { Panel } from './components/Panel'
import { useDebouncedValue } from './hooks/useDebouncedValue'
import { useOnlineStatus } from './hooks/useOnlineStatus'
import { useSpeechRecognition } from './hooks/useSpeechRecognition'
import { useSpeechSynthesis } from './hooks/useSpeechSynthesis'
import {
  applyScientificToken,
  buildGraphPoints,
  evaluateExpression,
  formatNumber,
  insertPercent,
  toggleSign,
} from './utils/calculator'
import { exportHistoryCsv, exportHistoryPdf } from './utils/export'

const calculatorButtons = ['C', '⌫', '(', ')', '7', '8', '9', '÷', '4', '5', '6', '×', '1', '2', '3', '−', '0', '.', '%', '+']

const scientificButtons = ['sin', 'cos', 'tan', 'log', 'ln', 'sqrt', 'abs', 'π', 'e', '^', '!', 'x²']

const unitOptions = [
  { label: 'Meters', value: 'm' },
  { label: 'Kilometers', value: 'km' },
  { label: 'Miles', value: 'mile' },
]

function ThemeButton({ value, current, onChange, children }) {
  return (
    <button
      type="button"
      onClick={() => onChange(value)}
      className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${current === value ? 'bg-white text-slate-950' : 'bg-white/10 text-slate-200 hover:bg-white/15'}`}
    >
      {children}
    </button>
  )
}

function Dashboard() {
  const {
    settings,
    setSettings,
    history,
    addHistory,
    pinHistory,
    deleteHistory,
    clearHistory,
    memory,
    setMemory,
    resolvedTheme,
  } = useAppContext()

  const online = useOnlineStatus()
  const [expression, setExpression] = useState('')
  const [result, setResult] = useState('0')
  const [answerValue, setAnswerValue] = useState(0)
  const [angleMode, setAngleMode] = useState('deg')
  const [historyQuery, setHistoryQuery] = useState('')
  const [aiPrompt, setAiPrompt] = useState('What is 25% of 480?')
  const [aiResult, setAiResult] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const [copyState, setCopyState] = useState('')
  const [voiceTarget, setVoiceTarget] = useState('ai')
  const [graphExpression, setGraphExpression] = useState('sin(x)')
  const [toolState, setToolState] = useState({
    fromUnit: 'mile',
    toUnit: 'km',
    unitValue: '25',
    bmiWeight: '72',
    bmiHeight: '1.75',
    loanAmount: '25000',
    loanRate: '6.5',
    loanYears: '4',
    tipBill: '84',
    tipPercent: '18',
    randomMin: '1',
    randomMax: '100',
    statsValue: '3,5,8,11,12,15',
  })

  const debouncedPrompt = useDebouncedValue(aiPrompt, 700)
  const recognition = useSpeechRecognition()
  const speech = useSpeechSynthesis()

  const filteredHistory = useMemo(() => {
    const query = historyQuery.trim().toLowerCase()

    return [...history]
      .sort((left, right) => Number(right.pinned) - Number(left.pinned) || new Date(right.createdAt) - new Date(left.createdAt))
      .filter((entry) => {
        if (!query) {
          return true
        }

        return [entry.expression, entry.result, entry.prompt, entry.answer, entry.kind].filter(Boolean).some((value) => String(value).toLowerCase().includes(query))
      })
  }, [history, historyQuery])

  const graphPoints = useMemo(() => buildGraphPoints(graphExpression, { angleMode }), [angleMode, graphExpression])

  useEffect(() => {
    if (!settings.autoRunAi || !debouncedPrompt.trim()) {
      return
    }

    void runAi(debouncedPrompt)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedPrompt])

  useEffect(() => {
    if (!recognition.transcript) {
      return
    }

    if (voiceTarget === 'calculator') {
      setExpression((current) => `${current}${recognition.transcript}`)
    } else {
      setAiPrompt((current) => `${current} ${recognition.transcript}`.trim())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recognition.transcript])

  useEffect(() => {
    if (aiResult?.answer && settings.speakAnswers && !aiLoading) {
      speech.speak(`${aiResult.title}. ${aiResult.answer}. ${aiResult.explanation}`)
    }
  }, [aiLoading, aiResult, settings.speakAnswers, speech])

  async function runAi(prompt) {
    if (!prompt.trim()) {
      setAiError('Enter a natural language question first.')
      return
    }

    try {
      setAiLoading(true)
      setAiError('')

      const { generateAiResponse } = await import('./utils/ai')
      const response = await generateAiResponse(prompt, settings)
      setAiResult(response)
      addHistory({
        kind: 'ai',
        prompt,
        answer: response.answer,
        result: response.answer,
      })
    } catch (error) {
      setAiError(error.message || 'The AI request failed.')
    } finally {
      setAiLoading(false)
    }
  }

  function commitCalculation(nextExpression = expression) {
    try {
      const evaluation = evaluateExpression(nextExpression, { angleMode, answer: answerValue, memory })
      setResult(evaluation.display)
      setAnswerValue(Number(evaluation.value))
      addHistory({ kind: 'calculation', expression: nextExpression, result: evaluation.display })
      return evaluation.display
    } catch (error) {
      setResult(error.message || 'Invalid expression')
      return null
    }
  }

  function handleKeyPress(value) {
    if (value === 'C') {
      setExpression('')
      setResult('0')
      return
    }

    if (value === '⌫') {
      setExpression((current) => current.slice(0, -1))
      return
    }

    if (value === '=') {
      commitCalculation(expression)
      return
    }

    if (value === '%') {
      setExpression((current) => insertPercent(current))
      return
    }

    if (value === '±') {
      setExpression((current) => toggleSign(current))
      return
    }

    if (value === 'x²') {
      setExpression((current) => `${current}^2`)
      return
    }

    if (['sin', 'cos', 'tan', 'log', 'ln', 'sqrt', 'abs', 'π', 'e', '^', '!'].includes(value)) {
      setExpression((current) => `${current}${applyScientificToken(value)}`)
      return
    }

    setExpression((current) => `${current}${value}`)
  }

  function handleMemory(action) {
    const numericValue = Number(result)

    if (Number.isNaN(numericValue)) {
      return
    }

    if (action === 'MC') {
      setMemory(0)
    }

    if (action === 'MR') {
      setExpression((current) => `${current}${String(memory)}`)
    }

    if (action === 'MS') {
      setMemory(numericValue)
    }

    if (action === 'M+') {
      setMemory((current) => Number(current) + numericValue)
    }

    if (action === 'M-') {
      setMemory((current) => Number(current) - numericValue)
    }
  }

  function handleKeyboard(event) {
    const { key } = event

    if (/^[0-9]$/.test(key)) {
      handleKeyPress(key)
      return
    }

    if (['+', '-', '*', '/', '.', '(', ')'].includes(key)) {
      handleKeyPress(key === '*' ? '×' : key === '/' ? '÷' : key)
      return
    }

    if (key === 'Enter') {
      event.preventDefault()
      commitCalculation(expression)
      return
    }

    if (key === 'Backspace') {
      handleKeyPress('⌫')
      return
    }

    if (key === 'Escape') {
      handleKeyPress('C')
    }
  }

  useEffect(() => {
    window.addEventListener('keydown', handleKeyboard)
    return () => window.removeEventListener('keydown', handleKeyboard)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expression, angleMode, answerValue, memory])

  async function copyCurrentAnswer(text) {
    try {
      await navigator.clipboard.writeText(text)
      setCopyState('Copied')
      window.setTimeout(() => setCopyState(''), 1200)
    } catch {
      setCopyState('Copy failed')
    }
  }

  async function shareCurrent(text) {
    if (!navigator.share) {
      await copyCurrentAnswer(text)
      return
    }

    await navigator.share({ title: 'Calculator result', text })
  }

  function computeUnitConversion() {
    const value = Number(toolState.unitValue)
    const milesToKm = 1.609344
    const kmToMiles = 1 / milesToKm

    if (Number.isNaN(value)) {
      return 'Invalid'
    }

    if (toolState.fromUnit === 'mile' && toolState.toUnit === 'km') {
      return `${formatNumber(value * milesToKm)} km`
    }

    if (toolState.fromUnit === 'km' && toolState.toUnit === 'mile') {
      return `${formatNumber(value * kmToMiles)} miles`
    }

    return `${formatNumber(value)} ${toolState.toUnit}`
  }

  function computeBmi() {
    const weight = Number(toolState.bmiWeight)
    const height = Number(toolState.bmiHeight)

    if (!weight || !height) {
      return 'Invalid'
    }

    return formatNumber(weight / (height * height))
  }

  function computeEmi() {
    const principal = Number(toolState.loanAmount)
    const annualRate = Number(toolState.loanRate) / 100 / 12
    const months = Number(toolState.loanYears) * 12

    if (!principal || !annualRate || !months) {
      return 'Invalid'
    }

    const emi = principal * annualRate * ((1 + annualRate) ** months) / (((1 + annualRate) ** months) - 1)
    return `${formatNumber(emi)}/month`
  }

  function computeTip() {
    const bill = Number(toolState.tipBill)
    const percent = Number(toolState.tipPercent) / 100
    return `${formatNumber(bill * percent)} tip, total ${formatNumber(bill + bill * percent)}`
  }

  function computeRandom() {
    const min = Number(toolState.randomMin)
    const max = Number(toolState.randomMax)
    return String(Math.floor(Math.random() * (max - min + 1)) + min)
  }

  function computeStats() {
    const values = toolState.statsValue
      .split(',')
      .map((value) => Number(value.trim()))
      .filter((value) => Number.isFinite(value))

    if (!values.length) {
      return 'Invalid'
    }

    const sum = values.reduce((total, value) => total + value, 0)
    const mean = sum / values.length
    const sorted = [...values].sort((left, right) => left - right)
    const median = sorted.length % 2 === 0 ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2 : sorted[(sorted.length - 1) / 2]

    return `Mean ${formatNumber(mean)}, Median ${formatNumber(median)}, Min ${sorted[0]}, Max ${sorted[sorted.length - 1]}`
  }

  const currentGraph = useMemo(() => {
    if (!graphPoints.length) {
      return '0 0, 100 100'
    }

    const ys = graphPoints.map((point) => point.y)
    const minY = Math.min(...ys)
    const maxY = Math.max(...ys)
    const spread = maxY - minY || 1

    return graphPoints
      .map((point, index) => {
        const x = (index / (graphPoints.length - 1)) * 100
        const y = 100 - ((point.y - minY) / spread) * 100
        return `${x},${y}`
      })
      .join(' ')
  }, [graphPoints])

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(94,234,212,0.2),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(56,189,248,0.2),_transparent_30%),linear-gradient(135deg,_rgba(15,23,42,0.8),_rgba(2,6,23,0.98))]" />
      <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:64px_64px]" />

      <main className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <header className="glass-card flex flex-col gap-5 rounded-[2rem] p-5 shadow-2xl shadow-cyan-950/20 backdrop-blur-2xl sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.35em] text-cyan-200/80">
              <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1">Axiom Calc</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">{online ? 'Online' : 'Offline'}</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">{resolvedTheme} theme</span>
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Modern calculator, AI assistant, and math toolkit.</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300 sm:text-base">
              Standard math, scientific functions, symbolic AI fallback, history, export tools, voice input, and a premium glass interface built for mobile and desktop.
            </p>
          </div>

          <div className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-slate-950/40 p-4 sm:min-w-[320px]">
            <div className="flex flex-wrap gap-2">
              <ThemeButton value="light" current={settings.theme} onChange={(value) => setSettings((current) => ({ ...current, theme: value }))}>Light</ThemeButton>
              <ThemeButton value="dark" current={settings.theme} onChange={(value) => setSettings((current) => ({ ...current, theme: value }))}>Dark</ThemeButton>
              <ThemeButton value="system" current={settings.theme} onChange={(value) => setSettings((current) => ({ ...current, theme: value }))}>System</ThemeButton>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
              <button type="button" className="rounded-full bg-emerald-400/15 px-3 py-1.5 text-emerald-200" onClick={() => setSettings((current) => ({ ...current, autoRunAi: !current.autoRunAi }))}>
                Auto AI: {settings.autoRunAi ? 'On' : 'Off'}
              </button>
              <button type="button" className="rounded-full bg-fuchsia-400/15 px-3 py-1.5 text-fuchsia-200" onClick={() => setSettings((current) => ({ ...current, speakAnswers: !current.speakAnswers }))}>
                Voice answer: {settings.speakAnswers ? 'On' : 'Off'}
              </button>
            </div>
          </div>
        </header>

        <div className="grid flex-1 gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="flex flex-col gap-6">
            <Panel
              title="Calculator"
              subtitle="Standard and scientific functions with keyboard shortcuts, memory controls, and graph preview."
              actions={<div className="flex items-center gap-2 text-xs text-slate-300"><button type="button" className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5" onClick={() => setAngleMode((current) => (current === 'deg' ? 'rad' : 'deg'))}>{angleMode.toUpperCase()}</button><button type="button" className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5" onClick={() => handleMemory('MR')}>MR</button><button type="button" className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5" onClick={() => handleMemory('MC')}>MC</button></div>}
            >
              <div className="grid gap-5 xl:grid-cols-[1fr_280px]">
                <div className="space-y-4">
                  <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/55 p-4 shadow-inner shadow-black/20">
                    <div className="flex items-center justify-between gap-4 text-xs uppercase tracking-[0.3em] text-slate-400">
                      <span>Expression</span>
                      <span className="text-cyan-200">Memory {formatNumber(memory)}</span>
                    </div>
                    <textarea value={expression} onChange={(event) => setExpression(event.target.value)} rows={3} className="mt-3 w-full resize-none border-0 bg-transparent text-2xl font-semibold tracking-tight text-white outline-none placeholder:text-slate-600" placeholder="Type a formula or use buttons" />
                    <div className="mt-2 flex items-center gap-2 text-sm text-slate-300"><span className="rounded-full bg-white/5 px-3 py-1">Result</span><span className="font-mono text-cyan-200">{result}</span></div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button type="button" className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300" onClick={() => { const value = commitCalculation(expression); if (value !== null) { setExpression(value) } }}>=</button>
                      <button type="button" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm transition hover:bg-white/10" onClick={() => handleKeyPress('C')}>Clear</button>
                      <button type="button" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm transition hover:bg-white/10" onClick={() => handleKeyPress('±')}>±</button>
                      <button type="button" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm transition hover:bg-white/10" onClick={() => copyCurrentAnswer(result)}>Copy answer</button>
                      <button type="button" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm transition hover:bg-white/10" onClick={() => shareCurrent(`Expression: ${expression}\nResult: ${result}`)}>Share</button>
                      {copyState ? <span className="px-2 py-2 text-xs text-cyan-200">{copyState}</span> : null}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {calculatorButtons.map((button) => (
                      <button key={button} type="button" onClick={() => handleKeyPress(button)} className={`rounded-2xl border px-4 py-4 text-lg font-medium transition active:scale-[0.98] ${['+', '−', '×', '÷', '='].includes(button) ? 'border-cyan-400/20 bg-cyan-400/15 text-cyan-100 hover:bg-cyan-400/20' : 'border-white/10 bg-white/5 text-white hover:bg-white/10'}`}>{button}</button>
                    ))}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {scientificButtons.map((button) => (
                      <button key={button} type="button" onClick={() => handleKeyPress(button)} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium uppercase tracking-[0.2em] text-slate-200 transition hover:bg-white/10">{button}</button>
                    ))}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {['MC', 'MR', 'MS', 'M+', 'M-'].map((action) => (
                      <button key={action} type="button" onClick={() => handleMemory(action)} className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-slate-800/80">{action}</button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/55 p-4">
                    <div className="flex items-center justify-between text-sm text-slate-300"><span>Graph preview</span><span className="rounded-full bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.3em]">f(x)</span></div>
                    <input value={graphExpression} onChange={(event) => setGraphExpression(event.target.value)} className="mt-3 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500" placeholder="Enter function of x" />
                    <div className="mt-4 rounded-2xl border border-white/10 bg-slate-900/70 p-3">
                      <svg viewBox="0 0 100 100" className="h-44 w-full">
                        <defs><linearGradient id="graphLine" x1="0" x2="1"><stop offset="0%" stopColor="#22d3ee" /><stop offset="100%" stopColor="#34d399" /></linearGradient></defs>
                        <rect width="100" height="100" rx="12" fill="rgba(15,23,42,0.85)" />
                        <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(148,163,184,0.28)" />
                        <line x1="50" y1="0" x2="50" y2="100" stroke="rgba(148,163,184,0.28)" />
                        {graphPoints.length > 1 ? <polyline fill="none" stroke="url(#graphLine)" strokeWidth="2.5" points={currentGraph} /> : null}
                      </svg>
                    </div>
                  </div>

                  <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/55 p-4">
                    <div className="flex items-center justify-between text-sm text-slate-300"><span>Symbolic note</span><span className="rounded-full bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.3em]">KaTeX</span></div>
                    <MathBlock expression={graphExpression ? `f(x) = ${graphExpression}` : 'f(x) = x'} className="mt-4 overflow-x-auto text-cyan-200" />
                  </div>
                </div>
              </div>
            </Panel>

            <Panel title="Bonus tools" subtitle="Quick utilities for common calculations and conversions.">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <h3 className="text-sm font-semibold text-white">Base converter</h3>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <input className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 outline-none" value="255" readOnly />
                    <div className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-slate-200">Hex: FF</div>
                    <div className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-slate-200">Binary: 11111111</div>
                    <div className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-slate-200">Octal: 377</div>
                  </div>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <h3 className="text-sm font-semibold text-white">Unit converter</h3>
                  <div className="mt-3 grid gap-2 text-sm">
                    <input value={toolState.unitValue} onChange={(event) => setToolState((current) => ({ ...current, unitValue: event.target.value }))} className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 outline-none" />
                    <div className="grid grid-cols-2 gap-2">
                      <select value={toolState.fromUnit} onChange={(event) => setToolState((current) => ({ ...current, fromUnit: event.target.value }))} className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 outline-none text-white">
                        {unitOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select>
                      <select value={toolState.toUnit} onChange={(event) => setToolState((current) => ({ ...current, toUnit: event.target.value }))} className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 outline-none text-white">
                        {unitOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-cyan-200">{computeUnitConversion()}</div>
                  </div>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4"><h3 className="text-sm font-semibold text-white">BMI calculator</h3><p className="mt-3 text-lg text-cyan-200">{computeBmi()}</p></div>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4"><h3 className="text-sm font-semibold text-white">Loan / EMI</h3><p className="mt-3 text-lg text-cyan-200">{computeEmi()}</p></div>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4"><h3 className="text-sm font-semibold text-white">Tip calculator</h3><p className="mt-3 text-lg text-cyan-200">{computeTip()}</p></div>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4"><h3 className="text-sm font-semibold text-white">Random number</h3><p className="mt-3 text-lg text-cyan-200">{computeRandom()}</p></div>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4"><h3 className="text-sm font-semibold text-white">Statistics</h3><p className="mt-3 text-sm leading-6 text-cyan-200">{computeStats()}</p></div>
              </div>
            </Panel>
          </div>

          <div className="flex flex-col gap-6">
            <Panel title="AI calculator" subtitle="Natural language inputs, symbolic fallback, and OpenAI-compatible configuration." actions={<div className="flex items-center gap-2"><button type="button" className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs" onClick={() => setVoiceTarget('ai')}>Mic to AI</button><button type="button" className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs" onClick={() => setVoiceTarget('calculator')}>Mic to calc</button></div>}>
              <div className="space-y-4">
                <textarea value={aiPrompt} onChange={(event) => setAiPrompt(event.target.value)} rows={4} className="w-full rounded-[1.75rem] border border-white/10 bg-slate-950/55 p-4 text-sm text-white outline-none placeholder:text-slate-500" placeholder="Ask a natural language question" />
                <div className="flex flex-wrap gap-2">
                  <button type="button" className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300" onClick={() => runAi(aiPrompt)}>{aiLoading ? 'Thinking...' : 'Ask AI'}</button>
                  <button type="button" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm transition hover:bg-white/10" onClick={() => recognition.start()} disabled={!recognition.available}>{recognition.listening ? 'Listening...' : 'Voice input'}</button>
                  <button type="button" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm transition hover:bg-white/10" onClick={() => recognition.stop()}>Stop listening</button>
                  <button type="button" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm transition hover:bg-white/10" onClick={() => speech.cancel()}>{speech.speaking ? 'Stop voice answer' : 'Voice idle'}</button>
                </div>
                {recognition.error ? <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-3 text-sm text-amber-100">{recognition.error}</div> : null}
                {!online ? <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-3 text-sm text-amber-100">You are offline. Local math parsing still works, but remote AI calls may fail.</div> : null}
                {aiError ? <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-100">{aiError}</div> : null}
                {aiLoading ? <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">AI is thinking...<div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full w-1/2 animate-pulse rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400" /></div></div> : null}
                {aiResult ? (
                  <div className="space-y-4 rounded-[1.75rem] border border-white/10 bg-slate-950/55 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div><p className="text-xs uppercase tracking-[0.3em] text-slate-400">Result</p><h3 className="mt-1 text-xl font-semibold text-white">{aiResult.title}</h3></div>
                      <div className="rounded-full bg-cyan-400/15 px-3 py-1 text-sm text-cyan-200">{Math.round(aiResult.confidence * 100)}%</div>
                    </div>
                    <MathBlock expression={aiResult.latex || aiResult.answer} className="overflow-x-auto text-cyan-200" />
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-slate-200"><p className="font-medium text-white">Answer</p><p className="mt-1 break-words">{aiResult.answer}</p></div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-slate-200"><p className="font-medium text-white">Explanation</p><p className="mt-1 leading-6">{aiResult.explanation}</p></div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-slate-200"><p className="font-medium text-white">Steps</p><ol className="mt-2 space-y-2">{aiResult.steps.map((step) => <li key={step} className="rounded-xl bg-slate-950/50 px-3 py-2">{step}</li>)}</ol></div>
                  </div>
                ) : null}
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <label className="space-y-2 text-sm text-slate-300"><span>Provider</span><select value={settings.aiProvider} onChange={(event) => setSettings((current) => ({ ...current, aiProvider: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3 text-white outline-none"><option value="local">Local fallback</option><option value="openai">OpenAI compatible</option></select></label>
                <label className="space-y-2 text-sm text-slate-300"><span>Model</span><input value={settings.aiModel} onChange={(event) => setSettings((current) => ({ ...current, aiModel: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3 text-white outline-none" /></label>
                <label className="space-y-2 text-sm text-slate-300 sm:col-span-2"><span>API endpoint</span><input value={settings.apiEndpoint} onChange={(event) => setSettings((current) => ({ ...current, apiEndpoint: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3 text-white outline-none" /></label>
                <label className="space-y-2 text-sm text-slate-300 sm:col-span-2"><span>API key</span><input type="password" value={settings.apiKey} onChange={(event) => setSettings((current) => ({ ...current, apiKey: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3 text-white outline-none" placeholder="Optional for remote AI" /></label>
              </div>
            </Panel>

            <Panel title="History" subtitle="Persisted locally with search, pinning, delete, and export to CSV or PDF." actions={<div className="flex flex-wrap gap-2"><button type="button" className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs" onClick={() => exportHistoryCsv(history)}>CSV</button><button type="button" className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs" onClick={() => exportHistoryPdf(history)}>PDF</button><button type="button" className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs" onClick={clearHistory}>Clear</button></div>}>
              <div className="space-y-4">
                <input value={historyQuery} onChange={(event) => setHistoryQuery(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500" placeholder="Search history" />
                <div className="max-h-[520px] space-y-3 overflow-y-auto pr-1">
                  {filteredHistory.length ? filteredHistory.map((entry) => (
                    <div key={entry.id} className={`rounded-3xl border p-4 ${entry.pinned ? 'border-cyan-400/30 bg-cyan-400/10' : 'border-white/10 bg-white/5'}`}>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div><p className="text-xs uppercase tracking-[0.3em] text-slate-400">{entry.kind}</p><p className="mt-1 text-sm text-white">{entry.expression || entry.prompt}</p><p className="mt-2 break-words text-lg font-semibold text-cyan-200">{entry.result || entry.answer}</p></div>
                        <div className="flex gap-2 text-xs"><button type="button" className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5" onClick={() => pinHistory(entry.id)}>{entry.pinned ? 'Unpin' : 'Pin'}</button><button type="button" className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5" onClick={() => deleteHistory(entry.id)}>Delete</button></div>
                      </div>
                      <p className="mt-3 text-xs text-slate-400">{new Date(entry.createdAt).toLocaleString()}</p>
                    </div>
                  )) : <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-6 text-center text-sm text-slate-400">No history entries yet.</div>}
                </div>
              </div>
            </Panel>

            <Panel title="Settings" subtitle="Toggles for sound, theme, AI behavior, and quick status.">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">AI provider: {settings.aiProvider}</div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">Theme: {settings.theme}</div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">Mic target: {voiceTarget}</div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">Speech available: {recognition.available ? 'Yes' : 'No'}</div>
              </div>
            </Panel>
          </div>
        </div>
      </main>
    </div>
  )
}

function App() {
  return (
    <AppProvider>
      <Dashboard />
    </AppProvider>
  )
}

export default App
