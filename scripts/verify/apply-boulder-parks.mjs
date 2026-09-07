#!/usr/bin/env node
/*
  Boulder, CO verification run - city #24, the first in Colorado and the
  first in Boulder County.

  ============================================================
  ONE TABLE, FIVE ROWS, AND THE WORD "FREE" IN A SENTENCE
  ============================================================

  The City's Racket Sports page carries a table headed "COURTS | pickleball
  NETS | LOCATION", under the heading "Outdoor court layout and location":

      4 pickleball  4 tennis  Rolling  North Boulder Recreation Center
      2 pickleball            Rolling  East Boulder Community Center
      8 pickleball  4 tennis  Rolling  South Boulder Recreation Center
      2 pickleball  1 tennis  Rolling  Chautauqua Park
      4 pickleball            Rolling  Foothills Community Park

  and, above it, the sentence that prices every row: "Courts are first come
  and free to all park visitors, a reserved court is available to secure
  your date and time." Reserving costs "$10 per hour"; "Free drop-in play
  and walk-up use of unreserved courts will continue as usual." Boulder is
  the fourth city in this directory whose operator writes the word "free".

  The City's Pickleball page adds the indoor side: drop-in "on 3 indoor
  courts" in the gymnasiums at East Boulder, South Boulder and North
  Boulder, at listed times, "included with your daily entry fee or pass".
  Tampa set the precedent that a gym count at scheduled times is a stated
  count, so the three recreation centres publish an indoor figure.

  ============================================================
  WHAT "OUTDOOR" RESTS ON
  ============================================================

  The table sits under "Outdoor court layout and location", and the City
  says "Pickleball play is on tennis courts with pickleball lines. Except
  for Foothills Community Park which is a designated inline hockey rink."
  That heading is asserted to precede the table, so the table's figures
  publish as outdoor courts - Saint Paul's rule that a page's own structure
  can carry the indoor/outdoor fact. North Boulder and South Boulder are
  also called outdoor in prose on the Pickleball page's drop-in schedule.

  ============================================================
  SOUTH BOULDER: EIGHT ON THE TABLE, SIX IN THE DROP-IN LINE
  ============================================================

  The table says "8 pickleball"; the drop-in schedule says "8:30 to 11:30
  am on 6 outdoor courts". These are not two counts of the same thing: the
  table is the inventory and the drop-in line is how many of it the City
  sets aside for a session. Eight publishes, both lines are asserted, and
  the tension is written down rather than resolved by picking the smaller
  number. South Boulder's outdoor courts were also closed for resurfacing
  when this run was made - "Aug. 17 - tentatively scheduled to reopen Sept.
  11: All SBRC Outdoor Racket Courts closed for court resurfacing and
  restriping." - and it publishes as closed, on the Thompson Peak
  precedent, with the notice asserted.

  ============================================================
  WHAT IS REFUSED
  ============================================================

  Tom Watson Park            The table lists it under "Additional Tennis
                             Courts" with "4", a tennis figure. The imported
                             dataset says twelve pickleball courts; the City
                             states no pickleball count. A flag is not a
                             number, and a tennis count is not one either.

  East Boulder Community     Appears on the Racket Sports page only as a
  Park                       lighting note and a project link. No count.

  ============================================================
  WHAT IS NOT CLAIMED
  ============================================================

  light      "Lights are not guaranteed for use of courts after sunset" is
             not a statement that any pickleball court is lit. Null.
  surface    Not stated.
  nets       "Rolling" in a table column is a label, not a sentence. Only
             Foothills says it in words - "Nets are not available onsite" -
             and only Foothills publishes nets_provided = No.
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

const CITY = 'City of Boulder Parks & Recreation'
const RACKET = 'https://bouldercolorado.gov/services/racket-sports'
const PICKLEBALL = 'https://bouldercolorado.gov/services/pickleball'
const FAQS = 'https://bouldercolorado.gov/racket-sports-faqs'
const LOC_BASE = 'https://bouldercolorado.gov/locations'
const CENSUS_URL = 'https://geocoding.geo.census.gov/geocoder/geographies'

const FREE = 'Courts are first come and free to all park visitors, a reserved court is available to secure your date and time.'
const RENTAL = 'Court rental fees are increasing to $10 per hour.'
const DROP_IN_FREE = 'Free drop-in play and walk-up use of unreserved courts will continue as usual.'
const ON_TENNIS = 'Pickleball play is on tennis courts with pickleball lines. Except for Foothills Community Park which is a designated inline hockey rink.'
const LIGHTS = 'Lights are not guaranteed for use of courts after sunset'
const OUTDOOR_HEADING = 'Outdoor court layout and location'
const INDOOR_FEE = 'Indoor drop-in pickleball is included with your daily entry fee or pass.'
const INDOOR_NETS = 'pickleball nets are not available outside listed drop-in hours'
const SBRC_NO_SUMMER = 'There is no indoor Pickleball at South Boulder Recreation Center from June through October'
const SBRC_CLOSURE = 'Aug. 17 - tentatively scheduled to reopen Sept. 11: All SBRC Outdoor Racket Courts closed for court resurfacing and restriping.'
const FAQ_FREE = 'Unreserved courts remain free to use on a first-come, first-play basis.'

const VENUES = [
  {
    slug: 'north-boulder-rec-center', importedSlug: 'north-boulder-rec-center', geo: 'north-boulder-recreation-center',
    name: 'North Boulder Recreation Center', page: 'north-boulder-recreation-center', type: 'community_center',
    tableRow: ['4 pickleball', '4 tennis', 'Rolling', 'North Boulder Recreation Center'],
    outdoor: 4, indoor: 3, indoorQuote: '7:30 to 10:30 am on 3 indoor courts', outdoorQuote: 'on 4 outdoor courts',
    address: '3170 Broadway', cityZip: '80304',
    hoursLines: ['Sunday:', '6:45 am-6:00 pm', 'Monday - Friday:', '5:45 am-9:00 pm', 'Saturday:', '6:45 am-6:00 pm'],
    hours: 'Recreation centre: Monday-Friday 5:45 am-9:00 pm, Saturday and Sunday 6:45 am-6:00 pm. Indoor pickleball drop-in: Monday, Wednesday, Friday 7:30-10:30 am. Outdoor drop-in: Tuesday and Thursday 7:30-10:30 am, Wednesday and Friday 6-9 pm.',
    pricing: 'Outdoor courts are free and first come; reserving one costs $10 per hour. Indoor drop-in is included with the recreation centre daily entry fee or pass.',
    availability: 'Seven pickleball courts in two places at one address: four outdoor courts on tennis courts with pickleball lines, and three indoor courts in the gymnasium at scheduled drop-in times. The four outdoor courts are the City\'s table figure - "4 pickleball / 4 tennis" - and the City calls them outdoor in its drop-in schedule: "Tuesdays and Thursdays: 7:30 to 10:30 am on 4 outdoor courts" and "Wednesdays and Fridays: 6 to 9 pm on 4 outdoor courts". Outside those windows the courts are first come and free, or reservable at $10 an hour. Indoors, "Monday, Wednesday, Friday: 7:30 to 10:30 am on 3 indoor courts", included with the centre\'s daily entry fee or pass, and the City says nets are not available outside the listed hours. The centre also has "Two platform tennis courts with pickleball lines" for overflow, which are not counted here. Lighting: the City says only that lights are not guaranteed after sunset and that complimentary light timers sit near Tennis Court 1, so no lighting answer is published.',
  },
  {
    slug: 'east-boulder-recreation-center', importedSlug: 'east-boulder-recreation-center', geo: 'east-boulder-community-center',
    name: 'East Boulder Community Center', page: 'east-boulder-community-center', type: 'community_center',
    tableRow: ['2 pickleball', 'Rolling', 'East Boulder Community Center'],
    outdoor: 2, indoor: 3, indoorQuote: '1 to 3 pm and 6 to 8 pm on 3 indoor courts', outdoorQuote: null,
    address: '5660 Sioux Dr.', cityZip: '80303',
    hoursLines: ['Sunday:', '7:45 am-4:00 pm', 'Monday - Friday:', '5:45 am-9:30 pm', 'Saturday:', '7:45 am-4:00 pm'],
    hours: 'Community centre: Monday-Friday 5:45 am-9:30 pm, Saturday and Sunday 7:45 am-4:00 pm. Indoor pickleball drop-in: Monday 1-3 pm and 6-8 pm, Sunday 2-4 pm.',
    pricing: 'Outdoor courts are free and first come; reserving one costs $10 per hour. Indoor drop-in is included with the centre daily entry fee or pass.',
    availability: 'Five pickleball courts: two outdoor, on tennis courts with pickleball lines, and three indoor in the gymnasium at drop-in times. The table figure is "2 pickleball" with no tennis courts listed beside it, the smallest outdoor set in Boulder. The indoor courts are the City\'s drop-in line: "Monday: 1 to 3 pm and 6 to 8 pm on 3 indoor courts" and "Sunday: 2 to 4 pm on 3 indoor courts", included with the daily entry fee or pass. The City names this centre "East Boulder Community Center" on its location page and "East Boulder Recreation Center" on its pickleball page; the location page\'s name is used here. Outdoor play is first come and free, or reservable at $10 an hour. The City\'s lighting note for East Boulder concerns the courts at East Boulder Community PARK, a separate project site, not this centre, so no lighting is published.',
  },
  {
    slug: 'south-boulder-recreation-center', importedSlug: 'south-boulder-recreation-center', geo: 'south-boulder-recreation-center',
    name: 'South Boulder Recreation Center', page: 'south-boulder-recreation-center', type: 'community_center',
    tableRow: ['8 pickleball', '4 tennis', 'Rolling', 'South Boulder Recreation Center'],
    outdoor: 8, indoor: 3, indoorQuote: '9 to 11 am on 3 indoor courts*', outdoorQuote: '8:30 to 11:30 am on 6 outdoor courts',
    address: '1360 Gillaspie', cityZip: '80305',
    hoursLines: ['Sunday:', '8:45 am-4:00 pm', 'Monday - Friday:', '5:45 am-9:00 pm', 'Saturday:', '8:45 am-4:00 pm'],
    hours: 'Recreation centre: Monday-Friday 5:45 am-9:00 pm, Saturday and Sunday 8:45 am-4:00 pm. Outdoor pickleball drop-in: daily 8:30-11:30 am. Indoor drop-in: Sunday 9-11 am, Tuesday and Thursday 1:30-3:30 pm, and none from June through October.',
    pricing: 'Outdoor courts are free and first come; reserving one costs $10 per hour. Indoor drop-in is included with the recreation centre daily entry fee or pass.',
    availability: 'Eleven pickleball courts, the largest published set in Boulder: eight outdoor courts on tennis courts with pickleball lines - the City\'s table reads "8 pickleball / 4 tennis" - and three indoor courts in the gymnasium at drop-in times. The City\'s drop-in schedule says "Monday through Sunday: 8:30 to 11:30 am on 6 outdoor courts", six rather than eight, and the two figures are printed here rather than reconciled: the table is the inventory and the drop-in line is what the City sets aside for the morning session. Indoors, "Sunday: 9 to 11 am on 3 indoor courts" and "Tuesday, Thursday: 1:30 to 3:30 pm on 3 indoor courts", with the City\'s own footnote that "There is no indoor Pickleball at South Boulder Recreation Center from June through October". When this run was made the outdoor courts were shut: "Aug. 17 - tentatively scheduled to reopen Sept. 11: All SBRC Outdoor Racket Courts closed for court resurfacing and restriping." That notice is published as the City printed it, and the build fails the day the City takes it down.',
  },
  {
    slug: 'chautauqua-park', importedSlug: 'chautauqua-park', geo: 'chautauqua-park',
    name: 'Chautauqua Park', page: 'chautauqua-park', type: 'public_park',
    tableRow: ['2 pickleball', '1 tennis', 'Rolling', 'Chautauqua Park'],
    outdoor: 2, indoor: null, indoorQuote: null, outdoorQuote: null,
    address: '900 Baseline Rd', cityZip: '80302',
    hoursLines: ['Sunday - Saturday:', '5:00 am-11:00 pm'],
    hours: 'Park hours 5:00 am-11:00 pm daily.',
    pricing: 'Free and first come; reserving a court costs $10 per hour. Paid parking is in effect at and near the park on summer weekends and holidays, Memorial Day weekend to Labor Day.',
    parking: 'Paid parking in effect Memorial weekend to Labor Day at and near the park, on summer weekends and holidays; the City\'s Park-to-Park service provides free satellite parking and a shuttle.',
    availability: 'Two pickleball courts on a single tennis court with pickleball lines - "2 pickleball / 1 tennis" in the City\'s table - at the foot of the Flatirons, in a park open 5:00 am to 11:00 pm daily. First come and free, or reservable at $10 an hour. Two courts is a game rather than a rotation, and the City states no drop-in session here; the scheduled drop-in play is at the three recreation centres. The park is the one Boulder venue where the City publishes a parking arrangement: "Paid parking in effect Memorial weekend to Labor Day", on summer weekends and holidays at Chautauqua and the nearby streets, with free satellite parking and a shuttle through the City\'s Park-to-Park service. Nets: the table\'s "Rolling" column means players bring a portable net and roll it off after play, but the City states that in words only at Foothills, so nothing is claimed here about nets. Lighting and surface are not stated.',
  },
  {
    slug: 'foothills-community-park', importedSlug: null, geo: 'foothills-community-park',
    name: 'Foothills Community Park', page: 'foothills-community-park', type: 'public_park',
    tableRow: ['4 pickleball', 'Rolling', 'Foothills Community Park'],
    outdoor: 4, indoor: null, indoorQuote: null, outdoorQuote: null,
    address: '800 Cherry Ave', cityZip: '80304',
    hoursLines: null,
    hours: 'Pickleball courts available for reservation and use 7 a.m. to noon, seven days a week; the rink is open to general public use and all sports from noon to close.',
    pricing: 'Free and first come in the morning window; reserving a court costs $10 per hour.',
    netsQuote: 'Please bring your own portable pickleball nets. Nets are not available onsite.',
    foothillsQuote: 'We heard your feedback and added pickleball courts to the large rink for four pickleball courts.',
    foothillsHours: 'The courts are available for reservation and use from 7 a.m. to noon, seven days a week. The rink is available for general public use and all sports from noon to close.',
    availability: 'Four pickleball courts on an inline hockey rink, the one Boulder venue that is not a tennis court with pickleball lines: "We heard your feedback and added pickleball courts to the large rink for four pickleball courts." The City states the arrangement in full - the courts are "available for reservation and use from 7 a.m. to noon, seven days a week", and from noon to close the rink reverts to general public use and all sports - so pickleball here has a morning window, not a day. It is also the only Boulder venue where the City says in words that you must bring a net: "Please bring your own portable pickleball nets. Nets are not available onsite." Free and first come inside the window, or reservable at $10 an hour. The park is 65.2 acres in North Boulder with restrooms open year-round on limited winter hours, a dog park, playgrounds and programmed sports fields. Lighting and surface are not stated.',
  },
]

const EXCLUDED = [
  {
    name: 'Tom Watson Park',
    spec: '4', context: ['4', 'Tom Watson Park'],
    reasons: [
      'The City\'s Racket Sports page lists Tom Watson Park under "Additional Tennis Courts" with the figure 4, which is a count of tennis courts. It appears nowhere in the pickleball table and the City states no pickleball count for it anywhere on the pages read. The imported dataset carries twelve pickleball courts for it; an imported number is not a stated one.',
    ],
  },
  {
    name: 'East Boulder Community Park',
    spec: 'East Boulder Community Park Court Lights', context: null,
    reasons: [
      'Appears on the Racket Sports page only as a lighting note - "East Boulder Community Park Court Lights" - and as a project link, "East Boulder Community Park - Racket Courts". No court count is stated. It is a separate site from the East Boulder Community Center, which publishes.',
    ],
  },
]

/* ---------------------------------------------------------------- */

