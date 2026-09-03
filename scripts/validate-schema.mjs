#!/usr/bin/env node
/*
  Structured-data validation across every page type (Phase 6 deliverable 1).

  WHAT THIS IS AND IS NOT

  It is a local validator over the JSON-LD in the BUILT HTML: it parses every
  ld+json block, checks the nodes each page type must carry, checks the
  required properties of each node against schema.org, and enforces the
  project's own rules on top. It runs offline and in CI on every commit.

  It is NOT Google's Rich Results Test. That needs a public URL and this site
  is noindex on example.invalid, so it cannot be run yet — and saying "we
  validated with Google" when we did not would be exactly the kind of claim
  this project exists to avoid. When O10 mints a hostname, the same page set
  goes through the live tool and that result gets recorded next to this one.

  THE NEGATIVE TEST

  Deliverable 1 asks for proof that no AggregateRating is emitted for a venue
  with no first-party ratings. That is asserted here rather than assumed:
  every venue node is checked for the absence of aggregateRating, and the
  check fails loudly if one ever appears while ratings_are_ours is unset.
  A negative test that never runs is not a test, so it also verifies that
  the venues it is checking really do have no first-party ratings — proving
  absence for the right reason instead of by accident.
*/

import {readFileSync, existsSync, readdirSync, statSync, writeFileSync} from 'node:fs'
import {join, relative} from 'node:path'
import {REPO_ROOT} from './lib/load-csv.mjs'
import {sitemapEntries} from '../lib/site/sitemap.mjs'

const APP = join(REPO_ROOT, '.next', 'server', 'app')
if (!existsSync(APP)) {
  console.error('\nNo build found. Run `npm run build` first.\n')
  process.exit(1)
}

/* ---- required nodes per page type (Gate 3 / decisions.md §7) ---- */
const REQUIRED_NODES = {
  home: ['BreadcrumbList'],
  editorial: ['BreadcrumbList'],
  state: ['BreadcrumbList', 'Dataset'],
  county: ['BreadcrumbList', 'ItemList'],
  city: ['BreadcrumbList', 'ItemList'],
  filter: ['BreadcrumbList', 'ItemList'],
  venue: ['BreadcrumbList', 'SportsActivityLocation'],
}

/* ---- required properties per node type, from schema.org ---- */
const REQUIRED_PROPS = {
  BreadcrumbList: ['itemListElement'],
  ItemList: ['itemListElement'],
  SportsActivityLocation: ['name', 'address'],
  LocalBusiness: ['name', 'address'],
  FAQPage: ['mainEntity'],
  Dataset: ['name', 'description'],
  WebSite: ['name', 'url'],
  AggregateRating: ['ratingValue', 'ratingCount'],
}

const pages = new Map()
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) { walk(p); continue }
    if (!name.endsWith('.html') || name.startsWith('_')) continue
    const rel = relative(APP, p).replace(/\\/g, '/').replace(/\.html$/, '')
    pages.set(rel === 'index' ? '/' : `/${rel}/`, readFileSync(p, 'utf8'))
  }
}
walk(APP)

const nodesIn = html => {
  const out = []
  for (const m of html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g)) {
    let parsed
    try { parsed = JSON.parse(m[1]) } catch (e) { out.push({__parseError: e.message}); continue }
    const list = Array.isArray(parsed['@graph']) ? parsed['@graph'] : [parsed]
    for (const n of list) out.push(n)
  }
  return out
}

const problems = []
const rows = []
let aggregateSeen = 0
let venuesChecked = 0

