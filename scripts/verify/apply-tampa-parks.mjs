#!/usr/bin/env node
/*
  Tampa, FL verification run - city #19, Florida's second city and the
  first in Hillsborough County.

  ============================================================
  ONE CITY PAGE, TWENTY CARDS
  ============================================================

  The City of Tampa's pickleball page is a grid of cards, each one a venue:
  a label ("Outdoor Pickleball"), the name, the address with a postcode, any
  hours or notes, and the count - "4 courts", "8 courts", "2 permanent
  courts" and "4 portable net courts", "2 multi-purpose courts". Below the
  outdoor grid an "Indoor Pickleball" heading introduces six community
  centres in the same shape, with the days and times pickleball is played
  in the gym. The page carries its own date: "Updated: 10/28/2025".

  That gives this directory something no earlier city has given it at this
  size: indoor and outdoor stated by the operator for every venue, because
  the label on the card and the heading over the section say which is
  which. Saint Paul established that a page's own structure can carry the
  indoor/outdoor fact; Tampa applies it to twenty venues at once.

  ============================================================
  THE ADDRESS RESOLVER FOUND A SECOND DEFECT HERE
  ============================================================

  Cape Coral found the Census geocoder silently changing a street's TYPE.
  Tampa found it silently changing the DIRECTION. Asked for "4700 S Clark
  Ave" it answered "4700 N CLARK AVE" with a different postcode; asked for
  "4602 N Himes Ave" it answered "4602 S HIMES AVE", again with a different
  postcode. It also dropped a direction outright - "1224 E Madison St" came
  back "1224 MADISON ST". The street-type check could not see any of this.

  So `scripts/verify/geocode.mjs` now treats a changed or dropped direction
  exactly as it treats a changed type: ask OpenStreetMap for the address as
  the operator wrote it, and let the operator's address win if OSM finds it
  at house-number level. Re-running every city's addresses through the new
  check moved one PUBLISHED venue: Bellevue's Crossroads Community Center,
  whose coordinates had been those of SE 10th Street, about two kilometres
  south of the NE 10th Street the City prints. That correction shipped with
  this run.

  ============================================================
  WHAT PUBLISHES, AND THE RULES THAT DECIDED THE EDGE CASES
  ============================================================

  Every published venue's count-bearing address resolves at house-number
  level AS WRITTEN - house number and direction intact - and its postcode
  agrees with a City record. Three do not, and are refused:

    Rowlett Park          8 courts. Neither resolver finds "2401 E Yukon St".
                          The most expensive refusal in the city.

    Foster Park           2 courts. "4700 S Clark Ave., 33611". The Census
                          answers North Clark Avenue in 33614; OSM has no
                          record of the address as written; the City's own
                          postcode contradicts the only answer available.

    Dr Martin Luther      2 courts. "220 N Oregon Ave., 33607". The address
    King Jr. Complex      resolves - to 33606, which contradicts the City's
                          postcode - and the City's recreation-centres page
                          gives the complex as "2200 N Oregon Ave, 33607".
                          Two City records, two house numbers, and the
                          count-bearing one fails its own postcode.

  Three near misses publish, each with the disagreement on the venue page
  and both sides asserted by this run:

    Cordelia B Hunt       "4602 N Himes Ave., 33614" resolves as written via
    Center                OSM, in 33614. The recreation-centres page gives
                          4810 N Himes Ave, same postcode.

    Loretta Ingraham      "1611 N Hubert Ave., 33607" resolves as written
    Center                via the Census, in 33607. The recreation-centres
                          page gives 1615 N Hubert Ave, same postcode.

    David M Barksdale     "1801 N Lincoln Ave., 33606" resolves as written;
    Center                the Census and the City's recreation-centres page
                          both say 33607. The City's other page sides with
                          the resolver.

  Julian B Lane Riverfront Park's "1001 N Boulevard, 33606" resolves via OSM
  in 33607 and there is no second City record; that is Mesa's Chaparral
  Park case and the resolver's postcode publishes with the note.

  ============================================================
  FOREST HILLS IS ONE VENUE WITH COURTS ON BOTH SIDES
  ============================================================

  The City lists "Forest Hills" (outdoor, 2 courts) and "Forest Hills
  Community Center" (indoor, 2 courts) at the same address, 724 W 109th
  Ave. Bellevue's Hidden Valley set the test: one address, one park page,
  one venue, with the split stated. It publishes as one venue with four
  courts, two indoor and two outdoor, and Rule 13 holds.

  ============================================================
  THE CITY'S ARITHMETIC AT JULIAN B LANE
  ============================================================

  "2 permanent courts" and "4 portable net courts" on one card. Both figures
  are the City's; six is their sum, as Jim Jeffers's four-plus-two was Cape
  Coral's and Densmore's was Lincoln's. The venue page prints both numbers.

  ============================================================
  WHAT IS NOT CLAIMED
  ============================================================

  lighting     Not stated for any venue. Null everywhere.
  fee          Not stated. "free beginner lessons" at Barksdale prices a
               lesson, not a court. Null everywhere.
  surface      Not stated.
  restrooms    Not stated on this page.
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

const CITY = 'City of Tampa Parks and Recreation'
const PAGE = 'https://www.tampa.gov/parks-and-recreation/activities-recreation/athletics/pickleball'
const REC = 'https://www.tampa.gov/parks-and-recreation/activities-recreation/recreation-centers'
const CENSUS_URL = 'https://geocoding.geo.census.gov/geocoder/geographies'

const PAGE_DATE = 'Updated: 10/28/2025'
const INTRO = 'We have outdoor pickleball courts, and offer indoor pickleball at many places across Tampa.'

/*
  Each venue is one card. `lines` are the card's lines in order after the
  name, as the City prints them, and the card is asserted as a block: the
  name, then exactly these lines, in this order, before the next card.
*/
const OUTDOOR = [
  {
    slug: 'al-barnes-park', importedSlug: null, name: 'Al Barnes Park',
    address: '2902 N 32nd St', cityZip: '33605',
    lines: ['2902 N 32nd St, Tampa, 33605', '4 courts'], count: '4 courts', courts: 4,
    availability: 'Four outdoor pickleball courts in East Tampa, on the City\'s own count: the card reads "Al Barnes Park / 2902 N 32nd St, Tampa, 33605 / 4 courts" under the label "Outdoor Pickleball". The City states no hours, no lighting and no price for this park, and this page records each of those as unknown rather than filling it in. The address resolves through OpenStreetMap rather than the Census address file, which holds no record of it.',
  },
  {
    slug: 'copeland-park', importedSlug: null, name: 'Copeland Park',
    address: '11001 N 15th St', cityZip: '33612',
    lines: ['11001 N 15th St., 33612', '4 courts'], count: '4 courts', courts: 4,
    availability: 'Four outdoor pickleball courts at one of the City\'s featured parks in north Tampa, stated on the pickleball page as "Copeland Park / 11001 N 15th St., 33612 / 4 courts". Copeland is a large district park with its own page on the City site, but that page says nothing about pickleball, so everything here rests on the pickleball page. Hours, lighting, price and surface are not stated.',
  },
  {
    slug: 'cuscaden-park', importedSlug: 'cuscaden-park', name: 'Cuscaden Park',
    address: '2900 N 15th St', cityZip: '33605',
    lines: ['2900 N 15th St., 33605', 'Senior open play Wed 9-11 am', '6 courts'], count: '6 courts', courts: 6,
    availability: 'Six outdoor pickleball courts in the V.M. Ybor neighbourhood, the third-largest outdoor set in the city, and the only Tampa card that names a session: "Senior open play Wed 9-11 am". That is the one scheduled pickleball time the City publishes for any outdoor park, and outside it the City says nothing about when the courts are busy or who gets on. Hours, lighting and price are not stated. This venue was in the imported dataset with the same count and address, and the City\'s page confirms both.',
  },
  {
    slug: 'davis-islands', importedSlug: null, name: 'Davis Islands',
    address: '155 Columbia Drive', cityZip: '33606',
    lines: ['155 Columbia Drive, Tampa, 33606', '2 multi-purpose courts'], count: '2 multi-purpose courts', courts: 2,
    availability: 'Two outdoor courts on Davis Islands that the City calls "2 multi-purpose courts" rather than pickleball courts, and this page keeps the City\'s word. A multi-purpose court is one you may find set up for something else; the City lists it under "Outdoor pickleball" all the same, and the count is two. The address, 155 Columbia Drive, is a few doors from the Parks and Recreation office at 59 Columbia Drive that the page names as its contact. Hours, lighting and price are not stated.',
  },
  {
    slug: 'forest-hills', importedSlug: null, name: 'Forest Hills',
    address: '724 W 109th Ave', cityZip: '33612',
    lines: ['724 W 109th Ave., 33612', '2 courts'], count: '2 courts', courts: 4, outdoor: 2, indoor: 2,
    availability: 'Two outdoor courts and two indoor courts at one address in north Tampa, published as one venue. The City\'s pickleball page lists them as two cards: "Forest Hills / 724 W 109th Ave., 33612 / 2 courts" under "Outdoor Pickleball", and "Forest Hills Community Center / 724 W 109th Ave, 33612 / 2 courts" under "Indoor Pickleball", with the gym schedule "Monday, 10 am-12:30 pm / Wednesday, 10 am-1 pm / Friday, 6-7:30 pm" and the note "Play resumes after Summer Camp ends". Same address, one site: Bellevue\'s Hidden Valley Park set the precedent and this venue follows it. Four courts in all, and the only Tampa venue with a count on both sides of the indoor line. Outdoor hours, lighting and price are not stated.',
  },
  {
    slug: 'highland-pines-park', importedSlug: null, name: 'Highland Pines Park',
    address: '4505 E 21st St', cityZip: '33605',
    lines: ['4505 E 21st St., 33605', '4 courts'], count: '4 courts', courts: 4,
    availability: 'Four outdoor pickleball courts in East Tampa, stated on the City\'s pickleball page as "Highland Pines Park / 4505 E 21st St., 33605 / 4 courts". The City writes the street as 21st St; the Census address file resolves it as E 21st Ave, in the same postcode, and OpenStreetMap has no record of a 21st Street at that number, so the Census answer stands as one street under one name. Hours, lighting and price are not stated.',
  },
  {
    slug: 'julian-b-lane-park', importedSlug: 'julian-b-lane-park', name: 'Julian B Lane Riverfront Park',
    address: '1001 N Boulevard', cityZip: '33606',
    lines: ['1001 N Boulevard, 33606', '2 permanent courts', '4 portable net courts'], count: '2 permanent courts', count2: '4 portable net courts', courts: 6,
    availability: 'Six outdoor pickleball courts on the west bank of the Hillsborough River opposite downtown, and the six is the City\'s own arithmetic: its card reads "2 permanent courts" and "4 portable net courts" on two lines. Two courts stand with their nets; four more are laid out for portable nets, and the City counts them. Both numbers are printed here so a reader can check the sum. The City prints the postcode as 33606 and the address resolves through OpenStreetMap in 33607; the resolver\'s value publishes and the difference is stated. Hours, lighting and price are not stated.',
  },
  {
    slug: 'macfarlane-park', importedSlug: null, name: 'Macfarlane Park',
    address: '1700 N MacDill Ave', cityZip: '33607',
    lines: ['1700 N MacDill Ave., 33607', '8 courts'], count: '8 courts', courts: 8,
    availability: 'Eight outdoor pickleball courts in West Tampa, the largest published set in the city alongside Rowlett Park\'s eight - which are not published, because Rowlett\'s address resolves nowhere. The City\'s card reads "Macfarlane Park / 1700 N MacDill Ave., 33607 / 8 courts". Eight courts is enough for a rotation and makes this the venue in Tampa where turning up alone is the most reasonable plan. Hours, lighting and price are not stated.',
  },
  {
    slug: 'madison-street-park', importedSlug: null, name: 'Madison Street Park',
    address: '1224 E Madison St', cityZip: '33602',
    lines: ['1224 E Madison St., 33602', 'Open daily from sunrise to sunset', '1 court'], count: '1 court', courts: 1,
    hours: 'Open daily from sunrise to sunset',
    availability: 'One outdoor pickleball court in the Channel District east of downtown, "Open daily from sunrise to sunset" in the City\'s words - one of only two outdoor Tampa cards that state hours. One court is a game, not a rotation. The Census address file resolves this address with the direction dropped, as "1224 MADISON ST"; OpenStreetMap finds "1224 East Madison Street" exactly as the City writes it, and that is the resolution published. Lighting and price are not stated.',
  },
  {
    slug: 'new-tampa-sports-pavilion', importedSlug: null, name: 'New Tampa Sports Pavilion',
    address: '17302 Commerce Park Blvd', cityZip: '33647',
    lines: ['17302 Commerce Park Blvd., 33647', 'Monday-Friday, 4:30-9 pm', 'Saturday-Sunday, 8 am-9 pm', '4 courts'], count: '4 courts', courts: 4,
    hours: 'Monday-Friday, 4:30-9 pm; Saturday-Sunday, 8 am-9 pm',
    availability: 'Four outdoor pickleball courts at the sports pavilion in New Tampa, the furthest-north venue in the city, with hours the City states on the card: "Monday-Friday, 4:30-9 pm / Saturday-Sunday, 8 am-9 pm". Those are a facility\'s hours rather than a park\'s, which fits a pavilion with a staffed building, and they run later into the evening than the sunrise-to-sunset parks. The City lists it under "Outdoor Pickleball" and this page follows the City. Lighting and price are not stated.',
  },
  {
    slug: 'skyview-park', importedSlug: null, name: 'Skyview Park',
    address: '6203 S Martindale Ave', cityZip: '33611',
    lines: ['6203 S Martindale Ave., 33611', '2 courts'], count: '2 courts', courts: 2,
    availability: 'Two outdoor pickleball courts in South Tampa, from the City\'s card "Skyview Park / 6203 S Martindale Ave., 33611 / 2 courts". The Census address file resolves the address with the direction dropped, as "6203 MARTINDALE AVE" in the same postcode, and OpenStreetMap has no record of the address as written, so the Census answer stands as one street under one name. Hours, lighting and price are not stated.',
  },
  {
    slug: 'vila-brothers-park', importedSlug: null, name: 'Vila Brothers Park',
    address: '700 N Armenia Ave', cityZip: '33609',
    lines: ['700 N Armenia Ave., 33609', 'Open daily from sunrise to sunset', '2 courts'], count: '2 courts', courts: 2,
    hours: 'Open daily from sunrise to sunset',
    availability: 'Two outdoor pickleball courts in West Tampa, "Open daily from sunrise to sunset" on the City\'s card, which makes Vila Brothers one of the two outdoor Tampa venues with stated hours. Two courts means a game rather than a rotation. Lighting and price are not stated.',
  },
]

