#!/usr/bin/env node
/*
  San Antonio, TX verification run - city #20, Texas's second city after
  Austin and the first in Bexar County.

  ============================================================
  THE CITY SAYS OUTDOOR, INDOOR AND LIGHTED IN THE SAME SENTENCE
  ============================================================

  The City's pickleball directory page lists its venues with a street
  address and park hours, and each park's own page states the count in a
  sentence under "Featured Amenities":

      Fairchild Park          "There are 18 lighted, outdoor pickleball courts."
      Garza Park              "There are two outdoor pickleball courts."
      Monterrey Park          "There are eight outdoor pickleball courts."
      Normoyle Park           "There are four outdoor pickleball courts."
      Oak Haven Park          "There is one outdoor pickleball court."
      Palm Heights Park       "There are 2 indoor pickleball courts."
      Piazza Italia Park      "There is one outdoor pickleball court."
      Pittman-Sullivan Park   "There are two outdoor pickleball courts."
      Tejeda Park             "There are 6 lighted, pickleball courts."

  Outdoor or indoor is a word in the sentence, not an inference from a
  heading, at every venue but Tejeda - whose sentence says "lighted" and not
  "outdoor". Tejeda's breakdown therefore stays null, which costs the city
  nothing it can honestly claim. Lighting is stated at two venues, and the
  directory page's own caveat - "Some courts are not lighted." - is the
  reason the other seven stay null rather than being read either way. Where
  a park page says "The tennis court is not lighted", that is about tennis.

  Every park is open "Sunday - Saturday: 5 a.m. - 11 p.m." on the directory
  page, Fairchild's page adds "All tennis courts and pickleball courts are
  open during park hours", and the directory page says "All other courts are
  available during park hours" and "These are available on a first-come,
  first-served basis". So hours and play format are stated for every venue.

  ============================================================
  FAIRCHILD PARK IS THE SECOND-LARGEST VENUE IN THE DIRECTORY
  ============================================================

  Eighteen lighted outdoor courts, stated in one sentence. Only Mesa's
  Tennis & Pickleball Center (21) is larger among published venues, and
  Fairchild is the largest venue anywhere on this site where the City
  states that every court is lit and outdoor.

  ============================================================
  WHAT IS REFUSED
  ============================================================

  Piazza Italia Park        One outdoor court at "500 Columbus", an address
                            with no street type. Neither resolver finds it.
                            Import Gate I1.

  Hamilton Community        Listed on the directory page with an address,
  Center                    facility hours and its own pickleball window -
                            "Courts at Hamilton Community Center are
                            available Saturday, 10 a.m. - 2 p.m." - and no
                            count anywhere. The address resolves. A venue
                            fails on the fact it is missing.

  ============================================================
  THE PAGE WAS FETCHED WITH A BROWSER HEADER SET
  ============================================================

  www.sa.gov answered a bare curl with HTTP 200 during the search for this
  city and with HTTP 403 twenty minutes later. It serves the document to a
  request carrying a full browser header set, so
  scripts/verify/fetch/san-antonio.sh is the fetcher of record, after
  Lincoln's. A 403 is a fact about one day; this one was a fact about one
  quarter of an hour.

  ============================================================
  WHAT IS NOT CLAIMED
  ============================================================

  fee_type     "first-come, first-served" is a play format, not a price.
               The City never writes "free". Null.
  surface      Not stated.
  restrooms    Stated in the amenity list at four parks: Normoyle, Piazza
               Italia (refused), Pittman-Sullivan and Tejeda. Published
               where stated.
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

const CITY = 'City of San Antonio Parks & Recreation'
const PAGE = 'https://www.sa.gov/Directory/Departments/Parks/Programs-Classes/Sports/Pickleball'
const PARK_BASE = 'https://www.sa.gov/Directory/Departments/Parks/Parks-Facilities/Parks/Directory'
const CENSUS_URL = 'https://geocoding.geo.census.gov/geocoder/geographies'

const INTRO = 'There are several indoor and outdoor pickleball courts at our parks across the city. These are available on a first-come, first-served basis. Some courts are not lighted.'
const HAMILTON = 'Courts at Hamilton Community Center are available Saturday, 10 a.m. - 2 p.m.'
const PARK_HOURS_RULE = 'All other courts are available during park hours.'
const PARK_HOURS = 'Sunday - Saturday: 5 a.m. - 11 p.m.'
const FIRST_COME = 'All amenities are first come, first served'

const VENUES = [
  {
    slug: 'fairchild-park', importedSlug: null, name: 'Fairchild Park', page: 'fairchild-park',
    courts: 18, outdoor: 18, light: true,
    spec: 'There are 18 lighted, outdoor pickleball courts.',
    address: '1214 E Crockett St', listLine: '1214 E Crockett St, San Antonio, TX 78202', cityZip: '78202',
    extra: 'All tennis courts and pickleball courts are open during park hours.',
    availability: 'Eighteen lighted outdoor pickleball courts on the east side of the city, stated in one sentence on the park\'s own page: "There are 18 lighted, outdoor pickleball courts." That is the second-largest single-venue count on this site after Mesa\'s Tennis & Pickleball Center, and the largest anywhere here where the operator states that every court is both lit and outdoor. The same page carries ten lighted outdoor tennis courts and its own hours rule - "All tennis courts and pickleball courts are open during park hours" - and the City\'s directory gives the park hours as 5 a.m. to 11 p.m. every day. First come, first served, in the City\'s words on both pages. Eighteen courts under lights until eleven at night is a rotation that can absorb almost any number of players; nothing else in San Antonio is in the same class. The pool on the site is closed until the 2027 season, which the City states on the directory page. Price and surface are not stated.',
  },
  {
    slug: 'garza-park', importedSlug: null, name: 'Garza Park', page: 'garza-park',
    courts: 2, outdoor: 2, light: null,
    spec: 'There are two outdoor pickleball courts.',
    address: '1450 Mira Vista', listLine: '1450 Mira Vista, San Antonio, TX 78228', cityZip: '78228',
    availability: 'Two outdoor pickleball courts in a 21.5-acre park on the west side that the City\'s own page dates to 1972 and names for Mayor Pro Tem Gilbert Garza. The count is the City\'s sentence: "There are two outdoor pickleball courts." The page says the outdoor TENNIS courts are lighted and says nothing about lighting on the pickleball courts, so lighting here is recorded as unknown - the City\'s directory page warns that "Some courts are not lighted", which is exactly why a silence is not read as a yes. Park hours are 5 a.m. to 11 p.m. daily and the courts are first come, first served. Two courts is a game rather than a rotation. Price and surface are not stated.',
  },
  {
    slug: 'monterrey-park', importedSlug: null, name: 'Monterrey Park', page: 'monterrey-park',
    courts: 8, outdoor: 8, light: null,
    spec: 'There are eight outdoor pickleball courts.',
    address: '5909 W Commerce St', listLine: '5909 W Commerce St, San Antonio, TX 78237', cityZip: '78237',
    availability: 'Eight outdoor pickleball courts on a 51-acre west-side park the City established in 1962 and renamed for its Mexican sister city the following year. "There are eight outdoor pickleball courts," the park\'s page says, which makes Monterrey the second-largest published venue in San Antonio after Fairchild. The page states that the tennis court is not lighted and says nothing about the pickleball courts, so their lighting stays unknown. Park hours 5 a.m. to 11 p.m. daily; first come, first served. Eight courts is enough for a rotation. Price and surface are not stated.',
  },
  {
    slug: 'normoyle-park', importedSlug: null, name: 'Normoyle Park', page: 'normoyle-park',
    courts: 4, outdoor: 4, light: null, restroom: true,
    spec: 'There are four outdoor pickleball courts.',
    address: '700 Culberson Ave', listLine: '700 Culberson Ave, San Antonio, TX 78225', cityZip: '78225',
    availability: 'Four outdoor pickleball courts on the south-west side, in the City\'s sentence "There are four outdoor pickleball courts." The park has restrooms, listed among its amenities. Its tennis court is stated not to be lighted; the pickleball courts carry no lighting statement either way and are recorded as unknown. The City\'s directory gives the park hours as 5 a.m. to 11 p.m. daily; the "Saturday & Sunday: 1 - 8 p.m." beneath them is labelled "Pool Hours:" and belongs to the pool, not the courts. First come, first served. Price and surface are not stated.',
    poolHours: 'Saturday & Sunday: 1 - 8 p.m.',
  },
  {
    slug: 'oak-haven-park', importedSlug: null, name: 'Oak Haven Park', page: 'oak-haven-park',
    courts: 1, outdoor: 1, light: null,
    spec: 'There is one outdoor pickleball court.',
    address: '2215 Rest Haven Dr', listLine: '2215 Rest Haven Dr, San Antonio, TX 78232', cityZip: '78232',
    otherAddress: '16400 Parkstone',
    availability: 'One outdoor pickleball court in a north-side neighbourhood park, in the City\'s words "There is one outdoor pickleball court." The page states that the tennis court is lighted until 9 p.m. and says nothing about the pickleball court\'s lighting, so that stays unknown. Park hours 5 a.m. to 11 p.m. daily; first come, first served. One court is one game. Price and surface are not stated.',
  },
  {
    slug: 'palm-heights-park', importedSlug: null, name: 'Palm Heights Park', page: 'palm-heights-park',
    courts: 2, indoor: 2, light: null,
    spec: 'There are 2 indoor pickleball courts.',
    address: '1201 W Malone', listLine: '1201 W Malone, San Antonio, TX 78225', cityZip: '78225',
    availability: 'Two indoor pickleball courts, the only indoor pickleball the City of San Antonio counts, in the gymnasium at Palm Heights Park on the south-west side. The City\'s page reads "There are 2 indoor pickleball courts." and its history of the 1.72-acre park records the gymnasium being added in 1977. Indoor courts in a City gym are governed by the building rather than the sky; the City\'s directory gives park hours of 5 a.m. to 11 p.m. and states no separate gym schedule for pickleball, so this page prints the park hours and says so. First come, first served. Price and surface are not stated.',
  },
  {
    slug: 'pittman-sullivan-park', importedSlug: null, name: 'Pittman-Sullivan Park', page: 'pittman-sullivan-park',
    courts: 2, outdoor: 2, light: null, restroom: true,
    spec: 'There are two outdoor pickleball courts.',
    address: '1101 Iowa St', listLine: '1101 Iowa St, San Antonio, TX 78203', cityZip: '78203',
    availability: 'Two outdoor pickleball courts on the east side, "There are two outdoor pickleball courts." on the City\'s page, with restrooms in the park\'s amenity list. The tennis court is stated not to be lighted; the pickleball courts have no lighting statement and are recorded as unknown. Park hours 5 a.m. to 11 p.m. daily; first come, first served. Price and surface are not stated.',
  },
  {
    slug: 'tejeda-park', importedSlug: null, name: 'Tejeda Park', page: 'tejeda-park',
    courts: 6, outdoor: null, light: true, restroom: true,
    spec: 'There are 6 lighted, pickleball courts.',
    address: '541 Division', listLine: '541 Division, San Antonio, TX 78214', cityZip: '78214',
    availability: 'Six lighted pickleball courts on the south side, in a park of 8.76 acres the City renamed for Congressman Frank Tejeda in 1996. The count and the lighting are one City sentence: "There are 6 lighted, pickleball courts." It is the only San Antonio park page that says "lighted" of its pickleball courts without also saying "outdoor", so this venue publishes six courts and a lighting answer and leaves the indoor/outdoor breakdown unstated - the cost of quoting an operator rather than completing its sentence. The tennis courts are lighted too, and the park has restrooms. Park hours 5 a.m. to 11 p.m. daily; first come, first served. Price and surface are not stated.',
  },
]

const EXCLUDED = [
  {
    name: 'Piazza Italia Park', page: 'piazza-italia-park',
    spec: 'There is one outdoor pickleball court.',
    address: '500 Columbus', listLine: '500 Columbus, San Antonio, TX 78207',
    reasons: [
      'Neither address resolver finds "500 Columbus": the US Census address file returns no match and OpenStreetMap returns nothing at house-number level. The City writes the address without a street type on both its directory page and the park\'s own page. Import Gate I1 requires a street address that resolves.',
      'One outdoor court, restrooms in the amenity list, and park hours stated. It fails on its address alone.',
    ],
  },
  {
    name: 'Hamilton Community Center', page: null,
    spec: HAMILTON,
    address: '10700 Nacogdoches Rd', listLine: '10700 Nacogdoches Rd., San Antonio, TX 78217',
    reasons: [
      'The City states no court count. The directory page lists the centre with its address and facility hours and gives its pickleball window - "Courts at Hamilton Community Center are available Saturday, 10 a.m. - 2 p.m." - and the number of courts appears nowhere. Page Gate 1 requires a stated count.',
      'The address resolves in the City of San Antonio. The venue fails on the one fact it is missing, as Mesa\'s six parks and Cape Coral\'s Four Freedoms did.',
    ],
  },
]

/* ---------------------------------------------------------------- */

