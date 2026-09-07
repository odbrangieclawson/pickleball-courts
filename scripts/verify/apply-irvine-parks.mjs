#!/usr/bin/env node
/*
  Irvine, CA verification run - city #17, the first in California and the
  first in Orange County.

  ============================================================
  WHY IRVINE
  ============================================================

  The City states its pickleball count twice for every venue: once in a
  sentence on its pickleball page, and once in the amenity list on each
  park's own page, where the address and the hours sit as well.

      pickleball page   "The City of Irvine has eight lit pickleball courts
                         located at Mike Ward Community Park, six lit
                         pickleball courts located at Portola Springs
                         Community Park, four lit pickleball courts located
                         at Heritage Park, and two lit pickleball courts
                         located at Los Olivos Community Park."

      park pages        "8 Lighted Pickleball Courts"
                        "6 Lighted Pickleball Courts"
                        "4 Lighted Pickleball Courts"
                        "3 Lighted Pickleball Courts"      <- Los Olivos

  Two records that agree are worth more than one, and two records that
  disagree are worth writing down. Three venues agree and publish. Los
  Olivos does not, and is refused below.

  Every published court is lit, in the City's own word, and every park page
  states the same hours: "6 a.m.-10 p.m., Daily". Irvine also publishes how
  a court is shared - "Open courts are on a first-come, first-serve basis",
  doubles limited to 60 minutes and singles to 30 when others are waiting -
  and prices the two reservable courts at each of its two largest venues:
  "Resident Rate: $17/hr", "Non-Resident Rate: $19/hr".

  ============================================================
  LOS OLIVOS IS REFUSED BECAUSE THE CITY DISAGREES WITH ITSELF
  ============================================================

  The pickleball page says two lit courts; the court regulations page says
  two; the park's own amenity list says "3 Lighted Pickleball Courts". Three
  City records, two numbers. Colorado Springs was refused as a city for
  exactly this shape of contradiction at John Venezia Community Park, and
  the rule that decided Saint Paul and Lincoln - the record that states a
  number publishes - cannot choose between two numbers. The run asserts all
  three statements, so the day the City agrees with itself the build fails
  and the venue is re-read rather than quietly kept out.

  ============================================================
  THE HYBRID COURTS ARE AN AGGREGATE, NOT VENUES
  ============================================================

  "In addition, there are 10 hybrid tennis and pickleball courts located at
  the following parks: Heritage, Knollcrest, Los Olivos, Portola Springs, San
  Carlo, Turtle Rock, and University." The regulations page says nine, across
  six parks without Portola Springs. Either way it is a city-wide total with
  no per-park figure, which is Fort
  Collins's failure mode. None of the four parks that appear ONLY in that
  sentence publishes, and the hybrid courts at Heritage are not added to its
  four dedicated ones.

  ============================================================
  WHAT IS NOT CLAIMED
  ============================================================

  indoor/outdoor   The City never uses either word about these courts. A
                   park amenity list beside soccer fields and barbecues
                   leaves little doubt, but the breakdowns stay null,
                   following Mesa, Kirkland and Cape Coral.

  fee_type         Irvine prices its reservable courts and says the rest are
                   first come, first served. It never writes "free", so no
                   venue here qualifies for the /free/ page. The reservation
                   price is published as pricing_notes at the two venues the
                   City names.

  surface          Not stated anywhere.

  postal code      Portola Springs: the City prints 92620, the Census address
                   file returns 92618. The Census value publishes (the
                   Chaparral Park rule from Mesa) and both sides are
                   asserted so the note cannot outlive its truth.
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

const CITY = 'City of Irvine Community Services'
const PAGE = 'https://cityofirvine.gov/racket-sports/pickleball'
const REGS = 'https://cityofirvine.gov/racket-sports/court-regulations-and-map'
const PARK_BASE = 'https://cityofirvine.gov/parks-facilities'
const CENSUS_URL = 'https://geocoding.geo.census.gov/geocoder/geographies'

const HOURS = '6 a.m.-10 p.m., Daily'
const FIRST_COME = 'Open courts are on a first-come, first-serve basis'
const TIME_LIMITS = 'Pickleball and Badminton Time Limits (includes warm up time): Individual and Singles (30 minutes) Doubles (60 minutes)'
const RESERVATIONS = 'Pickleball court reservations are now available at Portola Springs Community Park (Courts #5 and #6) and Mike Ward Community Park (Courts #3 and #4)'
const RATES = 'Resident Rate: $17/hr Non-Resident Rate: $19/hr'
const HYBRID = '10 hybrid tennis and pickleball courts located at the following parks'

const VENUES = [
  {
    slug: 'mike-ward-community-park', importedSlug: null, name: 'Mike Ward Community Park',
    page: 'mike-ward-community-park',
    courts: 8,
    spec: 'eight lit pickleball courts located at Mike Ward Community Park',
    parkQuote: '8 Lighted Pickleball Courts',
    address: '20 Lake Road', postcodeLine: '20 Lake Road Irvine, CA 92604', cityZip: '92604',
    restroomQuote: '3 Restrooms',
    reservable: 'Courts #3 and #4',
    availability:
      'Eight lit pickleball courts, the largest set in Irvine, in a 22-acre community park that also carries two lighted basketball courts, three lighted racquetball courts and a sand volleyball court. The City states the count twice - "eight lit pickleball courts located at Mike Ward Community Park" on its pickleball page and "8 Lighted Pickleball Courts" in the park\'s own amenity list - and the hours once: 6 a.m. to 10 p.m., daily. Six of the eight are first come, first served under the City\'s court regulations, with doubles limited to 60 minutes and singles to 30 when others are waiting. Courts #3 and #4 can be reserved online at $17 an hour for residents and $19 for non-residents, in one- or two-hour blocks between 7 a.m. and noon and 4 and 10 p.m.; when nobody has booked them, the City says they are open for drop-in play until a reservation holder arrives.',
  },
  {
    slug: 'portola-springs', importedSlug: 'portola-springs', name: 'Portola Springs Community Park',
    page: 'portola-springs-community-park',
    courts: 6,
    spec: 'six lit pickleball courts located at Portola Springs Community Park',
    parkQuote: '6 Lighted Pickleball Courts',
    address: '900 Tomato Springs', postcodeLine: '900 Tomato Springs Irvine, CA 92620', cityZip: '92620',
    restroomQuote: '2 Restrooms',
    reservable: 'Courts #5 and #6',
    availability:
      'Six lit pickleball courts beside three lighted tennis courts, two lighted softball fields and two lighted soccer fields, on a 32-acre park in the north-east of the city. The City states the count on its pickleball page - "six lit pickleball courts located at Portola Springs Community Park" - and again in the park\'s amenity list as "6 Lighted Pickleball Courts". Hours are 6 a.m. to 10 p.m., daily. Courts #5 and #6 are the reservable pair here, at $17 an hour for residents and $19 for non-residents; the other four are first come, first served with a 60-minute doubles limit when others are waiting. This is also the home venue of the City\'s Irvine Team Pickleball league, which the pickleball page lists at this address.',
  },
  {
    slug: 'heritage-community-park', importedSlug: 'heritage-community-park', name: 'Heritage Community Park',
    page: 'heritage-community-park',
    courts: 4,
    spec: 'four lit pickleball courts located at Heritage Park',
    parkQuote: '4 Lighted Pickleball Courts',
    address: '14301 Yale Ave.', postcodeLine: '14301 Yale Ave. Irvine, CA 92604', cityZip: '92604',
    restroomQuote: '4 Restrooms',
    reservable: null,
    availability:
      'Four lit pickleball courts in the largest park of the three, 36.5 acres with twelve lighted tennis courts, three lighted soccer fields, three lighted basketball courts, a lake and a community centre. The City writes "four lit pickleball courts located at Heritage Park" on its pickleball page and "4 Lighted Pickleball Courts" in the park\'s own amenity list. Heritage is also one of the six parks the City names for its hybrid tennis-and-pickleball courts, and those are NOT counted here: the City gives only a city-wide total for them, ten on one page and nine on another, and never a per-park figure. The four dedicated courts are first come, first served, 6 a.m. to 10 p.m. daily, with a 60-minute doubles limit when others are waiting. None of Heritage\'s courts is reservable; the City\'s online booking covers only Mike Ward and Portola Springs.',
  },
]

const EXCLUDED = [
  {
    name: 'Los Olivos Community Park', page: 'los-olivos-community-park',
    spec: 'two lit pickleball courts located at Los Olivos Community Park',
    parkQuote: '3 Lighted Pickleball Courts',
    regsQuote: 'two lit pickleball courts at Los Olivos Community Park',
    address: '101 Alfonso',
    reasons: [
      'The City disagrees with itself about the count. Its pickleball page says "two lit pickleball courts located at Los Olivos Community Park", its court regulations page says "two lit pickleball courts at Los Olivos Community Park", and the park\'s own amenity list says "3 Lighted Pickleball Courts". Three City records, two numbers.',
      'The rule that decided Saint Paul and Lincoln - the record that states a number publishes - cannot choose between two numbers, and Colorado Springs was refused as a city for a contradiction of exactly this shape. The address resolves and the courts are lit; the venue fails on the one fact a court page cannot do without.',
    ],
  },
]

/* Parks named only in the city-wide hybrid-court sentence. Not venues. */
const HYBRID_ONLY = ['Knollcrest', 'San Carlo', 'Turtle Rock', 'University']

