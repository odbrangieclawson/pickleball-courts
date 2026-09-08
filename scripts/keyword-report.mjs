#!/usr/bin/env node
/*
  THE KEYWORD REPORT.

  Every published URL with the keyword it targets, expanded from the
  templates in keyword-map.json against the pages that actually shipped.

  Why it is generated rather than written: keyword-map.json holds patterns
  ({city_name}, {state_abbr}), and Rule 9 makes the pattern the contract, not
  the instance. The instance list changes with every city published, so a
  hand-kept list would be wrong within a batch. This reads the same link
  graph the nav and sitemap read, so a keyword can never be reported for a
  page that did not publish, and no published page can be missing one.

  Editorial pages carry no entry in keyword-map.json, because they are
  outside the locked URL patterns of decisions.md section 1. Their targets
  are declared here so the report is complete, and they are marked as such.

  Writes reports/keywords.md and reports/keywords.csv. Run after a build.

    node scripts/keyword-report.mjs
*/
import {writeFileSync} from 'node:fs'
import {join} from 'node:path'
import {REPO_ROOT} from './lib/load-csv.mjs'
import {readFileSync} from 'node:fs'
import * as data from '../lib/site/data.mjs'
import {buildLinkGraph, statePath, countyPath, cityPath, venuePath, filterPath} from '../lib/site/links.mjs'
import {statePagePublishes, venuePagePublishes} from '../lib/site/views.mjs'
import {qualifyingFilters} from '../lib/page/city-page.mjs'

const map = JSON.parse(readFileSync(join(REPO_ROOT, 'keyword-map.json'), 'utf8'))
const byType = Object.fromEntries(map.page_types.map(p => [p.page_type, p]))

const cities = data.publishedCities().map(c => ({...c, ...data.city(c.state, c.slug)}))
const graph = buildLinkGraph(cities.flatMap(c => c.venues))

const fill = (tpl, s) => tpl
  .replaceAll('{state_name}', s.state_name ?? '')
  .replaceAll('{state_abbr}', s.state_abbr ?? '')
  .replaceAll('{county_name}', s.county_name ?? '')
  .replaceAll('{city_name}', s.city_name ?? '')
  .replaceAll('{venue_name}', s.venue_name ?? '')

const rows = []
const add = (url, type, slots) => {
  const t = byType[type]
  if (!t) throw new Error(`keyword-map.json has no page_type "${type}"`)
  rows.push({
    url,
    type,
    primary: fill(t.primary, slots),
    secondary: (t.secondary ?? []).map(x => fill(x, slots)),
  })
}

/* States, in the same order the sitemap builds them. */
for (const [st] of graph.publishedStates) {
  if (!statePagePublishes(st)) continue
  add(statePath(st), 'state', {state_name: data.stateName(st), state_abbr: st})
}

/* Counties. */
for (const c of graph.publishedCounties.values()) {
  add(countyPath(c.state, c.county), 'county',
    {county_name: c.county, state_abbr: c.state, state_name: data.stateName(c.state)})
}

/* Cities, their qualifying filter pages, and their venues. */
for (const c of cities) {
  const slots = {city_name: c.city, state_abbr: c.state, state_name: data.stateName(c.state)}
  add(cityPath(c.state, c.slug), 'city', slots)

  for (const f of Object.keys(qualifyingFilters(c.venues))) {
    add(filterPath(c.state, c.slug, f), `city_filter_${f}`, slots)
  }

  for (const v of c.venues) {
    if (!venuePagePublishes(c.state, c.slug, v.slug)) continue
    add(venuePath(c.state, c.slug, v.slug), 'venue', {...slots, venue_name: v.name})
  }
}

