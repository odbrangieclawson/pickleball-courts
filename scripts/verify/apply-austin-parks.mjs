#!/usr/bin/env node
/*
  Austin, TX verification run — city #10, the first in Texas, and the first
  city whose operator answers the lighting question at scale.

  ============================================================
  WHY AUSTIN
  ============================================================

  Austin Parks and Recreation publishes one page listing what it calls "the
  official Austin Parks and Recreation Department pickleball locations", and
  for each one it gives a full street address, a court count, opening hours,
  and — for eleven of the twenty-one — the words "Lighted during park hours".

  Lighting is a field most operators skip. Across the ninety-five venues
  published before this city, forty-three carried a verified answer either
  way — and more than half of those came from a single Seattle GIS layer with
  a LIGHTED column, so the count reflects one good database rather than nine
  forthcoming cities. Austin states it for eleven of twenty-one in prose,
  which makes it the best non-database lighting source read for this project.

  Before writing that down this run counted it: 43 of 95, 20 lit and 23
  unlit, Seattle contributing 24. An earlier draft of this header said twenty
  and nineteen, which was wrong in the flattering direction.

  It is also the first operator to say that a net is NOT provided. Three
  venues carry "bring your own portable net" or "Nets not included", which
  is a stated negative on nets_provided where every other city in this
  directory has left the field unknown.

  ============================================================
  HOW AUSTIN COUNTS, AND WHY THE COUNT IS THE SMALLER NUMBER
  ============================================================

  Most entries read like this:

      2 Multi-purpose Outdoor Courts with striping for 4 Pickleball Courts

  Two numbers, and they mean different things: two physical court slabs,
  striped to yield four pickleball courts. The pickleball count is the second
  number, and that is what total_courts records — four, not two. Where the
  City writes "3 Dedicated Outdoor Courts" there is only one number and it is
  already a pickleball count.

  Two venues carry both forms and are added together. Pan American reads
  "3 Dedicated Outdoor Courts, 1 Multi-purpose Outdoor Court with striping
  for 1 Pickleball Court" — four. Rosewood reads "2 Dedicated Outdoor Courts,
  1 Multi-Purpose Court with striping for 2 Pickleball Courts" — four.

  ============================================================
  ASSERTIONS ARE PER VENUE, NOT PER PAGE
  ============================================================

  "Lighted during park hours" appears eleven times on this page and "Open
  Play: 7 Days a Week, 7 a.m. to 10 p.m." appears fifteen. Checking that a
  string exists SOMEWHERE in the snapshot would prove nothing about the venue
  it is attached to — it would let a lighting claim survive being moved from
  one park to another.

  So this run splits the locations list into one block per venue, bounded by
  the venue names themselves, and asserts each fact inside its own block. A
  fact that moves parks fails the build.

  ============================================================
  BALCONES DISTRICT PARK IS EXCLUDED, ON TWO GROUNDS
  ============================================================

  The City lists it, and its entry reads "1 Multi-purpose outdoor court with
  striping for Pickleball, bring your own portable net" — striping for
  Pickleball, with no number. Every other multi-purpose entry on this page
  gives the pickleball figure; this one does not, so there is no court count
  to publish and Page Gate 1 refuses a venue without one. Separately, the
  Census address geocoder returns no match for 12017 Amherst Dr. Either
  would be enough on its own.

  ============================================================
  TWO POSTCODES THE CITY AND THE CENSUS DISAGREE ON
  ============================================================

  Eastside Pocket Park is printed as "4617 Tannehill Lane, 78702"; the
  geocoder matches the street address and returns 78721. North Lake Creek
  Neighborhood Park is printed with 78753; the geocoder returns 78717, and
  places it in Williamson County rather than Travis.

  postal_code comes from the geocoder in every run this project has done, so
  the geocoder's answer is what publishes — but the disagreement is recorded
  here and on the venue pages rather than quietly resolved, because the City
  is the authority on its own parks and a directory that silently overrules
  an operator should at least say when it has.

  ============================================================
  AUSTIN IS IN TWO COUNTIES
  ============================================================

  Nineteen of these venues are in Travis County and two — North Lake Creek
  and Springwoods — are in Williamson. That is a real feature of Austin
  rather than a data problem, and it means the Travis County page publishes
  while Williamson's two venues sit below the three-venue threshold and get
  no county page at all. Both counts come from the geocoder per venue, not
  from an assumption that a city sits in one county.

  ============================================================
  WHAT IS NOT CLAIMED
  ============================================================

  fees        Austin states none, at any of the twenty-one. Its park courts
              are open play and almost certainly free; "almost certainly" is
              not a fact and fee_type stays null. The one venue that clearly
              is not free-for-all — the Austin Tennis and Pickleball Center,
              which requires reservations — still has no price on this page.
  surface     Stated nowhere. The City says what a court is striped FOR, not
              what it is made of.
  nets        FALSE at three venues, because the City says so in words.
              Null everywhere else: silence about a net is not a net.
  indoor      This run publishes only the outdoor locations list. The same
              page carries a separate section, "Pickleball Programming at Rec
              Centers", listing indoor courts inside recreation centres with
              partial addresses and session times. It is real, sourced and
              not yet verified — named on the city page as an open gap rather
              than left as a silence.
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

const CITY = 'Austin Parks and Recreation Department'
const PAGE = 'https://www.austintexas.gov/department/pickleball'
const CENSUS_URL = 'https://geocoding.geo.census.gov/geocoder/geographies'

const LIGHTED = 'Lighted during park hours'
const OPEN_PLAY_STANDARD = 'Open Play: 7 Days a Week, 7 a.m. to 10 p.m.'
const LIST_INTRO =
  'The list below represents official Austin Parks and Recreation Department pickleball locations:'

/*
  Every venue on the City's outdoor list. `courts` is the PICKLEBALL count —
  the second number where the City gives two. `spec` is the exact court line
  and `light`/`nets`/`hours` are asserted inside this venue's own block.
*/
const VENUES = [
  {
    slug: 'austin-high-tennis-center', name: 'Austin High Tennis Center',
    address: '2001 W. Cesar Chavez Austin, Texas 78703',
    spec: '3 Dedicated Outdoor Courts', courts: 3, dedicated: 3,
    venueType: 'school', light: true,
    hours: 'Monday to Friday, 5:30 p.m. to 10 p.m. during the school year; 7 Days a Week, 7 a.m. to 10 p.m. during the summer months.',
    hoursQuote: 'Monday to Friday, 5:30 p.m. to 10 p.m. during the school year',
    availability: 'Three dedicated outdoor pickleball courts, lit during park hours. The courts are shared under an agreement between the City of Austin and Austin Independent School District, and the hours change with the school calendar: weekday evenings only from 5:30 p.m. during term, and seven days a week from 7 a.m. through the summer.',
    availabilityQuote: 'The courts at this facility are shared through an agreement between the City of Austin and Austin Independent School District (AISD).',
  },
  {
    slug: 'austin-tennis-and-pickleball-center',
    name: 'Austin Tennis and Pickleball Center at Walnut Creek Sports Park',
    address: '7800 Johnny Morris Rd., Austin, Texas 78724',
    spec: '8 Outdoor Pickleball Courts', courts: 8, dedicated: 8,
    venueType: 'public_park', light: true,
    hours: 'Monday to Friday, 8:30 a.m. to 10:00 p.m.; Saturday and Sunday, 8:30 a.m. to 9:00 p.m.',
    hoursQuote: 'Monday to Friday, 8:30 a.m. to 10:00 p.m.',
    availability: 'Eight outdoor pickleball courts, lit during park hours, and the only venue on Austin\'s list that must be booked: the City marks it "Reservations Required" where every other entry says Open Play. It is the largest pickleball count in the city by some distance.',
    availabilityQuote: 'Reservations Required',
  },
  {
    slug: 'beverly-s-sheffield-northwest-district-park', name: 'Beverly S. Sheffield Northwest District Park',
    address: '7000 Ardath St, Austin, TX 78757',
    spec: '2 Multi-purpose Outdoor Courts with striping for 4 Pickleball Courts', courts: 4, slabs: 2,
    venueType: 'public_park', light: true, hours: OPEN_PLAY_STANDARD,
  },
  {
    slug: 'brentwood-neighborhood-park', name: 'Brentwood Neighborhood Park',
    address: '6710 Arroyo Seco, Austin, Texas 78757',
    spec: '1 Multi-purpose Outdoor Court with striping for 2 Pickleball Courts, bring your own portable net',
    courts: 2, slabs: 1, venueType: 'public_park', light: true, nets: false,
    netsQuote: 'bring your own portable net', hours: OPEN_PLAY_STANDARD,
  },
  {
    slug: 'delta-pocket-park', name: 'Delta Pocket Park',
    address: '2325 Donley Dr., Austin, Texas, 78758',
    spec: 'One dedicated pickleball court', courts: 1, dedicated: 1,
    venueType: 'public_park', hours: OPEN_PLAY_STANDARD,
  },
  {
    slug: 'dick-nichols-district-park', name: 'Dick Nichols District Park',
    address: '8011 Beckett Rd., Austin, Texas 78749',
    spec: '2 Multi-purpose Outdoor Courts with striping for 5 Pickleball Courts', courts: 5, slabs: 2,
    venueType: 'public_park', light: true, hours: OPEN_PLAY_STANDARD,
  },
  {
    slug: 'don-baylor-neighborhood-park', name: 'Don Baylor Neighborhood Park',
    address: '2008 Enfield Rd., Austin, Texas 78703',
    spec: '1 Multi-purpose Outdoor with striping for 2 Pickleball Courts', courts: 2, slabs: 1,
    venueType: 'public_park', hours: OPEN_PLAY_STANDARD,
  },
  {
    slug: 'eastside-pocket-park', name: 'Eastside Pocket Park',
    address: '4617 Tannehill Lane, 78702',
    spec: '1 Dedicated Court', courts: 1, dedicated: 1,
    venueType: 'public_park', hours: OPEN_PLAY_STANDARD,
    /* The City prints 78702; the geocoder returns 78721. See the header. */
    cityPostcode: '78702',
  },
  {
    slug: 'gus-garcia-district-park', name: 'Gustavo "Gus" L. Garcia District Park',
    address: '1201 E Rundberg Ln., Austin, Texas 78753',
    spec: '1 Multi-purpose Outdoor Court with striping for 2 Pickleball Courts', courts: 2, slabs: 1,
    venueType: 'public_park', hours: OPEN_PLAY_STANDARD,
  },
  {
    slug: 'hancock-recreation-center', name: 'Hancock Recreation Center',
    address: '811 E 41st St., Austin, Texas 78751',
    spec: '1 Multi-purpose Outdoor Court with striping for 2 Pickleball Courts', courts: 2, slabs: 1,
    venueType: 'community_center',
    hours: 'Open Play School Year: Monday-Friday 7 a.m. to 2:30 p.m and 6:30-8:30 p.m., Saturday-Sunday 7 a.m. to 8:30 p.m. Open Play Summer/School Year Camp Days: Monday-Friday 6:30-8:30 p.m., Saturday-Sunday 7 a.m. to 8:30 p.m.',
    hoursQuote: 'Open Play School Year: Monday-Friday 7 a.m. to 2:30 p.m and 6:30-8:30 p.m., Saturday-Sunday 7 a.m. to 8:30 p.m.',
    availability: 'One multi-purpose outdoor court striped for two pickleball courts, at a recreation centre rather than in a park — which is why the hours are the most restricted of any Austin venue and change twice a year. Term-time weekday play stops at 2:30 p.m. and resumes at 6:30 p.m.; in summer and on camp days the daytime window closes entirely.',
  },
  {
    slug: 'little-zilker-neighborhood-park', name: 'Little Zilker Neighborhood Park',
    address: '2016 Bluebonnet Ln., Austin, Texas 78704',
    spec: '1 Multi-purpose Outdoor Courts with striping for 4 Pickleball Courts', courts: 4, slabs: 1,
    venueType: 'public_park', light: true, hours: OPEN_PLAY_STANDARD,
  },
  {
    slug: 'mary-frances-baylor-clarksville-pocket-park', name: 'Mary Frances Baylor Clarksville Pocket Park',
    address: '1811 W 11th St., Austin, Texas 78703',
    spec: '1 Dedicated Outdoor Court', courts: 1, dedicated: 1,
    venueType: 'public_park', hours: OPEN_PLAY_STANDARD,
  },
  {
    slug: 'mary-moore-searight-metro-park', name: 'Mary Moore Searight Metro Park',
    address: '907 W Slaughter Ln., Austin, Texas 78748',
    spec: '1 Multi-purpose Outdoor Courts with striping for 4 Pickleball Courts', courts: 4, slabs: 1,
    venueType: 'public_park', hours: OPEN_PLAY_STANDARD,
  },
  {
    slug: 'mountain-view-neighborhood-park', name: 'Mountain View Neighborhood Park',
    address: '8900 Westerkirk Dr., Austin, Texas 78750',
    spec: '1 Multi-purpose Outdoor Courts with striping for 4 Pickleball Courts', courts: 4, slabs: 1,
    venueType: 'public_park', hours: OPEN_PLAY_STANDARD,
  },
  {
    slug: 'north-lake-creek-neighborhood-park', name: 'North Lake Creek Neighborhood Park',
    address: '9201 North Lake Creek, Austin, Texas 78753',
    spec: '1 Multi-purpose Outdoor Court with striping for 1 Pickleball Court', courts: 1, slabs: 1,
    venueType: 'public_park', hours: OPEN_PLAY_STANDARD,
    cityPostcode: '78753',
  },
  {
    slug: 'pan-american-neighborhood-park', name: 'Pan American Neighborhood Park',
    address: '307 Chicon St., Austin, Texas 78702',
    spec: '3 Dedicated Outdoor Courts, 1 Multi-purpose Outdoor Court with striping for 1 Pickleball Court',
    courts: 4, dedicated: 3, slabs: 1, venueType: 'public_park', light: true,
    hours: 'Monday, Wednesday, Friday, 7 a.m. to 10 p.m.; Tuesday and Thursday, 7 a.m. to 7 p.m.; Saturday and Sunday, 7 a.m. to 9 a.m.',
    hoursQuote: 'Monday, Wednesday, Friday, 7 a.m. to 10 p.m.',
    availability: 'Four courts — three dedicated plus one striped multi-purpose court — and the most complicated schedule in Austin, because the courts are shared with roller derby. The City states it outright: "Courts unavailable on Tuesday and Thursday from 7 to 10 p.m. and Saturday and Sunday from 9 a.m. to 12 p.m. for roller derby practice." Weekend play therefore ends at 9 a.m.',
    availabilityQuote: 'Courts unavailable on Tuesday and Thursday from 7 to 10 p.m. and Saturday and Sunday from 9 a.m. to 12 p.m. for roller derby practice',
  },
  {
    slug: 'patterson-neighborhood-park', name: 'Patterson Neighborhood Park',
    address: '4200 Brookview Rd., Austin, Texas 78722',
    spec: '1 Multi-purpose Outdoor Court with striping for 2 Pickleball Courts', courts: 2, slabs: 1,
    venueType: 'public_park', light: true, hours: OPEN_PLAY_STANDARD,
  },
  {
    slug: 'rosewood-neighborhood-park', name: 'Rosewood Neighborhood Park',
    address: '2300 Rosewood Ave., Austin, Texas 78702',
    spec: '2 Dedicated Outdoor Courts, 1 Multi-Purpose Court with striping for 2 Pickleball Courts. Nets not included.',
    courts: 4, dedicated: 2, slabs: 1, venueType: 'public_park', light: true,
    nets: false, netsQuote: 'Nets not included.', hours: OPEN_PLAY_STANDARD,
  },
  {
    slug: 'shipe-neighborhood-park', name: 'Shipe Neighborhood Park',
    address: '4400 Avenue G, Austin, TX 78751',
    spec: '1 Multi-Purpose Outdoor with striping for 2 Pickleball Courts', courts: 2, slabs: 1,
    venueType: 'public_park', light: true, hours: OPEN_PLAY_STANDARD,
  },
  {
    slug: 'south-austin-neighborhood-park', name: 'South Austin Neighborhood Park',
    address: '1100 Cumberland Rd., Austin, Texas 78704',
    spec: '2 Dedicated Outdoor Courts', courts: 2, dedicated: 2,
    venueType: 'public_park', light: true,
    hours: 'Open Play: 7 Days a Week, 8 a.m. to 10 p.m.',
    hoursQuote: 'Open Play: 7 Days a Week, 8 a.m. to 10 p.m.',
  },
  {
    slug: 'springwoods-neighborhood-park', name: 'Springwoods Neighborhood Park',
    address: '9117 Anderson Mill Rd., Austin, Texas 78729',
    spec: '1 Multi-Purpose Outdoor with striping for 2 Pickleball Courts. Nets not included.',
    courts: 2, slabs: 1, venueType: 'public_park',
    nets: false, netsQuote: 'Nets not included.', hours: OPEN_PLAY_STANDARD,
  },
]

