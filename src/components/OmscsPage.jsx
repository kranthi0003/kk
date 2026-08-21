import React from 'react'
import WipPage from './WipPage'

// #/omscs — placeholder.
//
// The timeline puts this at 2027, so the page is written honestly as a
// plan rather than as a transcript. The specialisations and the course
// codes below are real and come from the official programme; what isn't
// here is anything pretending to be progress that hasn't happened.

const TINT = '#C9A227' // Georgia Tech gold, dulled to sit with the site

const SPECIALISATIONS = [
  { name: 'Computing Systems', note: 'Operating systems, networks, distributed computing, databases.' },
  { name: 'Machine Learning', note: 'ML, AI, reinforcement learning, big data.' },
  { name: 'Interactive Intelligence', note: 'AI, knowledge-based systems, human–computer interaction.' },
  { name: 'Human–Computer Interaction', note: 'Design, educational technology, video game design.' },
]

// A shortlist, not a plan of record — these are the ones that line up
// with infrastructure work.
const SHORTLIST = [
  ['CS 6200', 'Graduate Introduction to Operating Systems'],
  ['CS 6210', 'Advanced Operating Systems'],
  ['CS 6250', 'Computer Networks'],
  ['CS 6300', 'Software Development Process'],
  ['CS 6400', 'Database System Concepts and Design'],
  ['CS 7641', 'Machine Learning'],
]

export default function OmscsPage({ onBack }) {
  return (
    <WipPage
      onBack={onBack}
      eyebrow="Georgia Tech · OMSCS"
      title="The masters"
      tint={TINT}
      intro="Georgia Tech's Online Master of Science in Computer Science. It's on the timeline for 2027, which means everything here is a plan and none of it is a transcript."
      planned={[
        { title: 'The plan', note: 'Which specialisation, and the order the courses get taken in.' },
        { title: 'Course by course', note: 'What each one actually demanded — hours a week, what was hard, whether it was worth it. Written after, not before.' },
        { title: 'Where it is', note: 'Credits done against credits needed, so the page answers the obvious question without being asked.' },
      ]}
      blocked="It hasn't started. The programme is on the timeline for 2027, so there's no progress to report and nothing here will pretend otherwise. The specialisations and course codes above are public and real; the shortlist is a shortlist, not a decision."
      source="Specialisations and course codes from omscs.gatech.edu."
    >
      <section className="mt-10">
        <h2 className="text-[11px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
          Specialisations
        </h2>
        <div className="mt-4 grid sm:grid-cols-2 gap-3">
          {SPECIALISATIONS.map((s) => (
            <div
              key={s.name}
              className="rounded-xl px-4 py-3.5"
              style={{
                background: 'color-mix(in oklab, var(--color-card) 60%, transparent)',
                boxShadow: 'inset 0 0 0 1px var(--color-border)',
              }}
            >
              <p className="text-[14px] font-medium">{s.name}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{s.note}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-[11px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
          On the shortlist
        </h2>
        <ul className="mt-4 divide-y" style={{ borderColor: 'var(--color-border)' }}>
          {SHORTLIST.map(([code, name]) => (
            <li key={code} className="flex items-baseline gap-3 py-2.5">
              <span className="text-[12px] font-mono tabular-nums shrink-0" style={{ color: TINT }}>{code}</span>
              <span className="text-[13.5px] text-muted-foreground">{name}</span>
            </li>
          ))}
        </ul>
      </section>
    </WipPage>
  )
}
