#!/usr/bin/env node
/*
  Cape Coral, FL verification run - city #16, the first in Florida and the
  first in Lee County.

  ============================================================
  WHY CAPE CORAL
  ============================================================

  One City page - "Park Sports/Games" - states a pickleball count for every
  venue it lists, and states the lighting and the price in the same breath.
  That combination is rare. Only Scottsdale has previously given this
  directory a verified free court AND a verified lighting answer in one
  document.

  What the City writes, venue by venue:

      Camelot Park       "Two (2) tennis courts -OR- Four (4) pickleball
                          courts with lights - open until 9:00 p.m. daily"
      Gator Trails Park  "Two (2) dedicated pickleball courts with lights"
      Giuffrida Park     "Two (2) dedicated pickleball courts  - no lights"
      Jim Jeffers Park   as Camelot, "and two (2) warm-up pickleball courts"
      Joe Stonis Park    as Camelot
      Sands Park         "Four (4) dedicated pickleball courts"
      The Courts         "32 dedicated pickleball courts and 12 tennis courts"

  And the sentence that prices all of them:

      "There are several parks within the City of Cape Coral that have
       tennis/pickleball courts which are available for public use at no
       charge and open from sunrise to sunset (or later for locations with
       lighting)."

  ============================================================
  GIUFFRIDA PARK CARRIES A STATED NEGATIVE ON LIGHTING
  ============================================================

  "Two (2) dedicated pickleball courts  - no lights". That is the second
  stated lighting negative in this directory, after Vancouver's Oakbrook
  Community Park, and it is the reason Cape Coral's lighting data is worth
  more than a list of yeses: the City marks the absence as deliberately as
  the presence, so an unmarked venue is a genuine silence rather than an
  implied no. Sands Park is that silence and its lighting stays null.

  ============================================================
  THE "-OR-" IS A CONFIGURATION, NOT AN AMBIGUITY
  ============================================================

  Three venues read "Two (2) tennis courts -OR- Four (4) pickleball courts".
  One slab, two configurations, and the City counts each sport separately.
  The pickleball number is four, stated by the City, and the venue page says
  what the "-OR-" means rather than hiding it: these are tennis courts that
  become four pickleball courts, not four courts that exist alongside two.

  Jim Jeffers Park adds "and two (2) warm-up pickleball courts", which is a
  second, separate figure on the same line. Four plus two is six, and both
  numbers are the City's. This is the same arithmetic Lincoln's Densmore
  Park required, where the City wrote "two dedicated pickleball courts; 2
  dual striped (can be used as 4 pickleball courts)" and the sum was its own.

  ============================================================
  THE STREET TYPE IS PART OF THE ADDRESS
  ============================================================

  Cape Coral is the city that found a real defect in Import Gate I1's first
  resolver, and the fix shipped with this run.

  Asked for "1718 SW 52 Terrace", the Census geocoder answered "1718 SW 52ND
  ST" - confidently, with the right county, the right place and the right
  postcode. In Cape Coral those are two different streets seventy-seven
  metres apart, and both carry a house number 1718. Nothing downstream could
  have caught it, and three venues here would have published coordinates for
  the wrong street.

  An audit of all 85 addresses resolved across the project found four type
  mismatches: three here and one in Austin. The Austin one is why the fix is
  not simply "reject the mismatch" - the City writes "9201 North Lake Creek
  Blvd", the Census answers "N LAKE CREEK PKWY", and OpenStreetMap has no
  Lake Creek Blvd in Austin at all. One street, one name, correctly
  normalised. So `scripts/verify/geocode.mjs` now treats a differing street
  type as a reason to stop trusting the first resolver silently: it asks
  OpenStreetMap for the address as the operator wrote it, and the operator's
  street type wins if OSM can find it. Austin's resolution is unchanged.

  ============================================================
  WHAT IS REFUSED
  ============================================================

  Gator Trails Park  Two dedicated courts WITH LIGHTS, and neither resolver
                     finds "3628 Garden Blvd". Import Gate I1. The most
                     expensive refusal here, because the City states both a
                     count and a lighting answer for it.

  The Courts         Thirty-two dedicated pickleball courts - by a distance
                     the largest count this project has ever read - and the
                     City publishes no address for it and gives it no park
                     page. It is also listed underneath the "no charge"
                     sentence while being, on its own operator's account, a
                     paid facility. Publishing it would mean taking an
                     address from a source this project has never used and
                     inheriting a price the City's own page contradicts.

  Four Freedoms Park The City publishes its address, 4818 Tarpon Court, and
                     its price, $5 per person. It never states how many
                     courts: "the portable indoor court" names a facility,
                     not a number. Same ground as the six Mesa parks.

  Burton Memorial    "One (1) asphalt tennis court - no lights". A tennis
                     court, listed under Tennis. No pickleball is claimed
                     for it, so it is not a refusal, merely not a venue.

  ============================================================
  WHAT IS NOT CLAIMED
  ============================================================

  surface     Stated for one court in the city and it is a tennis court -
              Burton Memorial's "asphalt" - so nothing here carries a
              surface.

  indoor/     The published five are outdoor park courts, but the City never
  outdoor     uses either word about them, so the breakdowns stay null,
              following Mesa and Kirkland. The one venue the City DOES call
              indoor, Four Freedoms Park, states no count and does not
              publish.
*/

