#!/usr/bin/env node
/*
  Phase 4 deliverable 5: prove the internal linking actually holds.

  Reads the BUILT HTML out of .next/server/app/ — not the source, not the
  link graph, the files a visitor would receive — and answers four questions:

    1. Is every published page reachable within three clicks of the homepage?
    2. Which published pages are orphans, linked from nowhere?
    3. Does any link point at a page that does not exist?
    4. Does the sitemap agree with the pages that actually shipped?

  WHY IT READS THE BUILT FILES

  Asking lib/site/links.mjs whether the linking is correct would be asking
  the accused. The graph says what SHOULD be linked; this reads what WAS
  rendered. A page that forgot to render its links, a href built by hand
  somewhere, a route that 404s despite being in the graph — all invisible
  from inside the graph, all visible here.

  Question 3 is the one that matters most. decisions.md §3 exists because
  Pickleheads serves hard 404s on pages worth 1,475 and 463 visits a month.
  This is the check that stops the same thing happening here, and it also
  covers the brief's "zero links point at pending rows": a pending venue has
  no page, so a link to one is a dead link and shows up as such.
*/

import {readFileSync, existsSync, readdirSync, statSync} from 'node:fs'
import {join, relative} from 'node:path'
import {REPO_ROOT} from './lib/load-csv.mjs'
import {sitemapEntries} from '../lib/site/sitemap.mjs'

const APP = join(REPO_ROOT, '.next', 'server', 'app')
if (!existsSync(APP)) {
  console.error('\nNo build found. Run `npm run build` first.\n')
  process.exit(1)
}

/* ---- 1. Collect every built page, keyed by its URL path. ---- */

const pages = new Map() // "/pickleball/us/wa/seattle/" -> html

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) { walk(p); continue }
    if (!name.endsWith('.html')) continue
    if (name.startsWith('_')) continue // framework pages

    const rel = relative(APP, p).replace(/\\/g, '/').replace(/\.html$/, '')
    const path = rel === 'index' ? '/' : `/${rel}/`
    pages.set(path, readFileSync(p, 'utf8'))
  }
}
walk(APP)

/* ---- 2. Extract internal links from each page. ---- */

