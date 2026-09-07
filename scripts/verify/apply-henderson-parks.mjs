/*
  Henderson, NV - verification from three text snapshots read in a browser.

  The City of Henderson publishes its pickleball courts on one page,
  https://www.cityofhenderson.com/government/departments/parks-and-recreation/parks-and-trails/pickleball,
  whose "Court Locations" section is five small tables, each a heading, a
  "NUMBER OF COURTS" column and one facility per row:

    OUTDOOR PICKLEBALL COURTS      - five rows, the City's word "outdoor"
    PICKLEBALL & TENNIS COMBINED   - six rows, shared with tennis, no side stated
    INDOOR PICKLEBALL COURTS       - two rows, the City's word "indoor"
    INDOOR PICKLEWALL COURTS       - one row, a wall, not a court
    PICKLEBALL COURTS              - one row, Silver Springs again, no side stated

  The page states no addresses. Those come from the City's own "Park
  Locations and Features" directory (four pages, 78 parks, an ADDRESS block
  per park) and, for the recreation centres, from each centre's facility
  page. Saint Paul's rule: counts on one operator page, addresses on
  another, both the operator's.

  cityofhenderson.com answers HTTP 403 to every scripted fetch - a bare curl
  and the full browser header set - on 2026-09-07. The pages load normally
  in a browser, so they were read in one and saved as text with a header
  stating the method, as Cary's, Wichita's and Spokane's were. See
  data/sources/henderson/README.md. This run asserts the headers, every
  table marker, every count row line-for-line in order, and every address
  block against those files, so the day the City adds, removes or renumbers
  a facility, the run fails before anything publishes.

  What publishes and why:
  - Seven venues, 33 courts. Each is one row in one table (Silver Springs
    is two rows in two tables), and the number is the number.
  - Black Mountain Recreation Center, 18, is on the OUTDOOR table, so all
    eighteen publish as outdoor - the word is the City's. The park directory
    lists "Black Mountain Pickleball Park" at the same address, 599 Greenway
    Rd.; one address, one venue, under the name the count page uses (the
    Forest Hills / Edgemoor rule).
  - Aventura, Mission Hills, Siena Heights Trailhead, Sonata and Sunridge
    are on the "PICKLEBALL & TENNIS COMBINED" table. That heading says
    nothing about indoor or outdoor, so both sides stay null; the courts are
    shared with tennis and the note says so.
  - Silver Springs Recreation Center is printed twice: "3" under INDOOR
    PICKLEBALL COURTS and "1" under a fifth heading that says only
    "PICKLEBALL COURTS". Two operator counts at one address sum into one
    venue (Mount Pleasant's Park West rule): four courts, three of them
    indoor, the fourth on no stated side. It is flagged for re-check because
    the fifth heading does not say where that court is.
  - Six facilities with a City count are refused on their addresses alone:
    Blooming Cactus, Dundee Jones, Montagna, Whitney Mesa, Weston Hills and
    Downtown Recreation Center resolve in neither the Census geocoder nor
    OpenStreetMap as the City writes them (Import Gate I1, the Foster Park
    rule). The run throws the day any of them resolves.
  - Whitney Ranch Recreation Center is refused because its row is under
    "INDOOR PICKLEWALL COURTS". A wall is not a court.
  - Fee, lighting, surface, hours, nets and play format all stay null. The
    City writes no price, never writes "free", and says only that courts
    "can be reserved ... by calling the Sports Office"; that publishes as a
    pricing note without a price and as the availability text, nothing more.
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
const CITY = 'City of Henderson Parks and Recreation'
const PAGE = 'https://www.cityofhenderson.com/government/departments/parks-and-recreation/parks-and-trails/pickleball'
const DIRECTORY = 'https://www.cityofhenderson.com/government/departments/parks-and-recreation/parks-and-trails/park-locations-and-features'
const CENTRES = 'https://www.cityofhenderson.com/Home/Components/FacilityDirectory/FacilityDirectory'
const SNAP_PAGE = 'data/sources/henderson/pickleball.txt'
const SNAP_DIR = 'data/sources/henderson/park-locations.txt'
const SNAP_CENTRES = 'data/sources/henderson/recreation-centers.txt'
const CENSUS_URL = 'https://geocoding.geo.census.gov/geocoder/geographies'

const METHOD_PAGE = 'METHOD: read in a browser (Chrome, via the Claude browser extension); cityofhenderson.com answers HTTP 403 to a bare curl and to the full browser header set, on 2026-09-07.'
const METHOD_DIR = 'METHOD: read in a browser (Chrome, via the Claude browser extension); cityofhenderson.com answers HTTP 403 to every scripted request. The directory is paged, 25 parks a page, 78 parks over four pages'
const METHOD_CENTRES = 'METHOD: read in a browser (Chrome, via the Claude browser extension); cityofhenderson.com answers HTTP 403 to every scripted request. Each facility\'s directory page was opened in turn'

const RESERVE = 'Pickleball courts can be reserved for a friendly game of pickleball, a tournament or event by calling the Sports Office at 702-267-5717.'
const RESERVE_FORMS = 'Reservation forms are available at the City of Henderson Sports Office, 298 N. Arroyo Grande Blvd. Or you may call the Sports Office and ask for a form to be emailed.'
const COLUMN = 'NUMBER OF COURTS'

/* The five tables, exactly as the City prints them, in order. */
const TABLES = [
  {heading: 'OUTDOOR PICKLEBALL COURTS', rows: [
    'Black Mountain Recreation Center 18',
    'Blooming Cactus Park 2',
    'Dundee Jones Park 2',
    'Montagna Park 4',
    'Whitney Mesa 4',
  ]},
  {heading: 'PICKLEBALL & TENNIS COMBINED', rows: [
    'Aventura Park 2',
    'Mission Hills Park 3',
    'Siena Heights Trailhead 2',
    'Sonata Park 2',
    'Sunridge Park 2',
    'Weston Hills Park 2',
  ]},
  {heading: 'INDOOR PICKLEBALL COURTS', rows: [
    'Downtown Recreation Center 3',
    'Silver Springs Recreation Center 3',
  ]},
  {heading: 'INDOOR PICKLEWALL COURTS', rows: [
    'Whitney Ranch Recreation Center 1',
  ]},
  {heading: 'PICKLEBALL COURTS', rows: [
    'Silver Springs Recreation Center 1',
  ]},
]
const OUTDOOR = 'OUTDOOR PICKLEBALL COURTS'
const COMBINED = 'PICKLEBALL & TENNIS COMBINED'
const INDOOR = 'INDOOR PICKLEBALL COURTS'
const PICKLEWALL = 'INDOOR PICKLEWALL COURTS'
const UNSIDED = 'PICKLEBALL COURTS'