import {readFileSync, writeFileSync, mkdirSync} from 'node:fs'
import {join} from 'node:path'
import {SourceDocument} from './provenance.mjs'
import {applyFacts, changelogToRows} from './conflict.mjs'
import {loadRows, REPO_ROOT} from '../lib/load-csv.mjs'
import {PUBLISHED_FACT_FIELDS} from '../../lib/data/verified.mjs'
import {loadIdentity} from '../../lib/data/identity.mjs'
import {mapRow} from '../import/mapper.mjs'

const RETRIEVED_AT = process.env.RETRIEVED_AT ?? '2026-09-04'

const CITY = 'City of Cape Coral Parks & Recreation'
const BASE = 'https://www.capecoral.gov/departments/parks_recreation'
const PAGE = `${BASE}/athletics/park_sports_games.php`
const PARK_BASE = `${BASE}/parks_facilities`
const CENSUS_URL = 'https://geocoding.geo.census.gov/geocoder/geographies'

const NO_CHARGE =
  'available for public use at no charge and open from sunrise to sunset (or later for locations with lighting)'
const DUAL_USE = 'Two (2) tennis courts -OR- Four (4) pickleball courts with lights - open until 9:00 p.m. daily'

const VENUES = [
  {
    slug: 'camelot-park', importedSlug: 'camelot-park-cape-coral', name: 'Camelot Park',
    page: 'camelot-park', file: 'camelot_park',
    courts: 4, light: true, dedicated: false,
    address: '1718 SW 52 Terrace', postcodeLine: '1718 SW 52 Terrace, Cape Coral, FL 33914',
    spec: DUAL_USE,
    parkQuote: 'Two (lighted) Tennis Courts that include court lines for Pickleball',
    restroom: true,
    hours: 'Open sunrise to 9:00 p.m. daily.',
    availability:
      'Four pickleball courts with lights, open until 9:00 p.m. daily, and free - the City says so for all of its park courts in one sentence. The "-OR-" in the City\'s own line is worth reading rather than skipping: "Two (2) tennis courts -OR- Four (4) pickleball courts with lights". This is one pair of tennis slabs that becomes four pickleball courts, not four courts standing alongside two. The park\'s own page describes the same thing from the other direction - "Two (lighted) Tennis Courts that include court lines for Pickleball" - so what you find on arrival depends on how the courts are set up and who got there first. Camelot is a 6.4 acre neighbourhood park with a paved perimeter walking path, picnic pavilions, horseshoe pits and a playground.',
  },
  {
    slug: 'giuffrida-park', importedSlug: 'giuffrida-park-cape-coral', name: 'Giuffrida Park',
    page: 'giuffrida-park', file: 'giuffrida_park',
    courts: 2, light: false, dedicated: true,
    address: '1044 NE 4 Street', postcodeLine: '1044 NE 4 Street, Cape Coral, FL 33909',
    spec: 'Two (2) dedicated pickleball courts  - no lights',
    parkQuote: 'Two Pickleball Courts',
    restroom: true,
    hours: 'Open sunrise to sunset.',
    availability:
      'Two dedicated pickleball courts - not tennis courts wearing a second set of lines - and the only venue in Cape Coral where the City states outright that there is no lighting: "Two (2) dedicated pickleball courts  - no lights". That answer is worth as much as a yes. It means these courts run sunrise to sunset rather than to 9 p.m. like the lit ones across the city, and it means the silence at Sands Park is a genuine silence rather than a quiet no. This is also the one Cape Coral venue the City counts twice: the park\'s own page lists "Two Pickleball Courts" independently of the sports page. Free, like every City park court here.',
  },
  {
    slug: 'jim-jeffers-park', importedSlug: 'jim-jeffers-park-cape-coral', name: 'Jim Jeffers Park',
    page: 'jim-jeffers-park', file: 'jim_jeffers_park',
    courts: 6, light: true, dedicated: false,
    address: '2817 SW 3 Lane', postcodeLine: '2817 SW 3 Lane, Cape Coral, FL 33991',
    spec: `${DUAL_USE}; and two (2) warm-up pickleball courts`,
    parkQuote: 'Two (lighted) Tennis Courts that include court lines for Pickleball',
    restroom: true,
    hours: 'Open sunrise to 9:00 p.m. daily.',
    availability:
      'Six pickleball courts, and the six is the City\'s own arithmetic rather than ours. Its line reads "Two (2) tennis courts -OR- Four (4) pickleball courts with lights - open until 9:00 p.m. daily; and two (2) warm-up pickleball courts" - four on the convertible tennis slabs, plus two warm-up courts counted separately. That makes Jim Jeffers the largest published pickleball venue in Cape Coral. The lights the City names belong to the four; it says nothing either way about the two warm-up courts. The park is lit until 9 p.m. and free, and the park\'s own page adds a second, quieter description of the same courts: "Two (lighted) Tennis Courts that include court lines for Pickleball".',
  },
  {
    slug: 'joe-stonis-park', importedSlug: 'joe-stonis-park-cape-coral', name: 'Joe Stonis Park',
    page: 'joe-stonis-park', file: 'joe_stonis_park',
    courts: 4, light: true, dedicated: false,
    address: '3444 Ceitus Parkway', postcodeLine: '3444 Ceitus Parkway, Cape Coral, FL 33991',
    spec: DUAL_USE,
    parkQuote: 'Two (lighted) Tennis Courts that include court lines for Pickleball',
    restroom: true,
    hours: 'Open sunrise to 9:00 p.m. daily.',
    availability:
      'Four pickleball courts with lights, open until 9:00 p.m. daily, free. As at Camelot the City writes it as a configuration - "Two (2) tennis courts -OR- Four (4) pickleball courts with lights" - so the four exist when the courts are set up for pickleball rather than in addition to the tennis. Joe Stonis sits in north-west Cape Coral on Ceitus Parkway. Its address is one of three here that the US Census address file has no record of; OpenStreetMap resolves it at house-number level, which is what allows it to publish.',
  },
  {
    slug: 'sands-park', importedSlug: null, name: 'Sands Park',
    page: 'sands-park', file: 'sands_park',
    courts: 4, light: null, dedicated: true,
    address: '2718 SW 43rd Terrace', postcodeLine: '2718 SW 43rd Terrace, Cape Coral, FL 33914',
    spec: 'Four (4) dedicated pickleball courts',
    parkQuote: 'Pickleball, Basketball & Bocce Courts',
    hours: 'Open sunrise to sunset.',
    availability:
      'Four dedicated pickleball courts, free, in a park that also carries walking paths, a putting green, a burrowing owl habitat area, a butterfly garden, a playground, and courts for basketball, tennis, bocce and cornhole. Dedicated means these are pickleball courts rather than tennis courts lent to the game, which puts Sands alongside Giuffrida and apart from the three convertible venues. Lighting is the open question and the City has not answered it: it marks lights at four Cape Coral venues and marks their absence at Giuffrida, and about Sands it says nothing at all. Because the City is willing to write "no lights" when it means it, that silence is recorded as unverified rather than read as a no.',
  },
]