/* ---------------------------------------------------------------- */

const snapshotPath = name => `data/sources/irvine/${name}.html`

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
for (const [page, needle, what] of [
  ['court-regulations-and-map', FIRST_COME, 'first-come rule'],
  ['court-regulations-and-map', TIME_LIMITS, 'time limits'],
  ['pickleball', RESERVATIONS, 'reservable courts'],
  ['pickleball', RATES, 'reservation rates'],
  ['pickleball', HYBRID, 'hybrid-court aggregate'],
  ['court-regulations-and-map', 'nine hybrid tennis and pickleball courts', 'the other hybrid-court aggregate'],
]) {
  must(page, 'Irvine', needle, what)
}

const counties = JSON.parse(
  readFileSync(join(REPO_ROOT, 'data/sources/irvine-county-census.json'), 'utf8'))

/* ---------------------------------------------------------------- */
/* THE REFUSALS, ASSERTED RATHER THAN REMEMBERED.                    */

for (const e of EXCLUDED) {
  must('pickleball', e.name, e.spec, 'count on the pickleball page')
  must('court-regulations-and-map', e.name, e.regsQuote, 'count on the regulations page')
  must(e.page, e.name, e.parkQuote, 'count in the park\'s amenity list')
  must(e.page, e.name, e.address, 'address on the park page')
}

