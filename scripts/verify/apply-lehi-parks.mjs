#!/usr/bin/env node
/*
  Lehi, UT verification run - city #33, the second in Utah after St. George
  and the first in Utah County.

  ============================================================
  ONE PAGE, EVERY PARK, ONE SENTENCE EACH
  ============================================================

  Lehi City Parks publishes one page, "Welcome to Lehi City Parks", that
  lists every park in the city under two headings, "RESERVABLE PAVILIONS"
  and "NON-RESERVABLE PARKS". Each entry is the park's name, an "Address:"
  line with the street address, the city, the state and a postcode, and a
  sentence of amenities in which the City counts what it has - "2 pickleball
  courts", "6 pickleball courts", "1 pickleball court". That sentence is the
  count-bearing record for every venue here; four of the six also have a
  park page of their own that repeats the same sentence, and those are
  asserted too. Centennial Park and Stagecoach Large Park have no page of
  their own (the City's URL pattern answers 404 for both), so they rest on
  the list page alone, which is the record that states the number anyway.

      Allred Park             485 N. Allred Park Rd.     2 pickleball courts
      Holbrook Farms Park     2504 N. Drexler Drive      6 pickleball courts
      Olympic Park            2700 W. Parkside Dr.       3 pickleball courts
      Centennial Park         2250 North 600 West        1 pickleball court
      Stagecoach Large Park   484 South 1915 West        2 pickleball courts
      Watercress Park         151 East 1500 South        2 pickleball courts

  Six venues, sixteen courts. Each entry is asserted as a block - the name
  line, then "Address:", then the address line, then the amenity sentence
  within the entry - and each is asserted to sit under the heading the
  City puts it under, so a park moving between lists, a count changing or
  an address being rewritten fails the build.

  ============================================================
  ELEVEN COUNTED, SIX RESOLVED
  ============================================================

  The City states a number at eleven parks. Five of them - Shadow Ridge
  (4), Salix (4), South Creek (1), Spring Creek (3) and Northridge - carry
  addresses that neither the Census address file nor OpenStreetMap
  resolves as the City writes them. Under the Foster Park rule the
  count-bearing address must resolve as written, so those five are refused
  on their addresses and their counts are recorded here so the day one of
  them resolves, the venue is a re-read away rather than a re-discovery.

  Northridge would be refused anyway: its sentence ends "and a pickleball
  court." - an article, not a number. Chandler's ruling is that "This
  single pickleball court" is a count of one and "the pickleball court" is
  a label; "a pickleball court" is on the label side of that line.
  Centennial's "1 pickleball court" is a digit and publishes.

  Four of the six published addresses resolve through OpenStreetMap at
  house-number level rather than through the Census file, which holds no
  record of them or rewrites them. At Allred the Census answers "485
  ALLRED PARK RD" and drops the "N."; at Watercress it answers "151 E 1500
  N" for a street the City writes as 1500 South. Both are the kind of
  change the resolver treats as a different address, and in both cases
  OpenStreetMap finds the address as the operator writes it, which is the
  one published. Utah grid addresses ("484 South 1915 West") are a street
  name that is a number; the resolvers handle them, and the City's
  spelling publishes.

  ============================================================
  WHAT IS STATED, AND WHAT IS NOT
  ============================================================

  play_format  Every reservable-pavilion entry ends "Reservations are for
               pavilion use only. All other amenities are open to the
               public." and the other three sit under "NON-RESERVABLE
               PARKS". A court that cannot be reserved and is open to the
               public is open play, and that is what publishes.

  fee_type     "Open to the public" is not a price. Nothing on the page
               says free, and nothing prices a court. Null at every venue,
               with the City's sentence quoted in the pricing notes.

  indoor/outdoor, lighting, surface, hours
               Not stated for any court. These are park amenity lists;
               they do not say which way the courts face the sky, and
               this run does not guess from the word "park". South Creek's
               "lighting" and Gateway's "park lights" are at refused parks
               and are not lighting claims about a court anyway. All null.

  ============================================================
  THE IMPORT
  ============================================================

  The imported dataset holds five Lehi rows: two commercial clubs, a set
  of courts at a shopping centre, Spring Creek Park (refused here on its
  address) and Watercress Park. Watercress is matched: the import carries
  it at "1500 S Center St" with two courts; the City writes "151 East 1500
  South" and two courts, so the address changes and the count holds. The
  other five venues are minted. The identity registry renames the
  imported watercress-park-lehi-lehi-ut row to watercress-park, and that
  is the slug used here.
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

const CITY = 'Lehi City Parks'
const LIST = 'https://www.lehi-ut.gov/recreation-community/parks/'
const PARK = slug => `https://www.lehi-ut.gov/recreation-community/parks/${slug}/`
const CENSUS_URL = 'https://geocoding.geo.census.gov/geocoder/geographies'

const WELCOME = 'Welcome to Lehi City Parks'
const RESERVABLE = 'RESERVABLE PAVILIONS'
const NON_RESERVABLE = 'NON-RESERVABLE PARKS'
const OPEN = 'Reservations are for pavilion use only. All other amenities are open to the public.'

const VENUES = [
  {
    slug: 'allred-park', importedSlug: null, name: 'Allred Park', geo: 'allred-park', page: 'allred-park',
    section: RESERVABLE, courts: 2,
    address: '485 N. Allred Park Rd.', addressLine: '485 N. Allred Park Rd., Lehi, UT 84043',
    amenities: 'Playground, restrooms, 2 pickleball courts, 2 half basketball courts, soccer fields, and a fire pit.',
    pageAmenities: 'Playground,restrooms, 2 pickleball courts, 2 half basketball courts, soccer fields, and a fire pit.',
    pageAddress: '485 N Allred Park Rd, UT 84043',
    availability:
      'Two pickleball courts at Allred Park in north-east Lehi, counted in the City\'s own amenity sentence on its parks page: "Playground, restrooms, 2 pickleball courts, 2 half basketball courts, soccer fields, and a fire pit." The park\'s pavilion can be reserved; the courts cannot, and the City says so in one sentence that applies to every reservable-pavilion park: "Reservations are for pavilion use only. All other amenities are open to the public." That is open play. The City does not price the courts, does not say whether they are lit, does not name the surface and publishes no hours for them, so each of those is recorded here as unknown.',
  },
  {
    slug: 'holbrook-farms-park', importedSlug: null, name: 'Holbrook Farms Park', geo: 'holbrook-farms-park', page: 'holbrook-farms-park',
    section: RESERVABLE, courts: 6,
    address: '2504 N. Drexler Drive', addressLine: '2504 N. Drexler Drive, Lehi UT 84043',
    amenities: 'Restrooms, playground with swings, 6 pickleball courts, water fountain, walking path(w/benches), small pavilion (non-reservable w/2 tables)',
    pageAmenities: 'Restrooms, playground with swings, 6 pickleball courts, water fountain, walking path(w/benches), small pavilion (non-reservable w/2 tables).',
    pageAddress: '2504 N. Drexler Drive, Lehi UT 84043',
    availability:
      'Six pickleball courts at Holbrook Farms Park in north-west Lehi, the largest set the City counts at any of its parks, in the City\'s own words: "Restrooms, playground with swings, 6 pickleball courts, water fountain, walking path(w/benches), small pavilion (non-reservable w/2 tables)". The park\'s large pavilion, which the City calls a "Food Truck Alley", is reservable; the courts are not - "Reservations are for pavilion use only. All other amenities are open to the public." - so play is open. Whether the courts are lit, what they are surfaced with, what they cost and when they open are not stated anywhere on the City\'s pages, and each is recorded as unknown.',
  },
  {
    slug: 'olympic-park', importedSlug: null, name: 'Olympic Park', geo: 'olympic-park', page: 'olympic-park',
    section: RESERVABLE, courts: 3,
    address: '2700 W. Parkside Dr.', addressLine: '2700 W. Parkside Dr., Lehi, UT 84043',
    amenities: 'Restroom, playground with swings, 3 pickleball courts, fire pit, 3 soccer fields, designated parking, walking path that connects to the Jordan River Trail.',
    pageAmenities: 'Restroom, playground with swings, 3 pickleball courts, fire pit, 3 soccer fields, designated parking, walking path that connects to the Jordan River Trail.',
    pageAddress: '2700 W. Parkside Dr, Lehi, UT 84043',
    availability:
      'Three pickleball courts at Olympic Park on the west side of Lehi, beside the Jordan River Trail, counted by the City: "Restroom, playground with swings, 3 pickleball courts, fire pit, 3 soccer fields, designated parking, walking path that connects to the Jordan River Trail." The pavilion and the soccer fields can be reserved; the courts cannot - "Reservations are for pavilion use only. All other amenities are open to the public." - which is open play. Three is an odd number for a court block and the City does not say how they are laid out. It states no price, no lighting, no surface and no hours for the courts, and this page records each as unknown.',
  },
  {
    slug: 'centennial-park', importedSlug: null, name: 'Centennial Park', geo: 'centennial-park', page: null,
    section: NON_RESERVABLE, courts: 1,
    address: '2250 North 600 West', addressLine: '2250 North 600 West, Lehi UT 84043',
    amenities: '1 Large pavilion with 11 tables, 1 trash can, electrical outlets (120V, 15amp max), pavilion lighting, 2 large BBQ grills, 1 pickleball court, walking path with benches, 2 half basketball courts, playground, and designated parking.',
    availability:
      'One pickleball court at Centennial Park in north Lehi, a digit in the City\'s amenity sentence: "1 Large pavilion with 11 tables, 1 trash can, electrical outlets (120V, 15amp max), pavilion lighting, 2 large BBQ grills, 1 pickleball court, walking path with benches, 2 half basketball courts, playground, and designated parking." The City lists this park under "NON-RESERVABLE PARKS": nothing here can be booked, the court included, so play is open. The "pavilion lighting" in that sentence lights the pavilion, not the court, and this page does not read it as a lit court. Price, surface and hours for the court are not stated and are recorded as unknown. The address is a Utah grid address, 2250 North on 600 West, which the Census address file resolves as written.',
  },
  {
    slug: 'stagecoach-large-park', importedSlug: null, name: 'Stagecoach Large Park', geo: 'stagecoach-large-park', page: null,
    section: NON_RESERVABLE, courts: 2,
    address: '484 South 1915 West', addressLine: '484 South 1915 West, Lehi UT 84043',
    amenities: '1 Small pavilion with 6 tables, a large BBQ grill and a trash can, 2 pickleball courts, 1 full basketball court, playground with swings, 2 soccer goals and benches.',
    availability:
      'Two pickleball courts at Stagecoach Large Park in west Lehi, counted by the City: "1 Small pavilion with 6 tables, a large BBQ grill and a trash can, 2 pickleball courts, 1 full basketball court, playground with swings, 2 soccer goals and benches." The City names two Stagecoach parks, Large and Small, and only the Large one carries courts; the name is the City\'s. It sits under "NON-RESERVABLE PARKS", so the courts cannot be booked and play is open. The address is a Utah grid address, 484 South on 1915 West, which OpenStreetMap resolves to the house number as written. Price, lighting, surface and hours are not stated and are recorded as unknown.',
  },
  {
    slug: 'watercress-park', importedSlug: 'watercress-park-lehi-lehi-ut', name: 'Watercress Park', geo: 'watercress-park', page: 'watercress-park',
    section: NON_RESERVABLE, courts: 2,
    address: '151 East 1500 South', addressLine: '151 East 1500 South, Lehi UT 84043',
    amenities: '1 Large pavilion with 11 tables with 1 trash can, 8 Horseshoe pits, 2 pickleball courts, 1 tennis court, and a large open grass area.',
    pageAmenities: '1 Large pavilion with 11 tables with 1 trash can, 8 Horseshoe pits, 2 pickleball courts, 1 tennis court, and a large open grass area.',
    pageAddress: '151 East 1500 South, Lehi UT 84043',
    availability:
      'Two pickleball courts at Watercress Park in south Lehi, counted by the City beside a tennis court and eight horseshoe pits: "1 Large pavilion with 11 tables with 1 trash can, 8 Horseshoe pits, 2 pickleball courts, 1 tennis court, and a large open grass area." The pickleball courts and the tennis court are counted separately, so the two here are not lines on the tennis court. The park sits under "NON-RESERVABLE PARKS", so the courts cannot be booked and play is open. The address is a Utah grid address, 151 East on 1500 South; the Census file answers with 1500 North, a different street, and OpenStreetMap resolves the address as the City writes it. Price, lighting, surface and hours are not stated and are recorded as unknown.',
  },
]

const EXCLUDED = [
  {
    name: 'Shadow Ridge Park', section: RESERVABLE, addressLine: '3050 W. Traverse Mountain Blvd, Lehi UT 84043',
    amenities: 'Restrooms, playground, 4 pickleball courts, bike rack, and a water fountain.',
    reasons: [
      'Four courts, stated. The address the City writes, "3050 W. Traverse Mountain Blvd", is unresolved by the Census address file and by OpenStreetMap. The count-bearing address must resolve as written (the Foster Park rule), and this one does not.',
    ],
  },
  {
    name: 'Salix Park', section: NON_RESERVABLE, addressLine: '3109 W. Allred Dr., Lehi UT 84043',
    amenities: 'Restroom, 2 playgrounds (east and west), 4 pickleball courts, walking path with benches, parking, and trash cans.',
    reasons: [
      'Four courts, stated. "3109 W. Allred Dr." is unresolved by both resolvers.',
    ],
  },
  {
    name: 'South Creek Park', section: NON_RESERVABLE, addressLine: '1987 West 1450 South, Lehi UT 84043',
    amenities: '1 Small pavilion with 4 tables and a trash can, 1 half basketball court, 1 pickleball court, lighting, and open space.',
    reasons: [
      'One court, stated as a digit. "1987 West 1450 South" is unresolved by both resolvers.',
      'The sentence also says "lighting", which is a park amenity between a court and "open space" and does not say what is lit; had the address resolved, that word would not have published as a lit court.',
    ],
  },
  {
    name: 'Spring Creek Park', section: NON_RESERVABLE, addressLine: '2108 S Bullrush Pkwy, Lehi UT 84043',
    amenities: '1 Small pavilion with 4 tables and a trash can, playground, 3 pickleball courts, 2 half basketball courts, benches, walking path with fitness equipment, and parking.',
    reasons: [
      'Three courts, stated. "2108 S Bullrush Pkwy" is unresolved by both resolvers. The imported dataset carries this park as spring-creek-park-lehi-lehi-ut at "2100 S Bullrush Pkwy" with three courts; that row stays pending, because the City\'s own address is the one that has to resolve, and the import\'s house number is not the City\'s.',
    ],
  },
  {
    name: 'Northridge Park', section: NON_RESERVABLE, addressLine: '2333 W. Northridge Dr, Lehi UT 84043',
    amenities: '1 Small pavilion with 4 tables and a trash can, playground, 1 half basketball court, bike rack, benches, and a pickleball court.',
    reasons: [
      '"a pickleball court" is an article, not a number. Chandler\'s ruling: "This single pickleball court" is a count of one; "the pickleball court" is a label. "a pickleball court" is a label.',
      '"2333 W. Northridge Dr" is unresolved by both resolvers in any case.',
    ],
  },
  {
    name: 'Gateway Park', section: NON_RESERVABLE, addressLine: '1875 North 1400 West, Lehi UT 84043',
    amenities: 'Walking path, playground, pickleball, 2 basketball half courts, restrooms, water fountain, park lights and hose bib.',
    reasons: [
      '"pickleball" with no number. A flag is not a count.',
    ],
  },
  {
    name: 'Eagle Summit Park', section: RESERVABLE, addressLine: '5097 N. Ravencrest Ln., Lehi, UT 84043',
    amenities: 'Restrooms, playgrounds, multiple picnic tables with BBQ grates, a walking path, a baseball backstop, basketball courts, bridges, a swing set, a tennis court, and a water fountain.',
    reasons: [
      'The City\'s sentence for this park names a tennis court and no pickleball at all. It is listed here because a scout named it; the assertion below fails the build if the City ever adds pickleball to the sentence, so the park is re-read rather than missed.',
    ],
  },
]

/* ---------------------------------------------------------------- */

