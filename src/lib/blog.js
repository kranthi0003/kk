// Blog data layer. Posts are either a rich custom component (the dopamine
// flagship, which carries its own interactive visuals) or simple prose made of
// blocks. Categories drive the filter chips on the index. Keep this file as the
// single source of truth — add a post object here and it shows up everywhere.

import { CERT_POSTS } from './certPosts'
import { TIL_POSTS } from './tilPosts'

export const CATEGORIES = [
  { id: 'mind',        label: 'Mind & Dopamine' },
  { id: 'certs',       label: 'Certifications' },
  { id: 'reliability', label: 'Reliability' },
  { id: 'engineering', label: 'Engineering' },
  { id: 'reflections', label: 'Reflections' },
]

export const categoryLabel = (id) => CATEGORIES.find(c => c.id === id)?.label || id

// Knowledge-base topics — technical domains, separate from the editorial
// CATEGORIES above. A post joins a topic either via its own `topics: []` field
// or via SLUG_TOPICS below (so existing posts get tagged without editing them).
// Counts shown in the UI are always computed from real posts — never hard-coded.
export const TOPICS = [
  { id: 'github',      label: 'GitHub & Actions',  icon: '⚙️' },
  { id: 'aws',         label: 'AWS',               icon: '☁️' },
  { id: 'kubernetes',  label: 'Kubernetes',        icon: '☸️' },
  { id: 'terraform',   label: 'Terraform',         icon: '🏗️' },
  { id: 'linux',       label: 'Linux',             icon: '🐧' },
  { id: 'reliability', label: 'Reliability / SRE', icon: '📈' },
  { id: 'ai',          label: 'AI',                icon: '🤖' },
  { id: 'omscs',       label: 'OMSCS',             icon: '🎓' },
]

export const topicLabel = (id) => TOPICS.find(t => t.id === id)?.label || id
export const topicMeta = (id) => TOPICS.find(t => t.id === id) || null

// Map already-written posts to KB topics without touching their source files.
const SLUG_TOPICS = {
  'error-budgets-in-one-minute': ['reliability'],
  'aws-saa': ['aws'],
  'github-foundations': ['github'],
  'github-administration': ['github'],
  'github-actions': ['github'],
}

export const topicsForPost = (post) =>
  (post && (post.topics || SLUG_TOPICS[post.slug])) || []