/*
  Every venue: its row(s) on the count page, and the address block the
  directory or the facility page prints for it. `addressLines` is the block
  exactly as printed - name, "ADDRESS:", street, city line - and is asserted
  in that order in the named snapshot.
*/
const VENUES = [
  {
    slug: 'black-mountain-recreation-center', importedSlug: 'black-mountain-recreation-center-pickleball-courts',
    name: 'Black Mountain Recreation Center', geo: 'black-mountain-recreation-center',
    rows: [{heading: OUTDOOR, row: 'Black Mountain Recreation Center 18', count: 18}],
    courts: 18, outdoor: 18, indoor: null,
    address: '599 Greenway Rd.', addressFrom: 'centre',
    addressLines: ['Black Mountain Recreation Center', 'ADDRESS:', '599 Greenway Rd.', 'Henderson, NV 89015'],
    alsoInDirectory: ['Black Mountain Pickleball Park', 'ADDRESS:', '599 Greenway Rd.', 'Henderson, NV 89015'],
    venueType: 'community_center',
    availability: 'Eighteen outdoor pickleball courts at Black Mountain Recreation Center, 599 Greenway Rd., the largest set in Henderson and the only Henderson venue on the City\'s "OUTDOOR PICKLEBALL COURTS" table with more than four. The City\'s pickleball page prints the row "Black Mountain Recreation Center 18" under that heading, so all eighteen publish as outdoor in the City\'s own word. The City\'s park directory lists the same address a second time as "Black Mountain Pickleball Park", with pickleball, parking, a picnic ramada, picnic tables, a playground and restrooms among its amenities; one address, one venue. Courts "can be reserved for a friendly game of pickleball, a tournament or event by calling the Sports Office at 702-267-5717". The City states no hours, no lighting, no surface and no price for these courts.',
  },
  {
    slug: 'aventura-park', importedSlug: null,
    name: 'Aventura Park', geo: 'aventura-park',
    rows: [{heading: COMBINED, row: 'Aventura Park 2', count: 2}],
    courts: 2, outdoor: null, indoor: null,
    address: '2525 Via Firenze', addressFrom: 'directory',
    addressLines: ['Aventura Park', 'ADDRESS:', '2525 Via Firenze', 'Henderson, NV 89044'],
    venueType: 'public_park',
    availability: 'Two pickleball courts shared with tennis at Aventura Park, 2525 Via Firenze, in the Inspirada area of south-west Henderson. The City\'s pickleball page prints "Aventura Park 2" under its "PICKLEBALL & TENNIS COMBINED" heading, which is the City\'s way of saying the pickleball lines are on the tennis courts and the courts are shared; the park directory lists tennis courts among the park\'s amenities. That heading says nothing about indoor or outdoor, so neither is claimed here. Courts "can be reserved for a friendly game of pickleball, a tournament or event by calling the Sports Office at 702-267-5717". No hours, lighting, surface or price are stated for these courts.',
  },
  {
    slug: 'mission-hills-park', importedSlug: 'mission-hills-park',
    name: 'Mission Hills Park', geo: 'mission-hills-park',
    rows: [{heading: COMBINED, row: 'Mission Hills Park 3', count: 3}],
    courts: 3, outdoor: null, indoor: null,
    address: '551 E. Mission Dr.', addressFrom: 'directory',
    addressLines: ['Mission Hills Park', 'ADDRESS:', '551 E. Mission Dr.', 'Henderson, NV 89002'],
    venueType: 'public_park',
    availability: 'Three pickleball courts shared with tennis at Mission Hills Park, 551 E. Mission Dr., in the older east side of Henderson. The City\'s pickleball page prints "Mission Hills Park 3" under its "PICKLEBALL & TENNIS COMBINED" heading, so the pickleball lines are on the tennis courts and the courts are shared; the park directory lists both pickleball and tennis courts among the park\'s amenities. That heading says nothing about indoor or outdoor, so neither is claimed here. Courts "can be reserved for a friendly game of pickleball, a tournament or event by calling the Sports Office at 702-267-5717". No hours, lighting, surface or price are stated for these courts. The imported dataset held this park at eight courts; the City\'s three replaces it.',
  },
  {
    slug: 'siena-heights-trailhead', importedSlug: 'siena-heights-trailhead',
    name: 'Siena Heights Trailhead', geo: 'siena-heights-trailhead',
    rows: [{heading: COMBINED, row: 'Siena Heights Trailhead 2', count: 2}],
    courts: 2, outdoor: null, indoor: null,
    address: '2570 Siena Heights Dr.', addressFrom: 'directory',
    addressLines: ['Siena Heights/Amargosa Trailhead', 'ADDRESS:', '2570 Siena Heights Dr.', 'Henderson, NV 89044'],
    venueType: 'public_park',
    availability: 'Two pickleball courts shared with tennis at the Siena Heights Trailhead, 2570 Siena Heights Dr., where the Amargosa Trail meets Seven Hills. The City\'s pickleball page prints "Siena Heights Trailhead 2" under its "PICKLEBALL & TENNIS COMBINED" heading, so the pickleball lines are on the tennis courts and the courts are shared; the park directory, which names the site "Siena Heights/Amargosa Trailhead", lists pickleball and tennis courts among its amenities. That heading says nothing about indoor or outdoor, so neither is claimed here. Courts "can be reserved for a friendly game of pickleball, a tournament or event by calling the Sports Office at 702-267-5717". No hours, lighting, surface or price are stated for these courts. The imported dataset held three courts here; the City\'s two replaces it.',
  },
  {
    slug: 'sonata-park', importedSlug: null,
    name: 'Sonata Park', geo: 'sonata-park',
    rows: [{heading: COMBINED, row: 'Sonata Park 2', count: 2}],
    courts: 2, outdoor: null, indoor: null,
    address: '1550 Seven Hills Dr.', addressFrom: 'directory',
    addressLines: ['Sonata Park', 'ADDRESS:', '1550 Seven Hills Dr.', 'Henderson, NV 89052'],
    venueType: 'public_park',
    availability: 'Two pickleball courts shared with tennis at Sonata Park, 1550 Seven Hills Dr., in the Seven Hills neighbourhood. The City\'s pickleball page prints "Sonata Park 2" under its "PICKLEBALL & TENNIS COMBINED" heading, so the pickleball lines are on the tennis courts and the courts are shared; the park directory lists pickleball and tennis courts among the park\'s amenities. That heading says nothing about indoor or outdoor, so neither is claimed here. Courts "can be reserved for a friendly game of pickleball, a tournament or event by calling the Sports Office at 702-267-5717". No hours, lighting, surface or price are stated for these courts.',
  },
  {
    slug: 'sunridge-park', importedSlug: null,
    name: 'Sunridge Park', geo: 'sunridge-park',
    rows: [{heading: COMBINED, row: 'Sunridge Park 2', count: 2}],
    courts: 2, outdoor: null, indoor: null,
    address: '1010 Sandy Ridge Ave.', addressFrom: 'directory',
    addressLines: ['Sunridge Park', 'ADDRESS:', '1010 Sandy Ridge Ave.', 'Henderson, NV 89052'],
    venueType: 'public_park',
    availability: 'Two pickleball courts shared with tennis at Sunridge Park, 1010 Sandy Ridge Ave., in the MacDonald Ranch area. The City\'s pickleball page prints "Sunridge Park 2" under its "PICKLEBALL & TENNIS COMBINED" heading, so the pickleball lines are on the tennis courts and the courts are shared; the park directory lists tennis courts among the park\'s amenities. That heading says nothing about indoor or outdoor, so neither is claimed here. Courts "can be reserved for a friendly game of pickleball, a tournament or event by calling the Sports Office at 702-267-5717". No hours, lighting, surface or price are stated for these courts.',
  },
  {
    slug: 'silver-springs-recreation-center', importedSlug: null,
    name: 'Silver Springs Recreation Center', geo: 'silver-springs-recreation-center',
    rows: [
      {heading: INDOOR, row: 'Silver Springs Recreation Center 3', count: 3},
      {heading: UNSIDED, row: 'Silver Springs Recreation Center 1', count: 1},
    ],
    courts: 4, outdoor: null, indoor: 3,
    address: '1951 Silver Springs Pkwy.', addressFrom: 'centre',
    addressLines: ['Silver Springs Recreation Center', 'ADDRESS:', '1951 Silver Springs Pkwy.', 'Henderson, NV 89074'],
    venueType: 'community_center',
    availability: 'Four pickleball courts at Silver Springs Recreation Center, 1951 Silver Springs Pkwy., three of them indoor. The City\'s pickleball page prints the centre twice: "Silver Springs Recreation Center 3" under "INDOOR PICKLEBALL COURTS", and "Silver Springs Recreation Center 1" under a fifth heading that reads only "PICKLEBALL COURTS" and says nothing about where that court is. Two City counts at one address publish as one venue with four courts, three of them indoor in the City\'s word and the fourth on no stated side. The centre\'s own facility page lists a gymnasium and tennis courts among its amenities. Courts "can be reserved for a friendly game of pickleball, a tournament or event by calling the Sports Office at 702-267-5717". No hours, lighting, surface or price are stated for these courts.',
  },
]