const EXCLUDED = [
  {
    name: 'Gator Trails Park', page: 'gator-trails-park', file: 'gator_trails_park',
    spec: 'Two (2) dedicated pickleball courts with lights',
    address: '3628 Garden Blvd',
    reasons: [
      'Neither address resolver finds "3628 Garden Blvd", the address the City publishes on the park\'s own page: the US Census address file returns no match, and OpenStreetMap returns nothing at house-number level for it either. Import Gate I1 requires a street address that resolves.',
      'This is the expensive refusal of the run. The City states both a count and a lighting answer for it - "Two (2) dedicated pickleball courts with lights" - which is more than it states for Sands Park, which does publish. The venue fails on its address alone.',
    ],
  },
  {
    name: 'The Courts', page: null, file: null,
    spec: '32 dedicated pickleball courts and 12 tennis courts',
    address: null,
    reasons: [
      'The City publishes no address for it. It appears in the list on the Park Sports/Games page and has no page of its own among the City\'s parks and facilities, so there is no municipal record of where it is. Import Gate I1 requires a street address, and this project has never taken one from a source outside the operator.',
      'Its thirty-two dedicated courts are the largest count this project has read anywhere, which is a reason for more care rather than less.',
      'It also sits underneath the City\'s sentence that these courts are "available for public use at no charge", while being a paid facility on its own operator\'s account. Publishing it would mean inheriting a price the City\'s own page contradicts. The contradiction is recorded here rather than resolved.',
    ],
  },
  {
    name: 'Four Freedoms Park', page: null, file: null,
    spec: 'the portable indoor court',
    address: '4818 Tarpon Court',
    reasons: [
      'The City states no court count. It offers "indoor pickleball in air-conditioned comfort on the portable indoor court at Four Freedoms Park", which names a facility rather than counting courts, and Page Gate 1 requires a stated count.',
      'Everything else about it is unusually well published: the address, 4818 Tarpon Court, the price of $5 per person for two hours, a maximum of four players, and that paddles and balls can be borrowed. It is the only indoor pickleball the City names, and it does not publish for want of a number.',
    ],
  },
]