for (const name of HYBRID_ONLY) {
  must('pickleball', name, name, 'name in the hybrid-court sentence')
}

const identityRegistry = loadIdentity(REPO_ROOT)
const allRows = loadRows().map(r => mapRow(r).venue)
const bySlug = new Map(
  allRows.filter(v => v.city === 'Irvine' && String(v.state).toUpperCase() === 'CA')
    .map(v => [v.slug, v]))

const overlay = {}
const changes = []

for (const p of VENUES) {
  must('pickleball', p.slug, p.spec, 'court count on the pickleball page')
  must(p.page, p.slug, p.parkQuote, 'court count in the park\'s amenity list')
  must(p.page, p.slug, p.postcodeLine, 'address on the park page')
  must(p.page, p.slug, HOURS, 'hours on the park page')
  must(p.page, p.slug, p.restroomQuote, 'restrooms in the park\'s amenity list')

  const geo = counties[p.slug === 'portola-springs' ? 'portola-springs-community-park' : p.slug]
  if (!geo?.matched) throw new Error(`${p.slug}: no address resolver matched its address`)
  if (!geo.place_matches_city) {
    throw new Error(`${p.slug}: the resolver places this at "${geo.place}", not Irvine.`)
  }

  /*
    Portola Springs: the City prints one postcode and the Census returns
    another. Both sides are asserted. If either changes, the note on the
    venue page is stale and the build says so.
  */
  if (p.slug === 'portola-springs') {
    if (geo.postal_code === p.cityZip) {
      throw new Error('Portola Springs: the Census now agrees with the City\'s postcode. Remove the disagreement note.')
    }
  } else if (geo.postal_code !== p.cityZip) {
    throw new Error(`${p.slug}: the resolver's postcode ${geo.postal_code} differs from the City's ${p.cityZip}.`)
  }

  const doc = new SourceDocument({
    url: PAGE, retrieved_at: RETRIEVED_AT, tier: 1, publisher: CITY, format: 'html',
  })
  const docRegs = new SourceDocument({
    url: REGS, retrieved_at: RETRIEVED_AT, tier: 1, publisher: CITY, format: 'html',
  })
  const docPark = new SourceDocument({
    url: `${PARK_BASE}/${p.page}`, retrieved_at: RETRIEVED_AT, tier: 1, publisher: CITY, format: 'html',
  })
  const docCensus = new SourceDocument({
    url: CENSUS_URL, retrieved_at: RETRIEVED_AT, tier: 1, publisher: 'US Census Bureau', format: 'json',
  })

  const shell = {
    slug: p.slug, name: null, city: 'Irvine', state: 'CA', county: null,
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
      evidence: `Named "${p.name}" on the park's own page. The City's pickleball page ${p.slug === 'heritage-community-park' ? 'shortens it to "Heritage Park"' : 'uses the same name'}.`,
    }),
    doc.fact('total_courts', p.courts, {
      evidence: `Stated twice by the City: "${p.spec}" on its pickleball page, and "${p.parkQuote}" in the park's own amenity list.` +
        (p.slug === 'heritage-community-park'
          ? ' The hybrid tennis-and-pickleball courts the City also places at Heritage are not added: it publishes only a city-wide total for those, never a per-park figure.'
          : ''),
    }),
    docPark.fact('street_address', p.address, {
      evidence: `"${p.postcodeLine}" is the address under "Location" on the park's own page.`,
    }),
    docPark.fact('venue_type', 'public_park', {evidence: `Published by the ${CITY} among its parks and facilities.`}),
    doc.fact('light', true, {
      evidence: `The City's own words, twice: "${p.spec}" and "${p.parkQuote}".`,
    }),
    docPark.fact('hours_of_operation', '6 a.m. to 10 p.m., daily', {
      evidence: `"Hours: ${HOURS}" on the park's own page.`,
    }),
    docPark.fact('restroom', true, {
      evidence: `"${p.restroomQuote}" in the park's amenity list.`,
    }),
    docRegs.fact('play_format', 'open_play', {
      evidence: `The City's court regulations: "${FIRST_COME}. Please use the waiting board where available." Time limits when others are waiting: doubles 60 minutes, singles 30.`,
    }),
    doc.fact('court_availability', p.availability, {
      evidence: `From the City's pickleball page ("${p.spec}"), the park's own page ("${p.parkQuote}", "Hours: ${HOURS}") and the court regulations ("${FIRST_COME}").`,
    }),
    docCensus.fact('county', geo.county, {
      evidence: `${geo.county} County, CA${geo.county_fips ? ` (FIPS ${geo.state_fips}${geo.county_fips})` : ''}. ${geo.basis} The resolver also places it in the incorporated place "${geo.place}", which is what allows it to be published under Irvine.`,
    }),
    docCensus.fact('postal_code', geo.postal_code, {
      evidence: p.slug === 'portola-springs'
        ? `${geo.basis} The City's own park page prints ${p.cityZip}; the Census address file returns ${geo.postal_code} for the same street address. The Census value publishes, as at Mesa's Chaparral Park, and the disagreement is stated on the venue page.`
        : geo.basis,
    }),
  ]

  if (p.reservable) {
    facts.push(doc.fact('pricing_notes',
      `${p.reservable} can be reserved online: resident rate $17/hr, non-resident rate $19/hr, in one- or two-hour blocks, 7 a.m. to noon and 4 to 10 p.m. The other courts are first come, first served and the City states no price for them.`, {
        evidence: `"${RESERVATIONS}." "${RATES}". "Reservations can be made in one or two hour increments, with individuals allowed to have one reservation per day." "Courts can be reserved Monday through Sunday, between the hours of 7 a.m. to noon, and 4 to 10 p.m."`,
      }))
  }

  const res = applyFacts(venue, facts)

  overlay[p.slug] = {
    minted: !imported,
    identity: {
      name: p.name, city: 'Irvine', state: 'CA',
      county: geo.county, postal_code: geo.postal_code ?? null,
      latitude: geo.lat ?? null, longitude: geo.lon ?? null,
      imported_slug: p.importedSlug ?? null,
      canonical_slug: identityRegistry.renames[p.importedSlug]?.canonical ?? p.slug,
    },
    match: {
      source_page: PAGE, quote: p.spec,
      basis: imported
        ? `Matched to the imported ${p.importedSlug} row in Irvine, CA, at the same street address, and published under that slug.`
        : 'No imported row for this park. Minted here from the City\'s own pages, which state the count and the address.',
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

for (const [slug, entry] of Object.entries(overlay)) {
  const {total_courts: t, indoor_courts: i, outdoor_courts: o} = entry.patch
  if (i != null && o != null && t !== i + o) {
    throw new Error(`Rule 13: ${slug} does not sum.`)
  }
}

const METHOD_NOTE =
  'Irvine states its pickleball count twice for every venue - in a sentence on the City\'s pickleball page and again in each park\'s own amenity list, where the address and the hours also sit - and the three venues where the two records agree publish here: Mike Ward Community Park (8), Portola Springs Community Park (6) and Heritage Community Park (4), every court lit in the City\'s own word and every park open 6 a.m. to 10 p.m. daily. Los Olivos Community Park is refused because the City disagrees with itself: two courts on the pickleball page and the regulations page, "3 Lighted Pickleball Courts" on the park\'s page, and the rule that the record stating a number publishes cannot choose between two numbers. The City\'s "10 hybrid tennis and pickleball courts" across seven parks on one page and nine across six on another is a city-wide aggregate with no per-park figure and adds nothing to any venue. Irvine also publishes how a court is shared - first come, first served, doubles limited to 60 minutes when others are waiting - and prices its two reservable courts at each of its two largest venues at $17 an hour for residents and $19 for non-residents. It never writes "free", so no venue here reaches the /free/ page. The City prints 92620 for Portola Springs and the Census returns 92618; the Census value publishes and both sides are asserted.'

mkdirSync(join(REPO_ROOT, 'data/verified'), {recursive: true})
writeFileSync(join(REPO_ROOT, 'data/verified/irvine-ca.json'), JSON.stringify({
  city: 'Irvine', state: 'CA', retrieved_at: RETRIEVED_AT,
  method_note: METHOD_NOTE,
  sources: [
    {url: PAGE, publisher: CITY, tier: 1, format: 'html', snapshot: snapshotPath('pickleball')},
    {url: REGS, publisher: CITY, tier: 1, format: 'html', snapshot: snapshotPath('court-regulations-and-map')},
    ...VENUES.map(p => ({
      url: `${PARK_BASE}/${p.page}`, publisher: CITY, tier: 1, format: 'html', snapshot: snapshotPath(p.page),
    })),
    ...EXCLUDED.map(e => ({
      url: `${PARK_BASE}/${e.page}`, publisher: CITY, tier: 1, format: 'html', snapshot: snapshotPath(e.page),
    })),
    {url: CENSUS_URL, publisher: 'US Census Bureau', tier: 1, format: 'json', snapshot: 'data/sources/irvine-county-census.json'},
  ].map((s, i) => ({id: `S${i + 1}`, ...s})),
  totals: {
    venues: VENUES.length, courts: totalCourts,
    outdoor: null, indoor: null,
    lit_courts: totalCourts, dedicated_courts: totalCourts,
    free_venues: 0,
  },
  excluded: EXCLUDED.map(e => ({name: e.name, why: e.reasons})),
  venues: overlay,
}, null, 2) + '\n')

const changed = changes.filter(r =>
  r.old_value !== null && r.old_value !== undefined && String(r.old_value) !== String(r.new_value))

writeFileSync(join(REPO_ROOT, 'reports', 'irvine-conflicts.md'), [
  '# Irvine verification - two City records per venue, and one venue where they disagree', '',
  `Run ${RETRIEVED_AT}. ${VENUES.length} venues published, ${totalCourts} courts. ${EXCLUDED.length} venue refused.`, '',
  'Irvine is the first city in California on this site and the first in Orange County. Every published',
  'count is stated twice by the City - once on its pickleball page, once in the park\'s own amenity list.', '',
  '| venue | courts | lit | pickleball page | park page | address |',
  '| --- | ---: | --- | --- | --- | --- |',
  ...VENUES.map(p => `| \`${p.slug}\` | ${p.courts} | yes | "${p.spec}" | "${p.parkQuote}" | ${p.address} |`),
  '',
  '## Refused', '',
  ...EXCLUDED.flatMap(e => [
    `**${e.name}** - "${e.spec}" / "${e.parkQuote}" - ${e.address}`, '',
    ...e.reasons.map((r, i) => `${i + 1}. ${r}`), '']),
  '## The hybrid courts are an aggregate', '',
  'The City\'s pickleball page: "In addition, there are 10 hybrid tennis and pickleball courts located at the',
  'following parks: Heritage, Knollcrest, Los Olivos, Portola Springs, San Carlo, Turtle Rock, and University."',
  'The regulations page says nine, and lists six parks. A city-wide total across several parks is not a venue count, so Knollcrest, San Carlo, Turtle',
  'Rock and University are not venues here and Heritage\'s four dedicated courts are published without them.',
  '',
  '## What Irvine does not say', '',
  '- **indoor or outdoor**, about any court. The breakdowns stay null.',
  '- **free.** The City prices its reservable courts and calls the rest first come, first served. It never',
  '  writes the word, so `fee_type` stays null and no Irvine venue is on the /free/ page.',
  '- **surface.**',
  '',
  '## A postcode the City and the Census disagree on', '',
  'Portola Springs Community Park: the City prints "Irvine, CA 92620"; the Census address file returns 92618',
  'for 900 Tomato Springs. The Census value publishes, as at Mesa\'s Chaparral Park, and the run asserts both.',
  '',
  changed.length ? '## Values a source changed' : '_No imported row was overwritten._',
  ...(changed.length ? [
    '', '| venue | field | was | now | outcome |', '| --- | --- | --- | --- | --- |',
    ...changed.map(r => `| \`${r.venue_slug}\` | ${r.field} | ${JSON.stringify(r.old_value)} | ${JSON.stringify(r.new_value)} | ${r.outcome} |`),
  ] : []),
  '',
].join('\n'))

console.log(`\nIrvine, CA - ${VENUES.length} venues, ${totalCourts} courts, retrieved ${RETRIEVED_AT}`)
for (const p of VENUES) {
  const o = overlay[p.slug]
  const geo = counties[p.slug === 'portola-springs' ? 'portola-springs-community-park' : p.slug]
  console.log(
    `  ${o.patch.name.padEnd(32)} ${String(o.patch.total_courts).padStart(2)} | lit | ${o.patch.county} County | ${geo.postal_code} | via ${geo.resolver}`)
}
console.log(`\n  refused: ${EXCLUDED.map(e => e.name).join(', ')}`)
console.log('\nWrote data/verified/irvine-ca.json and reports/irvine-conflicts.md\n')
