#!/usr/bin/env node
/*
  Tallahassee, FL verification run - city #21, Florida's third city after
  Cape Coral and Tampa, and the first in Leon County.

  ============================================================
  ONE CITY PAGE THAT STATES THE COUNT, THE PRICE AND THE RULES
  ============================================================

  The City's pickleball page carries an "Outdoor Pickleball Courts &
  Schedules" section that gives, per venue, a street address, a count line
  in the City's own words and a weekly schedule of Open Play, Reserved Play
  and First-Come First-Play:

      Four Oaks Park        "6 courts - Specific courts are identified in
                             parentheses" / "used for pickleball only"
      LeVerne Payne CC      "2 courts with adjustable net straps, 4 courts
                             with portable nets if needed and all have
                             painted lines"
      Tom Brown Park        "4 pickleball courts | 8 pickleball courts on
                             multi-purpose courts (tennis courts 1-4)"
      Winthrop Park         "6 courts"
      Jack L. McLean Jr. CC "2 courts with adjustable net straps and
                             painted lines"
      Jake Gaither CC       "1 indoor court, 2 outdoor courts"
      Lafayette Park        "2 courts with net tie-downs - paddles and
                             balls available inside the Sue McCollum
                             Community Center only during regular office
                             hours"
      Walker-Ford CC        "3 courts - night play is available"

  Beneath the schedules the City defines its three modes of play and prices
  two of them: Open Play "sessions do not require a fee" and "all Open Play
  sessions are drop-in and free"; Reserved Play "sessions require a fee
  payment" - Singles $5.75, Singles Senior $4.75, Doubles $4.25, Doubles
  Senior $3.50; First-Come First-Play "just means that the court is open
  and people can play any way they would like", with a 90-minute limit when
  others are waiting. Every outdoor court is FCFP "except during the times
  noted below".

  ============================================================
  HOW THE PRICE IS READ, VENUE BY VENUE
  ============================================================

  "Free" is published only where the City schedules Open Play at the venue,
  because that is the mode the City prices at nothing. LeVerne Payne and
  Tom Brown carry Open Play sessions and publish fee_type = free, with the
  Reserved Play fees in pricing_notes. Winthrop's schedule is Reserved Play
  and FCFP only; McLean, Lafayette and Walker-Ford are "No Open or Reserved
  Play - FCFP Only"; Jake Gaither's outdoor courts are FCFP. The City puts
  no price on FCFP, so those venues carry no fee answer - a court that is
  open and unpriced is not the same as a court the City calls free.

  ============================================================
  TWO FIGURES ON ONE LINE, TWICE
  ============================================================

  LeVerne Payne: "2 courts with adjustable net straps, 4 courts with
  portable nets if needed" - six, both figures the City's. Tom Brown: "4
  pickleball courts | 8 pickleball courts on multi-purpose courts" - twelve,
  four of them standalone and eight lined onto tennis courts 1-4. Both are
  the Jim Jeffers / Densmore arithmetic: the sum of two numbers the operator
  wrote on one line, printed so a reader can check it.

  ============================================================
  "NIGHT PLAY IS AVAILABLE" IS PUBLISHED AS LIGHTING
  ============================================================

  Walker-Ford's line is "3 courts - night play is available". The City does
  not write "lighted"; it writes that the courts can be played at night,
  which on an outdoor court means lights. It is published as light = true
  with that exact phrase as the evidence, and the evidence says the word
  the City used. Four Oaks's schedule runs to 10:00pm, which implies the
  same thing, but Four Oaks does not publish (below) and an implication is
  not a statement.

  ============================================================
  WHAT IS REFUSED
  ============================================================

  Four Oaks Park       Six dedicated courts - "used for pickleball only" -
                       the flagship of the City's programme, and "5151 Four
                       Oaks Boulevard" is found by neither resolver. Import
                       Gate I1. The most expensive refusal in the city, and
                       the run throws the day it resolves.

  The indoor centres  Lawrence-Gregory at Dade Street, Lincoln Neighborhood
                       Center ("renovations in progress"), Sue Herndon
                       McCollum and the Tallahassee Senior Center ("$3
                       Donation Encouraged") are listed with addresses and
                       weekly schedules and never a count. The indoor sides
                       of McLean, Walker-Ford and Jake Gaither are the same
                       page's indoor list; only Jake Gaither's line states
                       an indoor number ("1 indoor court"), and that one
                       publishes as part of its venue.

  ============================================================
  IDENTITY: TOM BROWN PARK IS TWO IMPORTED ROWS
  ============================================================

  data.csv holds "tom-brown-park" (501 EASTERWOOD DR) and
  "tom-brown-park-pickleball-courts" ("Easterwood Dr & Access Rd 16", an
  intersection). The identity pass canonicalises both to tom-brown-park and
  holds both. The City publishes one Tom Brown Park at 501 Easterwood
  Avenue with twelve courts; the second row is the same courts with a worse
  address. That needs a resolution in data/identity/resolutions.json
  (Hillaire Park's shape) before the venue can promote - Import Gate I1
  refuses a quarantined identity. This run publishes the overlay against
  the imported tom-brown-park row and says so.

  ============================================================
  ONE ADDRESS THE CITY WRITES TWO WAYS
  ============================================================

  Lafayette Park's line gives "501 Ingleside Drive"; the same page and the
  Sue McCollum Community Center's own page give the centre, which shares
  the site, as "501 Ingleside Avenue". The Census resolves the address as
  AVE and OpenStreetMap has no Ingleside Drive at that number. Same house
  number, same site, one street under one name; the count-bearing line's
  address is published as written, the resolver's Avenue is stated, and
  both City spellings are asserted.

  ============================================================
  A CLOSURE PUBLISHED AS THE CITY PRINTS IT
  ============================================================

  Jack L. McLean Jr.: "Due to scheduled resurfacing, both the outdoor
  tennis and pickleball courts at jack mclean will be unavailable for  use
  until december 5, 2025." This run was made on 2026-09-07 and the notice
  is still on the page. It is published as printed, with the date, and
  asserted - Port Tampa's precedent - so a stale closure cannot outlive the
  City's own notice without the build saying so.

  ============================================================
  WHAT IS NOT CLAIMED
  ============================================================

  surface      Not stated anywhere.
  lighting     Only Walker-Ford. Four Oaks's 10pm schedule is not a
               statement about lights and Four Oaks does not publish.
  hours        Only Jake Gaither states hours ("Outdoor FCFP: 8:00am -
               9:00pm Daily, Closed on Sunday", printed as the City has
               it). The schedules are session times and sit in
               court_availability.
  postcodes    The City prints none; the resolver's publish.
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

const CITY = 'City of Tallahassee Parks, Recreation and Neighborhood Affairs'
const PAGE = 'https://www.talgov.com/parks/sports-pickleball'
const CENTRES = 'https://www.talgov.com/parks/centers-'
const CENSUS_URL = 'https://geocoding.geo.census.gov/geocoder/geographies'

const OUTDOOR_HEADING = 'Outdoor Pickleball Courts & Schedules'
const FCFP_RULE = 'All Outdoor Courts are First-Come First-Play except during the times noted below'
const OPEN_PLAY_DEF = 'is a Drop-In session in which players simply drop-in, without advanced reservations, to play other drop-in players. These sessions do not require a fee.'
const OPEN_PLAY_FREE = 'Court reservations can only be made for Reserved Play sessions, as all Open Play sessions are drop-in and free.'
const RESERVED_DEF = 'is a court reservation that must be scheduled for a specific time and can be used for both casual and competitive play. All Reserved Play sessions require a fee payment.'
const FEES = 'Court Reservations and Fees Singles - $5.75 Singles Senior* - $4.75 Doubles - $4.25 Doubles Senior* - $3.50'
const SENIOR = 'To qualify for the senior rate, you must be at least 62 years of age'
const FCFP_DEF = 'just means that the court is open and people can play any way they would like. If other players are waiting to use the court, there is a 90 minute court time limit.'
const RESERVE_ONLINE = 'for Four Oaks Park, Tom Brown Park or Winthrop Park - or make a phone reservation by calling 850-891-4940'
const INDOOR_NO_FCFP = 'Indoor courts do not have First-Come First-Play available'
const RESERVED_FEES_NOTE = 'Reserved Play sessions require a fee: Singles $5.75, Singles Senior $4.75, Doubles $4.25, Doubles Senior $3.50 (senior rate from age 62).'

const FCFP_ONLY = 'No Open or Reserved Play - FCFP Only'
const MCLEAN_CLOSURE = 'Due to scheduled resurfacing, both the outdoor tennis and pickleball courts at jack mclean will be unavailable for  use until december 5, 2025.'

const VENUES = [
  {
    slug: 'leverne-payne-community-center', importedSlug: null, pendingRow: 'leverne-payne-community-center-outdoor-courts',
    name: 'LeVerne Payne Community Center', type: 'community_center',
    address: '450 West 4th Avenue', addressLine: '450 West 4th Avenue | 850-891-3930',
    spec: '2 courts with adjustable net straps, 4 courts with portable nets if needed and all have painted lines',
    courts: 6, outdoor: 6, indoor: null, nets: true, openPlay: true, fcfpOnly: false, light: null,
    availability: 'Six outdoor pickleball courts, and the six is the City\'s own arithmetic on one line: "2 courts with adjustable net straps, 4 courts with portable nets if needed and all have painted lines". Two courts carry their nets permanently; four more are painted and take portable nets. The City schedules Open Play here on Tuesday, Thursday and Saturday mornings, 8:00am-12:00pm, split "Beginner & Adv. Beginner Open Play", and "Intermed. Open Play" on Saturday afternoons 2:00pm-5:00pm, with Monday, Wednesday and Friday marked "No Open Play or Reserved Play - FCFP Only". Open Play is free in the City\'s words - "all Open Play sessions are drop-in and free" - and outside those sessions the courts are first come, first play with a 90-minute limit when others are waiting. The City\'s beginner clinics run here on Wednesday mornings. Lighting and surface are not stated.',
  },
  {
    slug: 'tom-brown-park', importedSlug: 'tom-brown-park',
    name: 'Tom Brown Park', type: 'public_park',
    address: '501 Easterwood Avenue', addressLine: '501 Easterwood Avenue',
    spec: '4 pickleball courts | 8 pickleball courts on multi-purpose courts (tennis courts 1-4)',
    extra: 'City of Tallahassee pickleball professionals have priority to use courts 1A/1B for teaching purposes during non-monitored hours. Open Play schedule includes combo courts 4A-4B and the four standalone pickleball courts.',
    courts: 12, outdoor: 12, indoor: null, nets: null, openPlay: true, fcfpOnly: false, light: null, reservable: true,
    availability: 'Twelve outdoor pickleball courts, the largest published set in Tallahassee, in two kinds: "4 pickleball courts | 8 pickleball courts on multi-purpose courts (tennis courts 1-4)". Four are standalone pickleball courts and eight are lined onto tennis courts 1 to 4; twelve is the sum of the City\'s two figures. The City states that its "pickleball professionals have priority to use courts 1A/1B for teaching purposes during non-monitored hours" and that the "Open Play schedule includes combo courts 4A-4B and the four standalone pickleball courts". Open Play - free, drop-in - runs Monday and Wednesday 8:00am-12:00pm and Sunday 8:00am-12:00pm and 5:00pm-8:30pm; Reserved Play, which costs $4.25 to $5.75 a session, fills the weekday evenings, Tuesday and Thursday and Saturday mornings; Friday is first come, first play only. Tom Brown is one of the three venues the City takes online reservations for. Lighting and surface are not stated.',
  },
  {
    slug: 'winthrop-park', importedSlug: 'winthrop-park',
    name: 'Winthrop Park', type: 'public_park',
    address: '1601 Mitchell Avenue', addressLine: '1601 Mitchell Avenue',
    spec: '6 courts',
    extra: 'Winthrop Park tennis courts are multi-purpose courts used for tennis, pickleball and any other sports that will not damage the surface or nets of the courts',
    league: 'Please be aware that the GA/FL A and B league will be utilizing 5 courts on Tuesdays and 6 courts on Thursdays from 9:00am-12:00pm (September through April). In addition, local school teams will be using the courts from 3:30-5:00pm (January through April).',
    courts: 6, outdoor: 6, indoor: null, nets: null, openPlay: false, fcfpOnly: false, light: null, reservable: true,
    availability: 'Six outdoor courts that the City describes as shared: "Winthrop Park tennis courts are multi-purpose courts used for tennis, pickleball and any other sports that will not damage the surface or nets of the courts". The count is "6 courts" and nothing about them is called dedicated. The schedule here is Reserved Play only - Monday to Thursday 5:30pm-8:30pm and Saturday 8:30am-1:00pm, at $4.25 to $5.75 a session - with Friday "FCFP Only" and every other hour first come, first play; there is no Open Play session at Winthrop, so no free session is stated and no fee answer is published. Two competing uses are stated by the City: "the GA/FL A and B league will be utilizing 5 courts on Tuesdays and 6 courts on Thursdays from 9:00am-12:00pm (September through April)", and "local school teams will be using the courts from 3:30-5:00pm (January through April)". Winthrop is one of the three venues the City takes online reservations for. Lighting and surface are not stated.',
  },
  {
    slug: 'jack-l-mclean-jr-community-center', importedSlug: 'jack-l-mclean-jr-community-center',
    name: 'Jack L. McLean Jr. Community Center', type: 'community_center', centre: 'mclean',
    address: '700 Paul Russell Road', addressLine: '700 Paul Russell Road',
    spec: '2 courts with adjustable net straps and painted lines',
    closure: MCLEAN_CLOSURE,
    courts: 2, outdoor: 2, indoor: null, nets: true, openPlay: false, fcfpOnly: true, light: null,
    availability: 'Two outdoor pickleball courts with their own nets - "2 courts with adjustable net straps and painted lines" - at a community centre in the south of the city, marked "No Open or Reserved Play - FCFP Only": first come, first play at all hours, with the City\'s 90-minute limit when others are waiting. The City also prints a closure on the same line, and this page prints it as the City does: "Due to scheduled resurfacing, both the outdoor tennis and pickleball courts at jack mclean will be unavailable for use until december 5, 2025." That date had passed when this page was read on 7 September 2026 and the notice was still on the City\'s page; the run that builds this page fails if the City removes it. The centre\'s indoor court is scheduled for Open Play on Monday, Tuesday, Thursday and Saturday mornings, but the City states no indoor count, so nothing indoor is published here. Lighting and surface are not stated.',
  },
  {
    slug: 'jake-gaither-community-center', importedSlug: null, pendingRow: 'jake-gaither-community-center-outdoor-courts',
    name: 'Jake Gaither Community Center', type: 'community_center',
    address: '801 Bragg Drive', addressLine: '801 Bragg Drive',
    spec: '1 indoor court, 2 outdoor courts',
    hoursLine: 'Outdoor FCFP: 8:00am - 9:00pm Daily, Closed on Sunday',
    courts: 3, outdoor: 2, indoor: 1, nets: null, openPlay: false, fcfpOnly: false, light: null,
    availability: 'Three courts in two places, in the City\'s own split: "1 indoor court, 2 outdoor courts". The two outdoor courts are first come, first play, with hours the City states as "Outdoor FCFP: 8:00am - 9:00pm Daily, Closed on Sunday" - printed here as the City prints it, "Daily" and "Closed on Sunday" together. The single indoor court appears on the City\'s indoor schedule for Friday 12:00pm-2:00pm as "Rerseve Play Only", the City\'s spelling, which means a Reserved Play session at the reserved-play fee; indoor courts have no first-come play. No price is stated for the outdoor courts, so no fee answer is published. Lighting and surface are not stated.',
  },
  {
    slug: 'lafayette-park', importedSlug: null, pendingRow: 'lafayette-park-outdoor-courts',
    name: 'Lafayette Park', type: 'public_park', centre: 'mccollum',
    address: '501 Ingleside Drive', addressLine: '501 Ingleside Drive', otherAddress: '501 Ingleside Avenue',
    spec: '2 courts with net tie-downs - paddles and balls available inside the Sue McCollum Community Center only during regular office hours',
    courts: 2, outdoor: 2, indoor: null, nets: true, openPlay: false, fcfpOnly: true, light: null,
    availability: 'Two outdoor pickleball courts with nets - "2 courts with net tie-downs" - at the park that shares its site with the Sue McCollum Community Center, where the City says "paddles and balls available inside the Sue McCollum Community Center only during regular office hours". The courts are "No Open or Reserved Play - FCFP Only": first come, first play, 90-minute limit when others are waiting, and no price stated. The City writes the address two ways on one page - "501 Ingleside Drive" on the pickleball line, "501 Ingleside Avenue" for the community centre - and the Census address file resolves it as Avenue; the same house number, one site. The community centre\'s indoor court runs Open Play on Wednesdays and Reserved Play on Monday and Friday mornings, but the City states no indoor count, so only the outdoor courts publish. Lighting and surface are not stated.',
  },
  {
    slug: 'walker-ford-community-center', importedSlug: 'walker-ford-community-center',
    name: 'Walker-Ford Community Center', type: 'community_center', centre: 'walker',
    address: '2301 Pasco Street', addressLine: '2301 Pasco Street',
    spec: '3 courts - night play is available',
    courts: 3, outdoor: 3, indoor: null, nets: null, openPlay: false, fcfpOnly: true, light: true,
    availability: 'Three outdoor pickleball courts near Florida A&M, and the one place in Tallahassee where the City says the courts can be used after dark: "3 courts - night play is available". The City\'s word is "night play", not "lighted", and it is published here as a lighting answer on that phrase. The courts are "No Open or Reserved Play - FCFP Only": first come, first play, 90-minute limit when others are waiting, no price stated. The centre\'s indoor court has Open Play on Tuesday and Friday mornings and Thursday evenings, but the City states no indoor count, so nothing indoor is published. The imported dataset carried this centre as six courts, three indoor and three outdoor; the City\'s page says three, outdoors, and that is what publishes. Surface is not stated.',
  },
]

const EXCLUDED = [
  {
    name: 'Four Oaks Park', addressLine: '5151 Four Oaks Boulevard', address: '5151 Four Oaks Boulevard',
    spec: '6 courts - Specific courts are identified in parentheses', extra: 'Four Oaks pickleball courts are used for pickleball only',
    reasons: [
      'Neither address resolver finds "5151 Four Oaks Boulevard": the US Census address file returns no match and OpenStreetMap returns nothing at house-number level. Import Gate I1 requires a street address that resolves.',
      'This is the most expensive refusal in the city. Six courts "used for pickleball only", an Open Play and Reserved Play schedule seven days a week running to 10:00pm, and online reservations - the flagship of the City\'s programme. It fails on its address alone, and the run throws the day the address resolves.',
    ],
  },
  {
    name: 'Lawrence-Gregory Community Center at Dade Street', addressLine: '1115 Dade Street | 850-891-3910',
    reasons: ['Listed on the City\'s indoor schedule with an address and a Saturday Open Play session, and never a court count. Page Gate 1 requires a stated count.'],
  },
  {
    name: 'Lincoln Neighborhood Center', addressLine: '438 West Brevard Street | 850-891-4180',
    reasons: ['Listed on the City\'s indoor schedule as "No Pickleball (renovations in progress)" for every day, with no court count.'],
  },
  {
    name: 'Sue Herndon McCollum Community Center', addressLine: '501 Ingleside Avenue | 850-891-3946',
    reasons: ['Listed on the City\'s indoor schedule with Open Play and Reserved Play sessions and never a court count. Its outdoor courts are Lafayette Park\'s, which publish.'],
  },
  {
    name: 'Tallahassee Senior Center', addressLine: '1400 North Monroe Street | 850-891-4000 | $3 Donation Encouraged',
    reasons: ['Listed on the City\'s indoor schedule with Open Play sessions, lessons and "$3 Donation Encouraged", and never a court count.'],
  },
]

/* ---------------------------------------------------------------- */