const EXCLUDED = {
  name: 'Balcones District Park',
  spec: '1 Multi-purpose outdoor court with striping for Pickleball, bring your own portable net',
  address: '12017 Amherst Dr',
  reasons: [
    'The City states no pickleball court count for it. Its entry reads "striping for Pickleball" where every other multi-purpose entry on the page gives a figure — "striping for 4 Pickleball Courts", "striping for 2 Pickleball Courts". Page Gate 1 requires a verified court count and there is none to verify.',
    'The Census address geocoder returns no match for "12017 Amherst Dr", so Import Gate I1 could not be satisfied either.',
  ],
}

/* ---------------------------------------------------------------- */

const SNAPSHOT = 'data/sources/austin/pickleball.html'

const textLines = readFileSync(join(REPO_ROOT, SNAPSHOT), 'utf8')
  .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
  .replace(/<[^>]+>/g, '\n')
  .replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&#0?39;|&apos;|&lsquo;|&rsquo;|[‘’]/g, "'")
  .replace(/&quot;|[“”]/g, '"')
  .replace(/&#8211;|&#8212;|[–—‑]/g, '-')
  .split('\n').map(s => s.trim()).filter(Boolean)

const squeeze = s => s.replace(/\s+/g, '')

const introAt = textLines.findIndex(l => l === LIST_INTRO)
if (introAt < 0) {
  throw new Error(
    `The Austin snapshot no longer contains the list heading "${LIST_INTRO}". ` +
    'The page has been restructured; re-read it before trusting this run.')
}
const recCentresAt = textLines.findIndex(l => l === 'Pickleball Programming at Rec Centers')
if (recCentresAt < 0) {
  throw new Error('The "Pickleball Programming at Rec Centers" heading is gone; the outdoor list is no longer bounded where this run expects.')
}

/*
  ONE BLOCK PER VENUE.

  The list is a flat run of lines: a venue name, then its address, courts,
  hours and markers, then the next venue name. Blocks are cut at the names,
  which is what makes a per-venue assertion possible at all — see the header.
*/
const NAMES = [...VENUES.map(v => v.name), EXCLUDED.name]
const blocks = new Map()
{
  const seg = textLines.slice(introAt + 1, recCentresAt)
  const starts = []
  seg.forEach((line, i) => {
    const hit = NAMES.find(n => squeeze(line) === squeeze(n))
    if (hit) starts.push({name: hit, i})
  })
  const missing = NAMES.filter(n => !starts.some(s => s.name === n))
  if (missing.length) {
    throw new Error(
      `The Austin list no longer names: ${missing.join(', ')}. ` +
      'A venue this run publishes has been renamed or removed; re-read the page.')
  }
  starts.forEach((s, k) => {
    const end = k + 1 < starts.length ? starts[k + 1].i : seg.length
    blocks.set(s.name, seg.slice(s.i, end))
  })
}

const inBlock = (name, needle) =>
  squeeze(blocks.get(name).join(' ')).includes(squeeze(needle))

const must = (name, needle, what) => {
  if (!inBlock(name, needle)) {
    throw new Error(
      `${name}: its block in the Austin snapshot no longer contains the ${what} text "${needle}". ` +
      'Re-read the page before trusting this run.')
  }
}

const mustNot = (name, needle, what) => {
  if (inBlock(name, needle)) {
    throw new Error(
      `${name}: its block NOW contains "${needle}". The ${what} this run recorded has changed; re-read the page.`)
  }
}

/* The excluded venue, asserted on both of its grounds. */
must(EXCLUDED.name, EXCLUDED.spec, 'unnumbered court')
mustNot(EXCLUDED.name, 'Pickleball Courts', 'absence of a pickleball count')

const counties = JSON.parse(
  readFileSync(join(REPO_ROOT, 'data/sources/austin-county-census.json'), 'utf8'))

if (counties['balcones-district-park']?.matched) {
  throw new Error('Balcones District Park now geocodes. One of the two reasons it is excluded has changed; revisit the exclusion.')
}

const identityRegistry = loadIdentity(REPO_ROOT)
const allRows = loadRows().map(r => mapRow(r).venue)
const bySlug = new Map(
  allRows.filter(v => v.city === 'Austin' && String(v.state).toUpperCase() === 'TX')
    .map(v => [v.slug, v]))

const overlay = {}
const changes = []

for (const p of VENUES) {
  must(p.name, p.address, 'street address')
  must(p.name, p.spec, 'court count')
  if (p.light) must(p.name, LIGHTED, 'lighting')
  else mustNot(p.name, LIGHTED, 'absence of a lighting statement')
  if (p.nets === false) must(p.name, p.netsQuote, 'nets')
  must(p.name, p.hoursQuote ?? p.hours, 'hours')
  if (p.availabilityQuote) must(p.name, p.availabilityQuote, 'availability')

  const geo = counties[p.slug]
  if (!geo?.matched) throw new Error(`${p.slug}: the Census geocoder did not match its address`)
  if (geo.place !== 'Austin city') {
    throw new Error(`${p.slug}: Census places this at "${geo.place}", not Austin city.`)
  }

  const doc = new SourceDocument({
    url: PAGE, retrieved_at: RETRIEVED_AT, tier: 1, publisher: CITY, format: 'html',
  })
  const docCensus = new SourceDocument({
    url: CENSUS_URL, retrieved_at: RETRIEVED_AT, tier: 1, publisher: 'US Census Bureau', format: 'json',
  })

  const shell = {
    slug: p.slug, name: null, city: 'Austin', state: 'TX', county: null,
    postal_code: null, street_address: null, latitude: null, longitude: null,
    status: 'pending', source_url: null, date_checked: null, verified_by: null,
    claimed_by_owner: false, claim_date: null,
    rating: null, user_rating: null, review_count: null, claimed_or_verified: null,
    source_sport: 'pickleball',
  }
  for (const f of PUBLISHED_FACT_FIELDS) shell[f] = null
  const venue = bySlug.get(p.slug) ?? shell

  const quoted = `Quoted from the ${CITY}'s pickleball page, in this venue's own entry: "${p.spec}"`
  const composition = p.slabs && p.dedicated
    ? `${p.dedicated} dedicated courts plus ${p.courts - p.dedicated} striped onto ${p.slabs} multi-purpose court${p.slabs === 1 ? '' : 's'}`
    : p.slabs
      ? `striped onto ${p.slabs} multi-purpose court${p.slabs === 1 ? '' : 's'}`
      : 'all dedicated pickleball courts'

  const street = p.address.split(',')[0].trim()

  const facts = [
    doc.fact('name', p.name, {evidence: `Named "${p.name}" by the ${CITY} on its pickleball page.`}),
    doc.fact('total_courts', p.courts, {
      evidence: p.slabs
        ? `${quoted}. Austin gives two numbers where a court is shared: the physical slabs and the pickleball courts striped onto them. The pickleball figure is what is recorded here — ${p.courts}, ${composition}.`
        : `${quoted}. A single figure, already a pickleball count.`,
    }),
    doc.fact('outdoor_courts', p.courts, {
      evidence: `${quoted}. Every venue on this list is outdoor; the City's indoor courts are in a separate section of the same page and are not published here. The indoor count is left unverified rather than set to zero.`,
    }),
    doc.fact('street_address', street, {
      evidence: `"${p.address}" is the address the City prints beside this venue on its pickleball page.`,
    }),
    doc.fact('venue_type', p.venueType, {
      evidence: p.venueType === 'school'
        ? `The courts sit at Austin High School and are shared under an agreement with Austin Independent School District, which the City states on this page.`
        : p.venueType === 'community_center'
          ? 'The City runs this as a recreation centre rather than a park; its pickleball court is outdoor, and its hours follow the centre rather than park hours.'
          : `Published by the ${CITY} among its parks.`,
    }),
    doc.fact('hours_of_operation', p.hours, {
      evidence: `From this venue's entry on the City's pickleball page: "${p.hoursQuote ?? p.hours}"`,
    }),
    doc.fact('court_availability', p.availability ?? (
      p.slabs && p.dedicated
        ? `${p.courts} courts — ${composition} — open play, first come.`
        : p.slabs
          ? `${p.courts} pickleball court${p.courts === 1 ? '' : 's'} striped onto ${p.slabs} multi-purpose court${p.slabs === 1 ? '' : 's'}, so the court is shared with whatever else it is marked for. Open play, first come.`
          : `${p.courts} dedicated pickleball court${p.courts === 1 ? '' : 's'} — pickleball and nothing else. Open play, first come.`
    ), {
      evidence: `${quoted}, with the hours the City publishes for it: "${p.hoursQuote ?? p.hours}"`,
    }),
    docCensus.fact('county', geo.county, {
      evidence: `${geo.county} County, TX (FIPS ${geo.state_fips}${geo.county_fips}). ${geo.basis} The geocoder also places it in the incorporated place "${geo.place}". Austin spans more than one county, so the county is taken per venue rather than assumed from the city.`,
    }),
    docCensus.fact('postal_code', geo.postal_code, {
      evidence: p.cityPostcode && p.cityPostcode !== geo.postal_code
        ? `${geo.basis} NOTE: the City prints ${p.cityPostcode} for this venue and the geocoder returns ${geo.postal_code} for the same street address. The geocoder's answer is published, as it is for every venue in this directory, and the disagreement is recorded rather than hidden.`
        : geo.basis,
    }),
  ]

  if (p.light) {
    facts.push(doc.fact('light', true, {
      evidence: `This venue's entry carries the words "${LIGHTED}". Austin marks its lit venues individually — eleven of the twenty-one on this list — so the mark belongs to this park rather than to the page.`,
    }))
  }
  if (p.nets === false) {
    facts.push(doc.fact('nets_provided', false, {
      evidence: `This venue's entry says "${p.netsQuote}" — a statement that a net is NOT provided, which is why this reads No rather than "not verified yet". Three Austin venues say it and no other city in this directory says it anywhere.`,
    }))
  }

  const res = applyFacts(venue, facts)

  overlay[p.slug] = {
    minted: !bySlug.has(p.slug),
    identity: {
      name: p.name, city: 'Austin', state: 'TX',
      county: geo.county, postal_code: geo.postal_code ?? null,
      latitude: geo.lat ?? null, longitude: geo.lon ?? null,
      imported_slug: bySlug.has(p.slug) ? p.slug : null,
      canonical_slug: identityRegistry.renames[p.slug]?.canonical ?? p.slug,
    },
    match: {
      source_page: PAGE, quote: p.spec,
      basis: bySlug.has(p.slug)
        ? `Matched to the imported ${p.slug} row in Austin, TX.`
        : `No imported row under this slug. Minted from the ${CITY} pickleball page, which states the name, the address, the court count and the hours in one entry.`,
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
const litCount = VENUES.filter(p => p.light).length
const netsFalse = VENUES.filter(p => p.nets === false).length
const byCounty = VENUES.reduce((m, p) => {
  const c = counties[p.slug].county
  m[c] = (m[c] ?? 0) + 1
  return m
}, {})

for (const [slug, entry] of Object.entries(overlay)) {
  const patch = entry.patch
  if (patch.total_courts !== (patch.outdoor_courts ?? 0) + (patch.indoor_courts ?? 0)) {
    throw new Error(`Rule 13: ${slug} totals ${patch.total_courts} but its parts do not sum to it.`)
  }
}

mkdirSync(join(REPO_ROOT, 'data/verified'), {recursive: true})
writeFileSync(join(REPO_ROOT, 'data/verified/austin-tx.json'), JSON.stringify({
  city: 'Austin', state: 'TX', retrieved_at: RETRIEVED_AT,
  method_note:
    'Austin Parks and Recreation publishes one page listing what it calls the official Department pickleball locations, with a full street address, a court count and opening hours for each, and the words "Lighted during park hours" against eleven of the twenty-one published here. Lighting is a field most operators skip: forty-three of the ninety-five venues published before this city had a verified answer either way, more than half of them from one Seattle GIS layer. Austin is also the first operator anywhere in this directory to state that a net is NOT provided, at three venues. Where the City gives two numbers — "2 Multi-purpose Outdoor Courts with striping for 4 Pickleball Courts" — the pickleball figure is the one recorded. Assertions in this run are made per venue against its own block of the page rather than against the page as a whole, because "Lighted during park hours" appears eleven times and a page-wide check would let a lighting claim survive being moved between parks. Balcones District Park is listed by the City and excluded on two grounds: it states no pickleball court count, and its address does not geocode. Nineteen venues are in Travis County and two in Williamson; the county is taken per venue. Fees and surfaces are stated nowhere and are published nowhere.',
  sources: [
    {url: PAGE, publisher: CITY, tier: 1, format: 'html', snapshot: SNAPSHOT},
    {url: CENSUS_URL, publisher: 'US Census Bureau', tier: 1, format: 'json', snapshot: 'data/sources/austin-county-census.json'},
  ].map((s, i) => ({id: `S${i + 1}`, ...s})),
  totals: {venues: VENUES.length, courts: totalCourts, outdoor: totalCourts, indoor: 0, lit: litCount, by_county: byCounty},
  excluded: [{name: EXCLUDED.name, why: EXCLUDED.reasons}],
  venues: overlay,
}, null, 2) + '\n')

const changed = changes.filter(r =>
  r.old_value !== null && r.old_value !== undefined && String(r.old_value) !== String(r.new_value))

writeFileSync(join(REPO_ROOT, 'reports', 'austin-conflicts.md'), [
  '# Austin verification - the city that answers the lighting question', '',
  `Run ${RETRIEVED_AT}. ${VENUES.length} venues published, ${totalCourts} courts, all outdoor. ` +
  `1 venue excluded.`, '',
  `**${litCount} of ${VENUES.length} venues are stated lit.** Before Austin, forty-three of the ninety-five`,
  'venues in this directory carried a verified answer on lighting either way - and more than half of',
  'those came from one Seattle GIS layer. Austin states it for eleven in prose.', '',
  `**${netsFalse} venues state that a net is NOT provided** - "bring your own portable net" or "Nets not`,
  'included." No other city in this directory has said either way anywhere.', '',
  '| venue | courts | composition | lit | nets | county |',
  '| --- | ---: | --- | --- | --- | --- |',
  ...VENUES.map(p => {
    const comp = p.slabs && p.dedicated ? `${p.dedicated} dedicated + ${p.courts - p.dedicated} striped`
      : p.slabs ? `striped on ${p.slabs} court${p.slabs === 1 ? '' : 's'}` : 'dedicated'
    return `| \`${p.slug}\` | ${p.courts} | ${comp} | ${p.light ? 'yes' : 'not stated'} | ` +
      `${p.nets === false ? '**not provided**' : 'not stated'} | ${counties[p.slug].county} |`
  }),
  '',
  '## How Austin counts', '',
  'Most entries give two numbers - "2 Multi-purpose Outdoor Courts with striping for 4 Pickleball',
  'Courts" - meaning two physical slabs yielding four pickleball courts. The pickleball figure is what',
  'this directory records. Two venues carry both forms and are added: Pan American is 3 dedicated plus',
  '1 striped, and Rosewood is 2 dedicated plus 2 striped.',
  '',
  '## Assertions are per venue, not per page', '',
  '"Lighted during park hours" appears eleven times on this page and the standard open-play line',
  'fifteen. A check that the string exists somewhere in the snapshot would prove nothing about which',
  'park it belongs to. This run splits the list into one block per venue, cut at the venue names, and',
  'asserts every fact inside its own block - so a lighting claim that moves parks fails the build.',
  '',
  '## Two postcodes the City and the Census disagree on', '',
  '| venue | City prints | geocoder returns |',
  '| --- | --- | --- |',
  ...VENUES.filter(p => p.cityPostcode && p.cityPostcode !== counties[p.slug].postal_code)
    .map(p => `| \`${p.slug}\` | ${p.cityPostcode} | ${counties[p.slug].postal_code} |`),
  '',
  'The geocoder\'s answer publishes, as it does for every venue in this directory, and the',
  'disagreement is recorded rather than quietly resolved.',
  '',
  '## Austin is in two counties', '',
  Object.entries(byCounty).map(([c, n]) => `${n} venues in ${c} County`).join(', ') + '.',
  'Travis clears the three-venue threshold and gets a county page; Williamson does not and gets none.',
  '',
  '## Excluded', '',
  `**${EXCLUDED.name}** - "${EXCLUDED.spec}" - two independent reasons:`, '',
  ...EXCLUDED.reasons.map((r, i) => `${i + 1}. ${r}`),
  '',
  changed.length ? '## Values a source changed' : '_No imported row was overwritten._',
  ...(changed.length ? [
    '', '| venue | field | was | now | outcome |', '| --- | --- | --- | --- | --- |',
    ...changed.map(r => `| \`${r.venue_slug}\` | ${r.field} | ${JSON.stringify(r.old_value)} | ${JSON.stringify(r.new_value)} | ${r.outcome} |`),
  ] : []),
  '',
].join('\n'))

console.log(`\nAustin, TX - ${VENUES.length} venues, ${totalCourts} courts (all outdoor), retrieved ${RETRIEVED_AT}`)
for (const p of VENUES) {
  const o = overlay[p.slug]
  console.log(
    `  ${o.patch.name.slice(0, 44).padEnd(46)} ${String(o.patch.total_courts).padStart(2)}` +
    ` | lights ${String(o.patch.light ?? 'not stated').padEnd(11)}` +
    ` | nets ${String(o.patch.nets_provided ?? 'not stated').padEnd(11)}` +
    ` | ${o.patch.county} County`)
}
console.log(`\n  ${litCount} lit, ${netsFalse} state nets are not provided`)
console.log(`  counties: ${Object.entries(byCounty).map(([c, n]) => `${c} ${n}`).join(', ')}`)
console.log(`  excluded: ${EXCLUDED.name} - no pickleball count stated, and its address does not geocode.`)
console.log('\nWrote data/verified/austin-tx.json and reports/austin-conflicts.md\n')
