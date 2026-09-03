#!/usr/bin/env node
/*
  Apex, NC verification run — city #4, and the third town in Wake County.

  ============================================================
  WHY APEX
  ============================================================

  Same rule as Raleigh and Cary: the operator states the count. Apex states
  it twice, which no other town in this directory has done.

  The town publishes an actual table — facility, indoor or outdoor, lights,
  number of courts — on its pickleball page. Then each park's own page
  repeats its own count independently, in a features list:

    Apex Community Park   table: 3   park page: "3 lighted pickleball courts"
    Pleasant Park         table: 6   park page: "6 Pickleball courts"
    Kelly Road Park       table: 4   park page: "4 junior tennis / pickleball courts"
    Seymour Athletic F.   table: 4   park page: "Lighted pickleball courts" (no number)

  Three of the four are corroborated by the same publisher in two places,
  and the fourth has its count in one place and its lighting in the other.
  This run asserts every one of those sentences is still present before it
  publishes the number inside it.

  ============================================================
  THE SNAPSHOTS ARE PAGE TEXT, AND THE BLOCK IS WORSE THAN CARY'S
  ============================================================

  carync.gov returns 403 to scripted fetches. apexnc.org does not answer them
  at all — curl exits 28 with no status line, with or without a full browser
  header set, and gis.apexnc.org does the same. The pages are public and load
  normally in a browser, so they were read in one and the text is committed
  under data/sources/apex-parks/ with URL and retrieval date on each file.
  See the README there.

  ============================================================
  THE COUNTY TOOK FOUR SOURCES, AND THAT WAS NOT OVERKILL
  ============================================================

  "Apex is in Wake County" is the kind of thing everyone knows and nobody
  should publish unchecked. It is not reliably true:

    - The Census address geocoder matched only two of the five addresses;
      park addresses are frequently absent from its address ranges.
    - The ZCTA-to-county file already in data/reference/ shows that BOTH Apex
      postcodes, 27502 and 27523, straddle two counties — Wake and Chatham.
      So a postcode cannot decide this.
    - A TIGERweb intersect of the Apex town polygon against Census county
      boundaries returns TWO counties: Wake and Chatham. So the town itself
      genuinely spans a county line, exactly as Raleigh does with Durham,
      and "an Apex address is a Wake address" is false in general.

  So each venue was resolved individually. Wake County's own GIS Address
  Points layer holds all five addresses with coordinates — being in a
  county's address file is itself evidence of being in that county — and each
  of those points was then put through the Census geocoder, which returns
  Wake County for all five. Recorded in data/sources/apex-county-census.json.

  ============================================================
  WHAT IS NOT PUBLISHED
  ============================================================

  APEX ELEMENTARY SCHOOL. The town's table lists four lighted outdoor courts
  there, "available only on weekends and after 6 pm on school days". It is
  not a town facility — it is a Wake County public school — the town
  publishes no address for it, and the commercial import disagrees with the
  town about the count (3 against 4). Any one of those would be enough.

  ============================================================
  WHAT THIS SET DOES NOT CLAIM
  ============================================================

  indoor at the parks  Left null, not 0. The table lists these four as
                       Outdoor, which says what their pickleball is, not that
                       the site has no indoor court anywhere. Pleasant Park
                       has a field house.
  outdoor at the JMBCC The table lists that facility's pickleball as Indoor
                       and lists it once, so 0 outdoor there is the town's
                       own inventory rather than an inference.
  surface, nets, fees  No Apex page states any of them for these venues.
  hours at the JMBCC   The building's opening hours are published, but
                       pickleball there runs "during designated open gym
                       hours" for ages 55+, which is not the same thing.
                       Publishing building hours as court hours would tell a
                       reader they can play at times they cannot.
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

const TOWN = 'Town of Apex, Parks, Recreation & Cultural Resources'
const PB_URL = 'https://www.apexnc.org/1877/Pickleball'
const CENSUS_URL = 'https://geocoding.geo.census.gov/geocoder/geographies'
const WAKE_GIS = 'https://maps.wake.gov/arcgis/rest/services/Property/Addresses/MapServer/0'

const VENUES = [
  {
    slug: 'pleasant-park', name: 'Pleasant Park',
    url: 'https://www.apexnc.org/1163/Pleasant-Park',
    address: '3400 Pleasant Plains Rd', courts: 6, indoor: false, light: false,
    tableRow: 'Pleasant Park | Outdoor | No | 6 (open sunrise to 30 minutes after sunset)',
    parkQuote: '6 Pickleball courts',
    hours: 'Sunrise to 30 minutes after Sunset',
    hoursQuote: 'Basketball and Pickleball Court Hours: Sunrise to 30 minutes after Sunset',
    restroomQuote: 'Restroom facilities',
    basis: 'No imported row. Apex\'s newest and largest pickleball site, and the only unlit one.',
  },
  {
    slug: 'kelly-road-park', name: 'Kelly Road Park', match: 'kelly-road-park-apex-nc',
    url: 'https://www.apexnc.org/799/Kelly-Road-Park',
    address: '1609 Kelly Road', courts: 4, indoor: false, light: true,
    tableRow: 'Kelly Road Park | Outdoor | Yes | 4 (also used for Junior Tennis)',
    parkQuote: '4 junior tennis / pickleball courts',
    hours: '6:30 am - 10 pm (year round)',
    hoursQuote: 'Hours of Operation: 6:30 am - 10 pm (year round)',
    restroomQuote: 'Restroom facilities',
    basis: 'Matched to the imported "Kelly Road Park" row at 4 courts, which agrees with the town. NOTE: the import also holds a second row, "Apex Kelly Rd Park" (apex-kelly-rd-park), for the same park with the same count. That duplicate is left pending — two rows for one park is an identity problem for the import to resolve, not something to fix by publishing one of them and hoping.',
  },
  {
    slug: 'seymour-athletic-fields', name: 'Seymour Athletic Fields', match: 'apex-seymour-athletic-fields-apex-nc',
    fullName: 'Seymour Athletic Fields at Apex Nature Park',
    url: 'https://www.apexnc.org/800/Apex-Nature-Park-Seymour-Athletic-Fields',
    address: '2500 Evans Road', courts: 4, indoor: false, light: true,
    tableRow: 'Seymour Athletic Fields at Apex Nature Park | Outdoor | Yes | 4 (also used for Junior Tennis)',
    parkQuote: 'Lighted pickleball courts',
    hours: '6:30 am - 10:00 pm',
    hoursQuote: '*fields/courts/restrooms open at 6:30 am',
    restroomQuote: 'Restroom facility',
    basis: 'Matched to the imported "Apex Seymour Athletic fields" row at 4 courts, which agrees with the town. The park\'s own page confirms lighted pickleball courts but gives no number, so the count comes from the town\'s table.',
  },
  {
    slug: 'apex-community-park', name: 'Apex Community Park',
    url: 'https://www.apexnc.org/795/Apex-Community-Park',
    address: '2200 Laura Duncan Road', courts: 3, indoor: false, light: true,
    tableRow: 'Apex Community Park | Outdoor | Yes | 3',
    parkQuote: '3 lighted pickleball courts',
    hours: '6:30 am - 10:00 pm (year round)',
    hoursQuote: 'Hours of Operation: 6:30 am - 10:00 pm (year round)',
    restroomQuote: 'Restroom facilities',
    basis: 'No imported row for the park. A 160-acre park whose page states the count and the lighting in one line.',
  },
  {
    slug: 'john-m-brown-community-center', name: 'John M. Brown Community Center', match: 'apex-community-center',
    url: 'https://www.apexnc.org/514/Facilities-and-Rentals',
    address: '53 Hunter Street', courts: 4, indoor: true, light: true,
    tableRow: 'John M. Brown Community Center | Indoor | Yes | 4 (available only for ages 55+, during designated open gym hours)',
    parkQuote: 'located on the Town Hall Campus at 53 Hunter Street',
    basis: 'Matched to the imported "Apex Community Center" row at 4 courts. The town states this facility was "formerly known as Apex Community Center", which is what ties the two records together, and the counts agree. This is the first venue in the directory with VERIFIED INDOOR courts.',
  },
]

/* ---------------------------------------------------------------- */

