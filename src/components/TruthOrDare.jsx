import React, { useState, useEffect } from 'react'

// {OTHER} = randomly chosen OTHER player. {HE_SHE}/{HIM_HER}/{HIS_HER} = pronouns from OTHER's gender.
// Tier philosophy:
//   mild      → icebreakers (light, funny, no commitment)
//   medium    → personal deep-dive ABOUT THEM (past, opinions, confessions, no {OTHER})
//   spicy     → intimate personal — what attracts her, fantasies, deepest crushes (still about HER)
//   wild      → chemistry between the two — eye contact, touch, "you and me" stuff (uses {OTHER})
const PROMPTS = {
  mild: {
    truth: [
      "Which Bollywood actor would you fall for if they DM'd you tomorrow?",
      "What's the most embarrassing nickname your family calls you?",
      "Which 2000s Hindi song do you secretly play when no one's around?",
      "Which IPL player would you say yes to a coffee date with?",
      "What's the cringiest Orkut/Facebook bio you ever had?",
      "What's the dumbest thing you bought just to impress someone?",
      "Which SRK / Salman / Ranveer movie scene do you watch when you're sad?",
      "What's your most-used Hinglish phrase that gives away your mood?",
      "Which song instantly makes you think of one specific person?",
      "What's your guilty pleasure Bollywood song you'd never play in front of friends?",
      "What's the most childish thing you still do as an adult?",
      "Have you ever texted the wrong person something embarrassing? What happened?",
      "What's the strangest thing you've ever done when you thought you were alone?",
      "Imitate an iconic Bollywood dialogue dramatically right now.",
    ],
    dare: [
      "Sing one line of 'Tum Hi Ho' or 'Channa Mereya' — full emotion.",
      "Do a 5-second SRK arms-spread pose.",
      "Show your last 3 Zomato/Swiggy orders — including the suspicious late-night ones.",
      "Show the wallpaper on both your phone AND your laptop.",
      "Recreate any one Hrithik Roshan dance step with full conviction.",
      "Show the last meme or reel you sent to a close friend.",
      "Speak in your most exaggerated South Indian or Punjabi accent for the next prompt.",
      "Open your Notes app — read out the most random note.",
      "Show your YouTube history's top 3 videos from this week.",
      "Send a 'good morning 🌹' WhatsApp to a random non-family contact — no explanation.",
      "Post a funny Bollywood meme on your Instagram story right now.",
      "Speak only in Bollywood dialogues for the next round.",
      "Do commentary for 60 seconds as if you're calling an IPL match — only filmy dialogues.",
    ],
  },

  // ─── MEDIUM: personal deep dive — about HER, not about you-and-her ──
  medium: {
    truth: [
      "What's the most savage thing you've ever said about someone behind their back?",
      "How much did you spend on your most embarrassing drunk Zomato order?",
      "What's the most ridiculous lie you've told your parents that they still believe?",
      "Have you ever stalked an ex's new partner on Instagram? For how long?",
      "What's a rumour you started in school or college that spread too far?",
      "What's the worst date you've ever been on — what happened?",
      "Have you ever ghosted someone? Why — without naming them.",
      "What's the most embarrassing reason you've cried as an adult?",
      "Who's the last person you stalked on LinkedIn 'just to see'?",
      "What's the most petty thing you've done out of jealousy?",
      "Have you ever pretended you were single when you weren't?",
      "What's the longest you've been awake stressing over a text someone hadn't replied to?",
      "What's the wildest thing you've done at a wedding or family function?",
      "Have you ever lied about your relationship status to dodge a rishta?",
      "What's a habit of yours that probably annoys everyone around you?",
      "Which one of your exes / situationships taught you the most? What did they teach you?",
      "What's the most embarrassing thing in your search history right now?",
      "What's the most childish reason you've blocked someone?",
      "What's a lie about yourself you tell strangers just to sound interesting?",
      "What's the most you've ever cried over a movie or show?",
    ],
    dare: [
      "Show your phone's screen time — top 3 apps, no hiding.",
      "Open Instagram — read out the last DM you received (skip truly private).",
      "Show your Spotify/JioSaavn most-played song this month — the embarrassing one.",
      "Read your last text to your closest friend in the most dramatic voice.",
      "Show the last person you searched for on Instagram or LinkedIn.",
      "Show your Insta story view list — top 3 viewers, say each name out loud.",
      "Read a 'good morning 🌹' WhatsApp forward dramatically as if it's a Republic Day speech.",
      "Show the last 5 photos in your camera roll, no skipping.",
      "Show your most-used emoji in WhatsApp.",
      "Text your mom 'I have something to tell you' — wait 30 seconds, then 'just kidding'.",
      "Open Truecaller — search any random number from your contacts list.",
      "Show your phone's first ever photo from this year.",
    ],
  },

  // ─── SPICY: intimate personal — what makes her tick, what she finds attractive (about HER) ──
  spicy: {
    truth: [
      "What's the dirtiest thing you've ever Googled?",
      "When was the last time you got butterflies — and what triggered it?",
      "What's a body feature in someone that instantly makes you weak?",
      "What's the most flirty thing you've ever done over chat?",
      "Have you ever caught feelings for someone you really, really shouldn't have?",
      "What's a quality in a person that makes you instantly attracted, even if they're not your type?",
      "What's the most romantic thing someone has ever done for you?",
      "What's your idea of a perfect 'we shouldn't be doing this' date?",
      "What's the longest you've ever stared at someone's Instagram without scrolling away?",
      "What's the cheesiest filmy thing you'd secretly love someone to do for you?",
      "What's your honest love language — and how would someone know they're doing it right?",
      "What kind of person do you usually fall for — pattern check?",
      "What's the most you've ever risked just to talk to someone you liked?",
      "Have you ever had a dream about someone you know in real life? Did you look at them differently after?",
      "What's a small detail about someone that makes you instantly notice them?",
      "What's the most attracted you've ever felt to someone, where you couldn't say a word?",
      "What's a memory of someone that still makes your stomach drop in a good way?",
      "What's a song lyric that perfectly describes how you fall in love?",
      "What's a moment from your past where you wish you had been bolder with someone?",
      "What's something you've always secretly wanted to be told?",
      "What's an underrated turn-on for you that you've never told anyone?",
      "What's the most you've ever fallen for someone without them knowing?",
      "When you really, really want to impress someone, what do you do differently?",
    ],
    dare: [
      "Show the most attractive picture in your camera roll (yours OR someone else's — your call).",
      "Show your favourite photo of yourself ever taken.",
      "Show your phone background AND your laptop background — and explain why you chose them.",
      "Show the last person you screenshotted from an Insta profile.",
      "Pick the most romantic song in your playlist right now and play 15 seconds of it.",
      "Show a screenshot of a flirty conversation you've had (cover names if needed).",
      "Tell us the most romantic gesture you've EVER done for someone.",
      "Take your best 'main character' selfie right now.",
      "Tell the table the most attractive thing you think you have to offer someone.",
      "Read your favourite love song lyric out loud, slowly.",
      "Describe your dream first date — every detail, like you're directing a scene.",
    ],
  },

  // ─── WILD: chemistry between players — eye contact, touch, "you and me" ──
  wild: {
    truth: [
      "Look at {OTHER} and answer honestly — what's the first thing you noticed about {HIM_HER}?",
      "What's a thought you've had about {OTHER} that you'd never say out loud?",
      "What's the most attractive thing {OTHER} has done so far tonight?",
      "If you and {OTHER} were alone right now, what's the FIRST thing you'd do?",
      "When you look at {OTHER} right now, what one word comes to mind?",
      "If {OTHER} asked you to leave the group right now and go for a drive, would you?",
      "What's the smallest thing about {OTHER} you've already noticed and liked?",
      "What's one thing you'd say to {OTHER} if there were no one else in the room?",
      "If tonight had to end with one moment with {OTHER}, what would that moment look like?",
      "If we paused the game right now and you could ask {OTHER} ONE personal question, what would it be?",
      "What's a part of {OTHER}'s personality that low-key drives you a little crazy?",
      "Pick: a slow night-in with {OTHER}, or a wild night out — and explain why honestly.",
      "What's something about {OTHER} you've already imagined doing together?",
      "When did you first realize {OTHER} was someone you wanted to know more?",
    ],
    dare: [
      "Walk over to {OTHER} and tell {HIM_HER}, eye to eye: 'I'm really glad you're here tonight.'",
      "Look at {OTHER}, no smiling, and say: 'I've been waiting for tonight.'",
      "Take {OTHER}'s hand and don't let go until your next turn comes around.",
      "Lean in and whisper one true compliment in {OTHER}'s ear. No one else gets to hear.",
      "Stand close enough to {OTHER} that your shoulders touch — hold it for 30 seconds, no talking.",
      "Slow-dance with {OTHER} for one full minute — pick a song, the rest of the group watches.",
      "Trade phones with {OTHER} for 5 minutes — full access, no clicking off any screen.",
      "Brush a strand of {OTHER}'s hair behind {HIS_HER} ear — no rush, no laughing.",
      "Look at {OTHER} for 30 seconds without saying anything. Just look.",
      "Tell {OTHER}: 'If I asked you to come somewhere with me right now, would you?' Then wait for the answer.",
      "Get up, take {OTHER}'s hand, and lead {HIM_HER} once around the room — slowly.",
      "Pick a place in your phone's saved locations — show {OTHER} and say 'I want to go here with you'.",
      "Look at {OTHER} and finish this sentence: 'When this is over, I want to...'",
      "Give {OTHER} a hug. Hold it longer than is technically polite.",
      "Tell {OTHER} which song you'd want playing if it were just the two of you tonight.",
      "Confess to {OTHER}: the exact moment tonight you found {HIM_HER} most attractive.",
      "Sing one full line of any romantic song looking at {OTHER}.",
      "Tell {OTHER} one thing you'd want to do with {HIM_HER} if there were no rules.",
      "Whisper a secret to {OTHER} that no one else in the room knows.",
    ],
  },
}

