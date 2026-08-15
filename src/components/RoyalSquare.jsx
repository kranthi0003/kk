import React, { useEffect, useMemo, useState } from 'react'

// The apartment page (#/royalsquare).
// All content comes from public/royalsquare.json so the page can be kept
// current by editing one data file — no code changes needed.

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'notices', label: 'Notices' },
  { id: 'money', label: 'Bills' },
  { id: 'services', label: 'Services' },
  { id: 'events', label: 'Events' },
  { id: 'photos', label: 'Photos' },
]

const INR = new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: 'INR', maximumFractionDigits: 0,
})

function fmtDate(iso) {
  const d = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtDayMonth(iso) {
  const d = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(d.getTime())) return { day: '--', month: '' }
  return {
    day: d.toLocaleDateString('en-IN', { day: '2-digit' }),
    month: d.toLocaleDateString('en-IN', { month: 'short' }).toUpperCase(),
  }
}

// Whole-day difference from today, so "in 3 days" doesn't flip on clock time.
function daysFromToday(iso) {
  const d = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(d.getTime())) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((d - today) / 86400000)
}

function relativeLabel(iso) {
  const n = daysFromToday(iso)
  if (n === null) return ''
  if (n === 0) return 'Today'
  if (n === 1) return 'Tomorrow'
  if (n === -1) return 'Yesterday'
  if (n > 1) return `in ${n} days`
  return `${Math.abs(n)} days ago`
}

function Icon({ d, className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {d}
    </svg>
  )
}

const PinIcon = <><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></>
const CopyIcon = <><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></>
const CheckIcon = <path d="m20 6-11 11-5-5" />
const PhoneIcon = <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" />
const NavIcon = <><polygon points="3 11 22 2 13 21 11 13 3 11" /></>
const StarIcon = <path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2Z" />

function Empty({ children }) {
  return (
    <div className="rounded-xl border border-dashed border-border/70 px-4 py-8 text-center">
      <p className="text-[13px] text-muted-foreground/70">{children}</p>
    </div>
  )
}

function SectionTitle({ children, count }) {
  return (
    <div className="flex items-baseline justify-between mb-3">
      <h2 className="text-[15px] font-semibold tracking-tight">{children}</h2>
      {count !== undefined && (
        <span className="text-[11px] font-mono text-muted-foreground/50 tabular-nums">{count}</span>
      )}
    </div>
  )
}