const pickleballPage = readFileSync(join(REPO_ROOT, 'data/sources/apex-parks/pickleball.txt'), 'utf8')
const parksPage = readFileSync(join(REPO_ROOT, 'data/sources/apex-parks/parks.txt'), 'utf8')
const counties = JSON.parse(readFileSync(join(REPO_ROOT, 'data/sources/apex-county-census.json'), 'utf8'))

const identityRegistry = loadIdentity(REPO_ROOT)
const allRows = loadRows().map(r => mapRow(r).venue)
/* Scoped to this town: slugs repeat across cities. */
const bySlug = new Map(
  allRows.filter(v => v.city === 'Apex' && String(v.state).toUpperCase() === 'NC')
    .map(v => [v.slug, v]))

const overlay = {}
const changes = []

const must = (hay, needle, what, slug) => {
  if (!hay.includes(needle)) {
    throw new Error(`${slug}: the snapshot no longer contains the ${what} text "${needle}". Re-read the page before trusting this run.`)
  }
}

for (const v of VENUES) {
  const county = counties[v.slug]
  if (!county) throw new Error(`No county lookup for ${v.slug}`)

  must(pickleballPage, v.tableRow, 'court table row', v.slug)
  must(parksPage, v.address, 'address', v.slug)
  must(parksPage, v.parkQuote, 'park page', v.slug)
  if (v.hoursQuote) must(parksPage, v.hoursQuote, 'hours', v.slug)
  if (v.restroomQuote) must(parksPage, v.restroomQuote, 'restroom', v.slug)

  const table = new SourceDocument({url: PB_URL, retrieved_at: RETRIEVED_AT, tier: 1, publisher: TOWN, format: 'html'})
  const page = new SourceDocument({url: v.url, retrieved_at: RETRIEVED_AT, tier: 1, publisher: TOWN, format: 'html'})
  const census = new SourceDocument({url: CENSUS_URL, retrieved_at: RETRIEVED_AT, tier: 1, publisher: 'US Census Bureau', format: 'json'})

  const shell = {
    slug: v.slug, name: null, city: 'Apex', state: 'NC', county: null,
    postal_code: null, street_address: null, latitude: null, longitude: null,
    status: 'pending', source_url: null, date_checked: null, verified_by: null,
    claimed_by_owner: false, claim_date: null,
    rating: null, user_rating: null, review_count: null, claimed_or_verified: null,
    source_sport: 'pickleball',
  }
  for (const f of PUBLISHED_FACT_FIELDS) shell[f] = null
  const base = (v.match && bySlug.get(v.match)) || shell
  if (v.match && !bySlug.has(v.match)) throw new Error(`No imported row with slug ${v.match}`)

  const facts = [
    page.fact('name', v.name, {
      evidence: v.fullName
        ? `The town's pickleball table names this venue "${v.fullName}"; the park's own page heads the section "Seymour Athletic fields". The shorter form is published because the full one overruns the 65-character page-title limit, and the full name is on the venue page.`
        : `The facility's own page on apexnc.org is titled "${v.name}".`,
    }),
    table.fact('total_courts', v.courts, {
      evidence: `Town of Apex pickleball court table, row: "${v.tableRow}".` +
        (v.parkQuote && /\d/.test(v.parkQuote)
          ? ` Corroborated on the venue's own page, which states "${v.parkQuote}".`
          : ` The venue's own page confirms the courts exist ("${v.parkQuote}") without giving a number.`),
    }),
    page.fact('street_address', v.address, {
      evidence: `The address published on the facility's own page: "${v.address}". Wake County GIS Address Points holds the same address at ${county.lat},${county.lon}.`,
    }),
    table.fact('venue_type', v.indoor ? 'community_center' : 'public_park', {
      evidence: v.indoor
        ? `Listed by the ${TOWN} among its rentable community facilities, on the Town Hall Campus.`
        : `Listed by the ${TOWN} among its public parks.`,
    }),
    table.fact('light', v.light, {
      evidence: `Town of Apex pickleball court table, Lights column reads "${v.light ? 'Yes' : 'No'}" for this venue: "${v.tableRow}".`,
    }),
    census.fact('county', county.county, {evidence: county.basis}),
  ]

  /*
    Indoor and outdoor. The town's table has an explicit Indoor/Outdoor
    column, which is the only reason either of these is written at all.
    A 0 is only ever recorded on the side the table names — see the header.
  */
  if (v.indoor) {
    facts.push(table.fact('indoor_courts', v.courts, {
      evidence: `The table's Indoor / Outdoor column reads "Indoor" for this facility: "${v.tableRow}".`,
    }))
    facts.push(table.fact('outdoor_courts', 0, {
      evidence: `The town lists this facility once, as Indoor. Its pickleball is indoors, so it has no outdoor pickleball courts.`,
    }))
  } else {
    facts.push(table.fact('outdoor_courts', v.courts, {
      evidence: `The table's Indoor / Outdoor column reads "Outdoor" for this venue: "${v.tableRow}". indoor_courts is left unverified rather than set to zero.`,
    }))
  }

  if (v.hours) {
    facts.push(page.fact('hours_of_operation', v.hours, {
      evidence: `Published on the venue's own page: "${v.hoursQuote}".`,
    }))
  }
  if (v.restroomQuote) {
    facts.push(page.fact('restroom', true, {
      evidence: `The venue's own features list includes "${v.restroomQuote}".`,
    }))
  }

  const res = applyFacts(base, facts)
  const key = v.match ?? v.slug

  overlay[key] = {
    minted: !v.match,
    identity: {
      name: v.name,
      city: 'Apex',
      state: 'NC',
      county: county.county,
      postal_code: null,
      latitude: county.lat,
      longitude: county.lon,
      imported_slug: v.match ?? null,
      canonical_slug: v.match ? (identityRegistry.renames[v.match]?.canonical ?? v.match) : v.slug,
    },
    match: {table_row: v.tableRow, page: v.url, basis: v.basis},
    patch: Object.fromEntries(facts.map(f => [f.field, f.value])),
    provenance: res.provenance,
    record: {source_url: res.venue.source_url, date_checked: res.venue.date_checked, verified_by: res.venue.verified_by},
    needs_recheck: res.needs_recheck,
    recheck: res.recheck,
  }
  changes.push(...changelogToRows(key, res.changelog))
}

