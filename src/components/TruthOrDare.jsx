import React, { useState, useEffect, useCallback, useMemo } from 'react'

// ─── Prompt pool: 3 levels × truth/dare ──────────────────────
// Mild = safe-for-work coworker, get-to-know
// Medium = flirty/sillier, opens up
// Spicy = personal/bold/playful — still tasteful, never gross
const PROMPTS = {
  mild: {
    truth: [
      "Which Bollywood actor would you 100% fall for if they DM'd you tomorrow?",
      "What's the most embarrassing nickname your family calls you?",
      "What's a 2000s Hindi song you secretly play when no one's around?",
      "Which IPL player would you say yes to a coffee date with?",
      "What's the cringiest Orkut/Facebook bio you ever had?",
      "Who's the last person whose Instagram profile you opened — and why?",
      "What's a Maggi-at-2-AM confession nobody knows?",
      "Which Hindi serial actress/actor had your secret crush growing up?",
      "What's the dumbest thing you bought just to impress someone?",
      "Which Shahrukh / Salman / Ranveer movie scene do you watch when you're sad?",
      "What's your most-used Hinglish phrase that gives away your mood?",
      "What's the silliest reason you've ever almost slid into someone's DMs?",
      "What's the most over-the-top thing your mom said when she found out you had a 'friend'?",
      "Which song instantly makes you think of one specific person?",
      "What's a school crush story you've never told anyone?",
    ],
    dare: [
      "Sing one line of 'Tum Hi Ho' looking directly at the other player. Full emotion.",
      "Do a 5-second SRK arms-spread pose with the other player.",
      "Show your last 3 Zomato/Swiggy orders — including the suspicious late-night ones.",
      "Read the last flirty (or wanna-be flirty) text you sent — out loud.",
      "Show the wallpaper on both your phone AND your laptop.",
      "Recreate any one Hrithik Roshan dance step with full conviction.",
      "Show the last meme/reel you sent to a crush or close friend.",
      "Speak in your most exaggerated South Indian or Punjabi accent for the next prompt.",
      "Open your Notes app — read out the most embarrassing note.",
      "Show your YouTube history's top 3 videos from this week.",
      "Send a 'good morning 🌹' WhatsApp to a random non-family contact — no explanation.",
      "Show your Instagram saved folder — open the FIRST collection without filtering.",
    ],
  },
  medium: {
    truth: [
      "Have you ever stalked your ex's new partner on Instagram? For how long?",
      "What's the savage thing you've said about a colleague behind their back?",
      "How much did you spend on your most embarrassing drunk Zomato order?",
      "What's a lie you told your boss to skip work that actually worked?",
      "Who's the last person you stalked on LinkedIn 'just to see'?",
      "Have you ever had a crush on a senior at work? Be honest.",
      "What's the longest you've gone without showering during a long weekend?",
      "Have you ever lied about your relationship status to dodge a rishta call?",
      "What's the most petty thing you've done out of jealousy?",
      "Have you ever fake-laughed at a boss's bad joke? Recreate the laugh.",
      "What's a rumour you started in school or college that spread too far?",
      "Who's the most attractive person you've worked with — give a hint, not the name?",
      "What's the most embarrassing reason you've cried as an adult?",
      "Have you ever ghosted someone? Tell the story without naming them.",
      "What's a small thing about a coworker that secretly drives you mad?",
      "What's the worst date you've been on — what happened?",
    ],
    dare: [
      "Text your mom 'I have something to tell you' — wait 30 seconds, then 'just kidding'.",
      "Send a single ❤️ to the 5th person in your WhatsApp chat list. No context.",
      "Open Instagram — read out the last DM you received (skip truly private ones).",
      "Show your phone's screen time — top 3 apps, no hiding.",
      "Read the last flirty WhatsApp forward you saved — dramatically.",
      "Show your Spotify/JioSaavn most-played song this month — the truly embarrassing one.",
      "Send a cringe old photo of yourself to your best friend with caption 'remember this?'",
      "Speak only in pure Hindi (or your regional language) for the next 2 prompts — zero English.",
      "Show your Insta story view list — top 3 viewers, say each name out loud.",
      "Take a selfie together right now and set it as your wallpaper for the rest of the game.",
      "Read your last text to your closest crush / friend / partner in the most dramatic voice.",
      "Show the last person you searched for on Instagram or LinkedIn.",
      "Show the most attractive picture in your camera roll (yours OR someone else's — your call).",
    ],
  },
  spicy: {
    truth: [
      "Who in this office / college / city would you actually swipe right on?",
      "What's the dirtiest thing you've ever Googled?",
      "When did you last get butterflies — and who caused it?",
      "What's the most flirty thing you've done over chat — full story.",
      "What's a body type / feature in someone that instantly makes you weak?",
      "What's the longest you've stared at someone's Instagram without scrolling away?",
      "Have you ever caught feelings for someone you really, really shouldn't have?",
      "What's the cheesiest filmy thing you'd secretly love someone to do for you?",
      "What's your dream first-date plan — specific, not generic?",
      "Have you ever had a dream about someone you know in real life? Don't say who.",
      "What's the most romantic thing someone's ever done for you?",
      "Whose name pops into your head when someone says 'soulmate'?",
      "What kind of person do you usually fall for — pattern check.",
      "If you had to send someone a 3 AM 'are you awake?' text tonight, who would it be?",
      "What's something about the other player you've noticed and secretly liked?",
      "Which Bollywood song lyric describes how you feel about someone right now?",
      "Have you ever been attracted to someone for one specific weird reason? What was it?",
      "What's the most you've ever risked just to talk to someone you liked?",
    ],
    dare: [
      "Give the other player a genuine compliment — eye contact, no laughing for 10 seconds.",
      "Describe the other player in 3 words. Only nice ones allowed.",
      "Tell the other player which Bollywood song reminds you of them.",
      "Confess one thing you've noticed about the other player that they probably don't know.",
      "Tell the other player one thing you find genuinely attractive about them.",
      "Pick a song right now and play 10 seconds of it — say why you chose it for them.",
      "Stare into the other player's eyes for 15 seconds, no laughing. (No phones, no looking away.)",
      "Send the other player your favourite photo of yourself right now on WhatsApp.",
      "Whisper a secret to the other player that no one else knows. Just one.",
      "Tell the other player what 'a perfect Sunday with you' would look like — be specific.",
      "Describe what attracted you to the other player when you first met them.",
      "Sing one full line of any romantic Hindi song to the other player.",
      "Hold the other player's hand for 30 seconds, no talking, no laughing.",
      "Tell the other player one thing you'd want to do with them if there were no rules.",
    ],
  },
}

