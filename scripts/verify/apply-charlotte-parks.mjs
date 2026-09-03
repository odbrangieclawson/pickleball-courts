#!/usr/bin/env node
/*
  Charlotte, NC verification run — city #5, and the first outside Wake County
  in North Carolina.

  ============================================================
  THE COUNTS ARE ENUMERATED, NOT STATED AND NOT DERIVED
  ============================================================

  Mecklenburg County Park and Recreation does not print a court count. It
  lists individual numbered courts, split between reservable and open play:

    Pickleball Courts (reservable)   Clarks Creek Park: Courts 1-5
    Pickleball Courts (open play)    Clarks Creek Park: Courts 6-8

  So a park's count is the number of distinct court numbers the county names
  at it. This script parses those ranges out of the snapshot and counts the
  union; the numbers are not typed into this file.

  That is worth distinguishing carefully from the Sacramento run that was
  withdrawn. There we counted anonymous points on a map and guessed what each
  one represented, and the guess was wrong. Here the operator names court 1,
  court 2, court 3. Reading a list of identified courts is not inference.

  THE INTERNAL CHECK, AND IT IS A REAL ONE

  Every park's court numbers must form exactly one complete consecutive run,
  with no gaps and no number appearing in both the reservable and open-play
  lists. The run below asserts that per park and refuses to publish a venue
  whose numbers do not reconstruct cleanly:

    Clarks Creek   1-5 + 6-8            -> 1-8    8
    Clanton        1-4 + 5&6            -> 1-6    6
    Freedom        11,12,14,15 + 13,16  -> 11-16  6
    MLK            2,3,5,6 + 1&4        -> 1-6    6
    Beatty         2&3 + 1              -> 1-3    3

  Freedom Park is the instructive one. Its pickleball courts run 11 to 16
  because courts 1 to 10 at that park are tennis, listed separately higher up
  the same page. Two interleaved lists still rebuild a complete 11-16 with
  nothing missing and nothing double-counted, which is a much stronger signal
  than a bare total would be.

  ============================================================
  ADDRESSES AND GEOGRAPHY
  ============================================================

  The county's own GIS is behind the same 403 as its website, so addresses
  and coordinates come from the City of Charlotte Open Data parks layer,
  which is machine-readable and covers Mecklenburg County parks including
  those in the surrounding towns.

  Municipality was resolved rather than assumed, and it mattered. Colonel
  Francis J. Beatty Park has the postcode 28105, which is a Matthews mailing
  ZIP, and the parks layer labels its CITY as Charlotte. Those disagree. The
  Census geocoder settles it: the point falls inside the incorporated place
  of Charlotte, in Mecklenburg County. All five do.

  ============================================================
  WHAT IS NOT PUBLISHED
  ============================================================

  HYBRID COURTS at Latta Park and Tuckaseegee Park, six apiece. The county
  lists them under a heading of their own — "Hybrid Courts" — rather than
  under Pickleball Courts, and does not say what a hybrid court is. It is
  probably a shared tennis-and-pickleball surface, and "probably" is not a
  source. They stay out until the county says what they are.

  lights, surface, nets, fees   Not stated for any of the five. The page says
                                only that "Some courts can be reserved for a
                                small fee", without naming a price or which
                                courts, so fee_type stays null.
  restroom / parking            The page states that local neighbourhood
                                parks "do not typically have parking or
                                restroom features". "Do not typically" is a
                                statement about a category, not about a
                                venue, so nothing is written to either field.
*/

import {readFileSync, writeFileSync, mkdirSync} from 'node:fs'
import {join} from 'node:path'
import {SourceDocument} from './provenance.mjs'
import {applyFacts, changelogToRows} from './conflict.mjs'
import {loadRows, REPO_ROOT} from '../lib/load-csv.mjs'
import {PUBLISHED_FACT_FIELDS} from '../../lib/data/verified.mjs'
import {loadIdentity} from '../../lib/data/identity.mjs'
import {mapRow} from '../import/mapper.mjs'

const RETRIEVED_AT = process.env.RETRIEVED_AT ?? '2026-09-03'

