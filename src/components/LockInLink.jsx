import React from 'react'

// The navbar's Lock-In button: opens this month's home workout and diet
// plan (#/transformation).
export default function LockInLink() {
  return (
    <button
      type="button"
      onClick={() => { window.location.hash = '#/transformation' }}
      title="Home workout and diet plan"
      aria-label="Lock-In: home workout and diet plan"
      className="group inline-flex items-center gap-1.5 h-8 px-3 rounded-full border border-border/60 bg-card/40 backdrop-blur transition-colors hover:border-accent/40 hover:text-foreground"
    >
      <span className="text-[13px] leading-none" aria-hidden="true">🔒</span>
      <span className="text-[12px] font-medium text-foreground leading-none">Lock-In</span>
    </button>
  )
}
