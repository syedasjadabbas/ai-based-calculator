import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export function useSpeechRecognition() {
  const recognitionRef = useRef(null)
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState('')

  const available = useMemo(() => {
    return typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
  }, [])

  useEffect(() => {
    if (!available || recognitionRef.current) {
      return
    }

    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new Recognition()

    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'

    recognition.onstart = () => {
      setListening(true)
      setError('')
    }

    recognition.onend = () => {
      setListening(false)
    }

    recognition.onerror = (event) => {
      setError(event.error || 'Speech recognition failed')
      setListening(false)
    }

    recognition.onresult = (event) => {
      const result = event.results?.[0]?.[0]?.transcript ?? ''
      setTranscript(result)
    }

    recognitionRef.current = recognition
  }, [available])

  const start = useCallback(() => {
    if (!recognitionRef.current || listening) {
      return
    }

    setTranscript('')
    setError('')

    try {
      recognitionRef.current.start()
    } catch {
      setError('Speech input is not available right now')
    }
  }, [listening])

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
  }, [])

  return { available, listening, transcript, error, start, stop, setTranscript }
}