const EXCLUDED = [
  {name: 'Blooming Cactus Park', geo: 'blooming-cactus-park', heading: OUTDOOR, row: 'Blooming Cactus Park 2', address: '410 Grand Cadence Drive',
    addressLines: ['Blooming Cactus Park', 'ADDRESS:', '410 Grand Cadence Drive', 'Henderson, NV 89011'], why: 'address'},
  {name: 'Dundee Jones Park', geo: 'dundee-jones-park', heading: OUTDOOR, row: 'Dundee Jones Park 2', address: '10550 Jeffreys St',
    addressLines: ['Dundee Jones Park', 'ADDRESS:', '10550 Jeffreys St', 'Henderson, NV 89052'], why: 'address'},
  {name: 'Montagna Park', geo: 'montagna-park', heading: OUTDOOR, row: 'Montagna Park 4', address: '3495 Via Altamira',
    addressLines: ['Montagna Park', 'ADDRESS:', '3495 Via Altamira', 'Henderson, NV 89044'], why: 'address'},
  {name: 'Whitney Mesa', geo: 'whitney-mesa', heading: OUTDOOR, row: 'Whitney Mesa 4', address: '1990 Patrick Ln.',
    addressLines: ['Whitney Mesa Recreation Area and Nature Preserve', 'ADDRESS:', '1990 Patrick Ln.', 'Henderson, NV 89014'], why: 'address'},
  {name: 'Weston Hills Park', geo: 'weston-hills-park', heading: COMBINED, row: 'Weston Hills Park 2', address: '950 Weston Ridge St.',
    addressLines: ['Weston Hills Park', 'ADDRESS:', '950 Weston Ridge St.', 'Henderson, NV 89011'], why: 'address'},
  {name: 'Downtown Recreation Center', geo: 'downtown-recreation-center', heading: INDOOR, row: 'Downtown Recreation Center 3', address: '50 Van Wagenen St.',
    addressLines: ['Downtown Recreation Center', 'ADDRESS:', '50 Van Wagenen St.', 'Henderson, NV 89015'], why: 'address'},
  {name: 'Whitney Ranch Recreation Center', geo: null, heading: PICKLEWALL, row: 'Whitney Ranch Recreation Center 1', address: null,
    addressLines: null, why: 'picklewall'},
]