// ─── Telugu extras (merged when region = telugu / both) ─────
const TELUGU_EXTRAS = {
  mild: {
    truth: [
      "Which Tollywood hero would you fall for if you met them at Hyderabad airport?",
      "What's your honest opinion on Allu Arjun's hairstyle in Pushpa?",
      "Which Mahesh Babu movie scene do you replay when you need a mood boost?",
      "Which Telugu song is your shower-singing anthem?",
      "Pawan Kalyan or Chiranjeevi — don't say both.",
      "What's your strongest opinion: Hyderabad biryani vs Andhra meals?",
      "Which RRR scene gave you the biggest 'goosebumps moment'?",
    ],
    dare: [
      "Recite a famous Telugu dialogue with full Mahesh Babu attitude.",
      "Do the Allu Arjun shoulder shrug from Pushpa right now.",
      "Sing one line of 'Naatu Naatu' and attempt at least 2 dance steps.",
      "Speak only in pure Telugu (no English words) for the next prompt.",
      "Recreate Prabhas's intro walk from Baahubali, full slow-mo.",
    ],
  },
  medium: {
    truth: [
      "Have you ever lied to your parents that you're going to a Telugu movie when you weren't?",
      "Have you ever had a crush on a cousin's friend at a family function?",
      "What's the most savage gossip you've heard during a Telugu wedding?",
      "Have you ever rejected someone because of their Telugu accent? Be honest.",
      "What's the biggest fight you've had with parents over a sambandham?",
      "What's a strict Telugu family rule you've broken and got away with?",
      "Have you ever pretended you don't speak Telugu just to overhear gossip?",
    ],
    dare: [
      "Call a random uncle/aunty in your contacts, drop 'Em chestunnav?' — see their reaction.",
      "Type 'Nuvvu chala bagunnav' to the 7th person in your WhatsApp list.",
      "Speak in Telugu-accented English for the next 2 prompts.",
    ],
  },
  spicy: {
    truth: [
      "Which Tollywood star would you go on a Goa trip with — and what would happen?",
      "Have you caught feelings for someone just because they spoke Telugu beautifully?",
      "What's the most romantic Telugu song that still gives you butterflies?",
      "What's a Telugu romantic dialogue you've heard that you secretly want directed at you?",
      "What's an attractive trait you can't resist when someone is Telugu?",
    ],
    dare: [
      "Recite the most romantic Telugu dialogue you know — full intent, full emotion.",
      "Sing 'Inkem Inkem Inkem Kaavaale' with everything you've got.",
      "Whisper the most romantic Telugu line you know — say it to the room.",
    ],
  },
  wild: {
    truth: [
      "If {OTHER} was your Tollywood heroine/hero, what's the FIRST scene you'd want to film with {HIM_HER}?",
      "Look at {OTHER}. Which Telugu love song captures EXACTLY what you'd want to feel with {HIM_HER}?",
      "What's a Telugu line you'd want to whisper to {OTHER}?",
    ],
    dare: [
      "Look {OTHER} in the eyes and say 'Naa lo ni jagam undhi' — full meaning, full intent.",
      "Whisper the most romantic Telugu line you know in {OTHER}'s ear.",
      "Take {OTHER}'s hand and sing two lines of 'Yenti Yenti' or any Telugu romantic song just for {HIM_HER}.",
      "Tell {OTHER} in pure Telugu: what you'd want to do if it were just the two of you tonight.",
    ],
  },
}

