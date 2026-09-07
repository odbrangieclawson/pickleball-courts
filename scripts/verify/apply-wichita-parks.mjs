#!/usr/bin/env node
/*
  Wichita, KS verification run - city #31, the first in Kansas and the
  first in Sedgwick County.

  ============================================================
  THE SNAPSHOT IS TEXT READ IN A BROWSER
  ============================================================

  wichita.gov answers HTTP 403 to every scripted request - a bare curl, the
  full browser header set in scripts/verify/fetch/lincoln.sh, and the web
  fetcher - and did so on 2026-09-04 and again on 2026-09-07. The page loads
  normally in a browser. So this city follows Cary's route: the page was
  read in Chrome, its "Pickleball Court Locations" section is three tabs
  (RECREATION CENTERS, RIVERSIDE TENNIS CENTER, PARKS) and each tab was
  opened and its text captured into data/sources/wichita/pickleball.txt,
  under a header that states the URL, the date and the method. The
  re-check is the same act as the first read, and this run asserts every
  quoted fact against that file exactly as the HTML runs assert against
  theirs - including the header's METHOD line and the three tab markers,
  so the file's own provenance cannot be quietly changed.

  ============================================================
  WHAT THE CITY STATES
  ============================================================

  One page, three tabs, and a count on every line:

      Parks (outdoor)       Edgemoor Park 12, Buffalo Park 2, Osage Park 2,
                            Seneca Park 6, and Sherwood Glen "1 striped
                            without net (portable net required)"
      Recreation Centers    Boston 3, Edgemoor 3, Evergreen 2, Linwood 3,
      (indoor, temporary)   Brewer 2 "(Closed for Improvements)", Orchard 3
      Riverside Tennis      "9 outdoors with court lights for night play"
      Center                "6 indoors (these are double-striped over the
                            3 tennis courts)"

  The Parks tab is headed "Outdoor courts with hard / concrete surfaces"
  and the Recreation Centers tab "Temporary indoor courts with wood and
  tile surfaces", so indoor and outdoor are the City's own words for every
  venue (the Saint Paul rule). Riverside states both sides itself.

  ============================================================
  EDGEMOOR IS ONE VENUE WITH COURTS ON BOTH SIDES
  ============================================================

  The Parks tab lists "Edgemoor Park / 5815 E 9th / 12 courts" and the
  Recreation Centers tab lists "Edgemoor / 5815 E 9th Street / 3 courts".
  One address, one site: published as one venue with fifteen courts, twelve
  outdoor and three indoor, after Bellevue's Hidden Valley and Tampa's
  Forest Hills. Both entries are asserted.

  ============================================================
  SURFACE IS NOT PUBLISHED
  ============================================================

  "Outdoor courts with hard / concrete surfaces" names a material, but with
  a slash: it reads as "hard, that is concrete" or as "hard or concrete",
  and it is one sentence over four parks. Portland's "hard courts" was
  refused as a category rather than a material; this is a category with a
  material beside it, and which park has which is not stated. The sentence
  is quoted on every park's page and the surface field stays null. The
  rec-centre line "wood and tile surfaces" is the same shape and gets the
  same answer.

  ============================================================
  WHAT IS REFUSED
  ============================================================

  Sherwood Glen    "1 striped without net (portable net required)". A
                   count of one and no address anywhere on the page.
                   Import Gate I1.

  ============================================================
  WHAT IS NOT CLAIMED
  ============================================================

  fee        "Some can be reserved for a small fee while others are
             first-come-first-serve" - without saying which. Null
             everywhere; Riverside's "Reserve a Pickleball Court" goes into
             pricing_notes with no price, because none is published.
  hours      The drop-in hours are in two PDFs ("View Summer Drop-In Hours",
             "View Fall Drop-In Hours") that were not read. Null.
  lighting   Stated only at Riverside ("court lights for night play").
  play_format  Null: the first-come sentence does not say which venues.
*/

import {readFileSync, writeFileSync, mkdirSync} from 'node:fs'
import {join} from 'node:path'
import {SourceDocument} from './provenance.mjs'
import {applyFacts, changelogToRows} from './conflict.mjs'
import {loadRows, REPO_ROOT} from '../lib/load-csv.mjs'
import {PUBLISHED_FACT_FIELDS} from '../../lib/data/verified.mjs'
import {loadIdentity} from '../../lib/data/identity.mjs'
import {mapRow} from '../import/mapper.mjs'