const ADDRESS_REASON = (e) => [
  `The City states a count, "${e.row}" under "${e.heading}", and an address, "${e.address}", and the address does not resolve. The Census address geocoder returns no match for it in Henderson, NV, and OpenStreetMap has no house number for it. Import Gate I1 requires an address that resolves as written at house-number level; this project has never published one that does not, and has never taken an address from outside the operator (the Foster Park rule).`,
  'The count is real and the refusal is on the address alone. This run throws the day either resolver matches it, so the venue cannot stay refused once it is publishable.',
]
const PICKLEWALL_REASON = [
  'The City prints "Whitney Ranch Recreation Center 1" under the heading "INDOOR PICKLEWALL COURTS", a heading of its own, separate from "INDOOR PICKLEBALL COURTS". A pickle wall is a practice wall, not a court, and this directory counts courts. Nothing on the page states a pickleball court at Whitney Ranch.',
  'This run asserts that heading and that row, so the day the City moves Whitney Ranch under a pickleball heading the run fails and the venue is reconsidered.',
]

/* ---------------------------------------------------------------- */

const readLines = rel => readFileSync(join(REPO_ROOT, rel), 'utf8').split('\n').map(s => s.trim()).filter(Boolean)
const squeeze = s => s.replace(/\s+/g, '')
const pageLines = readLines(SNAP_PAGE)
const dirLines = readLines(SNAP_DIR)
const centreLines = readLines(SNAP_CENTRES)
const wholeOf = ls => squeeze(ls.join(' '))
const wholePage = wholeOf(pageLines)
const wholeDir = wholeOf(dirLines)
const wholeCentres = wholeOf(centreLines)

const must = (whole, needle, what, file) => {
  if (!whole.includes(squeeze(needle))) {
    throw new Error(`Henderson: ${file} no longer contains the ${what} text "${needle}". Re-read the page in a browser before trusting this run.`)
  }
}

/* Each file's own provenance. */
must(wholePage, `URL: ${PAGE}`, 'snapshot URL header', SNAP_PAGE)
must(wholePage, `RETRIEVED: ${RETRIEVED_AT}`, 'snapshot retrieval date', SNAP_PAGE)
must(wholePage, METHOD_PAGE, 'snapshot METHOD header', SNAP_PAGE)
must(wholeDir, `URL: ${DIRECTORY}`, 'snapshot URL header', SNAP_DIR)
must(wholeDir, `RETRIEVED: ${RETRIEVED_AT}`, 'snapshot retrieval date', SNAP_DIR)
must(wholeDir, METHOD_DIR, 'snapshot METHOD header', SNAP_DIR)
must(wholeCentres, `URL: ${CENTRES}/156/783 (Black Mountain), .../158/783 (Downtown), .../166/783 (Silver Springs)`, 'snapshot URL header', SNAP_CENTRES)
must(wholeCentres, `RETRIEVED: ${RETRIEVED_AT}`, 'snapshot retrieval date', SNAP_CENTRES)
must(wholeCentres, METHOD_CENTRES, 'snapshot METHOD header', SNAP_CENTRES)

/* The count page's framing. */
must(wholePage, 'Court Locations', 'Court Locations heading', SNAP_PAGE)
must(wholePage, RESERVE, 'reservation sentence', SNAP_PAGE)
must(wholePage, RESERVE_FORMS, 'reservation-forms sentence', SNAP_PAGE)

/*
  A table: from its start marker to its end marker. Its first line must be
  the heading followed by the column name, and the rows must equal the
  expected rows exactly, in order - one row more, one row fewer, one number
  changed, and the run fails.
*/
function assertTable({heading, rows}) {
  const start = `=== TABLE: ${heading} ===`
  const at = pageLines.findIndex(l => l === start)
  if (at < 0) throw new Error(`Henderson: the pickleball snapshot no longer carries the table marker "${start}". Re-read the page.`)
  const end = pageLines.findIndex((l, i) => i > at && l === '=== END OF TABLE ===')
  if (end < 0) throw new Error(`Henderson: the "${heading}" table has no end marker.`)
  const got = pageLines.slice(at + 1, end)
  const expected = [`${heading} ${COLUMN}`, ...rows]
  if (got.length !== expected.length || got.some((l, i) => squeeze(l) !== squeeze(expected[i]))) {
    throw new Error(`Henderson: the "${heading}" table no longer reads as asserted.\n  expected: ${JSON.stringify(expected)}\n  found:    ${JSON.stringify(got)}\nRe-read the page.`)
  }
  return got
}
for (const t of TABLES) assertTable(t)
if (pageLines.filter(l => l.startsWith('=== TABLE:')).length !== TABLES.length) {
  throw new Error('Henderson: the pickleball snapshot carries a table this run does not assert.')
}

/* A row is "Name N": the count is the trailing integer and the name the rest. */
const rowCount = r => Number(r.match(/ (\d+)$/)?.[1])
const rowName = r => r.replace(/ \d+$/, '')
const tableOf = heading => TABLES.find(t => t.heading === heading)

/*
  A name may appear under two headings only where this run says so, and
  those two rows must be exactly the two asserted. Everything else appears
  once.
*/
const rowsByName = new Map()
for (const t of TABLES) for (const r of t.rows) {
  const n = rowName(r)
  rowsByName.set(n, [...(rowsByName.get(n) ?? []), {heading: t.heading, row: r}])
}
for (const [n, rs] of rowsByName) {
  const v = VENUES.find(v => v.name === n)
  const allowed = v ? v.rows.length : 1
  if (rs.length !== allowed) throw new Error(`Henderson: "${n}" appears ${rs.length} time(s) on the count page; this run expects ${allowed}.`)
  if (v && v.rows.length > 1) {
    for (const {heading, row} of v.rows) if (!rs.some(x => x.heading === heading && x.row === row)) throw new Error(`Henderson: "${n}" is no longer printed as "${row}" under "${heading}".`)
  }
}