const snapshotPath = name => `data/sources/lehi/${name}.html`

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
  The list page, asserted entry by entry. An entry is the park's name
  line, then "Address:", then the address line, then - within the next few
  lines - the amenity sentence. The entry must sit under the heading the
  City puts it under; the two headings appear once each as section heads
  (they also appear once each in the page's own jump menu, above the first
  entry, which is why the LAST occurrence of each is the section head).
*/
const page = linesOf(snapshotPath('parks'))
if (!page.some(l => squeeze(l) === squeeze(WELCOME))) {
  throw new Error(`The Lehi parks page no longer carries the heading "${WELCOME}".`)
}
const lastIndex = needle => page.map(squeeze).lastIndexOf(squeeze(needle))
const reservableAt = lastIndex(RESERVABLE)
const nonReservableAt = lastIndex(NON_RESERVABLE)
if (reservableAt < 0 || nonReservableAt < 0 || reservableAt > nonReservableAt) {
  throw new Error(`The Lehi parks page no longer has "${RESERVABLE}" followed by "${NON_RESERVABLE}".`)
}
const sectionOf = i => (i > nonReservableAt ? NON_RESERVABLE : i > reservableAt ? RESERVABLE : null)

const findEntry = (who, name, addressLine, amenities) => {
  const starts = page.map((l, i) => (squeeze(l) === squeeze(name) ? i : -1)).filter(i => i >= 0)
  const entryStarts = starts.filter(i => squeeze(page[i + 1] ?? '') === squeeze('Address:'))
  if (entryStarts.length !== 1) {
    throw new Error(`${who}: expected exactly one entry headed "${name}" followed by "Address:" on the Lehi parks page, found ${entryStarts.length}.`)
  }
  const i = entryStarts[0]
  if (squeeze(page[i + 2] ?? '') !== squeeze(addressLine)) {
    throw new Error(`${who}: the address line has changed. Expected "${addressLine}", the page reads "${page[i + 2]}".`)
  }
  const window = page.slice(i + 3, i + 9).map(squeeze)
  if (!window.some(l => l === squeeze(amenities) || l.startsWith(squeeze(amenities)))) {
    throw new Error(`${who}: the amenity sentence has changed. Expected "${amenities}"; the entry now reads: "${page.slice(i + 3, i + 9).join(' | ')}".`)
  }
  return i
}