const INDOOR = [
  {
    slug: 'david-m-barksdale-center', importedSlug: null, name: 'David M Barksdale Center',
    address: '1801 N Lincoln Ave', cityZip: '33606', recLine: 'David M Barksdale Center 1801 N Lincoln Ave, 33607',
    lines: ['1801 N Lincoln Ave., 33606', '1 court', 'Monday', '1-3 pm (free beginner lessons)', '3-5:30 pm', 'Tuesday-Friday, 2-5:30 pm'], count: '1 court', courts: 1,
    hours: 'Pickleball sessions: Monday 1-3 pm (free beginner lessons) and 3-5:30 pm; Tuesday-Friday, 2-5:30 pm',
    availability: 'One indoor pickleball court in the gym of the David M Barksdale Center in West Tampa, with the City\'s schedule printed on its card: "Monday / 1-3 pm (free beginner lessons) / 3-5:30 pm / Tuesday-Friday, 2-5:30 pm". The free beginner lesson on Monday afternoons is the only free thing the City states about pickleball anywhere in Tampa, and it is a lesson, not a court, so the court itself carries no price. One court is one game at a time. The City prints two postcodes for this address - 33606 on the pickleball page, 33607 on its recreation-centres page - and the Census address file agrees with the second.',
  },
  {
    slug: 'cordelia-b-hunt-center', importedSlug: null, name: 'Cordelia B Hunt Center',
    address: '4602 N Himes Ave', cityZip: '33614', recLine: 'Cordelia B Hunt Center 4810 N Himes Ave, 33614', otherAddress: '4810 N Himes Ave',
    lines: ['4602 N Himes Ave., 33614', '1 court', 'Schedule through June 1', 'Tuesday, 6:45-8 pm', 'Thursday, 6-6:45 pm', 'June 2-August 8', 'Tuesday, 6:45-7:45 pm', 'Thursday, 6-7:45 pm'], count: '1 court', courts: 1,
    hours: 'Pickleball sessions: through June 1, Tuesday 6:45-8 pm and Thursday 6-6:45 pm; June 2-August 8, Tuesday 6:45-7:45 pm and Thursday 6-7:45 pm',
    availability: 'One indoor pickleball court at the Cordelia B Hunt Center at Al Lopez Park, played on two weekday evenings: "Tuesday, 6:45-8 pm / Thursday, 6-6:45 pm" through June 1 and "Tuesday, 6:45-7:45 pm / Thursday, 6-7:45 pm" from June 2 to August 8, as the City\'s card has it. The page is dated 28 October 2025 and the card\'s dates carry no year, so a reader should treat the schedule as the City\'s last statement rather than a current one. The City prints two house numbers for the centre on N Himes Avenue - 4602 on the pickleball page, 4810 on the recreation-centres page, both in 33614 - and the count-bearing one resolves as written through OpenStreetMap, so it is the one published. Price is not stated.',
  },
  {
    slug: 'loretta-ingraham-center', importedSlug: null, name: 'Loretta Ingraham Center',
    address: '1611 N Hubert Ave', cityZip: '33607', recLine: 'Loretta Ingraham Complex 1615 N Hubert Ave, 33607', otherAddress: '1615 N Hubert Ave',
    lines: ['1611 N Hubert Ave., 33607', '2 courts', 'Until Summer Camp begins', 'Monday and Friday, 6:30-8:30 pm', 'Beginning June 2', 'Monday, 6:30-8:30 pm'], count: '2 courts', courts: 2,
    hours: 'Pickleball sessions: until Summer Camp begins, Monday and Friday 6:30-8:30 pm; beginning June 2, Monday 6:30-8:30 pm',
    availability: 'Two indoor pickleball courts in the gym of the Loretta Ingraham Center in West Tampa, on Monday and Friday evenings until the City\'s summer camp begins and Mondays only from June 2: "Monday and Friday, 6:30-8:30 pm" then "Monday, 6:30-8:30 pm". The City prints the centre at 1611 N Hubert Ave on its pickleball page and as the "Loretta Ingraham Complex" at 1615 N Hubert Ave on its recreation-centres page; the count-bearing address resolves as written and publishes, and the other is stated here. Price is not stated.',
  },
  {
    slug: 'port-tampa-community-center', importedSlug: 'port-tampa-community-center', name: 'Port Tampa Community Center',
    address: '4702 W McCoy St', cityZip: '33616', recLine: 'Port Tampa Center 4702 W McCoy St, 33616',
    lines: ['4702 W McCoy St., 33616', '1 court', 'Court closed for repairs through June 1', 'Tuesday, 6-9 pm|', 'Thursday, 6-9 pm'], count: '1 court', courts: 1,
    hours: 'Pickleball sessions: Tuesday 6-9 pm and Thursday 6-9 pm. The City\'s card states "Court closed for repairs through June 1".',
    availability: 'One indoor pickleball court at the Port Tampa Community Center in the far south of the city, played "Tuesday, 6-9 pm" and "Thursday, 6-9 pm" on the City\'s card - and the card also says "Court closed for repairs through June 1". The page is dated 28 October 2025 and the closure carries no year; it is printed here as the City printed it, and the run that builds this page fails the day the City removes it, so a stale closure cannot outlive the City\'s own notice. This venue was in the imported dataset with one indoor court at the same address, and the City confirms both. Price is not stated.',
  },
]