/* Every published venue's rows are where the run says, and its counts sum. */
for (const v of VENUES) {
  for (const {heading, row, count} of v.rows) {
    if (!tableOf(heading)?.rows.includes(row)) throw new Error(`${v.slug}: row "${row}" is not in the "${heading}" table.`)
    if (rowName(row) !== v.name) throw new Error(`${v.slug}: row "${row}" is not this venue's name.`)
    if (rowCount(row) !== count) throw new Error(`${v.slug}: count ${count} does not match its row "${row}".`)
  }
  const sum = v.rows.reduce((a, r) => a + r.count, 0)
  if (sum !== v.courts) throw new Error(`${v.slug}: rows sum to ${sum}, not ${v.courts}.`)
  if (v.outdoor != null && !v.rows.some(r => r.heading === OUTDOOR)) throw new Error(`${v.slug}: claims outdoor courts with no row under "${OUTDOOR}".`)
  if (v.indoor != null && !v.rows.some(r => r.heading === INDOOR)) throw new Error(`${v.slug}: claims indoor courts with no row under "${INDOOR}".`)
  if (v.outdoor != null && v.outdoor !== v.rows.filter(r => r.heading === OUTDOOR).reduce((a, r) => a + r.count, 0)) throw new Error(`${v.slug}: outdoor count is not the outdoor row.`)
  if (v.indoor != null && v.indoor !== v.rows.filter(r => r.heading === INDOOR).reduce((a, r) => a + r.count, 0)) throw new Error(`${v.slug}: indoor count is not the indoor row.`)
  if (v.rows.some(r => r.heading === PICKLEWALL)) throw new Error(`${v.slug}: a picklewall row is not a court.`)
}

/*
  An address block is four consecutive lines in the named snapshot: the
  name as the directory prints it, "ADDRESS:", the street, the city line.
*/
function assertBlock(lines, block, file, what) {
  const hit = lines.findIndex((l, i) => block.every((b, j) => squeeze(lines[i + j] ?? '') === squeeze(b)))
  if (hit < 0) throw new Error(`Henderson: ${file} no longer carries the ${what} address block ${JSON.stringify(block)}. Re-read the page.`)
  return hit
}
for (const v of VENUES) {
  const [lines, file] = v.addressFrom === 'centre' ? [centreLines, SNAP_CENTRES] : [dirLines, SNAP_DIR]
  assertBlock(lines, v.addressLines, file, v.name)
  if (squeeze(v.addressLines[2]) !== squeeze(v.address)) throw new Error(`${v.slug}: street "${v.address}" is not the block's street line.`)
  if (v.alsoInDirectory) assertBlock(dirLines, v.alsoInDirectory, SNAP_DIR, `${v.name} (directory)`)
  if (v.addressFrom === 'centre') {
    must(wholeCentres, `=== FACILITY: ${v.name} ===`, `${v.name} facility marker`, SNAP_CENTRES)
  }
}
/* The Downtown centre's block is asserted too: its refusal is on the address, and the address is the City's. */
for (const e of EXCLUDED) {
  if (!tableOf(e.heading)?.rows.includes(e.row)) throw new Error(`${e.name}: its row is no longer under "${e.heading}"; reconsider the refusal.`)
  if (e.addressLines) {
    const [lines, file] = e.geo === 'downtown-recreation-center' ? [centreLines, SNAP_CENTRES] : [dirLines, SNAP_DIR]
    assertBlock(lines, e.addressLines, file, e.name)
  }
}
must(wholeCentres, '=== FACILITY: Downtown Recreation Center ===', 'Downtown facility marker', SNAP_CENTRES)

/* The refusals, asserted rather than remembered. */
const counties = JSON.parse(readFileSync(join(REPO_ROOT, 'data/sources/henderson-county-census.json'), 'utf8'))
for (const e of EXCLUDED) {
  if (e.why !== 'address') continue
  const geo = counties[e.geo]
  if (!geo) throw new Error(`${e.name}: no geocoder result recorded; run the geocoder before deciding.`)
  if (geo.matched) throw new Error(`${e.name}: its address now resolves via ${geo.resolver} ("${geo.matched}"). The refusal no longer holds - publish it.`)
}

const identityRegistry = loadIdentity(REPO_ROOT)
const allRows = loadRows().map(r => mapRow(r).venue)
const bySlug = new Map(
  allRows.filter(v => v.city === 'Henderson' && String(v.state).toUpperCase() === 'NV')
    .map(v => [v.slug, v]))

const overlay = {}
const changes = []