const RETRIEVED_AT = process.env.RETRIEVED_AT ?? '2026-09-07'

const CITY = 'City of Wichita Park & Recreation'
const PAGE = 'https://www.wichita.gov/717/Pickleball'
const SNAPSHOT = 'data/sources/wichita/pickleball.txt'
const CENSUS_URL = 'https://geocoding.geo.census.gov/geocoder/geographies'

const METHOD_LINE = 'METHOD: read in a browser (Chrome, via the Claude browser extension); wichita.gov returns HTTP 403 to every scripted fetch'
const INTRO = 'Wichita Parks and Recreation offers indoor and outdoor pickleball courts all over the city. Some can be reserved for a small fee while others are first-come-first-serve.'
const PARKS_LINE = 'Outdoor courts with hard / concrete surfaces'
const CENTERS_LINE = 'Temporary indoor courts with wood and tile surfaces'
const PDF_LINES = ['View Summer Drop-In Hours (PDF)', 'View Fall Drop-In Hours (PDF)']

/* Every venue is a block of consecutive lines inside one tab. */
const PARKS = [
  {
    slug: 'edgemoor-park', importedSlug: 'edgemoor-park', name: 'Edgemoor Park', geo: 'edgemoor-park',
    address: '5815 E 9th', lines: ['Edgemoor Park', '5815 E 9th', '12 courts'], courts: 15, outdoor: 12, indoor: 3,
    centreLines: ['Edgemoor', '5815 E 9th Street', '316-688-9392', '3 courts'], phone: '316-688-9392',
    availability: 'Fifteen pickleball courts at one address in east Wichita, and the only venue in the city with courts on both sides of the indoor line. The Parks tab of the City\'s pickleball page lists "Edgemoor Park / 5815 E 9th / 12 courts" under "Outdoor courts with hard / concrete surfaces", and the Recreation Centers tab lists "Edgemoor / 5815 E 9th Street / 3 courts" under "Temporary indoor courts with wood and tile surfaces". Same address, one site, published as one venue after Bellevue\'s Hidden Valley Park and Tampa\'s Forest Hills. The twelve outdoor courts are the largest outdoor set in Wichita. The City states no hours here - its drop-in hours live in two PDFs this site has not read - and no lighting, and its one sentence on cost, "Some can be reserved for a small fee while others are first-come-first-serve", does not say which of these Edgemoor is.',
  },
  {
    slug: 'buffalo-park', importedSlug: 'buffalo-park', name: 'Buffalo Park', geo: 'buffalo-park',
    address: '10201 Hardtner', lines: ['Buffalo Park', '10201 Hardtner', '2 courts'], courts: 2, outdoor: 2,
    availability: 'Two outdoor pickleball courts in west Wichita, from the Parks tab of the City\'s pickleball page: "Buffalo Park / 10201 Hardtner / 2 courts", under the tab\'s own heading "Outdoor courts with hard / concrete surfaces". Two courts is a game rather than a rotation. The City states no hours, no lighting and no price for this park; its one sentence on cost covers the whole city without naming a venue. The imported dataset held this park at "318-500 N Maize Rd", a street range rather than an address; the City\'s house number replaces it.',
  },
  {
    slug: 'osage-park', importedSlug: 'osage-park-ks', name: 'Osage Park', geo: 'osage-park',
    address: '2121 W 31st', lines: ['Osage Park', '2121 W 31st', '2 courts'], courts: 2, outdoor: 2,
    availability: 'Two outdoor pickleball courts in south Wichita, from the Parks tab of the City\'s pickleball page: "Osage Park / 2121 W 31st / 2 courts", under "Outdoor courts with hard / concrete surfaces". The City writes the address without a street type; OpenStreetMap resolves it at house-number level as West 31st Street South, and that is the resolution published. No hours, lighting or price are stated for this park.',
  },
  {
    slug: 'seneca-park', importedSlug: 'seneca-park', name: 'Seneca Park', geo: 'seneca-park',
    address: '202 S Seneca', lines: ['Seneca Park', '202 S Seneca', '6 courts'], courts: 6, outdoor: 6,
    availability: 'Six outdoor pickleball courts just south-west of downtown, from the Parks tab of the City\'s pickleball page: "Seneca Park / 202 S Seneca / 6 courts", under "Outdoor courts with hard / concrete surfaces". Six is enough for a rotation and makes Seneca the second-largest outdoor set in the city after Edgemoor\'s twelve. The City states no hours, no lighting and no price for this park.',
  },
]