const COUNTY = 'Mecklenburg County Park and Recreation'
const PB_URL = 'https://parkandrec.mecknc.gov/Activities/tennis-pickleball-volleyball'
const OPENDATA_URL = 'https://opendata.arcgis.com/datasets/735a6bce6306442face38657b50fc7b7_10.geojson'
const CENSUS_URL = 'https://geocoding.geo.census.gov/geocoder/geographies'

/*
  Identity only. `label` is how the county writes the park's name in its court
  lists, which is not always how the parks layer writes it — the county says
  "MLK Park" where the layer says "Martin Luther King Jr. Park". `park` is the
  layer's name. Nothing here carries a court count.
*/
const VENUES = [
  {slug: 'clarks-creek-park', label: 'Clarks Creek Park', park: 'Clarks Creek Park',
   name: 'Clarks Creek Park',
   basis: 'No imported row. The county names eight numbered pickleball courts here, the most at any Charlotte park in this set. Not to be confused with Clarks Creek Nature Preserve across the road at 5434 Hucks Rd, or Clarks Creek Greenway Park on Mallard Creek Rd, both of which are separate records in the parks layer.'},

  {slug: 'clanton-park', label: 'Clanton Park', park: 'Clanton Park',
   name: 'Clanton Park',
   basis: 'No imported row. Distinct from the Clanton Park Community Garden, a separate record in the parks layer at a different address.'},

  {slug: 'freedom-park', label: 'Freedom Park', park: 'Freedom Park',
   name: 'Freedom Park',
   basis: 'No imported row. Its pickleball courts are numbered 11-16 because courts 1-10 at this park are tennis, listed separately on the same page.'},

  {slug: 'martin-luther-king-jr-park', label: 'MLK Park', park: 'Martin Luther King Jr. Park',
   name: 'Martin Luther King Jr. Park',
   basis: 'No imported row. The county writes "MLK Park" in its court lists and "Martin Luther King Jr. Park" in the parks layer; the full name is published. Distinct from Martin Luther King Jr. Middle School, a separate record in the layer.'},

  {slug: 'colonel-francis-j-beatty-park', label: 'Colonel Francis J. Beatty Park',
   park: 'Colonel Francis J. Beatty Park',
   name: 'Col. Francis J. Beatty Park',
   fullName: 'Colonel Francis J. Beatty Park',
   basis: 'No imported row. Published as "Col." rather than "Colonel" because the full name produces a page title over the 65-character limit and titles.mjs refuses to truncate mid-word. Its postcode 28105 is a Matthews mailing ZIP, but the Census places the park inside the city of Charlotte.'},
]

/* ---------------------------------------------------------------- */

/*
  Line endings normalised on read. The parser below is newline-sensitive, and
  git on Windows rewrites LF to CRLF on checkout — so without this the run
  fails on a Windows clone with "found 0 blocks", which reads like the page
  changed when nothing has. A tool that cries wolf about its source is worse
  than one that says nothing.
*/
const snapshot = readFileSync(join(REPO_ROOT, 'data/sources/charlotte-parks/mecknc-courts.txt'), 'utf8')
  .replace(/\r\n/g, '\n')
const opendata = JSON.parse(readFileSync(join(REPO_ROOT, 'data/sources/charlotte-parks/charlotte-parks-opendata.json'), 'utf8'))
const geo = JSON.parse(readFileSync(join(REPO_ROOT, 'data/sources/charlotte-county-census.json'), 'utf8'))

const byPark = new Map(opendata.parks.map(p => [p.PRKNAME, p]))

/*
  The two "Pickleball Courts" blocks: one under Reservable Courts, one under
  Open Play Courts. Sliced by heading so a park's tennis line — Freedom Park
  appears under Tennis Courts too — can never be read as pickleball.
*/
function pickleballBlocks() {
  const out = []
  const re = /\nPickleball Courts\n([\s\S]*?)(?=\n[A-Z][A-Za-z ]*\n|$)/g
  let m
  while ((m = re.exec(snapshot)) !== null) out.push(m[1])
  if (out.length !== 2) {
    throw new Error(`Expected two "Pickleball Courts" blocks in the snapshot (reservable and open play), found ${out.length}. Re-read the page before trusting this run.`)
  }
  return out
}

