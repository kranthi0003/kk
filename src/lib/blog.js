// Blog data layer. Posts are either a rich custom component (the dopamine
// flagship, which carries its own interactive visuals) or simple prose made of
// blocks. Categories drive the filter chips on the index. Keep this file as the
// single source of truth — add a post object here and it shows up everywhere.

import { CERT_POSTS } from './certPosts'

export const CATEGORIES = [
  { id: 'mind',        label: 'Mind & Dopamine' },
  { id: 'certs',       label: 'Certifications' },
  { id: 'reliability', label: 'Reliability' },
  { id: 'engineering', label: 'Engineering' },
  { id: 'reflections', label: 'Reflections' },
]

export const categoryLabel = (id) => CATEGORIES.find(c => c.id === id)?.label || id

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
]

export const publishedPosts = () =>
  [...POSTS].sort((a, b) => new Date(b.date) - new Date(a.date))

export const getPost = (slug) => POSTS.find(p => p.slug === slug) || null

export const postsByCategory = (catId) =>
  catId === 'all' ? publishedPosts() : publishedPosts().filter(p => p.category === catId)

export const featuredPost = () => POSTS.find(p => p.featured) || POSTS[0]

export const formatDate = (iso) => {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  } catch { return iso }
}