const CENTERS = [
  {
    slug: 'boston-recreation-center', importedSlug: 'boston-recreation-center', name: 'Boston Recreation Center', geo: 'boston-recreation-center',
    address: '6655 E Zimmerly', lines: ['Boston', '6655 E Zimmerly', '316-688-9301', '3 courts'], courts: 3, phone: '316-688-9301',
    availability: 'Three temporary indoor pickleball courts in the gym of the Boston Recreation Center in south-east Wichita. The City\'s Recreation Centers tab reads "Boston / 6655 E Zimmerly / 316-688-9301 / 3 courts" under the heading "Temporary indoor courts with wood and tile surfaces" - temporary because they are laid out for drop-in sessions rather than built into the floor. The sessions are published in two PDFs, "View Summer Drop-In Hours" and "View Fall Drop-In Hours", which this site has not read, so no hours are published here and the phone number is the way to find them. The City does not say whether this centre charges.',
  },
  {
    slug: 'evergreen-recreation-center', importedSlug: 'evergreen-recreation-center', name: 'Evergreen Recreation Center', geo: 'evergreen-recreation-center',
    address: '2700 N Woodland', lines: ['Evergreen', '2700 N Woodland', '316-909-8036', '2 courts'], courts: 2, phone: '316-909-8036',
    availability: 'Two temporary indoor pickleball courts at the Evergreen Recreation Center in north Wichita: "Evergreen / 2700 N Woodland / 316-909-8036 / 2 courts" on the City\'s Recreation Centers tab, under "Temporary indoor courts with wood and tile surfaces". The smallest indoor set in the city. Drop-in hours are in PDFs this site has not read; the City states no price for this centre.',
  },
  {
    slug: 'linwood-recreation-center', importedSlug: 'linwood-recreation-center', name: 'Linwood Recreation Center', geo: 'linwood-recreation-center',
    address: '1901 S Kansas', lines: ['Linwood', '1901 S Kansas', '316-337-9191', '3 courts'], courts: 3, phone: '316-337-9191',
    availability: 'Three temporary indoor pickleball courts at the Linwood Recreation Center in south Wichita: "Linwood / 1901 S Kansas / 316-337-9191 / 3 courts" on the City\'s Recreation Centers tab, under "Temporary indoor courts with wood and tile surfaces". Drop-in hours are in PDFs this site has not read; the City states no price for this centre.',
  },
  {
    slug: 'brewer-recreation-center', importedSlug: null, name: 'Brewer Recreation Center', geo: 'brewer-recreation-center',
    address: '1329 E 16th Street', lines: ['Brewer (Closed for Improvements)', '1329 E 16th Street', '316-337-9222', '2 courts'], courts: 2, phone: '316-337-9222',
    closed: 'Closed for Improvements',
    availability: 'Two temporary indoor pickleball courts at the Brewer Recreation Center in north-east Wichita - and the City lists the centre as "Brewer (Closed for Improvements)" on the day this page was read, so the venue is published as closed rather than omitted, as Scottsdale\'s Thompson Peak Park was during its resurfacing. The line reads "Brewer (Closed for Improvements) / 1329 E 16th Street / 316-337-9222 / 2 courts" under "Temporary indoor courts with wood and tile surfaces". The run that builds this page fails the day the City removes the closure note, so the notice cannot outlive the closure. No reopening date is stated. The imported dataset holds two rows near this address under other names - "McAdams Rec. Center" at 1329 E. 16th St. and "Carl G Brewer Community Center" at 1329 E 13th St N - and neither is matched here.',
  },
  {
    slug: 'orchard-park-recreation-center', importedSlug: 'orchard-park-recreation-center', name: 'Orchard Recreation Center', geo: 'orchard-recreation-center',
    address: '4808 W 9th Street', lines: ['Orchard', '4808 W 9th Street', '316-337-9244', '3 courts'], courts: 3, phone: '316-337-9244',
    availability: 'Three temporary indoor pickleball courts at the Orchard Recreation Center in west Wichita: "Orchard / 4808 W 9th Street / 316-337-9244 / 3 courts" on the City\'s Recreation Centers tab, under "Temporary indoor courts with wood and tile surfaces". OpenStreetMap resolves the address to a building it names "Orchard Park Recreation Center", which is also the name the imported dataset used. Drop-in hours are in PDFs this site has not read; the City states no price for this centre.',
  },
]