for (const v of VENUES) {
  const geo = counties[v.geo]
  if (!geo?.matched) throw new Error(`${v.slug}: no address resolver matched its address`)
  if (!geo.place_matches_city) throw new Error(`${v.slug}: the resolver places this at "${geo.place}", not Henderson.`)
  if (v.importedSlug && !bySlug.has(v.importedSlug)) throw new Error(`${v.slug}: imported row ${v.importedSlug} is no longer in data.csv for Henderson, NV.`)

  const doc = new SourceDocument({url: PAGE, retrieved_at: RETRIEVED_AT, tier: 1, publisher: CITY, format: 'text'})
  const addressUrl = v.addressFrom === 'centre'
    ? `${CENTRES}/${v.slug === 'black-mountain-recreation-center' ? '156' : '166'}/783`
    : DIRECTORY
  const docAddress = new SourceDocument({url: addressUrl, retrieved_at: RETRIEVED_AT, tier: 1, publisher: CITY, format: 'text'})
  const docCensus = new SourceDocument({url: CENSUS_URL, retrieved_at: RETRIEVED_AT, tier: 1, publisher: 'US Census Bureau', format: 'json'})

  const shell = {
    slug: v.slug, name: null, city: 'Henderson', state: 'NV', county: null,
    postal_code: null, street_address: null, latitude: null, longitude: null,
    status: 'pending', source_url: null, date_checked: null, verified_by: null,
    claimed_by_owner: false, claim_date: null,
    rating: null, user_rating: null, review_count: null, claimed_or_verified: null,
    source_sport: 'pickleball',
  }
  for (const f of PUBLISHED_FACT_FIELDS) shell[f] = null
  const imported = v.importedSlug ? bySlug.get(v.importedSlug) : undefined
  const venue = imported ?? shell

  const quoted = v.rows.map(r => `"${r.row}" under "${r.heading}"`).join(' and ')
  const isCombined = v.rows.some(r => r.heading === COMBINED)
  const blockQuoted = `"${v.addressLines.join(' / ')}"`
  const addressWhere = v.addressFrom === 'centre'
    ? 'the centre\'s own page in the City\'s facility directory'
    : 'the City\'s Park Locations and Features directory'

  const facts = [
    doc.fact('name', v.name, {
      evidence: `Named "${v.name}" on the Court Locations tables of the City's pickleball page: ${quoted}.` +
        (v.slug === 'siena-heights-trailhead' ? ' The park directory names the same site "Siena Heights/Amargosa Trailhead".' : '') +
        (v.slug === 'black-mountain-recreation-center' ? ' The park directory lists the same address a second time as "Black Mountain Pickleball Park".' : ''),
    }),
    doc.fact('total_courts', v.courts, {
      evidence: v.rows.length > 1
        ? `Two City rows at one address: ${quoted}. Four is their sum; the fifth heading, "${UNSIDED}", does not say where its one court is.`
        : `Quoted from the City's pickleball page: ${quoted}.`,
    }),
    docAddress.fact('street_address', v.address, {
      evidence: `${blockQuoted} in ${addressWhere}; the City's pickleball page states counts and no addresses.` +
        (v.alsoInDirectory ? ` The park directory prints the same street under "${v.alsoInDirectory[0]}".` : ''),
    }),
    doc.fact('venue_type', v.venueType, {
      evidence: v.venueType === 'community_center'
        ? `Listed by the City's facility directory under "Recreation Centers"; counted on the City's pickleball page as ${quoted}.`
        : `Published by ${CITY} in its Park Locations and Features directory, among the City's parks.`,
    }),
    doc.fact('pricing_notes',
      'Courts can be reserved by calling the City\'s Sports Office; the City publishes no price for a reservation and does not say the courts are free.', {
        evidence: `"${RESERVE}" No fee or price appears anywhere on the page.`,
      }),
    doc.fact('court_availability', v.availability, {
      evidence: `From the City's pickleball page: ${quoted}.` + (isCombined ? ` The heading "${COMBINED}" is the City's word for courts shared with tennis.` : ''),
    }),
    docCensus.fact('county', geo.county, {
      evidence: `${geo.county} County, NV${geo.county_fips ? ` (FIPS ${geo.state_fips}${geo.county_fips})` : ''}. ${geo.basis} The resolver also places it in the incorporated place "${geo.place}", which is what allows it to be published under Henderson.`,
    }),
    docCensus.fact('postal_code', geo.postal_code, {evidence: geo.basis}),
  ]
  if (v.outdoor != null) {
    facts.push(doc.fact('outdoor_courts', v.outdoor, {
      evidence: `The row sits under the City's own heading "${OUTDOOR}": "${v.rows.find(r => r.heading === OUTDOOR).row}". The word is the City's.`,
    }))
  }
  if (v.indoor != null) {
    facts.push(doc.fact('indoor_courts', v.indoor, {
      evidence: `The row sits under the City's own heading "${INDOOR}": "${v.rows.find(r => r.heading === INDOOR).row}". The word is the City's. The centre's other row, "${v.rows.find(r => r.heading === UNSIDED).row}" under "${UNSIDED}", states no side and is counted in the total only.`,
    }))
  }

  const res = applyFacts(venue, facts)

  const unsided = v.rows.some(r => r.heading === UNSIDED)
  const needsRecheck = res.needs_recheck || unsided
  const recheck = unsided
    ? {
      reason: res.recheck?.reason
        ? `${res.recheck.reason} Also: the City prints this centre under two headings and the second, "${UNSIDED}", does not say whether its one court is indoor or outdoor; re-read the page for a heading that does.`
        : `The City prints this centre under two headings and the second, "${UNSIDED}", does not say whether its one court is indoor or outdoor; re-read the page for a heading that does.`,
      fields: [...new Set([...(res.recheck?.fields ?? []), 'total_courts', 'indoor_courts', 'outdoor_courts'])],
      scheduled: 'next_cadence', times: 1,
    }
    : res.recheck

  overlay[v.slug] = {
    minted: !imported,
    identity: {
      name: v.name, city: 'Henderson', state: 'NV',
      county: geo.county, postal_code: geo.postal_code ?? null,
      latitude: geo.lat ?? null, longitude: geo.lon ?? null,
      imported_slug: v.importedSlug ?? null,
      canonical_slug: identityRegistry.renames[v.importedSlug]?.canonical ?? v.slug,
    },
    match: {
      source_page: PAGE, quote: v.rows.map(r => r.row).join(' / '),
      basis: imported
        ? v.slug === 'black-mountain-recreation-center'
          ? 'Matched to the imported black-mountain-recreation-center-pickleball-courts row in Henderson, NV (which carried "599 Greenway Road" and six courts), published under the canonical slug black-mountain-recreation-center; the identity pass dropped the trailing "-pickleball-courts". Same street, same number; the City\'s count of eighteen replaces six. The park directory\'s "Black Mountain Pickleball Park" entry is the same address and folds into this venue.'
          : v.slug === 'mission-hills-park'
            ? 'Matched to the imported mission-hills-park row in Henderson, NV, at the same street address (which carried eight courts); the City\'s three replaces it.'
            : 'Matched to the imported siena-heights-trailhead row in Henderson, NV, at the same street address (which carried three courts); the City\'s two replaces it.'
        : `Minted from the City's page. The imported dataset holds no row for ${v.name} in Henderson, NV.`,
    },
    patch: Object.fromEntries(facts.map(f => [f.field, f.value])),
    provenance: res.provenance,
    record: {
      source_url: res.venue.source_url,
      date_checked: res.venue.date_checked,
      verified_by: res.venue.verified_by,
    },
    needs_recheck: needsRecheck,
    recheck,
  }
  changes.push(...changelogToRows(v.slug, res.changelog))
}