for (const p of VENUES) {
  const i = findEntry(p.name, p.name, p.addressLine, p.amenities)
  const section = sectionOf(i)
  if (section !== p.section) {
    throw new Error(`${p.name}: expected under "${p.section}", found under "${section}". Re-read the city.`)
  }
  if (p.section === RESERVABLE) {
    const w = page.slice(i + 3, i + 9).map(squeeze)
    if (!w.some(l => l === squeeze(OPEN) || l === squeeze(OPEN.replace(/\.$/, '')))) {
      throw new Error(`${p.name}: the entry no longer carries "${OPEN}".`)
    }
  }
  if (p.page) {
    must(p.page, p.name, p.pageAmenities, 'park-page amenity')
    must(p.page, p.name, p.pageAddress, 'park-page address')
  }
}
for (const e of EXCLUDED) {
  const i = findEntry(e.name, e.name, e.addressLine, e.amenities)
  const section = sectionOf(i)
  if (section !== e.section) {
    throw new Error(`${e.name}: expected under "${e.section}", found under "${section}". Re-read the city.`)
  }
}
/* No published sentence, and no refused-for-the-address sentence, may quietly change its number. */
for (const p of VENUES) {
  const m = p.amenities.match(/(\d+) pickleball courts?/)
  if (!m || Number(m[1]) !== p.courts) throw new Error(`${p.name}: the amenity sentence does not count ${p.courts} pickleball courts.`)
}

