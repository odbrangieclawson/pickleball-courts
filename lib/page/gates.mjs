/*
  The six page gates, as one checkable function.

  Every page runs this before it renders. checkPageGates() returns a verdict
  per gate; publishing requires all six. Gate 1 alone stops everything today.

  This is where Rule 8 becomes mechanical: no page can be built for a city
  with fewer than 3 VERIFIED venues, and "verified" has exactly one
  definition, in lib/data/schema.mjs, used here and nowhere redefined.
*/

import {isCount} from '../data/counts.mjs'
import {checkBand} from './words.mjs'
import {checkEditorial, countSpecificSentences} from './editorial.mjs'

export const MIN_VERIFIED_VENUES = 3

/**
 * @param {object} o
 * @param {'city'|'venue'|'county'|'filter'|'state'} o.pageType
 * @param {object} o.counts        the object returned by getCounts()
 * @param {string} [o.html]        rendered HTML, for gates 2 and 4
 * @param {object} [o.editorial]   the per-city editorial notes
 * @param {object[]} [o.schema]    the JSON-LD graph the page will emit
 * @param {object[]} [o.venues]    the verified venues on the page
 * @param {Map} [o.seenEditorial]  editorial text used on other cities
 */
export function checkPageGates({pageType, counts, html = null, editorial = null, schema = [], venues = [], seenEditorial = new Map()}) {
  const g = {}

  /* ---- Gate 1: data threshold ---- */
  if (!isCount(counts?.venues)) {
    g.gate1 = {pass: false, detail: 'counts.venues is not a Count from getCounts()'}
  } else {
    const n = counts.venues.value
    g.gate1 = {
      pass: n >= MIN_VERIFIED_VENUES,
      detail: n >= MIN_VERIFIED_VENUES
        ? `${n} verified venues (needs ${MIN_VERIFIED_VENUES})`
        : `ONLY ${n} verified venue(s). Rule 8 requires ${MIN_VERIFIED_VENUES}. This page must not exist.`,
    }
  }

  /* ---- Gate 2: JavaScript-off render ---- */
  if (html === null) {
    g.gate2 = {pass: false, detail: 'not rendered yet — nothing to check'}
  } else {
    const noScript = html.replace(/<script[\s\S]*?<\/script>/gi, ' ')
    const problems = []
    if (!/<h1[\s>]/i.test(noScript)) problems.push('no <h1> in raw HTML')
    if (!/<a\s[^>]*href=/i.test(noScript)) problems.push('no links in raw HTML')
    const text = noScript.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    if (text.length < 500) problems.push(`only ${text.length} chars of text without JS`)
    if (!/application\/ld\+json/i.test(html)) problems.push('no JSON-LD')
    g.gate2 = {pass: problems.length === 0, detail: problems.length ? problems.join('; ') : 'content, links and schema all present without JS'}
  }

  /* ---- Gate 3: schema completeness ---- */
  {
    const types = new Set(schema.flatMap(s => (s['@graph'] ?? [s]).map(n => n?.['@type'])))
    const need = {
      city: ['BreadcrumbList', 'ItemList'],
      filter: ['BreadcrumbList', 'ItemList'],
      county: ['BreadcrumbList', 'ItemList'],
      venue: ['BreadcrumbList', 'SportsActivityLocation'],
      state: ['BreadcrumbList', 'Dataset'],
    }[pageType] ?? ['BreadcrumbList']
    const missing = need.filter(t => !types.has(t))
    // AggregateRating only where real - its presence is checked, not required.
    const bogusRating = schema.flatMap(s => (s['@graph'] ?? [s]))
      .some(n => n?.aggregateRating && !(n.aggregateRating.ratingCount > 0))
    if (bogusRating) missing.push('AggregateRating present with no real ratings')
    g.gate3 = {pass: missing.length === 0, detail: missing.length ? `missing/invalid: ${missing.join(', ')}` : `has ${[...types].join(', ')}`}
  }

  /* ---- Gate 4: word band + three specific sentences ---- */
  {
    const problems = []
    let words = null
    if (html === null) problems.push('not rendered yet')
    else {
      const band = checkBand(pageType, html)
      words = band.words
      if (!band.pass) problems.push(band.verdict)
    }
    const ed = checkEditorial(editorial, seenEditorial)
    if (!ed.pass) problems.push(...ed.problems)
    const specific = countSpecificSentences(editorial)
    if (specific < 3) problems.push(`only ${specific} specific sentence(s), Rule 3 requires 3`)
    g.gate4 = {pass: problems.length === 0, words, detail: problems.length ? problems.join('; ') : `word band OK, ${specific} specific sentences`}
  }

  /* ---- Gate 5: count consistency ---- */
  {
    const problems = []
    for (const [k, c] of Object.entries(counts ?? {})) {
      if (!isCount(c)) { problems.push(`${k} is not a Count`); continue }
      if (k !== 'venues_unverified' && c.denominator !== counts.venues.value) {
        problems.push(`${k} denominator ${c.denominator} != verified venue count ${counts.venues.value}`)
      }
    }
    if (html !== null && isCount(counts?.venues)) {
      // Every number in an h1 or title must be one getCounts produced.
      const produced = new Set(Object.values(counts).filter(isCount).flatMap(c => [String(c.value), String(c.denominator), String(c.known)]))
      const heads = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map(m => m[1])
      const titleM = html.match(/<title>([\s\S]*?)<\/title>/i)
      if (titleM) heads.push(titleM[1])
      for (const h of heads) {
        for (const num of (h.match(/\b\d{1,6}\b/g) ?? [])) {
          if (!produced.has(num)) problems.push(`"${num}" appears in a title or H1 but was not produced by getCounts()`)
        }
      }
    }
    g.gate5 = {pass: problems.length === 0, detail: problems.length ? problems.join('; ') : 'every number traces to getCounts()'}
  }

  /* ---- Gate 6: source and freshness ---- */
  {
    const problems = []
    /*
      A gate with nothing to check has not passed, it has abstained. An
      empty venue list would otherwise sail through and put a green PASS
      next to a page that cannot exist - the kind of vacuously true signal
      that makes a dashboard worse than no dashboard.
    */
    if (!venues.length) {
      problems.push('no venues to check — this is an abstention, not a pass')
    }
    for (const v of venues) {
      if (!v.source_url) problems.push(`${v.slug}: no source_url`)
      else if (/courtsource\.us/i.test(v.source_url)) problems.push(`${v.slug}: source is a competitor directory`)
      if (!v.date_checked) problems.push(`${v.slug}: no date_checked`)
    }
    if (html !== null && venues.length && !/Checked/i.test(html)) {
      problems.push('no visible checked-date on the page')
    }
    g.gate6 = {pass: problems.length === 0, detail: problems.length ? problems.slice(0, 5).join('; ') : `${venues.length} venues all carry source and date`}
  }

  const allPass = Object.values(g).every(x => x.pass)
  return {...g, allPass, publishable: allPass}
}

/** Render the six-line pass/fail block. */
export function formatGateReport(r) {
  const names = {
    gate1: 'Gate 1  Data threshold (3+ verified venues)',
    gate2: 'Gate 2  JavaScript-off render',
    gate3: 'Gate 3  Schema completeness',
    gate4: 'Gate 4  Word band + 3 specific sentences',
    gate5: 'Gate 5  Count consistency',
    gate6: 'Gate 6  Source and freshness',
  }
  const lines = Object.entries(names).map(([k, label]) =>
    `${r[k].pass ? 'PASS' : 'FAIL'}  ${label}\n        ${r[k].detail}`)
  lines.push('')
  lines.push(r.publishable ? 'PUBLISHABLE' : 'NOT PUBLISHABLE — at least one gate failed')
  return lines.join('\n')
}
