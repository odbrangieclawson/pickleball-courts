/*
  Phase 1B deliverables 1 and 2: per-metro prioritised source list, and a
  verification worksheet per metro.

  THE ONE THING THIS FILE WILL NOT DO

  It will not invent a source_url. The project rule is explicit and it is
  the whole point of the phase: never fabricate a source. A plausible-looking
  parks-department URL that returns 404 is worse than a blank, because a
  blank gets filled and a plausible URL gets trusted.

  So the "candidate source URL" column in every worksheet ships EMPTY, and
  what is generated instead is a SEARCH PLAN: the exact queries and the
  domain patterns to try, in ladder order. A human or an agent with web
  access fills the URL after actually loading the page.

  THE LADDER, in the order the brief specifies:

    1  municipal parks department pages and PDFs
    2  city and state open-data portals
    3  YMCA and recreation centre sites
    4  club and league sites
    5  the venue's own site
    6  commercial or paid sources - LAST, and flagged

  Tier drives two things automatically: which source wins a conflict
  (conflict.mjs), and what verified_by the fact earns (provenance.mjs).
  Tiers 1-2 earn municipal_source; 3-6 earn staff_check.
*/

import {writeFileSync, mkdirSync} from 'node:fs'
import {join} from 'node:path'
import {REPO_ROOT} from '../lib/load-csv.mjs'

export const LADDER = Object.freeze([
  {
    tier: 1,
    name: 'Municipal parks department',
    verified_by: 'municipal_source',
    paid: false,
    why: 'The operator of most public courts, publishing about its own facilities. Highest trust available without a site visit.',
    queries: c => [
      `"${c.city}" parks recreation pickleball courts site:.gov`,
      `"${c.city}" ${c.state} parks department facility inventory pickleball`,
      `"${c.city}" parks pickleball filetype:pdf`,
      `"${c.city}" ${c.state} "tennis and pickleball" park courts .gov`,
    ],
    domains: c => [`www.${slug(c.city)}.gov`, `www.cityof${slug(c.city)}.gov`, `www.${slug(c.city)}${c.state.toLowerCase()}.gov`],
  },
  {
    tier: 2,
    name: 'City / state open-data portal',
    verified_by: 'municipal_source',
    paid: false,
    why: 'Same publisher as tier 1 but machine-readable, so it parses cleanly and re-checks cheaply. Ranked below tier 1 only because portal datasets are often staler than the department page.',
    queries: c => [
      `"${c.city}" open data parks facilities dataset pickleball`,
      `"${c.city}" ${c.state} data.gov parks amenities`,
      `site:opendata.arcgis.com "${c.city}" parks courts`,
    ],
    domains: c => [`data.${slug(c.city)}.gov`, `opendata.${slug(c.city)}.gov`, `data.${slug(c.city)}.org`, `hub.arcgis.com`],
  },
  {
    tier: 3,
    name: 'YMCA / recreation centre',
    verified_by: 'staff_check',
    paid: false,
    why: 'Operator-published for its own site. Reliable on hours and fees, often vague on court counts.',
    queries: c => [`YMCA "${c.city}" ${c.state} pickleball courts schedule`, `"${c.city}" recreation center pickleball open play`],
    domains: () => ['ymca.org', 'ymca.net'],
  },
  {
    tier: 4,
    name: 'Club / league site',
    verified_by: 'staff_check',
    paid: false,
    why: 'Local players know the courts. Good on lights, nets and play format; weak on official counts and prone to being out of date.',
    queries: c => [`"${c.city}" pickleball club courts list`, `"${c.city}" ${c.state} pickleball league where we play`],
    domains: () => [],
  },
  {
    tier: 5,
    name: "The venue's own site",
    verified_by: 'staff_check',
    paid: false,
    why: 'Authoritative on fees and hours, but marketing copy inflates court counts and rarely dates itself.',
    queries: c => [`"${c.city}" pickleball facility official site courts hours`],
    domains: () => [],
  },
  {
    tier: 6,
    name: 'Commercial / paid',
    verified_by: 'staff_check',
    paid: true,
    why: 'LAST RESORT. Costs money, and a paid aggregator is still an aggregator - it inherits whatever its own sources got wrong. Anything from here is flagged paid_source and should be treated as a lead to confirm at tier 1-2, not as a source in itself.',
    queries: c => [`"${c.city}" pickleball courts directory`],
    domains: () => [],
    warning: 'COSTS MONEY. Confirm the spend is authorised before using. Never let a paid aggregator be the only source for a published fact.',
  },
])

const slug = s => String(s ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '')

export function ladderFor(city) {
  return LADDER.map(t => ({
    tier: t.tier,
    source_type: t.name,
    verified_by: t.verified_by,
    paid: t.paid,
    why: t.why,
    warning: t.warning ?? null,
    search_queries: t.queries(city),
    domain_patterns: t.domains(city),
  }))
}

/*
  Field priority for a worksheet. The gates decide this, not taste:

    I1 needs a resolving street_address
    I3 needs court arithmetic to hold, so total/indoor/outdoor together
    Rule 8 / page value needs the filter drivers, since they decide how many
       filter pages the venue can support
    Everything else is nice to have and does not gate anything
*/
export const FIELD_PRIORITY = Object.freeze({
  required_for_gates: ['street_address', 'total_courts', 'indoor_courts', 'outdoor_courts'],
  drives_filter_pages: ['light', 'fee_type', 'access_type'],
  improves_page: ['surface', 'nets_provided', 'restroom', 'hours_of_operation', 'venue_type', 'website', 'phone'],
})

/**
 * Order venues within a metro so the highest-value pages are verified first.
 *
 * Value here is concrete: a venue that unlocks a FILTER page is worth more
 * than one that only adds itself, because a filter page is an extra
 * indexable URL. Ties break toward venues that are already closest to
 * passing, so early effort converts to finished pages fastest.
 */