// ─── Location-specific prompts (~30% chance to fire) ─────────
const LOCATION_PROMPTS = {
  hyderabad: {
    spicy: { truth: [
      "Paradise vs Bawarchi biryani — and what's the most you've spent on biryani in one night?",
      "Where in Hyderabad would you take someone for a perfect first date?",
    ], dare: [
      "Order biryani on Zomato right now — show the cart.",
    ]},
    wild: { truth: [
      "If you took {OTHER} to Hyderabad for a weekend, what's your itinerary?",
    ], dare: [
      "Plan a perfect Hyderabad day with {OTHER} — minute by minute.",
    ]},
  },
  bangalore: {
    spicy: { truth: [
      "Which Bangalore brewpub would you actually take a date to?",
    ], dare: [
      "Open Uber/Ola — show how much your last ride cost.",
    ]},
    wild: { truth: [
      "Plan an ideal weekend in Bangalore with {OTHER}.",
    ], dare: [
      "Pick a place in Bangalore and tell {OTHER} 'I want to take you here'.",
    ]},
  },
  mumbai: {
    spicy: { truth: [
      "Marine Drive at midnight — what's the most you've confessed there?",
    ], dare: [
      "Order a vada pav on any delivery app — show the cart.",
    ]},
    wild: { truth: [
      "If you took {OTHER} to Mumbai, what's the FIRST place you'd take {HIM_HER}?",
    ], dare: [
      "Plan a monsoon-perfect date in Mumbai with {OTHER}.",
    ]},
  },
  bayarea: {
    spicy: { truth: [
      "What's the most 'I live in the Bay' confession you have?",
      "What's the most you've spent on a 'normal' meal in SF?",
    ], dare: [
      "Open Yelp — show the last restaurant you bookmarked.",
    ]},
    wild: { truth: [
      "Pick a Bay Area spot you'd take {OTHER} for a sunset moment.",
    ], dare: [
      "Plan a weekend trip from SF for {OTHER} — Napa, Tahoe, Big Sur?",
    ]},
  },
  nyc: {
    spicy: { truth: [
      "What's the most NYC thing you've done you'd never tell your parents?",
    ], dare: [
      "Open Resy — show what you have a reservation for next.",
    ]},
    wild: { truth: [
      "Pick a rooftop in NYC for sunset with {OTHER}.",
    ], dare: [
      "Plan a perfect 'walking date' across NYC with {OTHER}.",
    ]},
  },
  vegas: {
    spicy: { truth: [
      "What's the most Vegas thing you've done that you don't want on Instagram?",
      "Have you ever lied about how much you spent in Vegas?",
      "What's a 'what happens in Vegas' story you ARE willing to share?",
      "What's the most attractive thing about someone you'd want to share a Vegas suite with?",
    ], dare: [
      "Show the last picture you took on any trip.",
      "Order a 'fancy cocktail' on any app — show the cart.",
    ]},
    wild: { truth: [
      "If tonight ended with you and {OTHER} at the top of the Stratosphere alone, what would you say?",
      "What's a Vegas memory you'd want to re-create with {OTHER}?",
      "Vegas chapels stay open 24/7. If {OTHER} jokingly said 'let's do something stupid', how stupid would you go?",
      "If {OTHER} suggested 'let's just stay out till sunrise' — would you say yes?",
      "Tell {OTHER} which Vegas hotel suite you'd want to wake up in together — and why that one.",
    ], dare: [
      "Look at {OTHER} and say, 'If we were in Vegas right now, I'd take you to ___' — fill in the blank.",
      "Pull up Google Maps, drop a pin anywhere on the Strip, and tell {OTHER} 'meet me here at midnight'.",
      "Take {OTHER}'s hand and walk slowly to the nearest window — pretend you're looking at the Vegas skyline together.",
      "Whisper to {OTHER}: one thing you'd want to do in Vegas that you'd never tell the rest of the group.",
      "Plan a 24-hour Vegas itinerary for you and {OTHER} — hour by hour.",
    ]},
  },
}

