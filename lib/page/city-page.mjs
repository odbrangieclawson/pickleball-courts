/*
  The city page renderer: blocks B1-B12, in the immutable order.

  Pure function, HTML string out. No React, no client code, so Gate 2 is
  satisfied by construction - there is no JavaScript for the page to depend
  on.

  Every block declares data-prose or data-not-prose so the word-band counter
  measures only what a reader reads (see words.mjs).

  TRUST TIERS (B6), from verified_by:
    municipal_source                -> "Verified - municipal source"
    owner_submission                -> "Confirmed by the venue"
    staff_check / user_report       -> "Checked by our team" / "Reader report"
    anything else / null            -> venue does not appear at all
*/

import {renderCount, renderCountOf, isCount, isPreviewCounts} from '../data/counts.mjs'
import {cityTitleWithLadder, cityH1, cityMeta, pluralise, monthYear} from './titles.mjs'
import {buildCityGraph, renderLd, PLACEHOLDER_ORIGIN} from './schema-ld.mjs'
import {EDITORIAL_SLOTS} from './editorial.mjs'

const esc = s => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const HELP = (city, state, field) =>
  `<a href="/help-us-verify/?city=${encodeURIComponent(city)}&amp;state=${state}&amp;field=${field}">help us verify</a>`

/** Rule 6: a null renders as "Not verified yet" plus a way to fix it. Never 0, never N/A. */
export const notVerified = (city, state, field) =>
  `<span class="unverified">Not verified yet</span> — ${HELP(city, state, field)}`

const TRUST_TIER = {
  municipal_source: {label: 'Verified — municipal source', rank: 1},
  owner_submission: {label: 'Confirmed by the venue', rank: 2},
  staff_check: {label: 'Checked by our team', rank: 3},
  user_report: {label: 'Reader report', rank: 4},
}

export const FILTERS = ['indoor', 'outdoor', 'free', 'public', 'lights']

const FILTER_LABEL = {
  indoor: 'Indoor courts', outdoor: 'Outdoor courts', free: 'Free to play',
  public: 'Public access', lights: 'Lit for evening play',
}

/** Which filter pages exist. Rule 4 + Rule 8: 3+ verified venues match. */
export function qualifyingFilters(venues, min = 3) {
  const match = {
    indoor: v => typeof v.indoor_courts === 'number' && v.indoor_courts >= 1,
    outdoor: v => typeof v.outdoor_courts === 'number' && v.outdoor_courts >= 1,
    free: v => v.fee_type === 'free',
    public: v => v.access_type === 'public',
    lights: v => v.light === true,
  }
  const out = {}
  for (const f of FILTERS) {
    const n = venues.filter(match[f]).length
    if (n >= min) out[f] = n
  }
  return out
}

/**
 * @returns {{html:string, title:string, meta:string, graph:object, dataValues:string[]}}
 */
