#!/usr/bin/env node
/*
  Chandler, AZ verification run. Chandler DOES NOT PUBLISH: two venues
  survive the gates and a city needs three. The run is kept so the record
  exists - every count sentence, address and refusal is asserted against
  the snapshots - and it writes reports/chandler-conflicts.md and then
  throws before it would write data/verified/chandler-az.json.

  ============================================================
  A WRITTEN NUMBER IS A COUNT; SO IS "SINGLE"; AN ARTICLE IS NOT
  ============================================================

  Chandler counts its courts in prose on each park's own page, and it
  counts them three different ways:

      Arrowhead Meadows   "It's also a pickleball player's paradise,
                           featuring six courts."  and  "This park has
                           six courts"
      La Paloma           "The single pickleball court at La Paloma park"
      Brooks Crossing     "This single pickleball court is perfect for a
                           quick game"
      Homestead North     "The well-lit pickleball court at Homestead
                           North"
      Pecos Ranch         "This multi-use court features a pickleball
                           court"

  "six courts" is a number. "single" is a number too - it states how many
  there are, and one is a count this project has published before (Kirkland's
  Feriton Spur, Portland's Hillside, Tampa's Madison Street). "The ...
  court" and "a pickleball court" are not: a definite or indefinite article
  says a court exists without saying how many, which is the label the Mesa
  rule refuses - a flag is not a number. Homestead North and Pecos Ranch
  carry a court each on any plain reading, and neither publishes, because
  reading is not the same as the operator stating it.

  ============================================================
  ONE SENTENCE PRICES EVERY OUTDOOR COURT AND CALLS IT OUTDOOR
  ============================================================

      "There is no cost to play at Chandler's outdoor pickleball courts,
       and reservations are not currently accepted."

  That is the City's pickleball page, and it does three things at once: it
  states the price (free), it states the court is outdoor, and it states
  the play format (no reservations; the Tumbleweed paragraph adds "on a
  first-come, first-served basis"). Both publishable venues are park
  courts covered by it. Every park page states the same hours, "Open for
  public use from 6 a.m. to 10:30 p.m."

  ============================================================
  WHAT IS REFUSED
  ============================================================

  Arrowhead Meadows    "featuring six courts" and "This park has six
  Park                 courts", at "1475 W. Erie St." in 85224 on the
                       City's page. The Census answers "1475 E ERIE ST"
                       in 85225 - the compass direction flipped and a
                       different postcode - and OpenStreetMap has no
                       record of the address as written. That is Tampa's
                       Foster Park case exactly (direction flipped by the
                       resolver, the City's own postcode contradicting the
                       only answer available), and Foster Park was
                       refused. An earlier draft of this run published it
                       on the Census answer under Mesa's Chaparral Park
                       postcode rule; that rule covers a postcode
                       disagreement on an address that resolved AS
                       WRITTEN, which this one did not. A rule relaxed on
                       the day it costs something is not a rule. Six
                       courts, the largest count that could have
                       published here, and the refusal that takes
                       Chandler below the threshold.

  Tumbleweed Park      "18 outdoor courts with LED lighting", opened
  Pickleball Facility  6 September 2025, at "2041 S. Pioneer Parkway".
                       Neither resolver finds the address. This is the
                       THIRD time this project has refused it: it was one
                       of the nine refusals that prompted the second
                       resolver on 2026-09-04, the second resolver still
                       refused it that day, and it is refused again here.
                       The most expensive refusal in the city by a
                       distance - 18 courts against the 8 that publish.

  Arbuckle Park        "This single pickleball court". The City prints two
                       addresses for it - "1100 S. Norman Way" on the park
                       page and "110 S. Norman Way" on the pickleball page
                       - and neither resolves. Two grounds, either
                       sufficient.

  Homestead North      "The well-lit pickleball court at Homestead North".
                       An article, not a number.

  Pecos Ranch          "This multi-use court features a pickleball court".
                       An article, not a number.

  Apache Park          "the pickleball courts are lined only and use
                       existing tennis court nets". No count.

  ============================================================
  WHAT IS NOT CLAIMED
  ============================================================

  lighting   Brooks Crossing: "Play into the evening on this well lit
             court." - true. La Paloma says its basketball court is well
             lit and nothing about the pickleball court, so it stays null.
  surface    Not stated.
  nets       Not stated at either publishable venue.

  ============================================================
  BELOW THE THRESHOLD
  ============================================================

  La Paloma and Brooks Crossing pass every gate: a stated count, an
  address that resolves as written in the City's own postcode, a price,
  an indoor/outdoor answer and hours. That is two venues, one court each.
  A city, county or filter page exists only with three or more verified
  venues, so Chandler cannot publish. The run still asserts everything -
  if Tumbleweed or Arbuckle or Arrowhead ever resolves, or Homestead North
  or Pecos Ranch ever gains a number, the throw below tells the next
  reader which venue to re-read - and it writes the conflicts report so
  the reasoning is on the record. It removes any stale
  data/verified/chandler-az.json and throws before writing a new one.
*/