// ─── Level selector — escalates with round count ─────────────
function pickLevel(round) {
  // Short ramp: r1-2 mild, r3-5 medium, r6+ mix with spicy
  if (round <= 2) return 'mild'
  if (round <= 5) return Math.random() < 0.4 ? 'mild' : 'medium'
  // round 6+: 20% mild, 40% medium, 40% spicy
  const r = Math.random()
  if (r < 0.2) return 'mild'
  if (r < 0.6) return 'medium'
  return 'spicy'
}

const LEVEL_META = {
  mild: { label: 'Warm-up', color: 'text-emerald-500', bg: 'bg-emerald-500/8', border: 'border-emerald-500/30' },
  medium: { label: 'Open up', color: 'text-amber-500', bg: 'bg-amber-500/8', border: 'border-amber-500/30' },
  spicy: { label: 'Deep cut', color: 'text-rose-500', bg: 'bg-rose-500/8', border: 'border-rose-500/30' },
}

// Track used prompts so we don't repeat in a session
function getUnused(level, type, used) {
  const pool = PROMPTS[level][type]
  const usedKey = `${level}-${type}`
  const usedSet = used[usedKey] || new Set()
  const available = pool.filter(p => !usedSet.has(p))
  if (available.length === 0) return pool[Math.floor(Math.random() * pool.length)]
  return available[Math.floor(Math.random() * available.length)]
}

const LS_KEY = 'tod-state-v1'