/* ---------------------------------------------------------------- */

const totalCourts = VENUES.reduce((a, v) => a + v.courts, 0)
const outdoorCourts = VENUES.reduce((a, v) => a + (v.outdoor ?? 0), 0)
const indoorCourts = VENUES.reduce((a, v) => a + (v.indoor ?? 0), 0)
const unsidedCourts = totalCourts - outdoorCourts - indoorCourts

/* Rule 13: where both sides are stated they must sum; where one is, it must not exceed the total; the city must sum. */
for (const [slug, entry] of Object.entries(overlay)) {
  const {total_courts: t, indoor_courts: i, outdoor_courts: o} = entry.patch
  if (!Number.isInteger(t) || t < 1) throw new Error(`Rule 13: ${slug} has no count.`)
  if (i != null && o != null && t !== i + o) throw new Error(`Rule 13: ${slug} does not sum.`)
  if ((i ?? 0) + (o ?? 0) > t) throw new Error(`Rule 13: ${slug} claims more sided courts than it has.`)
}
if (outdoorCourts + indoorCourts + unsidedCourts !== totalCourts) throw new Error('Rule 13: the city does not sum.')

const METHOD_NOTE =
  'Henderson\'s pickleball page states a count for every facility it lists, in five small tables headed "OUTDOOR PICKLEBALL COURTS", "PICKLEBALL & TENNIS COMBINED", "INDOOR PICKLEBALL COURTS", "INDOOR PICKLEWALL COURTS" and "PICKLEBALL COURTS", and states no addresses; the addresses come from the City\'s own Park Locations and Features directory and, for the recreation centres, from each centre\'s page in the City\'s facility directory (Saint Paul\'s rule: counts on one operator page, addresses on another). None of the pages could be fetched by a script - cityofhenderson.com answers a bare request and a full browser header set with HTTP 403 - so they were read in a browser and saved as text with a header stating the method, as Cary\'s, Wichita\'s and Spokane\'s pages were; this run asserts the headers, every table marker, every count row line-for-line in order and every address block against those files. Outdoor and indoor publish only where the City\'s heading says the word: Black Mountain\'s eighteen are outdoor, Silver Springs\' three are indoor. The five "PICKLEBALL & TENNIS COMBINED" venues are shared with tennis and carry no side, so indoor and outdoor stay null on them. Silver Springs is printed twice, "3" under the indoor heading and "1" under a heading that says only "PICKLEBALL COURTS"; the two City counts at one address publish as one venue of four (Mount Pleasant\'s Park West rule), and the venue is flagged for re-check because the fifth heading does not say where the fourth court is. Six facilities with a City count - Blooming Cactus, Dundee Jones, Montagna, Whitney Mesa, Weston Hills and Downtown Recreation Center - are refused on their addresses alone, which resolve in neither resolver as the City writes them; Whitney Ranch is refused because a "PICKLEWALL" is not a court. Fee, lighting, surface, hours, nets and play format stay null: the City writes no price, never writes "free", and says only that courts can be reserved by calling the Sports Office, which publishes as a pricing note with no price. No venue is published as free.'

mkdirSync(join(REPO_ROOT, 'data/verified'), {recursive: true})
writeFileSync(join(REPO_ROOT, 'data/verified/henderson-nv.json'), JSON.stringify({
  city: 'Henderson', state: 'NV', retrieved_at: RETRIEVED_AT,
  method_note: METHOD_NOTE,
  sources: [
    {url: PAGE, publisher: CITY, tier: 1, format: 'text', snapshot: SNAP_PAGE,
      method: 'Read in a browser on 2026-09-07 because cityofhenderson.com answers scripted fetches with HTTP 403; the five Court Locations tables were captured as rendered, one facility per line. See data/sources/henderson/README.md.'},
    {url: DIRECTORY, publisher: CITY, tier: 1, format: 'text', snapshot: SNAP_DIR,
      method: 'Read in a browser on 2026-09-07, four pages of 25 parks; the entries for the facilities on the pickleball page were captured with their ADDRESS blocks as printed. See data/sources/henderson/README.md.'},
    {url: `${CENTRES}/156/783`, publisher: CITY, tier: 1, format: 'text', snapshot: SNAP_CENTRES,
      method: 'Read in a browser on 2026-09-07 with the Downtown (158/783) and Silver Springs (166/783) facility pages; each centre\'s address block and amenities captured as printed. See data/sources/henderson/README.md.'},
    {url: CENSUS_URL, publisher: 'US Census Bureau', tier: 1, format: 'json', snapshot: 'data/sources/henderson-county-census.json'},
  ].map((s, i) => ({id: `S${i + 1}`, ...s})),
  totals: {
    venues: VENUES.length, courts: totalCourts,
    outdoor: outdoorCourts, indoor: indoorCourts, unsided: unsidedCourts,
    combined_with_tennis: VENUES.filter(v => v.rows.some(r => r.heading === COMBINED)).reduce((a, v) => a + v.courts, 0),
    lit_courts: 0, free_venues: 0,
  },
  excluded: EXCLUDED.map(e => ({name: e.name, why: e.why === 'address' ? ADDRESS_REASON(e) : PICKLEWALL_REASON})),
  venues: overlay,
}, null, 2) + '\n')

const changed = changes.filter(r =>
  r.old_value !== null && r.old_value !== undefined && String(r.old_value) !== String(r.new_value))