import {readFileSync, writeFileSync, mkdirSync, rmSync} from 'node:fs'
import {join} from 'node:path'
import {SourceDocument} from './provenance.mjs'
import {applyFacts, changelogToRows} from './conflict.mjs'
import {loadRows, REPO_ROOT} from '../lib/load-csv.mjs'
import {PUBLISHED_FACT_FIELDS} from '../../lib/data/verified.mjs'
import {loadIdentity} from '../../lib/data/identity.mjs'
import {mapRow} from '../import/mapper.mjs'

const RETRIEVED_AT = process.env.RETRIEVED_AT ?? '2026-09-07'

const CITY = 'City of Chandler Parks'
const PAGE = 'https://www.chandleraz.gov/explore/chandler-parks/guide/tumbleweed-park/pickleball-courts'
const PARK_BASE = 'https://www.chandleraz.gov/explore/chandler-parks/guide'
const CENSUS_URL = 'https://geocoding.geo.census.gov/geocoder/geographies'

const NO_COST = "There is no cost to play at Chandler's outdoor pickleball courts, and reservations are not currently accepted."
const FIRST_COME = 'The new facility is open to the public on a first-come, first-served basis during regular park hours'
const PARK_HOURS = 'Open for public use from 6 a.m. to 10:30 p.m.'
const TUMBLEWEED_SPEC = 'the facility features 18 outdoor courts with LED lighting, restrooms, practice courts, drinking fountains, and a new parking lot.'
const TUMBLEWEED_ADDRESS = '2041 S. Pioneer Parkway'
const OTHER_HEADING = 'Other Pickleball Courts in Chandler'
const THRESHOLD = 3
const VERIFIED_PATH = join(REPO_ROOT, 'data/verified/chandler-az.json')

const ARROWHEAD_ADDRESS = '1475 W. Erie St.'
const ARROWHEAD_CITY_ZIP = '85224'
const ARROWHEAD_CENSUS_ZIP = '85225'

const VENUES = [
  {
    slug: 'la-paloma-park', importedSlug: null, name: 'La Paloma Park', page: 'la-paloma-park',
    courts: 1, light: null, restroom: false,
    spec: 'The single pickleball court at La Paloma park is the perfect spot to practice your skills and enjoy some friendly competition.',
    address: '6579 S. Amanda Drive', cityZip: '85249', zipNoted: false,
    availability:
      'One outdoor pickleball court in a neighbourhood park in the south of the city, counted in the City\'s own word: "The single pickleball court at La Paloma park". One court is a game rather than a rotation. Free and unreserved under the City\'s sentence about all of its outdoor pickleball courts, open 6 a.m. to 10:30 p.m. The park has a 0.57-mile walking path, a play structure, pavilions, picnic tables, two horseshoe pits, foursquare and hopscotch, and a basketball court the City says "is well lit so you can play into the evening hours"; it says nothing about lighting on the pickleball court, so that stays unknown.',
  },
  {
    slug: 'brooks-crossing-park', importedSlug: null, name: 'Brooks Crossing Park', page: 'brooks-crossing-park',
    courts: 1, light: true, restroom: false,
    spec: 'This single pickleball court is perfect for a quick game, or a few, with friends or family. Play into the evening on this well lit court.',
    address: '1345 W. Calle Del Norte', cityZip: '85224', zipNoted: false,
    availability:
      'One outdoor pickleball court in what the City calls "the newly renovated Brooks Crossing park", and the only published Chandler court with a stated lighting answer: "Play into the evening on this well lit court." The count is the City\'s word "single". Free and unreserved under the City\'s sentence about all of its outdoor pickleball courts, open 6 a.m. to 10:30 p.m. The park has fitness nodes, a walking path, a well-lit basketball court, two play structures and a large open field. One court is a game rather than a rotation, and a lit one means the game can run past sunset.',
  },
]