export default function TruthOrDare({ onBack }) {
  const [phase, setPhase] = useState('setup') // setup | playing
  const [p1, setP1] = useState('')
  const [p2, setP2] = useState('')
  const [currentPlayer, setCurrentPlayer] = useState(0) // 0 = p1, 1 = p2
  const [round, setRound] = useState(1)
  const [currentLevel, setCurrentLevel] = useState('mild')
  const [currentType, setCurrentType] = useState(null) // 'truth' | 'dare' | null
  const [currentPrompt, setCurrentPrompt] = useState(null)
  const [scores, setScores] = useState([0, 0])
  const [skipsRemaining, setSkipsRemaining] = useState([3, 3])
  const [used, setUsed] = useState({})
  const [history, setHistory] = useState([])

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY)
      if (saved) {
        const s = JSON.parse(saved)
        if (s.p1 && s.p2) {
          setP1(s.p1); setP2(s.p2)
          setCurrentPlayer(s.currentPlayer || 0)
          setRound(s.round || 1)
          setScores(s.scores || [0, 0])
          setSkipsRemaining(s.skipsRemaining || [3, 3])
          // Convert serialized sets back
          const u = {}
          Object.entries(s.used || {}).forEach(([k, v]) => { u[k] = new Set(v) })
          setUsed(u)
          setHistory(s.history || [])
          setPhase('playing')
        }
      }
    } catch(e) {}
  }, [])

  // Save
  useEffect(() => {
    if (phase !== 'playing') return
    try {
      const serializableUsed = {}
      Object.entries(used).forEach(([k, v]) => { serializableUsed[k] = Array.from(v) })
      localStorage.setItem(LS_KEY, JSON.stringify({
        p1, p2, currentPlayer, round, scores, skipsRemaining,
        used: serializableUsed, history,
      }))
    } catch(e) {}
  }, [phase, p1, p2, currentPlayer, round, scores, skipsRemaining, used, history])

  const startGame = useCallback(() => {
    if (!p1.trim() || !p2.trim()) return
    setPhase('playing')
  }, [p1, p2])

  const resetGame = useCallback(() => {
    localStorage.removeItem(LS_KEY)
    setPhase('setup')
    setP1(''); setP2('')
    setCurrentPlayer(0); setRound(1)
    setCurrentType(null); setCurrentPrompt(null)
    setScores([0, 0]); setSkipsRemaining([3, 3])
    setUsed({}); setHistory([])
  }, [])

  const pick = useCallback((type) => {
    const level = pickLevel(round)
    const prompt = getUnused(level, type, used)
    setCurrentLevel(level)
    setCurrentType(type)
    setCurrentPrompt(prompt)
    // mark as used
    const usedKey = `${level}-${type}`
    setUsed(prev => {
      const next = { ...prev }
      const set = new Set(next[usedKey] || [])
      set.add(prompt)
      next[usedKey] = set
      return next
    })
  }, [round, used])

  const completePrompt = useCallback(() => {
    const playerIdx = currentPlayer
    const points = currentType === 'dare' ? 20 : 10
    setScores(prev => {
      const next = [...prev]
      next[playerIdx] += points
      return next
    })
    setHistory(prev => [...prev, {
      round, player: playerIdx === 0 ? p1 : p2,
      level: currentLevel, type: currentType,
      prompt: currentPrompt, status: 'done',
    }])
    nextTurn()
  }, [currentPlayer, currentType, round, p1, p2, currentLevel, currentPrompt])

  const skip = useCallback(() => {
    const playerIdx = currentPlayer
    if (skipsRemaining[playerIdx] <= 0) return
    setSkipsRemaining(prev => {
      const next = [...prev]
      next[playerIdx] -= 1
      return next
    })
    setScores(prev => {
      const next = [...prev]
      next[playerIdx] -= 5
      return next
    })
    setHistory(prev => [...prev, {
      round, player: playerIdx === 0 ? p1 : p2,
      level: currentLevel, type: currentType,
      prompt: currentPrompt, status: 'skipped',
    }])
    nextTurn()
  }, [currentPlayer, skipsRemaining, round, p1, p2, currentLevel, currentType, currentPrompt])

  const nextTurn = useCallback(() => {
    setCurrentPlayer(prev => 1 - prev)
    setRound(prev => prev + 1)
    setCurrentType(null)
    setCurrentPrompt(null)
  }, [])

  // ─── Setup screen ───────────────────────────────────────────
  if (phase === 'setup') {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="max-w-md mx-auto px-6 pt-20 pb-16">
          <button
            onClick={onBack}
            className="text-xs text-muted-foreground hover:text-foreground mb-8 font-mono"
          >
            ← back
          </button>

          <h1 className="text-2xl font-semibold mb-2">Truth or Dare</h1>
          <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
            A quick coworker game. Starts easy with get-to-know questions, gets more interesting the longer you play.
            Take turns, have fun, skip anything you don't want to answer.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Player 1</label>
              <input
                type="text"
                value={p1}
                onChange={(e) => setP1(e.target.value)}
                placeholder="Your name"
                className="w-full px-3 py-2 bg-card border border-border rounded-md text-sm focus:outline-none focus:border-accent transition-colors"
                maxLength={20}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Player 2</label>
              <input
                type="text"
                value={p2}
                onChange={(e) => setP2(e.target.value)}
                placeholder="Their name"
                className="w-full px-3 py-2 bg-card border border-border rounded-md text-sm focus:outline-none focus:border-accent transition-colors"
                maxLength={20}
              />
            </div>
            <button
              onClick={startGame}
              disabled={!p1.trim() || !p2.trim()}
              className="w-full mt-2 px-4 py-2.5 bg-accent text-accent-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Start game
            </button>
          </div>

          <div className="mt-10 text-xs text-muted-foreground space-y-2">
            <div className="flex items-center justify-between border-t border-border pt-3">
              <span>Truth completed</span>
              <span className="font-mono text-foreground">+10</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Dare completed</span>
              <span className="font-mono text-foreground">+20</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Skip (3 per player)</span>
              <span className="font-mono text-foreground">−5</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── Playing screen ────────────────────────────────────────
  const activeName = currentPlayer === 0 ? p1 : p2
  const meta = LEVEL_META[currentLevel]

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-2xl mx-auto px-6 pt-6 pb-16">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBack}
            className="text-xs text-muted-foreground hover:text-foreground font-mono"
          >
            ← back
          </button>
          <div className="text-xs font-mono text-muted-foreground">
            Round {round}
          </div>
          <button
            onClick={resetGame}
            className="text-xs text-muted-foreground hover:text-rose-500 font-mono transition-colors"
          >
            reset
          </button>
        </div>

        {/* Scoreboard */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {[p1, p2].map((name, i) => (
            <div
              key={i}
              className={`px-4 py-3 rounded-md border transition-all ${
                currentPlayer === i
                  ? 'border-accent bg-accent/5'
                  : 'border-border bg-card'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium truncate">{name}</div>
                <div className="text-base font-mono font-semibold">{scores[i]}</div>
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                {skipsRemaining[i]} skip{skipsRemaining[i] === 1 ? '' : 's'} left
              </div>
            </div>
          ))}
        </div>

        {/* Active turn card */}
        {!currentType ? (
          <div className="bg-card border border-border rounded-md p-8 text-center">
            <div className="text-xs font-mono text-muted-foreground mb-3">
              Your turn,
            </div>
            <h2 className="text-2xl font-semibold mb-8">{activeName}</h2>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => pick('truth')}
                className="flex-1 max-w-[160px] px-6 py-3 bg-accent text-accent-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Truth
              </button>
              <button
                onClick={() => pick('dare')}
                className="flex-1 max-w-[160px] px-6 py-3 bg-foreground text-background rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Dare
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-md p-8">
            <div className="flex items-center justify-between mb-5">
              <div className="text-xs font-mono text-muted-foreground">
                {activeName} · {currentType.toUpperCase()}
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${meta.color} ${meta.bg} ${meta.border}`}>
                {meta.label}
              </span>
            </div>

            <p className="text-lg leading-relaxed mb-8 min-h-[80px]">
              {currentPrompt}
            </p>

            <div className="flex gap-3">
              <button
                onClick={completePrompt}
                className="flex-1 px-4 py-2.5 bg-accent text-accent-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Done {currentType === 'dare' ? '(+20)' : '(+10)'}
              </button>
              <button
                onClick={skip}
                disabled={skipsRemaining[currentPlayer] <= 0}
                className="px-4 py-2.5 border border-border rounded-md text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Skip (−5)
              </button>
            </div>
          </div>
        )}

        {/* History — collapsed */}
        {history.length > 0 && (
          <details className="mt-6">
            <summary className="text-xs font-mono text-muted-foreground cursor-pointer hover:text-foreground select-none">
              Session history ({history.length})
            </summary>
            <div className="mt-3 space-y-2">
              {history.slice().reverse().slice(0, 20).map((h, i) => (
                <div key={i} className="text-xs flex items-start gap-2 py-2 border-b border-border last:border-0">
                  <span className="font-mono text-muted-foreground shrink-0 w-8">#{h.round}</span>
                  <span className="font-medium shrink-0">{h.player}</span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${LEVEL_META[h.level].color} ${LEVEL_META[h.level].bg}`}>
                    {h.type}
                  </span>
                  <span className="text-muted-foreground flex-1 leading-relaxed">
                    {h.prompt}
                  </span>
                  <span className={`text-[10px] font-mono shrink-0 ${h.status === 'done' ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                    {h.status}
                  </span>
                </div>
              ))}
            </div>
          </details>
        )}
      </div>
    </div>
  )
}