const snapshotPath = name => `data/sources/tallahassee/${name}.html`

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

const page = linesOf(snapshotPath('pickleball'))

/* The city-wide statements every published venue leans on. */
for (const [needle, what] of [
  [FCFP_RULE, 'first-come rule'], [OPEN_PLAY_DEF, 'Open Play definition'], [OPEN_PLAY_FREE, 'Open Play is free'],
  [RESERVED_DEF, 'Reserved Play definition'], [FEES, 'reservation fees'], [SENIOR, 'senior rate'],
  [FCFP_DEF, 'FCFP definition and 90-minute limit'], [RESERVE_ONLINE, 'online reservation venues'],
  [INDOOR_NO_FCFP, 'indoor rule'],
]) {
  must('pickleball', 'Tallahassee', needle, what)
}

/*
  Each outdoor venue is a block: the name line, the address line, then the
  count line and schedule, until the next venue name or the rules heading.
  Found inside the outdoor section only, so an indoor listing of the same
  centre cannot satisfy an outdoor assertion.
*/
const outdoorStart = page.findIndex(l => squeeze(l) === squeeze(OUTDOOR_HEADING))
const outdoorEnd = page.findIndex((l, i) => i > outdoorStart && squeeze(l) === squeeze('Open Play vs Reserved Play vs First-Come First-Play'))
if (outdoorStart < 0 || outdoorEnd < 0) throw new Error('The Tallahassee page no longer has an outdoor section bounded by the rules heading.')
const NAMES = [...VENUES.map(v => v.name), ...EXCLUDED.map(e => e.name)].map(squeeze)