const EXCLUDED = [
  {
    name: 'Arrowhead Meadows Park', page: 'arrowhead-meadows-park',
    spec: "It's also a pickleball player's paradise, featuring six courts.",
    spec2: 'This park has six courts for you to get your pickle on with friends, family, or even some new pickleball pals.',
    address: ARROWHEAD_ADDRESS, cityZip: ARROWHEAD_CITY_ZIP, geo: 'arrowhead-meadows-park',
    reasons: [
      `The City prints "${ARROWHEAD_ADDRESS}" and the postcode ${ARROWHEAD_CITY_ZIP}. The US Census address geocoder answers "1475 E ERIE ST, CHANDLER, AZ, ${ARROWHEAD_CENSUS_ZIP}" - the compass direction flipped from W to E and a different postcode - and OpenStreetMap has no record of the address as the City writes it. An address that resolves only by changing which side of the city it is on has not resolved.`,
      `The City's own postcode, ${ARROWHEAD_CITY_ZIP}, contradicts the only answer available. This is Tampa's Foster Park case exactly, and Foster Park was refused. Mesa's Chaparral Park rule - publish the Census postcode and state the disagreement - covers an address that resolved as written; it does not cover one the resolver had to rewrite. A rule relaxed on the day it costs something is not a rule.`,
      'The count is stated twice - "featuring six courts" and "This park has six courts" - so the venue fails on its address alone. Six courts, and the refusal that takes Chandler from three publishable venues to two, below the threshold.',
    ],
  },
  {
    name: 'Tumbleweed Park Pickleball Facility', page: null,
    spec: TUMBLEWEED_SPEC, address: TUMBLEWEED_ADDRESS, geo: 'tumbleweed-park',
    reasons: [
      `Neither address resolver finds "${TUMBLEWEED_ADDRESS}", the address the City publishes for it: the US Census address file returns no match and OpenStreetMap returns nothing at house-number level. Import Gate I1 requires a street address that resolves.`,
      'This is the third time this project has refused it. It was among the nine refusals that prompted the second resolver on 2026-09-04, the second resolver still refused it that day, and it is refused again here. Eighteen lit outdoor courts, opened 6 September 2025, against the two courts that survive the gates - the most expensive refusal in the city by a distance.',
    ],
  },
  {
    name: 'Arbuckle Park', page: 'arbuckle-park',
    spec: 'This single pickleball court is perfect for practicing your skills and playing games with friend.',
    address: '1100 S. Norman Way', address2: '110 S. Norman Way', geo: 'arbuckle-park', geo2: 'arbuckle-park-list',
    reasons: [
      'The City prints two addresses for it: "1100 S. Norman Way" on the park\'s own page and "110 S. Norman Way" on its pickleball page. Neither resolves with either resolver.',
      'The count is stated - "This single pickleball court" - so the venue fails on its address alone, twice over.',
    ],
  },
  {
    name: 'Homestead North Park', page: 'homestead-north-park',
    spec: 'The well-lit pickleball court at Homestead North is a great place to get your pickle on all day long.',
    address: '1925 E. Frye Road', geo: 'homestead-north-park',
    reasons: [
      'The City states no count. "The well-lit pickleball court" is a definite article, not a number: it says a court exists and says nothing about how many. That is a label, and a flag is not a number (the Mesa rule). The address resolves and the court is stated lit; the venue fails on the one fact a court page cannot do without.',
    ],
  },
  {
    name: 'Pecos Ranch Park', page: 'pecos-ranch-park',
    spec: 'This multi-use court features a pickleball court as well as some extra space to play your own game.',
    address: '1555 W. Maplewood St.', geo: 'pecos-ranch-park',
    reasons: [
      'The City states no count. "features a pickleball court" is an article, not a number, and the park description says only "a multi-use court with a pickleball net". Same ground as Homestead North.',
    ],
  },
  {
    name: 'Apache Park', page: 'apache-park',
    spec: 'Please note that the pickleball courts are lined only and use existing tennis court nets.',
    address: '1300 N. Hartford St.', geo: 'apache-park',
    reasons: [
      'The City states no count. Its page says the pickleball courts "are lined only and use existing tennis court nets" and counts the tennis courts ("four tennis courts"), never the pickleball ones. Apache is not on the City\'s pickleball page at all.',
    ],
  },
]