const counties = JSON.parse(
  readFileSync(join(REPO_ROOT, 'data/sources/lehi-county-census.json'), 'utf8'))

/* The refused addresses must still be unresolved; the day one resolves, the venue is re-read. */
for (const [slug, name] of [['shadow-ridge-park', 'Shadow Ridge Park'], ['salix-park', 'Salix Park'], ['south-creek-park', 'South Creek Park'], ['spring-creek-park', 'Spring Creek Park'], ['northridge-park', 'Northridge Park']]) {
  if (counties[slug]?.matched) {
    throw new Error(`${name}: its address now resolves (${counties[slug].matched}). It was refused on the address; re-read it and publish or refuse it on the record.`)
  }
}

const identityRegistry = loadIdentity(REPO_ROOT)
const allRows = loadRows().map(r => mapRow(r).venue)
const bySlug = new Map(
  allRows.filter(v => v.city === 'Lehi' && String(v.state).toUpperCase() === 'UT')
    .map(v => [v.slug, v]))

const overlay = {}
const changes = []

for (const p of VENUES) {
  const geo = counties[p.geo]
  if (!geo?.matched) throw new Error(`${p.slug}: no address resolver matched its address`)
  if (!geo.place_matches_city) {
    throw new Error(`${p.slug}: the resolver places this at "${geo.place}", not Lehi.`)
  }
  if (geo.resolver === 'osm' && !/at house-number level/.test(geo.basis)) {
    throw new Error(`${p.slug}: OpenStreetMap resolved this address below house-number level; that is not a resolution this project accepts.`)
  }
  if (p.importedSlug && !bySlug.has(p.importedSlug)) {
    throw new Error(`${p.slug}: imported row ${p.importedSlug} is no longer in data.csv for Lehi, UT.`)
  }

  const doc = new SourceDocument({
    url: LIST, retrieved_at: RETRIEVED_AT, tier: 1, publisher: CITY, format: 'html',
  })
  const docPage = p.page ? new SourceDocument({
    url: PARK(p.page), retrieved_at: RETRIEVED_AT, tier: 1, publisher: CITY, format: 'html',
  }) : null
  const docCensus = new SourceDocument({
    url: CENSUS_URL, retrieved_at: RETRIEVED_AT, tier: 1,
    publisher: geo.resolver === 'osm' ? 'OpenStreetMap (Nominatim)' : 'US Census Bureau', format: 'json',
  })

  const shell = {
    slug: p.slug, name: null, city: 'Lehi', state: 'UT', county: null,
    postal_code: null, street_address: null, latitude: null, longitude: null,
    status: 'pending', source_url: null, date_checked: null, verified_by: null,
    claimed_by_owner: false, claim_date: null,
    rating: null, user_rating: null, review_count: null, claimed_or_verified: null,
    source_sport: 'pickleball',
  }
  for (const f of PUBLISHED_FACT_FIELDS) shell[f] = null
  const imported = p.importedSlug ? bySlug.get(p.importedSlug) : undefined
  const venue = imported ?? shell

  const quoted = `"${p.amenities}"`
  const sectionNote = p.section === RESERVABLE
    ? `The entry sits under "${RESERVABLE}" and ends "${OPEN}"`
    : `The entry sits under "${NON_RESERVABLE}", so nothing in the park, the courts included, can be booked`

  const facts = [
    doc.fact('name', p.name, {
      evidence: `Headed "${p.name}" on the City's parks page` + (p.page ? ` and on the park's own page at ${PARK(p.page)}` : '') + '.',
    }),
    doc.fact('total_courts', p.courts, {
      evidence: `Counted in the City's amenity sentence for the park: ${quoted}.` +
        (p.page ? ` The park's own page repeats it: "${p.pageAmenities}".` : ' The park has no page of its own; the list page is the record that states the number.'),
    }),
    doc.fact('street_address', p.address, {
      evidence: `"Address: ${p.addressLine}" on the City's parks page.` +
        (p.page && squeeze(p.pageAddress) !== squeeze(p.addressLine)
          ? ` The park's own page writes it "${p.pageAddress}" - the same number, street and postcode with punctuation and the city name dropped; the list page's spelling publishes.`
          : '') +
        (geo.resolver === 'osm'
          ? ` ${geo.basis}`
          : ` ${geo.basis} A Utah grid address, which the Census address file resolves as written.`),
    }),
    doc.fact('venue_type', 'public_park', {
      evidence: `Published by ${CITY} among the city's parks.`,
    }),
    doc.fact('play_format', 'open_play', {
      evidence: `${sectionNote}. A court that cannot be reserved and is open to the public is open play.`,
    }),
    doc.fact('pricing_notes',
      p.section === RESERVABLE
        ? 'The City states no price for the courts. Its parks page says of this park: "Reservations are for pavilion use only. All other amenities are open to the public." - open to the public is not a price, and nothing on the page says free.'
        : 'The City states no price for the courts. It lists this park under "NON-RESERVABLE PARKS": the courts cannot be booked, and nothing on the page prices them or says they are free.', {
        evidence: `${sectionNote}. No fee or price appears anywhere on the parks page.`,
      }),
    doc.fact('court_availability', p.availability, {
      evidence: `From the City's parks page: ${quoted}, under "${p.section}".` + (p.section === RESERVABLE ? ` "${OPEN}"` : ''),
    }),
    docCensus.fact('county', geo.county, {
      evidence: `${geo.county} County, UT${geo.county_fips ? ` (FIPS ${geo.state_fips}${geo.county_fips})` : ''}. ${geo.basis} The resolver also places it in "${geo.place}", which is what allows it to be published under Lehi.`,
    }),
    docCensus.fact('postal_code', geo.postal_code, {evidence: geo.basis}),
  ]

  const res = applyFacts(venue, facts)

  overlay[p.slug] = {
    minted: !imported,
    identity: {
      name: p.name, city: 'Lehi', state: 'UT',
      county: geo.county, postal_code: geo.postal_code ?? null,
      latitude: geo.lat ?? null, longitude: geo.lon ?? null,
      imported_slug: p.importedSlug ?? null,
      canonical_slug: identityRegistry.renames[p.importedSlug]?.canonical ?? p.slug,
    },
    match: {
      source_page: LIST, quote: p.amenities,
      basis: imported
        ? `Matched to the imported ${p.importedSlug} row in Lehi, UT (renamed ${identityRegistry.renames[p.importedSlug]?.canonical ?? p.slug} by the identity registry), which carried the address "1500 S Center St" and two courts; the City's own address, 151 East 1500 South, replaces it, the count holds, and the changes are in the changelog.`
        : 'Minted here. The imported dataset holds no row for this park in Lehi, UT.',
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
  'Lehi City Parks lists every park in the city on one page, each with an "Address:" line and an amenity sentence in which the City counts its courts - "2 pickleball courts", "6 pickleball courts", "1 pickleball court". Each published entry is asserted as a block (name, "Address:", address line, amenity sentence) under the heading the City puts it under, and four of the six venues also have a park page of their own that repeats the sentence and is asserted too. Six venues publish, sixteen courts. The City states a number at eleven parks; five of them - Shadow Ridge, Salix, South Creek, Spring Creek and Northridge - write addresses that neither the Census address file nor OpenStreetMap resolves as written, and they are refused on their addresses under the Foster Park rule; Northridge\'s "a pickleball court" is also a label rather than a number. Four of the six published addresses resolve through OpenStreetMap at house-number level because the Census file has no record of them or rewrites their direction. Play is open at every venue: the reservable-pavilion entries say "Reservations are for pavilion use only. All other amenities are open to the public." and the others sit under "NON-RESERVABLE PARKS". Nothing is priced and nothing is called free, so fee stays null with the City\'s sentence quoted; indoor or outdoor, lighting, surface and hours are not stated for any court and are null. One imported row is matched (Watercress Park, whose import address the City\'s replaces); the other five venues are minted.'

mkdirSync(join(REPO_ROOT, 'data/verified'), {recursive: true})
writeFileSync(join(REPO_ROOT, 'data/verified/lehi-ut.json'), JSON.stringify({
  city: 'Lehi', state: 'UT', retrieved_at: RETRIEVED_AT,
  method_note: METHOD_NOTE,
  sources: [
    {url: LIST, publisher: CITY, tier: 1, format: 'html', snapshot: snapshotPath('parks')},
    ...VENUES.filter(p => p.page).map(p => ({url: PARK(p.page), publisher: CITY, tier: 1, format: 'html', snapshot: snapshotPath(p.page)})),
    {url: CENSUS_URL, publisher: 'US Census Bureau', tier: 1, format: 'json', snapshot: 'data/sources/lehi-county-census.json'},
  ].map((s, i) => ({id: `S${i + 1}`, ...s})),
  totals: {
    venues: VENUES.length, courts: totalCourts,
    outdoor: null, indoor: null,
    lit_courts: null, free_venues: 0,
  },
  excluded: EXCLUDED.map(e => ({name: e.name, why: e.reasons})),
  venues: overlay,
}, null, 2) + '\n')

const changed = changes.filter(r =>
  r.old_value !== null && r.old_value !== undefined && String(r.old_value) !== String(r.new_value))

writeFileSync(join(REPO_ROOT, 'reports', 'lehi-conflicts.md'), [
  '# Lehi verification - one page, every park, one counted sentence each', '',
  `Run ${RETRIEVED_AT}. ${VENUES.length} venues published, ${totalCourts} courts. ${EXCLUDED.length} parks refused or set aside.`, '',
  'Lehi is the second city in Utah on this site and the first in Utah County. Every count and address comes from',
  `the City's parks page, "${WELCOME}", where each park has an "Address:" line and an amenity sentence.`, '',
  '| venue | courts | section | what the City writes |',
  '| --- | ---: | --- | --- |',
  ...VENUES.map(p => `| \`${p.slug}\` | ${p.courts} | ${p.section} | "${p.amenities}" |`),
  '',
  '## Eleven counted, six resolved', '',
  'The City counts courts at eleven parks. Five write addresses that neither resolver finds as written, and are',
  'refused on the address (the Foster Park rule). Four of the six that publish resolve through OpenStreetMap at',
  'house-number level: the Census file has no record of Holbrook Farms or Stagecoach Large, drops the "N." from',
  'Allred Park Rd., and answers "1500 N" for Watercress\'s 1500 South. In each case OpenStreetMap finds the address',
  'as the City writes it, and that is the one published.',
  '',
  '## Refused', '',
  ...EXCLUDED.flatMap(e => [
    `**${e.name}** - "${e.amenities}" (${e.addressLine})`, '',
    ...e.reasons.map((r, i) => `${i + 1}. ${r}`), '']),
  '## What Lehi does not say', '',
  '- **price.** "All other amenities are open to the public." is not a price, and nothing says free. Null everywhere.',
  '- **lighting.** "pavilion lighting" at Centennial lights the pavilion; "lighting" at South Creek and "park lights" at Gateway are at refused parks and name no court. Null.',
  '- **surface.**',
  '- **indoor or outdoor.** Amenity lists do not say, and the word "park" is not a statement. Null.',
  '- **hours.** None published for courts.',
  '',
  changed.length ? '## Values a source changed' : '_No imported row was overwritten._',
  ...(changed.length ? [
    '', '| venue | field | was | now | outcome |', '| --- | --- | --- | --- | --- |',
    ...changed.map(r => `| \`${r.venue_slug}\` | ${r.field} | ${JSON.stringify(r.old_value)} | ${JSON.stringify(r.new_value)} | ${r.outcome} |`),
  ] : []),
  '',
].join('\n'))

console.log(`\nLehi, UT - ${VENUES.length} venues, ${totalCourts} courts, retrieved ${RETRIEVED_AT}`)
for (const p of VENUES) {
  const o = overlay[p.slug]
  console.log(
    `  ${o.patch.name.padEnd(26)} ${String(o.patch.total_courts).padStart(2)} | ${p.section.padEnd(20)} | ${o.patch.county} County | ${counties[p.geo].postal_code} | via ${counties[p.geo].resolver}`)
}
console.log(`\n  refused: ${EXCLUDED.map(e => e.name).join(', ')}`)
console.log('\nWrote data/verified/lehi-ut.json and reports/lehi-conflicts.md\n')
