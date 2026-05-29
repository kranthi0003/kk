import React, { useState, useEffect, useCallback } from 'react'

// {X} = active player, {OTHER} = a randomly chosen OTHER player
// {HE_SHE}/{HIM_HER}/{HIS_HER} are replaced based on OTHER's gender.
const PROMPTS = {
  mild: {
    truth: [
      "Which Bollywood actor would you 100% fall for if they DM'd you tomorrow?",
      "What's the most embarrassing nickname your family calls you?",
      "Which 2000s Hindi song do you secretly play when no one's around?",
      "Which IPL player would you say yes to a coffee date with?",
      "What's the cringiest Orkut/Facebook bio you ever had?",
      "Who's the last person whose Instagram profile you opened — and why?",
      "What's a Maggi-at-2-AM confession nobody knows?",
      "Which Hindi serial actress/actor had your secret crush growing up?",
      "What's the dumbest thing you bought just to impress someone?",
      "Which SRK / Salman / Ranveer movie scene do you watch when you're sad?",
      "What's your most-used Hinglish phrase that gives away your mood?",
      "What's the silliest reason you almost slid into someone's DMs?",
      "What's the most over-the-top thing your mom said when she found out you had a 'friend'?",
      "Which song instantly makes you think of one specific person?",
      "What's your guilty pleasure Bollywood song that you'd never play in front of friends?",
      "Imitate an iconic Bollywood dialogue dramatically right now.",
      "What's the most childish thing you still do as an adult?",
      "Have you ever texted the wrong person something embarrassing? What happened?",
      "What's the strangest thing you've ever done when you thought you were alone?",
      "Who in this group has the worst Bollywood dance moves — and why?",
    ],
    dare: [
      "Sing one line of 'Tum Hi Ho' or 'Channa Mereya' looking at {OTHER}. Full emotion.",
      "Do a 5-second SRK arms-spread pose with {OTHER}.",
      "Show your last 3 Zomato/Swiggy orders — including the suspicious late-night ones.",
      "Read the last flirty (or wanna-be flirty) text you sent — out loud.",
      "Show the wallpaper on both your phone AND your laptop.",
      "Recreate any one Hrithik Roshan dance step with full conviction.",
      "Show the last meme/reel you sent to a crush or close friend.",
      "Speak in your most exaggerated South Indian or Punjabi accent for the next prompt.",
      "Open your Notes app — read out the most random note.",
      "Show your YouTube history's top 3 videos from this week.",
      "Send a 'good morning 🌹' WhatsApp to a random non-family contact — no explanation.",
      "Do your best impression of someone else in the group — others have to guess who.",
      "Do commentary for 60 seconds as if you're calling an IPL match — only using filmy dialogues.",
      "Post a funny Bollywood meme on your Instagram story right now.",
      "Speak only in Bollywood dialogues for the next round.",
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
      "Have you ever lied about your relationship status to dodge a rishta call?",
      "What's the most petty thing you've done out of jealousy?",
      "Have you ever fake-laughed at a boss's bad joke? Recreate the laugh.",
      "What's a rumour you started in school or college that spread too far?",
      "Who's the most attractive person you've worked with — give a hint, not the name?",
      "What's the most embarrassing reason you've cried as an adult?",
      "Have you ever ghosted someone? Tell the story without naming them.",
      "What's the worst date you've been on — what happened?",
      "Who in this room would you most want to swap lives with for a day, and why?",
      "What's the silliest superstition you follow during IPL season or while watching a Bollywood movie?",
      "Have you ever had a crush on a teacher or professor? Who?",
      "What's the most ridiculous excuse you've given to skip a family event?",
      "If you could swap lives with one IPL player for a week, what's the first thing you'd do?",
      "Who in this group would you take on a DDLJ-style train trip and why?",
    ],
    dare: [
      "Text your mom 'I have something to tell you' — wait 30 seconds, then 'just kidding'.",
      "Send a single ❤️ to the 5th person in your WhatsApp chat list. No context.",
      "Open Instagram — read out the last DM you received (skip truly private ones).",
      "Show your phone's screen time — top 3 apps, no hiding.",
      "Read a 'good morning 🌹' WhatsApp forward dramatically as if it's a Republic Day speech.",
      "Show your Spotify/JioSaavn most-played song this month — the truly embarrassing one.",
      "Send a cringe old photo of yourself to your best friend with caption 'remember this?'",
      "Speak only in pure Hindi (or your regional language) for the next 2 prompts — zero English.",
      "Show your Insta story view list — top 3 viewers, say each name out loud.",
      "Take a selfie with {OTHER} right now and set it as your wallpaper for the rest of the game.",
      "Read your last text to your closest crush / friend / partner in the most dramatic voice.",
      "Show the last person you searched for on Instagram or LinkedIn.",
      "Show the most attractive picture in your camera roll (yours OR someone else's — your call).",
      "Call your parents and ask how their day was — using only Bollywood song lyrics.",
      "Rap a cricket commentary as if you're Yo Yo Honey Singh — full minute, no breaks.",
      "Let the group pick ANY emoji and you have to send it to your last WhatsApp chat.",
      "Show the most embarrassing photo on your phone — no explanations allowed.",
    ],
  },
  spicy: {
    truth: [
      "Who in this room would you actually swipe right on — just point.",
      "What's the dirtiest thing you've ever Googled?",
      "When did you last get butterflies — and who caused it?",
      "What's the most flirty thing you've done over chat — full story.",
      "What's a body type / feature in someone that instantly makes you weak?",
      "What's the longest you've stared at someone's Instagram without scrolling away?",
      "Have you ever caught feelings for someone you really, really shouldn't have?",
      "What's the cheesiest filmy thing you'd secretly love someone to do for you?",
      "What's your dream first-date plan — specific, not generic?",
      "Have you ever had a dream about someone in this room? Don't say who — just yes or no.",
      "What's the most romantic thing someone's ever done for you?",
      "Whose name in this room pops into your head when you hear the word 'soulmate'?",
      "If you had to send someone a 3 AM 'are you awake?' text tonight — who in this room?",
      "What's something about {OTHER} you've noticed and secretly liked?",
      "Which Bollywood song lyric describes how you feel about someone right now?",
      "Who in this room do you think has the most attractive smile?",
      "Pick someone in this room you'd take on a Goa trip — and say why.",
      "What's the most you've ever risked just to talk to someone you liked?",
      "Pick one person in this room whose voice you find the most attractive.",
      "Who in this room would you trust with your phone unlocked for a full day?",
      "Rank everyone in this room by how good at flirting you think they are.",
      "Pick someone in this room you'd happily binge-watch an entire show with in one sitting.",
    ],
    dare: [
      "Give {OTHER} a genuine compliment — eye contact, no laughing for 10 seconds.",
      "Describe {OTHER} in 3 words. Only nice ones allowed.",
      "Tell {OTHER} which Bollywood song reminds you of {HIM_HER}.",
      "Confess one thing you've noticed about {OTHER} that {HE_SHE} probably doesn't know.",
      "Tell {OTHER} one thing you find genuinely attractive about {HIM_HER}.",
      "Pick a song right now and play 10 seconds of it — say why you chose it for {OTHER}.",
      "Stare into {OTHER}'s eyes for 15 seconds, no laughing, no looking away.",
      "Send {OTHER} your favourite photo of yourself right now on WhatsApp.",
      "Whisper a secret to {OTHER} that no one else in the room knows.",
      "Tell {OTHER} what 'a perfect Sunday with you' would look like — be specific.",
      "Describe what attracted you to {OTHER} when you first met {HIM_HER}.",
      "Sing one full line of any romantic Hindi song looking at {OTHER}.",
      "Hold {OTHER}'s hand for 30 seconds, no talking, no laughing.",
      "Tell {OTHER} one thing you'd want to do with {HIM_HER} if there were no rules.",
      "Propose to {OTHER} Bollywood-style — full dialogue, full drama.",
      "Pick the person in this room you'd most want to slow-dance with — and do it for 30 seconds.",
      "Recreate a famous Bollywood romantic scene with {OTHER}.",
      "Give a 30-second toast about why {OTHER} would make a great partner.",
      "Tell the group who in this room you'd most like to be stuck in a lift with for 1 hour.",
    ],
  },
  wild: {
    truth: [
      "Look at {OTHER} and answer honestly — what's the first thing you noticed about {HIM_HER}?",
      "If you and {OTHER} were alone in a hotel suite tonight, what's the FIRST thing you'd do?",
      "What's a thought you've had about {OTHER} that you'd never say out loud?",
      "Has anyone in this room ever made you do a double-take? Don't say who — just yes or no.",
      "What's the most attractive thing {OTHER} has done so far tonight?",
      "If we paused the game right now and you could ask {OTHER} ONE personal question, what would it be?",
      "When was the last time you wanted to kiss someone but didn't? Don't name them.",
      "What's a part of {OTHER}'s personality that low-key drives you a little crazy?",
      "If {OTHER} asked you to leave the group right now and go for a drive, would you?",
      "What's the smallest thing about {OTHER} you've already noticed and liked?",
      "Pick: a slow night-in with {OTHER}, or a wild night out — and explain why honestly.",
      "What's one thing you'd say to {OTHER} if there were no one else in the room?",
      "If tonight had to end with one moment with {OTHER}, what would that moment look like?",
      "When did you last feel a real spark with someone? What was it about them?",
    ],
    dare: [
      "Walk over to {OTHER} and tell {HIM_HER}, eye to eye: 'I'm really glad you're here tonight.'",
      "Stand close enough to {OTHER} that your shoulders touch — hold it for 30 seconds, no talking.",
      "Lean in and whisper one true compliment in {OTHER}'s ear. No one else gets to hear.",
      "Look at {OTHER}, no smiling, and say: 'I've been waiting for tonight.'",
      "Take {OTHER}'s hand and don't let go until your next turn comes around.",
      "Slow-dance with {OTHER} for one full minute — pick a song, the rest of the group watches.",
      "Trade phones with {OTHER} for 5 minutes — full access, no clicking off any screen.",
      "Confess to {OTHER}: tell {HIM_HER} the exact moment tonight you found {HIM_HER} most attractive.",
      "Brush a strand of {OTHER}'s hair behind {HIS_HER} ear — no rush, no laughing.",
      "Look at {OTHER} for 30 seconds without saying anything. Just look.",
      "Tell {OTHER}: 'If I asked you to come somewhere with me right now, would you?' Then wait for the answer.",
      "Get up, take {OTHER}'s hand, and lead {HIM_HER} once around the room — slowly.",
      "Pick a place in your phone's saved locations — show {OTHER} and say 'I want to go here with you'.",
      "Look at {OTHER} and say one sentence that starts with 'When this is over, I want to...'",
      "Give {OTHER} a hug. Hold it longer than is technically polite.",
      "Tell {OTHER} which song you'd want playing if it were just the two of you tonight.",
    ],
  },
}