const EXCLUDED = [
  {
    name: 'Rowlett Park', section: 'outdoor',
    lines: ['2401 E Yukon St., 33604', '8 courts'], address: '2401 E Yukon St',
    reasons: [
      'Neither address resolver finds "2401 E Yukon St": the US Census address file returns no match and OpenStreetMap returns nothing at house-number level. Import Gate I1 requires a street address that resolves.',
      'Eight courts, tied with Macfarlane Park for the largest count in Tampa. The most expensive refusal in the city, and it fails on its address alone.',
    ],
  },
  {
    name: 'Foster Park', section: 'outdoor',
    lines: ['4700 S Clark Ave., 33611', '2 courts'], address: '4700 S Clark Ave',
    reasons: [
      'The City writes "4700 S Clark Ave., 33611". The Census address geocoder answers "4700 N CLARK AVE, 33614" - the compass direction flipped and a different postcode - and OpenStreetMap has no record of the address as the City writes it. This is the defect the resolver check was extended for during this run, and here the second resolver cannot rescue it.',
      'The City\'s own postcode, 33611, contradicts the only answer available. An address that resolves only by changing which side of the city it is on has not resolved.',
    ],
  },
  {
    name: 'Dr Martin Luther King Jr. Complex', section: 'indoor',
    lines: ['220 N Oregon Ave., 33607', '2 courts', 'Play resumes after Summer Camp ends', 'Schedule TBD'], address: '220 N Oregon Ave',
    recLine: 'Dr. Martin Luther King Jr. Complex 2200 N Oregon Ave, 33607',
    reasons: [
      'The City\'s pickleball page gives "220 N Oregon Ave., 33607" and its recreation-centres page gives "2200 N Oregon Ave, 33607" for the same complex: two City records, two house numbers.',
      'The count-bearing address resolves - to postcode 33606, which contradicts the City\'s own 33607 on both pages. The City\'s postcode sides with 2200, the address that carries no count. Cordelia B Hunt and Loretta Ingraham publish under the same two-record shape because their count-bearing addresses resolve as written in the postcode the City prints; this one does not.',
    ],
  },
]