const snapshotPath = name => `data/sources/boulder/${name}.html`

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

/* City-wide statements every venue leans on. */
for (const [page, needle, what] of [
  ['racket-sports', FREE, 'free and first-come sentence'],
  ['racket-sports', RENTAL, 'rental fee'],
  ['racket-sports', DROP_IN_FREE, 'free drop-in sentence'],
  ['racket-sports', ON_TENNIS, 'courts-are-tennis-courts sentence'],
  ['racket-sports', LIGHTS, 'lights-not-guaranteed sentence'],
  ['racket-sports', 'Pickleball nets should be rolled off tennis courts after completion of play and when not in use.', 'nets rule'],
  ['pickleball', INDOOR_FEE, 'indoor fee sentence'],
  ['pickleball', INDOOR_NETS, 'indoor nets sentence'],
  ['pickleball', SBRC_NO_SUMMER, 'South Boulder summer footnote'],
  ['racket-sports-faqs', FAQ_FREE, 'FAQ free sentence'],
  ['racket-sports-faqs', '$10 per hour, per court (both tennis and pickleball).', 'FAQ fee'],
]) {
  must(page, 'Boulder', needle, what)
}

/*
  The table, asserted as a block under its heading. The heading "Outdoor
  court layout and location" must come before the "COURTS / pickleball /
  NETS / LOCATION" header, and each venue's row must appear in order.
*/
const racket = linesOf(snapshotPath('racket-sports'))
const headingAt = racket.findIndex(l => squeeze(l) === squeeze(OUTDOOR_HEADING))
const tableAt = racket.findIndex((l, i) => i > headingAt && squeeze(l) === 'COURTS' && squeeze(racket[i + 1]) === 'pickleball' && squeeze(racket[i + 2]) === 'NETS' && squeeze(racket[i + 3]) === 'LOCATION')
if (headingAt < 0 || tableAt < 0) throw new Error('The Racket Sports page no longer carries the pickleball table under "Outdoor court layout and location".')
const tableEnd = racket.findIndex((l, i) => i > tableAt && squeeze(l) === 'AdditionalTennisCourts')
if (tableEnd < 0) throw new Error('The pickleball table no longer ends at "Additional Tennis Courts".')
const tableLines = racket.slice(tableAt + 4, tableEnd).map(squeeze)
const expected = VENUES.flatMap(p => p.tableRow.map(squeeze))
if (tableLines.join('|') !== expected.join('|')) {
  throw new Error(`The pickleball table has changed. Expected ${JSON.stringify(expected)}, page reads ${JSON.stringify(tableLines)}.`)
}