function blockOf(who, name) {
  const at = page.findIndex((l, i) => i > outdoorStart && i < outdoorEnd && squeeze(l) === squeeze(name))
  if (at < 0) throw new Error(`${who}: "${name}" is no longer listed in the outdoor section of the Tallahassee pickleball page.`)
  let end = at + 1
  while (end < outdoorEnd && !NAMES.includes(squeeze(page[end]))) end++
  return page.slice(at + 1, end)
}
const has = (block, needle) => squeeze(block.join(' ')).includes(squeeze(needle))
const sessionLine = l => /^((Beginner & Adv\. )?Beginner |Intermed\. )?Open Play( \(\d-\d\))?$/.test(l)

const counties = JSON.parse(
  readFileSync(join(REPO_ROOT, 'data/sources/tallahassee-county-census.json'), 'utf8'))

/* ---------------------------------------------------------------- */
/* THE REFUSALS, ASSERTED RATHER THAN REMEMBERED.                    */

{
  const fo = EXCLUDED[0]
  const block = blockOf(fo.name, fo.name)
  for (const [needle, what] of [[fo.addressLine, 'address'], [fo.spec, 'count'], [fo.extra, 'dedicated statement']]) {
    if (!has(block, needle)) throw new Error(`Four Oaks Park: its block no longer carries the ${what} "${needle}".`)
  }
  if (counties['four-oaks-park']?.matched) {
    throw new Error('Four Oaks Park now resolves. The only reason it is excluded has gone: publish its six dedicated courts.')
  }
  for (const e of EXCLUDED.slice(1)) {
    must('pickleball', e.name, e.name, 'indoor listing')
    must('pickleball', e.name, e.addressLine, 'indoor address line')
    /* A count appearing beside an indoor-only centre means it must be re-read. */
    const idx = page.findIndex(l => squeeze(l) === squeeze(e.name))
    const near = page.slice(idx, idx + 4).join(' ')
    if (/\b\d+ (indoor |outdoor )?courts?\b/i.test(near)) {
      throw new Error(`${e.name} now carries a court count on the City page: "${near}". Re-read and publish it.`)
    }
  }
}

