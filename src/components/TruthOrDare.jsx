import React, { useState, useEffect, useCallback, useMemo } from 'react'

// ─── Prompt pool: 3 levels × truth/dare ──────────────────────
// Mild = safe-for-work coworker, get-to-know
// Medium = flirty/sillier, opens up
// Spicy = personal/bold/playful — still tasteful, never gross
const PROMPTS = {
  mild: {
    truth: [
      "What's the most random thing in your bag right now?",
      "What's your go-to comfort food?",
      "What's a hobby you've always wanted to try?",
      "What was your first job?",
      "What's the last song you had on repeat?",
      "What's your most-used emoji?",
      "What's a movie you can quote line for line?",
      "What was your dream job as a kid?",
      "What's your favorite breakfast?",
      "What's the weirdest food combo you genuinely enjoy?",
      "What's a small thing that always makes your day better?",
      "What's your favorite season and why?",
      "What's a skill you wish you had?",
      "What's the last book or article you couldn't put down?",
      "What's your guilty-pleasure TV show?",
      "What's a place you've always wanted to visit?",
      "What's your usual coffee/tea order?",
      "What was your favorite subject in school?",
      "What's a random fact you know that nobody asked for?",
      "What's the most useless talent you have?",
      "What's a song that instantly puts you in a good mood?",
      "What's your favorite weekend activity?",
      "If you could only eat one cuisine for a month, what would it be?",
      "What's your spirit animal and why?",
      "What's the most expensive thing you've bought on impulse?",
    ],
    dare: [
      "Show the last photo you took (any photo, your choice).",
      "Share a screenshot of your home screen.",
      "Do your best impression of a coworker (no names).",
      "Sing one line of your current favorite song.",
      "Show the last 3 things in your search history (curated is fine).",
      "Speak in an accent for the next 2 prompts.",
      "Show your most-used app this week.",
      "Tell a 30-second story about your weirdest commute.",
      "Read your most recent text out loud (you choose which).",
      "Describe your day using only emojis.",
      "Make up a 5-second jingle about Mondays.",
      "Show your camera roll's first photo from this year.",
      "Do 5 jumping jacks (or describe doing them dramatically).",
      "Recite the alphabet backwards as fast as you can.",
      "Compliment yourself for 15 seconds straight.",
      "Show the last meme you saved or sent.",
      "Tell the worst joke you know.",
      "Mimic your morning alarm sound.",
    ],
  },
  medium: {
    truth: [
      "What's the most embarrassing thing you've done at work?",
      "What's a small crush you've had on a celebrity?",
      "What's your most controversial food opinion?",
      "What's something you pretend to understand but don't?",
      "What's a habit of yours that probably annoys other people?",
      "What's the worst gift you've ever received?",
      "What's a lie you told as a kid that you got away with?",
      "What's the dumbest thing you've cried about as an adult?",
      "What's the most awkward date you've been on?",
      "What's something you've Googled that you'd be embarrassed about?",
      "What's a weird thing you do when no one's around?",
      "Who was your first crush?",
      "What's the most rebellious thing you've ever done?",
      "What's a compliment you secretly love getting?",
      "What's your most embarrassing teenage phase?",
      "What's a small lie you tell people often?",
      "What's something you've never told anyone in this room?",
      "What's the pettiest thing you've held a grudge over?",
      "What's the most childish thing you still do?",
      "What was your weirdest middle-school obsession?",
      "What's something you'd never admit on LinkedIn?",
      "What's the longest you've gone without showering?",
    ],
    dare: [
      "Text your most recent contact a single word: 'pineapple'. No context.",
      "Show your screen time stats for this week.",
      "Read your latest DM out loud (skip private ones, pick a safe one).",
      "Share the last voice note you sent.",
      "Show your camera roll's most embarrassing recent photo.",
      "Open your notes app — read the most random note.",
      "Show your Spotify/Apple Music top song this month.",
      "Send a random gif to a group chat with no context.",
      "Do a dramatic reading of your last sent email.",
      "Show your phone background AND lock screen.",
      "Reveal your most-watched YouTube channel.",
      "Show your most recent Amazon order.",
      "Read the last 3 things in your search history out loud.",
      "Share your worst selfie attempt (it can stay private — just confirm it exists).",
      "Open your photos — show the 9th picture from the top.",
    ],
  },
  spicy: {
    truth: [
      "What's something you find unexpectedly attractive in a person?",
      "What's the biggest flirt move you've ever pulled?",
      "What's a song that's secretly your 'romance' song?",
      "What's something you'd want to do on a perfect date?",
      "Have you ever had a crush on someone you shouldn't have?",
      "What's your love language, honestly?",
      "What's the most romantic thing someone's done for you?",
      "What's something silly you find oddly cute?",
      "When did you last get really nervous around someone?",
      "What's a green flag you look for in people?",
      "What's a quality in someone that instantly catches your attention?",
      "What's your idea of a perfect lazy Sunday with someone?",
      "What's a small gesture that makes you feel really seen?",
      "What's a feature on someone you always notice first?",
      "What's the most you've ever lost sleep over a crush?",
      "What's the cheesiest thing you'd secretly love someone to do for you?",
      "What's a song lyric that describes how you feel about love right now?",
      "What's the best compliment you've ever received?",
      "What's a small thing about you that you wish more people noticed?",
      "Who in your life knows you the best, and what's something only they know?",
    ],
    dare: [
      "Send a sincere compliment to the other player — out loud, eye contact.",
      "Share the song that's been on your mind today and say why.",
      "Tell the other player one thing you genuinely admire about them.",
      "Describe the other player in 3 words — only nice ones.",
      "Share a memory of the other player that made you smile.",
      "Read out a song lyric that captures your current mood.",
      "Show the most romantic photo in your camera roll (sunset, candles, anything).",
      "Tell a story about a moment you felt truly happy this year.",
      "Share something you appreciate about working with the other player.",
      "Pick a song for the other player — say which song, and why.",
      "Tell the other player what you'd like to know more about them.",
      "Describe what 'a really good day' looks like to you, in detail.",
      "Share one thing on your bucket list you've never told anyone.",
      "Say the kindest thing you've ever been told.",
    ],
  },
}

// ─── Level selector — escalates with round count ─────────────
function pickLevel(round) {
  // round 1-5: pure mild
  if (round <= 5) return 'mild'
  // round 6-12: 80% mild, 20% medium
  if (round <= 12) return Math.random() < 0.8 ? 'mild' : 'medium'
  // round 13-20: 30% mild, 50% medium, 20% spicy
  if (round <= 20) {
    const r = Math.random()
    if (r < 0.3) return 'mild'
    if (r < 0.8) return 'medium'
    return 'spicy'
  }
  // round 21+: 20% mild, 40% medium, 40% spicy
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
