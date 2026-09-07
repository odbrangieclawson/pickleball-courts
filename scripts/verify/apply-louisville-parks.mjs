#!/usr/bin/env node
/*
  Louisville, KY verification run - city #27, the first in Kentucky and the
  first in Jefferson County.

  ============================================================
  A LIST THAT COUNTS AND PARK PAGES THAT LOCATE
  ============================================================

  Louisville Parks and Recreation publishes one page for pickleball, and on
  it a list headed "Pickleball Court List:" with one line per park in the
  form "Vettiner Park - 14", "Iroquois - 4", "Crescent HIll - 4" (the
  City's own capitalisation). Seventeen lines, seventeen numbers. Above the
  list the City writes: "Louisville Parks and Recreation provides several
  outdoor pickleball courts for all ages." - which is the sentence that lets
  every count here publish as an OUTDOOR count.

  The list carries no addresses. Each park has its own page on the same
  site with a "Park Address" block and "Hours" of "6 a.m. - 11 p.m.", and
  those pages supply the address, the hours and the park's full name
  ("Charlie Vettiner Park" where the list says "Vettiner Park"; "Crescent
  Hill Park" where the list says "Crescent HIll"). The park pages list
  "Pickleball" as an amenity without a count at fifteen of the seventeen;
  Fern Creek's and Riverview's do not mention it at all. Those two publish
  from the list alone under the Lincoln rule - the record that states a
  number publishes - and the run asserts the ABSENCE on the park page so
  the caveat cannot outlive its truth.

  ============================================================
  "LOUISVILLE" IS THREE NAMES TO THE RESOLVERS
  ============================================================

  Louisville is a consolidated city-county. The Census address geocoder
  returns the incorporated place as "Louisville city" for addresses inside
  the pre-merger city, and as "Louisville/Jefferson County metro government
  (balance)" for the rest of the consolidated city - "(balance)" is the
  Census's name for the merged government's territory outside the small
  cities that stayed separately incorporated. OpenStreetMap says
  "Louisville". All three are the City of Louisville, and this run accepts
  all three.

  What it does not accept is a different incorporated city. Hounz Lane Park
  resolves to "Lyndon city", one of those separately incorporated small
  cities inside Jefferson County. Louisville Metro runs the park and lists
  it; the address is in Lyndon. That is the Scottsdale Community College
  ground - a city page must contain venues in that city, and who programmes
  them is a separate question - and Hounz Lane is refused on it.

  ============================================================
  WHAT IS NOT CLAIMED
  ============================================================

  lighting, fee, surface, nets   Nothing stated on either page. Null.
  indoor                         The City says "outdoor" for the set, so
                                 outdoor_courts = total; indoor stays null
                                 rather than being written as 0.
  play_format                    Nothing stated. Null.
  postcode                       The City prints none; the resolver's
                                 publishes with no disagreement to note.

  ============================================================
  IMPORTED ROWS
  ============================================================

  Six imported rows describe published parks. des-pres-park and
  sun-valley-park match by slug. The other four carry older names or a
  misspelling - charlie-vettiner-metro-park, wyandotte-metro-park,
  riverside-metro-park, peterburg-park (sic, with 6 courts against the
  City's 4) - and are left pending, as Las Vegas's Durango Hills row was;
  each published venue's match block says so.
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

const CITY = 'Louisville Parks and Recreation'
const PAGE = 'https://louisvilleky.gov/government/parks/pickleball-courts'
const PARK_BASE = 'https://louisvilleky.gov/government/parks/park-list'
const CENSUS_URL = 'https://geocoding.geo.census.gov/geocoder/geographies'

const OUTDOOR = 'Louisville Parks and Recreation provides several outdoor pickleball courts for all ages.'
const LIST_HEADING = 'Pickleball Court List:'
const HOURS = '6 a.m. - 11 p.m.'

/* One name the City itself uses for the consolidated city, in three resolver spellings. */
const LOUISVILLE_PLACES = new Set(['Louisville', 'Louisville city', 'Louisville/Jefferson County metro government (balance)'])