const snapshotPath = name => `data/sources/san-antonio/${name}.html`

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

/* The city-wide statements. */
for (const [needle, what] of [
  [INTRO, 'introduction, first-come rule and lighting caveat'],
  [HAMILTON, 'Hamilton window'],
  [PARK_HOURS_RULE, 'park-hours rule'],
  ['11 Result(s) Found', 'result count'],
]) {
  must('pickleball', 'San Antonio', needle, what)
}

/*
  Each directory entry is asserted as a block: the name, then the address
  line, then "Park Hours:" and the hours. The directory says eleven results;
  ten are listed on the page it serves, and its pager returns the same page
  for page 2, so the eleventh is not readable here. That is stated rather
  than hidden, and the count is asserted so a change is noticed.
*/
const list = linesOf(snapshotPath('pickleball'))
function assertEntry(who, name, listLine, hours = PARK_HOURS) {
  const at = list.findIndex((l, i) => squeeze(l) === squeeze(name) && squeeze(list[i + 1] ?? '') === squeeze(listLine))
  if (at < 0) throw new Error(`${who}: the directory page no longer lists "${name}" at "${listLine}".`)
  if (hours && squeeze(list[at + 3] ?? '') !== squeeze(hours)) {
    throw new Error(`${who}: the directory page no longer gives "${hours}" for "${name}" (reads "${list[at + 3]}").`)
  }
}