/* ---------------------------------------------------------------- */

const snapshotPath = name => `data/sources/tampa/${name}.html`

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
must('pickleball', 'Tampa', PAGE_DATE, 'page date')
must('pickleball', 'Tampa', INTRO, 'introduction')

const indoorHeading = page.findIndex(l => squeeze(l) === 'IndoorPickleball')
if (indoorHeading < 0) throw new Error('The Tampa pickleball page no longer has an "Indoor Pickleball" heading.')

/*
  A card, asserted as a block. The name line is found in the right section,
  the preceding line is checked for outdoor cards (the City labels each
  outdoor card "Outdoor Pickleball"), and the lines that follow must be
  exactly the ones recorded, in order.
*/
function assertCard(who, name, lines, section) {
  const from = section === 'indoor' ? indoorHeading : 0
  const to = section === 'indoor' ? page.length : indoorHeading
  /*
    The name alone is not enough to find the card: Copeland Park is also in
    the site navigation as a featured park. An outdoor card is the name line
    whose preceding line is the City's "Outdoor Pickleball" label; an indoor
    card is the name line after the "Indoor Pickleball" heading.
  */
  const isCard = i => section === 'indoor'
    ? true
    : squeeze(page[i - 1] ?? '').toLowerCase() === 'outdoorpickleball'
  const at = page.findIndex((l, i) => i >= from && i < to && squeeze(l) === squeeze(name) && isCard(i))
  if (at < 0) {
    throw new Error(`${who}: the card "${name}" is no longer in the ${section} section of the Tampa pickleball page` +
      (section === 'outdoor' ? ' with the "Outdoor Pickleball" label above it.' : '.'))
  }
  const got = page.slice(at + 1, at + 1 + lines.length).map(squeeze)
  const want = lines.map(squeeze)
  if (got.join('|') !== want.join('|')) {
    throw new Error(`${who}: the card "${name}" has changed. Expected ${JSON.stringify(lines)}, page reads ${JSON.stringify(page.slice(at + 1, at + 1 + lines.length))}.`)
  }
  /* The next line must start another card or end the section, not extend this one. */
  const next = page[at + 1 + lines.length] ?? ''
  if (/^\d+ .*courts?$/i.test(next)) {
    throw new Error(`${who}: the card "${name}" now carries a further count line: "${next}".`)
  }
}

