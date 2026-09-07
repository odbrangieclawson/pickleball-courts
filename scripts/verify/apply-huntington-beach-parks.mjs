#!/usr/bin/env node
/*
  Huntington Beach, CA verification run - city #18, California's second
  city and the second in Orange County after Irvine.

  ============================================================
  ONE HEADING, FOUR LINES, AND A STATED NEGATIVE ON ALL OF THEM
  ============================================================

  The City's Park Amenities page is a list of headings, each followed by the
  parks that carry the amenity. The pickleball heading reads:

      CITY PARKS WITH A PICKLEBALL COURT (NO LIGHTING):
      Boardwalk Park - 7441 Edinger Ave. - 1 Court
      Edison Park - 21377 Magnolia St. - 4 Courts
      Marina Park - 5562 Cross Dr. - 4 Courts
      Worthy Park - 1831 17th St. - 4 Courts

  Name, address and count on one line each, and the heading answers the
  lighting question for all four at once - in the negative. Before this run
  the directory held two stated lighting negatives in prose (Vancouver's
  Oakbrook, Cape Coral's Giuffrida) and one GIS column (Seattle). Huntington
  Beach adds four in one heading, and every venue here publishes `light` as
  No rather than as unknown, because the City wrote it down.

  ============================================================
  TWO CITY ADDRESSES FOR WORTHY PARK
  ============================================================

  The City's Tennis & Pickleball Information page lists "Worthy Park / 1801
  Main Street" among the community centres where a player registers, and
  "Marina Park / 15871 Graham Street" the same way. For Marina Park the same
  page then gives "5562 Cross Drive" for the lighted tennis courts, agreeing
  with the amenities page. For Worthy Park it does not repeat the address.

  The amenities page is the record that pairs the count with an address, and
  1831 17th St. resolves at house-number level inside the City, so that is
  what publishes. 1801 Main Street is recorded on the venue page as the
  City's other address for the park, and the run asserts both so the note
  cannot outlive either.

  ============================================================
  WHAT IS NOT CLAIMED
  ============================================================

  indoor/outdoor   Never stated. Null, following Mesa, Kirkland, Cape Coral
                   and Irvine.

  fee_type         The tennis page prices reserved TENNIS courts at $9 per
                   hour through the Murdy Community Center. Nothing on
                   either page prices a pickleball court or calls one free.
                   Null.

  hours            Not stated for the pickleball courts. The "Dusk to 10
                   p.m. nightly" lines on the tennis page belong to the
                   lighted tennis courts, and these pickleball courts have
                   no lighting.

  surface          Not stated.

  dedicated        The heading says "a pickleball court", not a tennis court
                   with lines; but the City never uses the word dedicated,
                   so the venue pages describe the courts as the City does
                   and no more.
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

const CITY = 'City of Huntington Beach Community & Library Services'
const PAGE = 'https://www.huntingtonbeachca.gov/departments/parks___recreation/parks___facilities/park_amenities.php'
const TENNIS = 'https://www.huntingtonbeachca.gov/departments/parks___recreation/tennis_information.php'
const CENSUS_URL = 'https://geocoding.geo.census.gov/geocoder/geographies'

const HEADING = 'CITY PARKS WITH A PICKLEBALL COURT (NO LIGHTING):'

const VENUES = [
  {
    slug: 'boardwalk-park', importedSlug: null, name: 'Boardwalk Park',
    courts: 1, address: '7441 Edinger Ave.', line: 'Boardwalk Park - 7441 Edinger Ave. - 1 Court',
    availability:
      'One pickleball court, unlit, in a small park on Edinger Avenue that the City also lists for its exercise course and fitness station. The count and the address come from a single line on the City\'s Park Amenities page - "Boardwalk Park - 7441 Edinger Ave. - 1 Court" - under a heading that settles the lighting for every pickleball court in the city: "CITY PARKS WITH A PICKLEBALL COURT (NO LIGHTING)". One court means one game at a time, no rotation, and daylight only. The City states no hours, no price and nothing about the surface, and this page records those as unknown rather than guessing.',
  },
  {
    slug: 'edison-park', importedSlug: 'edison-park', name: 'Edison Park',
    courts: 4, address: '21377 Magnolia St.', line: 'Edison Park - 21377 Magnolia St. - 4 Courts',
    availability:
      'Four pickleball courts, unlit, at the park that shares its address with the Edison Community Center on Magnolia Street. The City\'s Park Amenities page gives the count and the address in one line - "Edison Park - 21377 Magnolia St. - 4 Courts" - under the heading "CITY PARKS WITH A PICKLEBALL COURT (NO LIGHTING)". The same address appears on the City\'s Tennis & Pickleball Information page for Edison Community Park\'s lighted TENNIS courts, which run "Dusk to 10 p.m. nightly"; the pickleball courts are explicitly not lit, so that evening window does not apply to them. Edison Park is also listed by the City for its handball court. No hours, price or surface are stated for the pickleball courts.',
  },
  {
    slug: 'marina-park', importedSlug: null, name: 'Marina Park',
    courts: 4, address: '5562 Cross Dr.', line: 'Marina Park - 5562 Cross Dr. - 4 Courts',
    availability:
      'Four pickleball courts, unlit, in a park in the Huntington Harbour area that the City also lists for a handball court and a horseshoe pit. The count and the address are one line on the City\'s Park Amenities page - "Marina Park - 5562 Cross Dr. - 4 Courts" - under the "NO LIGHTING" heading that covers all four of the city\'s pickleball parks. The City\'s tennis page gives the same address for Marina Park\'s lighted tennis courts and a second address, 15871 Graham Street, for the Marina Park community centre where a player registers; the courts are at Cross Drive. The tennis lights run to 10 p.m.; the pickleball courts, by the City\'s own statement, have none. No hours, price or surface are stated.',
  },
  {
    slug: 'worthy-park', importedSlug: 'worthy-park', name: 'Worthy Park',
    courts: 4, address: '1831 17th St.', line: 'Worthy Park - 1831 17th St. - 4 Courts',
    otherAddress: '1801 Main Street',
    availability:
      'Four pickleball courts, unlit, in a park near downtown Huntington Beach. The City\'s Park Amenities page gives the count and the address in one line - "Worthy Park - 1831 17th St. - 4 Courts" - under the heading "CITY PARKS WITH A PICKLEBALL COURT (NO LIGHTING)". The City publishes a second address for the park, 1801 Main Street, on its Tennis & Pickleball Information page, where Worthy Park appears among the community centres that take registrations; the park fronts both streets, and the 17th Street address is the one the City pairs with the court count, so it is the one published here. No hours, price or surface are stated for the pickleball courts.',
  },
]

/* ---------------------------------------------------------------- */