/*
  Editorial pages. Not in keyword-map.json and not under a locked pattern,
  so their targets are declared here rather than derived. Volumes are the
  US figures read from Ahrefs on 2026-09-08 and are a snapshot, not a
  promise; they are in the report because an SEO reader will ask.
*/
const EDITORIAL = [
  {url: '/', primary: 'pickleball courts near me', secondary: ['pickleball courts', 'find pickleball courts', 'pickleball court finder'], note: 'Home. Head term of the site.'},
  {url: '/how-to-play-pickleball/', primary: 'how to play pickleball', secondary: ['pickleball rules', 'what is pickleball', 'pickleball for beginners', 'pickleball tips'], note: 'Guide. Targets the cluster under the head term "pickleball", which is not itself a target.'},
  {url: '/search/', primary: null, secondary: [], note: 'Search form. noindex, no keyword target.'},
  {url: '/about/', primary: null, secondary: [], note: 'Trust page. No keyword target by design.'},
  {url: '/how-we-verify/', primary: null, secondary: [], note: 'Trust page. No keyword target by design.'},
  {url: '/add-your-court/', primary: null, secondary: [], note: 'Operator page. No keyword target by design.'},
]

/* Rule 9: the build fails on a collision, so the report proves there is none. */
const seen = new Map()
const collisions = []
for (const r of rows) {
  const k = r.primary.toLowerCase()
  if (seen.has(k)) collisions.push(`${r.primary}\n    ${seen.get(k)}\n    ${r.url}`)
  else seen.set(k, r.url)
}

const byTypeCount = {}
for (const r of rows) byTypeCount[r.type] = (byTypeCount[r.type] ?? 0) + 1

const esc = s => `"${String(s).replaceAll('"', '""')}"`
const csv = ['url,page_type,primary_keyword,secondary_keywords']
for (const r of rows) csv.push([esc(r.url), esc(r.type), esc(r.primary), esc(r.secondary.join(' | '))].join(','))
for (const e of EDITORIAL) csv.push([esc(e.url), esc('editorial'), esc(e.primary ?? ''), esc(e.secondary.join(' | '))].join(','))
writeFileSync(join(REPO_ROOT, 'reports', 'keywords.csv'), csv.join('\n') + '\n')

const md = []
md.push('# Keyword report')
md.push('')
md.push('Generated by `scripts/keyword-report.mjs` from `keyword-map.json` and the')
md.push('published link graph. One primary keyword per URL is Rule 9, and the build')
md.push('fails on a collision.')
md.push('')
md.push(`**${rows.length} directory pages** with a templated keyword, plus ${EDITORIAL.length} editorial pages.`)
md.push('')
md.push('## By page type')
md.push('')
md.push('| Page type | Pages | Primary keyword pattern |')
md.push('| --- | --- | --- |')
for (const [t, n] of Object.entries(byTypeCount)) md.push(`| ${t} | ${n} | \`${byType[t].primary}\` |`)
md.push('')
md.push('## Collisions')
md.push('')
md.push(collisions.length ? collisions.map(c => `- ${c}`).join('\n') : 'None. Every primary keyword is unique across the site.')
md.push('')
md.push('## Editorial pages')
md.push('')
md.push('| URL | Primary | Secondary | Note |')
md.push('| --- | --- | --- | --- |')
for (const e of EDITORIAL) md.push(`| ${e.url} | ${e.primary ?? 'none'} | ${e.secondary.join(', ') || 'none'} | ${e.note} |`)
md.push('')
md.push('## Every directory page')
md.push('')
md.push('| URL | Type | Primary keyword |')
md.push('| --- | --- | --- |')
for (const r of rows) md.push(`| ${r.url} | ${r.type} | ${r.primary} |`)
md.push('')
md.push('Secondary keywords are in `reports/keywords.csv`, one row per URL.')
md.push('')
writeFileSync(join(REPO_ROOT, 'reports', 'keywords.md'), md.join('\n'))

console.log(`\n=== KEYWORD REPORT ===\n`)
for (const [t, n] of Object.entries(byTypeCount)) console.log(`  ${t.padEnd(20)} ${String(n).padStart(4)}`)
console.log(`  ${'editorial'.padEnd(20)} ${String(EDITORIAL.length).padStart(4)}`)
console.log(`\n  ${rows.length} directory keywords, ${seen.size} unique primaries`)
console.log(collisions.length ? `  COLLISIONS: ${collisions.length}` : '  No collisions.')
console.log(`\nWrote reports/keywords.md and reports/keywords.csv`)