/* The refusals. */
{
  const at = racket.findIndex((l, i) => i > tableEnd && squeeze(l) === '4' && squeeze(racket[i + 1] ?? '') === 'TomWatsonPark')
  if (at < 0) throw new Error('Tom Watson Park is no longer listed with "4" under Additional Tennis Courts. Re-read it.')
  if (racket.some(l => /Tom Watson[^.]{0,80}pickleball|pickleball[^.]{0,80}Tom Watson/i.test(l))) {
    throw new Error('The Racket Sports page now says something about pickleball at Tom Watson Park. Re-read it.')
  }
  must('racket-sports', 'East Boulder Community Park', 'East Boulder Community Park Court Lights', 'lighting note')
}

const counties = JSON.parse(
  readFileSync(join(REPO_ROOT, 'data/sources/boulder-county-census.json'), 'utf8'))

const identityRegistry = loadIdentity(REPO_ROOT)
const allRows = loadRows().map(r => mapRow(r).venue)
const bySlug = new Map(
  allRows.filter(v => v.city === 'Boulder' && String(v.state).toUpperCase() === 'CO')
    .map(v => [v.slug, v]))

const overlay = {}
const changes = []

for (const p of VENUES) {
  /* Location page: address block and hours. */
  const loc = linesOf(snapshotPath(p.page))
  const addrAt = loc.findIndex((l, i) => squeeze(l) === 'Address' && squeeze(loc[i + 1] ?? '') === squeeze(p.address))
  if (addrAt < 0) throw new Error(`${p.slug}: the location page no longer gives "${p.address}" under Address.`)
  const after = loc.slice(addrAt + 2, addrAt + 6).map(squeeze).join('')
  if (!after.startsWith(`Boulder,CO${p.cityZip}`)) {
    throw new Error(`${p.slug}: the address block no longer reads "Boulder, CO ${p.cityZip}" (reads "${loc.slice(addrAt + 2, addrAt + 6).join(' ')}").`)
  }
  if (p.hoursLines) {
    const h = loc.findIndex((l, i) => i > addrAt && squeeze(l) === 'Hours')
    const got = loc.slice(h + 1, h + 1 + p.hoursLines.length).map(squeeze).join('|')
    if (h < 0 || got !== p.hoursLines.map(squeeze).join('|')) {
      throw new Error(`${p.slug}: the location page hours have changed (reads "${loc.slice(h + 1, h + 1 + p.hoursLines.length).join(' ')}").`)
    }
  }
  must(p.page, p.slug, 'Pickleball', 'Pickleball in the amenity list')
  must(p.page, p.slug, 'Restroom', 'restroom in the amenity list')
  if (p.indoorQuote) must('pickleball', p.slug, p.indoorQuote, 'indoor drop-in line')
  if (p.outdoorQuote) must('pickleball', p.slug, p.outdoorQuote, 'outdoor drop-in line')
  if (p.slug === 'south-boulder-recreation-center') must(p.page, p.slug, SBRC_CLOSURE, 'resurfacing closure')
  if (p.slug === 'north-boulder-rec-center') must('racket-sports', p.slug, 'Two platform tennis courts with pickleball lines are available for overflow at NBRC.', 'platform-tennis overflow note')
  if (p.slug === 'chautauqua-park') must(p.page, p.slug, 'Paid Parking in effect Memorial weekend to Labor Day', 'parking note')
  if (p.netsQuote) must(p.page, p.slug, p.netsQuote, 'nets sentence')
  if (p.foothillsQuote) { must(p.page, p.slug, p.foothillsQuote, 'four-courts sentence'); must(p.page, p.slug, p.foothillsHours, 'morning window') }

  const geo = counties[p.geo]
  if (!geo?.matched) throw new Error(`${p.slug}: no address resolver matched its address`)
  if (!geo.place_matches_city) throw new Error(`${p.slug}: the resolver places this at "${geo.place}", not Boulder.`)
  if (geo.postal_code !== p.cityZip) throw new Error(`${p.slug}: the resolver's postcode ${geo.postal_code} differs from the City's ${p.cityZip}.`)

  const docRacket = new SourceDocument({url: RACKET, retrieved_at: RETRIEVED_AT, tier: 1, publisher: CITY, format: 'html'})
  const docPb = new SourceDocument({url: PICKLEBALL, retrieved_at: RETRIEVED_AT, tier: 1, publisher: CITY, format: 'html'})
  const docLoc = new SourceDocument({url: `${LOC_BASE}/${p.page}`, retrieved_at: RETRIEVED_AT, tier: 1, publisher: CITY, format: 'html'})
  const docCensus = new SourceDocument({url: CENSUS_URL, retrieved_at: RETRIEVED_AT, tier: 1, publisher: 'US Census Bureau', format: 'json'})

  const shell = {
    slug: p.slug, name: null, city: 'Boulder', state: 'CO', county: null,
    postal_code: null, street_address: null, latitude: null, longitude: null,
    status: 'pending', source_url: null, date_checked: null, verified_by: null,
    claimed_by_owner: false, claim_date: null,
    rating: null, user_rating: null, review_count: null, claimed_or_verified: null,
    source_sport: 'pickleball',
  }
  for (const f of PUBLISHED_FACT_FIELDS) shell[f] = null
  const imported = p.importedSlug ? bySlug.get(p.importedSlug) : undefined
  const venue = imported ?? shell

  const rowText = `"${p.tableRow.join(' / ')}"`
  const total = p.outdoor + (p.indoor ?? 0)

  const facts = [
    docLoc.fact('name', p.name, {
      evidence: `Named "${p.name}" on the City's location page and in the Racket Sports table.` +
        (p.slug === 'east-boulder-recreation-center' ? ' The City\'s pickleball page calls the same building "East Boulder Recreation Center".' : ''),
    }),
    docRacket.fact('total_courts', total, {
      evidence: p.indoor
        ? `${p.outdoor} outdoor from the Racket Sports table, ${rowText}, plus ${p.indoor} indoor from the pickleball page's drop-in line "${p.indoorQuote}". ${total} is the sum of the City's two figures.`
        : p.foothillsQuote
          ? `The Racket Sports table, ${rowText}, and the park's own page: "${p.foothillsQuote}"`
          : `The Racket Sports table: ${rowText}.`,
    }),
    docRacket.fact('outdoor_courts', p.outdoor, {
      evidence: `The table sits under the heading "${OUTDOOR_HEADING}" and the City says "${ON_TENNIS}"` +
        (p.outdoorQuote ? ` The pickleball page's drop-in schedule also calls them outdoor: "${p.outdoorQuote}".` : '') +
        (p.slug === 'south-boulder-recreation-center' ? ' The table says eight; the drop-in line sets aside six. Eight is the inventory and publishes.' : ''),
    }),
    docLoc.fact('street_address', p.address, {
      evidence: `"${p.address} / Boulder, CO ${p.cityZip}" under Address on the City's location page.`,
    }),
    docLoc.fact('venue_type', p.type, {
      evidence: p.type === 'community_center' ? 'A City of Boulder recreation centre with outdoor courts beside it and a gymnasium inside.' : `Published by the ${CITY} among its parks.`,
    }),
    docRacket.fact('fee_type', 'free', {
      evidence: `"${FREE}" and "${DROP_IN_FREE}" The FAQ: "${FAQ_FREE}"`,
    }),
    docRacket.fact('pricing_notes', p.pricing, {
      evidence: `"${RENTAL}" "${FREE}"` + (p.indoor ? ` "${INDOOR_FEE}"` : '') + (p.slug === 'chautauqua-park' ? ' The park page: "Paid Parking in effect Memorial weekend to Labor Day".' : ''),
    }),
    docRacket.fact('play_format', 'open_play', {
      evidence: `"${FREE}" - first come, with reservation as an option rather than a requirement.`,
    }),
    (p.hoursLines ? docLoc : docLoc).fact('hours_of_operation', p.hours, {
      evidence: p.hoursLines
        ? `Hours on the City's location page: ${p.hoursLines.join(' ')}.` + (p.indoorQuote ? ` Drop-in times from the pickleball page: "${p.indoorQuote}"${p.outdoorQuote ? `, "${p.outdoorQuote}"` : ''}.` : '')
        : `The park's own page: "${p.foothillsHours}"`,
    }),
    docLoc.fact('restroom', true, {evidence: '"Restroom" in the amenity list on the City\'s location page.'}),
    docRacket.fact('court_availability', p.availability, {
      evidence: `From the Racket Sports table ${rowText}, the pickleball page's drop-in schedule, and the City's location page.`,
    }),
    docCensus.fact('county', geo.county, {
      evidence: `${geo.county} County, CO${geo.county_fips ? ` (FIPS ${geo.state_fips}${geo.county_fips})` : ''}. ${geo.basis} The resolver also places it in the incorporated place "${geo.place}", which is what allows it to be published under Boulder.`,
    }),
    docCensus.fact('postal_code', geo.postal_code, {evidence: geo.basis}),
  ]
  if (p.indoor) {
    facts.push(docPb.fact('indoor_courts', p.indoor, {
      evidence: `"Drop-in pickleball is offered inside our recreation center basketball gymnasiums." and the drop-in line for this centre: "${p.indoorQuote}"` +
        (p.slug === 'south-boulder-recreation-center' ? ` "${SBRC_NO_SUMMER}"` : ''),
    }))
  }
  if (p.netsQuote) {
    facts.push(docLoc.fact('nets_provided', false, {
      evidence: `A stated negative on the park's own page: "${p.netsQuote}"`,
    }))
  }
  if (p.parking) {
    facts.push(docLoc.fact('parking', p.parking, {
      evidence: 'The park page: "Paid Parking in effect Memorial weekend to Labor Day" and "Park-to-Park provides free satellite parking and shuttle service."',
    }))
  }

  const res = applyFacts(venue, facts)

  overlay[p.slug] = {
    minted: !imported,
    identity: {
      name: p.name, city: 'Boulder', state: 'CO',
      county: geo.county, postal_code: geo.postal_code ?? null,
      latitude: geo.lat ?? null, longitude: geo.lon ?? null,
      imported_slug: p.importedSlug ?? null,
      canonical_slug: identityRegistry.renames[p.importedSlug]?.canonical ?? p.slug,
    },
    match: {
      source_page: RACKET, quote: p.tableRow.join(' / '),
      basis: imported
        ? `Matched to the imported ${p.importedSlug} row in Boulder, CO, at the same street address.`
        : 'No imported row under this name at this address with a matching slug. Two imported rows describe these courts (foothills-park-pickleball-courts at 800 Cherry Ave and foothill-community-park at 700 Cherry Ave) and are left pending; the venue is minted here under the City\'s own name from its own pages.',
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

const totalCourts = Object.values(overlay).reduce((a, e) => a + e.patch.total_courts, 0)
const outdoorCourts = Object.values(overlay).reduce((a, e) => a + (e.patch.outdoor_courts ?? 0), 0)
const indoorCourts = Object.values(overlay).reduce((a, e) => a + (e.patch.indoor_courts ?? 0), 0)

for (const [slug, entry] of Object.entries(overlay)) {
  const {total_courts: t, indoor_courts: i, outdoor_courts: o} = entry.patch
  if (i != null && o != null && t !== i + o) throw new Error(`Rule 13: ${slug} does not sum.`)
}

const METHOD_NOTE =
  'Boulder states its outdoor pickleball counts in one table on the City\'s Racket Sports page, under the heading "Outdoor court layout and location" - "4 pickleball / 4 tennis / Rolling / North Boulder Recreation Center" and four more rows - and prices every row in one sentence: "Courts are first come and free to all park visitors, a reserved court is available to secure your date and time." Reserving costs $10 an hour. That makes Boulder the fourth city on this site whose operator writes the word free. The pickleball page adds three indoor courts in each of the three recreation-centre gymnasiums at scheduled drop-in times, "included with your daily entry fee or pass", which publish on the Tampa precedent that a gym count at scheduled times is a stated count. South Boulder\'s table says eight courts and its drop-in line sets aside six; eight publishes and both are asserted. South Boulder\'s outdoor courts were closed for resurfacing when this run was made and publish as closed. Foothills Community Park is four courts on an inline hockey rink with a 7 a.m. to noon window and the only stated nets answer in the city: "Nets are not available onsite." Nothing is claimed about lighting - "Lights are not guaranteed for use of courts after sunset" is not a lighting fact - or surface. Tom Watson Park (a tennis figure only) and East Boulder Community Park (a lighting note only) are refused for stating no pickleball count.'

mkdirSync(join(REPO_ROOT, 'data/verified'), {recursive: true})
writeFileSync(join(REPO_ROOT, 'data/verified/boulder-co.json'), JSON.stringify({
  city: 'Boulder', state: 'CO', retrieved_at: RETRIEVED_AT,
  method_note: METHOD_NOTE,
  sources: [
    {url: RACKET, publisher: CITY, tier: 1, format: 'html', snapshot: snapshotPath('racket-sports')},
    {url: PICKLEBALL, publisher: CITY, tier: 1, format: 'html', snapshot: snapshotPath('pickleball')},
    {url: FAQS, publisher: CITY, tier: 1, format: 'html', snapshot: snapshotPath('racket-sports-faqs')},
    ...VENUES.map(p => ({url: `${LOC_BASE}/${p.page}`, publisher: CITY, tier: 1, format: 'html', snapshot: snapshotPath(p.page)})),
    {url: CENSUS_URL, publisher: 'US Census Bureau', tier: 1, format: 'json', snapshot: 'data/sources/boulder-county-census.json'},
  ].map((s, i) => ({id: `S${i + 1}`, ...s})),
  totals: {
    venues: VENUES.length, courts: totalCourts,
    outdoor: outdoorCourts, indoor: indoorCourts,
    lit_courts: null, free_venues: VENUES.length,
  },
  excluded: EXCLUDED.map(e => ({name: e.name, why: e.reasons})),
  venues: overlay,
}, null, 2) + '\n')

const changed = changes.filter(r =>
  r.old_value !== null && r.old_value !== undefined && String(r.old_value) !== String(r.new_value))

writeFileSync(join(REPO_ROOT, 'reports', 'boulder-conflicts.md'), [
  '# Boulder verification - one table, free in a sentence, and indoor courts at drop-in times', '',
  `Run ${RETRIEVED_AT}. ${VENUES.length} venues published, ${totalCourts} courts (${outdoorCourts} outdoor, ${indoorCourts} indoor). ${EXCLUDED.length} venues refused.`, '',
  'Boulder is the first city in Colorado on this site and the first in Boulder County.', '',
  '| venue | courts | out | in | table row | address |',
  '| --- | ---: | ---: | ---: | --- | --- |',
  ...VENUES.map(p => `| \`${p.slug}\` | ${overlay[p.slug].patch.total_courts} | ${p.outdoor} | ${p.indoor ?? '-'} | "${p.tableRow.join(' / ')}" | ${p.address}, ${p.cityZip} |`),
  '',
  '## South Boulder: eight on the table, six in the drop-in line', '',
  'The Racket Sports table reads "8 pickleball / 4 tennis"; the pickleball page\'s outdoor drop-in schedule reads',
  '"Monday through Sunday: 8:30 to 11:30 am on 6 outdoor courts". Eight is the inventory and publishes; six is what the',
  'City sets aside for the morning session. Both lines are asserted, and the venue page prints both.',
  '',
  '## Published as closed', '',
  `South Boulder Recreation Center: "${SBRC_CLOSURE}" The run was made ${RETRIEVED_AT}; the notice is asserted and the build fails when the City removes it.`,
  '',
  '## Refused', '',
  ...EXCLUDED.flatMap(e => [`**${e.name}**`, '', ...e.reasons.map((r, i) => `${i + 1}. ${r}`), '']),
  '## What Boulder does not say', '',
  '- **lighting.** "Lights are not guaranteed for use of courts after sunset" is a rule, not a per-venue answer. Null everywhere.',
  '- **surface.**',
  '- **nets**, except at Foothills, where "Nets are not available onsite" is stated. The table\'s "Rolling" column is a label.',
  '',
  changed.length ? '## Values a source changed' : '_No imported row was overwritten._',
  ...(changed.length ? [
    '', '| venue | field | was | now | outcome |', '| --- | --- | --- | --- | --- |',
    ...changed.map(r => `| \`${r.venue_slug}\` | ${r.field} | ${JSON.stringify(r.old_value)} | ${JSON.stringify(r.new_value)} | ${r.outcome} |`),
  ] : []),
  '',
].join('\n'))

console.log(`\nBoulder, CO - ${VENUES.length} venues, ${totalCourts} courts (${outdoorCourts} outdoor, ${indoorCourts} indoor), retrieved ${RETRIEVED_AT}`)
for (const p of VENUES) {
  const o = overlay[p.slug]
  console.log(`  ${o.patch.name.padEnd(32)} ${String(o.patch.total_courts).padStart(2)} | out ${String(o.patch.outdoor_courts).padStart(2)} in ${String(o.patch.indoor_courts ?? '-').padStart(2)} | free | ${o.patch.county} County | via ${counties[p.geo].resolver}`)
}
console.log(`\n  refused: ${EXCLUDED.map(e => e.name).join(', ')}`)
console.log('\nWrote data/verified/boulder-co.json and reports/boulder-conflicts.md\n')