const snapshotPath = name => `data/sources/huntington-beach/${name}.html`

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

/*
  The heading, and the fact that the four lines sit directly under it. The
  block is cut at the heading and at the next heading so a line cannot drift
  under a different amenity and still pass.
*/
const amenities = linesOf(snapshotPath('park-amenities'))
const start = amenities.findIndex(l => squeeze(l) === squeeze(HEADING))
if (start < 0) throw new Error(`The Park Amenities page no longer carries the heading "${HEADING}".`)
const end = amenities.findIndex((l, i) => i > start && /^CITY PARKS? WITH/i.test(l))
const block = squeeze(amenities.slice(start + 1, end < 0 ? undefined : end).join(' '))
const expected = squeeze(VENUES.map(p => p.line).join(' '))
if (block !== expected) {
  throw new Error(
    'The pickleball block on the Park Amenities page has changed. Expected exactly the four lines this run ' +
    `publishes; the page now reads: "${amenities.slice(start + 1, end < 0 ? undefined : end).join(' | ')}". Re-read the city.`)
}

/* The tennis page's addresses, both agreeing and disagreeing. */
must('tennis-information', 'Marina Park', 'Marina Park (MCP)* 5562 Cross Drive', 'tennis-court address for Marina Park')
must('tennis-information', 'Marina Park', 'Marina Park 15871 Graham Street', 'community-centre address for Marina Park')
must('tennis-information', 'Worthy Park', 'Worthy Park 1801 Main Street', 'community-centre address for Worthy Park')
must('tennis-information', 'Huntington Beach', 'Courts may be reserved at the Murdy Community Center, (714) 960-8895, for $9 per hour.', 'tennis reservation price')

const counties = JSON.parse(
  readFileSync(join(REPO_ROOT, 'data/sources/huntington-beach-county-census.json'), 'utf8'))

const identityRegistry = loadIdentity(REPO_ROOT)
const allRows = loadRows().map(r => mapRow(r).venue)
const bySlug = new Map(
  allRows.filter(v => v.city === 'Huntington Beach' && String(v.state).toUpperCase() === 'CA')
    .map(v => [v.slug, v]))

const overlay = {}
const changes = []

