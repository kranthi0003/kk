import React from 'react'

// Hidden simple good luck page for Chaitra — accessible only at #/atb
export default function AllTheBest({ onBack }) {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        <div className="text-xs font-mono uppercase tracking-[0.3em] text-muted-foreground mb-3">
          for chaitra
        </div>

        <h1 className="font-heading text-4xl sm:text-5xl font-semibold tracking-tight mb-6">
          All the best.
        </h1>

        <div className="space-y-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
          <p>
            You've got the GitHub Admin exam today.
          </p>
          <p>
            You're prepared. You know this stuff. Go through it calmly, read each question twice, and trust your gut.
          </p>
          <p className="text-foreground">
            You'll do great. 🍀
          </p>
        </div>

        <div className="mt-10 text-xs text-muted-foreground/70 font-mono">
          — Kranthi
        </div>

        {onBack && (
          <button
            onClick={onBack}
            className="mt-12 text-xs text-muted-foreground/50 hover:text-foreground font-mono transition-colors"
          >
            ← back
          </button>
        )}
      </div>
    </div>
  )
}
