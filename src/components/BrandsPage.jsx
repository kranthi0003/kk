import React from 'react'
import WipPage from './WipPage'

// #/brands — placeholder.
//
// This one is honest about a harder problem than "no data yet": there is
// no free, authoritative source that ranks brands by popularity. Every
// list of that shape is either someone's opinion, a paid dataset, or a
// scrape of a shop that forbids scraping. So the page is scoped to
// something that can actually be true — what's worn and used, and why —
// rather than a leaderboard that would be invented.

const TINT = '#C99BA6'

const SHELVES = [
  { name: 'Fashion', note: 'Everyday wear, and the pieces that turned out to be worth the money.' },
  { name: 'Skin', note: 'What is in the routine, in the order it gets used.' },
  { name: 'Lifestyle', note: 'Bags, watches, desk things, the objects that get picked up daily.' },
]

export default function BrandsPage({ onBack }) {
  return (
    <WipPage
      onBack={onBack}
      eyebrow="Fashion · Skin · Lifestyle"
      title="Brands"
      tint={TINT}
      intro="A shelf of what is actually worn and used, and what turned out to be worth it."
      planned={[
        { title: 'Three shelves', note: 'Fashion, skin, lifestyle — each item with what it is, what it cost, and whether it earned its place.' },
        { title: 'Kept or dropped', note: 'The useful half of any recommendation is what got abandoned, so that gets recorded too.' },
        { title: 'The routine', note: 'For skin especially, order and frequency matter more than the brand names.' },
      ]}
      blocked={
        'The data, and the definition. "Popular brands" has no free authoritative source — every ranking of that shape is either an opinion piece, a paid dataset, or a scrape of a shop whose terms forbid it. Anything generated automatically would be invented, and this site does not do that. So this page will be a hand-kept list of what is genuinely used, which is a claim that can be true.'
      }
      source="No automated source. This one gets written by hand."
    >
      <section className="mt-10">
        <h2 className="text-[11px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
          The shelves
        </h2>
        <div className="mt-4 grid sm:grid-cols-3 gap-3">
          {SHELVES.map((s) => (
            <div
              key={s.name}
              className="rounded-xl px-4 py-4"
              style={{
                background: 'color-mix(in oklab, var(--color-card) 60%, transparent)',
                boxShadow: 'inset 0 0 0 1px var(--color-border)',
              }}
            >
              <p className="text-[14px] font-medium" style={{ color: TINT }}>{s.name}</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{s.note}</p>
              <div className="mt-3.5 space-y-2" aria-hidden="true">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-8 rounded-lg"
                    style={{
                      background: 'color-mix(in oklab, var(--color-muted) 55%, transparent)',
                      opacity: 1 - i * 0.26,
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </WipPage>
  )
}