const RIVERSIDE = {
  slug: 'riverside-tennis-center', importedSlug: null, name: 'Riverside Tennis Center', geo: 'riverside-tennis-center',
  address: '551 Nims', lines: ['551 Nims', 'Phone: 316-337-9257', '9 outdoors with court lights for night play', '6 indoors (these are double-striped over the 3 tennis courts)'],
  courts: 15, outdoor: 9, indoor: 6, phone: '316-337-9257',
  availability: 'Fifteen pickleball courts at the City\'s Riverside Tennis Center on the west bank of the Arkansas River, and the only Wichita venue where the City answers the lighting question: "9 outdoors with court lights for night play" and "6 indoors (these are double-striped over the 3 tennis courts)". Nine and six are the City\'s two figures; fifteen is their sum. The lights belong to the nine outdoor courts. The six indoor courts are pickleball lines painted over three indoor tennis courts, so what you find indoors depends on whether tennis is being played. This is also the venue the City links a "Reserve a Pickleball Court" button to, which fits its sentence that "Some can be reserved for a small fee while others are first-come-first-serve" - but the fee is not published anywhere on the page, so no price appears here. The imported dataset holds this venue as "Ralph Wulz Riverside Tennis Center" with thirteen courts; that row is left pending and the City\'s fifteen publishes.',
}

const EXCLUDED = [
  {
    name: 'Sherwood Glen', lines: ['Sherwood Glen', '1 striped without net (portable net required)'],
    reasons: [
      'The City publishes no address for it. It is the last entry on the Parks tab, "Sherwood Glen / 1 striped without net (portable net required)", with no street line where every other park has one. Import Gate I1 requires a street address that resolves, and this project has never taken one from outside the operator.',
      'The count is real - one striped court, no net - and the venue fails on the one fact it is missing.',
    ],
  },
]

/* ---------------------------------------------------------------- */

const raw = readFileSync(join(REPO_ROOT, SNAPSHOT), 'utf8')
const lines = raw.split('\n').map(s => s.trim()).filter(Boolean)
const squeeze = s => s.replace(/\s+/g, '')
const whole = squeeze(lines.join(' '))

const must = (needle, what) => {
  if (!whole.includes(squeeze(needle))) {
    throw new Error(`Wichita: the snapshot no longer contains the ${what} text "${needle}". Re-read the page in a browser before trusting this run.`)
  }
}

/* The file's own provenance, then the page's framing. */
must(`URL: ${PAGE}`, 'snapshot URL header')
must(`RETRIEVED: ${RETRIEVED_AT}`, 'snapshot retrieval date')
must(METHOD_LINE, 'snapshot METHOD header')
for (const t of ['=== TAB: Recreation Centers ===', '=== TAB: Riverside Tennis Center ===', '=== TAB: Parks ===']) must(t, 'tab marker')
must(INTRO, 'introduction and cost sentence')
must(PARKS_LINE, 'Parks tab heading')
must(CENTERS_LINE, 'Recreation Centers tab heading')
for (const l of PDF_LINES) must(l, 'drop-in hours PDF link')

/* A tab's lines: from its marker to the next marker or the end marker. */
const tabIndex = name => lines.findIndex(l => l === `=== TAB: ${name} ===`)
const tabLines = name => {
  const from = tabIndex(name)
  if (from < 0) throw new Error(`Wichita: no tab marker for ${name}`)
  const to = lines.findIndex((l, i) => i > from && l.startsWith('=== '))
  return lines.slice(from + 1, to < 0 ? undefined : to)
}
const TABS = {parks: tabLines('Parks'), centres: tabLines('Recreation Centers'), riverside: tabLines('Riverside Tennis Center')}