const normalise = href => {
  if (!href) return null
  if (/^(https?:)?\/\//i.test(href)) return null // external
  if (href.startsWith('#') || href.startsWith('mailto:')) return null
  const clean = href.split('#')[0].split('?')[0]
  if (!clean.startsWith('/')) return null
  return clean.endsWith('/') || /\.[a-z0-9]+$/i.test(clean) ? clean : `${clean}/`
}

const linksFrom = new Map()
for (const [path, html] of pages) {
  const set = new Set()
  for (const m of html.matchAll(/<a\b[^>]*\bhref=["']([^"']+)["']/gi)) {
    const n = normalise(m[1])
    if (n) set.add(n)
  }
  linksFrom.set(path, set)
}

/* ---- 3. BFS from the homepage. ---- */

const depth = new Map([['/', 0]])
const queue = ['/']
while (queue.length) {
  const cur = queue.shift()
  for (const next of linksFrom.get(cur) ?? []) {
    if (!pages.has(next)) continue
    if (depth.has(next)) continue
    depth.set(next, depth.get(cur) + 1)
    queue.push(next)
  }
}

/* ---- 4. The answers. ---- */

/*
  Pages that are built on purpose and deliberately absent from the sitemap:
  internal tools. They are excluded from the "extra page" and orphan checks
  because both would be false positives — but the exclusion is not free.
  An internal page must actually BE internal, so each one is asserted to
  carry noindex. A tool that is merely unlinked is one stray link away from
  being public.
*/
const INTERNAL_PREFIX = '/internal/'
const internal = [...pages.keys()].filter(p => p.startsWith(INTERNAL_PREFIX))
const leaky = internal.filter(p => !/name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(pages.get(p)))



const published = sitemapEntries()
const publishedPaths = new Set(published.map(e => e.path))

const unreachable = [...publishedPaths].filter(p => !depth.has(p))
const tooDeep = [...publishedPaths].filter(p => depth.has(p) && depth.get(p) > 3)

const linkedFromSomewhere = new Set([...linksFrom.values()].flatMap(s => [...s]))
const orphans = [...publishedPaths].filter(p => p !== '/' && !linkedFromSomewhere.has(p))
/* An internal page linked from a public one is a leak, not a feature. */
const internalLinked = internal.filter(p => linkedFromSomewhere.has(p))

const dead = []
for (const [from, set] of linksFrom) {
  for (const href of set) {
    if (!pages.has(href)) dead.push({from, href})
  }
}

const builtNotInSitemap = [...pages.keys()]
  .filter(p => !publishedPaths.has(p) && !p.startsWith(INTERNAL_PREFIX))
const sitemapNotBuilt = [...publishedPaths].filter(p => !pages.has(p))

/* ---- 5. Report. ---- */

const line = (label, n, ok) => `${ok ? 'PASS' : 'FAIL'}  ${label.padEnd(46)} ${n}`
const problems = []

console.log(`\n=== CRAWL REPORT ===`)
console.log(`built pages:      ${pages.size}`)
console.log(`published pages:  ${publishedPaths.size}\n`)

console.log(line('Every published page reachable from home', unreachable.length ? `${unreachable.length} unreachable` : 'all', unreachable.length === 0))
console.log(line('Reachable within three clicks', tooDeep.length ? `${tooDeep.length} deeper than 3` : 'all', tooDeep.length === 0))
console.log(line('No orphans', orphans.length ? `${orphans.length} orphaned` : 'none', orphans.length === 0))
console.log(line('No link points at a page that does not exist', dead.length ? `${dead.length} dead link(s)` : 'none', dead.length === 0))
console.log(line('Internal pages carry noindex', leaky.length ? `${leaky.length} leaking` : `${internal.length} internal, all noindex`, leaky.length === 0))
console.log(line('No public page links to an internal page', internalLinked.length ? `${internalLinked.length} linked` : 'none', internalLinked.length === 0))
console.log(line('Sitemap matches the pages that shipped', (builtNotInSitemap.length + sitemapNotBuilt.length) ? `${builtNotInSitemap.length} extra, ${sitemapNotBuilt.length} missing` : 'exact', builtNotInSitemap.length + sitemapNotBuilt.length === 0))

if (unreachable.length) problems.push(['Unreachable', unreachable])
if (tooDeep.length) problems.push(['Deeper than three clicks', tooDeep.map(p => `${p} (${depth.get(p)})`)])
if (orphans.length) problems.push(['Orphans', orphans])
if (dead.length) problems.push(['Dead links', dead.map(d => `${d.from} -> ${d.href}`)])
if (leaky.length) problems.push(['Internal pages missing noindex', leaky])
if (internalLinked.length) problems.push(['Internal pages linked from the public site', internalLinked])
if (builtNotInSitemap.length) problems.push(['Built but not in the sitemap', builtNotInSitemap])
if (sitemapNotBuilt.length) problems.push(['In the sitemap but not built', sitemapNotBuilt])

for (const [title, items] of problems) {
  console.log(`\n${title}:`)
  for (const i of items.slice(0, 25)) console.log(`  ${i}`)
  if (items.length > 25) console.log(`  ... and ${items.length - 25} more`)
}

console.log('\nClick depth from the homepage:')
const byDepth = new Map()
for (const p of publishedPaths) {
  const d = depth.get(p)
  const k = d === undefined ? 'unreachable' : d
  byDepth.set(k, (byDepth.get(k) ?? 0) + 1)
}
for (const k of [...byDepth.keys()].sort((a, b) => String(a).localeCompare(String(b)))) {
  console.log(`  ${String(k).padStart(11)}: ${byDepth.get(k)} page(s)`)
}

const pass = !unreachable.length && !tooDeep.length && !orphans.length && !dead.length &&
  !builtNotInSitemap.length && !sitemapNotBuilt.length && !leaky.length && !internalLinked.length
console.log(pass ? '\nCRAWL OK\n' : '\nCRAWL FAILED\n')
process.exit(pass ? 0 : 1)