export function renderCityPage({
  city, state, stateName, citySlug, county, countySlug,
  counts, venues, editorial, faqs = null,
  origin = PLACEHOLDER_ORIGIN,
  nearbyCities = [],
  countyPublished = false,
  preview = false,
}) {
  if (!isCount(counts?.venues)) throw new Error('renderCityPage requires the object from getCounts()')

  /*
    A preview render is allowed to exercise this template on unverified
    rows, but only when the caller says so out loud. Passing preview counts
    without preview:true throws, so an unverified page cannot be produced by
    forgetting a flag - only by asking for one.
  */
  if (isPreviewCounts(counts) && !preview) {
    throw new Error(
      'renderCityPage received counts drawn from UNVERIFIED rows without preview:true. ' +
      'A page built on unverified counts is not publishable (Rule 8, Rule 12, Page Gate 5).',
    )
  }
  if (preview && !isPreviewCounts(counts)) {
    throw new Error('preview:true was passed but the counts are real. Do not mark a real page as a preview.')
  }

  const base = `/pickleball/us/${state.toLowerCase()}/`
  const cityPath = `${base}${citySlug}/`
  const dates = venues.map(v => v.date_checked).filter(Boolean).sort()
  const lastChecked = dates[dates.length - 1] ?? null
  const oldestChecked = dates[0] ?? null

  const title = cityTitleWithLadder({city, state, counts})
  const meta = cityMeta({city, state, counts, lastChecked})

  // Sorted for B6 and mirrored exactly into ItemList.
  const ordered = venues.slice().sort((a, b) =>
    (b.total_courts ?? 0) - (a.total_courts ?? 0) || String(a.name).localeCompare(String(b.name)))

  const graph = buildCityGraph({origin, state, stateName, county, countySlug, city, citySlug, venues: ordered, faqs})
  const filters = qualifyingFilters(venues)

  const H = []
  const w = s => H.push(s)

  /* PREVIEW BANNER — not part of the anatomy. Only on a preview render. */
  if (preview) {
    w(`<meta name="robots" content="noindex,nofollow">`)
    w(`<div class="preview-banner" data-not-prose role="alert">`)
    w(`<strong>PREVIEW — NOT PUBLISHABLE.</strong> Every figure below is drawn from `)
    w(`unverified imported rows whose only source is a competitor directory. No venue `)
    w(`here has a named source or a checked date, so none of these numbers is a `)
    w(`verified count. This render exists to judge the template and is never deployed.`)
    w(`</div>`)
  }

  /* B1 BREADCRUMB — ~0 words, not prose */
  w(`<nav aria-label="Breadcrumb" data-not-prose><ol>`)
  w(`<li><a href="/pickleball/us/">US</a></li>`)
  w(`<li><a href="${base}">${esc(stateName ?? state)}</a></li>`)
  if (county && countySlug && countyPublished) {
    w(`<li><a href="${base}${countySlug}-county/">${esc(county)} County</a></li>`)
  } else if (county) {
    w(`<li>${esc(county)} County</li>`) // never link a below-threshold county
  }
  w(`<li aria-current="page">${esc(city)}</li>`)
  w(`</ol></nav>`)

  /* B2 H1 + PROMISE — 60-90 words, slot */
  w(`<h1>${esc(cityH1({city, state}))}</h1>`)
  w(`<div data-prose><p>`)
  w(`We have ${renderCount(counts.venues)} verified pickleball ${pluralise(counts.venues.value, 'venue')} in ${esc(city)}, `)
  w(`covering ${renderCount(counts.courts)} ${pluralise(counts.courts.value, 'court')} in total — `)
  w(`${renderCount(counts.indoor_courts)} indoor and ${renderCount(counts.outdoor_courts)} outdoor. `)
  w(`Each of those ${pluralise(counts.venues.value, 'venue')} has been checked against a named source, `)
  w(`and every figure on this page is drawn only from venues we have confirmed. `)
  w(lastChecked ? `The most recent check was ${esc(monthYear(lastChecked))}.` : '')
  w(`</p></div>`)

  /* B3 TRUST STRIP — 30-50 words, above the fold. This block is the product. */
  w(`<aside class="trust" data-prose><p>`)
  w(`<strong>${renderCount(counts.venues)} of ${counts.venues.denominator} ${pluralise(counts.venues.denominator, 'venue')} verified against a named source.</strong> `)
  w(lastChecked ? `Last sweep ${esc(monthYear(lastChecked))}. ` : '')
  w(`We publish where every fact came from and when we checked it. `)
  w(`<a href="/provenance/">How we verify</a>.`)
  w(`</p></aside>`)

  /* B4 AT-A-GLANCE — 90-130 words, slot-filled sentences not a bare table */
  w(`<h2>At a glance</h2><div data-prose><p>`)
  w(`${esc(city)} has ${renderCount(counts.courts)} verified ${pluralise(counts.courts.value, 'court')} across ${renderCount(counts.venues)} ${pluralise(counts.venues.value, 'venue')}. `)
  w(`${renderCountOf(counts.venues_indoor, 'venues')} have at least one indoor court, and ${renderCountOf(counts.venues_outdoor, 'venues')} have outdoor courts. `)
  w(`${renderCountOf(counts.venues_free, 'venues')} are free to play. `)
  w(`${renderCountOf(counts.venues_lit, 'venues')} have lit courts for evening play. `)
  // Rule 14: covered and climate control are reported separately and never summed into indoor.
  w(`Separately from indoor courts, ${renderCountOf(counts.venues_covered, 'venues')} are covered but open to the air, `)
  w(`and ${renderCountOf(counts.venues_climate, 'venues')} are climate controlled. `)
  w(`A covered court is not an indoor court, so we count them apart.`)
  w(`</p></div>`)

  /* B5 FILTER LINKS — 60-90 words */
  const filterKeys = Object.keys(filters)
  if (filterKeys.length) {
    w(`<h2>Browse by what you need</h2><div data-prose><p>`)
    /*
      pluralise() emits "1 list", which reads as a count, not as a determiner.
      "These 1 list cover the 1 group" is what that produced. The sentence
      needs the singular/plural forms of the WORDS, so it is written out.
    */
    w(filterKeys.length === 1
      ? `This list covers the one group of ${esc(city)} ${pluralise(counts.venues.value, 'venue')} large enough to stand on its own. `
      : `These lists cover the groups of ${esc(city)} ${pluralise(counts.venues.value, 'venue')} large enough to stand on their own. `)
    w(`A list only appears once at least three verified venues match it.`)
    w(`</p><ul>`)
    for (const f of filterKeys) {
      w(`<li><a href="${cityPath}${f}/">${FILTER_LABEL[f]} in ${esc(city)}</a> — ${filters[f]} verified ${pluralise(filters[f], 'venue')}</li>`)
    }
    w(`</ul></div>`)
  }

  /* B6 VENUE LIST — 250-450 words. Pending rows never appear. */
  w(`<h2>Verified venues in ${esc(city)}</h2>`)
  w(`<ul class="venues">`)
  for (const v of ordered) {
    const tier = TRUST_TIER[v.verified_by]
    w(`<li>`)
    w(`<h3><a href="${cityPath}${v.slug}/">${esc(v.name)}</a></h3>`)
    w(`<p data-prose>`)
    w(v.total_courts !== null
      ? `${v.total_courts} ${pluralise(v.total_courts, 'court')}` +
        (v.indoor_courts !== null && v.outdoor_courts !== null
          ? ` (${v.indoor_courts} indoor, ${v.outdoor_courts} outdoor)` : '')
      : notVerified(city, state, 'total_courts'))
    w(`. Surface: ${v.surface ? esc(v.surface.replace(/_/g, ' ')) : notVerified(city, state, 'surface')}. `)
    w(`Cost: ${v.fee_type ? esc(v.fee_type.replace(/_/g, ' ')) : notVerified(city, state, 'fee_type')}. `)
    w(`Lights: ${v.light === true ? 'yes' : v.light === false ? 'no' : notVerified(city, state, 'light')}.`)
    w(`</p>`)
    w(`<p data-not-prose><span class="tier tier-${tier?.rank ?? 9}">${esc(tier?.label ?? 'Not yet verified')}</span> · Checked ${esc(v.date_checked ?? 'never')}</p>`)
    w(`</li>`)
  }
  w(`</ul>`)

  /* B7 THE FOUR EDITORIAL NOTES — 400-600 words, EDITORIAL */
  w(`<h2>What it is actually like to play here</h2>`)
  for (const slot of EDITORIAL_SLOTS) {
    const text = editorial?.[slot.key]
    if (!text) {
      /*
        The renderer NEVER invents editorial copy. On a preview it shows the
        slot's prompt and word budget so the block's shape is visible,
        clearly marked as unwritten and excluded from the word count. On a
        real render it emits nothing and gate 4 refuses the page.
      */
      if (preview) {
        w(`<section data-not-prose class="slot-empty">`)
        w(`<h3>${esc(slotHeading(slot.key, city))}</h3>`)
        w(`<p><em>UNWRITTEN EDITORIAL SLOT — 100 to 150 words needed. ${esc(slot.prompt)}</em></p>`)
        w(`</section>`)
      }
      continue
    }
    w(`<section data-prose><h3>${esc(slotHeading(slot.key, city))}</h3><p>${esc(text)}</p></section>`)
  }

  /* B8 PLAY BY NEED — 120-180 words, slot+ */
  const byNeed = []
  if (filters.indoor) byNeed.push(['indoor', 'Year-round play', ordered.find(v => v.indoor_courts >= 1)])
  if (filters.free) byNeed.push(['free', 'Playing for nothing', ordered.find(v => v.fee_type === 'free')])
  if (filters.lights) byNeed.push(['lights', 'After work', ordered.find(v => v.light === true)])
  if (byNeed.length) {
    w(`<h2>Play by need</h2><div data-prose>`)
    for (const [f, heading, example] of byNeed) {
      if (!example) continue
      w(`<h3>${heading}</h3><p>`)
      if (f === 'indoor') w(`${filters.indoor} ${pluralise(filters.indoor, 'venue')} keep courts under a roof, so weather never cancels a session. ${esc(example.name)} is one of them. `)
      if (f === 'free') w(`${filters.free} ${pluralise(filters.free, 'venue')} cost nothing to play, including ${esc(example.name)}. `)
      if (f === 'lights') w(`${filters.lights} ${pluralise(filters.lights, 'venue')} have lit courts, so play carries on after dark — ${esc(example.name)} among them. `)
      w(`<a href="${cityPath}${f}/">See all ${f} ${pluralise(filters[f], 'venue')}</a>.</p>`)
    }
    w(`</div>`)
  }

  /* B9 GAP DISCLOSURE — 60-100 words. Never an apology. */
  w(`<h2>What we have not verified yet</h2><div data-prose><p>`)
  const unv = counts.venues_unverified
  if (unv.value > 0) {
    w(`We know of ${renderCount(unv)} further ${pluralise(unv.value, 'venue')} in ${esc(city)} that we have not verified. `)
    w(`They are missing a named source, a checked date, or both, so they do not appear above and are not counted in any figure on this page. `)
    w(`We would rather show you ${renderCount(counts.venues)} ${pluralise(counts.venues.value, 'venue')} we can stand behind than a longer list we cannot. `)
    w(`If you know one of them, ${HELP(city, state, 'venue')}.`)
  } else {
    w(`Every ${esc(city)} venue we know of has been verified against a named source. `)
    w(`If we are missing one, ${HELP(city, state, 'venue')}.`)
  }
  w(`</p></div>`)

  /* B10 GEOGRAPHIC LINKS — 40-70 words */
  w(`<h2>Nearby</h2><div data-prose><p>`)
  if (county && countySlug && countyPublished) {
    w(`This city sits in <a href="${base}${countySlug}-county/">${esc(county)} County</a>. `)
  }
  w(`See every verified venue in <a href="${base}">${esc(stateName ?? state)}</a>. `)
  if (nearbyCities.length) {
    w(`Nearby published cities: `)
    w(nearbyCities.slice(0, 5).map(c => `<a href="${base}${c.slug}/">${esc(c.name)}</a>`).join(', '))
    w(`.`)
  }
  w(`</p></div>`)

  /* B11 FAQ — only if real */
  if (faqs && faqs.length) {
    w(`<h2>Questions</h2><div data-prose>`)
    for (const f of faqs) {
      w(`<h3>${esc(f.question)}</h3><p>${esc(f.answer)} <a href="${esc(f.source_url)}" rel="nofollow">Source</a>.</p>`)
    }
    w(`</div>`)
  }

  /* B12 SOURCES AND FRESHNESS FOOTER — visible, not collapsed */
  w(`<h2>Sources</h2>`)
  w(`<table data-not-prose><thead><tr><th>Venue</th><th>Source</th><th>Checked</th><th>How</th></tr></thead><tbody>`)
  for (const v of ordered) {
    w(`<tr><td>${esc(v.name)}</td>`)
    w(`<td>${v.source_url ? `<a href="${esc(v.source_url)}" rel="nofollow">${esc(hostOf(v.source_url))}</a>` : '—'}</td>`)
    w(`<td>${esc(v.date_checked ?? '—')}</td>`)
    w(`<td>${esc(TRUST_TIER[v.verified_by]?.label ?? '—')}</td></tr>`)
  }
  w(`</tbody></table>`)
  if (oldestChecked) {
    w(`<p data-not-prose>Oldest check on this page: ${esc(oldestChecked)}. A page is only as fresh as its stalest fact.</p>`)
  }

  w(renderLd(graph))

  const html = H.join('')
  const dataValues = [
    city, state, stateName, county,
    ...ordered.flatMap(v => [v.name, v.slug, v.surface, v.fee_type, v.date_checked, v.source_url].filter(Boolean)),
    ...Object.values(counts).filter(isCount).flatMap(c => [String(c.value), String(c.denominator), String(c.known)]),
  ].filter(Boolean).map(String)

  return {html, title, meta, graph, dataValues, filters, lastChecked}
}

const slotHeading = (key, city) => ({
  parking: `Parking in ${city}`,
  peak_hours: 'When the courts are busy',
  surface_condition: 'Court conditions',
  local_scene: `The ${city} pickleball scene`,
}[key] ?? key)

const hostOf = u => { try { return new URL(u).hostname } catch { return u } }