// ─── Telugu-specific prompts (merged when region = telugu/both) ──
const TELUGU_EXTRAS = {
  mild: {
    truth: [
      "Which Tollywood hero would you fall for if you met them at Hyderabad airport?",
      "What's your honest opinion on Allu Arjun's hairstyle in Pushpa?",
      "Which Mahesh Babu movie scene do you replay when you need a mood boost?",
      "Which Telugu song is your shower-singing anthem?",
      "What's the most embarrassing moment you've had at a Telugu wedding?",
      "Who's your secret Tollywood crush you'd never admit to your friends?",
      "Which Telugu meme template best describes you?",
      "What's your strongest opinion: Hyderabad biryani vs Andhra meals?",
      "Which RRR scene gave you the biggest 'goosebumps moment'?",
      "What's the most Telugu thing about you that non-Telugus find weird?",
      "Which Telugu actor's dialogue do you secretly imitate when alone?",
      "What's the worst Telugu song lyric that's actually a banger?",
      "Pawan Kalyan or Chiranjeevi — don't say both.",
      "What's the cringiest reel you saved with a Telugu song?",
    ],
    dare: [
      "Recite a famous Telugu dialogue with full Mahesh Babu attitude.",
      "Do the Allu Arjun shoulder shrug from Pushpa right now.",
      "Sing one line of 'Naatu Naatu' and attempt at least 2 dance steps.",
      "Pretend you're a Telugu news anchor giving breaking news about {OTHER}.",
      "Speak only in pure Telugu (no English words) for the next prompt.",
      "Do a 30-second Brahmanandam-style comedy reaction to anything.",
      "Recreate Prabhas's intro walk from Baahubali, full slow-mo.",
      "Compose a short Telugu pelli (wedding) invitation between you and {OTHER}.",
      "Imitate any famous Telugu auto driver's bargaining style.",
      "Recite 5 Telugu film titles in your most dramatic voice.",
    ],
  },
  medium: {
    truth: [
      "Have you ever lied to your parents that you're going to a Telugu movie when you weren't?",
      "Which Tollywood hero would you happily move to Hyderabad for?",
      "Have you ever had a crush on a cousin's friend at a family function?",
      "What's the most savage gossip you've heard during a Telugu wedding?",
      "Which Tollywood heroine would you be best friends with?",
      "Have you ever rejected someone because of their Telugu accent? Be honest.",
      "What's the biggest fight you've had with parents over a sambandham?",
      "What's the most embarrassing thing you've Googled in Telugu?",
      "What's a strict Telugu family rule you've broken and got away with?",
      "Have you ever pretended you don't speak Telugu just to overhear gossip?",
    ],
    dare: [
      "Call a random uncle/aunty in your contacts, drop 'Em chestunnav?' — see their reaction.",
      "Sing the chorus of 'Butta Bomma' with full hip swing, looking at {OTHER}.",
      "Pretend {OTHER} is a Telugu movie villain — give them a 30-second confrontation scene.",
      "Type 'Nuvvu chala bagunnav' to the 7th person in your WhatsApp list.",
      "Speak in Telugu-accented English for the next 2 prompts.",
      "Do a Telugu serial dramatic 'shocked' face — hold for 10 seconds.",
    ],
  },
  spicy: {
    truth: [
      "Which Tollywood star would you go on a Goa trip with — and what would happen?",
      "If {OTHER} was a Telugu movie character, who would they be — and why?",
      "Have you caught feelings for someone just because they spoke Telugu beautifully?",
      "What's a romantic Telugu song that makes you think of someone in this room?",
      "Which Tollywood couple would you want your love story to look like?",
      "Have you ever sent a Telugu romantic dialogue as a 'joke' but secretly meant it?",
    ],
    dare: [
      "Look at {OTHER} and say 'Naa pranamantha nuvve' with full conviction.",
      "Recreate a rain scene from any Telugu movie with {OTHER} (acting only).",
      "Tell {OTHER} which Tollywood song reminds you of {HIM_HER}.",
      "Propose to {OTHER} in pure Telugu, full filmy — 'nee tho life lo...'.",
      "Sing 'Inkem Inkem Inkem Kaavaale' looking at {OTHER}.",
      "Whisper a Telugu pet name (cheliya / bujji / chinni) to {OTHER}.",
    ],
  },
  wild: {
    truth: [
      "If {OTHER} was your Tollywood heroine/hero, what's the FIRST scene you'd want to film with {HIM_HER}?",
      "What's a Telugu romantic line you've always wanted to say to someone — and to whom in this room would you say it now?",
      "Look at {OTHER}. Which Telugu love song captures EXACTLY what you'd want to feel with {HIM_HER}?",
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
    mild: { truth: [
      "Paradise vs Bawarchi biryani — what's your hot take?",
      "Where in Hyderabad would you take a first date that ISN'T Charminar?",
      "What's the wildest thing you've done after midnight in Jubilee Hills?",
    ], dare: [
      "Order biryani on Zomato right now — show the cart (don't checkout).",
      "Pronounce 'Begumpet', 'Madhapur', 'Gachibowli' in your worst accent.",
    ]},
    medium: { truth: [
      "Have you stalked someone's Insta to figure out their Hyderabad area?",
      "What's the most awkward date you had in Hyderabad — name the place.",
    ], dare: [
      "Text someone 'Banjara Hills lo unnava?' out of nowhere — show their reply.",
    ]},
    spicy: { truth: [
      "Pick a place in Hyderabad you'd take {OTHER} for a perfect day out.",
    ], dare: [
      "Plan a fake first-date route across Hyderabad with {OTHER} — minute by minute.",
    ]},
  },
  bangalore: {
    mild: { truth: [
      "Which Bangalore traffic moment made you question all your life choices?",
      "Indiranagar or Koramangala — pick your team.",
    ], dare: [
      "Pretend you're stuck on Silk Board flyover, narrate it as breaking news.",
    ]},
    medium: { truth: [
      "What's the most expensive thing you've done on MG Road?",
    ], dare: [
      "Open Uber/Ola — show how much your last ride cost. No hiding.",
    ]},
    spicy: { truth: [
      "Which Bangalore brewpub would you take {OTHER} to for a proper date?",
    ], dare: [
      "Plan a Sunday for {OTHER} — Cubbon Park to Toit, in detail.",
    ]},
  },
  mumbai: {
    mild: { truth: [
      "Marine Drive at night or Bandstand at sunset — which says more about you?",
      "Honest opinion on Mumbai local trains?",
    ], dare: [
      "Recreate a 'Slumdog Millionaire' chase scene reaction.",
    ]},
    medium: { truth: [
      "What's the latest you've been out in Mumbai — and doing what?",
    ], dare: [
      "Order a vada pav on any delivery app — show the cart.",
    ]},
    spicy: { truth: [
      "Pick a place in Mumbai for a midnight walk with {OTHER}.",
    ], dare: [
      "Plan a monsoon-perfect date in Mumbai with {OTHER}.",
    ]},
  },
  bayarea: {
    mild: { truth: [
      "What's the most 'I live in the Bay' thing you've done this week?",
      "Queued for brunch in the Mission for 60+ mins? Honestly?",
      "Caltrain or BART — who hurt you more?",
    ], dare: [
      "Open Yelp — show the last restaurant you bookmarked.",
      "Do your best 'tech bro at a coffee shop' impression.",
    ]},
    medium: { truth: [
      "Which Bay Area hike would you actually take a date on — not just claim?",
      "What's the most you've spent on a 'normal' meal in SF?",
    ], dare: [
      "Search 'best date spots near me' — show the top 3 results.",
    ]},
    spicy: { truth: [
      "Pick a Bay Area spot you'd take {OTHER} for a sunset moment.",
    ], dare: [
      "Plan a perfect weekend trip from SF for {OTHER} — Napa? Tahoe? Big Sur?",
    ]},
  },
  nyc: {
    mild: { truth: [
      "Which NYC borough actually matches your energy?",
      "What's the most NYC thing you've done you'd never tell your parents?",
    ], dare: [
      "Open Citi Bike or your subway app — show your last route.",
      "Do your best 'angry New Yorker on the phone' impression.",
    ]},
    medium: { truth: [
      "Which NYC bar would you drag {OTHER} to on a first date?",
    ], dare: [
      "Open Resy — show what you have a reservation for next.",
    ]},
    spicy: { truth: [
      "Pick a rooftop in NYC for sunset with {OTHER}.",
    ], dare: [
      "Plan a perfect 'walking date' across NYC with {OTHER}.",
    ]},
  },
  vegas: {
    mild: { truth: [
      "What's the most Vegas thing you've done that you don't want on Instagram?",
      "Strip or Fremont Street — which one is more YOU?",
      "What's the most money you've lost (or won) in one night?",
    ], dare: [
      "Show the last picture you took on a Vegas trip — any trip.",
      "Order a 'fancy cocktail' on any app — show the cart.",
    ]},
    medium: { truth: [
      "What happens in Vegas... what's one story you ARE willing to share?",
      "Have you ever lied about how much you spent in Vegas?",
    ], dare: [
      "Pretend you're 3 drinks in at a Vegas bar — give a 30-second monologue to {OTHER}.",
    ]},
    spicy: { truth: [
      "If you flew to Vegas tomorrow with {OTHER}, what's the FIRST thing on the itinerary?",
      "Have you ever almost done something you'd regret in Vegas? How close?",
      "What's the 'we should never tell anyone' story you have from Vegas?",
      "If you were in a Vegas hotel suite right now with {OTHER}, what'd be the soundtrack?",
    ], dare: [
      "Plan a 24-hour Vegas itinerary for you and {OTHER} — be specific, hour by hour.",
      "Bet {OTHER} something silly right now — winner picks the next dare for next round.",
      "Order any 'fancy Vegas-style' cocktail on a delivery app — show the cart to {OTHER}.",
    ]},
    wild: { truth: [
      "If tonight ended with you and {OTHER} at the top of the Stratosphere alone, what would you say?",
      "What's a Vegas memory you'd want to re-create with {OTHER}?",
      "If {OTHER} suggested 'let's just stay out till sunrise' — would you say yes?",
      "Vegas chapels stay open 24/7. If {OTHER} jokingly said 'let's do something stupid', how stupid would you go?",
    ], dare: [
      "Look at {OTHER} and say, 'If we were in Vegas right now, I'd take you to ___' — fill in the blank.",
      "Pull up Google Maps, drop a pin anywhere on the Strip, and tell {OTHER} 'meet me here at midnight'.",
      "Take {OTHER}'s hand and walk slowly to the nearest window — pretend you're looking at the Vegas skyline together.",
      "Whisper to {OTHER}: one thing you'd want to do in Vegas that you'd never tell the rest of the group.",
      "Tell {OTHER} which Vegas hotel suite you'd want to wake up in together — and why that one.",
    ]},
  },
}

// ─── Level escalation: 4-tier ramp ──────────────────────────
// r1-2: mild only (settle in)
// r3-5: mild/medium mix
// r6-10: medium + spicy (mostly)
// r11+: spicy + wild (the deep end)
function pickLevel(round) {
  if (round <= 2) return 'mild'
  if (round <= 5) {
    const r = Math.random()
    if (r < 0.35) return 'mild'
    return 'medium'
  }
  if (round <= 10) {
    const r = Math.random()
    if (r < 0.15) return 'mild'
    if (r < 0.55) return 'medium'
    return 'spicy'
  }
  // r11+: deep end
  const r = Math.random()
  if (r < 0.1) return 'medium'
  if (r < 0.5) return 'spicy'
  return 'wild'
}

const LEVEL_META = {
  mild: { label: '', color: '', bg: '', border: '' },
  medium: { label: '', color: '', bg: '', border: '' },
  spicy: { label: '', color: '', bg: '', border: '' },
  wild: { label: '', color: '', bg: '', border: '' },
}

// Pronoun resolver — fed gender of OTHER player
function pronoun(gender, kind) {
  // kind: 'subject' (he/she/they), 'object' (him/her/them), 'possessive' (his/her/their)
  if (gender === 'M') return { subject: 'he', object: 'him', possessive: 'his' }[kind]
  if (gender === 'F') return { subject: 'she', object: 'her', possessive: 'her' }[kind]
  return { subject: 'they', object: 'them', possessive: 'their' }[kind]
}

// Fill template placeholders
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

// Merge Telugu extras into base if region includes telugu
function mergedPool(level, type, region) {
  const base = PROMPTS[level][type] || []
  if (region === 'hindi') return base
  // telugu or both — add Telugu extras
  const telugu = (TELUGU_EXTRAS[level] && TELUGU_EXTRAS[level][type]) || []
  return [...base, ...telugu]
}

function getUnused(level, type, used, region, location) {
  // ~30% chance to pull from location pool if available
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

// Default seeded slots
const defaultPlayer = (i) => ({ name: '', gender: 'X' })

export default function TruthOrDare({ onBack }) {
  const [phase, setPhase] = useState('setup') // setup | playing
  const [players, setPlayers] = useState([defaultPlayer(0), defaultPlayer(1)])
  const [region, setRegion] = useState('telugu') // telugu | hindi | both
  const [location, setLocation] = useState('virtual') // virtual | hyderabad | bangalore | mumbai | bayarea | nyc | vegas
  const [currentIdx, setCurrentIdx] = useState(0)
  const [round, setRound] = useState(1)
  const [currentLevel, setCurrentLevel] = useState('mild')
  const [currentType, setCurrentType] = useState(null)
  const [currentRawPrompt, setCurrentRawPrompt] = useState(null)
  const [currentOther, setCurrentOther] = useState(null)
  const [scores, setScores] = useState([0, 0])
  const [skipsRemaining, setSkipsRemaining] = useState([3, 3])
  const [used, setUsed] = useState({})
  const [history, setHistory] = useState([])

  // Load saved
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
        players, region, location, currentIdx, round, scores, skipsRemaining,
        used: serializableUsed, history,
      }))
    } catch(e) {}
  }, [phase, players, region, location, currentIdx, round, scores, skipsRemaining, used, history])

  const addPlayer = () => {
    if (players.length >= 8) return
    setPlayers([...players, defaultPlayer(players.length)])
    setScores([...scores, 0])
    setSkipsRemaining([...skipsRemaining, 3])
  }

  const removePlayer = (i) => {
    if (players.length <= 2) return
    setPlayers(players.filter((_, idx) => idx !== i))
    setScores(scores.filter((_, idx) => idx !== i))
    setSkipsRemaining(skipsRemaining.filter((_, idx) => idx !== i))
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
    setPlayers([defaultPlayer(0), defaultPlayer(1)])
    setCurrentIdx(0); setRound(1)
    setCurrentType(null); setCurrentRawPrompt(null); setCurrentOther(null)
    setScores([0, 0]); setSkipsRemaining([3, 3])
    setUsed({}); setHistory([])
  }

  const pick = (type) => {
    const level = pickLevel(round)
    const { prompt: raw, usedKey } = getUnused(level, type, used, region, location)
    const other = pickRandomOther(players, currentIdx)
    setCurrentLevel(level)
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
      round, player: players[currentIdx].name,
      level: currentLevel, type: currentType,
      prompt: fillPrompt(currentRawPrompt, currentOther), status: 'done',
    }])
    nextTurn()
  }

  const skip = () => {
    if (skipsRemaining[currentIdx] <= 0) return
    setSkipsRemaining(prev => prev.map((s, i) => i === currentIdx ? s - 1 : s))
    setScores(prev => prev.map((s, i) => i === currentIdx ? s - 5 : s))
    setHistory(prev => [...prev, {
      round, player: players[currentIdx].name,
      level: currentLevel, type: currentType,
      prompt: fillPrompt(currentRawPrompt, currentOther), status: 'skipped',
    }])
    nextTurn()
  }

  const nextTurn = () => {
    setCurrentIdx(prev => (prev + 1) % players.length)
    setRound(prev => prev + 1)
    setCurrentType(null)
    setCurrentRawPrompt(null)
    setCurrentOther(null)
  }

  // ─── Setup screen ───────────────────────────────────────────
  if (phase === 'setup') {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="max-w-md mx-auto px-6 pt-12 pb-16">
          <button onClick={onBack} className="text-xs text-muted-foreground hover:text-foreground mb-8 font-mono">
            ← back
          </button>

          <h1 className="text-2xl font-semibold mb-2">Truth or Dare</h1>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            Add 2–8 players. Game starts mild, gets spicier round by round.
            Pick gender so pronouns work properly. Take turns, skip if needed.
          </p>

          {/* Region + Location */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">Vibe</label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full px-2 py-2 bg-card border border-border rounded-md text-sm focus:outline-none focus:border-accent"
              >
                <option value="telugu">Telugu</option>
                <option value="hindi">Hindi</option>
                <option value="both">Both (Telugu + Hindi)</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">Location</label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-2 py-2 bg-card border border-border rounded-md text-sm focus:outline-none focus:border-accent"
              >
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
                  type="text"
                  value={p.name}
                  onChange={(e) => updatePlayer(i, 'name', e.target.value)}
                  placeholder={`Player ${i + 1}`}
                  className="flex-1 px-3 py-2 bg-card border border-border rounded-md text-sm focus:outline-none focus:border-accent"
                  maxLength={20}
                />
                <select
                  value={p.gender}
                  onChange={(e) => updatePlayer(i, 'gender', e.target.value)}
                  className="px-2 py-2 bg-card border border-border rounded-md text-sm focus:outline-none focus:border-accent"
                >
                  <option value="X">—</option>
                  <option value="M">M</option>
                  <option value="F">F</option>
                </select>
                {players.length > 2 && (
                  <button
                    onClick={() => removePlayer(i)}
                    className="px-2 py-2 text-muted-foreground hover:text-rose-500 text-sm"
                    aria-label="remove"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          {players.length < 8 && (
            <button
              onClick={addPlayer}
              className="w-full mb-6 px-3 py-2 border border-dashed border-border rounded-md text-xs text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
            >
              + add player ({players.length}/8)
            </button>
          )}

          <button
            onClick={startGame}
            disabled={!players.every(p => p.name.trim())}
            className="w-full mt-2 px-4 py-2.5 bg-accent text-accent-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Start game
          </button>

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
  const active = players[currentIdx]
  const meta = LEVEL_META[currentLevel]
  const filledPrompt = currentRawPrompt ? fillPrompt(currentRawPrompt, currentOther) : null

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-2xl mx-auto px-6 pt-6 pb-16">
        <div className="flex items-center justify-between mb-6">
          <button onClick={onBack} className="text-xs text-muted-foreground hover:text-foreground font-mono">← back</button>
          <div className="text-xs font-mono text-muted-foreground">Round {round}</div>
          <button onClick={resetGame} className="text-xs text-muted-foreground hover:text-rose-500 font-mono transition-colors">reset</button>
        </div>

        {/* Scoreboard */}
        <div className={`grid gap-2 mb-6 ${players.length <= 2 ? 'grid-cols-2' : players.length <= 4 ? 'grid-cols-2' : 'grid-cols-3'}`}>
          {players.map((p, i) => (
            <div
              key={i}
              className={`px-3 py-2 rounded-md border transition-all ${
                currentIdx === i ? 'border-accent bg-accent/5' : 'border-border bg-card'
              }`}
            >
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

        {/* Active turn card */}
        {!currentType ? (
          <div className="bg-card border border-border rounded-md p-8 text-center">
            <div className="text-xs font-mono text-muted-foreground mb-3">Your turn,</div>
            <h2 className="text-2xl font-semibold mb-8">{active.name}</h2>
            <div className="flex gap-3 justify-center">
              <button onClick={() => pick('truth')} className="flex-1 max-w-[160px] px-6 py-3 bg-accent text-accent-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity">
                Truth
              </button>
              <button onClick={() => pick('dare')} className="flex-1 max-w-[160px] px-6 py-3 bg-foreground text-background rounded-md text-sm font-medium hover:opacity-90 transition-opacity">
                Dare
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-md p-8">
            <div className="text-xs font-mono text-muted-foreground mb-5">
              {active.name} · {currentType.toUpperCase()}
            </div>

            <p className="text-lg leading-relaxed mb-8 min-h-[80px]">
              {filledPrompt}
            </p>

            <div className="flex gap-3">
              <button onClick={completePrompt} className="flex-1 px-4 py-2.5 bg-accent text-accent-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity">
                Done {currentType === 'dare' ? '(+20)' : '(+10)'}
              </button>
              <button
                onClick={skip}
                disabled={skipsRemaining[currentIdx] <= 0}
                className="px-4 py-2.5 border border-border rounded-md text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Skip (−5)
              </button>
            </div>
          </div>
        )}

        {/* History */}
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
                  <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                    {h.type}
                  </span>
                  <span className="text-muted-foreground flex-1 leading-relaxed">{h.prompt}</span>
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