const counties = JSON.parse(
  readFileSync(join(REPO_ROOT, 'data/sources/san-antonio-county-census.json'), 'utf8'))

/* ---------------------------------------------------------------- */
/* THE REFUSALS, ASSERTED RATHER THAN REMEMBERED.                    */

assertEntry('Piazza Italia Park', 'Piazza Italia Park', '500 Columbus, San Antonio, TX 78207')
must('piazza-italia-park', 'Piazza Italia Park', 'There is one outdoor pickleball court.', 'count')
if (counties['piazza-italia-park']?.matched) {
  throw new Error('Piazza Italia Park now resolves. The only reason it is excluded has gone: publish its court.')
}
assertEntry('Hamilton Community Center', 'Hamilton Community Center', '10700 Nacogdoches Rd., San Antonio, TX 78217', null)
if (/Hamilton Community Center[^.]{0,200}\d+\s+(indoor |outdoor )?pickleball courts?/i.test(list.join(' '))) {
  throw new Error('The directory page now states a court count for Hamilton Community Center. Re-read and publish it.')
}

const identityRegistry = loadIdentity(REPO_ROOT)
const allRows = loadRows().map(r => mapRow(r).venue)
const bySlug = new Map(
  allRows.filter(v => v.city === 'San Antonio' && String(v.state).toUpperCase() === 'TX')
    .map(v => [v.slug, v]))