export function orderVenues(venues) {
  return venues
    .map(v => {
      let score = 0
      // Already passes the cheap gates: least work remaining.
      if (v.street_address) score += 3
      if (v.total_courts !== null) score += 3
      if (v.indoor_courts !== null && v.outdoor_courts !== null) score += 2
      // Drives a filter page.
      if (v.indoor_courts !== null && v.indoor_courts >= 1) score += 2
      if (v.outdoor_courts !== null && v.outdoor_courts >= 1) score += 2
      if (v.light === true) score += 2
      if (v.fee_type === 'free') score += 2
      if (v.access_type === 'public') score += 2
      // A municipal-looking venue is likelier to be findable at tier 1.
      if (['public_park', 'community_center'].includes(v.venue_type)) score += 3
      // Missing the things that block I1/I3 outright: verify these first
      // because they are the difference between a page and no page.
      if (!v.street_address) score -= 4
      if (v.total_courts === null) score -= 2
      return {venue: v, score}
    })
    .sort((a, b) => b.score - a.score)
    .map((x, i) => ({...x.venue, _rank: i + 1, _priority_score: x.score}))
}

/** Which fields this venue actually needs confirmed. */
export function fieldsToConfirm(v) {
  const need = []
  for (const f of FIELD_PRIORITY.required_for_gates) {
    need.push({field: f, why: 'gate', current: v[f] ?? null, status: v[f] === null || v[f] === undefined ? 'MISSING' : 'confirm'})
  }
  for (const f of FIELD_PRIORITY.drives_filter_pages) {
    need.push({field: f, why: 'filter page', current: v[f] ?? null, status: v[f] === null || v[f] === undefined ? 'MISSING' : 'confirm'})
  }
  return need
}

export function writeWorksheet(dir, metro, venues, ladder) {
  mkdirSync(dir, {recursive: true})
  const safe = `${slug(metro.city)}-${metro.state.toLowerCase()}`

  /* The worksheet. candidate_source_url ships EMPTY on purpose - see header. */
  const header = [
    'rank', 'venue_slug', 'venue_name', 'street_address',
    'field_to_confirm', 'current_value', 'why_needed',
    'candidate_source_url', 'source_tier', 'date_checked', 'verified_by', 'notes',
  ]
  const rows = [header.join(',')]
  for (const v of venues) {
    for (const f of fieldsToConfirm(v)) {
      rows.push([
        v._rank,
        JSON.stringify(v.slug ?? ''),
        JSON.stringify(v.name ?? ''),
        JSON.stringify(v.street_address ?? ''),
        f.field,
        JSON.stringify(f.current === null ? '' : String(f.current)),
        f.why === 'gate' ? 'import gate' : 'filter page',
        '', // candidate_source_url - NEVER prefilled
        '', // source_tier
        '', // date_checked
        '', // verified_by
        f.status === 'MISSING' ? 'MISSING - blocks a gate' : '',
      ].join(','))
    }
  }
  writeFileSync(join(dir, `${safe}-worksheet.csv`), rows.join('\n'))

  /* The source plan. */
  const L = []
  L.push(`# ${metro.city}, ${metro.state} — verification plan`)
  L.push('')
  L.push(`${venues.length} venues to verify. The metro needs **3 or more** passing all four`)
  L.push('import gates before it publishes anything. A partially verified metro does not')
  L.push('publish partially — it waits.')
  L.push('')
  L.push('## Source ladder')
  L.push('')
  L.push('Work down this list. Stop at the highest tier that answers the question —')
  L.push('a tier-1 answer makes tiers 3-6 unnecessary for that field.')
  L.push('')
  L.push('**No URL below is asserted to exist.** These are search plans. Load the page,')
  L.push('confirm it says what you need, and only then record the URL you actually used.')
  L.push('')
  for (const t of ladder) {
    L.push(`### Tier ${t.tier} — ${t.source_type}${t.paid ? ' ⚠️ PAID' : ''}`)
    L.push('')
    L.push(`*${t.why}*`)
    L.push('')
    if (t.warning) { L.push(`> **${t.warning}**`); L.push('') }
    L.push(`- Earns \`verified_by = ${t.verified_by}\``)
    if (t.domain_patterns.length) L.push(`- Domains to try: ${t.domain_patterns.map(d => `\`${d}\``).join(', ')}`)
    L.push('- Searches:')
    for (const q of t.search_queries) L.push(`  - \`${q}\``)
    L.push('')
  }
  L.push('## Venues, highest value first')
  L.push('')
  L.push('| # | venue | address | missing | unlocks |')
  L.push('| ---: | --- | --- | --- | --- |')
  for (const v of venues) {
    const missing = fieldsToConfirm(v).filter(f => f.status === 'MISSING').map(f => f.field)
    const unlocks = []
    if (v.indoor_courts >= 1) unlocks.push('indoor')
    if (v.outdoor_courts >= 1) unlocks.push('outdoor')
    if (v.light === true) unlocks.push('lights')
    if (v.fee_type === 'free') unlocks.push('free')
    if (v.access_type === 'public') unlocks.push('public')
    L.push(`| ${v._rank} | ${(v.name ?? '').replace(/\|/g, '\\|')} | ${(v.street_address ?? '—').replace(/\|/g, '\\|')} | ${missing.join(' ') || '—'} | ${unlocks.join(' ') || '—'} |`)
  }
  L.push('')
  writeFileSync(join(dir, `${safe}-plan.md`), L.join('\n'))
  return {worksheet: `${safe}-worksheet.csv`, plan: `${safe}-plan.md`, venues: venues.length}
}