/*
  The parks layer shouts its addresses: "5435 HUCKS RD", "2435 CUMBERLAND AV".
  Title-casing them naively leaves the street type shouting — "Hucks RD",
  "Cumberland AV" — because those tokens are two or three capitals and a
  general-purpose title-caser has no way to know they are words. So the street
  types are expanded explicitly. A directional prefix stays a capital letter.
*/
const STREET_TYPES = {
  RD: 'Rd', ST: 'St', AV: 'Ave', AVE: 'Ave', DR: 'Dr', LN: 'Ln', CT: 'Ct',
  PL: 'Pl', BLVD: 'Blvd', PKWY: 'Pkwy', CIR: 'Cir', TRL: 'Trl', TER: 'Ter',
  WY: 'Way', HWY: 'Hwy', EXT: 'Ext', SQ: 'Sq',
}
const DIRECTIONS = new Set(['N', 'S', 'E', 'W', 'NE', 'NW', 'SE', 'SW'])

function titleCaseAddress(raw) {
  return String(raw).trim().split(/\s+/).map(w => {
    const up = w.toUpperCase()
    if (DIRECTIONS.has(up)) return up
    if (STREET_TYPES[up]) return STREET_TYPES[up]
    if (/^\d/.test(w)) return w
    return w[0].toUpperCase() + w.slice(1).toLowerCase()
  }).join(' ')
}

/** "Courts 1-5" / "Courts 2&3" / "Court 1" / "Courts 11, 12, 14, 15" -> [numbers] */
function courtNumbers(spec) {
  const nums = new Set()
  for (const part of spec.split(/[,&]/)) {
    const range = /(\d+)\s*-\s*(\d+)/.exec(part)
    if (range) {
      for (let n = Number(range[1]); n <= Number(range[2]); n++) nums.add(n)
      continue
    }
    for (const d of part.match(/\d+/g) ?? []) nums.add(Number(d))
  }
  return [...nums]
}

const blocks = pickleballBlocks()
const overlay = {}
const changes = []
const table = []

const identityRegistry = loadIdentity(REPO_ROOT)
const allRows = loadRows().map(r => mapRow(r).venue)
const bySlug = new Map(
  allRows.filter(v => v.city === 'Charlotte' && String(v.state).toUpperCase() === 'NC')
    .map(v => [v.slug, v]))