const VENUES = [
  {slug: 'charlie-vettiner-park', importedSlug: null, pendingRow: 'charlie-vettiner-metro-park', name: 'Charlie Vettiner Park', listName: 'Vettiner Park', courts: 14, address: '5550 Charlie Vettiner Park Rd', addressLine: '5550 Charlie Vettiner Park Rd.',
    availability: 'Fourteen outdoor pickleball courts, the largest set in Louisville by a distance, on the City\'s own count: "Vettiner Park - 14" on its pickleball page. The park\'s own page gives the address, hours of 6 a.m. to 11 p.m., and lists pickleball among its amenities. The City states nothing about lighting, price, surface or nets at any of its pickleball parks, and this page records each of those as unknown. Fourteen courts is a rotation that absorbs a crowd; nothing else in the city comes close.'},
  {slug: 'iroquois-park', importedSlug: null, name: 'Iroquois Park', listName: 'Iroquois', courts: 4, address: '5216 New Cut Rd', addressLine: '5216 New Cut Rd.',
    availability: 'Four outdoor pickleball courts in one of Louisville\'s large Olmsted parks, from the City\'s line "Iroquois - 4". The park page gives 5216 New Cut Rd., hours of 6 a.m. to 11 p.m., and lists pickleball among the amenities. Lighting, price, surface and nets are not stated.'},
  {slug: 'mcneely-lake-park', importedSlug: null, name: 'McNeely Lake Park', listName: 'McNeely Lake', courts: 2, address: '10500 Cedar Creek Rd', addressLine: '*10500 Cedar Creek Rd.',
    availability: 'Two outdoor pickleball courts in a lake park in the south-east of the county, from the City\'s line "McNeely Lake - 2". The park page prints the address with a leading asterisk, "*10500 Cedar Creek Rd.", which this site drops; the address resolves inside the consolidated city. Hours 6 a.m. to 11 p.m. Lighting, price, surface and nets are not stated. Two courts is a game rather than a rotation.'},
  {slug: 'sun-valley-park', importedSlug: 'sun-valley-park', name: 'Sun Valley Park', listName: 'Sun Valley', courts: 1, address: '6616 Ashby Ln', addressLine: '6616 Ashby Ln.',
    availability: 'One outdoor pickleball court, from the City\'s line "Sun Valley - 1", in the south-west of the county at 6616 Ashby Ln. One court is one game at a time. Hours 6 a.m. to 11 p.m.; lighting, price, surface and nets are not stated. This venue was in the imported dataset with the same count and address.'},
  {slug: 'crescent-hill-park', importedSlug: null, name: 'Crescent Hill Park', listName: 'Crescent HIll', courts: 4, address: '201 Reservoir Avenue', addressLine: '201 Reservoir Avenue',
    availability: 'Four outdoor pickleball courts beside the Crescent Hill reservoir, from the City\'s line "Crescent HIll - 4" - the capitalisation is the City\'s. The park page gives 201 Reservoir Avenue and hours of 6 a.m. to 11 p.m. Lighting, price, surface and nets are not stated.'},
  {slug: 'des-pres-park', importedSlug: 'des-pres-park', name: 'Des Pres Park', listName: 'Des Pres', courts: 3, address: '4709 Lowe Rd', addressLine: '4709 Lowe Rd.',
    availability: 'Three outdoor pickleball courts, from the City\'s line "Des Pres - 3", at 4709 Lowe Rd. in the east of the county. Hours 6 a.m. to 11 p.m. Lighting, price, surface and nets are not stated. This venue was in the imported dataset with the same count and address.'},
  {slug: 'fern-creek-park', importedSlug: null, name: 'Fern Creek Park', listName: 'Fern Creek', courts: 6, address: '8703 Ferndale Rd', addressLine: '8703 Ferndale Rd.', parkListsPickleball: false,
    availability: 'Six outdoor pickleball courts, from the City\'s line "Fern Creek - 6". The park\'s own page gives the address, 8703 Ferndale Rd., and hours of 6 a.m. to 11 p.m., but does not list pickleball among its amenities, so this venue rests on the pickleball page alone; the run asserts that silence, and the build fails the day the park page mentions the courts. Lighting, price, surface and nets are not stated.'},
  {slug: 'george-rogers-clark-park', importedSlug: null, name: 'George Rogers Clark Park', listName: 'George Rogers Clark', courts: 2, address: '1024 Thruston Ave', addressLine: '1024 Thruston Ave.',
    availability: 'Two outdoor pickleball courts, from the City\'s line "George Rogers Clark - 2", at 1024 Thruston Ave. inside the older city. Hours 6 a.m. to 11 p.m. Lighting, price, surface and nets are not stated.'},
  {slug: 'hays-kennedy-park', importedSlug: null, name: 'Hays Kennedy Park', listName: 'Hays Kennedy', courts: 6, address: '7003 Beachland Beach Rd', addressLine: '7003 Beachland Beach Rd.',
    availability: 'Six outdoor pickleball courts, from the City\'s line "Hays Kennedy - 6", on the Ohio River in the north-east of the county at 7003 Beachland Beach Rd. The address resolves through OpenStreetMap rather than the Census address file. Hours 6 a.m. to 11 p.m. Lighting, price, surface and nets are not stated.'},
  {slug: 'petersburg-park', importedSlug: null, pendingRow: 'peterburg-park', name: 'Petersburg Park', listName: 'Petersburg', courts: 4, address: '5008 E Indian Trail', addressLine: '5008 E Indian Trail',
    availability: 'Four outdoor pickleball courts, from the City\'s line "Petersburg - 4", at 5008 E Indian Trail. Hours 6 a.m. to 11 p.m. Lighting, price, surface and nets are not stated. The imported dataset carries this park, misspelt, with six courts; the City says four and the City publishes.'},
  {slug: 'riverview-park', importedSlug: null, name: 'Riverview Park', listName: 'Riverview', courts: 4, address: '8202 Greenwood Rd', addressLine: '8202 Greenwood Rd.', parkListsPickleball: false,
    availability: 'Four outdoor pickleball courts, from the City\'s line "Riverview - 4", on the river in the south-west of the county at 8202 Greenwood Rd. The park\'s own page does not list pickleball among its amenities, so the count rests on the pickleball page alone and the run asserts that silence. Hours 6 a.m. to 11 p.m. Lighting, price, surface and nets are not stated.'},
  {slug: 'wyandotte-park', importedSlug: null, pendingRow: 'wyandotte-metro-park', name: 'Wyandotte Park', listName: 'Wyandotte', courts: 6, address: '1104 Beecher St', addressLine: '1104 Beecher St.',
    availability: 'Six outdoor pickleball courts, from the City\'s line "Wyandotte - 6", at 1104 Beecher St. in the south of the older city. Hours 6 a.m. to 11 p.m. Lighting, price, surface and nets are not stated.'},
  {slug: 'nelson-hornbeck-park', importedSlug: null, name: 'Nelson Hornbeck Park', listName: 'Nelson Hornbeck', courts: 6, address: '709 Fairdale Rd', addressLine: '709 Fairdale Rd.',
    availability: 'Six outdoor pickleball courts, from the City\'s line "Nelson Hornbeck - 6", at 709 Fairdale Rd. in the south of the county; the address resolves through OpenStreetMap rather than the Census address file. Hours 6 a.m. to 11 p.m. Lighting, price, surface and nets are not stated.'},
  {slug: 'riverside-gardens-park', importedSlug: null, pendingRow: 'riverside-metro-park', name: 'Riverside Gardens Park', listName: 'Riverside Gardens', courts: 1, address: '3899 Lees Ln', addressLine: '3899 Lees Ln.',
    availability: 'One outdoor pickleball court, from the City\'s line "Riverside Gardens - 1", at 3899 Lees Ln. in the west of the county. One court is one game at a time. Hours 6 a.m. to 11 p.m. Lighting, price, surface and nets are not stated.'},
  {slug: 'tyler-park', importedSlug: null, name: 'Tyler Park', listName: 'Tyler', courts: 2, address: '1501 Castlewood Ave', addressLine: '1501 Castlewood Ave.',
    availability: 'Two outdoor pickleball courts, from the City\'s line "Tyler - 2", at 1501 Castlewood Ave. in the Highlands. Hours 6 a.m. to 11 p.m. Lighting, price, surface and nets are not stated.'},
  {slug: 'new-walnut-street-park', importedSlug: null, name: 'New Walnut Street Park', listName: 'New Walnut Street', courts: 2, address: '1327 W Muhammad Ali Blvd', addressLine: '1327 W Muhammad Ali Blvd.',
    availability: 'Two outdoor pickleball courts, from the City\'s line "New Walnut Street - 2", at 1327 W Muhammad Ali Blvd. in the west of the older city. Hours 6 a.m. to 11 p.m. Lighting, price, surface and nets are not stated.'},
]