/* ---------------------------------------------------------------- */

const snapshotPath = name => `data/sources/chandler/${name}.html`

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

/* The city-wide statements every published venue leans on. */
for (const [needle, what] of [
  [NO_COST, 'no-cost, outdoor and no-reservations sentence'],
  [FIRST_COME, 'first-come rule'],
  [OTHER_HEADING, 'heading over the park list'],
  ['daily from 6 a.m. to 10:30 p.m', 'park hours on the pickleball page'],
]) {
  must('pickleball-courts', 'Chandler', needle, what)
}

/*
  The park list under "Other Pickleball Courts in Chandler" is asserted as
  a block: six parks, name then address, in this order. A seventh, or a
  changed address, fails the build.
*/
const list = linesOf(snapshotPath('pickleball-courts'))
const start = list.findIndex(l => squeeze(l) === squeeze(OTHER_HEADING))
const LIST = [
  ['Arbuckle Park', '110 S. Norman Way'], ['Arrowhead Meadows Park', '1475 W. Erie St.'],
  ['Homestead North Park', '1925 E. Frye Road'], ['La Paloma Park', '6579 S. Amanda Drive'],
  ['Pecos Ranch Park', '1555 W. Maplewood St.'], ['Brooks Crossing Park', '1345 W. Calle Del Norte'],
]
const got = list.slice(start + 1, start + 1 + LIST.length * 2).map(squeeze)
const want = LIST.flat().map(squeeze)
if (got.join('|') !== want.join('|')) {
  throw new Error(`The park list on the City's pickleball page has changed. Expected ${JSON.stringify(LIST.flat())}, page reads ${JSON.stringify(list.slice(start + 1, start + 1 + LIST.length * 2))}.`)
}
if (!/^Chandler Recreation Pickleball Programs/.test(list[start + 1 + LIST.length * 2] ?? '')) {
  throw new Error('The park list on the City\'s pickleball page now carries a seventh entry. Re-read the city.')
}

const counties = JSON.parse(
  readFileSync(join(REPO_ROOT, 'data/sources/chandler-county-census.json'), 'utf8'))

/* ---------------------------------------------------------------- */
/* THE REFUSALS, ASSERTED RATHER THAN REMEMBERED.                    */