/* ---------------------------------------------------------------- */

const snapshotPath = name => `data/sources/capecoral/${name}.html`

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

const sports = textOf('park-sports-games')

/* The city-wide sentence that prices every published venue in this run. */
for (const [needle, what] of [
  [NO_CHARGE, 'no-charge and hours rule'],
  ['Court locations include:', 'the heading over the venue list'],
]) {
  if (!sports.includes(squeeze(needle))) {
    throw new Error(`The Cape Coral sports page no longer states the ${what}: "${needle}"`)
  }
}

const counties = JSON.parse(
  readFileSync(join(REPO_ROOT, 'data/sources/capecoral-county-census.json'), 'utf8'))

/* ---------------------------------------------------------------- */
/* THE REFUSALS, ASSERTED RATHER THAN REMEMBERED.                    */

for (const e of EXCLUDED) {
  must('park-sports-games', e.name, e.spec, 'what the City says about the refused venue')
  if (e.address) must(e.page ?? 'park-sports-games', e.name, e.address, 'address of the refused venue')
}

/* Gator Trails publishes the day its address resolves. */
if (counties['gator-trails-park']?.matched) {
  throw new Error(
    'Gator Trails Park now resolves. The only reason it is excluded has gone: ' +
    'publish its two lighted dedicated courts.')
}

/*
  The Courts has no address on the City's pages. If one appears, the venue
  with the largest court count this project has ever read becomes
  publishable and this run must be revisited rather than quietly skipping it.
*/
if (/\d+[A-Za-z ]*(Ave|Avenue|St|Street|Blvd|Boulevard|Ter|Terrace|Pkwy|Parkway|Ln|Lane|Ct|Court|Rd|Road)/i
  .test(linesOf(snapshotPath('park-sports-games'))
    .filter(l => /The Courts/.test(l)).join(' '))) {
  throw new Error(
    'The Courts now appears with a street address on the City page. It states 32 dedicated ' +
    'pickleball courts - the largest count read anywhere in this project. Re-read and publish it.')
}

const identityRegistry = loadIdentity(REPO_ROOT)
const allRows = loadRows().map(r => mapRow(r).venue)
const bySlug = new Map(
  allRows.filter(v => v.city === 'Cape Coral' && String(v.state).toUpperCase() === 'FL')
    .map(v => [v.slug, v]))

const overlay = {}
const changes = []