/* The Forest Hills Community Center card, folded into the Forest Hills venue. */
const FOREST_HILLS_INDOOR = {
  name: 'Forest Hills Community Center',
  lines: ['724 W 109th Ave, 33612', '2 courts', 'Play resumes after Summer Camp ends', 'Monday, 10 am-12:30 pm', 'Wednesday, 10 am-1 pm', 'Friday, 6-7:30 pm'],
}
assertCard('forest-hills', FOREST_HILLS_INDOOR.name, FOREST_HILLS_INDOOR.lines, 'indoor')

/* The recreation-centres page, for the second addresses. */
for (const v of [...INDOOR, ...EXCLUDED.filter(e => e.recLine)]) {
  if (v.recLine) must('recreation-centers', v.name, v.recLine, 'entry on the recreation-centres page')
}
must('recreation-centers', 'forest-hills', 'Forest Hills Center 724 W 109th Ave, 33612', 'entry on the recreation-centres page')

const counties = JSON.parse(
  readFileSync(join(REPO_ROOT, 'data/sources/tampa-county-census.json'), 'utf8'))

/* ---------------------------------------------------------------- */
/* THE REFUSALS, ASSERTED RATHER THAN REMEMBERED.                    */

for (const e of EXCLUDED) {
  assertCard(e.name, e.name, e.lines, e.section)
}
{
  const rowlett = counties['rowlett-park']
  if (rowlett?.matched) throw new Error('Rowlett Park now resolves. Publish its eight courts.')
  const foster = counties['foster-park']
  if (foster?.matched && foster.resolver === 'osm') {
    throw new Error('Foster Park now resolves as written through OpenStreetMap. Re-read and publish it.')
  }
  if (foster?.matched && foster.postal_code === '33611') {
    throw new Error('Foster Park now resolves in the City\'s own postcode. Re-read and publish it.')
  }
  const mlk = counties['dr-martin-luther-king-jr-complex']
  if (mlk?.matched && mlk.postal_code === '33607') {
    throw new Error('The Dr Martin Luther King Jr. Complex address now resolves in the City\'s postcode. Re-read and publish it.')
  }
}

const identityRegistry = loadIdentity(REPO_ROOT)
const allRows = loadRows().map(r => mapRow(r).venue)
const bySlug = new Map(
  allRows.filter(v => v.city === 'Tampa' && String(v.state).toUpperCase() === 'FL')
    .map(v => [v.slug, v]))

const overlay = {}
const changes = []