for (const p of VENUES) {
  must('park-amenities', p.slug, p.line, 'name, address and count line')

  const geo = counties[p.slug]
  if (!geo?.matched) throw new Error(`${p.slug}: no address resolver matched its address`)
  if (!geo.place_matches_city) {
    throw new Error(`${p.slug}: the resolver places this at "${geo.place}", not Huntington Beach.`)
  }

  const doc = new SourceDocument({
    url: PAGE, retrieved_at: RETRIEVED_AT, tier: 1, publisher: CITY, format: 'html',
  })
  const docTennis = new SourceDocument({
    url: TENNIS, retrieved_at: RETRIEVED_AT, tier: 1, publisher: CITY, format: 'html',
  })
  const docCensus = new SourceDocument({
    url: CENSUS_URL, retrieved_at: RETRIEVED_AT, tier: 1, publisher: 'US Census Bureau', format: 'json',
  })

  const shell = {
    slug: p.slug, name: null, city: 'Huntington Beach', state: 'CA', county: null,
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
      evidence: `Named "${p.name}" on the City's Park Amenities page: "${p.line}".`,
    }),
    doc.fact('total_courts', p.courts, {
      evidence: `Quoted from the City's Park Amenities page, under the heading "${HEADING}": "${p.line}".`,
    }),
    doc.fact('street_address', p.address, {
      evidence: `"${p.line}" on the City's Park Amenities page.` +
        (p.otherAddress
          ? ` The City's Tennis & Pickleball Information page gives "${p.otherAddress}" for the same park, among the community centres that take registrations; the amenities page is the record that pairs the count with an address, and that is the one published.`
          : ''),
    }),
    doc.fact('venue_type', 'public_park', {evidence: `Published by the ${CITY} among its city parks.`}),
    doc.fact('light', false, {
      evidence: `A stated negative in the City's own heading: "${HEADING}". The heading covers all four parks listed beneath it, and this is one of them.`,
    }),
    (p.slug === 'edison-park' || p.slug === 'marina-park' ? docTennis : doc).fact('court_availability', p.availability, {
      evidence: `From the City's Park Amenities page: "${p.line}" under "${HEADING}".` +
        (p.slug === 'edison-park' ? ' The tennis page: "Edison Community Park (ECC)* 21377 Magnolia Street Dusk to 10 p.m. nightly" under "Lighted Tennis Courts & Handball/Racquetball Courts".' : '') +
        (p.slug === 'marina-park' ? ' The tennis page: "Marina Park (MCP)* 5562 Cross Drive Dusk to 10 p.m. nightly" and "Marina Park 15871 Graham Street".' : '') +
        (p.slug === 'worthy-park' ? ' The tennis page: "Worthy Park 1801 Main Street".' : ''),
    }),
    docCensus.fact('county', geo.county, {
      evidence: `${geo.county} County, CA${geo.county_fips ? ` (FIPS ${geo.state_fips}${geo.county_fips})` : ''}. ${geo.basis} The resolver also places it in the incorporated place "${geo.place}", which is what allows it to be published under Huntington Beach.`,
    }),
    docCensus.fact('postal_code', geo.postal_code, {evidence: geo.basis}),
  ]

  const res = applyFacts(venue, facts)

  overlay[p.slug] = {
    minted: !imported,
    identity: {
      name: p.name, city: 'Huntington Beach', state: 'CA',
      county: geo.county, postal_code: geo.postal_code ?? null,
      latitude: geo.lat ?? null, longitude: geo.lon ?? null,
      imported_slug: p.importedSlug ?? null,
      canonical_slug: identityRegistry.renames[p.importedSlug]?.canonical ?? p.slug,
    },
    match: {
      source_page: PAGE, quote: p.line,
      basis: imported
        ? p.slug === 'worthy-park'
          ? 'Matched to the imported worthy-park row in Huntington Beach, CA, which carried the City\'s other address for the park (1801 Main St); the City\'s count-bearing address replaces it. A second imported row, worthy-community-park, describes the same courts at 1831 17th Street and is left pending rather than published as a second venue.'
          : `Matched to the imported ${p.importedSlug} row in Huntington Beach, CA, at the same street address.`
        : 'No imported row for this park. Minted here from the City\'s Park Amenities page, which states the count and the address.',
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
  'Huntington Beach states a name, a street address and a court count on one line per venue, under a heading that answers the lighting question for all of them at once: "CITY PARKS WITH A PICKLEBALL COURT (NO LIGHTING)". Four parks, thirteen courts, and four stated lighting negatives - more than the whole directory held in prose before this run. The block under that heading is asserted as a whole, so a line moving under a different amenity, or a fifth park appearing, fails the build. Worthy Park carries two City addresses: 1831 17th St. on the amenities page, paired with the count, and 1801 Main Street on the Tennis & Pickleball Information page among the community centres; the count-bearing address publishes and both are asserted. The City prices reserved tennis courts at $9 an hour and never prices or frees a pickleball court, so fee_type stays null; it states no hours for these courts, and the "Dusk to 10 p.m." lines on the tennis page belong to lighted tennis courts that these are not.'

mkdirSync(join(REPO_ROOT, 'data/verified'), {recursive: true})
writeFileSync(join(REPO_ROOT, 'data/verified/huntington-beach-ca.json'), JSON.stringify({
  city: 'Huntington Beach', state: 'CA', retrieved_at: RETRIEVED_AT,
  method_note: METHOD_NOTE,
  sources: [
    {url: PAGE, publisher: CITY, tier: 1, format: 'html', snapshot: snapshotPath('park-amenities')},
    {url: TENNIS, publisher: CITY, tier: 1, format: 'html', snapshot: snapshotPath('tennis-information')},
    {url: CENSUS_URL, publisher: 'US Census Bureau', tier: 1, format: 'json', snapshot: 'data/sources/huntington-beach-county-census.json'},
  ].map((s, i) => ({id: `S${i + 1}`, ...s})),
  totals: {
    venues: VENUES.length, courts: totalCourts,
    outdoor: null, indoor: null,
    lit_courts: 0, unlit_courts_stated: totalCourts,
    free_venues: 0,
  },
  excluded: [],
  venues: overlay,
}, null, 2) + '\n')

const changed = changes.filter(r =>
  r.old_value !== null && r.old_value !== undefined && String(r.old_value) !== String(r.new_value))

writeFileSync(join(REPO_ROOT, 'reports', 'huntington-beach-conflicts.md'), [
  '# Huntington Beach verification - four venues under one heading, and the heading says "NO LIGHTING"', '',
  `Run ${RETRIEVED_AT}. ${VENUES.length} venues published, ${totalCourts} courts. No venue refused.`, '',
  'Huntington Beach is the second city in California on this site, after Irvine, and the second in Orange',
  'County. Every published fact comes from one line on the City\'s Park Amenities page.', '',
  '| venue | courts | lit | what the City writes |',
  '| --- | ---: | --- | --- |',
  ...VENUES.map(p => `| \`${p.slug}\` | ${p.courts} | **no (stated)** | "${p.line}" |`),
  '',
  '## Four stated lighting negatives in one heading', '',
  `"${HEADING}" sits above all four lines. An operator that writes the absence down is one whose`,
  'silences elsewhere can be trusted; here there are no silences on lighting at all.',
  '',
  '## Worthy Park has two City addresses', '',
  'The amenities page pairs the count with "1831 17th St."; the Tennis & Pickleball Information page lists',
  '"Worthy Park 1801 Main Street" among the community centres that take registrations. The count-bearing',
  'address publishes and the other is stated on the venue page. Both are asserted by this run.',
  '',
  '## What Huntington Beach does not say', '',
  '- **indoor or outdoor.** Never stated; the breakdowns stay null.',
  '- **fee.** The tennis page prices reserved tennis courts at $9 an hour and says nothing about pickleball.',
  '- **hours.** "Dusk to 10 p.m. nightly" on the tennis page belongs to lighted tennis courts.',
  '- **surface.**',
  '',
  changed.length ? '## Values a source changed' : '_No imported row was overwritten._',
  ...(changed.length ? [
    '', '| venue | field | was | now | outcome |', '| --- | --- | --- | --- | --- |',
    ...changed.map(r => `| \`${r.venue_slug}\` | ${r.field} | ${JSON.stringify(r.old_value)} | ${JSON.stringify(r.new_value)} | ${r.outcome} |`),
  ] : []),
  '',
].join('\n'))

console.log(`\nHuntington Beach, CA - ${VENUES.length} venues, ${totalCourts} courts, retrieved ${RETRIEVED_AT}`)
for (const p of VENUES) {
  const o = overlay[p.slug]
  console.log(
    `  ${o.patch.name.padEnd(16)} ${String(o.patch.total_courts).padStart(2)} | NO lights (stated) | ${o.patch.county} County | ${counties[p.slug].postal_code} | via ${counties[p.slug].resolver}`)
}
console.log('\nWrote data/verified/huntington-beach-ca.json and reports/huntington-beach-conflicts.md\n')