for (const p of VENUES) {
  must('park-sports-games', p.slug, p.spec, 'court count')
  must('park-sports-games', p.slug, p.name, 'venue name in the court-locations list')
  must(p.page, p.slug, p.postcodeLine, 'address on the park page')
  must(p.page, p.slug, p.parkQuote, 'court description on the park page')

  const geo = counties[p.slug]
  if (!geo?.matched) throw new Error(`${p.slug}: no address resolver matched its address`)
  if (!geo.place_matches_city) {
    throw new Error(`${p.slug}: the resolver places this at "${geo.place}", not Cape Coral.`)
  }

  const doc = new SourceDocument({
    url: PAGE, retrieved_at: RETRIEVED_AT, tier: 1, publisher: CITY, format: 'html',
  })
  const docPark = new SourceDocument({
    url: `${PARK_BASE}/${p.file}.php`,
    retrieved_at: RETRIEVED_AT, tier: 1, publisher: CITY, format: 'html',
  })
  const docCensus = new SourceDocument({
    url: CENSUS_URL, retrieved_at: RETRIEVED_AT, tier: 1, publisher: 'US Census Bureau', format: 'json',
  })

  const shell = {
    slug: p.slug, name: null, city: 'Cape Coral', state: 'FL', county: null,
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
      evidence: `Named "${p.name}" by the ${CITY} in the court-locations list on its Park Sports/Games page, and on the park's own page.`,
    }),
    doc.fact('total_courts', p.courts, {
      evidence: p.slug === 'jim-jeffers-park'
        ? `Quoted from the City's Park Sports/Games page: "${p.spec}". Six is the City's own arithmetic - four on the convertible tennis slabs, plus the two warm-up courts it counts separately on the same line.`
        : `Quoted from the City's Park Sports/Games page: "${p.spec}".` +
          (p.slug === 'giuffrida-park'
            ? ' The park\'s own page states it again, as "Two Pickleball Courts".'
            : p.dedicated
              ? ''
              : ' The "-OR-" is the City\'s: one pair of tennis slabs configured as four pickleball courts, not four courts in addition to two.'),
    }),
    docPark.fact('street_address', p.address, {
      evidence: `"${p.postcodeLine}" is the address published on the park's own page.`,
    }),
    doc.fact('venue_type', 'public_park', {evidence: `Published by the ${CITY} among its parks.`}),
    doc.fact('fee_type', 'free', {
      evidence: `The City states it for all of its park pickleball courts in one sentence: "There are several parks within the City of Cape Coral that have tennis/pickleball courts which are ${NO_CHARGE}."`,
    }),
    doc.fact('hours_of_operation', p.hours, {
      evidence: p.light === true
        ? `The City's page gives "open until 9:00 p.m. daily" for this venue, within its rule that the courts are open "from sunrise to sunset (or later for locations with lighting)".`
        : `From the City's rule that its park courts are open "from sunrise to sunset (or later for locations with lighting)". This venue is not among those the City marks as lit.`,
    }),
    doc.fact('court_availability', p.availability, {
      evidence: `From the City's Park Sports/Games page: "${p.spec}", and the park's own page: "${p.parkQuote}".`,
    }),
    docCensus.fact('county', geo.county, {
      evidence: `${geo.county} County, FL${geo.county_fips ? ` (FIPS ${geo.state_fips}${geo.county_fips})` : ''}. ${geo.basis} The resolver also places it in the incorporated place "${geo.place}", which is what allows it to be published under Cape Coral.`,
    }),
    docCensus.fact('postal_code', geo.postal_code, {evidence: geo.basis}),
  ]

  if (p.restroom) {
    facts.push(docPark.fact('restroom', true, {
      evidence: 'Listed as "Restrooms" among the park\'s amenities on its own page.',
    }))
  }

  if (p.light === true) {
    facts.push(doc.fact('light', true, {
      evidence: `The City writes "${p.spec}" - "with lights" is its own phrase, applied to the pickleball courts, and it is the reason this venue stays open until 9:00 p.m. rather than closing at sunset.`,
    }))
  } else if (p.light === false) {
    facts.push(doc.fact('light', false, {
      evidence: `A stated negative in the City's own words: "${p.spec}". Cape Coral marks the absence of lighting as deliberately as its presence, which is what makes this a No rather than an unknown.`,
    }))
  }

  const res = applyFacts(venue, facts)

  overlay[p.slug] = {
    minted: !imported,
    identity: {
      name: p.name, city: 'Cape Coral', state: 'FL',
      county: geo.county, postal_code: geo.postal_code ?? null,
      latitude: geo.lat ?? null, longitude: geo.lon ?? null,
      imported_slug: p.importedSlug ?? null,
      canonical_slug: identityRegistry.renames[p.importedSlug]?.canonical ?? p.slug,
    },
    match: {
      source_page: PAGE, quote: p.spec,
      basis: imported
        ? `Matched to the imported ${p.importedSlug} row in Cape Coral, FL, published under the canonical slug ${p.slug} (the identity pass dropped the trailing "-cape-coral", which is already in the path).`
        : 'No imported row under this slug. Minted here from the City\'s own pages, which state the count and the address.',
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
const litCourts = VENUES.filter(p => p.light === true).reduce((a, p) => a + p.courts, 0)
const dedicatedCourts = VENUES.filter(p => p.dedicated).reduce((a, p) => a + p.courts, 0)

for (const [slug, entry] of Object.entries(overlay)) {
  const {total_courts: t, indoor_courts: i, outdoor_courts: o} = entry.patch
  if (i != null && o != null && t !== i + o) {
    throw new Error(`Rule 13: ${slug} does not sum.`)
  }
}

const METHOD_NOTE =
  'Cape Coral states a pickleball count, a lighting answer and a price on one City page, which only Scottsdale has previously managed in this directory. Its Park Sports/Games page counts every venue it lists - "Four (4) pickleball courts with lights", "Two (2) dedicated pickleball courts  - no lights" - and prices all of them in one sentence: the City\'s park pickleball courts are "available for public use at no charge and open from sunrise to sunset (or later for locations with lighting)". Giuffrida Park carries the second stated lighting NEGATIVE in this directory after Vancouver\'s Oakbrook Community Park, which is what makes the silence at Sands Park a real silence rather than an implied no. Three venues are written as "Two (2) tennis courts -OR- Four (4) pickleball courts", one slab in two configurations, and their pages say so; Jim Jeffers adds "two (2) warm-up pickleball courts" for six, the City\'s own arithmetic. Three refusals, and two of them cost real courts: Gator Trails Park has two lighted dedicated courts and an address neither resolver can find, and The Courts has thirty-two dedicated pickleball courts - the largest count this project has read anywhere - and no address published by the City at all, plus a price its own operator states and the City\'s page contradicts. Four Freedoms Park publishes an address and a $5 fee and never says how many courts. This run also shipped a fix to Import Gate I1\'s first resolver: the Census geocoder had been silently changing a street\'s TYPE and still reporting a match, which in Cape Coral means a different street seventy-seven metres away, and three venues here would have published the wrong coordinates.'

mkdirSync(join(REPO_ROOT, 'data/verified'), {recursive: true})
writeFileSync(join(REPO_ROOT, 'data/verified/capecoral-fl.json'), JSON.stringify({
  city: 'Cape Coral', state: 'FL', retrieved_at: RETRIEVED_AT,
  method_note: METHOD_NOTE,
  sources: [
    {url: PAGE, publisher: CITY, tier: 1, format: 'html', snapshot: snapshotPath('park-sports-games')},
    ...VENUES.map(p => ({
      url: `${PARK_BASE}/${p.file}.php`, publisher: CITY, tier: 1, format: 'html', snapshot: snapshotPath(p.page),
    })),
    ...EXCLUDED.filter(e => e.page).map(e => ({
      url: `${PARK_BASE}/${e.file}.php`, publisher: CITY, tier: 1, format: 'html', snapshot: snapshotPath(e.page),
    })),
    {url: CENSUS_URL, publisher: 'US Census Bureau', tier: 1, format: 'json', snapshot: 'data/sources/capecoral-county-census.json'},
  ].map((s, i) => ({id: `S${i + 1}`, ...s})),
  totals: {
    venues: VENUES.length, courts: totalCourts,
    outdoor: null, indoor: null,
    lit_courts: litCourts, dedicated_courts: dedicatedCourts,
    free_venues: VENUES.length,
  },
  excluded: EXCLUDED.map(e => ({name: e.name, why: e.reasons})),
  venues: overlay,
}, null, 2) + '\n')

const changed = changes.filter(r =>
  r.old_value !== null && r.old_value !== undefined && String(r.old_value) !== String(r.new_value))

writeFileSync(join(REPO_ROOT, 'reports', 'capecoral-conflicts.md'), [
  '# Cape Coral verification - a count, a lighting answer and a price on one page', '',
  `Run ${RETRIEVED_AT}. ${VENUES.length} venues published, ${totalCourts} courts. ${EXCLUDED.length} venues refused.`, '',
  'Cape Coral is the first city in Florida on this site and the first in Lee County. It is also only the',
  'second city, after Scottsdale, whose operator states a court count, a lighting answer and a price in',
  'one document.', '',
  '| venue | courts | lit | dedicated | what the City writes | address |',
  '| --- | ---: | --- | --- | --- | --- |',
  ...VENUES.map(p => `| \`${p.slug}\` | ${p.courts} | ${p.light === true ? 'yes' : p.light === false ? '**no (stated)**' : 'not stated'} | ${p.dedicated ? 'yes' : 'converted tennis'} | "${p.spec}" | ${p.address} |`),
  '',
  '## A stated negative on lighting', '',
  'Giuffrida Park reads "Two (2) dedicated pickleball courts  - no lights". That is the second stated',
  'lighting negative in this directory, after Vancouver\'s Oakbrook Community Park, and it is what gives',
  'the rest of Cape Coral\'s lighting data its value: an operator willing to write "no lights" when it',
  'means it turns every unmarked venue into a genuine silence. Sands Park is that silence, and its',
  'lighting is recorded as unverified rather than read as a no.',
  '',
  '## The street type is part of the address', '',
  'Asked for `1718 SW 52 Terrace`, the Census geocoder answered `1718 SW 52ND ST` - with the right',
  'county, the right place and the right postcode. In Cape Coral those are two different streets about',
  'seventy-seven metres apart, both carrying a house number 1718. Nothing downstream could have caught',
  'it, and three venues here would have published coordinates for the wrong street.',
  '',
  'An audit of all 85 addresses resolved across this project found four such mismatches - three here and',
  'one in Austin. Austin is why the fix is not "reject the mismatch": the City writes "North Lake Creek',
  'Blvd", the Census answers "N LAKE CREEK PKWY", and OpenStreetMap has no Lake Creek Blvd in Austin at',
  'all. One street, one name, correctly normalised. So `scripts/verify/geocode.mjs` now treats a',
  'differing street type as a reason to stop trusting the first resolver silently: it asks OpenStreetMap',
  'for the address as the operator wrote it, and the operator\'s street type wins if OSM can find it.',
  'Austin\'s resolution is unchanged; three Cape Coral venues moved to the correct street.',
  '',
  '## Refused', '',
  ...EXCLUDED.flatMap(e => [
    `**${e.name}** - "${e.spec}"${e.address ? ` - ${e.address}` : ' - no address published'}`, '',
    ...e.reasons.map((r, i) => `${i + 1}. ${r}`), '']),
  '## What Cape Coral does not say', '',
  '- **indoor or outdoor**, about any published venue. The breakdowns stay null, following Mesa and',
  '  Kirkland. The one venue the City does call indoor, Four Freedoms Park, states no count.',
  '- **surface.** The only surface named in the city belongs to a tennis court: Burton Memorial Park\'s',
  '  "One (1) asphalt tennis court - no lights".',
  '- **lighting at Sands Park**, which is the one published venue the City neither marks lit nor marks',
  '  unlit.',
  '',
  changed.length ? '## Values a source changed' : '_No imported row was overwritten._',
  ...(changed.length ? [
    '', '| venue | field | was | now | outcome |', '| --- | --- | --- | --- | --- |',
    ...changed.map(r => `| \`${r.venue_slug}\` | ${r.field} | ${JSON.stringify(r.old_value)} | ${JSON.stringify(r.new_value)} | ${r.outcome} |`),
  ] : []),
  '',
].join('\n'))

console.log(`\nCape Coral, FL - ${VENUES.length} venues, ${totalCourts} courts, retrieved ${RETRIEVED_AT}`)
for (const p of VENUES) {
  const o = overlay[p.slug]
  console.log(
    `  ${o.patch.name.padEnd(18)} ${String(o.patch.total_courts).padStart(2)}` +
    ` | ${(p.light === true ? 'lit' : p.light === false ? 'NO lights (stated)' : 'lighting not stated').padEnd(19)}` +
    ` | free | ${o.patch.county} County | via ${counties[p.slug].resolver}`)
}
console.log(`\n  refused: ${EXCLUDED.map(e => e.name).join(', ')}`)
console.log('\nWrote data/verified/capecoral-fl.json and reports/capecoral-conflicts.md\n')