/* A block of consecutive lines, in order, inside one tab. */
function assertBlock(who, tab, block) {
  const t = TABS[tab]
  const at = t.findIndex((l, i) => block.every((b, j) => squeeze(t[i + j] ?? '') === squeeze(b)))
  if (at < 0) throw new Error(`${who}: the ${tab} tab no longer carries the block ${JSON.stringify(block)} in that order. Re-read the page.`)
  const next = t[at + block.length] ?? ''
  if (/^\d+ courts?$/i.test(next)) throw new Error(`${who}: the block is followed by a further count line "${next}".`)
}

/* The refusal, asserted rather than remembered, and its absence of an address. */
for (const e of EXCLUDED) {
  assertBlock(e.name, 'parks', e.lines)
  const t = TABS.parks
  const at = t.findIndex(l => squeeze(l) === squeeze(e.name))
  /* A street line is a house number and a street; the count line "1 striped without net" is not one. */
  const after = t.slice(at + 1, at + 4)
  if (after.some(l => /^\d{2,5} [A-Za-z]/.test(l) && !/^1 striped/.test(l))) {
    throw new Error(`${e.name} now appears with a street line on the Parks tab. Re-read and publish it.`)
  }
}

const counties = JSON.parse(readFileSync(join(REPO_ROOT, 'data/sources/wichita-county-census.json'), 'utf8'))

const identityRegistry = loadIdentity(REPO_ROOT)
const allRows = loadRows().map(r => mapRow(r).venue)
const bySlug = new Map(
  allRows.filter(v => v.city === 'Wichita' && String(v.state).toUpperCase() === 'KS')
    .map(v => [v.slug, v]))

const overlay = {}
const changes = []

const ALL = [
  ...PARKS.map(p => ({...p, tab: 'parks'})),
  ...CENTERS.map(p => ({...p, tab: 'centres'})),
  {...RIVERSIDE, tab: 'riverside'},
]

