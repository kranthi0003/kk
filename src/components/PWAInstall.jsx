import React, { useState, useEffect } from 'react'

export default function PWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [show, setShow] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem('pwa_dismissed')) return

    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setTimeout(() => setShow(true), 5000)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setShow(false)
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShow(false)
    setDismissed(true)
    sessionStorage.setItem('pwa_dismissed', '1')
  }

  if (!show || dismissed) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-fade-in-up max-w-[320px]">
      <div className="rounded-2xl border border-border/30 bg-card shadow-2xl shadow-black/20 p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center text-accent-foreground font-bold text-sm flex-shrink-0">
            KK
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Install App</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Add Kranthi Kiran to your home screen for quick access</p>
          </div>
          <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground p-1 -mt-1 -mr-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex gap-2 mt-3">
          <button onClick={handleDismiss} className="flex-1 py-2 rounded-lg bg-muted/50 border border-border/20 text-xs font-medium text-muted-foreground hover:text-foreground transition-all">
            Not now
          </button>
          <button onClick={handleInstall} className="flex-1 py-2 rounded-lg bg-accent text-accent-foreground text-xs font-medium hover:opacity-90 transition-all shadow-md shadow-accent/20">
            Install
          </button>
        </div>
      </div>
    </div>
  )
}
