#!/usr/bin/env node
/*
  Las Vegas, NV verification run - city #23, the first in Nevada and the
  first in Clark County.

  ============================================================
  TWO CITY RECORDS, AND WHICH ONE PUBLISHES
  ============================================================

  The City of Las Vegas keeps two records of its pickleball courts.

  The park pages carry the count in the amenity list, in a parenthesis -
  "Pickleball courts (4)" - beneath a header that gives the street address,
  the postcode and the park hours, "7 a.m. - 11 p.m.". That is the shape
  Mesa's Reservable Spaces list took, and it publishes on the same ground:
  a number in a parenthesis is a number.

  The City's blog post of 11 March 2026, "Play Pickleball in Las Vegas",
  lists eight parks with a count each:

      Two at Centennial Hills Park
      Seven at Durango Hills Park
      Eight at Police Memorial Park
      Four at Bill Briare Park
      Four at Lorenzi Park
      Two at Patriot Park
      Four at Justice Myron Leavitt & Jaycee Community Park
      Four at Aloha Shores Park

  Where both records state a number they agree, and both are asserted:
  Aloha Shores (4), Centennial Hills (2), Durango Hills (7). Those three
  publish on the park page with the blog as corroboration.

  Lorenzi Park and Patriot Park are the other case. The blog states a
  count for each; their own park pages list tennis courts, basketball
  courts and a band shell and never mention pickleball at all. This is the
  shape Lincoln's Ballard and Densmore took - the City's pickleball page
  counted courts its park pages did not mention - and the rule set there
  decides it: the record that states a NUMBER publishes, the disagreement
  is written onto the venue page, and the run asserts the ABSENCE of
  pickleball on the park page so the caveat cannot outlive its truth. Both
  addresses resolve inside the City of Las Vegas, so both publish, and each
  says on its page that it rests on one City record.

  ============================================================
  WHAT IS REFUSED
  ============================================================

  Police Memorial Park   "Pickleball courts (8)" on its page and "Eight at
                         Police Memorial Park" on the blog - the largest
                         count in the city, twice stated - and neither
                         resolver finds "3250 Metro Academy Way". Import
                         Gate I1. The expensive refusal here.

  Bill Briare Family     "Pickleball Courts (4)" and "Four at Bill Briare
  Park                   Park". Neither resolver finds "650 N. Tenaya Way".

  Justice Myron Leavitt  "Four at Justice Myron Leavitt & Jaycee Community
  & Jaycee Community     Park" on the blog. The park's own page carries no
  Park                   street address a reader can find and no pickleball
                         count, so there is nothing to resolve and nothing
                         to corroborate. Refused on I1, with the blog line
                         asserted.

  ============================================================
  WHAT IS NOT CLAIMED
  ============================================================

  indoor/outdoor   Never stated. Null, following Mesa, Kirkland, Cape Coral
                   and Irvine. These are park amenity lists beside dog parks
                   and soccer fields, but the City does not write the word.
  lighting         Not stated anywhere. Null.
  fee_type         Not stated. The blog says "dropping in" and "Drop in for
                   a pop-up game", which is a play format, not a price.
                   Null.
  play_format      The blog's "dropping in" is city-wide programme prose,
                   not a statement about any venue's courts. Null.
  surface          Not stated.
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

const CITY = 'City of Las Vegas Parks & Recreation'
const BLOG = 'https://www.lasvegasnevada.gov/News/Blog/Detail/play-pickleball-in-las-vegas'
const PARK_BASE = 'https://www.lasvegasnevada.gov/Residents/Parks-Facilities'
const CENSUS_URL = 'https://geocoding.geo.census.gov/geocoder/geographies'

const BLOG_DATE = 'March 11, 2026'
const BLOG_LEAD = "The city's current pickleball court locations include:"
const HOURS = '7 a.m. - 11 p.m.'

const VENUES = [
  {
    slug: 'aloha-shores-park', importedSlug: 'aloha-shores-park', name: 'Aloha Shores Park',
    page: 'aloha-shores-park', urlName: 'Aloha-Shores-Park',
    courts: 4, parkQuote: 'Pickleball courts (4)', blogQuote: 'Four at Aloha Shores Park',
    address: '7550 Sauer St', headerLine: '7550 Sauer St, 89128', cityZip: '89128', hours: HOURS,
    availability: 'Four pickleball courts in a neighbourhood park in the north-west of the city, counted twice by the City: "Pickleball courts (4)" in the park page\'s amenity list and "Four at Aloha Shores Park" in its pickleball post of 11 March 2026. The park page describes the site as one that "features pickleball courts" and lists tennis, bocce, horseshoe and volleyball courts, a playground, a walk/jog track and a reservable picnic area beside them. Park hours are 7 a.m. to 11 p.m. The City states no lighting, no price and no surface, and never says indoor or outdoor; four courts is enough for two games at once.',
  },
  {
    slug: 'centennial-hills-park', importedSlug: 'centennial-hills-park', name: 'Centennial Hills Park',
    page: 'centennial-hills-park', urlName: 'Centennial-Hills-Park',
    courts: 2, parkQuote: 'Pickleball courts (2)', blogQuote: 'Two at Centennial Hills Park',
    address: '7101 N Buffalo Drive', headerLine: '7101 N. Buffalo Drive, 89131', cityZip: '89131', hours: HOURS,
    availability: 'Two pickleball courts in the City\'s 120-acre regional park in the far north-west, the smallest pickleball count in published Las Vegas on a site that is otherwise the largest. The park page reads "Pickleball courts (2)" in its amenity list and the City\'s pickleball post reads "Two at Centennial Hills Park". The page describes "a playground with ramps and features for all abilities", an amphitheatre with grass seating for more than 3,000, a dog park, sand volleyball, soccer fields and a jogging path with interpretive signs about the inverted riverbed the park is built around. Park hours are 7 a.m. to 11 p.m. Two courts is a game, not a rotation. Lighting, price, surface and indoor/outdoor are not stated.',
  },
  {
    slug: 'durango-hills-park', importedSlug: null, name: 'Durango Hills Park',
    page: 'durango-hills-park', urlName: 'Durango-Hills-Park',
    courts: 7, parkQuote: 'Pickleball courts (7)', blogQuote: 'Seven at Durango Hills Park',
    address: '3521 N Durango Dr', headerLine: '3521 N. Durango Dr, 89129', cityZip: '89129', hours: HOURS,
    availability: 'Seven pickleball courts, the largest published set in Las Vegas, at a park in the north-west built around the 18-hole executive Durango Hills Golf Club. The count is the City\'s twice over: "Pickleball courts (7)" on the park page and "Seven at Durango Hills Park" in its pickleball post. Seven is an odd number for a pickleball layout and the City does not explain it; this page prints the figure as stated rather than rounding it to a pairing. Basketball courts, a skate park, a walking track, a picnic area and a playground share the site. Park hours are 7 a.m. to 11 p.m. Lighting, price, surface and indoor/outdoor are not stated.',
  },
  {
    slug: 'lorenzi-park', importedSlug: null, name: 'Lorenzi Park',
    page: 'lorenzi-park', urlName: 'Lorenzi-Park',
    courts: 4, parkQuote: null, blogQuote: 'Four at Lorenzi Park',
    address: '3333 W Washington Ave', headerLine: '3333 W. Washington Ave., 89107', cityZip: '89107', hours: HOURS,
    availability: 'Four pickleball courts on the City\'s count - "Four at Lorenzi Park" in its pickleball post of 11 March 2026 - at the historic park two miles west of the original townsite, opened in 1926 as Lorenzi\'s Lake Park and now on the City\'s Historic Property Register. This venue rests on one City record and says so: the park\'s own page lists tennis courts "managed by No Quit Tennis Academy", basketball courts, a band shell, a spring-fed fishing pond and the Sammy Davis Jr. Festival Plaza, and never mentions pickleball. The City\'s two records of its own park disagree by omission, and the one that states a number publishes; if the park page ever gains a pickleball line, this run fails and the venue is re-read. Park hours are 7 a.m. to 11 p.m. Lighting, price, surface and indoor/outdoor are not stated.',
  },
  {
    slug: 'patriot-park', importedSlug: null, name: 'Patriot Community Park',
    page: 'patriot-park', urlName: 'Patriot-Park',
    courts: 2, parkQuote: null, blogQuote: 'Two at Patriot Park',
    address: '4050 Thom Blvd', headerLine: '4050 Thom Blvd., 89130', cityZip: '89130', hours: HOURS,
    availability: 'Two pickleball courts on the City\'s count - "Two at Patriot Park" in its pickleball post of 11 March 2026 - at a neighbourhood park in the north-west whose own page says only that it "features a basketball court, tennis courts, playground and picnic areas". The park page calls it Patriot Community Park and the blog calls it Patriot Park; the page\'s name is published. This venue rests on one City record: the park page never mentions pickleball, and the run asserts that absence so the caveat cannot outlive its truth. Two courts is a game rather than a rotation. Park hours are 7 a.m. to 11 p.m. Lighting, price, surface and indoor/outdoor are not stated.',
  },
]

const EXCLUDED = [
  {
    name: 'Police Memorial Park', page: 'police-memorial-park', urlName: 'Police-Memorial-Park', geoKey: 'police-memorial-park',
    parkQuote: 'Pickleball courts (8)', blogQuote: 'Eight at Police Memorial Park',
    address: '3250 Metro Academy Way', headerLine: '3250 Metro Academy Way, 89129',
    reasons: [
      'Neither address resolver finds "3250 Metro Academy Way": the US Census address file returns no match and OpenStreetMap returns nothing at house-number level. Import Gate I1 requires a street address that resolves.',
      'Eight courts, the largest count in the city, stated twice - "Pickleball courts (8)" on the park page and "Eight at Police Memorial Park" on the City\'s pickleball post - with hours, restrooms and two tennis courts beside them. The most expensive refusal in Las Vegas, and it fails on its address alone.',
    ],
  },
  {
    name: 'Bill Briare Family Park', page: 'bill-briare-park', urlName: 'Bill-Briare-Park', geoKey: 'bill-briare-family-park',
    parkQuote: 'Pickleball Courts (4)', blogQuote: 'Four at Bill Briare Park',
    address: '650 N Tenaya Way', headerLine: '650 N. Tenaya Way, 89128',
    reasons: [
      'Neither address resolver finds "650 N. Tenaya Way", the address the City prints in the park page header. Import Gate I1.',
      'Four courts stated twice, "Pickleball Courts (4)" and "Four at Bill Briare Park", on a ten-acre park the City names for a former mayor and where it runs the city\'s first National Fitness Campaign Fitness Court. It fails on its address alone.',
    ],
  },
  {
    name: 'Justice Myron Leavitt & Jaycee Community Park', page: null, urlName: 'Justice-Myron-E-Leavitt-and-Jaycee-Community-Park', geoKey: null,
    parkQuote: null, blogQuote: 'Four at Justice Myron Leavitt & Jaycee Community Park',
    address: null, headerLine: null,
    reasons: [
      'The City\'s pickleball post states "Four at Justice Myron Leavitt & Jaycee Community Park", and the park\'s own page carries no street address a reader can find and no pickleball count. With no address there is nothing for Import Gate I1 to resolve, and this project has never taken an address from outside the operator.',
      'The blog line is asserted, so if the City adds an address to the park page the run must be revisited rather than continuing to omit four courts.',
    ],
  },
]

/* ---------------------------------------------------------------- */