for (const v of VENUES) {
  const g = geo[v.slug]
  const park = byPark.get(v.park)
  if (!g) throw new Error(`No geography lookup for ${v.slug}`)
  if (!park) throw new Error(`No parks-layer record named "${v.park}"`)
  if (!park.PRKADDR) throw new Error(`"${v.park}" has no address in the parks layer; it must be excluded, not published`)

  /* Pull this park's line out of each block and union the court numbers. */
  const lines = []
  const sets = []
  for (const block of blocks) {
    const line = block.split('\n').find(l => l.trim().startsWith(`${v.label}:`))
    if (!line) continue
    lines.push(line.trim())
    sets.push(courtNumbers(line.split(':')[1]))
  }
  if (!lines.length) {
    throw new Error(`${v.slug}: the snapshot no longer lists "${v.label}" under Pickleball Courts. Re-read the page.`)
  }

  const all = sets.flat()
  const union = [...new Set(all)].sort((a, b) => a - b)

  /* No court number may appear in both the reservable and open-play lists. */
  if (all.length !== union.length) {
    throw new Error(`${v.slug}: a court number appears twice across the reservable and open-play lists (${all.join(',')}). That is a contradiction in the source, not something to average.`)
  }
  /* The numbers must form one complete run with no holes. */
  const gaps = []
  for (let n = union[0]; n <= union[union.length - 1]; n++) if (!union.includes(n)) gaps.push(n)
  if (gaps.length) {
    throw new Error(`${v.slug}: court numbers ${union.join(',')} leave gaps at ${gaps.join(',')}. A missing number means a court we cannot account for, so this venue does not publish.`)
  }

  const courts = union.length
  const evidence =
    `Mecklenburg County lists individual numbered pickleball courts rather than a total. At this park it names ` +
    lines.map(l => `"${l}"`).join(' and ') +
    `, which is court${courts === 1 ? '' : 's'} ${union[0]}${courts > 1 ? `-${union[union.length - 1]}` : ''} — ${courts} distinct court${courts === 1 ? '' : 's'}, forming one complete run with no gaps and no number listed twice.`

  const docCounty = new SourceDocument({url: PB_URL, retrieved_at: RETRIEVED_AT, tier: 1, publisher: COUNTY, format: 'html'})
  const docOpen = new SourceDocument({url: OPENDATA_URL, retrieved_at: RETRIEVED_AT, tier: 2, publisher: 'City of Charlotte Open Data', format: 'geojson'})
  const docCensus = new SourceDocument({url: CENSUS_URL, retrieved_at: RETRIEVED_AT, tier: 1, publisher: 'US Census Bureau', format: 'json'})

  const shell = {
    slug: v.slug, name: null, city: 'Charlotte', state: 'NC', county: null,
    postal_code: null, street_address: null, latitude: null, longitude: null,
    status: 'pending', source_url: null, date_checked: null, verified_by: null,
    claimed_by_owner: false, claim_date: null,
    rating: null, user_rating: null, review_count: null, claimed_or_verified: null,
    source_sport: 'pickleball',
  }
  for (const f of PUBLISHED_FACT_FIELDS) shell[f] = null
  const base = bySlug.get(v.slug) ?? shell

  const address = titleCaseAddress(park.PRKADDR)

  const facts = [
    docCounty.fact('name', v.name, {
      evidence: v.fullName
        ? `The park is "${v.fullName}" in the City of Charlotte parks layer. Published in the shortened form because the full name overruns the 65-character page-title limit.`
        : `Named "${v.park}" in the City of Charlotte parks layer; Mecklenburg County writes it "${v.label}" in its court lists.`,
    }),
    docCounty.fact('total_courts', courts, {evidence}),
    docOpen.fact('street_address', address, {
      evidence: `City of Charlotte Open Data parks layer, PRKNAME="${park.PRKNAME}", PRKADDR="${park.PRKADDR}", ${park.CITY} ${park.STATE} ${park.ZIP}. Title-cased for display, with the street type expanded.`,
    }),
    /*
      Postal code as a PROVENANCED FACT, not as an identity field.

      Identity is only applied to venues the overlay mints; a venue matched to
      an imported row keeps the import's location fields. Clanton Park showed
      why that matters: the import carries 28208 for 1520 Clanton Rd and the
      county's own parks layer carries 28217, and without this the unsourced
      number would win purely because a row happened to exist. A fact with a
      source beats a field without one.
    */
    ...(park.ZIP ? [docOpen.fact('postal_code', String(park.ZIP), {
      evidence: `City of Charlotte Open Data parks layer, PRKNAME="${park.PRKNAME}", ZIP="${park.ZIP}".`,
    })] : []),
    docCounty.fact('venue_type', 'public_park', {
      evidence: `Operated by ${COUNTY}; the parks layer records it as PRKTYPE="${park.PRKTYPE}", PRKSTATUS="${park.PRKSTATUS}".`,
    }),
    docCensus.fact('county', g.county, {evidence: g.basis}),
  ]

  const res = applyFacts(base, facts)

  overlay[v.slug] = {
    minted: !bySlug.has(v.slug),
    identity: {
      name: v.name, city: 'Charlotte', state: 'NC', county: g.county,
      postal_code: park.ZIP ? String(park.ZIP) : null,
      latitude: g.lat, longitude: g.lon,
      imported_slug: bySlug.has(v.slug) ? v.slug : null,
      canonical_slug: identityRegistry.renames[v.slug]?.canonical ?? v.slug,
    },
    match: {county_lines: lines, court_numbers: union, park_record: park.PRKNAME, basis: v.basis},
    patch: Object.fromEntries(facts.map(f => [f.field, f.value])),
    provenance: res.provenance,
    record: {source_url: res.venue.source_url, date_checked: res.venue.date_checked, verified_by: res.venue.verified_by},
    needs_recheck: res.needs_recheck,
    recheck: res.recheck,
  }
  changes.push(...changelogToRows(v.slug, res.changelog))
  table.push({slug: v.slug, name: v.name, courts, union, lines, zip: park.ZIP, address})
}