// ─── Level escalation: longer mild + medium ─────────────────
// r1-4:   mild (icebreakers)
// r5-10:  medium (personal about her)
// r11+:   spicy + wild mixed
function pickLevel(round) {
  if (round <= 4) return 'mild'
  if (round <= 10) {
    const r = Math.random()
    if (r < 0.15) return 'mild'
    return 'medium'
  }
  // r11+: spicy + wild together
  const r = Math.random()
  if (r < 0.1) return 'medium'
  if (r < 0.55) return 'spicy'
  return 'wild'
}

// Pronoun resolver
function pronoun(gender, kind) {
  if (gender === 'M') return { subject: 'he', object: 'him', possessive: 'his' }[kind]
  if (gender === 'F') return { subject: 'she', object: 'her', possessive: 'her' }[kind]
  return { subject: 'they', object: 'them', possessive: 'their' }[kind]
}

function fillPrompt(template, otherPlayer) {
  if (!template) return ''
  let out = template
  out = out.replace(/\{OTHER\}/g, otherPlayer ? otherPlayer.name : 'them')
  const g = otherPlayer ? otherPlayer.gender : 'X'
  out = out.replace(/\{HE_SHE\}/g, pronoun(g, 'subject'))
  out = out.replace(/\{HIM_HER\}/g, pronoun(g, 'object'))
  out = out.replace(/\{HIS_HER\}/g, pronoun(g, 'possessive'))
  return out
}