for (const p of ALL) {
  assertBlock(p.slug, p.tab, p.lines)
  if (p.centreLines) assertBlock(p.slug, 'centres', p.centreLines)
  if (p.tab === 'riverside') assertBlock(p.slug, 'riverside', ['Riverside Tennis Center'])

  const geo = counties[p.geo]
  if (!geo?.matched) throw new Error(`${p.slug}: no address resolver matched its address`)
  if (!geo.place_matches_city) throw new Error(`${p.slug}: the resolver places this at "${geo.place}", not Wichita.`)

  const doc = new SourceDocument({url: PAGE, retrieved_at: RETRIEVED_AT, tier: 1, publisher: CITY, format: 'text'})
  const docCensus = new SourceDocument({url: CENSUS_URL, retrieved_at: RETRIEVED_AT, tier: 1, publisher: 'US Census Bureau', format: 'json'})

  const shell = {
    slug: p.slug, name: null, city: 'Wichita', state: 'KS', county: null,
    postal_code: null, street_address: null, latitude: null, longitude: null,
    status: 'pending', source_url: null, date_checked: null, verified_by: null,
    claimed_by_owner: false, claim_date: null,
    rating: null, user_rating: null, review_count: null, claimed_or_verified: null,
    source_sport: 'pickleball',
  }
  for (const f of PUBLISHED_FACT_FIELDS) shell[f] = null
  const imported = p.importedSlug ? bySlug.get(p.importedSlug) : undefined
  const venue = imported ?? shell

  const block = `"${p.lines.join(' / ')}"`
  const tabName = p.tab === 'parks' ? 'Parks' : p.tab === 'centres' ? 'Recreation Centers' : 'Riverside Tennis Center'

  const facts = [
    doc.fact('name', p.name, {
      evidence: p.tab === 'centres'
        ? `The City's Recreation Centers tab prints the centre as "${p.lines[0]}"; "Recreation Center" is the tab's own heading applied to the name.`
        : `Named "${p.tab === 'riverside' ? 'Riverside Tennis Center' : p.lines[0]}" on the ${tabName} tab of the City's pickleball page.`,
    }),
    doc.fact('total_courts', p.courts, {
      evidence: p.slug === 'edgemoor-park'
        ? `Two City entries at one address: "${p.lines.join(' / ')}" on the Parks tab and "${p.centreLines.join(' / ')}" on the Recreation Centers tab. Fifteen is their sum.`
        : p.slug === 'riverside-tennis-center'
          ? `The City's Riverside Tennis Center tab: "9 outdoors with court lights for night play" and "6 indoors (these are double-striped over the 3 tennis courts)". Fifteen is the sum of the City's two figures.`
          : `Quoted from the ${tabName} tab of the City's pickleball page: ${block}.`,
    }),
    doc.fact('street_address', p.address, {
      evidence: `${block} on the ${tabName} tab of the City's pickleball page.` +
        (p.slug === 'edgemoor-park' ? ' The Recreation Centers tab writes the same address as "5815 E 9th Street".' : ''),
    }),
    doc.fact('venue_type', p.tab === 'centres' ? 'community_center' : 'public_park', {
      evidence: p.tab === 'centres'
        ? 'Listed on the Recreation Centers tab of the City\'s pickleball page as a City recreation centre.'
        : `Published by the ${CITY} among its parks and facilities.`,
    }),
    doc.fact('court_availability', p.availability, {
      evidence: `From the City's pickleball page, ${tabName} tab: ${block}.`,
    }),
    docCensus.fact('county', geo.county, {
      evidence: `${geo.county} County, KS${geo.county_fips ? ` (FIPS ${geo.state_fips}${geo.county_fips})` : ''}. ${geo.basis} The resolver also places it in the incorporated place "${geo.place}", which is what allows it to be published under Wichita.`,
    }),
    docCensus.fact('postal_code', geo.postal_code, {evidence: geo.basis}),
  ]

  if (p.outdoor != null) {
    facts.push(doc.fact('outdoor_courts', p.outdoor, {
      evidence: p.tab === 'riverside'
        ? '"9 outdoors with court lights for night play" - the word is the City\'s.'
        : `The Parks tab sits under the City's own heading "${PARKS_LINE}": ${block}.`,
    }))
  }
  if (p.indoor != null || p.tab === 'centres') {
    facts.push(doc.fact('indoor_courts', p.indoor ?? p.courts, {
      evidence: p.tab === 'riverside'
        ? '"6 indoors (these are double-striped over the 3 tennis courts)" - the word is the City\'s.'
        : p.slug === 'edgemoor-park'
          ? `The Recreation Centers tab, under "${CENTERS_LINE}": "${p.centreLines.join(' / ')}".`
          : `The Recreation Centers tab sits under the City's own heading "${CENTERS_LINE}": ${block}.`,
    }))
  }
  if (p.tab === 'riverside') {
    facts.push(doc.fact('light', true, {
      evidence: '"9 outdoors with court lights for night play". The lights are stated for the nine outdoor courts; the six indoor courts are inside.',
    }))
    facts.push(doc.fact('pricing_notes',
      'The City links a "Reserve a Pickleball Court" button from this venue and says of its courts city-wide that "Some can be reserved for a small fee while others are first-come-first-serve". No price is published.', {
        evidence: '"Reserve a Pickleball Court" on the Riverside Tennis Center tab; "Some can be reserved for a small fee while others are first-come-first-serve." in the page\'s introduction.',
      }))
  }
  if (p.phone) {
    facts.push(doc.fact('phone', p.phone, {
      evidence: `"${p.tab === 'riverside' ? 'Phone: ' : ''}${p.phone}" on the ${tabName} tab, printed with the venue's address.`,
    }))
  }
  if (p.closed) {
    facts.push(doc.fact('hours_of_operation', `${p.closed} - the City lists the centre as "Brewer (Closed for Improvements)" on its pickleball page; no reopening date is stated.`, {
      evidence: `"${p.lines[0]}" on the Recreation Centers tab.`,
    }))
  }

  const res = applyFacts(venue, facts)

  overlay[p.slug] = {
    minted: !imported,
    identity: {
      name: p.name, city: 'Wichita', state: 'KS',
      county: geo.county, postal_code: geo.postal_code ?? null,
      latitude: geo.lat ?? null, longitude: geo.lon ?? null,
      imported_slug: p.importedSlug ?? null,
      canonical_slug: identityRegistry.renames[p.importedSlug]?.canonical ?? p.slug,
    },
    match: {
      source_page: PAGE, quote: p.lines.join(' / '),
      basis: imported
        ? p.slug === 'osage-park'
          ? 'Matched to the imported osage-park-ks row in Wichita, KS, published under the canonical slug osage-park (the identity pass dropped the trailing "-ks", which is already in the path).'
          : p.slug === 'edgemoor-park'
            ? 'Matched to the imported edgemoor-park row (twelve outdoor courts). A second imported row, edgemoor-recreation-center at "5815 E. Ninth Street North", describes the indoor courts at the same address and is left pending rather than published as a second venue; the City\'s two entries at one address publish as one.'
            : p.slug === 'orchard-park-recreation-center'
              ? 'Matched to the imported orchard-park-recreation-center row (which carried 4804 W 9th St N; the City prints 4808). A second imported row, orchard-park-senior-center at 4808, is left pending.'
              : `Matched to the imported ${p.importedSlug} row in Wichita, KS, at the same street address.`
        : p.slug === 'riverside-tennis-center'
          ? 'Minted from the City\'s page. The imported ralph-wulz-riverside-tennis-center row (551 Nims, thirteen courts) describes the same facility under a fuller name and is left pending; the City\'s own page and count publish.'
          : 'Minted from the City\'s page. The imported rows nearest this address (mcadams-rec-center at 1329 E. 16th St., carl-g-brewer-community-center at 1329 E 13th St N) carry other names and are left pending.',
    },
    patch: Object.fromEntries(facts.map(f => [f.field, f.value])),
    provenance: res.provenance,
    record: {
      source_url: res.venue.source_url,
      date_checked: res.venue.date_checked,
      verified_by: res.venue.verified_by,
    },
    needs_recheck: res.needs_recheck,
    recheck: res.recheck,
  }
  changes.push(...changelogToRows(p.slug, res.changelog))
}

