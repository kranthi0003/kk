import React, { useState, useEffect, useMemo } from 'react'

export default function TypingText({ phrases, typingSpeed = 100, deletingSpeed = 50, pauseDuration = 2000, className = '' }) {
  const [text, setText] = useState('')
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    if (!phrases.length) return

    let timer
    const currentPhrase = phrases[phraseIndex]

    if (isPaused) {
      timer = setTimeout(() => {
        setIsPaused(false)
        setIsDeleting(true)
      }, pauseDuration)
    } else if (isDeleting) {
      if (text.length > 0) {
        timer = setTimeout(() => {
          setText(currentPhrase.substring(0, text.length - 1))
        }, deletingSpeed)
      } else {
        setIsDeleting(false)
        setPhraseIndex((prev) => (prev + 1) % phrases.length)
      }
    } else {
      if (text.length < currentPhrase.length) {
        timer = setTimeout(() => {
          setText(currentPhrase.substring(0, text.length + 1))
        }, typingSpeed)
      } else {
        setIsPaused(true)
      }
    }

    return () => clearTimeout(timer)
  }, [text, phraseIndex, isDeleting, isPaused, phrases, typingSpeed, deletingSpeed, pauseDuration])

  const cursorAnimation = useMemo(() => {
    if (!isDeleting && !isPaused && text.length < (phrases[phraseIndex]?.length || 0)) return 'none'
    return isDeleting ? 'blink 0.5s infinite' : 'blink 1s infinite'
  }, [isDeleting, isPaused, text, phraseIndex, phrases])

  return (
    <span className={className}>
      {text}
      <span
        className="inline-block w-0.5 bg-current ml-1"
        style={{ height: '1em', animation: cursorAnimation }}
      />
      <style>{`@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }`}</style>
    </span>
  )
}