function mergedPool(level, type, region) {
  const base = (PROMPTS[level] && PROMPTS[level][type]) || []
  if (region === 'hindi') return base
  const telugu = (TELUGU_EXTRAS[level] && TELUGU_EXTRAS[level][type]) || []
  return [...base, ...telugu]
}

function getUnused(level, type, used, region, location) {
  if (location && location !== 'virtual' && LOCATION_PROMPTS[location]) {
    const locPool = (LOCATION_PROMPTS[location][level] && LOCATION_PROMPTS[location][level][type]) || []
    if (locPool.length > 0 && Math.random() < 0.3) {
      const usedKey = `loc-${location}-${level}-${type}`
      const usedSet = used[usedKey] || new Set()
      const available = locPool.filter(p => !usedSet.has(p))
      if (available.length > 0) {
        return { prompt: available[Math.floor(Math.random() * available.length)], usedKey }
      }
    }
  }
  const pool = mergedPool(level, type, region)
  const usedKey = `${region}-${level}-${type}`
  const usedSet = used[usedKey] || new Set()
  const available = pool.filter(p => !usedSet.has(p))
  if (available.length === 0) {
    return { prompt: pool[Math.floor(Math.random() * pool.length)], usedKey }
  }
  return { prompt: available[Math.floor(Math.random() * available.length)], usedKey }
}

function pickRandomOther(players, currentIdx) {
  const others = players.filter((_, i) => i !== currentIdx)
  if (others.length === 0) return null
  return others[Math.floor(Math.random() * others.length)]
}

const LS_KEY = 'tod-state-v3'
const defaultPlayer = () => ({ name: '', gender: 'X' })