for (const e of EXCLUDED) {
  must(e.page ?? 'pickleball-courts', e.name, e.spec, 'what the City says about the refused venue')
  if (e.spec2) must(e.page, e.name, e.spec2, 'second count sentence about the refused venue')
  must(e.page ?? 'pickleball-courts', e.name, e.address, 'address of the refused venue')
  if (e.address2) must('pickleball-courts', e.name, e.address2, 'second address on the pickleball page')
  if (e.cityZip) must(e.page, e.name, `Chandler , AZ ${e.cityZip}`, 'postcode on the refused venue\'s park page')
}
/*
  Arrowhead Meadows is refused on the Foster Park ground: the only match is
  a rewritten address in a postcode the City contradicts. The refusal holds
  only while that stays true. If it ever resolves as the City writes it -
  through OpenStreetMap, or with the Census keeping "W" - or in the City's
  own postcode, the ground is gone and the venue must be re-read and
  published, which would also put Chandler back over the threshold.
*/
{
  const geo = counties['arrowhead-meadows-park']
  if (!geo?.matched) throw new Error('Arrowhead Meadows Park: no resolver answer at all now. Re-read the resolver record before trusting this refusal.')
  if (geo.resolver === 'osm' || /\bW\.?\s+ERIE\b/i.test(geo.matched)) {
    throw new Error(`Arrowhead Meadows Park now resolves as written ("${geo.matched}" via ${geo.resolver}). Six courts: re-read and publish it, and Chandler is back over the threshold.`)
  }
  if (geo.postal_code === ARROWHEAD_CITY_ZIP) {
    throw new Error(`Arrowhead Meadows Park now resolves in the City's own postcode ${ARROWHEAD_CITY_ZIP}. Six courts: re-read and publish it.`)
  }
  if (!/\bE ERIE ST\b/.test(geo.matched) || geo.postal_code !== ARROWHEAD_CENSUS_ZIP) {
    throw new Error(`Arrowhead Meadows Park: the resolver record changed ("${geo.matched}", ${geo.postal_code}); the refusal was written against "1475 E ERIE ST" in ${ARROWHEAD_CENSUS_ZIP}. Re-read it.`)
  }
}
if (counties['tumbleweed-park']?.matched) {
  throw new Error('Tumbleweed Park Pickleball Facility now resolves. Eighteen lit courts: re-read and publish it.')
}
if (counties['arbuckle-park']?.matched || counties['arbuckle-park-list']?.matched) {
  throw new Error('Arbuckle Park now resolves at one of its two City addresses. Re-read and publish it.')
}
/* An article must stay an article: if the City writes a number for these, the build stops. */
for (const p of ['homestead-north-park', 'pecos-ranch-park', 'apache-park']) {
  if (/\b(one|two|three|four|five|six|seven|eight|nine|ten|single|\d+)\s+(outdoor\s+|lit\s+|lighted\s+|dedicated\s+)?pickleball courts?\b/i.test(linesOf(snapshotPath(p)).join(' '))) {
    throw new Error(`${p}: the park page now states a pickleball count. Re-read and publish it.`)
  }
}

const identityRegistry = loadIdentity(REPO_ROOT)
const allRows = loadRows().map(r => mapRow(r).venue)
const bySlug = new Map(
  allRows.filter(v => v.city === 'Chandler' && String(v.state).toUpperCase() === 'AZ')
    .map(v => [v.slug, v]))

const overlay = {}
const changes = []