const EXCLUDED = [
  {
    name: 'Hounz Lane Park', slug: 'hounz-lane-park', listName: 'Hounz Lane', courts: 3, addressLine: '2300 Hounz Ln.',
    reasons: [
      'The Census address geocoder places "2300 Hounz Ln." in the incorporated place "Lyndon city", one of the small cities inside Jefferson County that stayed separately incorporated when Louisville and the county merged. It is not inside the City of Louisville.',
      'Louisville Metro runs the park and lists it with three courts, and that does not change where it is. This is the Scottsdale Community College ground: a city page must contain venues in that city, and who programmes them is a separate question. The list line and the address are asserted so the refusal is re-examined if either changes.',
    ],
  },
]

/* ---------------------------------------------------------------- */

const snapshotPath = name => `data/sources/louisville/${name}.html`

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

/* The list, asserted as a block: the heading, then exactly these lines in this order. */
const listPage = linesOf(snapshotPath('pickleball-courts'))
must('pickleball-courts', 'Louisville', OUTDOOR, 'outdoor sentence')
const start = listPage.findIndex(l => squeeze(l) === squeeze(LIST_HEADING))
if (start < 0) throw new Error(`The pickleball page no longer carries the heading "${LIST_HEADING}".`)
const expectedLines = [...VENUES, ...EXCLUDED]
  .map(v => ({order: v.listName, text: `${v.listName} - ${v.courts}`}))