const snapshotPath = name => `data/sources/las-vegas/${name}.html`

const linesOf = rel => readFileSync(join(REPO_ROOT, rel), 'utf8')
  .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
  .replace(/<[^>]+>/g, '\n')
  .replace(/&nbsp;/g, ' ')
  .replace(/&shy;/g, '')
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

/* The blog post: its date and the sentence that introduces the list. */
must('play-pickleball-in-las-vegas', 'Las Vegas', BLOG_DATE, 'blog date')
must('play-pickleball-in-las-vegas', 'Las Vegas', BLOG_LEAD, 'lead-in to the court list')

const counties = JSON.parse(
  readFileSync(join(REPO_ROOT, 'data/sources/las-vegas-county-census.json'), 'utf8'))

/* ---------------------------------------------------------------- */
/* THE REFUSALS, ASSERTED RATHER THAN REMEMBERED.                    */

for (const e of EXCLUDED) {
  must('play-pickleball-in-las-vegas', e.name, e.blogQuote, 'count on the City\'s pickleball post')
  if (e.page) {
    must(e.page, e.name, e.parkQuote, 'count in the park\'s amenity list')
    must(e.page, e.name, e.headerLine, 'address in the park page header')
  }
  if (e.geoKey && counties[e.geoKey]?.matched) {
    throw new Error(`${e.name} now resolves. The only reason it is excluded has gone: publish it.`)
  }
}

