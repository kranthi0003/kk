// Build-time feed generator. Reads the blog data (the single source of truth in
// src/lib/blog.js) and emits an RSS 2.0 feed and a JSON Feed into dist/, so the
// blog is subscribable and discoverable. Runs from the `postbuild` npm script,
// after `vite build`, so dist/ already exists.
//
// The blog modules use extensionless ESM imports (resolved by Vite, not by raw
// Node), so we bundle src/lib/blog.js with esbuild first, then import the
// self-contained result.

import { build } from 'esbuild'
import { mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const SITE = 'https://kranthikiran.com'
const DIST = join(ROOT, 'dist')

const esc = (s = '') =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')

const permalink = (slug) => `${SITE}/#/blog/${slug}`

async function loadBlog() {
  // Bundle the blog data (+ its relative imports) into a single ESM file we can
  // import from Node.
  const result = await build({
    entryPoints: [join(ROOT, 'src/lib/blog.js')],
    bundle: true,
    format: 'esm',
    platform: 'node',
    write: false,
    logLevel: 'silent',
  })
  const tmp = join(tmpdir(), `blog-feed-${Date.now()}.mjs`)
  writeFileSync(tmp, result.outputFiles[0].text)
  return import(pathToFileURL(tmp).href)
}

function toRSS(posts, blog) {
  const now = new Date().toUTCString()
  const items = posts.map((p) => {
    const date = p.date ? new Date(p.date) : null
    const pub = date && !isNaN(date) ? date.toUTCString() : now
    const desc = p.excerpt || p.subtitle || ''
    const cat = blog.categoryLabel ? blog.categoryLabel(p.category) : p.category
    return `    <item>
      <title>${esc(p.title)}</title>
      <link>${esc(permalink(p.slug))}</link>
      <guid isPermaLink="false">kranthikiran:post:${esc(p.slug)}</guid>
      <pubDate>${pub}</pubDate>
      ${cat ? `<category>${esc(cat)}</category>` : ''}
      <description>${esc(desc)}</description>
    </item>`
  }).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Kranthi Kiran — Blog</title>
    <link>${SITE}/#/blog</link>
    <atom:link href="${SITE}/feed.xml" rel="self" type="application/rss+xml" />
    <description>Engineering, reliability, and reflections — from kranthikiran.com</description>
    <language>en</language>
    <lastBuildDate>${now}</lastBuildDate>
${items}
  </channel>
</rss>
`
}

function toJSONFeed(posts, blog) {
  return JSON.stringify({
    version: 'https://jsonfeed.org/version/1.1',
    title: 'Kranthi Kiran — Blog',
    home_page_url: `${SITE}/#/blog`,
    feed_url: `${SITE}/feed.json`,
    description: 'Engineering, reliability, and reflections — from kranthikiran.com',
    language: 'en',
    items: posts.map((p) => {
      const date = p.date ? new Date(p.date) : null
      const iso = date && !isNaN(date) ? date.toISOString() : new Date().toISOString()
      const cat = blog.categoryLabel ? blog.categoryLabel(p.category) : p.category
      return {
        id: `kranthikiran:post:${p.slug}`,
        url: permalink(p.slug),
        title: p.title,
        summary: p.excerpt || p.subtitle || '',
        date_published: iso,
        tags: cat ? [cat] : [],
      }
    }),
  }, null, 2) + '\n'
}

async function main() {
  const blog = await loadBlog()
  const posts = typeof blog.publishedPosts === 'function'
    ? blog.publishedPosts()
    : (blog.POSTS || [])
  if (!posts.length) throw new Error('gen-feed: no posts found')

  mkdirSync(DIST, { recursive: true })
  writeFileSync(join(DIST, 'feed.xml'), toRSS(posts, blog))
  writeFileSync(join(DIST, 'feed.json'), toJSONFeed(posts, blog))
  console.log(`gen-feed: wrote feed.xml + feed.json (${posts.length} posts)`)
}

main().catch((err) => {
  console.error('gen-feed failed:', err)
  process.exit(1)
})