const LIST_ORDER = ['Vettiner Park', 'Iroquois', 'McNeely Lake', 'Sun Valley', 'Crescent HIll', 'Des Pres', 'Fern Creek', 'George Rogers Clark', 'Hays Kennedy', 'Hounz Lane', 'Petersburg', 'Riverview', 'Wyandotte', 'Nelson Hornbeck', 'Riverside Gardens', 'Tyler', 'New Walnut Street']
const want = LIST_ORDER.map(n => squeeze(expectedLines.find(e => e.order === n).text))
const got = listPage.slice(start + 1, start + 1 + want.length).map(squeeze)
if (got.join('|') !== want.join('|')) {
  throw new Error(`The Pickleball Court List has changed. Expected ${JSON.stringify(want)}, page reads ${JSON.stringify(listPage.slice(start + 1, start + 1 + want.length))}. Re-read the city.`)
}
const after = listPage[start + 1 + want.length] ?? ''
if (/ - \d+$/.test(after)) throw new Error(`The Pickleball Court List now carries an eighteenth line: "${after}".`)

const counties = JSON.parse(readFileSync(join(REPO_ROOT, 'data/sources/louisville-county-census.json'), 'utf8'))

/* The park page: name in the title, address under "Park Address", hours under "Hours". */
function assertParkPage(slug, name, addressLine, listsPickleball) {
  const lines = linesOf(snapshotPath(slug))
  if (!lines.some(l => l.startsWith(`${name} |`) || l === name)) {
    throw new Error(`${slug}: the park page no longer carries the name "${name}".`)
  }
  const at = lines.findIndex(l => l === 'Park Address')
  if (at < 0 || squeeze(lines[at + 1]) !== squeeze(addressLine)) {
    throw new Error(`${slug}: the park page no longer gives "${addressLine}" under "Park Address" (reads "${lines[at + 1]}").`)
  }
  const h = lines.findIndex(l => l === 'Hours')
  if (h < 0 || squeeze(lines[h + 1]) !== squeeze(HOURS)) {
    throw new Error(`${slug}: the park page no longer gives "${HOURS}" under "Hours" (reads "${lines[h + 1]}").`)
  }
  const mentions = lines.some(l => /pickleball/i.test(l))
  if (listsPickleball && !mentions) throw new Error(`${slug}: the park page no longer lists Pickleball among its amenities.`)
  if (!listsPickleball && mentions) throw new Error(`${slug}: the park page now mentions pickleball. The venue was published on the list alone; re-read it.`)
}