/* ---------------------------------------------------------------- */

const totalCourts = ALL.reduce((a, p) => a + p.courts, 0)
const outdoorCourts = Object.values(overlay).reduce((a, e) => a + (e.patch.outdoor_courts ?? 0), 0)
const indoorCourts = Object.values(overlay).reduce((a, e) => a + (e.patch.indoor_courts ?? 0), 0)

for (const [slug, entry] of Object.entries(overlay)) {
  const {total_courts: t, indoor_courts: i, outdoor_courts: o} = entry.patch
  if (i != null && o != null && t !== i + o) throw new Error(`Rule 13: ${slug} does not sum.`)
}
if (outdoorCourts + indoorCourts !== totalCourts) throw new Error('Rule 13: the city does not sum.')

const METHOD_NOTE =
  'Wichita\'s pickleball page states a count for every venue it lists, in three tabs: outdoor park courts, temporary indoor courts in six recreation centres, and the Riverside Tennis Center with nine lit outdoor and six indoor courts stated separately. The page could not be fetched by any script - wichita.gov answers HTTP 403 to a bare request, a full browser header set and the web fetcher - so it was read in a browser and saved as text with a header stating the method, as Cary\'s pages were; this run asserts the header and every quoted line against that file. Indoor and outdoor are the tabs\' own headings and Riverside\'s own words. Edgemoor publishes as one venue with twelve outdoor and three indoor courts at one address. Brewer publishes as closed, in the City\'s words "(Closed for Improvements)". Sherwood Glen is refused for having no address. Surface stays null: "hard / concrete surfaces" is one sentence over four parks with a slash in it, and "wood and tile" the same over six centres. The City says "Some can be reserved for a small fee while others are first-come-first-serve" without saying which, so no fee publishes; its drop-in hours are in PDFs not read.'

mkdirSync(join(REPO_ROOT, 'data/verified'), {recursive: true})
writeFileSync(join(REPO_ROOT, 'data/verified/wichita-ks.json'), JSON.stringify({
  city: 'Wichita', state: 'KS', retrieved_at: RETRIEVED_AT,
  method_note: METHOD_NOTE,
  sources: [
    {url: PAGE, publisher: CITY, tier: 1, format: 'text', snapshot: SNAPSHOT,
      method: 'Read in a browser on 2026-09-07 because wichita.gov returns HTTP 403 to scripted fetches; the three tabs of the court-locations section were opened in turn. See data/sources/wichita/README.md.'},
    {url: CENSUS_URL, publisher: 'US Census Bureau', tier: 1, format: 'json', snapshot: 'data/sources/wichita-county-census.json'},
  ].map((s, i) => ({id: `S${i + 1}`, ...s})),
  totals: {
    venues: ALL.length, courts: totalCourts,
    outdoor: outdoorCourts, indoor: indoorCourts,
    lit_courts: 9, free_venues: 0,
  },
  excluded: EXCLUDED.map(e => ({name: e.name, why: e.reasons})),
  venues: overlay,
}, null, 2) + '\n')