/* The centre pages corroborate three addresses. */
must('centers-walker', 'Walker-Ford', '2301 Pasco Street', 'address on the centre page')
must('centers-mclean', 'McLean', '700 Paul Russell Road', 'address on the centre page')
must('centers-mccollum', 'McCollum', '501 Ingleside Avenue', 'address on the centre page')

const identityRegistry = loadIdentity(REPO_ROOT)
const allRows = loadRows().map(r => mapRow(r).venue)
const bySlug = new Map(
  allRows.filter(v => v.city === 'Tallahassee' && String(v.state).toUpperCase() === 'FL')
    .map(v => [v.slug, v]))

const overlay = {}
const changes = []

for (const p of VENUES) {
  const block = blockOf(p.slug, p.name)
  for (const [needle, what] of [[p.addressLine, 'address'], [p.spec, 'count'], [p.extra, 'court description'], [p.league, 'league note'], [p.closure, 'closure notice'], [p.hoursLine, 'hours']]) {
    if (needle && !has(block, needle)) throw new Error(`${p.slug}: its block no longer carries the ${what} "${needle}".`)
  }
  const sessions = block.filter(sessionLine)
  if (p.openPlay && sessions.length === 0) throw new Error(`${p.slug}: no Open Play session is scheduled any more; "free" no longer has a basis here.`)
  if (!p.openPlay && sessions.length > 0) throw new Error(`${p.slug}: the City now schedules Open Play here (${sessions[0]}); read it again and publish the free session.`)
  if (p.fcfpOnly && !has(block, FCFP_ONLY)) throw new Error(`${p.slug}: no longer marked "${FCFP_ONLY}".`)
  if (p.pendingRow && !bySlug.has(p.pendingRow)) throw new Error(`${p.slug}: the imported row ${p.pendingRow} this run leaves pending is gone.`)

  const geo = counties[p.slug]
  if (!geo?.matched) throw new Error(`${p.slug}: no address resolver matched its address`)
  if (!geo.place_matches_city) throw new Error(`${p.slug}: the resolver places this at "${geo.place}", not Tallahassee.`)
  if (p.slug === 'lafayette-park') {
    if (!/INGLESIDE AVE/.test(String(geo.matched))) throw new Error('lafayette-park: the resolver no longer answers Ingleside Avenue; re-read the two City spellings.')
    must('pickleball', 'lafayette-park', 'Sue Herndon McCollum Community Center 501 Ingleside Avenue', 'the City\'s Avenue spelling for the shared site')
  } else if (/changing the direction|changed the direction/.test(geo.basis) && geo.resolver !== 'osm') {
    /* A flipped or dropped direction the second resolver could not confirm is Foster Park's failure. A street TYPE the Census normalised with OSM holding no street of the operator's type is Highland Pines's: one street under one name, and the basis records it. */
    throw new Error(`${p.slug}: the resolver altered the address's direction and OSM could not confirm it: ${geo.basis}`)
  }

  const doc = new SourceDocument({url: PAGE, retrieved_at: RETRIEVED_AT, tier: 1, publisher: CITY, format: 'html'})
  const docCentre = p.centre
    ? new SourceDocument({url: `${CENTRES}${p.centre}`, retrieved_at: RETRIEVED_AT, tier: 1, publisher: CITY, format: 'html'})
    : null
  const docCensus = new SourceDocument({url: CENSUS_URL, retrieved_at: RETRIEVED_AT, tier: 1, publisher: 'US Census Bureau', format: 'json'})

  const shell = {
    slug: p.slug, name: null, city: 'Tallahassee', state: 'FL', county: null,
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
    doc.fact('name', p.name, {evidence: `Named "${p.name}" in the outdoor section of the City's pickleball page.`}),
    doc.fact('total_courts', p.courts, {
      evidence: p.slug === 'leverne-payne-community-center'
        ? `The City's line: "${p.spec}". Six is the sum of the City's two figures - two courts with their own nets and four painted courts that take portable nets.`
        : p.slug === 'tom-brown-park'
          ? `The City's line: "${p.spec}". Twelve is the sum of the City's two figures - four standalone pickleball courts and eight lined onto tennis courts 1 to 4; "${p.extra}"`
          : p.slug === 'jake-gaither-community-center'
            ? `The City's line: "${p.spec}". Three is the sum of the City's two figures.`
            : `The City's line for this venue: "${p.spec}".`,
    }),
    doc.fact('outdoor_courts', p.outdoor, {
      evidence: p.slug === 'jake-gaither-community-center'
        ? `"${p.spec}" - the word is the City's.`
        : `Listed under "${OUTDOOR_HEADING}" on the City's page: "${p.spec}".`,
    }),
    (docCentre ?? doc).fact('street_address', p.address, {
      evidence: `"${p.addressLine}" on the City's pickleball page.` +
        (docCentre ? ` The ${p.centre === 'mccollum' ? 'Sue McCollum Community Center' : p.name}'s own page prints ${p.otherAddress ? `"${p.otherAddress}"` : 'the same address'}.` : '') +
        (/street type/.test(geo.basis) && p.slug !== 'lafayette-park' ? ` ${geo.basis.replace(/^Census address geocoder matched /, 'The Census address geocoder matched ')}` : '') +
        (p.otherAddress ? ` The City writes the shared site two ways - "${p.address}" on the pickleball line and "${p.otherAddress}" for the community centre - and the Census address file resolves it as Avenue. Same house number, one site; the count-bearing line's spelling is published and the resolver's is stated.` : ''),
    }),
    doc.fact('venue_type', p.type, {
      evidence: p.type === 'community_center'
        ? 'A City community centre with outdoor courts, listed on the City\'s pickleball page.'
        : `Published by the ${CITY} among its parks.`,
    }),
    doc.fact('play_format', 'open_play', {
      evidence: p.openPlay
        ? `The City schedules Open Play here - "${sessions[0]}" - which it defines as "a Drop-In session in which players simply drop-in, without advanced reservations"; outside sessions, "${FCFP_RULE}".`
        : `"${p.fcfpOnly ? FCFP_ONLY : FCFP_RULE}" - and First Come First Play "${FCFP_DEF}"`,
    }),
    doc.fact('court_availability', p.availability, {
      evidence: `From the City's pickleball page: "${p.spec}", the venue's schedule, and the City's definitions of Open Play, Reserved Play and First-Come First-Play.`,
    }),
    docCensus.fact('county', geo.county, {
      evidence: `${geo.county} County, FL${geo.county_fips ? ` (FIPS ${geo.state_fips}${geo.county_fips})` : ''}. ${geo.basis} The resolver also places it in the incorporated place "${geo.place}", which is what allows it to be published under Tallahassee.`,
    }),
    docCensus.fact('postal_code', geo.postal_code, {evidence: `${geo.basis} The City prints no postcode for this venue.`}),
  ]

  if (p.indoor != null) {
    facts.push(doc.fact('indoor_courts', p.indoor, {evidence: `"${p.spec}" - the word is the City's.`}))
  }
  if (p.openPlay) {
    facts.push(doc.fact('fee_type', 'free', {
      evidence: `The City schedules Open Play here and prices it at nothing: "${OPEN_PLAY_FREE}" and Open Play "${OPEN_PLAY_DEF}"`,
    }))
  }
  if (p.openPlay || p.reservable || p.indoor != null) {
    facts.push(doc.fact('pricing_notes',
      (p.openPlay ? 'Open Play sessions are drop-in and free. ' : p.indoor != null ? 'No price is stated for the outdoor first-come courts. ' : 'No Open Play session is scheduled and no price is stated for first-come play. ') +
      RESERVED_FEES_NOTE +
      (p.reservable ? ' Reservations online or by phone on 850-891-4940.' : p.indoor != null ? ' The indoor court is Reserved Play only.' : ''), {
        evidence: `"${RESERVED_DEF}" "${FEES}" "${SENIOR}"` + (p.reservable ? ` "Make a reservation online ${RESERVE_ONLINE}"` : ''),
      }))
  }
  if (p.hoursLine) {
    facts.push(doc.fact('hours_of_operation', p.hoursLine, {evidence: `Printed on the City's page for this venue exactly as "${p.hoursLine}".`}))
  }
  if (p.nets === true) {
    facts.push(doc.fact('nets_provided', true, {
      evidence: `The City's own line: "${p.spec}" - ${p.slug === 'lafayette-park' ? 'net tie-downs are nets' : 'adjustable net straps are nets'}${p.slug === 'leverne-payne-community-center' ? ', and the City adds that the other four courts take "portable nets if needed"' : ''}.`,
    }))
  }
  if (p.light === true) {
    facts.push(doc.fact('light', true, {
      evidence: `The City's line is "${p.spec}". Its words are "night play is available", not "lighted"; outdoor courts that can be played at night are lit courts, and that phrase is the whole basis of this answer.`,
    }))
  }

  const res = applyFacts(venue, facts)

  overlay[p.slug] = {
    minted: !imported,
    identity: {
      name: p.name, city: 'Tallahassee', state: 'FL',
      county: geo.county, postal_code: geo.postal_code ?? null,
      latitude: geo.lat ?? null, longitude: geo.lon ?? null,
      imported_slug: p.importedSlug ?? null,
      canonical_slug: identityRegistry.renames[p.importedSlug]?.canonical ?? p.slug,
    },
    match: {
      source_page: PAGE, quote: p.spec,
      basis: imported
        ? p.slug === 'tom-brown-park'
          ? 'Matched to the imported tom-brown-park row (501 EASTERWOOD DR). A second imported row, tom-brown-park-pickleball-courts, describes the same courts at "Easterwood Dr & Access Rd 16" and canonicalises to the same slug; the identity pass holds both until data/identity/resolutions.json names this row as the keeper. The City publishes one Tom Brown Park.'
          : `Matched to the imported ${p.importedSlug} row in Tallahassee, FL, at the same street address.`
        : `No imported row under this slug. Minted from the City's pickleball page, which states the count and the address. The imported row ${p.pendingRow} describes the same courts${p.slug === 'lafayette-park' ? ' at an intersection with no house number' : ''} and is left pending rather than published as a second venue.`,
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
const outdoorCourts = VENUES.reduce((a, p) => a + (p.outdoor ?? 0), 0)
const indoorCourts = VENUES.reduce((a, p) => a + (p.indoor ?? 0), 0)
const litCourts = VENUES.filter(p => p.light === true).reduce((a, p) => a + p.courts, 0)
const freeVenues = VENUES.filter(p => p.openPlay).length

for (const [slug, entry] of Object.entries(overlay)) {
  const {total_courts: t, indoor_courts: i, outdoor_courts: o} = entry.patch
  if (i != null && o != null && t !== i + o) throw new Error(`Rule 13: ${slug} does not sum.`)
}
if (outdoorCourts + indoorCourts !== totalCourts) throw new Error('Rule 13: the city does not sum.')

const METHOD_NOTE =
  'Tallahassee states a count, a price and the rules of play on one City page. Its outdoor section gives each venue an address, a count line in the City\'s own words and a weekly schedule of Open Play, Reserved Play and First-Come First-Play; beneath it the City defines the three - Open Play "sessions do not require a fee" and are "drop-in and free", Reserved Play costs $4.25 to $5.75 a session, First-Come First-Play "just means that the court is open" with a 90-minute limit when others are waiting. Seven venues publish, 34 courts, two of them by the City\'s own two-figure arithmetic: LeVerne Payne\'s "2 courts with adjustable net straps, 4 courts with portable nets" and Tom Brown\'s "4 pickleball courts | 8 pickleball courts on multi-purpose courts". Free is published only where the City schedules Open Play (LeVerne Payne, Tom Brown); an unpriced first-come court is not called free. Walker-Ford\'s "night play is available" publishes as lighting on that phrase. Four Oaks Park - six courts "used for pickleball only", the flagship - is refused because "5151 Four Oaks Boulevard" is found by neither resolver, and four indoor centres are refused for stating no count. McLean\'s resurfacing notice, dated December 2025 and still on the page in September 2026, is published as the City prints it and asserted. Tom Brown Park is two imported rows that canonicalise to one slug and needs an identity resolution before it can promote.'

mkdirSync(join(REPO_ROOT, 'data/verified'), {recursive: true})
writeFileSync(join(REPO_ROOT, 'data/verified/tallahassee-fl.json'), JSON.stringify({
  city: 'Tallahassee', state: 'FL', retrieved_at: RETRIEVED_AT,
  method_note: METHOD_NOTE,
  sources: [
    {url: PAGE, publisher: CITY, tier: 1, format: 'html', snapshot: snapshotPath('pickleball')},
    ...['walker', 'mclean', 'mccollum'].map(c => ({url: `${CENTRES}${c}`, publisher: CITY, tier: 1, format: 'html', snapshot: snapshotPath(`centers-${c}`)})),
    {url: CENSUS_URL, publisher: 'US Census Bureau', tier: 1, format: 'json', snapshot: 'data/sources/tallahassee-county-census.json'},
  ].map((s, i) => ({id: `S${i + 1}`, ...s})),
  totals: {
    venues: VENUES.length, courts: totalCourts,
    outdoor: outdoorCourts, indoor: indoorCourts,
    lit_courts: litCourts, free_venues: freeVenues,
  },
  excluded: EXCLUDED.map(e => ({name: e.name, why: e.reasons})),
  venues: overlay,
}, null, 2) + '\n')

const changed = changes.filter(r =>
  r.old_value !== null && r.old_value !== undefined && String(r.old_value) !== String(r.new_value))

writeFileSync(join(REPO_ROOT, 'reports', 'tallahassee-conflicts.md'), [
  '# Tallahassee verification - a count, a price and the rules of play on one page', '',
  `Run ${RETRIEVED_AT}. ${VENUES.length} venues published, ${totalCourts} courts (${outdoorCourts} outdoor, ${indoorCourts} indoor). ${EXCLUDED.length} venues refused.`, '',
  'Tallahassee is the third city in Florida on this site and the first in Leon County.', '',
  '| venue | courts | in | out | lit | free | what the City writes | address |',
  '| --- | ---: | ---: | ---: | --- | --- | --- | --- |',
  ...VENUES.map(p => `| \`${p.slug}\` | ${p.courts} | ${p.indoor ?? '-'} | ${p.outdoor ?? '-'} | ${p.light === true ? 'yes ("night play")' : 'not stated'} | ${p.openPlay ? 'yes (Open Play)' : 'not stated'} | "${p.spec}" | ${p.address} |`),
  '',
  '## How "free" is read', '',
  'The City prices Open Play at nothing and Reserved Play at $4.25 to $5.75, and puts no price on First-Come',
  'First-Play. A venue publishes `fee_type = free` only where the City schedules an Open Play session; a',
  'court that is open and unpriced is recorded as unknown, not as free. Winthrop\'s schedule is Reserved',
  'Play and FCFP only, and McLean, Lafayette and Walker-Ford are "No Open or Reserved Play - FCFP Only".',
  '',
  '## Refused', '',
  ...EXCLUDED.flatMap(e => [
    `**${e.name}** - ${e.spec ? `"${e.spec}" - ` : ''}${e.addressLine}`, '',
    ...e.reasons.map((r, i) => `${i + 1}. ${r}`), '']),
  '## Tom Brown Park is two imported rows', '',
  '`tom-brown-park` (501 EASTERWOOD DR) and `tom-brown-park-pickleball-courts` ("Easterwood Dr & Access Rd 16")',
  'both canonicalise to `tom-brown-park` and the identity pass holds both. The City publishes one Tom Brown',
  'Park at 501 Easterwood Avenue with twelve courts. A resolution in `data/identity/resolutions.json` naming',
  'the first row as the keeper is required before Import Gate I1 will promote it.',
  '',
  '## One address the City writes two ways', '',
  'Lafayette Park: "501 Ingleside Drive" on the pickleball line, "501 Ingleside Avenue" for the Sue McCollum',
  'Community Center on the same site. The Census resolves Avenue; OpenStreetMap has no Ingleside Drive at that',
  'number. The count-bearing spelling publishes and both are asserted.',
  '',
  '## A closure published as printed', '',
  `McLean: "${MCLEAN_CLOSURE}" - still on the page on ${RETRIEVED_AT}; asserted.`,
  '',
  '## What Tallahassee does not say', '',
  '- **surface**, anywhere.',
  '- **lighting**, except Walker-Ford\'s "night play is available". Four Oaks\'s 10:00pm schedule is not a statement about lights.',
  '- **hours**, except Jake Gaither\'s "Outdoor FCFP: 8:00am - 9:00pm Daily, Closed on Sunday".',
  '- **postcodes.** The resolver\'s publish.',
  '',
  changed.length ? '## Values a source changed' : '_No imported row was overwritten._',
  ...(changed.length ? [
    '', '| venue | field | was | now | outcome |', '| --- | --- | --- | --- | --- |',
    ...changed.map(r => `| \`${r.venue_slug}\` | ${r.field} | ${JSON.stringify(r.old_value)} | ${JSON.stringify(r.new_value)} | ${r.outcome} |`),
  ] : []),
  '',
].join('\n'))

console.log(`\nTallahassee, FL - ${VENUES.length} venues, ${totalCourts} courts (${outdoorCourts} outdoor, ${indoorCourts} indoor), retrieved ${RETRIEVED_AT}`)
for (const p of VENUES) {
  const o = overlay[p.slug]
  console.log(
    `  ${o.patch.name.padEnd(36)} ${String(o.patch.total_courts).padStart(2)} | in ${String(o.patch.indoor_courts ?? '-').padStart(2)} out ${String(o.patch.outdoor_courts ?? '-').padStart(2)}` +
    ` | ${(p.light === true ? 'lit (night play)' : 'lighting not stated').padEnd(19)} | ${(p.openPlay ? 'free' : 'fee not stated').padEnd(14)} | ${o.patch.county} County | via ${counties[p.slug].resolver}`)
}
console.log(`\n  refused: ${EXCLUDED.map(e => e.name).join(', ')}`)
console.log('\nWrote data/verified/tallahassee-fl.json and reports/tallahassee-conflicts.md\n')