mkdirSync(join(REPO_ROOT, 'data/verified'), {recursive: true})
writeFileSync(join(REPO_ROOT, 'data/verified/charlotte-nc.json'), JSON.stringify({
  city: 'Charlotte', state: 'NC', retrieved_at: RETRIEVED_AT,
  method_note: 'Mecklenburg County enumerates individual numbered pickleball courts rather than publishing a total, so each count here is the number of distinct court numbers the county names at that park, parsed from the snapshot at run time rather than typed into the script. Every park is required to produce one complete consecutive run of court numbers with no gaps and no number in both the reservable and open-play lists; a venue that fails that check does not publish. Municipality was resolved through the Census rather than taken from the parks layer, because Beatty Park carries a Matthews postcode while the layer labels it Charlotte.',
  sources: [
    {id: 'S1', url: PB_URL, publisher: COUNTY, tier: 1, format: 'html', snapshot: 'data/sources/charlotte-parks/mecknc-courts.txt'},
    {id: 'S2', url: OPENDATA_URL, publisher: 'City of Charlotte Open Data', tier: 2, format: 'geojson', snapshot: 'data/sources/charlotte-parks/charlotte-parks-opendata.json'},
    {id: 'S3', url: CENSUS_URL, publisher: 'US Census Bureau', tier: 1, format: 'json', snapshot: 'data/sources/charlotte-county-census.json'},
  ],
  excluded: [
    {name: 'Latta Park', courts: 6, why: 'Listed by the county under "Hybrid Courts" rather than "Pickleball Courts". The county does not define a hybrid court. Six numbered courts, 1-6.'},
    {name: 'Tuckaseegee Park', courts: 6, why: 'Also listed under "Hybrid Courts", six numbered courts, 1-6. Same reason.'},
  ],
  venues: overlay,
}, null, 2) + '\n')

const changed = changes.filter(r =>
  r.old_value !== null && r.old_value !== undefined && String(r.old_value) !== String(r.new_value))

writeFileSync(join(REPO_ROOT, 'reports', 'charlotte-conflicts.md'), [
  '# Charlotte verification - counts read from enumerated court numbers', '',
  `Run ${RETRIEVED_AT}. ${VENUES.length} venues published, 2 excluded.`, '',
  'Mecklenburg County does not publish a court count. It names individual',
  'numbered courts, split between reservable and open play. The count for each',
  'park is the union of those numbers, and the run refuses to publish a park',
  'whose numbers leave a gap or repeat across the two lists.', '',
  '| venue | courts | numbers | the county\'s own lines |',
  '| --- | --- | --- | --- |',
  ...table.map(t => `| \`${t.slug}\` | ${t.courts} | ${t.union[0]}-${t.union[t.union.length - 1]} | ${t.lines.map(l => `"${l}"`).join('<br>')} |`),
  '',
  `**${table.reduce((n, t) => n + t.courts, 0)} courts across ${table.length} parks.**`, '',
  '## Listed by the county, not published', '',
  '| venue | courts | why not |',
  '| --- | --- | --- |',
  '| Latta Park | 6 | Under "Hybrid Courts", not "Pickleball Courts". The county does not say what a hybrid court is. |',
  '| Tuckaseegee Park | 6 | Same. |',
  '',
  '## Municipality was checked, not assumed', '',
  'Colonel Francis J. Beatty Park carries postcode 28105, a Matthews mailing',
  'ZIP, while the City of Charlotte parks layer labels its CITY as Charlotte.',
  'The Census geocoder places the point inside the incorporated place of',
  'Charlotte, in Mecklenburg County. All five venues resolve the same way.', '',
  changed.length ? '## Values a source changed' : '_No imported row existed for any of these five parks._',
  ...(changed.length ? ['', '| venue | field | was | now | outcome |', '| --- | --- | --- | --- |',
    ...changed.map(r => `| \`${r.venue_slug}\` | ${r.field} | ${JSON.stringify(r.old_value)} | ${JSON.stringify(r.new_value)} | ${r.outcome} |`)] : []),
  '',
].join('\n'))

console.log(`\nCharlotte, NC - ${VENUES.length} venues, retrieved ${RETRIEVED_AT}`)
for (const t of table) {
  console.log(`  ${t.name.padEnd(28)} ${String(t.courts).padStart(2)} courts  (courts ${t.union.join(',')})`)
}
console.log(`\n  ${table.reduce((n, t) => n + t.courts, 0)} courts total. Excluded: Latta Park and Tuckaseegee Park (6 hybrid courts each).`)
console.log('\nWrote data/verified/charlotte-nc.json and reports/charlotte-conflicts.md\n')