const identityRegistry = loadIdentity(REPO_ROOT)
const allRows = loadRows().map(r => mapRow(r).venue)
const bySlug = new Map(
  allRows.filter(v => v.city === 'Las Vegas' && String(v.state).toUpperCase() === 'NV')
    .map(v => [v.slug, v]))

const overlay = {}
const changes = []

for (const p of VENUES) {
  must('play-pickleball-in-las-vegas', p.slug, p.blogQuote, 'count on the City\'s pickleball post')
  must(p.page, p.slug, p.headerLine, 'address and postcode in the park page header')
  must(p.page, p.slug, p.hours, 'park hours in the park page header')

  if (p.parkQuote) {
    must(p.page, p.slug, p.parkQuote, 'count in the park\'s amenity list')
  } else {
    /*
      Lorenzi and Patriot publish on the blog alone. The park page must go
      on saying nothing about pickleball; the day it gains a line, the
      caveat on the venue page is stale and the venue is re-read.
    */
    if (/pickleball/i.test(linesOf(snapshotPath(p.page)).join(' '))) {
      throw new Error(`${p.slug}: the park page now mentions pickleball. It published on the blog alone; re-read it.`)
    }
  }

  const geo = counties[p.slug]
  if (!geo?.matched) throw new Error(`${p.slug}: no address resolver matched its address`)
  if (!geo.place_matches_city) {
    throw new Error(`${p.slug}: the resolver places this at "${geo.place}", not Las Vegas.`)
  }
  if (geo.postal_code !== p.cityZip) {
    throw new Error(`${p.slug}: the resolver's postcode ${geo.postal_code} differs from the City's ${p.cityZip}.`)
  }

  const docBlog = new SourceDocument({
    url: BLOG, retrieved_at: RETRIEVED_AT, tier: 1, publisher: CITY, format: 'html',
  })
  const docPark = new SourceDocument({
    url: `${PARK_BASE}/${p.urlName}`, retrieved_at: RETRIEVED_AT, tier: 1, publisher: CITY, format: 'html',
  })
  const docCensus = new SourceDocument({
    url: CENSUS_URL, retrieved_at: RETRIEVED_AT, tier: 1, publisher: 'US Census Bureau', format: 'json',
  })

  const shell = {
    slug: p.slug, name: null, city: 'Las Vegas', state: 'NV', county: null,
    postal_code: null, street_address: null, latitude: null, longitude: null,
    status: 'pending', source_url: null, date_checked: null, verified_by: null,
    claimed_by_owner: false, claim_date: null,
    rating: null, user_rating: null, review_count: null, claimed_or_verified: null,
    source_sport: 'pickleball',
  }
  for (const f of PUBLISHED_FACT_FIELDS) shell[f] = null
  const imported = p.importedSlug ? bySlug.get(p.importedSlug) : undefined
  const venue = imported ?? shell

  const countDoc = p.parkQuote ? docPark : docBlog
  const facts = [
    docPark.fact('name', p.name, {
      evidence: `Named "${p.name}" in the park page header.` +
        (p.slug === 'patriot-park' ? ' The City\'s pickleball post shortens it to "Patriot Park".' : ''),
    }),
    countDoc.fact('total_courts', p.courts, {
      evidence: p.parkQuote
        ? `Stated twice by the City: "${p.parkQuote}" in the park's amenity list, and "${p.blogQuote}" in its pickleball post of ${BLOG_DATE}.`
        : `"${p.blogQuote}" in the City's pickleball post of ${BLOG_DATE}. The park's own page lists its amenities and never mentions pickleball; the record that states a number publishes, and this run asserts that the park page still says nothing.`,
    }),
    docPark.fact('street_address', p.address, {
      evidence: `"${p.headerLine}" in the park page header.`,
    }),
    docPark.fact('venue_type', 'public_park', {evidence: `Published by the ${CITY} among its parks.`}),
    docPark.fact('hours_of_operation', 'Park hours 7 a.m. to 11 p.m.', {
      evidence: `"${p.hours}" in the park page header.`,
    }),
    countDoc.fact('court_availability', p.availability, {
      evidence: p.parkQuote
        ? `From the park's own page ("${p.parkQuote}", "${p.headerLine}", "${p.hours}") and the City's pickleball post ("${p.blogQuote}").`
        : `From the City's pickleball post ("${p.blogQuote}") and the park's own page ("${p.headerLine}", "${p.hours}"), which does not mention pickleball.`,
    }),
    docCensus.fact('county', geo.county, {
      evidence: `${geo.county} County, NV${geo.county_fips ? ` (FIPS ${geo.state_fips}${geo.county_fips})` : ''}. ${geo.basis} The resolver also places it in the incorporated place "${geo.place}", which is what allows it to be published under Las Vegas.`,
    }),
    docCensus.fact('postal_code', geo.postal_code, {evidence: geo.basis}),
  ]

  const res = applyFacts(venue, facts)

  overlay[p.slug] = {
    minted: !imported,
    identity: {
      name: p.name, city: 'Las Vegas', state: 'NV',
      county: geo.county, postal_code: geo.postal_code ?? null,
      latitude: geo.lat ?? null, longitude: geo.lon ?? null,
      imported_slug: p.importedSlug ?? null,
      canonical_slug: identityRegistry.renames[p.importedSlug]?.canonical ?? p.slug,
    },
    match: {
      source_page: p.parkQuote ? `${PARK_BASE}/${p.urlName}` : BLOG, quote: p.parkQuote ?? p.blogQuote,
      basis: imported
        ? `Matched to the imported ${p.importedSlug} row in Las Vegas, NV, at the same street address.`
        : p.slug === 'durango-hills-park'
          ? 'Minted here under the park\'s own name. The imported dataset holds a row for these courts under durango-hills-park-outdoor-city-courts, a name no City page uses; that row is left pending rather than published under a slug the operator would not recognise.'
          : 'No imported row for this park. Minted here from the City\'s own pages.',
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
const twiceStated = VENUES.filter(p => p.parkQuote).length

for (const [slug, entry] of Object.entries(overlay)) {
  const {total_courts: t, indoor_courts: i, outdoor_courts: o} = entry.patch
  if (i != null && o != null && t !== i + o) {
    throw new Error(`Rule 13: ${slug} does not sum.`)
  }
}

const METHOD_NOTE =
  'Las Vegas keeps two records of its pickleball courts: a parenthesis in each park page\'s amenity list - "Pickleball courts (4)" - beneath a header with the address, postcode and park hours, and a City blog post of 11 March 2026 that lists eight parks with a count each. Where both state a number they agree, and three venues publish on the park page with the post as corroboration: Aloha Shores (4), Centennial Hills (2) and Durango Hills (7). Lorenzi Park and Patriot Community Park have a count on the post and no mention of pickleball on their own park pages; the rule from Lincoln decides it - the record that states a number publishes - and the run asserts the absence on the park page so the caveat on each venue page cannot outlive its truth. Three refusals: Police Memorial Park, eight courts stated twice and the largest count in the city, and Bill Briare Family Park, four courts stated twice, both at addresses neither resolver finds; and Justice Myron Leavitt & Jaycee Community Park, four courts on the post and no address or count on its own page. The City states no lighting, no price, no surface and no indoor/outdoor for any venue, and the post\'s "dropping in" is programme prose rather than a statement about a court.'

mkdirSync(join(REPO_ROOT, 'data/verified'), {recursive: true})
writeFileSync(join(REPO_ROOT, 'data/verified/las-vegas-nv.json'), JSON.stringify({
  city: 'Las Vegas', state: 'NV', retrieved_at: RETRIEVED_AT,
  method_note: METHOD_NOTE,
  sources: [
    {url: BLOG, publisher: CITY, tier: 1, format: 'html', snapshot: snapshotPath('play-pickleball-in-las-vegas')},
    ...VENUES.map(p => ({
      url: `${PARK_BASE}/${p.urlName}`, publisher: CITY, tier: 1, format: 'html', snapshot: snapshotPath(p.page),
    })),
    ...EXCLUDED.filter(e => e.page).map(e => ({
      url: `${PARK_BASE}/${e.urlName}`, publisher: CITY, tier: 1, format: 'html', snapshot: snapshotPath(e.page),
    })),
    {url: CENSUS_URL, publisher: 'US Census Bureau', tier: 1, format: 'json', snapshot: 'data/sources/las-vegas-county-census.json'},
  ].map((s, i) => ({id: `S${i + 1}`, ...s})),
  totals: {
    venues: VENUES.length, courts: totalCourts,
    outdoor: null, indoor: null,
    lit_courts: null, free_venues: 0,
    venues_stated_twice: twiceStated,
  },
  excluded: EXCLUDED.map(e => ({name: e.name, why: e.reasons})),
  venues: overlay,
}, null, 2) + '\n')

const changed = changes.filter(r =>
  r.old_value !== null && r.old_value !== undefined && String(r.old_value) !== String(r.new_value))

writeFileSync(join(REPO_ROOT, 'reports', 'las-vegas-conflicts.md'), [
  '# Las Vegas verification - two City records, three venues stated twice and two stated once', '',
  `Run ${RETRIEVED_AT}. ${VENUES.length} venues published, ${totalCourts} courts. ${EXCLUDED.length} venues refused.`, '',
  'Las Vegas is the first city in Nevada on this site and the first in Clark County.', '',
  '| venue | courts | park page | pickleball post | address |',
  '| --- | ---: | --- | --- | --- |',
  ...VENUES.map(p => `| \`${p.slug}\` | ${p.courts} | ${p.parkQuote ? `"${p.parkQuote}"` : '**no mention of pickleball**'} | "${p.blogQuote}" | ${p.headerLine} |`),
  '',
  '## Two venues rest on one City record', '',
  'The City\'s pickleball post of 11 March 2026 counts "Four at Lorenzi Park" and "Two at Patriot Park". Neither park\'s',
  'own page mentions pickleball; Lorenzi\'s lists tennis courts "managed by No Quit Tennis Academy", basketball, a band',
  'shell and a fishing pond, and Patriot\'s says it "features a basketball court, tennis courts, playground and picnic',
  'areas". This is the shape Lincoln\'s Ballard and Densmore took, and the rule set there decides it: the record that',
  'states a number publishes, the venue page says it rests on one record, and the run asserts that the park page still',
  'says nothing - so the caveat cannot outlive its truth.',
  '',
  '## Refused', '',
  ...EXCLUDED.flatMap(e => [
    `**${e.name}** - ${e.parkQuote ? `"${e.parkQuote}" / ` : ''}"${e.blogQuote}"${e.headerLine ? ` - ${e.headerLine}` : ' - no address published'}`, '',
    ...e.reasons.map((r, i) => `${i + 1}. ${r}`), '']),
  '## What Las Vegas does not say', '',
  '- **indoor or outdoor**, about any venue. The breakdowns stay null.',
  '- **lighting**, anywhere. Null.',
  '- **price.** "Drop in for a pop-up game" is a play format, not a price. Null.',
  '- **surface.**',
  '',
  changed.length ? '## Values a source changed' : '_No imported row was overwritten._',
  ...(changed.length ? [
    '', '| venue | field | was | now | outcome |', '| --- | --- | --- | --- | --- |',
    ...changed.map(r => `| \`${r.venue_slug}\` | ${r.field} | ${JSON.stringify(r.old_value)} | ${JSON.stringify(r.new_value)} | ${r.outcome} |`),
  ] : []),
  '',
].join('\n'))

console.log(`\nLas Vegas, NV - ${VENUES.length} venues, ${totalCourts} courts, retrieved ${RETRIEVED_AT}`)
for (const p of VENUES) {
  const o = overlay[p.slug]
  console.log(
    `  ${o.patch.name.padEnd(24)} ${String(o.patch.total_courts).padStart(2)} | ${(p.parkQuote ? 'stated twice' : 'post only, park page silent').padEnd(27)} | ${o.patch.county} County | ${counties[p.slug].postal_code} | via ${counties[p.slug].resolver}`)
}
console.log(`\n  refused: ${EXCLUDED.map(e => e.name).join(', ')}`)
console.log('\nWrote data/verified/las-vegas-nv.json and reports/las-vegas-conflicts.md\n')
