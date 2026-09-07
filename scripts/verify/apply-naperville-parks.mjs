#!/usr/bin/env node
/*
  Naperville, IL verification run - city #25, the first in Illinois, and
  the first city on this site whose operator is a PARK DISTRICT rather than
  a city department.

  ============================================================
  WHY NAPERVILLE, AND WHO THE OPERATOR IS
  ============================================================

  The Naperville Park District is an Illinois special-purpose unit of local
  government with its own board, its own tax levy and its own parks. It is
  not the City of Naperville. It is the body that owns and runs these
  courts, publishes their counts and addresses on its own site, and is
  therefore the tier-1 operator here in exactly the sense a parks department
  is elsewhere. That is recorded on every page rather than blurred into
  "the City".

  The District states its counts in one sentence per location page, under
  an "Amenities / Pickleball" heading, and the sentence carries more than a
  number:

      Nike Sports Complex   "Nike Sports Complex has 4 dedicated pickleball
                             courts and there are 8 lit tennis courts lined
                             for pickleball; participants must provide their
                             own nets"
      Ranchview Park        "The tennis courts have striping for a total of
                             9 pickleball courts. 3 courts on the west side
                             use the tennis nets, 6 courts on the east side
                             require patrons to bring their own nets."
      Ashbury Park          "Ashbury Park has 4 unlit courts using tennis
                             nets"

  Dedicated versus lined, lit versus unlit, nets provided versus bring your
  own, and at Ranchview a SURFACE - "a modular plastic tile system" - which
  only Madison and Portland had given this directory before. The District's
  Park It page (napervilleparks.org/parkit) also states, in one sentence,
  that its courts at six named parks are OUTDOOR; the pickleball page itself
  is programmes and a coach, and names no court.

  ============================================================
  THE COUNTS, AND THE RULES THAT DECIDE THEM
  ============================================================

  Nike: "4 dedicated pickleball courts and there are 8 lit tennis courts
  lined for pickleball". Two figures on one line, and twelve is their sum
  - the Jim Jeffers / Densmore arithmetic, both numbers the operator's. The
  Madison rule settles what the eight are: an unqualified count of courts
  lined for pickleball is a count of courts you can play pickleball on.

  Ranchview: "a total of 9 pickleball courts" is the District's own total
  and publishes as written. The same page also says "Ranchview Park has 6
  unlit courts using tennis nets", and the two sentences disagree about how
  many courts use the tennis nets (six, or "3 courts on the west side").
  Both are asserted; neither changes the nine.

  Ashbury: "4 unlit courts using tennis nets". Four.

  ============================================================
  THREE VENUES REFUSED ON THEIR ADDRESSES, AND IT COSTS 18 COURTS
  ============================================================

  Wolf's Crossing Community Park   "3252 Wolf's Crossing Road" - 4 dedicated
                                   + 4 lined, 8 courts. Neither resolver.
  DuPage River Sports Complex      "2807 S Washington Street" - 4 lined, lit.
                                   Neither resolver.
  Frontier Sports Complex          "3380 Cedar Glade Drive" - the Rothermel
                                   Family Pickleball Courts, "the six new
                                   courts" in a District news release of
                                   16 May 2023; the location page names the
                                   courts and states no number. Neither
                                   resolver finds the address, so the
                                   question of whether a 2023 release can
                                   carry a count (Lincoln's rule says a
                                   record that states a number publishes)
                                   is not reached.

  Three of six candidate venues fail Import Gate I1, which leaves exactly
  the three-venue threshold. Every one of the three refusals is asserted
  against its snapshot and against the resolver file, so the day an
  address resolves the build fails and the venue is re-read.

  Knoch Park is named in the District's Park It sentence and its own page
  carries "Pickleball" as an amenity label and no count: a flag is not a
  number. Fort Hill Activity Center is indoor open-gym pickleball with no
  count stated.

  ============================================================
  WHAT IS NOT CLAIMED
  ============================================================

  light at Nike    The District says its eight lined tennis courts are lit
                   and says nothing about the four dedicated courts. The
                   venue-level answer is therefore unknown, and the venue
                   page says which eight are lit.

  nets at Ranchview  Three courts use the tennis nets, six need your own,
                   and the page's other sentence says six use them. Null,
                   with both sentences on the page.

  fee, hours, play format   Nothing stated. Null.

  county           Per venue, from the resolver: Naperville straddles DuPage
                   and Will Counties, and Ashbury Park is in Will.
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

const OPERATOR = 'Naperville Park District'
const PAGE = 'https://napervilleparks.org/parkit'
const LOC = 'https://napervilleparks.org/location'
const NEWS = 'https://napervilleparks.org/news/Rothermel-family-pickleball-courts-open-for-play-at-frontier-sports-complex'
const CENSUS_URL = 'https://geocoding.geo.census.gov/geocoder/geographies'

const OUTDOOR_SENTENCE = 'The District also has outdoor pickleball courts at Dupage River Sports Complex, Nike Sports Complex, Wolf\'s Crossing and at Ashbury, Knoch and Ranchview parks.'
const FORT_HILL = 'Play pickleball at the Fort Hill Activity Center during an open gym time or register for a pickleball program.'

const VENUES = [
  {
    slug: 'nike-sports-complex', importedSlug: 'nike-sports-complex', name: 'Nike Sports Complex', page: 'nikesportscomplex',
    courts: 12, outdoor: 12, light: null, nets: false, surface: null, restroom: true,
    spec: 'Nike Sports Complex has 4 dedicated pickleball courts and there are 8 lit tennis courts lined for pickleball; participants must provide their own nets',
    address: '288 W Diehl Road', zipLine: '288 W Diehl Road Naperville , IL 60563', cityZip: '60563',
    availability: 'Twelve pickleball courts at the District\'s largest athletic complex, on the north side of the city off Diehl Road, and the twelve is the District\'s own arithmetic: "Nike Sports Complex has 4 dedicated pickleball courts and there are 8 lit tennis courts lined for pickleball". Four courts are pickleball courts in their own right; eight more are tennis courts carrying pickleball lines, and those eight are the ones the District calls lit - it says nothing either way about lighting on the four dedicated courts, so this venue\'s lighting is recorded as unknown with that split stated. The same sentence ends "participants must provide their own nets", so bring one. The complex has restrooms, a paved trail with a loop that connects to the pickleball courts, and its own parking map. The District states no hours, no price and no surface for these courts.',
  },
  {
    slug: 'ranchview-park', importedSlug: null, name: 'Ranchview Park', page: 'ranchviewpark',
    courts: 9, outdoor: 9, light: false, nets: null, surface: 'modular_tile', restroom: null,
    spec: 'The tennis courts have striping for a total of 9 pickleball courts.',
    spec2: '3 courts on the west side use the tennis nets, 6 courts on the east side require patrons to bring their own nets.',
    spec3: 'Ranchview Park has 6 unlit courts using tennis nets',
    surfaceQuote: 'The tennis/pickleball courts have a modular plastic tile system to ensure continuous operation and minimize maintenance.',
    address: '1727 Ranchview Drive', zipLine: '1727 Ranchview Drive Naperville , IL 60565', cityZip: '60565',
    availability: 'Nine pickleball courts striped onto the tennis courts of a south-side neighbourhood park, in the District\'s own total: "The tennis courts have striping for a total of 9 pickleball courts." The courts are unlit - the District writes "6 unlit courts" - so this is daylight play. Nets are the thing to plan for, and the District\'s page says two different things about them: "3 courts on the west side use the tennis nets, 6 courts on the east side require patrons to bring their own nets", and, in another sentence, "6 unlit courts using tennis nets". Both are printed here and neither is resolved; bring a portable net and you are covered either way. This is also one of very few venues in this directory with a stated surface: the courts sit on "a modular plastic tile system", which the District explains it chose because the courts stand on the roof of a concrete reservoir whose moisture made painted coatings fail early. No hours, price or restrooms are stated.',
  },
  {
    slug: 'ashbury-park', importedSlug: null, name: 'Ashbury Park', page: 'ashburypark',
    courts: 4, outdoor: 4, light: false, nets: true, surface: null, restroom: null,
    spec: 'Ashbury Park has 4 unlit courts using tennis nets',
    address: '1740 Conan Doyle Road', zipLine: '1740 Conan Doyle Road Naperville , IL 60564', cityZip: '60564',
    availability: 'Four pickleball courts on the tennis courts of a neighbourhood park in the far south-west of the city, in one District sentence: "Ashbury Park has 4 unlit courts using tennis nets". Three facts in seven words. The courts are unlit, so play ends with the light; they use the tennis nets, so there is nothing to bring; and there are four of them, enough for two games at once. The District\'s Ranchview page adds, in passing, that "The tennis courts at Ashbury Park have a cushioned overlay system over asphalt" - a surface remark made about the tennis courts on another park\'s page, and not published as this venue\'s surface. Ashbury is the one published Naperville venue the Census places in Will County rather than DuPage. No hours or price are stated; the park lists parking spaces and fishing ponds among its amenities.',
  },
]

const EXCLUDED = [
  {
    name: 'Wolf\'s Crossing Community Park', page: 'wolfscrossingcommunitypark', geoKey: 'wolfs-crossing-community-park',
    spec: 'Wolf\'s Crossing Community Park has 4 dedicated pickleball courts and there are 4 lit tennis courts lined for pickleball; participants must provide their own nets',
    address: '3252 Wolf\'s Crossing Road',
    reasons: [
      'Neither address resolver finds "3252 Wolf\'s Crossing Road": the US Census address file returns no match and OpenStreetMap returns nothing at house-number level. Import Gate I1 requires a street address that resolves.',
      'Eight courts - "4 dedicated pickleball courts and there are 4 lit tennis courts lined for pickleball" - and the District\'s page prints the postcode 60543, which is Oswego\'s rather than Naperville\'s; the park sits at the city\'s southern edge. It fails on its address alone.',
    ],
  },
  {
    name: 'DuPage River Sports Complex', page: 'dupageriversportscomplex', geoKey: 'dupage-river-sports-complex',
    spec: 'Dupage River Sports Complex has 4 lit tennis courts lined for pickleball; participants must provide their own nets',
    address: '2807 S Washington Street',
    reasons: [
      'Neither address resolver finds "2807 S Washington Street", the address the District prints for it. Import Gate I1.',
      'Four lit courts on lined tennis courts, with the District\'s bring-your-own-net note. The imported dataset holds this venue at the same address with eight courts; the District says four, and neither publishes while the address does not resolve.',
    ],
  },
  {
    name: 'Frontier Sports Complex', page: 'frontiersportscomplex', geoKey: 'frontier-sports-complex',
    spec: 'Rothermel Family Pickleball Courts',
    newsQuote: 'Located on the east side of Frontier Sports Complex, the six new courts provide another place to play this popular sport.',
    address: '3380 Cedar Glade Drive',
    reasons: [
      'Neither address resolver finds "3380 Cedar Glade Drive". Import Gate I1.',
      'The location page names the "Rothermel Family Pickleball Courts" and states no number; the number - "the six new courts" - is in a District news release dated Tuesday, May 16, 2023. Lincoln\'s rule would let a record that states a number publish, and a two-year-old release would need saying so on the page; the address failure means that question is not reached.',
    ],
  },
  {
    name: 'Knoch Park', page: 'knochpark', geoKey: null,
    spec: 'Pickleball', address: '724 S. West Street',
    reasons: [
      'The District names Knoch Park on its Park It page as a place with outdoor pickleball courts, and the park\'s own page lists "Pickleball" among its amenities with no number. A flag is not a number, and Page Gate 1 requires a stated count.',
    ],
  },
  {
    name: 'Fort Hill Activity Center', page: null, geoKey: null,
    spec: FORT_HILL, address: null,
    reasons: [
      'Indoor open-gym pickleball: "Play pickleball at the Fort Hill Activity Center during an open gym time or register for a pickleball program." No court count is stated anywhere the District publishes.',
    ],
  },
]

/* ---------------------------------------------------------------- */