export default function RoyalSquare({ onBack }) {
  const [data, setData] = useState(undefined) // undefined = loading, null = failed
  const [tab, setTab] = useState('overview')
  const [copied, setCopied] = useState('')
  const [lightbox, setLightbox] = useState(null)

  useEffect(() => {
    let alive = true
    fetch(`${import.meta.env.BASE_URL}royalsquare.json`)
      .then(r => { if (!r.ok) throw new Error('bad response'); return r.json() })
      .then(j => { if (alive) setData(j) })
      .catch(() => { if (alive) setData(null) })
    return () => { alive = false }
  }, [])

  useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(''), 1600)
    return () => clearTimeout(t)
  }, [copied])

  useEffect(() => {
    if (!lightbox) return
    const onKey = (e) => { if (e.key === 'Escape') setLightbox(null) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [lightbox])

  const loc = data?.location
  const fullAddress = useMemo(() => {
    if (!loc) return ''
    return [loc.line1, loc.line2, `${loc.city}, ${loc.state} ${loc.pincode}`]
      .filter(Boolean).join(', ')
  }, [loc])

  const outstanding = useMemo(() => {
    if (!data?.bills) return 0
    return data.bills
      .filter(b => b.status !== 'paid')
      .reduce((sum, b) => sum + (Number(b.amount) || 0), 0)
  }, [data])

  const notices = useMemo(() => {
    if (!data?.notices) return []
    return [...data.notices].sort((a, b) => {
      if (!!b.pinned !== !!a.pinned) return b.pinned ? 1 : -1
      return String(b.date).localeCompare(String(a.date))
    })
  }, [data])

  const { upcoming, past } = useMemo(() => {
    const all = [...(data?.events || [])].sort((a, b) => String(a.date).localeCompare(String(b.date)))
    return {
      upcoming: all.filter(e => (daysFromToday(e.date) ?? 0) >= 0),
      past: all.filter(e => (daysFromToday(e.date) ?? 0) < 0).reverse(),
    }
  }, [data])

  const copy = async (text, key) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
    } catch {
      setCopied('')
    }
  }

  const shell = (inner) => (
    <div className="min-h-screen text-foreground" style={{ background: 'var(--color-background)' }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 pb-24">
        <button onClick={onBack}
          className="inline-flex items-center gap-2 text-[13px] text-muted-foreground hover:text-foreground transition-colors mb-6">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
          Back
        </button>
        {inner}
      </div>
    </div>
  )

  if (data === undefined) {
    return shell(
      <div className="h-40 flex items-center justify-center">
        <span className="text-xs font-mono text-muted-foreground animate-pulse">opening the gate…</span>
      </div>
    )
  }

  if (data === null) {
    return shell(
      <div className="h-40 flex items-center justify-center">
        <span className="text-[13px] text-muted-foreground">Couldn&rsquo;t load the apartment details.</span>
      </div>
    )
  }

  const mapSrc = `https://maps.google.com/maps?q=${loc.lat},${loc.lng}&z=17&output=embed`
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${loc.lat},${loc.lng}`

  return shell(
    <>
      <header className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[11px] font-mono uppercase tracking-[0.18em] text-muted-foreground/60">
            {loc.city}
          </span>
          {loc.rating && (
            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-muted-foreground/60">
              <Icon d={StarIcon} className="w-3 h-3" />
              {loc.rating}
            </span>
          )}
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight leading-tight">{data.name}</h1>
        {data.nameLocal && (
          <p className="text-[14px] text-muted-foreground/70 mt-1">{data.nameLocal}</p>
        )}
        {data.tagline && (
          <p className="text-[14px] text-muted-foreground leading-relaxed mt-3">{data.tagline}</p>
        )}
      </header>

      {data.sampleContent && (
        <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 mb-6">
          <p className="text-[12px] text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground">Sample content.</span>{' '}
            The location below is real. Notices, bills, services and events are placeholders —
            edit <code className="font-mono text-[11px]">public/royalsquare.json</code> and set{' '}
            <code className="font-mono text-[11px]">sampleContent</code> to false.
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-6">
        <a href={directionsUrl} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-foreground text-background px-3.5 py-2 text-[13px] font-medium hover:opacity-90 transition-opacity">
          <Icon d={NavIcon} />
          Directions
        </a>
        <button onClick={() => copy(fullAddress, 'address')}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-3.5 py-2 text-[13px] hover:bg-muted/60 transition-colors">
          <Icon d={copied === 'address' ? CheckIcon : CopyIcon} />
          {copied === 'address' ? 'Copied' : 'Copy address'}
        </button>
        <button onClick={() => copy(loc.plusCode, 'plus')}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-3.5 py-2 text-[13px] hover:bg-muted/60 transition-colors">
          <Icon d={copied === 'plus' ? CheckIcon : CopyIcon} />
          {copied === 'plus' ? 'Copied' : loc.plusCode}
        </button>
      </div>

      <nav className="flex gap-1 overflow-x-auto -mx-1 px-1 mb-6 border-b border-border/70"
        aria-label="Apartment sections">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            aria-current={tab === t.id ? 'page' : undefined}
            className={`shrink-0 px-3 py-2 text-[13px] transition-colors border-b-2 -mb-px ${
              tab === t.id
                ? 'border-foreground text-foreground font-medium'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}>
            {t.label}
          </button>
        ))}
      </nav>

      {tab === 'overview' && (
        <div className="space-y-8">
          <section>
            <div className="rounded-xl overflow-hidden border border-border">
              <iframe
                title={`Map showing ${data.name}`}
                src={mapSrc}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-[260px] sm:h-[320px] block border-0"
              />
            </div>
            <div className="flex items-start gap-2.5 mt-3">
              <span className="text-muted-foreground/60 mt-0.5"><Icon d={PinIcon} /></span>
              <div>
                <p className="text-[13.5px] leading-relaxed">{fullAddress}</p>
                <p className="text-[11px] font-mono text-muted-foreground/50 mt-1 tabular-nums">
                  {loc.lat}, {loc.lng} · {loc.plusCode}
                </p>
              </div>
            </div>
          </section>

          {(data.gettingHere?.length > 0) && (
            <section>
              <SectionTitle>Getting here</SectionTitle>
              <ol className="space-y-2.5">
                {data.gettingHere.map((step, i) => (
                  <li key={i} className="flex gap-3 text-[13.5px] leading-relaxed">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-muted/70 text-[11px] font-mono
                      flex items-center justify-center text-muted-foreground tabular-nums mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-muted-foreground">{step}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {(data.landmarks?.length > 0) && (
            <section>
              <SectionTitle count={data.landmarks.length}>Landmarks nearby</SectionTitle>
              <ul className="space-y-2">
                {data.landmarks.map(l => (
                  <li key={l.name} className="rounded-lg border border-border px-3.5 py-2.5">
                    <p className="text-[13.5px] font-medium">{l.name}</p>
                    {l.hint && <p className="text-[12.5px] text-muted-foreground mt-0.5 leading-relaxed">{l.hint}</p>}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {(data.amenities?.length > 0) && (
            <section>
              <SectionTitle>In the building</SectionTitle>
              <div className="flex flex-wrap gap-2">
                {data.amenities.map(a => (
                  <span key={a} className="rounded-full bg-muted/60 px-3 py-1.5 text-[12.5px] text-muted-foreground">
                    {a}
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {tab === 'notices' && (
        <section>
          <SectionTitle count={notices.length}>Notices</SectionTitle>
          {notices.length === 0 ? (
            <Empty>No notices right now.</Empty>
          ) : (
            <ul className="space-y-3">
              {notices.map((n, i) => (
                <li key={i} className="rounded-xl border border-border px-4 py-3.5">
                  <div className="flex items-center gap-2 mb-1.5">
                    {n.pinned && (
                      <span className="text-[10px] font-mono uppercase tracking-wider rounded px-1.5 py-0.5
                        bg-foreground text-background">Pinned</span>
                    )}
                    <span className="text-[11px] font-mono text-muted-foreground/60 tabular-nums">
                      {fmtDate(n.date)}
                    </span>
                  </div>
                  <p className="text-[14px] font-medium leading-snug">{n.title}</p>
                  {n.body && <p className="text-[13px] text-muted-foreground mt-1.5 leading-relaxed">{n.body}</p>}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {tab === 'money' && (
        <div className="space-y-8">
          <section>
            <SectionTitle>Bills &amp; dues</SectionTitle>
            {(data.bills?.length || 0) === 0 ? (
              <Empty>No bills recorded.</Empty>
            ) : (
              <>
                <div className="rounded-xl border border-border px-4 py-3.5 mb-3">
                  <p className="text-[11px] font-mono uppercase tracking-[0.16em] text-muted-foreground/60">
                    Outstanding
                  </p>
                  <p className="text-2xl font-semibold tabular-nums mt-1">{INR.format(outstanding)}</p>
                </div>
                <ul className="space-y-2">
                  {data.bills.map((b, i) => {
                    const paid = b.status === 'paid'
                    const overdue = !paid && (daysFromToday(b.due) ?? 0) < 0
                    return (
                      <li key={i} className="flex items-center justify-between gap-3 rounded-lg border border-border px-3.5 py-3">
                        <div className="min-w-0">
                          <p className="text-[13.5px] font-medium truncate">{b.label}</p>
                          <p className="text-[11.5px] text-muted-foreground/70 mt-0.5">
                            {b.period}{b.due ? ` · due ${fmtDate(b.due)}` : ''}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[13.5px] font-semibold tabular-nums">{INR.format(b.amount)}</p>
                          <p className={`text-[11px] font-mono uppercase tracking-wider mt-0.5 ${
                            paid ? 'text-muted-foreground/50' : overdue ? 'text-red-500' : 'text-muted-foreground'
                          }`}>
                            {paid ? 'Paid' : overdue ? 'Overdue' : 'Due'}
                          </p>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </>
            )}
          </section>

          <section>
            <SectionTitle count={data.maintenance?.length}>Maintenance</SectionTitle>
            {(data.maintenance?.length || 0) === 0 ? (
              <Empty>Nothing open.</Empty>
            ) : (
              <ul className="space-y-2">
                {data.maintenance.map((m, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 rounded-lg border border-border px-3.5 py-3">
                    <div className="min-w-0">
                      <p className="text-[13.5px] leading-snug">{m.title}</p>
                      {m.raised && (
                        <p className="text-[11.5px] text-muted-foreground/70 mt-0.5">Raised {fmtDate(m.raised)}</p>
                      )}
                    </div>
                    <span className={`shrink-0 text-[10.5px] font-mono uppercase tracking-wider rounded-full px-2.5 py-1 ${
                      m.status === 'done'
                        ? 'bg-muted/60 text-muted-foreground/60'
                        : m.status === 'in-progress'
                          ? 'bg-muted text-foreground'
                          : 'bg-foreground text-background'
                    }`}>
                      {m.status === 'in-progress' ? 'In progress' : m.status === 'done' ? 'Done' : 'Open'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      {tab === 'services' && (
        <section>
          <SectionTitle count={data.services?.length}>Who to call</SectionTitle>
          {(data.services?.length || 0) === 0 ? (
            <Empty>No contacts saved yet.</Empty>
          ) : (
            <ul className="space-y-2">
              {data.services.map((s, i) => (
                <li key={i} className="flex items-center justify-between gap-3 rounded-lg border border-border px-3.5 py-3">
                  <div className="min-w-0">
                    <p className="text-[13.5px] font-medium truncate">{s.name}</p>
                    {s.role && <p className="text-[11.5px] text-muted-foreground/70 mt-0.5">{s.role}</p>}
                  </div>
                  {s.phone ? (
                    <a href={`tel:${s.phone.replace(/\s+/g, '')}`}
                      className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5
                        text-[12.5px] hover:bg-muted/60 transition-colors">
                      <Icon d={PhoneIcon} className="w-3.5 h-3.5" />
                      Call
                    </a>
                  ) : (
                    <span className="shrink-0 text-[11px] font-mono text-muted-foreground/40">no number</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {tab === 'events' && (
        <div className="space-y-8">
          <section>
            <SectionTitle count={upcoming.length}>Coming up</SectionTitle>
            {upcoming.length === 0 ? (
              <Empty>Nothing scheduled.</Empty>
            ) : (
              <ul className="space-y-2">
                {upcoming.map((e, i) => {
                  const { day, month } = fmtDayMonth(e.date)
                  return (
                    <li key={i} className="flex gap-3.5 rounded-xl border border-border px-4 py-3.5">
                      <div className="shrink-0 text-center w-11">
                        <p className="text-[17px] font-semibold tabular-nums leading-none">{day}</p>
                        <p className="text-[10px] font-mono text-muted-foreground/60 mt-1">{month}</p>
                      </div>
                      <div className="min-w-0 border-l border-border/70 pl-3.5">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <p className="text-[14px] font-medium leading-snug">{e.title}</p>
                          <span className="text-[10.5px] font-mono text-muted-foreground/50">{relativeLabel(e.date)}</span>
                        </div>
                        {e.body && <p className="text-[13px] text-muted-foreground mt-1 leading-relaxed">{e.body}</p>}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          {past.length > 0 && (
            <section>
              <SectionTitle count={past.length}>Already happened</SectionTitle>
              <ul className="space-y-1.5">
                {past.map((e, i) => (
                  <li key={i} className="flex items-baseline justify-between gap-3 px-1 py-1.5">
                    <span className="text-[13px] text-muted-foreground/70 truncate">{e.title}</span>
                    <span className="text-[11px] font-mono text-muted-foreground/40 shrink-0 tabular-nums">
                      {fmtDate(e.date)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      {tab === 'photos' && (
        <section>
          <SectionTitle count={data.photos?.length}>Photos</SectionTitle>
          {(data.photos?.length || 0) === 0 ? (
            <Empty>
              No photos yet. Drop images into <code className="font-mono text-[12px]">public/royalsquare/</code>{' '}
              and list them under <code className="font-mono text-[12px]">photos</code> in the data file.
            </Empty>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {data.photos.map((p, i) => {
                const src = typeof p === 'string' ? p : p.src
                const caption = typeof p === 'string' ? '' : (p.caption || '')
                return (
                  <button key={i} onClick={() => setLightbox({ src, caption })}
                    className="group relative aspect-[4/3] rounded-lg overflow-hidden border border-border
                      focus:outline-none focus:ring-2 focus:ring-foreground/40">
                    <img src={src} alt={caption || `Photo ${i + 1}`} loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.04]" />
                  </button>
                )
              })}
            </div>
          )}
        </section>
      )}

      {lightbox && (
        <div role="dialog" aria-modal="true" aria-label={lightbox.caption || 'Photo'}
          onClick={() => setLightbox(null)}
          className="fixed inset-0 z-[400] bg-black/85 flex items-center justify-center p-4 cursor-zoom-out">
          <figure className="max-w-4xl w-full" onClick={e => e.stopPropagation()}>
            <img src={lightbox.src} alt={lightbox.caption || 'Photo'}
              className="w-full max-h-[80vh] object-contain rounded-lg" />
            {lightbox.caption && (
              <figcaption className="text-[12.5px] text-white/70 text-center mt-3">{lightbox.caption}</figcaption>
            )}
          </figure>
          <button onClick={() => setLightbox(null)} aria-label="Close photo"
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>
      )}
    </>
  )
}