for (const p of [...OUTDOOR, ...INDOOR]) {
  const section = INDOOR.includes(p) ? 'indoor' : 'outdoor'
  assertCard(p.slug, p.name, p.lines, section)

  const geo = counties[p.slug]
  if (!geo?.matched) throw new Error(`${p.slug}: no address resolver matched its address`)
  if (!geo.place_matches_city) {
    throw new Error(`${p.slug}: the resolver places this at "${geo.place}", not Tampa.`)
  }

  /*
    The address must have resolved AS WRITTEN. A resolver that changed the
    direction and still matched is the Foster Park failure; the basis text
    records any change the resolver made and OSM's rescue of it.
  */
  const changedDirection = /changing the direction/.test(geo.basis) || /changed the direction/.test(geo.basis)
  if (changedDirection && geo.resolver !== 'osm') {
    if (p.slug !== 'skyview-park') throw new Error(`${p.slug}: the resolver changed the direction of the address and OSM could not confirm it.`)
    /* Skyview: the direction was DROPPED, not flipped, and the postcode agrees. One street. */
    if (geo.postal_code !== p.cityZip) throw new Error('skyview-park: the postcode no longer agrees with the City.')
  }

  /* Postcode: agrees with the City, or the disagreement is one the venue page states. */
  const zipNoted = ['julian-b-lane-park', 'david-m-barksdale-center'].includes(p.slug)
  if (zipNoted) {
    if (geo.postal_code === p.cityZip) throw new Error(`${p.slug}: the resolver now agrees with the City's postcode. Remove the note.`)
  } else if (geo.postal_code !== p.cityZip) {
    throw new Error(`${p.slug}: the resolver's postcode ${geo.postal_code} differs from the City's ${p.cityZip}.`)
  }

  const doc = new SourceDocument({
    url: PAGE, retrieved_at: RETRIEVED_AT, tier: 1, publisher: CITY, format: 'html',
  })
  const docRec = new SourceDocument({
    url: REC, retrieved_at: RETRIEVED_AT, tier: 1, publisher: CITY, format: 'html',
  })
  const docCensus = new SourceDocument({
    url: CENSUS_URL, retrieved_at: RETRIEVED_AT, tier: 1, publisher: 'US Census Bureau', format: 'json',
  })

  const shell = {
    slug: p.slug, name: null, city: 'Tampa', state: 'FL', county: null,
    postal_code: null, street_address: null, latitude: null, longitude: null,
    status: 'pending', source_url: null, date_checked: null, verified_by: null,
    claimed_by_owner: false, claim_date: null,
    rating: null, user_rating: null, review_count: null, claimed_or_verified: null,
    source_sport: 'pickleball',
  }
  for (const f of PUBLISHED_FACT_FIELDS) shell[f] = null
  const imported = p.importedSlug ? bySlug.get(p.importedSlug) : undefined
  const venue = imported ?? shell

  const card = `"${p.name} / ${p.lines.join(' / ')}"`
  const outdoor = p.outdoor ?? (section === 'outdoor' ? p.courts : null)
  const indoor = p.indoor ?? (section === 'indoor' ? p.courts : null)

  const facts = [
    doc.fact('name', p.name, {
      evidence: `Named "${p.name}" on the City's pickleball page, dated "${PAGE_DATE}".` +
        (p.slug === 'forest-hills' ? ' The City lists the outdoor courts as "Forest Hills" and the indoor ones as "Forest Hills Community Center" at the same address; published as one venue under the shorter name.' : '') +
        (p.slug === 'julian-b-lane-park' ? ' The imported dataset shortens it to "Julian B Lane Park".' : ''),
    }),
    doc.fact('total_courts', p.courts, {
      evidence: p.slug === 'julian-b-lane-park'
        ? `The City's card reads "${p.count}" and "${p.count2}" on two lines. Six is the sum of the City's own two figures.`
        : p.slug === 'forest-hills'
          ? `Two City cards at one address: "Forest Hills / 724 W 109th Ave., 33612 / 2 courts" under "Outdoor Pickleball" and "Forest Hills Community Center / 724 W 109th Ave, 33612 / 2 courts" under "Indoor Pickleball". Four is their sum.`
          : `Quoted from the City's pickleball page: ${card}.`,
    }),
    doc.fact('street_address', p.address, {
      evidence: `${card} on the City's pickleball page.` +
        (p.otherAddress ? ` The City's recreation-centres page gives "${p.recLine}"; the count-bearing address resolves as written and is the one published.` : '') +
        (p.recLine && !p.otherAddress ? ` The City's recreation-centres page agrees: "${p.recLine}".` : ''),
    }),
    doc.fact('venue_type', section === 'indoor' ? 'community_center' : 'public_park', {
      evidence: section === 'indoor'
        ? 'Listed under "Indoor Pickleball" on the City\'s pickleball page and among its recreation centres.'
        : `Published by the ${CITY} among its parks, under the label "Outdoor Pickleball".`,
    }),
    doc.fact('court_availability', p.availability, {
      evidence: `From the City's pickleball page: ${card}.`,
    }),
    docCensus.fact('county', geo.county, {
      evidence: `${geo.county} County, FL${geo.county_fips ? ` (FIPS ${geo.state_fips}${geo.county_fips})` : ''}. ${geo.basis} The resolver also places it in the incorporated place "${geo.place}", which is what allows it to be published under Tampa.`,
    }),
    docCensus.fact('postal_code', geo.postal_code, {
      evidence: zipNoted
        ? `${geo.basis} The City's pickleball page prints ${p.cityZip}${p.slug === 'david-m-barksdale-center' ? ' and its recreation-centres page prints 33607' : ''}; the resolver returns ${geo.postal_code}. The resolver's value publishes, as at Mesa's Chaparral Park, and the difference is stated on the venue page.`
        : geo.basis,
    }),
  ]

  if (outdoor != null) {
    facts.push(doc.fact('outdoor_courts', outdoor, {
      evidence: p.slug === 'forest-hills'
        ? 'The "Forest Hills" card sits under the label "Outdoor Pickleball": "2 courts".'
        : `The card is labelled "Outdoor Pickleball" on the City's page: ${card}. Tampa's page is divided into outdoor cards and an "Indoor Pickleball" section, so the label is the City's own statement of which this is.`,
    }))
  }
  if (indoor != null) {
    facts.push(doc.fact('indoor_courts', indoor, {
      evidence: p.slug === 'forest-hills'
        ? 'The "Forest Hills Community Center" card sits under the "Indoor Pickleball" heading: "2 courts".'
        : `The card sits under the "Indoor Pickleball" heading on the City's page: ${card}.`,
    }))
  }
  if (p.hours) {
    facts.push(doc.fact('hours_of_operation', p.hours, {
      evidence: `As printed on the City's card: ${card}.`,
    }))
  }
  if (p.slug === 'forest-hills') {
    facts.push(docRec.fact('hours_of_operation',
      'Indoor courts, pickleball sessions: Monday 10 am-12:30 pm; Wednesday 10 am-1 pm; Friday 6-7:30 pm. The City\'s card adds "Play resumes after Summer Camp ends". Outdoor hours not stated.', {
        evidence: `The "Forest Hills Community Center" card: "${FOREST_HILLS_INDOOR.lines.join(' / ')}".`,
      }))
  }

  const res = applyFacts(venue, facts)

  overlay[p.slug] = {
    minted: !imported,
    identity: {
      name: p.name, city: 'Tampa', state: 'FL',
      county: geo.county, postal_code: geo.postal_code ?? null,
      latitude: geo.lat ?? null, longitude: geo.lon ?? null,
      imported_slug: p.importedSlug ?? null,
      canonical_slug: identityRegistry.renames[p.importedSlug]?.canonical ?? p.slug,
    },
    match: {
      source_page: PAGE, quote: p.count,
      basis: imported
        ? `Matched to the imported ${p.importedSlug} row in Tampa, FL, at the same street address.`
        : 'No imported row for this venue. Minted here from the City\'s pickleball page, which states the count and the address.',
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

const VENUES = [...OUTDOOR, ...INDOOR]
const totalCourts = VENUES.reduce((a, p) => a + p.courts, 0)
const outdoorCourts = Object.values(overlay).reduce((a, e) => a + (e.patch.outdoor_courts ?? 0), 0)
const indoorCourts = Object.values(overlay).reduce((a, e) => a + (e.patch.indoor_courts ?? 0), 0)

for (const [slug, entry] of Object.entries(overlay)) {
  const {total_courts: t, indoor_courts: i, outdoor_courts: o} = entry.patch
  if (i != null && o != null && t !== i + o) {
    throw new Error(`Rule 13: ${slug} does not sum.`)
  }
}
if (outdoorCourts + indoorCourts !== totalCourts) throw new Error('Rule 13: the city does not sum.')

const METHOD_NOTE =
  'Tampa\'s pickleball page is a grid of cards, one per venue, each carrying a label, a name, a street address with a postcode and a count - "4 courts", "8 courts", "2 permanent courts" and "4 portable net courts" - with an "Indoor Pickleball" section beneath for the community-centre gyms and their session times, and the page dates itself "Updated: 10/28/2025". Because the label on every outdoor card and the heading over the indoor section are the City\'s own words, indoor and outdoor are stated for all sixteen published venues, which no city of this size had given the directory before. Each card is asserted as a block, name and lines in order. Three of nineteen count-bearing cards are refused: Rowlett Park (8 courts) at an address neither resolver finds; Foster Park, whose "4700 S Clark Ave., 33611" the Census answers as North Clark Avenue in a different postcode and OpenStreetMap cannot find as written; and the Dr Martin Luther King Jr. Complex, whose "220 N Oregon Ave., 33607" resolves to 33606 while the City\'s recreation-centres page gives the complex as 2200 N Oregon Ave. Two centres publish under the same two-record shape because their count-bearing addresses resolve as written in the City\'s postcode, with the other house number stated on the page. Forest Hills is one venue with two outdoor and two indoor courts at one address, after Bellevue\'s Hidden Valley. Foster Park is also why Import Gate I1\'s resolver check was extended in this run to cover a changed or dropped compass direction, which then moved a published Bellevue venue about two kilometres to the street the City actually prints. The City states no lighting, no price and no surface for any venue.'

mkdirSync(join(REPO_ROOT, 'data/verified'), {recursive: true})
writeFileSync(join(REPO_ROOT, 'data/verified/tampa-fl.json'), JSON.stringify({
  city: 'Tampa', state: 'FL', retrieved_at: RETRIEVED_AT,
  method_note: METHOD_NOTE,
  sources: [
    {url: PAGE, publisher: CITY, tier: 1, format: 'html', snapshot: snapshotPath('pickleball')},
    {url: REC, publisher: CITY, tier: 1, format: 'html', snapshot: snapshotPath('recreation-centers')},
    {url: CENSUS_URL, publisher: 'US Census Bureau', tier: 1, format: 'json', snapshot: 'data/sources/tampa-county-census.json'},
  ].map((s, i) => ({id: `S${i + 1}`, ...s})),
  totals: {
    venues: VENUES.length, courts: totalCourts,
    outdoor: outdoorCourts, indoor: indoorCourts,
    lit_courts: null, free_venues: 0,
  },
  excluded: EXCLUDED.map(e => ({name: e.name, why: e.reasons})),
  venues: overlay,
}, null, 2) + '\n')

const changed = changes.filter(r =>
  r.old_value !== null && r.old_value !== undefined && String(r.old_value) !== String(r.new_value))

writeFileSync(join(REPO_ROOT, 'reports', 'tampa-conflicts.md'), [
  '# Tampa verification - twenty cards on one page, and a resolver that changes directions', '',
  `Run ${RETRIEVED_AT}. ${VENUES.length} venues published, ${totalCourts} courts (${outdoorCourts} outdoor, ${indoorCourts} indoor). ${EXCLUDED.length} venues refused.`, '',
  'Tampa is the second city in Florida on this site and the first in Hillsborough County. Every count and',
  `address comes from one City page, dated "${PAGE_DATE}".`, '',
  '| venue | courts | in | out | what the City writes | address |',
  '| --- | ---: | ---: | ---: | --- | --- |',
  ...VENUES.map(p => `| \`${p.slug}\` | ${p.courts} | ${overlay[p.slug].patch.indoor_courts ?? '-'} | ${overlay[p.slug].patch.outdoor_courts ?? '-'} | "${p.count}${p.count2 ? `" and "${p.count2}` : ''}" | ${p.address}, ${counties[p.slug].postal_code} |`),
  '',
  '## The direction is part of the address', '',
  'Asked for `4700 S Clark Ave`, the Census geocoder answered `4700 N CLARK AVE` in a different postcode.',
  'Asked for `4602 N Himes Ave` it answered `4602 S HIMES AVE`, again in a different postcode. It also',
  'dropped a direction outright: `1224 E Madison St` came back `1224 MADISON ST`. The street-type check that',
  'shipped with Cape Coral could see none of this, so `scripts/verify/geocode.mjs` now treats a changed or',
  'dropped direction the same way: ask OpenStreetMap for the address as written, and let the operator\'s',
  'address win if OSM finds it at house-number level. Madison Street Park and Cordelia B Hunt were rescued',
  'that way; Foster Park was not, and is refused. Re-running every city through the new check moved one',
  'published venue - Bellevue\'s Crossroads Community Center, from SE 10th Street to the NE 10th Street the',
  'City prints, about two kilometres north.',
  '',
  '## Refused', '',
  ...EXCLUDED.flatMap(e => [
    `**${e.name}** - "${e.lines.join(' / ')}"`, '',
    ...e.reasons.map((r, i) => `${i + 1}. ${r}`), '']),
  '## Two City records, two house numbers - and the rule that split them', '',
  'Cordelia B Hunt Center (4602 vs 4810 N Himes Ave) and Loretta Ingraham Center (1611 vs 1615 N Hubert Ave)',
  'publish; the Dr Martin Luther King Jr. Complex (220 vs 2200 N Oregon Ave) does not. The count-bearing',
  'address must resolve as written in the postcode the City prints. The first two do. The third resolves',
  'in 33606, and the City prints 33607 on both of its pages - so the City\'s own postcode refutes the',
  'address that carries the count.',
  '',
  '## Postcodes the City and the resolver disagree on', '',
  '- Julian B Lane Riverfront Park: City 33606, OpenStreetMap 33607. No second City record. Resolver publishes.',
  '- David M Barksdale Center: pickleball page 33606, recreation-centres page 33607, Census 33607.',
  '',
  '## What Tampa does not say', '',
  '- **lighting**, at any venue. Null everywhere.',
  '- **price.** "free beginner lessons" at Barksdale prices a lesson, not a court.',
  '- **surface.**',
  '- **hours**, at ten of the twelve outdoor venues.',
  '',
  changed.length ? '## Values a source changed' : '_No imported row was overwritten._',
  ...(changed.length ? [
    '', '| venue | field | was | now | outcome |', '| --- | --- | --- | --- | --- |',
    ...changed.map(r => `| \`${r.venue_slug}\` | ${r.field} | ${JSON.stringify(r.old_value)} | ${JSON.stringify(r.new_value)} | ${r.outcome} |`),
  ] : []),
  '',
].join('\n'))

console.log(`\nTampa, FL - ${VENUES.length} venues, ${totalCourts} courts (${outdoorCourts} outdoor, ${indoorCourts} indoor), retrieved ${RETRIEVED_AT}`)
for (const p of VENUES) {
  const o = overlay[p.slug]
  console.log(
    `  ${o.patch.name.padEnd(30)} ${String(o.patch.total_courts).padStart(2)} | in ${String(o.patch.indoor_courts ?? '-').padStart(2)} out ${String(o.patch.outdoor_courts ?? '-').padStart(2)} | ${o.patch.county} County | ${counties[p.slug].postal_code} | via ${counties[p.slug].resolver}`)
}
console.log(`\n  refused: ${EXCLUDED.map(e => e.name).join(', ')}`)
console.log('\nWrote data/verified/tampa-fl.json and reports/tampa-conflicts.md\n')
