import React from 'react'
import WipPage from './WipPage'

// #/photos — placeholder. The frames below are the real grid this page
// will use, filled with nothing, so the layout can be judged before the
// pictures exist rather than after.

const TINT = '#8FB8D8'

// Aspect ratios of a normal roll: some wide, some tall, one square.
const FRAMES = [
  [4, 3], [3, 4], [1, 1], [3, 2],
  [2, 3], [4, 3], [3, 4], [16, 9],
  [1, 1], [3, 2], [2, 3], [4, 3],
]

export default function PhotographyPage({ onBack }) {
  return (
    <WipPage
      onBack={onBack}
      eyebrow="Photography"
      title="Pictures"
      tint={TINT}
      intro="Somewhere to put the photographs instead of losing them to a camera roll. Not a portfolio — just the ones worth keeping."
      planned={[
        { title: 'The grid', note: 'Mixed aspect ratios rather than cropped squares, because cropping every photo to a square throws away the reason most of them were taken.' },
        { title: 'A frame view', note: 'Tap through at full size, with the shot settings underneath where the camera recorded them.' },
        { title: 'Places', note: 'Grouped by where they were taken, using the coordinates already in the files.' },
      ]}
      blocked="The photographs. Nothing is in the repo yet, and Instagram blocks automated reading, so this can't fill itself the way the F1 and cricket pages do — the files have to be added directly. Drop them in and this page stops being a placeholder."
      source="Layout is live; the images are not."
    >
      <section className="mt-10">
        <h2 className="text-[11px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
          The grid, empty
        </h2>
        <div className="mt-4 columns-2 sm:columns-3 gap-3 [column-fill:_balance]">
          {FRAMES.map(([w, h], i) => (
            <div
              key={i}
              className="mb-3 break-inside-avoid rounded-lg overflow-hidden"
              style={{
                aspectRatio: `${w} / ${h}`,
                background: 'color-mix(in oklab, var(--color-card) 70%, transparent)',
                boxShadow: 'inset 0 0 0 1px var(--color-border)',
              }}
            >
              <div className="w-full h-full flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" style={{ color: 'var(--color-border)' }}>
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <circle cx="12" cy="12" r="3.2" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      </section>
    </WipPage>
  )
}