writeFileSync(join(REPO_ROOT, 'reports', 'henderson-conflicts.md'), [
  '# Henderson verification - five tables of counts, a directory of addresses, all read in a browser', '',
  `Run ${RETRIEVED_AT}. ${VENUES.length} venues published, ${totalCourts} courts (${outdoorCourts} outdoor, ${indoorCourts} indoor, ${unsidedCourts} on no stated side). ${EXCLUDED.length} facilities refused.`, '',
  'Henderson is the second city in Nevada on this site and the second in Clark County, after Las Vegas. Its',
  'sources are three text snapshots read in a browser, because cityofhenderson.com answers every scripted',
  'fetch with HTTP 403; see `data/sources/henderson/README.md`. The City\'s pickleball page states a count',
  'for every facility and no addresses; the addresses are the City\'s own, from its park directory and its',
  'facility pages (Saint Paul\'s rule). Every row of all five tables and every address block is asserted',
  'against those files, in order.', '',
  '| venue | courts | indoor | outdoor | what the City writes | address, and where it is printed |',
  '| --- | ---: | ---: | ---: | --- | --- |',
  ...VENUES.map(v => `| \`${v.slug}\` | ${v.courts} | ${v.indoor ?? '-'} | ${v.outdoor ?? '-'} | ${v.rows.map(r => `"${r.row}" under "${r.heading}"`).join('; ')} | "${v.address}" (${v.addressFrom === 'centre' ? 'facility page' : 'park directory'}) |`),
  '',
  '## A side is claimed only where the City\'s heading says the word', '',
  'Black Mountain\'s eighteen courts sit under "OUTDOOR PICKLEBALL COURTS" and publish as outdoor; Silver',
  'Springs\' three sit under "INDOOR PICKLEBALL COURTS" and publish as indoor. The five venues under',
  '"PICKLEBALL & TENNIS COMBINED" are shared with tennis and the heading says nothing about a roof, so',
  'indoor and outdoor are null on all five. The notes say the courts are shared.',
  '',
  '## Silver Springs is printed twice', '',
  '"Silver Springs Recreation Center 3" under "INDOOR PICKLEBALL COURTS" and "Silver Springs Recreation',
  'Center 1" under a fifth heading that reads only "PICKLEBALL COURTS". Two City counts at one address',
  'publish as one venue of four courts, three of them indoor (Mount Pleasant\'s Park West rule). The fourth',
  'court is on no stated side. The venue is flagged for re-check on exactly that point.',
  '',
  '## Black Mountain is one venue under two City names', '',
  'The count page says "Black Mountain Recreation Center"; the park directory lists "Black Mountain',
  'Pickleball Park" at the same address, 599 Greenway Rd., with pickleball among its amenities; the centre\'s',
  'facility page prints the same address. One address, one venue, under the name the count page uses',
  '(the Forest Hills / Edgemoor rule). Both blocks are asserted.',
  '',
  '## Nothing is lit, surfaced, priced or timed, and nothing is free', '',
  'The City writes no price, no hours, no surface and no lighting for any court, and never writes "free".',
  'It says courts "can be reserved for a friendly game of pickleball, a tournament or event by calling the',
  'Sports Office at 702-267-5717"; that publishes as a pricing note without a price. Play format is null',
  'too: the page states reservations, not open play, and this project publishes only what the operator',
  'says.',
  '',
  '## Refused', '',
  ...EXCLUDED.flatMap(e => [`**${e.name}** - "${e.row}" under "${e.heading}"${e.address ? `, "${e.address}"` : ''}`, '', ...(e.why === 'address' ? ADDRESS_REASON(e) : PICKLEWALL_REASON).map((r, i) => `${i + 1}. ${r}`), '']),
  '## Imported rows left pending', '',
  '- **Dundee Jones Park** (imported at "10561 Jeffreys", two courts) is refused above on the City\'s address, "10550 Jeffreys St".',
  '- **Montagna Park** (imported as montagna-park-henderson-nv, four courts, same street) is refused above on the address.',
  '- **Downtown Recreation Center** (imported at "105 West Basic Road", three indoor courts, with a drop-in fee) is refused above: the City',
  '  prints the centre at "50 Van Wagenen St." and that address resolves nowhere; "105 W. Basic Rd." is Downtown Park in the City\'s directory.',
  '- **Whitney Mesa Tennis/Pickleball Complex** and **Whitney Mesa Tennis Complex** (imported at 1661 and 1575 Galleria Drive, twelve and eight',
  '  courts) are not the City\'s "Whitney Mesa 4", which the directory places at 1990 Patrick Ln.; that address is refused above and the',
  '  imported rows stay pending.',
  '- Clubs, commercial facilities, residential communities and gyms in the imported rows are not on the City\'s page and stay pending.',
  '',
  changed.length ? '## Values a source changed' : '_No imported row was overwritten._',
  ...(changed.length ? [
    '', '| venue | field | was | now | outcome |', '| --- | --- | --- | --- | --- |',
    ...changed.map(r => `| \`${r.venue_slug}\` | ${r.field} | ${JSON.stringify(r.old_value)} | ${JSON.stringify(r.new_value)} | ${r.outcome} |`),
  ] : []),
  '',
].join('\n'))

console.log(`\nHenderson, NV - ${VENUES.length} venues, ${totalCourts} courts (${outdoorCourts} outdoor, ${indoorCourts} indoor, ${unsidedCourts} unsided), retrieved ${RETRIEVED_AT}`)
for (const v of VENUES) {
  const o = overlay[v.slug]
  console.log(`  ${o.patch.name.padEnd(34)} ${String(o.patch.total_courts).padStart(2)} | in ${String(o.patch.indoor_courts ?? '-').padStart(2)} out ${String(o.patch.outdoor_courts ?? '-').padStart(2)} | ${o.patch.county} County | ${counties[v.geo].postal_code} | via ${counties[v.geo].resolver}${o.needs_recheck ? ' | recheck' : ''}`)
}
console.log(`\n  refused: ${EXCLUDED.map(e => e.name).join(', ')}`)
console.log('\nWrote data/verified/henderson-nv.json and reports/henderson-conflicts.md\n')