for (const p of VENUES) {
  must(p.page, p.slug, p.spec, 'court count sentence')
  if (p.spec2) must(p.page, p.slug, p.spec2, 'second court count sentence')
  must(p.page, p.slug, p.address, 'address on the park page')
  must(p.page, p.slug, PARK_HOURS, 'hours on the park page')
  must(p.page, p.slug, `Chandler , AZ ${p.cityZip}`, 'postcode on the park page')
  must('pickleball-courts', p.slug, p.name, 'name in the park list')
  if (p.restroom) must(p.page, p.slug, 'Restrooms', 'restrooms in the amenity list')

  /* A lighting silence must stay a silence. */
  if (p.light === null && /well[- ]lit pickleball|pickleball court[^.]{0,40}(well[- ]lit|lighted)|lit pickleball/i.test(linesOf(snapshotPath(p.page)).join(' '))) {
    throw new Error(`${p.slug}: the park page now says something about pickleball lighting. Re-read it.`)
  }

  const geo = counties[p.slug]
  if (!geo?.matched) throw new Error(`${p.slug}: no address resolver matched its address`)
  if (!geo.place_matches_city) {
    throw new Error(`${p.slug}: the resolver places this at "${geo.place}", not Chandler.`)
  }
  if (p.zipNoted) {
    if (geo.postal_code === p.cityZip) throw new Error(`${p.slug}: the resolver now agrees with the City's postcode. Remove the note.`)
  } else if (geo.postal_code !== p.cityZip) {
    throw new Error(`${p.slug}: the resolver's postcode ${geo.postal_code} differs from the City's ${p.cityZip}.`)
  }

  const doc = new SourceDocument({
    url: PAGE, retrieved_at: RETRIEVED_AT, tier: 1, publisher: CITY, format: 'html',
  })
  const docPark = new SourceDocument({
    url: `${PARK_BASE}/${p.page}`, retrieved_at: RETRIEVED_AT, tier: 1, publisher: CITY, format: 'html',
  })
  const docCensus = new SourceDocument({
    url: CENSUS_URL, retrieved_at: RETRIEVED_AT, tier: 1, publisher: 'US Census Bureau', format: 'json',
  })

  const shell = {
    slug: p.slug, name: null, city: 'Chandler', state: 'AZ', county: null,
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
    docPark.fact('name', p.name, {
      evidence: `Named "${p.name}" on the park's own page and in the park list on the City's pickleball page.`,
    }),
    docPark.fact('total_courts', p.courts, {
      evidence: p.spec2
        ? `Stated twice on the park's own page: "${p.spec}" and "${p.spec2}".`
        : `The City's own word on the park's page: "${p.spec}" - "single" states how many, which is what a count is.`,
    }),
    docPark.fact('street_address', p.address, {
      evidence: `"${p.address}" in the contact block on the park's own page, and again in the park list on the City's pickleball page.`,
    }),
    docPark.fact('venue_type', 'public_park', {evidence: `Published by the ${CITY} in its guide to Chandler parks.`}),
    doc.fact('fee_type', 'free', {
      evidence: `The City states it for all of its outdoor pickleball courts in one sentence: "${NO_COST}"`,
    }),
    doc.fact('outdoor_courts', p.courts, {
      evidence: `The word is the City's, in the same sentence that prices the courts: "${NO_COST}"`,
    }),
    doc.fact('play_format', 'open_play', {
      evidence: `"${NO_COST}" and, of the Tumbleweed facility, "${FIRST_COME}".`,
    }),
    docPark.fact('hours_of_operation', '6 a.m. to 10:30 p.m. daily', {
      evidence: `"${PARK_HOURS}" on the park's own page; the pickleball page gives the same hours for the parks, "daily from 6 a.m. to 10:30 p.m".`,
    }),
    docPark.fact('court_availability', p.availability, {
      evidence: `From the park's own page ("${p.spec}", "${PARK_HOURS}") and the City's pickleball page ("${NO_COST}").`,
    }),
    docCensus.fact('county', geo.county, {
      evidence: `${geo.county} County, AZ${geo.county_fips ? ` (FIPS ${geo.state_fips}${geo.county_fips})` : ''}. ${geo.basis} The resolver also places it in the incorporated place "${geo.place}", which is what allows it to be published under Chandler.`,
    }),
    docCensus.fact('postal_code', geo.postal_code, {
      evidence: p.zipNoted
        ? `${geo.basis} The City's own park page prints ${p.cityZip}; the Census address file returns ${geo.postal_code} for the same street address. The Census value publishes, as at Mesa's Chaparral Park, and the disagreement is stated on the venue page.`
        : geo.basis,
    }),
  ]
  if (p.light === true) {
    facts.push(docPark.fact('light', true, {
      evidence: `The City's own words about this court: "${p.spec}"`,
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
      name: p.name, city: 'Chandler', state: 'AZ',
      county: geo.county, postal_code: geo.postal_code ?? null,
      latitude: geo.lat ?? null, longitude: geo.lon ?? null,
      imported_slug: p.importedSlug ?? null,
      canonical_slug: identityRegistry.renames[p.importedSlug]?.canonical ?? p.slug,
    },
    match: {
      source_page: `${PARK_BASE}/${p.page}`, quote: p.spec,
      basis: 'No imported row for this park. Minted here from the City\'s own pages, which state the count and the address.',
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

for (const [slug, entry] of Object.entries(overlay)) {
  const {total_courts: t, indoor_courts: i, outdoor_courts: o} = entry.patch
  if (i != null && o != null && t !== i + o) {
    throw new Error(`Rule 13: ${slug} does not sum.`)
  }
}

const METHOD_NOTE =
  'Chandler counts its courts in prose on each park\'s own page. Three parks state a number - "featuring six courts" and "This park has six courts" at Arrowhead Meadows, and "single pickleball court" at La Paloma and Brooks Crossing, the word "single" being a count of one - and two parks whose pages say "The well-lit pickleball court" and "features a pickleball court" are refused, because an article says a court exists without saying how many: a flag is not a number. One sentence on the City\'s pickleball page prices every outdoor court, calls it outdoor and rules out reservations - "There is no cost to play at Chandler\'s outdoor pickleball courts, and reservations are not currently accepted." - with the park hours "6 a.m. to 10:30 p.m." from each park page. Arrowhead Meadows is refused on the Foster Park ground: the City prints "1475 W. Erie St." in 85224, the Census answers "1475 E ERIE ST" in 85225, and OpenStreetMap has no record of the address as written. The Tumbleweed Park Pickleball Facility, eighteen lit outdoor courts opened 6 September 2025, is refused for the third time in this project\'s history because neither resolver finds "2041 S. Pioneer Parkway"; Arbuckle Park is refused because the City prints two addresses for it and neither resolves. That leaves La Paloma and Brooks Crossing, two venues, below the three a city needs, so Chandler does not publish.'

const changed = changes.filter(r =>
  r.old_value !== null && r.old_value !== undefined && String(r.old_value) !== String(r.new_value))

const arrowhead = EXCLUDED.find(e => e.name === 'Arrowhead Meadows Park')
writeFileSync(join(REPO_ROOT, 'reports', 'chandler-conflicts.md'), [
  '# Chandler verification - two publishable venues, below the threshold: the city does not publish', '',
  `Run ${RETRIEVED_AT}. ${VENUES.length} venues publishable, ${totalCourts} courts. ${EXCLUDED.length} venues refused. **No page is built for Chandler.**`, '',
  'Chandler cannot publish. A city, county or filter page exists only with three or more verified venues, and',
  'after the refusals below Chandler has two: La Paloma Park and Brooks Crossing Park, one court each. Both pass',
  'every gate. The run is kept so the record exists, it asserts every sentence it relies on, and it throws before',
  'writing data/verified/chandler-az.json. It would be the third city in Arizona, after Scottsdale and Mesa, and',
  'the third in Maricopa County, if any one of Arrowhead Meadows, Tumbleweed or Arbuckle ever resolved, or if',
  'Homestead North or Pecos Ranch ever gained a number.', '',
  '| venue | courts | lit | what the City writes | address |',
  '| --- | ---: | --- | --- | --- |',
  ...VENUES.map(p => `| \`${p.slug}\` | ${p.courts} | ${p.light === true ? 'yes' : 'not stated'} | "${p.spec}" | ${p.address} |`),
  '',
  '## The refusal that took Chandler below the threshold', '',
  `**${arrowhead.name}** - "${arrowhead.spec}" - ${arrowhead.address}, ${arrowhead.cityZip}`, '',
  'The City prints "1475 W. Erie St." and the postcode 85224. The Census address file answers "1475 E ERIE ST" in',
  '85225 - West became East, and the postcode changed with it - and OpenStreetMap has no record of the address as',
  'written. That is Tampa\'s Foster Park case exactly: the direction flipped by the resolver, and the City\'s own',
  'postcode contradicting the only answer available. Foster Park was refused. An earlier draft of this run',
  'published Arrowhead on the Census answer under Mesa\'s Chaparral Park postcode rule, which covers a postcode',
  'disagreement on an address that resolved as written; this one did not resolve as written. A rule relaxed on',
  'the day it costs something is not a rule, and here it costs six courts and the city page.',
  '',
  '## The count rule this city needed', '',
  'A written number is a count ("six courts"). So is "single" attached to the court ("This single pickleball',
  'court"): it states how many. A definite or indefinite article is not ("The well-lit pickleball court at',
  'Homestead North", "features a pickleball court" at Pecos Ranch): it says a court exists and nothing about',
  'how many, which is the label the Mesa rule refuses. Both parks plainly have a court; neither publishes,',
  'because reading is not the same as the operator stating it. The run fails if either page gains a number.',
  '',
  '## Refused', '',
  ...EXCLUDED.flatMap(e => [
    `**${e.name}** - "${e.spec}" - ${e.address}${e.address2 ? ` / ${e.address2}` : ''}${e.cityZip ? `, ${e.cityZip}` : ''}`, '',
    ...e.reasons.map((r, i) => `${i + 1}. ${r}`), '']),
  '## What Chandler does not say', '',
  '- **lighting**, at La Paloma. Its page says the basketball court is well lit and says nothing about the',
  '  pickleball court. Brooks Crossing says it: "Play into the evening on this well lit court."',
  '- **surface.**',
  '- **nets.**',
  '',
  changed.length ? '## Values a source changed' : '_No imported row was overwritten._',
  ...(changed.length ? [
    '', '| venue | field | was | now | outcome |', '| --- | --- | --- | --- | --- |',
    ...changed.map(r => `| \`${r.venue_slug}\` | ${r.field} | ${JSON.stringify(r.old_value)} | ${JSON.stringify(r.new_value)} | ${r.outcome} |`),
  ] : []),
  '',
].join('\n'))

/*
  The threshold. Below it, no verified file may exist for this city: a
  stale one from an earlier draft would publish pages the rules refuse.
  The report above is the record; the throw is the verdict.
*/
if (VENUES.length < THRESHOLD) {
  rmSync(VERIFIED_PATH, {force: true})
  console.log(`\nChandler, AZ - ${VENUES.length} publishable venues, ${totalCourts} courts, retrieved ${RETRIEVED_AT}`)
  console.log(`  refused: ${EXCLUDED.map(e => e.name).join(', ')}`)
  console.log('\nWrote reports/chandler-conflicts.md. Removed data/verified/chandler-az.json if it existed.\n')
  throw new Error(`Chandler: ${VENUES.length} publishable venues, below the threshold`)
}

mkdirSync(join(REPO_ROOT, 'data/verified'), {recursive: true})
writeFileSync(VERIFIED_PATH, JSON.stringify({
  city: 'Chandler', state: 'AZ', retrieved_at: RETRIEVED_AT,
  method_note: METHOD_NOTE,
  sources: [
    {url: PAGE, publisher: CITY, tier: 1, format: 'html', snapshot: snapshotPath('pickleball-courts')},
    ...VENUES.map(p => ({
      url: `${PARK_BASE}/${p.page}`, publisher: CITY, tier: 1, format: 'html', snapshot: snapshotPath(p.page),
    })),
    ...EXCLUDED.filter(e => e.page).map(e => ({
      url: `${PARK_BASE}/${e.page}`, publisher: CITY, tier: 1, format: 'html', snapshot: snapshotPath(e.page),
    })),
    {url: CENSUS_URL, publisher: 'US Census Bureau', tier: 1, format: 'json', snapshot: 'data/sources/chandler-county-census.json'},
  ].map((s, i) => ({id: `S${i + 1}`, ...s})),
  totals: {
    venues: VENUES.length, courts: totalCourts,
    outdoor: totalCourts, indoor: null,
    lit_courts: litCourts, free_venues: VENUES.length,
  },
  excluded: EXCLUDED.map(e => ({name: e.name, why: e.reasons})),
  venues: overlay,
}, null, 2) + '\n')

console.log(`\nChandler, AZ - ${VENUES.length} venues, ${totalCourts} courts, retrieved ${RETRIEVED_AT}`)
for (const p of VENUES) {
  const o = overlay[p.slug]
  console.log(
    `  ${o.patch.name.padEnd(24)} ${String(o.patch.total_courts).padStart(2)} | ${(p.light === true ? 'lit' : 'lighting not stated').padEnd(19)} | free | ${o.patch.county} County | ${counties[p.slug].postal_code} | via ${counties[p.slug].resolver}`)
}
console.log(`\n  refused: ${EXCLUDED.map(e => e.name).join(', ')}`)
console.log('\nWrote data/verified/chandler-az.json and reports/chandler-conflicts.md\n')