export default function TruthOrDare({ onBack }) {
  const [phase, setPhase] = useState('setup')
  const [players, setPlayers] = useState([defaultPlayer(), defaultPlayer()])
  const [region, setRegion] = useState('telugu')
  const [location, setLocation] = useState('virtual')
  const [currentIdx, setCurrentIdx] = useState(0)
  const [round, setRound] = useState(1)
  const [currentType, setCurrentType] = useState(null)
  const [currentRawPrompt, setCurrentRawPrompt] = useState(null)
  const [currentOther, setCurrentOther] = useState(null)
  const [scores, setScores] = useState([0, 0])
  const [skipsRemaining, setSkipsRemaining] = useState([3, 3])
  const [used, setUsed] = useState({})
  const [history, setHistory] = useState([])
  const [recentTypes, setRecentTypes] = useState([[], []]) // per-player array of last 2 types

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY)
      if (saved) {
        const s = JSON.parse(saved)
        if (Array.isArray(s.players) && s.players.length >= 2 && s.players.every(p => p.name)) {
          setPlayers(s.players)
          setRegion(s.region || 'telugu')
          setLocation(s.location || 'virtual')
          setCurrentIdx(s.currentIdx || 0)
          setRound(s.round || 1)
          setScores(s.scores || s.players.map(() => 0))
          setSkipsRemaining(s.skipsRemaining || s.players.map(() => 3))
          const u = {}
          Object.entries(s.used || {}).forEach(([k, v]) => { u[k] = new Set(v) })
          setUsed(u)
          setHistory(s.history || [])
          setRecentTypes(s.recentTypes || s.players.map(() => []))
          setPhase('playing')
        }
      }
    } catch(e) {}
  }, [])

  useEffect(() => {
    if (phase !== 'playing') return
    try {
      const serializableUsed = {}
      Object.entries(used).forEach(([k, v]) => { serializableUsed[k] = Array.from(v) })
      localStorage.setItem(LS_KEY, JSON.stringify({
        players, region, location, currentIdx, round, scores, skipsRemaining,
        used: serializableUsed, history, recentTypes,
      }))
    } catch(e) {}
  }, [phase, players, region, location, currentIdx, round, scores, skipsRemaining, used, history, recentTypes])

  const addPlayer = () => {
    if (players.length >= 8) return
    setPlayers([...players, defaultPlayer()])
    setScores([...scores, 0])
    setSkipsRemaining([...skipsRemaining, 3])
    setRecentTypes([...recentTypes, []])
  }
  const removePlayer = (i) => {
    if (players.length <= 2) return
    setPlayers(players.filter((_, idx) => idx !== i))
    setScores(scores.filter((_, idx) => idx !== i))
    setSkipsRemaining(skipsRemaining.filter((_, idx) => idx !== i))
    setRecentTypes(recentTypes.filter((_, idx) => idx !== i))
  }
  const updatePlayer = (i, field, value) => {
    setPlayers(players.map((p, idx) => idx === i ? { ...p, [field]: value } : p))
  }

  const startGame = () => {
    if (!players.every(p => p.name.trim())) return
    setPhase('playing')
  }
  const resetGame = () => {
    if (!confirm('Reset the game and lose all scores?')) return
    localStorage.removeItem(LS_KEY)
    setPhase('setup')
    setPlayers([defaultPlayer(), defaultPlayer()])
    setCurrentIdx(0); setRound(1)
    setCurrentType(null); setCurrentRawPrompt(null); setCurrentOther(null)
    setScores([0, 0]); setSkipsRemaining([3, 3])
    setUsed({}); setHistory([]); setRecentTypes([[], []])
  }

  const pick = (type) => {
    const level = pickLevel(round)
    const { prompt: raw, usedKey } = getUnused(level, type, used, region, location)
    const other = pickRandomOther(players, currentIdx)
    setCurrentType(type)
    setCurrentRawPrompt(raw)
    setCurrentOther(other)
    setUsed(prev => {
      const next = { ...prev }
      const set = new Set(next[usedKey] || [])
      set.add(raw)
      next[usedKey] = set
      return next
    })
  }

  const completePrompt = () => {
    const points = currentType === 'dare' ? 20 : 10
    setScores(prev => prev.map((s, i) => i === currentIdx ? s + points : s))
    setHistory(prev => [...prev, {
      round, player: players[currentIdx].name, type: currentType,
      prompt: fillPrompt(currentRawPrompt, currentOther), status: 'done',
    }])
    setRecentTypes(prev => prev.map((arr, i) => i === currentIdx ? [...arr.slice(-1), currentType] : arr))
    nextTurn()
  }
  const skip = () => {
    if (skipsRemaining[currentIdx] <= 0) return
    setSkipsRemaining(prev => prev.map((s, i) => i === currentIdx ? s - 1 : s))
    setScores(prev => prev.map((s, i) => i === currentIdx ? s - 5 : s))
    setHistory(prev => [...prev, {
      round, player: players[currentIdx].name, type: currentType,
      prompt: fillPrompt(currentRawPrompt, currentOther), status: 'skipped',
    }])
    setRecentTypes(prev => prev.map((arr, i) => i === currentIdx ? [...arr.slice(-1), currentType] : arr))
    nextTurn()
  }
  const nextTurn = () => {
    setCurrentIdx(prev => (prev + 1) % players.length)
    setRound(prev => prev + 1)
    setCurrentType(null); setCurrentRawPrompt(null); setCurrentOther(null)
  }

  // ─── Setup screen ───────────────────────────────────────────
  if (phase === 'setup') {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="max-w-md mx-auto px-6 pt-12 pb-16">
          <button onClick={onBack} className="text-xs text-muted-foreground hover:text-foreground mb-8 font-mono">← back</button>

          <h1 className="text-2xl font-semibold mb-2">Truth or Dare</h1>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            Starts light. Builds up to spicy personal questions. Slowly turns into chemistry. Add 2–8 players, take turns.
          </p>

          <div className="grid grid-cols-2 gap-2 mb-4">
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">Vibe</label>
              <select value={region} onChange={(e) => setRegion(e.target.value)} className="w-full px-2 py-2 bg-card border border-border rounded-md text-sm focus:outline-none focus:border-accent">
                <option value="telugu">Telugu</option>
                <option value="hindi">Hindi</option>
                <option value="both">Both (Telugu + Hindi)</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">Location</label>
              <select value={location} onChange={(e) => setLocation(e.target.value)} className="w-full px-2 py-2 bg-card border border-border rounded-md text-sm focus:outline-none focus:border-accent">
                <option value="virtual">Virtual / Generic</option>
                <option value="hyderabad">Hyderabad</option>
                <option value="bangalore">Bangalore</option>
                <option value="mumbai">Mumbai</option>
                <option value="bayarea">SF Bay Area</option>
                <option value="nyc">New York City</option>
                <option value="vegas">Las Vegas</option>
              </select>
            </div>
          </div>

          <div className="space-y-2 mb-3">
            {players.map((p, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text" value={p.name} onChange={(e) => updatePlayer(i, 'name', e.target.value)}
                  placeholder={`Player ${i + 1}`} maxLength={20}
                  className="flex-1 px-3 py-2 bg-card border border-border rounded-md text-sm focus:outline-none focus:border-accent"
                />
                <select value={p.gender} onChange={(e) => updatePlayer(i, 'gender', e.target.value)} className="px-2 py-2 bg-card border border-border rounded-md text-sm focus:outline-none focus:border-accent">
                  <option value="X">—</option>
                  <option value="M">M</option>
                  <option value="F">F</option>
                </select>
                {players.length > 2 && (
                  <button onClick={() => removePlayer(i)} className="px-2 py-2 text-muted-foreground hover:text-rose-500 text-sm">✕</button>
                )}
              </div>
            ))}
          </div>

          {players.length < 8 && (
            <button onClick={addPlayer} className="w-full mb-6 px-3 py-2 border border-dashed border-border rounded-md text-xs text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors">
              + add player ({players.length}/8)
            </button>
          )}

          <button onClick={startGame} disabled={!players.every(p => p.name.trim())} className="w-full mt-2 px-4 py-2.5 bg-accent text-accent-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed">
            Start game
          </button>

          <div className="mt-10 text-xs text-muted-foreground space-y-2">
            <div className="flex items-center justify-between border-t border-border pt-3">
              <span>Truth completed</span><span className="font-mono text-foreground">+10</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Dare completed</span><span className="font-mono text-foreground">+20</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Skip (3 per player)</span><span className="font-mono text-foreground">−5</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const active = players[currentIdx]
  const filledPrompt = currentRawPrompt ? fillPrompt(currentRawPrompt, currentOther) : null

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-2xl mx-auto px-6 pt-6 pb-16">
        <div className="flex items-center justify-between mb-6">
          <button onClick={onBack} className="text-xs text-muted-foreground hover:text-foreground font-mono">← back</button>
          <div className="text-xs font-mono text-muted-foreground">Round {round}</div>
          <button onClick={resetGame} className="text-xs text-muted-foreground hover:text-rose-500 font-mono transition-colors">reset</button>
        </div>

        <div className={`grid gap-2 mb-6 ${players.length <= 4 ? 'grid-cols-2' : 'grid-cols-3'}`}>
          {players.map((p, i) => (
            <div key={i} className={`px-3 py-2 rounded-md border transition-all ${currentIdx === i ? 'border-accent bg-accent/5' : 'border-border bg-card'}`}>
              <div className="flex items-center justify-between gap-1">
                <div className="text-sm font-medium truncate">{p.name}</div>
                <div className="text-sm font-mono font-semibold shrink-0">{scores[i]}</div>
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                {skipsRemaining[i]} skip{skipsRemaining[i] === 1 ? '' : 's'}
              </div>
            </div>
          ))}
        </div>

        {!currentType ? (
          (() => {
            const playerRecent = recentTypes[currentIdx] || []
            const lastTwoSame = playerRecent.length >= 2 && playerRecent[0] === playerRecent[1]
            const forcedType = lastTwoSame ? (playerRecent[0] === 'truth' ? 'dare' : 'truth') : null
            return (
              <div className="bg-card border border-border rounded-md p-8 text-center">
                <div className="text-xs font-mono text-muted-foreground mb-3">Your turn,</div>
                <h2 className="text-2xl font-semibold mb-8">{active.name}</h2>
                {forcedType && (
                  <div className="text-[11px] font-mono text-amber-500/80 mb-4 -mt-4">
                    No 3-in-a-row — must pick {forcedType.toUpperCase()}
                  </div>
                )}
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => pick('truth')}
                    disabled={forcedType === 'dare'}
                    className="flex-1 max-w-[160px] px-6 py-3 bg-accent text-accent-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Truth
                  </button>
                  <button
                    onClick={() => pick('dare')}
                    disabled={forcedType === 'truth'}
                    className="flex-1 max-w-[160px] px-6 py-3 bg-foreground text-background rounded-md text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Dare
                  </button>
                </div>
              </div>
            )
          })()
        ) : (
          <div className="bg-card border border-border rounded-md p-8">
            <div className="text-xs font-mono text-muted-foreground mb-5">
              {active.name} · {currentType.toUpperCase()}
            </div>
            <p className="text-lg leading-relaxed mb-8 min-h-[80px]">{filledPrompt}</p>
            <div className="flex gap-3">
              <button onClick={completePrompt} className="flex-1 px-4 py-2.5 bg-accent text-accent-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity">
                Done {currentType === 'dare' ? '(+20)' : '(+10)'}
              </button>
              <button onClick={skip} disabled={skipsRemaining[currentIdx] <= 0} className="px-4 py-2.5 border border-border rounded-md text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                Skip (−5)
              </button>
            </div>
          </div>
        )}

        {history.length > 0 && (
          <details className="mt-6">
            <summary className="text-xs font-mono text-muted-foreground cursor-pointer hover:text-foreground select-none">
              Session history ({history.length})
            </summary>
            <div className="mt-3 space-y-2">
              {history.slice().reverse().slice(0, 25).map((h, i) => (
                <div key={i} className="text-xs flex items-start gap-2 py-2 border-b border-border last:border-0">
                  <span className="font-mono text-muted-foreground shrink-0 w-8">#{h.round}</span>
                  <span className="font-medium shrink-0">{h.player}</span>
                  <span className="text-[10px] font-mono text-muted-foreground shrink-0">{h.type}</span>
                  <span className="text-muted-foreground flex-1 leading-relaxed">{h.prompt}</span>
                  <span className={`text-[10px] font-mono shrink-0 ${h.status === 'done' ? 'text-emerald-500' : 'text-muted-foreground'}`}>{h.status}</span>
                </div>
              ))}
            </div>
          </details>
        )}
      </div>
    </div>
  )
}