export const POSTS = [
  {
    slug: 'facts-not-stories',
    title: 'Facts, Not Stories',
    subtitle: 'How to stay emotionally steady when you like someone',
    category: 'reflections',
    date: '2026-07-14',
    readingMins: 7,
    render: 'prose',
    excerpt:
      'The moment your brain turns one unseen message into a catastrophe — and a small, honest framework for keeping your calm from depending on someone else\u2019s screen.',
    body: [
      { type: 'p', text: 'I sent someone I like a message. A day passed, and they still hadn\u2019t seen it. Nothing else happened. No argument. No awkward conversation. No rejection. Just an unseen message sitting there — and I noticed myself getting anxious.' },
      { type: 'p', text: 'A little parade of questions showed up: Are they losing interest? Did I say something wrong? Are they ignoring me? Are they talking to someone else? Did I misread all of this? Objectively, not one of those questions was supported by any evidence. They were just possibilities my brain invented because it hates not knowing.' },
      { type: 'p', text: 'This is a note to myself about what actually helps in that moment — written down so I can come back to it the next time a screen tries to run my mood.' },

      { type: 'h', text: 'The real problem isn\u2019t the message' },
      { type: 'p', text: 'The unseen message isn\u2019t the issue. Uncertainty is. My brain doesn\u2019t really care whether a little grey tick turned blue. Underneath, it\u2019s asking a much older question: \u201cIs everything still okay here?\u201d When it doesn\u2019t get an immediate answer, it writes one itself.' },
      { type: 'p', text: 'We\u2019re wired this way. For most of human history, uncertainty meant danger, so the brain learned to fill gaps fast — and to fill them with the threatening version, just in case. That instinct kept our ancestors alive. It is spectacularly unhelpful when the \u201cthreat\u201d is a friend who hasn\u2019t opened Instagram yet.' },

      { type: 'h', text: 'Facts vs. stories' },
      { type: 'p', text: 'The single healthiest habit I\u2019m trying to build is separating what I know from what I\u2019m inventing. When I actually do it, the list of facts is almost embarrassingly short.' },
      { type: 'p', text: 'The facts: we\u2019ve had easy, pleasant conversations. They seemed comfortable enough to suggest spending time together. And right now, they haven\u2019t seen my message. That\u2019s it. Everything else in my head is a story.' },
      { type: 'p', text: 'The stories all sound like this: Maybe they\u2019re losing interest. Maybe they\u2019re talking to someone else. Maybe they changed their mind. Maybe I came on too strong. Maybe they\u2019re ignoring me. Notice how every one of them begins with the same word.' },
      { type: 'quote', text: '\u201cMaybe\u201d is not evidence.' },

      { type: 'h', text: 'Why one small thing feels so big' },
      { type: 'p', text: 'When we like someone, the emotional brain starts assigning enormous weight to tiny interactions. A slow reply feels like rejection. A missing reaction feels like distance. A \u201cseen\u201d with no response feels personal. None of that scaling is rational — it\u2019s just what attraction does to the volume knob.' },
      { type: 'p', text: 'Meanwhile, people have a hundred ordinary reasons for going quiet:' },
      { type: 'list', items: [
        'Busy at work',
        'Family stuff',
        'Travelling',
        'Phone on silent',
        'Taking a break from social media',
        'Opened the notification, got distracted, forgot',
        'Low battery',
        'Just not in the mood to be online',
      ] },
      { type: 'p', text: 'Almost none of those have anything to do with me. Yet anxiety reaches, every time, for the one explanation that does.' },

      { type: 'h', text: 'Zoom out to the trend' },
      { type: 'p', text: 'The trick that steadies me fastest is to stop staring at a single data point and look at the whole graph instead. On one side: real conversations, genuine comfort, someone who suggested meeting in person. On the other: one unseen message, for one day.' },
      { type: 'p', text: 'If a friend brought me this exact situation, I\u2019d tell them the positive evidence obviously outweighs the negative — it wouldn\u2019t even be close. Anxiety\u2019s only real trick is magnification: it takes the smallest uncertainty and zooms in until it fills the whole screen.' },

      { type: 'h', text: 'The stock-market version' },
      { type: 'p', text: 'Imagine owning Microsoft stock. One afternoon it dips 1%. Does a long-term investor panic and sell? Of course not — they evaluate trends, not hourly ticks. They know the five-minute chart is noise.' },
      { type: 'p', text: 'In relationships I sometimes behave like the person refreshing the price every five minutes. Story views and read receipts become intraday fluctuations, and I let them. But the only thing that actually matters is the long-term trend — and one missing message doesn\u2019t redraw a trend.' },

      { type: 'h', text: 'Real life beats the feed' },
      { type: 'p', text: 'A messaging app is a channel, not the relationship. Picture actually meeting up: two hours over coffee, easy conversation, a few real laughs. Months later, will either of us remember whether a message got opened on a particular Tuesday? Almost certainly not.' },
      { type: 'p', text: 'The things that actually build something between two people are stubbornly offline:' },
      { type: 'list', items: [
        'Time spent together',
        'Shared experiences',
        'Trust',
        'Honest communication',
        'Consistency',
        'Respect',
      ] },
      { type: 'p', text: 'None of that shows up in analytics.' },

      { type: 'h', text: 'Emotional independence' },
      { type: 'p', text: 'The goal I keep coming back to is simple: don\u2019t hand someone else\u2019s online activity the keys to my mood. Right now the pattern is reactive — they reply and I feel great; they don\u2019t and I feel anxious. The healthier version is quieter. They reply: nice. They don\u2019t: my day carries on exactly as it was.' },
      { type: 'p', text: 'This isn\u2019t about going cold or pretending not to care. It\u2019s about letting another person keep their own schedule without it running mine. And there\u2019s a small irony worth remembering: emotional independence is one of the most attractive qualities a person can have. The calm is not just healthier — it\u2019s more appealing.' },

      { type: 'h', text: 'Ask better questions' },
      { type: 'p', text: 'When the spiral starts, I try to swap the question. Instead of \u201cWhy haven\u2019t they replied?\u201d — which only invites more stories — I ask \u201cWhat do I actually know?\u201d The honest answer is usually: almost nothing. Then: \u201cWhat\u2019s the most ordinary explanation?\u201d The honest answer is usually: they\u2019re busy. People are wonderfully boring most of the time, and the simplest explanation is almost always the correct one.' },

      { type: 'h', text: 'Get comfortable with \u201cI don\u2019t know yet\u201d' },
      { type: 'p', text: 'Maybe the most valuable skill of all is tolerating an open question without slamming it shut. Not everything needs an answer this minute. Sometimes the healthiest, most mature response to a silence is simply: I don\u2019t know yet. No assumptions. No conclusions. Just waiting for more information, like an adult.' },

      { type: 'h', text: 'Interest vs. anxiety' },
      { type: 'quote', text: 'Interest says, \u201cI hope this works.\u201d Anxiety says, \u201cI need constant reassurance that it\u2019s working.\u201d' },
      { type: 'p', text: 'Those are very different postures. Healthy attraction leaves room for the other person to have a whole life I\u2019m not part of. Anxiety tries to close every gap in communication because silence feels unbearable — and in doing so, it quietly creates the exact pressure that pushes people away.' },

      { type: 'h', text: 'Don\u2019t feed it' },
      { type: 'p', text: 'When the anxiety spikes, there\u2019s always a tempting move: send another message, double-text, check if they\u2019re online, re-read the last exchange for hidden meaning, ask friends for reassurance. Every one of those brings about ten minutes of relief, and then the discomfort comes right back, because the thing underneath — the intolerance of not knowing — never got touched. The way out isn\u2019t another hit of certainty. It\u2019s learning to sit with the uncertainty and not act on it.' },

      { type: 'h', text: 'A three-question filter' },
      { type: 'p', text: 'When anxiety shows up, I run it through three questions before I do anything:' },
      { type: 'steps', items: [
        { title: 'What do I actually know?', text: 'Separate the handful of facts from the pile of assumptions.' },
        { title: 'What\u2019s the most ordinary explanation?', text: 'Skip the dramatic story. It\u2019s usually \u201cthey\u2019re busy.\u201d' },
        { title: 'Will this matter in six months?', text: 'The unseen message won\u2019t. The quality of the relationship will.' },
      ] },

      { type: 'h', text: 'The person I\u2019m trying to be' },
      { type: 'p', text: 'I don\u2019t want to be someone whose emotional stability rises and falls with read receipts and story views. I\u2019d rather be someone who is:' },
      { type: 'list', items: [
        'Confident without being arrogant',
        'Interested without becoming obsessive',
        'Emotionally available without becoming dependent',
        'Willing to give people space',
        'Inclined to trust actions over assumptions',
        'More interested in real conversations than digital signals',
      ] },
      { type: 'p', text: 'Because if something has genuine potential, it won\u2019t survive on how quickly someone taps \u201cseen.\u201d It survives on consistently enjoying each other\u2019s company, communicating honestly, and building trust over time.' },

      { type: 'note', text: 'This started as a note to myself. If it\u2019s useful to you too, take the framework and leave the rest.' },

      { type: 'quote', text: 'Don\u2019t let a 24-hour delay outweigh a one-hour coffee invitation.' },
      { type: 'p', text: 'Focus on the trend, not the notification. Build confidence from reality, not assumptions. And remember that the healthiest connections are made of shared experiences in real life — not of how fast someone taps a screen.' },
    ],
  },
  {
    slug: 'cheap-dopamine',
    title: 'Phone. Porn. Sugar.',
    subtitle: 'The science of cheap dopamine',
    category: 'mind',
    date: '2026-06-27',
    readingMins: 7,
    featured: true,
    render: 'dopamine', // rich custom component with interactive visuals
    excerpt:
      'Three habits that feel unrelated, run by one hijacked circuit. A calm, honest breakdown of how it works in the brain — and how it lets go.',
  },
  {
    slug: 'its-always-her',
    title: "It's Always Her",
    subtitle: 'A ten-year letter to the girl who walked in through a quiet door',
    category: 'reflections',
    date: '2026-07-11',
    readingMins: 60,
    render: 'letter', // book-style reader (cover -> contents -> chapters)
    excerpt:
      'A novel in eleven chapters. A one-sided love that lasted ten years — from a quiet classroom door in the eleventh grade to an ocean between Vizag and Germany.',
  },
  {
    slug: 'error-budgets-in-one-minute',
    title: 'Error budgets, in one minute',
    subtitle: 'Why the goal was never zero failures',
    category: 'reliability',
    date: '2026-06-20',
    readingMins: 2,
    render: 'prose',
    excerpt:
      'A 100% reliability target is a trap. Here is the small idea that lets teams move fast and stay stable at the same time.',
    body: [
      { type: 'p', text: 'Chasing 100% uptime sounds responsible. In practice it is the fastest way to freeze a team — because the only way to never break anything is to never ship anything.' },
      { type: 'h', text: 'The reframe' },
      { type: 'p', text: 'An error budget flips the question. Instead of "how do we avoid all failure?", you ask "how much failure can we afford?" Pick a target — say 99.9% availability — and the leftover 0.1% is a budget you are allowed to spend.' },
      { type: 'p', text: 'Inside that budget, you ship boldly: experiment, deploy on a Friday, take the risk. Burn through it, and the same number tells you, without drama or politics, that it is time to slow down and shore things up.' },
      { type: 'quote', text: 'Reliability stops being a feeling and becomes a number everyone can point at.' },
      { type: 'h', text: 'Why it works' },
      { type: 'p', text: 'It turns an argument into arithmetic. Product wants velocity, ops wants stability, and the error budget is the shared currency they both spend. Nobody has to win — the budget decides.' },
      { type: 'p', text: 'The lesson under the lesson: perfect is not the target. The right amount of unreliability, chosen on purpose, is.' },
    ],
  },
  ...CERT_POSTS,
  ...TIL_POSTS,
]

export const publishedPosts = () =>
  [...POSTS].sort((a, b) => new Date(b.date) - new Date(a.date))

export const getPost = (slug) => POSTS.find(p => p.slug === slug) || null

export const postsByCategory = (catId) =>
  catId === 'all' ? publishedPosts() : publishedPosts().filter(p => p.category === catId)

export const featuredPost = () => POSTS.find(p => p.featured) || POSTS[0]

// Knowledge-base helpers (real counts, computed from actual posts).
export const postsByTopic = (topicId) =>
  publishedPosts().filter(p => topicsForPost(p).includes(topicId))
export const topicCount = (topicId) => postsByTopic(topicId).length
export const tilPosts = () => publishedPosts().filter(p => p.til)
export const notePosts = () => publishedPosts().filter(p => topicsForPost(p).length > 0)

export const formatDate = (iso) => {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  } catch { return iso }
}