mkdirSync(join(REPO_ROOT, 'data/verified'), {recursive: true})
writeFileSync(join(REPO_ROOT, 'data/verified/apex-nc.json'), JSON.stringify({
  city: 'Apex', state: 'NC', retrieved_at: RETRIEVED_AT,
  method_note: 'Court counts are STATED by the Town of Apex in a published table, and three of the five are stated a second time on the venue\'s own page. This run asserts every quoted sentence is still present in the snapshot before publishing the number inside it. County is resolved per venue and not from the town name: a TIGERweb intersect shows the town of Apex spans Wake and Chatham counties, and both Apex postcodes straddle the same line, so each address was located in Wake County GIS Address Points and each point put through the Census geocoder.',
  sources: [
    {id: 'S1', url: PB_URL, publisher: TOWN, tier: 1, format: 'html', snapshot: 'data/sources/apex-parks/pickleball.txt'},
    {id: 'S2', url: 'https://www.apexnc.org/710/Parks', publisher: TOWN, tier: 1, format: 'html', snapshot: 'data/sources/apex-parks/parks.txt'},
    {id: 'S3', url: WAKE_GIS, publisher: 'Wake County Government, GIS', tier: 2, format: 'arcgis', snapshot: 'data/sources/apex-county-census.json'},
    {id: 'S4', url: CENSUS_URL, publisher: 'US Census Bureau', tier: 1, format: 'json', snapshot: 'data/sources/apex-county-census.json'},
  ],
  excluded: [
    {name: 'Apex Elementary School', courts: 4, why: 'Four lighted outdoor courts per the town\'s table, "available only on weekends and after 6 pm on school days". Not a town facility but a Wake County public school; the town publishes no address for it; and the commercial import says 3 courts against the town\'s 4.'},
  ],
  venues: overlay,
}, null, 2) + '\n')