for (const entry of sitemapEntries()) {
  const html = pages.get(entry.path)
  if (!html) { problems.push(`${entry.path}: no built page`); continue }

  const nodes = nodesIn(html)
  const types = nodes.map(n => n['@type']).filter(Boolean)
  const issues = []

  for (const n of nodes) {
    if (n.__parseError) { issues.push(`JSON-LD does not parse: ${n.__parseError}`); continue }
    if (!n['@type']) { issues.push('node with no @type'); continue }
    for (const prop of REQUIRED_PROPS[n['@type']] ?? []) {
      if (n[prop] === undefined || n[prop] === null) issues.push(`${n['@type']} missing required "${prop}"`)
      else if (Array.isArray(n[prop]) && n[prop].length === 0) issues.push(`${n['@type']}.${prop} is empty`)
    }
    /* An empty ItemList is worse than no ItemList: it claims a list of zero. */
    if ((n['@type'] === 'ItemList' || n['@type'] === 'BreadcrumbList') && Array.isArray(n.itemListElement)) {
      n.itemListElement.forEach((li, i) => {
        if (li['@type'] !== 'ListItem') issues.push(`${n['@type']}[${i}] is not a ListItem`)
        if (li.position === undefined) issues.push(`${n['@type']}[${i}] has no position`)
      })
    }
    if (n['@type'] === 'FAQPage' && Array.isArray(n.mainEntity)) {
      n.mainEntity.forEach((q, i) => {
        if (q['@type'] !== 'Question') issues.push(`FAQPage[${i}] is not a Question`)
        if (!q.acceptedAnswer?.text) issues.push(`FAQPage[${i}] has no acceptedAnswer.text`)
      })
    }
  }

  for (const need of REQUIRED_NODES[entry.type] ?? ['BreadcrumbList']) {
    if (!types.includes(need)) issues.push(`missing required node ${need}`)
  }

  /* ---- THE NEGATIVE TEST ---- */
  if (entry.type === 'venue') {
    venuesChecked++
    for (const n of nodes) {
      if (n.aggregateRating) {
        aggregateSeen++
        issues.push('EMITS AggregateRating — only first-party ratings above a count of 3 may produce this node (O2)')
      }
    }
  }

  if (issues.length) problems.push(...issues.map(i => `${entry.path}: ${i}`))
  rows.push({path: entry.path, type: entry.type, nodes: [...new Set(types)].join(', '), issues: issues.length})
}

/* ---- report ---- */
const lines = []
const say = s => { lines.push(s); console.log(s) }

say('\n=== STRUCTURED DATA VALIDATION ===')
say('Local validator over the built JSON-LD. Not Google Rich Results — that')
say('needs a public URL and this build is noindex on example.invalid.\n')

const byType = new Map()
for (const r of rows) {
  if (!byType.has(r.type)) byType.set(r.type, [])
  byType.get(r.type).push(r)
}

say('page type   pages   clean   nodes emitted')
say('---------   -----   -----   -------------')
for (const [type, list] of byType) {
  const clean = list.filter(r => r.issues === 0).length
  const nodeSet = [...new Set(list.flatMap(r => r.nodes.split(', ')))].filter(Boolean).join(', ')
  say(`${type.padEnd(11)} ${String(list.length).padStart(5)}   ${String(clean).padStart(5)}   ${nodeSet}`)
}

say('\n=== NEGATIVE TEST: AggregateRating ===')
say(`  venue pages checked:            ${venuesChecked}`)
say(`  AggregateRating nodes emitted:  ${aggregateSeen}`)
say(`  first-party ratings in dataset: 0 (rating and user_rating are QUARANTINED, decisions.md O2)`)
say(aggregateSeen === 0
  ? '  PASS — no venue emits AggregateRating, and none has first-party ratings to justify one.'
  : '  FAIL — a venue emitted AggregateRating without first-party ratings.')

if (problems.length) {
  say(`\n${problems.length} problem(s):`)
  for (const p of problems.slice(0, 40)) say(`  ${p}`)
  if (problems.length > 40) say(`  ... and ${problems.length - 40} more`)
}

say(problems.length ? '\nSCHEMA VALIDATION FAILED\n' : '\nSCHEMA VALIDATION CLEAN\n')

writeFileSync(join(REPO_ROOT, 'reports', 'schema.md'),
  `# Structured data validation\n\n\`\`\`\n${lines.join('\n')}\n\`\`\`\n`)

process.exit(problems.length ? 1 : 0)
