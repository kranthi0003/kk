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