const changed = changes.filter(r =>
  r.old_value !== null && r.old_value !== undefined && String(r.old_value) !== String(r.new_value))

writeFileSync(join(REPO_ROOT, 'reports', 'apex-conflicts.md'), [
  '# Apex verification - what the town states', '',
  `Run ${RETRIEVED_AT}. ${VENUES.length} venues published, 1 excluded.`, '',
  'The Town of Apex publishes a court table AND repeats most counts on each',
  'venue\'s own page, so most of this set is corroborated twice by the same',
  'publisher. Every quoted sentence is asserted present before the number in',
  'it is published.', '',
  '| venue | courts | in/out | lights | town\'s table row |',
  '| --- | --- | --- | --- | --- |',
  ...VENUES.map(v => `| \`${v.slug}\` | ${v.courts} | ${v.indoor ? 'indoor' : 'outdoor'} | ${v.light ? 'yes' : 'no'} | "${v.tableRow}" |`),
  '',
  '## Stated, but not published', '',
  '| venue | courts | why not |',
  '| --- | --- | --- |',
  '| Apex Elementary School | 4 | Not a town facility, no published address, and the import disagrees (3 v 4). |',
  '',
  '## The county needed four sources', '',
  'The town of Apex spans Wake AND Chatham counties (TIGERweb intersect of the',
  'Apex town polygon against Census county boundaries), and both Apex',
  'postcodes straddle the same line, so neither the town name nor the postcode',
  'settles it. Each address was located in Wake County GIS Address Points and',
  'each resulting point put through the Census geocoder. All five: Wake.', '',
  changed.length ? '## Values a source changed' : '_No imported value was contradicted: where the import held a row, it agreed with the town._',
  ...(changed.length ? [
    '', '| venue | field | was | now | outcome |', '| --- | --- | --- | --- | --- |',
    ...changed.map(r => `| \`${r.venue_slug}\` | ${r.field} | ${JSON.stringify(r.old_value)} | ${JSON.stringify(r.new_value)} | ${r.outcome} |`),
  ] : []),
  '',
].join('\n'))

console.log(`\nApex, NC - ${VENUES.length} venues, retrieved ${RETRIEVED_AT}`)
for (const v of VENUES) {
  const o = overlay[v.match ?? v.slug]
  console.log(
    `  ${o.patch.name.padEnd(31)} ${String(o.patch.total_courts).padStart(2)} courts` +
    ` | ${v.indoor ? 'INDOOR ' : 'outdoor'} | lights ${String(o.patch.light).padEnd(5)}` +
    ` | ${o.patch.county} County`)
}
console.log(`\n${changed.length} imported values changed. Excluded: Apex Elementary School (4).`)
console.log('Wrote data/verified/apex-nc.json and reports/apex-conflicts.md\n')