const snapshotPath = name => `data/sources/naperville/${name}.html`

const linesOf = rel => readFileSync(join(REPO_ROOT, rel), 'utf8')
  .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
  .replace(/<[^>]+>/g, '\n')
  .replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&#0?39;|&apos;|&lsquo;|&rsquo;|&#8217;|[‘’]/g, "'")
  .replace(/&quot;|&ldquo;|&rdquo;|[“”]/g, '"')
  .replace(/&#8211;|&#8212;|&ndash;|&mdash;|[–—‑]/g, '-')
  .split('\n').map(s => s.trim()).filter(Boolean)

const squeeze = s => s.replace(/\s+/g, '')
const textOf = name => squeeze(linesOf(snapshotPath(name)).join(' '))

const must = (page, who, needle, what) => {
  if (!textOf(page).includes(squeeze(needle))) {
    throw new Error(`${who}: the ${page} snapshot no longer contains the ${what} text "${needle}".`)
  }
}

/* The District's own outdoor sentence, and its indoor one, both on its Park It page. */
must('parkit', 'Naperville', OUTDOOR_SENTENCE, 'outdoor-courts sentence')
must('parkit', 'Naperville', FORT_HILL, 'Fort Hill sentence')

const counties = {
  ...JSON.parse(readFileSync(join(REPO_ROOT, 'data/sources/naperville-county-census.json'), 'utf8')),
  ...JSON.parse(readFileSync(join(REPO_ROOT, 'data/sources/naperville-ashbury-county-census.json'), 'utf8')),
}

/* ---------------------------------------------------------------- */
/* THE REFUSALS, ASSERTED RATHER THAN REMEMBERED.                    */

for (const e of EXCLUDED) {
  if (e.page) {
    must(e.page, e.name, e.spec, 'what the District says about the refused venue')
    if (e.address) must(e.page, e.name, e.address, 'address of the refused venue')
  } else {
    must('parkit', e.name, e.spec, 'what the District says about the refused venue')
  }
  if (e.geoKey && counties[e.geoKey]?.matched) {
    throw new Error(`${e.name} now resolves. The address ground for excluding it has gone: re-read and publish it.`)
  }
}
must('rothermel-news', 'Frontier Sports Complex', EXCLUDED[2].newsQuote, 'six-court sentence in the 2023 release')
must('rothermel-news', 'Frontier Sports Complex', 'Tuesday, May 16, 2023', 'date of the release')
/* Frontier's location page must still be silent on the number; a count there changes the venue's standing. */
if (/\b(\d+|six|four|eight)\s+(new\s+)?(pickleball\s+)?courts\b/i.test(linesOf(snapshotPath('frontiersportscomplex')).filter(l => /pickleball/i.test(l)).join(' '))) {
  throw new Error('Frontier Sports Complex\'s location page now states a court count. Re-read it.')
}
/* Knoch must still carry only the label. */
if (/\d+\s+(dedicated\s+|unlit\s+|lit\s+)?(pickleball\s+)?courts?/i.test(linesOf(snapshotPath('knochpark')).filter(l => /pickleball/i.test(l)).join(' '))) {
  throw new Error('Knoch Park\'s page now states a court count. Re-read and publish it.')
}

const identityRegistry = loadIdentity(REPO_ROOT)
const allRows = loadRows().map(r => mapRow(r).venue)
const bySlug = new Map(
  allRows.filter(v => v.city === 'Naperville' && String(v.state).toUpperCase() === 'IL')
    .map(v => [v.slug, v]))

const overlay = {}
const changes = []

for (const p of VENUES) {
  must(p.page, p.slug, p.spec, 'court count sentence')
  if (p.spec2) must(p.page, p.slug, p.spec2, 'nets sentence')
  if (p.spec3) must(p.page, p.slug, p.spec3, 'other count sentence')
  if (p.surfaceQuote) must(p.page, p.slug, p.surfaceQuote, 'surface sentence')
  must(p.page, p.slug, p.zipLine, 'address on the location page')
  if (p.restroom) must(p.page, p.slug, 'Restrooms', 'restrooms in the amenity list')
  must('parkit', p.slug, p.name.replace(' Community Park', '').replace(' Park', ''), 'name in the outdoor-courts sentence')

  const geo = counties[p.slug]
  if (!geo?.matched) throw new Error(`${p.slug}: no address resolver matched its address`)
  if (!geo.place_matches_city) {
    throw new Error(`${p.slug}: the resolver places this at "${geo.place}", not Naperville.`)
  }
  if (geo.postal_code !== p.cityZip) {
    throw new Error(`${p.slug}: the resolver's postcode ${geo.postal_code} differs from the District's ${p.cityZip}.`)
  }

  const doc = new SourceDocument({
    url: PAGE, retrieved_at: RETRIEVED_AT, tier: 1, publisher: OPERATOR, format: 'html',
  })
  const docLoc = new SourceDocument({
    url: `${LOC}/${p.page}`, retrieved_at: RETRIEVED_AT, tier: 1, publisher: OPERATOR, format: 'html',
  })
  const docCensus = new SourceDocument({
    url: CENSUS_URL, retrieved_at: RETRIEVED_AT, tier: 1, publisher: 'US Census Bureau', format: 'json',
  })

  const shell = {
    slug: p.slug, name: null, city: 'Naperville', state: 'IL', county: null,
    postal_code: null, street_address: null, latitude: null, longitude: null,
    status: 'pending', source_url: null, date_checked: null, verified_by: null,
    claimed_by_owner: false, claim_date: null,
    rating: null, user_rating: null, review_count: null, claimed_or_verified: null,
    source_sport: 'pickleball',
  }
  for (const f of PUBLISHED_FACT_FIELDS) shell[f] = null
  const imported = p.importedSlug ? bySlug.get(p.importedSlug) : undefined
  const venue = imported ?? shell

  const facts = [
    docLoc.fact('name', p.name, {
      evidence: `Named "${p.name}" on the ${OPERATOR}'s location page, and on its Park It page.`,
    }),
    docLoc.fact('total_courts', p.courts, {
      evidence: p.slug === 'nike-sports-complex'
        ? `The District's own two figures on one line: "${p.spec}". Twelve is their sum - four dedicated courts plus eight tennis courts lined for pickleball, which the Madison rule counts as courts you can play on.`
        : p.slug === 'ranchview-park'
          ? `The District's own total: "${p.spec}" The same page also reads "${p.spec3}" and "${p.spec2}", which disagree about the nets and not about the nine.`
          : `Quoted from the District's location page: "${p.spec}".`,
    }),
    docLoc.fact('street_address', p.address, {
      evidence: `"${p.zipLine}" on the District's location page.`,
    }),
    docLoc.fact('venue_type', 'public_park', {evidence: `Published by the ${OPERATOR}, the special-purpose local government that owns and runs Naperville's parks, among its park locations.`}),
    doc.fact('outdoor_courts', p.outdoor, {
      evidence: `The District's Park It page: "${OUTDOOR_SENTENCE}" - this park is one of the six it names.`,
    }),
    docLoc.fact('court_availability', p.availability, {
      evidence: `From the District's location page ("${p.spec}") and its Park It page ("${OUTDOOR_SENTENCE}").`,
    }),
    docCensus.fact('county', geo.county, {
      evidence: `${geo.county} County, IL${geo.county_fips ? ` (FIPS ${geo.state_fips}${geo.county_fips})` : ''}. ${geo.basis} The resolver also places it in the incorporated place "${geo.place}", which is what allows it to be published under Naperville.`,
    }),
    docCensus.fact('postal_code', geo.postal_code, {evidence: geo.basis}),
  ]

  if (p.light === true) {
    facts.push(docLoc.fact('light', true, {evidence: `"lit" is the District's word: "${p.spec}".`}))
  } else if (p.light === false) {
    facts.push(docLoc.fact('light', false, {
      evidence: `A stated negative in the District's own word, "unlit": "${p.spec3 ?? p.spec}".`,
    }))
  }
  if (p.nets === false) {
    facts.push(docLoc.fact('nets_provided', false, {
      evidence: `"participants must provide their own nets", in the District's count sentence: "${p.spec}".`,
    }))
  } else if (p.nets === true) {
    facts.push(docLoc.fact('nets_provided', true, {
      evidence: `"using tennis nets", in the District's count sentence: "${p.spec}". The tennis net is there; it is a tennis net, at tennis height.`,
    }))
  }
  if (p.surface) {
    facts.push(docLoc.fact('surface', p.surface, {
      evidence: `"${p.surfaceQuote}" - the District's own description of the tennis/pickleball courts, published because the courts stand on the roof of a concrete reservoir whose moisture made painted coatings fail early.`,
    }))
  }
  if (p.restroom) {
    facts.push(docLoc.fact('restroom', true, {evidence: 'Listed as "Restrooms" among the location\'s amenities on its own page.'}))
  }

  const res = applyFacts(venue, facts)

  overlay[p.slug] = {
    minted: !imported,
    identity: {
      name: p.name, city: 'Naperville', state: 'IL',
      county: geo.county, postal_code: geo.postal_code ?? null,
      latitude: geo.lat ?? null, longitude: geo.lon ?? null,
      imported_slug: p.importedSlug ?? null,
      canonical_slug: identityRegistry.renames[p.importedSlug]?.canonical ?? p.slug,
    },
    match: {
      source_page: `${LOC}/${p.page}`, quote: p.spec,
      basis: imported
        ? `Matched to the imported ${p.importedSlug} row in Naperville, IL, at the same street address and with the same count of twelve.`
        : p.slug === 'ranchview-park'
          ? 'Minted here from the District\'s own page. The imported dataset holds this park as naperville-park-district-ranchview-park with three courts; the District says nine, and that row is left pending rather than published as a second venue.'
          : 'No imported row for this park. Minted here from the District\'s own page, which states the count and the address.',
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

const totalCourts = VENUES.reduce((a, p) => a + p.courts, 0)
const outdoorCourts = VENUES.reduce((a, p) => a + (p.outdoor ?? 0), 0)
const litCourts = VENUES.filter(p => p.light === true).reduce((a, p) => a + p.courts, 0)
const unlitCourts = VENUES.filter(p => p.light === false).reduce((a, p) => a + p.courts, 0)

for (const [slug, entry] of Object.entries(overlay)) {
  const {total_courts: t, indoor_courts: i, outdoor_courts: o} = entry.patch
  if (i != null && o != null && t !== i + o) {
    throw new Error(`Rule 13: ${slug} does not sum.`)
  }
}

const METHOD_NOTE =
  'Naperville is the first city on this site whose operator is a park district rather than a city department: the Naperville Park District, an Illinois special-purpose local government with its own board and levy, owns and runs these parks and publishes their courts on its own site, and it is the tier-1 operator here in the same sense a parks department is elsewhere. It states a count in one sentence per location page and the sentence carries more than a number - "4 dedicated pickleball courts and there are 8 lit tennis courts lined for pickleball; participants must provide their own nets" at Nike, "a total of 9 pickleball courts" on "a modular plastic tile system" at Ranchview, "4 unlit courts using tennis nets" at Ashbury - and its Park It page says in one sentence that the courts at six named parks are outdoor. Three of the six candidate venues are refused on their addresses, which neither resolver finds: Wolf\'s Crossing Community Park (eight courts, printed with an Oswego postcode), DuPage River Sports Complex (four lit) and Frontier Sports Complex, whose six Rothermel Family courts are counted only in a District news release of May 2023. That leaves exactly the three-venue threshold and 25 courts. Knoch Park carries a label and no number; Fort Hill Activity Center is indoor open gym with no count. Ranchview\'s page says two different things about which courts use the tennis nets, both printed and neither resolved; Nike\'s lighting is stated for its eight lined courts and not its four dedicated ones, so the venue\'s lighting stays unknown with the split on the page. Nothing is stated about fees or hours anywhere.'

mkdirSync(join(REPO_ROOT, 'data/verified'), {recursive: true})
writeFileSync(join(REPO_ROOT, 'data/verified/naperville-il.json'), JSON.stringify({
  city: 'Naperville', state: 'IL', retrieved_at: RETRIEVED_AT,
  method_note: METHOD_NOTE,
  sources: [
    {url: PAGE, publisher: OPERATOR, tier: 1, format: 'html', snapshot: snapshotPath('parkit')},
    ...VENUES.map(p => ({
      url: `${LOC}/${p.page}`, publisher: OPERATOR, tier: 1, format: 'html', snapshot: snapshotPath(p.page),
    })),
    ...EXCLUDED.filter(e => e.page).map(e => ({
      url: `${LOC}/${e.page}`, publisher: OPERATOR, tier: 1, format: 'html', snapshot: snapshotPath(e.page),
    })),
    {url: NEWS, publisher: OPERATOR, tier: 1, format: 'html', snapshot: snapshotPath('rothermel-news')},
    {url: CENSUS_URL, publisher: 'US Census Bureau', tier: 1, format: 'json', snapshot: 'data/sources/naperville-county-census.json'},
    {url: CENSUS_URL, publisher: 'US Census Bureau', tier: 1, format: 'json', snapshot: 'data/sources/naperville-ashbury-county-census.json'},
  ].map((s, i) => ({id: `S${i + 1}`, ...s})),
  totals: {
    venues: VENUES.length, courts: totalCourts,
    outdoor: outdoorCourts, indoor: null,
    lit_courts: litCourts, unlit_courts_stated: unlitCourts,
    free_venues: 0,
  },
  excluded: EXCLUDED.map(e => ({name: e.name, why: e.reasons})),
  venues: overlay,
}, null, 2) + '\n')

const changed = changes.filter(r =>
  r.old_value !== null && r.old_value !== undefined && String(r.old_value) !== String(r.new_value))

writeFileSync(join(REPO_ROOT, 'reports', 'naperville-conflicts.md'), [
  '# Naperville verification - a park district that states dedicated, lit, nets and a surface, and three addresses that do not resolve', '',
  `Run ${RETRIEVED_AT}. ${VENUES.length} venues published, ${totalCourts} courts. ${EXCLUDED.length} venues refused.`, '',
  'Naperville is the first city in Illinois on this site and the first whose operator is a park district: the Naperville',
  'Park District, not the City of Naperville, owns and runs these parks.', '',
  '| venue | courts | out | lit | nets provided | surface | what the District writes | address |',
  '| --- | ---: | ---: | --- | --- | --- | --- | --- |',
  ...VENUES.map(p => `| \`${p.slug}\` | ${p.courts} | ${p.outdoor} | ${p.light === true ? 'yes' : p.light === false ? '**no (stated)**' : 'not stated'} | ${p.nets === true ? 'yes' : p.nets === false ? '**no (stated)**' : 'not stated'} | ${p.surface ?? 'not stated'} | "${p.spec}" | ${p.address}, ${counties[p.slug].postal_code} (${counties[p.slug].county} County) |`),
  '',
  '## Three addresses, eighteen courts, and Import Gate I1', '',
  'Neither the US Census address file nor OpenStreetMap resolves "3252 Wolf\'s Crossing Road", "2807 S Washington Street" or',
  '"3380 Cedar Glade Drive" at house-number level. Wolf\'s Crossing is printed by the District with the postcode 60543, which is',
  'Oswego\'s; the park sits at the city\'s southern edge. Each refusal is asserted against the resolver file, so a venue publishes',
  'the day its address resolves.',
  '',
  '## Refused', '',
  ...EXCLUDED.flatMap(e => [
    `**${e.name}** - "${e.spec}"${e.address ? ` - ${e.address}` : ''}`, '',
    ...e.reasons.map((r, i) => `${i + 1}. ${r}`), '']),
  '## Ranchview\'s page disagrees with itself about the nets', '',
  '"Ranchview Park has 6 unlit courts using tennis nets" and, two lines later, "3 courts on the west side use the tennis nets, 6',
  'courts on the east side require patrons to bring their own nets." Both are asserted and `nets_provided` stays null. The count',
  'of nine and the word "unlit" are not in dispute.',
  '',
  '## What Naperville does not say', '',
  '- **lighting on Nike\'s four dedicated courts.** "8 lit tennis courts lined for pickleball" is stated; the four are not. The',
  '  venue\'s `light` stays null.',
  '- **fee, hours, play format.** Nothing stated anywhere.',
  '- **indoor.** Fort Hill Activity Center\'s open-gym pickleball has no count.',
  '',
  changed.length ? '## Values a source changed' : '_No imported row was overwritten._',
  ...(changed.length ? [
    '', '| venue | field | was | now | outcome |', '| --- | --- | --- | --- | --- |',
    ...changed.map(r => `| \`${r.venue_slug}\` | ${r.field} | ${JSON.stringify(r.old_value)} | ${JSON.stringify(r.new_value)} | ${r.outcome} |`),
  ] : []),
  '',
].join('\n'))

console.log(`\nNaperville, IL - ${VENUES.length} venues, ${totalCourts} courts (${outdoorCourts} outdoor), retrieved ${RETRIEVED_AT}`)
for (const p of VENUES) {
  const o = overlay[p.slug]
  console.log(
    `  ${o.patch.name.padEnd(22)} ${String(o.patch.total_courts).padStart(2)} | ${(p.light === true ? 'lit' : p.light === false ? 'NO lights (stated)' : 'lighting not stated').padEnd(19)} | nets ${p.nets === true ? 'yes' : p.nets === false ? 'NO (stated)' : 'not stated'} | ${o.patch.county} County | ${counties[p.slug].postal_code} | via ${counties[p.slug].resolver}`)
}
console.log(`\n  refused: ${EXCLUDED.map(e => e.name).join(', ')}`)
console.log('\nWrote data/verified/naperville-il.json and reports/naperville-conflicts.md\n')
