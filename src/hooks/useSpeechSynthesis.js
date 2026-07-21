import { useCallback, useMemo, useState } from 'react'

export function useSpeechSynthesis() {
  const [speaking, setSpeaking] = useState(false)

  const available = useMemo(() => {
    return typeof window !== 'undefined' && 'speechSynthesis' in window
  }, [])

  const speak = useCallback((text) => {
    if (!available || !text) {
      return
    }

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 1
    utterance.pitch = 1
    utterance.onstart = () => setSpeaking(true)
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)

    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  }, [available])

  const cancel = useCallback(() => {
    if (!available) {
      return
    }

    window.speechSynthesis.cancel()
    setSpeaking(false)
  }, [available])

  return { available, speaking, speak, cancel }
}