const overlay = {}
const changes = []

for (const p of VENUES) {
  assertEntry(p.slug, p.name, p.listLine)
  must(p.page, p.slug, p.spec, 'court count sentence')
  must(p.page, p.slug, FIRST_COME, 'first-come rule on the park page')
  must(p.page, p.slug, `San Antonio, TX ${p.cityZip}`, 'postcode on the park page')
  if (p.extra) must(p.page, p.slug, p.extra, 'court-hours sentence')
  if (p.restroom) must(p.page, p.slug, 'Restrooms', 'restrooms in the amenity list')
  if (p.otherAddress) must(p.page, p.slug, p.otherAddress, 'second address on the park page')
  if (p.poolHours) must('pickleball', p.slug, `Pool Hours: ${p.poolHours}`, 'pool-hours line, which must stay labelled as the pool\'s')

  /* Lighting silences must stay silences: a park page that gains a lighting word about pickleball must be re-read. */
  if (p.light === null && /lighted[^.]{0,40}pickleball|pickleball[^.]{0,60}lighted/i.test(linesOf(snapshotPath(p.page)).join(' '))) {
    throw new Error(`${p.slug}: the park page now says something about pickleball lighting. Re-read it.`)
  }

  const geo = counties[p.slug]
  if (!geo?.matched) throw new Error(`${p.slug}: no address resolver matched its address`)
  if (!geo.place_matches_city) {
    throw new Error(`${p.slug}: the resolver places this at "${geo.place}", not San Antonio.`)
  }
  if (geo.postal_code !== p.cityZip) {
    throw new Error(`${p.slug}: the resolver's postcode ${geo.postal_code} differs from the City's ${p.cityZip}.`)
  }

  const doc = new SourceDocument({
    url: PAGE, retrieved_at: RETRIEVED_AT, tier: 1, publisher: CITY, format: 'html',
  })
  const docPark = new SourceDocument({
    url: `${PARK_BASE}/${p.name.replace(/ /g, '-')}`, retrieved_at: RETRIEVED_AT, tier: 1, publisher: CITY, format: 'html',
  })
  const docCensus = new SourceDocument({
    url: CENSUS_URL, retrieved_at: RETRIEVED_AT, tier: 1, publisher: 'US Census Bureau', format: 'json',
  })

  const shell = {
    slug: p.slug, name: null, city: 'San Antonio', state: 'TX', county: null,
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
    doc.fact('name', p.name, {
      evidence: `Named "${p.name}" on the City's pickleball directory page and on the park's own page.`,
    }),
    docPark.fact('total_courts', p.courts, {
      evidence: `The park's own page, under "Featured Amenities": "${p.spec}"`,
    }),
    doc.fact('street_address', p.address, {
      evidence: `"${p.listLine}" on the City's pickleball directory page; the park's own page prints the same postcode.` +
        (p.otherAddress ? ` The park's own page also prints "${p.otherAddress}" directly under its pickleball entry, with the Rest Haven address in its contact block; the directory's address is the one paired with the listing and is the one published.` : ''),
    }),
    doc.fact('venue_type', 'public_park', {evidence: `Published by the ${CITY} among its parks.`}),
    doc.fact('hours_of_operation', `Park hours ${PARK_HOURS}`, {
      evidence: `"Park Hours: ${PARK_HOURS}" for this park on the City's directory page, and "${PARK_HOURS_RULE}"` +
        (p.extra ? ` The park's own page: "${p.extra}"` : '') +
        (p.poolHours ? ` The directory also prints "Pool Hours: ${p.poolHours}" under this park; those are the pool's hours, not the courts'.` : ''),
    }),
    docPark.fact('play_format', 'open_play', {
      evidence: `"${FIRST_COME}" on the park's own page, and "These are available on a first-come, first-served basis." on the directory page.`,
    }),
    docPark.fact('court_availability', p.availability, {
      evidence: `From the park's own page ("${p.spec}") and the City's directory page ("${p.listLine}", "Park Hours: ${PARK_HOURS}").`,
    }),
    docCensus.fact('county', geo.county, {
      evidence: `${geo.county} County, TX${geo.county_fips ? ` (FIPS ${geo.state_fips}${geo.county_fips})` : ''}. ${geo.basis} The resolver also places it in the incorporated place "${geo.place}", which is what allows it to be published under San Antonio.`,
    }),
    docCensus.fact('postal_code', geo.postal_code, {evidence: geo.basis}),
  ]

  if (p.outdoor != null) {
    facts.push(docPark.fact('outdoor_courts', p.outdoor, {
      evidence: `The word is the City's: "${p.spec}"`,
    }))
  }
  if (p.indoor != null) {
    facts.push(docPark.fact('indoor_courts', p.indoor, {
      evidence: `The word is the City's: "${p.spec}"`,
    }))
  }
  if (p.light === true) {
    facts.push(docPark.fact('light', true, {
      evidence: `"lighted" is in the City's own count sentence: "${p.spec}"`,
    }))
  }
  if (p.restroom) {
    facts.push(docPark.fact('restroom', true, {
      evidence: 'Listed as "Restrooms" among the park\'s amenities on its own page.',
    }))
  }

  const res = applyFacts(venue, facts)

  overlay[p.slug] = {
    minted: !imported,
    identity: {
      name: p.name, city: 'San Antonio', state: 'TX',
      county: geo.county, postal_code: geo.postal_code ?? null,
      latitude: geo.lat ?? null, longitude: geo.lon ?? null,
      imported_slug: p.importedSlug ?? null,
      canonical_slug: identityRegistry.renames[p.importedSlug]?.canonical ?? p.slug,
    },
    match: {
      source_page: `${PARK_BASE}/${p.name.replace(/ /g, '-')}`, quote: p.spec,
      basis: imported
        ? `Matched to the imported ${p.importedSlug} row in San Antonio, TX, at the same street address.`
        : 'No imported row for this park under this slug. Minted here from the City\'s own pages, which state the count and the address.',
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
const indoorCourts = VENUES.reduce((a, p) => a + (p.indoor ?? 0), 0)
const litCourts = VENUES.filter(p => p.light === true).reduce((a, p) => a + p.courts, 0)

for (const [slug, entry] of Object.entries(overlay)) {
  const {total_courts: t, indoor_courts: i, outdoor_courts: o} = entry.patch
  if (i != null && o != null && t !== i + o) {
    throw new Error(`Rule 13: ${slug} does not sum.`)
  }
}

const METHOD_NOTE =
  'San Antonio states its count in a sentence on each park\'s own page, and the sentence carries the words that matter: "There are 18 lighted, outdoor pickleball courts." at Fairchild Park, "There are 2 indoor pickleball courts." at Palm Heights, "There are eight outdoor pickleball courts." at Monterrey. Outdoor or indoor is the City\'s own word at eight of nine venues, lighting at two, and the directory page states park hours of 5 a.m. to 11 p.m. daily for every park and that the courts are first come, first served. Tejeda Park says "6 lighted, pickleball courts" without "outdoor", so its breakdown stays null. The directory\'s own caveat, "Some courts are not lighted.", is why the seven parks that say nothing about pickleball lighting are recorded as unknown, and a park page saying "The tennis court is not lighted" is about tennis. Fairchild\'s eighteen lit outdoor courts are the second-largest single-venue count on this site after Mesa. Two refusals: Piazza Italia Park\'s "500 Columbus" is found by neither resolver, and Hamilton Community Center is listed with an address, hours and a Saturday pickleball window and never a count. The City answered a bare curl with 200 and then, twenty minutes later, with 403; the pages were fetched with the browser header set in scripts/verify/fetch/san-antonio.sh. The directory says eleven results and serves ten; its pager returns the same page for page two, which is stated here rather than hidden.'

mkdirSync(join(REPO_ROOT, 'data/verified'), {recursive: true})
writeFileSync(join(REPO_ROOT, 'data/verified/san-antonio-tx.json'), JSON.stringify({
  city: 'San Antonio', state: 'TX', retrieved_at: RETRIEVED_AT,
  method_note: METHOD_NOTE,
  sources: [
    {url: PAGE, publisher: CITY, tier: 1, format: 'html', snapshot: snapshotPath('pickleball')},
    ...VENUES.map(p => ({
      url: `${PARK_BASE}/${p.name.replace(/ /g, '-')}`, publisher: CITY, tier: 1, format: 'html', snapshot: snapshotPath(p.page),
    })),
    ...EXCLUDED.filter(e => e.page).map(e => ({
      url: `${PARK_BASE}/${e.name.replace(/ /g, '-')}`, publisher: CITY, tier: 1, format: 'html', snapshot: snapshotPath(e.page),
    })),
    {url: CENSUS_URL, publisher: 'US Census Bureau', tier: 1, format: 'json', snapshot: 'data/sources/san-antonio-county-census.json'},
  ].map((s, i) => ({id: `S${i + 1}`, ...s})),
  totals: {
    venues: VENUES.length, courts: totalCourts,
    outdoor: outdoorCourts, indoor: indoorCourts,
    lit_courts: litCourts, free_venues: 0,
  },
  excluded: EXCLUDED.map(e => ({name: e.name, why: e.reasons})),
  venues: overlay,
}, null, 2) + '\n')

const changed = changes.filter(r =>
  r.old_value !== null && r.old_value !== undefined && String(r.old_value) !== String(r.new_value))

writeFileSync(join(REPO_ROOT, 'reports', 'san-antonio-conflicts.md'), [
  '# San Antonio verification - outdoor, indoor and lighted in the City\'s own sentence', '',
  `Run ${RETRIEVED_AT}. ${VENUES.length} venues published, ${totalCourts} courts (${outdoorCourts} outdoor, ${indoorCourts} indoor, ${totalCourts - outdoorCourts - indoorCourts} unstated). ${EXCLUDED.length} venues refused.`, '',
  'San Antonio is the second city in Texas on this site, after Austin, and the first in Bexar County.', '',
  '| venue | courts | in | out | lit | what the City writes | address |',
  '| --- | ---: | ---: | ---: | --- | --- | --- |',
  ...VENUES.map(p => `| \`${p.slug}\` | ${p.courts} | ${p.indoor ?? '-'} | ${p.outdoor ?? '-'} | ${p.light === true ? 'yes' : 'not stated'} | "${p.spec}" | ${p.listLine} |`),
  '',
  '## Tejeda says "lighted" and not "outdoor"', '',
  '"There are 6 lighted, pickleball courts." Every other park page puts "outdoor" or "indoor" in the sentence;',
  'Tejeda\'s does not, so its breakdown stays null. Quoting an operator means not completing its sentences.',
  '',
  '## "Some courts are not lighted."', '',
  'That caveat on the directory page is why seven venues carry no lighting answer. A park page that says',
  '"The tennis court is not lighted" is talking about tennis, and the run fails if any of those pages gains',
  'a lighting word about pickleball.',
  '',
  '## Refused', '',
  ...EXCLUDED.flatMap(e => [
    `**${e.name}** - "${e.spec}" - ${e.listLine}`, '',
    ...e.reasons.map((r, i) => `${i + 1}. ${r}`), '']),
  '## Fetched with a browser header set', '',
  'www.sa.gov answered a bare curl with 200 during the search and with 403 twenty minutes later.',
  '`scripts/verify/fetch/san-antonio.sh` carries the header set that it serves the document to.',
  '',
  '## The directory says eleven results and serves ten', '',
  'Nine parks and Hamilton Community Center are listed; the pager\'s page 2 returns the same ten. The',
  '"11 Result(s) Found" line is asserted so a change is noticed, and the eleventh is not guessed at.',
  '',
  '## What San Antonio does not say', '',
  '- **price.** "first-come, first-served" is a play format. Null everywhere.',
  '- **surface.**',
  '- **lighting**, at seven of nine venues.',
  '',
  changed.length ? '## Values a source changed' : '_No imported row was overwritten._',
  ...(changed.length ? [
    '', '| venue | field | was | now | outcome |', '| --- | --- | --- | --- | --- |',
    ...changed.map(r => `| \`${r.venue_slug}\` | ${r.field} | ${JSON.stringify(r.old_value)} | ${JSON.stringify(r.new_value)} | ${r.outcome} |`),
  ] : []),
  '',
].join('\n'))

console.log(`\nSan Antonio, TX - ${VENUES.length} venues, ${totalCourts} courts (${outdoorCourts} outdoor, ${indoorCourts} indoor), retrieved ${RETRIEVED_AT}`)
for (const p of VENUES) {
  const o = overlay[p.slug]
  console.log(
    `  ${o.patch.name.padEnd(24)} ${String(o.patch.total_courts).padStart(2)} | in ${String(o.patch.indoor_courts ?? '-').padStart(2)} out ${String(o.patch.outdoor_courts ?? '-').padStart(2)} | ${(p.light === true ? 'lit' : 'lighting not stated').padEnd(19)} | ${o.patch.county} County | via ${counties[p.slug].resolver}`)
}
console.log(`\n  refused: ${EXCLUDED.map(e => e.name).join(', ')}`)
console.log('\nWrote data/verified/san-antonio-tx.json and reports/san-antonio-conflicts.md\n')