/* ---------------------------------------------------------------- */
/* THE REFUSAL, ASSERTED RATHER THAN REMEMBERED.                     */

for (const e of EXCLUDED) {
  assertParkPage(e.slug, e.name, e.addressLine, true)
  const geo = counties[e.slug]
  if (!geo?.matched) throw new Error(`${e.slug}: expected a match in Lyndon city; the resolver now has no match. Re-read.`)
  if (LOUISVILLE_PLACES.has(geo.place)) {
    throw new Error(`${e.slug}: the resolver now places it in "${geo.place}". The reason for refusing it has gone: publish its three courts.`)
  }
}

const identityRegistry = loadIdentity(REPO_ROOT)
const allRows = loadRows().map(r => mapRow(r).venue)
const bySlug = new Map(
  allRows.filter(v => v.city === 'Louisville' && String(v.state).toUpperCase() === 'KY')
    .map(v => [v.slug, v]))

const overlay = {}
const changes = []

for (const p of VENUES) {
  const listsPickleball = p.parkListsPickleball !== false
  assertParkPage(p.slug, p.name, p.addressLine, listsPickleball)

  const geo = counties[p.slug]
  if (!geo?.matched) throw new Error(`${p.slug}: no address resolver matched its address`)
  if (!LOUISVILLE_PLACES.has(geo.place)) {
    throw new Error(`${p.slug}: the resolver places this at "${geo.place}", not the City of Louisville.`)
  }
  if (geo.county !== 'Jefferson') throw new Error(`${p.slug}: county is ${geo.county}, not Jefferson.`)

  const doc = new SourceDocument({url: PAGE, retrieved_at: RETRIEVED_AT, tier: 1, publisher: CITY, format: 'html'})
  const docPark = new SourceDocument({url: `${PARK_BASE}/${p.slug}`, retrieved_at: RETRIEVED_AT, tier: 1, publisher: CITY, format: 'html'})
  const docCensus = new SourceDocument({url: CENSUS_URL, retrieved_at: RETRIEVED_AT, tier: 1, publisher: 'US Census Bureau', format: 'json'})

  const shell = {
    slug: p.slug, name: null, city: 'Louisville', state: 'KY', county: null,
    postal_code: null, street_address: null, latitude: null, longitude: null,
    status: 'pending', source_url: null, date_checked: null, verified_by: null,
    claimed_by_owner: false, claim_date: null,
    rating: null, user_rating: null, review_count: null, claimed_or_verified: null,
    source_sport: 'pickleball',
  }
  for (const f of PUBLISHED_FACT_FIELDS) shell[f] = null
  const imported = p.importedSlug ? bySlug.get(p.importedSlug) : undefined
  const venue = imported ?? shell

  const listLine = `${p.listName} - ${p.courts}`
  const facts = [
    docPark.fact('name', p.name, {
      evidence: `"${p.name}" is the park page's own title. The City's pickleball list shortens it to "${p.listName}".`,
    }),
    doc.fact('total_courts', p.courts, {
      evidence: `Quoted from the "Pickleball Court List:" on the City's pickleball page: "${listLine}".` +
        (listsPickleball ? ' The park\'s own page lists Pickleball among its amenities without a count.' : ' The park\'s own page does not mention pickleball; the count rests on the list, and the run asserts the park page\'s silence.'),
    }),
    doc.fact('outdoor_courts', p.courts, {
      evidence: `The City introduces the list with "${OUTDOOR}", so every count on it is an outdoor count.`,
    }),
    docPark.fact('street_address', p.address, {
      evidence: `"${p.addressLine}" under "Park Address" on the park's own page.` + (p.addressLine.startsWith('*') ? ' The City prints a leading asterisk, which is dropped here.' : ''),
    }),
    docPark.fact('venue_type', 'public_park', {evidence: `Published by ${CITY} in its park list.`}),
    docPark.fact('hours_of_operation', 'Park hours 6 a.m. to 11 p.m.', {
      evidence: `"Hours" / "${HOURS}" on the park's own page.`,
    }),
    doc.fact('court_availability', p.availability, {
      evidence: `From the City's pickleball page ("${listLine}", "${OUTDOOR}") and the park's own page ("${p.addressLine}", "${HOURS}").`,
    }),
    docCensus.fact('county', geo.county, {
      evidence: `${geo.county} County, KY${geo.county_fips ? ` (FIPS ${geo.state_fips}${geo.county_fips})` : ''}. ${geo.basis} The resolver places it in "${geo.place}" - one of the three names the resolvers use for the consolidated City of Louisville - which is what allows it to be published under Louisville.`,
    }),
    docCensus.fact('postal_code', geo.postal_code, {evidence: geo.basis}),
  ]

  const res = applyFacts(venue, facts)

  overlay[p.slug] = {
    minted: !imported,
    identity: {
      name: p.name, city: 'Louisville', state: 'KY',
      county: geo.county, postal_code: geo.postal_code ?? null,
      latitude: geo.lat ?? null, longitude: geo.lon ?? null,
      imported_slug: p.importedSlug ?? null,
      canonical_slug: identityRegistry.renames[p.importedSlug]?.canonical ?? p.slug,
    },
    match: {
      source_page: PAGE, quote: listLine,
      basis: imported
        ? `Matched to the imported ${p.importedSlug} row in Louisville, KY, at the same street address.`
        : p.pendingRow
          ? `No imported row under this slug. Minted from the City's pages. The imported ${p.pendingRow} row describes the same park under an older name${p.pendingRow === 'peterburg-park' ? ' (misspelt, and with six courts against the City\'s four)' : ''} and is left pending rather than published as a second venue.`
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
  if (i != null && o != null && t !== i + o) throw new Error(`Rule 13: ${slug} does not sum.`)
}

const METHOD_NOTE =
  'Louisville Parks and Recreation publishes a "Pickleball Court List:" of seventeen lines in the form "Vettiner Park - 14", introduced by the sentence "Louisville Parks and Recreation provides several outdoor pickleball courts for all ages.", and a page per park with a "Park Address" block and "Hours" of "6 a.m. - 11 p.m." The list counts and calls the set outdoor; the park pages locate and name. Sixteen of the seventeen publish. Hounz Lane Park is refused because the Census places its address in Lyndon city, a separately incorporated small city inside Jefferson County - the Scottsdale Community College ground. Louisville is a consolidated city-county, so the resolvers name the City three ways ("Louisville city", "Louisville/Jefferson County metro government (balance)", "Louisville"), and the run accepts all three. Fern Creek and Riverview publish on the list alone: their park pages do not mention pickleball, and the run asserts that silence. The City states no lighting, price, surface or nets anywhere. The list is asserted as a block of seventeen lines in order, and the build fails on an eighteenth.'

mkdirSync(join(REPO_ROOT, 'data/verified'), {recursive: true})
writeFileSync(join(REPO_ROOT, 'data/verified/louisville-ky.json'), JSON.stringify({
  city: 'Louisville', state: 'KY', retrieved_at: RETRIEVED_AT,
  method_note: METHOD_NOTE,
  sources: [
    {url: PAGE, publisher: CITY, tier: 1, format: 'html', snapshot: snapshotPath('pickleball-courts')},
    ...VENUES.map(p => ({url: `${PARK_BASE}/${p.slug}`, publisher: CITY, tier: 1, format: 'html', snapshot: snapshotPath(p.slug)})),
    ...EXCLUDED.map(e => ({url: `${PARK_BASE}/${e.slug}`, publisher: CITY, tier: 1, format: 'html', snapshot: snapshotPath(e.slug)})),
    {url: CENSUS_URL, publisher: 'US Census Bureau', tier: 1, format: 'json', snapshot: 'data/sources/louisville-county-census.json'},
  ].map((s, i) => ({id: `S${i + 1}`, ...s})),
  totals: {venues: VENUES.length, courts: totalCourts, outdoor: totalCourts, indoor: null, lit_courts: null, free_venues: 0},
  excluded: EXCLUDED.map(e => ({name: e.name, why: e.reasons})),
  venues: overlay,
}, null, 2) + '\n')

const changed = changes.filter(r => r.old_value !== null && r.old_value !== undefined && String(r.old_value) !== String(r.new_value))

writeFileSync(join(REPO_ROOT, 'reports', 'louisville-conflicts.md'), [
  '# Louisville verification - a list that counts, park pages that locate, and a city with three names', '',
  `Run ${RETRIEVED_AT}. ${VENUES.length} venues published, ${totalCourts} courts, all outdoor on the City's word. ${EXCLUDED.length} venue refused.`, '',
  'Louisville is the first city in Kentucky on this site and the first in Jefferson County.', '',
  '| venue | list line | courts | address | resolver place |',
  '| --- | --- | ---: | --- | --- |',
  ...VENUES.map(p => `| \`${p.slug}\` | "${p.listName} - ${p.courts}" | ${p.courts} | ${p.addressLine} | ${counties[p.slug].place} (${counties[p.slug].resolver}) |`),
  '',
  '## Three names for one city', '',
  'The Census address geocoder returns "Louisville city" for addresses inside the pre-merger city and',
  '"Louisville/Jefferson County metro government (balance)" for the rest of the consolidated city; OpenStreetMap',
  'says "Louisville". All three are accepted. A different incorporated city is not:',
  '',
  '## Refused', '',
  ...EXCLUDED.flatMap(e => [`**${e.name}** - "${e.listName} - ${e.courts}" - ${e.addressLine}`, '', ...e.reasons.map((r, i) => `${i + 1}. ${r}`), '']),
  '## Two venues rest on the list alone', '',
  'Fern Creek Park and Riverview Park have park pages that do not mention pickleball. The list states a number',
  'for each, the number publishes (the Lincoln rule), and the run asserts the park page\'s silence so the',
  'caveat cannot outlive its truth.',
  '',
  '## What Louisville does not say', '',
  '- **lighting, price, surface, nets** - nothing, at any venue.',
  '- **indoor** - the set is "outdoor" in the City\'s word; indoor stays null rather than being written as 0.',
  '- **postcodes** - the City prints none; the resolver\'s publish.',
  '',
  changed.length ? '## Values a source changed' : '_No imported row was overwritten._',
  ...(changed.length ? ['', '| venue | field | was | now | outcome |', '| --- | --- | --- | --- | --- |',
    ...changed.map(r => `| \`${r.venue_slug}\` | ${r.field} | ${JSON.stringify(r.old_value)} | ${JSON.stringify(r.new_value)} | ${r.outcome} |`)] : []),
  '',
].join('\n'))

console.log(`\nLouisville, KY - ${VENUES.length} venues, ${totalCourts} courts, retrieved ${RETRIEVED_AT}`)
for (const p of VENUES) {
  const o = overlay[p.slug]
  console.log(`  ${o.patch.name.padEnd(26)} ${String(o.patch.total_courts).padStart(2)} | outdoor | ${counties[p.slug].place} | ${counties[p.slug].postal_code} | via ${counties[p.slug].resolver}`)
}
console.log(`\n  refused: ${EXCLUDED.map(e => e.name).join(', ')}`)
console.log('\nWrote data/verified/louisville-ky.json and reports/louisville-conflicts.md\n')