const changed = changes.filter(r =>
  r.old_value !== null && r.old_value !== undefined && String(r.old_value) !== String(r.new_value))

writeFileSync(join(REPO_ROOT, 'reports', 'wichita-conflicts.md'), [
  '# Wichita verification - a page every script is refused, read in a browser', '',
  `Run ${RETRIEVED_AT}. ${ALL.length} venues published, ${totalCourts} courts (${outdoorCourts} outdoor, ${indoorCourts} indoor). ${EXCLUDED.length} venue refused.`, '',
  'Wichita is the first city in Kansas on this site and the first in Sedgwick County. Its source is a text',
  'snapshot read in a browser, because wichita.gov answers 403 to every scripted fetch; see',
  '`data/sources/wichita/README.md`. Every quoted line is asserted against that file.', '',
  '| venue | courts | in | out | tab | what the City writes |',
  '| --- | ---: | ---: | ---: | --- | --- |',
  ...ALL.map(p => `| \`${p.slug}\` | ${p.courts} | ${overlay[p.slug].patch.indoor_courts ?? '-'} | ${overlay[p.slug].patch.outdoor_courts ?? '-'} | ${p.tab} | "${p.lines.join(' / ')}"${p.centreLines ? ` and "${p.centreLines.join(' / ')}"` : ''} |`),
  '',
  '## Edgemoor is one venue', '',
  'The Parks tab lists twelve outdoor courts at 5815 E 9th and the Recreation Centers tab three indoor at',
  '5815 E 9th Street. One address, one venue, fifteen courts, after Bellevue\'s Hidden Valley and Tampa\'s',
  'Forest Hills.',
  '',
  '## Brewer publishes as closed', '',
  '"Brewer (Closed for Improvements)" is how the City prints it. The venue publishes with that notice, as',
  'Thompson Peak Park did during its resurfacing, and the run fails the day the note is removed.',
  '',
  '## Surface is not published', '',
  '"Outdoor courts with hard / concrete surfaces" and "Temporary indoor courts with wood and tile surfaces"',
  'are each one sentence over several venues with two words joined by a slash or an "and". Which venue has',
  'which is not stated, so no venue carries a surface.',
  '',
  '## Refused', '',
  ...EXCLUDED.flatMap(e => [`**${e.name}** - "${e.lines.join(' / ')}"`, '', ...e.reasons.map((r, i) => `${i + 1}. ${r}`), '']),
  '## What Wichita does not say', '',
  '- **which venues are free.** "Some can be reserved for a small fee while others are first-come-first-serve"',
  '  names no venue, so `fee_type` is null everywhere.',
  '- **hours.** Drop-in hours are in two PDFs the City links and this site has not read.',
  '- **lighting** anywhere but Riverside.',
  '',
  changed.length ? '## Values a source changed' : '_No imported row was overwritten._',
  ...(changed.length ? [
    '', '| venue | field | was | now | outcome |', '| --- | --- | --- | --- | --- |',
    ...changed.map(r => `| \`${r.venue_slug}\` | ${r.field} | ${JSON.stringify(r.old_value)} | ${JSON.stringify(r.new_value)} | ${r.outcome} |`),
  ] : []),
  '',
].join('\n'))

console.log(`\nWichita, KS - ${ALL.length} venues, ${totalCourts} courts (${outdoorCourts} outdoor, ${indoorCourts} indoor), retrieved ${RETRIEVED_AT}`)
for (const p of ALL) {
  const o = overlay[p.slug]
  console.log(`  ${o.patch.name.padEnd(28)} ${String(o.patch.total_courts).padStart(2)} | in ${String(o.patch.indoor_courts ?? '-').padStart(2)} out ${String(o.patch.outdoor_courts ?? '-').padStart(2)} | ${o.patch.county} County | ${counties[p.geo].postal_code} | via ${counties[p.geo].resolver}`)
}
console.log(`\n  refused: ${EXCLUDED.map(e => e.name).join(', ')}`)
console.log('\nWrote data/verified/wichita-ks.json and reports/wichita-conflicts.md\n')
