#!/usr/bin/env node
/*
  Rockville, MD verification run - city #35, the first in Maryland and the
  first in Montgomery County.

  ============================================================
  ONE TABLE, FOURTEEN ROWS, TWELVE VENUES
  ============================================================

  The City of Rockville's "Pickleball Courts and Programs" page carries,
  under the heading "Outdoor Pickleball Courts", three sentences of rules
  and then a table with the columns Park | Number of Courts | Lighted |
  Court Schedule, one row per park. The count cell is the City's own
  wording, and it distinguishes courts built for pickleball from lines
  painted on tennis courts:

      Broome Athletic Park          "4 Dedicated Pickleball Courts"    Yes
      Calvin Park                   "2 Pickleball Courts (pickleball
                                     lines on 1 tennis court; bring
                                     your own net)"                    No
      Dogwood Park                  "1 Pickleball Court (... use tennis
                                     net)" and "4 Pickleball Courts
                                     (... bring your own net)"         Yes
      Fallsgrove Park               4 on 2 tennis courts               No
      Glenora Park                  4 on 2 tennis courts               No
      Hillcrest Park                2 on 1 tennis court                No
      Isreal Park                   "2 Dedicated" and 2 on 1 tennis    No
      Mattie J.T. Stepanek Park     "4 Dedicated Pickleball Courts"    Yes
      North Farm Park               4 on 2 tennis courts               No
      Potomac Woods Park            4 on 2 tennis courts               No
      Rockcrest Park                "3 Pickleball Courts (bring your
                                     own net)"                         No
      Rockville Civic Center Park   4 on 2 tennis courts               No
      Twinbrook Park                4 on 2 tennis courts               Yes
      Welsh Park                    "2 Dedicated" and 4 on 2 tennis    Yes

  Every row is asserted in order - the park name, each count line, the
  Lighted cell - so an added, dropped, renumbered or re-lit row stops the
  build. Three rows print two count lines; those two counts sum into one
  venue, as Mount Pleasant's Park West and Henderson's Silver Springs do,
  and both lines are quoted in the evidence.

  ============================================================
  ADDRESSES FROM THE PLACE PAGES
  ============================================================

  The table carries no address. Each park has a page at
  rockvillemd.gov/places/<slug>/ with an "Address" heading followed by
  the street line and "Rockville, MD 208xx". Twelve of the fourteen
  resolve in the Census address file, as written, inside "Rockville city",
  Montgomery County. Two do not publish:

  Twinbrook Park   "12920 Twinbrook Parkway" matches nothing in either
                   resolver. Foster Park's rule: a count-bearing address
                   that does not resolve as written is not published. The
                   run throws if it ever resolves, so the venue is re-read.
  Glenora Park     "Dundee Road and Wootton Parkway" is an intersection
                   with no house number, the same shape as the held Tom
                   Brown row in Tallahassee, and Import Gate I1 needs a
                   house number. The run throws if the City ever prints one.

  Three parks resolve in a postcode other than the one the City prints:
  Dogwood (City 20852, Census 20850), Rockcrest (City 20850, Census 20851)
  and Rockville Civic Center Park (City 20850, Census 20851). All three resolved as written - same house number,
  same street, same direction - so this is Mesa's Chaparral Park, not
  Foster Park: the Census value publishes and the disagreement is stated
  on the venue page. The run throws if the resolver ever agrees, so the
  note comes off.

  ============================================================
  WHAT THE CITY STATES, AND HOW IT PUBLISHES
  ============================================================

  outdoor       The heading is "Outdoor Pickleball Courts". By Saint
                Paul's rule the heading is the operator's word, so every
                court in the table publishes as outdoor; indoor stays null.

  lighting      The Lighted column is a stated value per row. "Yes"
                publishes as lit; "No" is a stated negative and publishes
                as not lit, as Huntington Beach's heading did. Five rows
                say Yes, nine say No; nothing is left unstated.

  nets          "bring your own net" is a stated negative: nets_provided
                false. "use tennis net" means a net is on the court. At
                Dogwood one line says each, so nets_provided stays null
                there with both lines quoted. The two dedicated-only rows
                (Broome, Stepanek) say nothing about nets and stay null.

  hours         "Courts are open from dawn to dusk" applies to every
                row; "Lighted courts close at 10 p.m." to the lit ones.

  play_format   "available on a first-come, first-served basis" - open
                play in the City's own sentence, qualified by "City
                recreation programs have priority over the use of the
                courts, so some may be reserved for class use and closed
                to the public."

  fee_type      No price and no "free" anywhere on the page. Null, with
                the first-come and program-priority sentences carried in
                the pricing notes.

  surface       Not stated. Null.

  The page also names Lincoln Park Community Center, Thomas Farm Community
  Center and Twinbrook Community Recreation Center as offering "open gym
  schedules during drop-in hours featuring pickleball" with no count.
  Named, not counted; recorded in the report and not published.

  ============================================================
  THE IMPORT
  ============================================================

  Four published venues match imported rows: broome-athletic-park (same
  address, same count), dogwood-park (same address, 4 courts where the
  City now prints 1 + 4), welsh-park (same address, same count) and
  Mattie J.T. Stepanek Park, imported as king-farm-mattie-j-t-stepanek-park
  at the same address and count and published under the City's name. A
  second imported row, king-farm, describes the same park at "Pleasant
  Drive , Mattie Stepanek Park" with a free price the City does not
  state; it stays pending. north-farm-courts (imported at 916 Farm Haven
  Dr) is not the City's North Farm Park at 601 Farm Pond Lane and stays
  pending; the City's park is minted. The other seven are minted.
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

const CITY = 'City of Rockville Recreation and Parks'
const LIST_URL = 'https://www.rockvillemd.gov/services/pickleball-courts-and-programs/'
const PLACE = slug => `https://www.rockvillemd.gov/places/${slug}/`
const CENSUS_URL = 'https://geocoding.geo.census.gov/geocoder/geographies'
const VERIFIED_PATH = 'data/verified/rockville-md.json'

const HEADING = 'Outdoor Pickleball Courts'
const RULE_OPEN = 'Courts are open from dawn to dusk and are available on a first-come, first-served basis.'
const RULE_PRIORITY = 'City recreation programs have priority over the use of the courts, so some may be reserved for class use and closed to the public.'
const RULE_LIT = 'Lighted courts close at 10 p.m.'
const TABLE_HEAD = ['Park', 'Number of Courts', 'Lighted', 'Court Schedule']
const CENTERS_SENTENCE = 'offer open gym schedules during drop-in hours featuring pickleball and many other sports. No requirement to sign up, just show up and play!'
const CENTERS = ['Lincoln Park Community Center', 'Thomas Farm Community Center', 'Twinbrook Community Recreation Center']

const ON_2 = '(pickleball lines on 2 tennis courts; bring your own net)'
const ON_1 = '(pickleball lines on 1 tennis court; bring your own net)'
const ON_1_TENNIS_NET = '(pickleball lines on 1 tennis court; use tennis net)'

const HOURS_UNLIT = 'Dawn to dusk'
const HOURS_LIT = 'Dawn to dusk; lighted courts close at 10 p.m.'

const PRICING_BASE =
  'The City states no price and does not write the word "free". Its rule for every outdoor court: "Courts are open from dawn to dusk and are available on a first-come, first-served basis. City recreation programs have priority over the use of the courts, so some may be reserved for class use and closed to the public."'

/*
  Each venue: the table row as the City prints it (name, count lines,
  Lighted cell), the split it implies, and the place page's address.
*/
const VENUES = [
  {
    slug: 'broome-athletic-park', importedSlug: 'broome-athletic-park', name: 'Broome Athletic Park', page: 'broome-athletic-park',
    lines: ['4 Dedicated Pickleball Courts'], lighted: 'Yes',
    courts: 4, dedicated: 4, striped: 0, nets: null,
    address: '751 Twinbrook Parkway', cityZip: '20851', zipNoted: false,
    pageQuote: 'Four accessible pickleball courts.',
    availability:
      'Four dedicated pickleball courts at Broome Athletic Park in Twinbrook, lit, from the City\'s outdoor-courts table: "4 Dedicated Pickleball Courts", Lighted "Yes". The park\'s own page says the same thing another way - "Four accessible pickleball courts." - beside two tennis courts and a futsal court, on 7.5 acres next to the site of the former Broome Junior High. Dedicated means courts built for pickleball, not lines on a tennis court, and the City\'s row says nothing about nets, so whether a net is on the court is not stated. Open dawn to dusk, first come, and because the courts are lit they close at 10 p.m. City programs have priority and can close a court for class use. No price is stated. The imported dataset carried the same address and the same four courts.',
  },
  {
    slug: 'calvin-park', importedSlug: null, name: 'Calvin Park', page: 'calvin-park',
    lines: ['2 Pickleball Courts', ON_1], lighted: 'No',
    courts: 2, dedicated: 0, striped: 2, nets: false,
    address: '1248 Gladstone Drive', cityZip: '20851', zipNoted: false,
    availability:
      'Two pickleball courts at Calvin Park in Twinbrook, both painted on one tennis court: the City\'s row reads "2 Pickleball Courts (pickleball lines on 1 tennis court; bring your own net)", Lighted "No". So two games can run on the tennis court at once, with the players\' own nets, and the lighting answer is a stated no rather than silence. Open dawn to dusk, first come; City programs have priority. No price is stated. The City\'s place page puts the park at 1248 Gladstone Drive.',
  },
  {
    slug: 'dogwood-park', importedSlug: 'dogwood-park', name: 'Dogwood Park', page: 'dogwood-park',
    lines: ['1 Pickleball Court', ON_1_TENNIS_NET, '4 Pickleball Courts', ON_2], lighted: 'Yes',
    courts: 5, dedicated: 0, striped: 5, nets: null,
    address: '800 Monroe St.', cityZip: '20852', zipNoted: true,
    availability:
      'Five pickleball courts at Dogwood Park, all painted on tennis courts, lit, from two lines in the City\'s row: "1 Pickleball Court (pickleball lines on 1 tennis court; use tennis net)" and "4 Pickleball Courts (pickleball lines on 2 tennis courts; bring your own net)", Lighted "Yes". The two lines are two arrangements on three tennis courts - one court lined for a single pickleball game played over the tennis net, two courts lined for two games each with the players\' own nets - and they sum to five. Because one line says use the tennis net and the other says bring your own, whether a net is provided is left unstated here. Open dawn to dusk, first come, closing at 10 p.m. under the lights; City programs have priority. No price is stated. The City\'s place page prints the park at 800 Monroe St. in 20852; the Census address file places the same house number in 20850, and the Census value is the one published. The imported dataset carried four courts at this address; the City\'s two lines replace that with five.',
  },
  {
    slug: 'fallsgrove-park', importedSlug: null, name: 'Fallsgrove Park', page: 'fallsgrove-park',
    lines: ['4 Pickleball Courts', ON_2], lighted: 'No',
    courts: 4, dedicated: 0, striped: 4, nets: false,
    address: '700 Fallsgrove Drive', cityZip: '20850', zipNoted: false,
    availability:
      'Four pickleball courts at Fallsgrove Park in the west of the city, painted on two tennis courts: "4 Pickleball Courts (pickleball lines on 2 tennis courts; bring your own net)", Lighted "No". Two games per tennis court, the players\' own nets, and a stated no on lighting. Open dawn to dusk, first come; City programs have priority. No price is stated. The City\'s place page puts the park at 700 Fallsgrove Drive, the same address as the Thomas Farm Community Center, which the City names for drop-in gym pickleball without a count.',
  },
  {
    slug: 'hillcrest-park', importedSlug: null, name: 'Hillcrest Park', page: 'hillcrest-park',
    lines: ['2 Pickleball Courts', ON_1], lighted: 'No',
    courts: 2, dedicated: 0, striped: 2, nets: false,
    address: '1150 Crawford Drive', cityZip: '20851', zipNoted: false,
    availability:
      'Two pickleball courts at Hillcrest Park, painted on one tennis court: "2 Pickleball Courts (pickleball lines on 1 tennis court; bring your own net)", Lighted "No". Players bring a net, and the lighting answer is a stated no. Open dawn to dusk, first come; City programs have priority. No price is stated. The City\'s place page puts the park at 1150 Crawford Drive.',
  },
  {
    slug: 'isreal-park', importedSlug: null, name: 'Isreal Park', page: 'isreal-park',
    lines: ['2 Dedicated Pickleball Courts', '2 Pickleball Courts', ON_1], lighted: 'No',
    courts: 4, dedicated: 2, striped: 2, nets: false,
    address: '357 Frederick Avenue', cityZip: '20850', zipNoted: false,
    availability:
      'Four pickleball courts at Isreal Park - the City spells it that way - from two lines in its row: "2 Dedicated Pickleball Courts" and "2 Pickleball Courts (pickleball lines on 1 tennis court; bring your own net)", Lighted "No". Two courts built for pickleball and two more painted on a tennis court, four in all, unlit by the City\'s own answer. The bring-your-own-net note is on the striped pair; the dedicated pair carries no note, and the venue publishes the stated negative. Open dawn to dusk, first come; City programs have priority. No price is stated. The City\'s place page puts the park at 357 Frederick Avenue, across the street from the Lincoln Park Community Center it names for drop-in gym pickleball.',
  },
  {
    slug: 'mattie-j-t-stepanek-park', importedSlug: 'king-farm-mattie-j-t-stepanek-park', name: 'Mattie J.T. Stepanek Park', page: 'mattie-j-t-stepanek-park',
    lines: ['4 Dedicated Pickleball Courts'], lighted: 'Yes',
    courts: 4, dedicated: 4, striped: 0, nets: null,
    address: '1800 Piccard Drive', cityZip: '20850', zipNoted: false,
    availability:
      'Four dedicated pickleball courts at Mattie J.T. Stepanek Park in King Farm, lit: "4 Dedicated Pickleball Courts", Lighted "Yes". Courts built for pickleball rather than lines on tennis courts, and the City\'s row says nothing about nets. Open dawn to dusk, first come, closing at 10 p.m. under the lights; City programs have priority. No price is stated. The City\'s place page puts the park at 1800 Piccard Drive. The imported dataset carried the park under a King Farm name at the same address with the same four courts, and a second row for the same courts at "Pleasant Drive" with a free price the City does not state; the first is matched and the second stays pending.',
  },
  {
    slug: 'north-farm-park', importedSlug: null, name: 'North Farm Park', page: 'north-farm-park',
    lines: ['4 Pickleball Courts', ON_2], lighted: 'No',
    courts: 4, dedicated: 0, striped: 4, nets: false,
    address: '601 Farm Pond Lane', cityZip: '20852', zipNoted: false,
    availability:
      'Four pickleball courts at North Farm Park, painted on two tennis courts: "4 Pickleball Courts (pickleball lines on 2 tennis courts; bring your own net)", Lighted "No". Two games per tennis court, the players\' own nets, and a stated no on lighting. Open dawn to dusk, first come; City programs have priority. No price is stated. The City\'s place page puts the park at 601 Farm Pond Lane. The imported dataset holds a "North Farm Courts" row at 916 Farm Haven Dr, a different address; it is not this park and stays pending.',
  },
  {
    slug: 'potomac-woods-park', importedSlug: null, name: 'Potomac Woods Park', page: 'potomac-woods-park',
    lines: ['4 Pickleball Courts', ON_2], lighted: 'No',
    courts: 4, dedicated: 0, striped: 4, nets: false,
    address: '2276 Dunster Lane', cityZip: '20854', zipNoted: false,
    availability:
      'Four pickleball courts at Potomac Woods Park in the south-west of the city, painted on two tennis courts: "4 Pickleball Courts (pickleball lines on 2 tennis courts; bring your own net)", Lighted "No". Two games per tennis court, the players\' own nets, and a stated no on lighting. Open dawn to dusk, first come; City programs have priority. No price is stated. The City\'s place page puts the park at 2276 Dunster Lane.',
  },
  {
    slug: 'rockcrest-park', importedSlug: null, name: 'Rockcrest Park', page: 'rockcrest-park',
    lines: ['3 Pickleball Courts', '(bring your own net)'], lighted: 'No',
    courts: 3, dedicated: 0, striped: 0, nets: false,
    address: '1331 Broadwood Drive', cityZip: '20850', zipNoted: true,
    availability:
      'Three pickleball courts at Rockcrest Park: "3 Pickleball Courts (bring your own net)", Lighted "No". The City\'s row does not say whether these are dedicated courts or lines on a tennis court - it is the one row in the table with neither word - so the three are counted and left unsplit. Players bring a net, and the lighting answer is a stated no. Open dawn to dusk, first come; City programs have priority. No price is stated. The City\'s place page puts the park at 1331 Broadwood Drive.',
  },
  {
    slug: 'rockville-civic-center-park', importedSlug: null, name: 'Rockville Civic Center Park', page: 'rockville-civic-center-park',
    lines: ['4 Pickleball Courts', ON_2], lighted: 'No',
    courts: 4, dedicated: 0, striped: 4, nets: false,
    address: '603 Edmonston Drive', cityZip: '20850', zipNoted: true,
    availability:
      'Four pickleball courts at Rockville Civic Center Park, painted on two tennis courts: "4 Pickleball Courts (pickleball lines on 2 tennis courts; bring your own net)", Lighted "No". Two games per tennis court, the players\' own nets, and a stated no on lighting. Open dawn to dusk, first come; City programs have priority. No price is stated. The City\'s place page prints the park at 603 Edmonston Drive in 20850; the Census address file places the same house number in 20851, and the Census value is the one published.',
  },
  {
    slug: 'welsh-park', importedSlug: 'welsh-park', name: 'Welsh Park', page: 'welsh-park',
    lines: ['2 Dedicated Pickleball Courts', '4 Pickleball Courts', ON_2], lighted: 'Yes',
    courts: 6, dedicated: 2, striped: 4, nets: false,
    address: '344 Martins Lane', cityZip: '20850', zipNoted: false,
    availability:
      'Six pickleball courts at Welsh Park, lit, from two lines in the City\'s row: "2 Dedicated Pickleball Courts" and "4 Pickleball Courts (pickleball lines on 2 tennis courts; bring your own net)", Lighted "Yes". Two courts built for pickleball and four more painted on two tennis courts, six in all, the largest set in the city. The bring-your-own-net note is on the striped four; the venue publishes the stated negative. Open dawn to dusk, first come, closing at 10 p.m. under the lights; City programs have priority. No price is stated. The City\'s place page puts the park at 344 Martins Lane. The imported dataset carried the same address and the same six courts.',
  },
]

/* The two rows the table carries that do not publish. */
const REFUSED_ROWS = [
  {name: 'Glenora Park', lines: ['4 Pickleball Courts', ON_2], lighted: 'No', page: 'glenora-park', addressLine: 'Dundee Road and Wootton Parkway'},
  {name: 'Twinbrook Park', lines: ['4 Pickleball Courts', ON_2], lighted: 'Yes', page: 'twinbrook-park', addressLine: '12920 Twinbrook Parkway', geoKey: 'twinbrook-park'},
]

const EXCLUDED = [
  {
    name: 'Twinbrook Park', spec: '4 Pickleball Courts (pickleball lines on 2 tennis courts; bring your own net), Lighted Yes',
    reasons: [
      'The City\'s place page puts the park at "12920 Twinbrook Parkway", and neither the Census address file nor OpenStreetMap has a record of that house number. Foster Park\'s rule: a count-bearing address that does not resolve as the operator writes it is not published.',
      'The run throws if the address ever resolves, so the venue is re-read and published rather than left refused by habit.',
    ],
  },
  {
    name: 'Glenora Park', spec: '4 Pickleball Courts (pickleball lines on 2 tennis courts; bring your own net), Lighted No',
    reasons: [
      'The City\'s place page gives the address as "Dundee Road and Wootton Parkway", an intersection with no house number. Import Gate I1 needs a house number to resolve, and an intersection is the shape of the held Tom Brown Park row in Tallahassee.',
      'The run throws if the City ever prints a house number for the park.',
    ],
  },
  {
    name: 'Lincoln Park Community Center, Thomas Farm Community Center, Twinbrook Community Recreation Center', spec: CENTERS_SENTENCE,
    reasons: [
      'Named on the City\'s pickleball page as offering open gym schedules featuring pickleball, with no court count. Named, not counted; a venue needs a stated count to exist here.',
    ],
  },
]

/* ---------------------------------------------------------------- */

const snapshotPath = name => `data/sources/rockville/${name}.html`

const linesOf = rel => readFileSync(join(REPO_ROOT, rel), 'utf8')
  .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
  .replace(/<[^>]+>/g, '\n')
  .replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&#0?39;|&apos;|&lsquo;|&rsquo;|&#8217;|[‘’]/g, "'")
  .replace(/&quot;|&ldquo;|&rdquo;|&#8220;|&#8221;|[“”]/g, '"')
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
  The list page: the heading, the three rule sentences, the community
  centre sentence, and the table read row by row. Each row is a name line,
  one or more count lines, a Yes/No cell and a "View Schedule" link.
*/
const LIST = 'pickleball-courts-and-programs'
{
  const lines = linesOf(snapshotPath(LIST))
  const sq = lines.map(squeeze)
  const at = (s, from = 0) => sq.indexOf(squeeze(s), from)

  for (const c of CENTERS) must(LIST, 'Rockville', c, 'community centre name')
  must(LIST, 'Rockville', CENTERS_SENTENCE, 'community-centre open-gym sentence')

  /* The heading occurs in a jump menu too; the rules follow the real one. */
  const rules = at(`${RULE_OPEN} ${RULE_PRIORITY} ${RULE_LIT}`)
  if (rules < 0) throw new Error('Rockville: the three rule sentences under "Outdoor Pickleball Courts" are no longer on the page as one paragraph.')
  if (sq[rules - 1] !== squeeze(HEADING)) throw new Error(`Rockville: the rule paragraph no longer sits directly under the heading "${HEADING}".`)
  for (let i = 0; i < TABLE_HEAD.length; i++) {
    if (sq[rules + 1 + i] !== squeeze(TABLE_HEAD[i])) throw new Error(`Rockville: the table header is no longer "${TABLE_HEAD.join(' | ')}" in that order.`)
  }

  /* Walk the rows. */
  const rows = []
  let i = rules + 1 + TABLE_HEAD.length
  while (i < lines.length && sq[i] !== 'contact' && sq[i] !== 'JumpTo') {
    const name = lines[i++]
    const countLines = []
    while (i < lines.length && sq[i] !== 'Yes' && sq[i] !== 'No') countLines.push(lines[i++])
    const lighted = lines[i++]
    if (sq[i] !== 'ViewSchedule') throw new Error(`Rockville: the row for "${name}" is not followed by "View Schedule"; the table shape has changed.`)
    i++
    rows.push({name, lines: countLines, lighted})
  }

  const expected = [...VENUES, ...REFUSED_ROWS]
    .sort((a, b) => a.name.localeCompare(b.name))
  if (rows.length !== expected.length) {
    throw new Error(`Rockville: the table now has ${rows.length} rows, not ${expected.length}: ${rows.map(r => r.name).join(', ')}. Re-read the page.`)
  }
  rows.forEach((r, k) => {
    const e = expected[k]
    if (squeeze(r.name) !== squeeze(e.name)) throw new Error(`Rockville: row ${k + 1} is "${r.name}", expected "${e.name}".`)
    if (r.lines.length !== e.lines.length || r.lines.some((l, j) => squeeze(l) !== squeeze(e.lines[j]))) {
      throw new Error(`Rockville: the count cell for "${e.name}" now reads "${r.lines.join(' ')}", not "${e.lines.join(' ')}".`)
    }
    if (r.lighted !== e.lighted) throw new Error(`Rockville: the Lighted cell for "${e.name}" now reads "${r.lighted}", not "${e.lighted}".`)
  })

  /* Every count line's number must add up to the venue's count. */
  for (const v of VENUES) {
    const sum = v.lines.map(l => l.match(/^(\d+) (Dedicated )?Pickleball Courts?$/)).filter(Boolean)
      .reduce((a, m) => a + Number(m[1]), 0)
    if (sum !== v.courts) throw new Error(`${v.slug}: the count lines sum to ${sum}, not ${v.courts}.`)
    const ded = v.lines.filter(l => /Dedicated/.test(l)).reduce((a, l) => a + Number(l.match(/^(\d+)/)[1]), 0)
    if (ded !== v.dedicated) throw new Error(`${v.slug}: dedicated lines sum to ${ded}, not ${v.dedicated}.`)
    const striped = v.lines.filter(l => /pickleball lines on/.test(l)).length
    const stripedCourts = v.lines.filter((l, j) => /pickleball lines on/.test(v.lines[j + 1] ?? '')).reduce((a, l) => a + Number(l.match(/^(\d+)/)[1]), 0)
    if (stripedCourts !== v.striped) throw new Error(`${v.slug}: striped lines sum to ${stripedCourts}, not ${v.striped}.`)
    if (striped === 0 && v.dedicated === 0 && v.slug !== 'rockcrest-park') throw new Error(`${v.slug}: neither dedicated nor striped, and not the one row this run leaves unsplit.`)
  }
}

/*
  Each place page: its title, and the "Address" heading followed by the
  street line and the City's "Rockville, MD 208xx" line.
*/
const addressBlock = (page, name, addressLine, cityZip) => {
  const lines = linesOf(snapshotPath(page))
  const sq = lines.map(squeeze)
  if (!sq.includes(squeeze(`${name} | City of Rockville`))) throw new Error(`${page}: the place page is no longer titled "${name} | City of Rockville".`)
  const a = sq.indexOf('Address')
  if (a < 0) throw new Error(`${page}: the place page no longer has an "Address" heading.`)
  if (sq[a + 1] !== squeeze(addressLine)) throw new Error(`${page}: the line under "Address" is now "${lines[a + 1]}", not "${addressLine}".`)
  if (cityZip && sq[a + 2] !== squeeze(`Rockville, MD ${cityZip}`)) throw new Error(`${page}: the city line under the address is now "${lines[a + 2]}", not "Rockville, MD ${cityZip}".`)
  return lines
}

for (const v of VENUES) addressBlock(v.page, v.name, v.address, v.cityZip)
must('broome-athletic-park', 'broome-athletic-park', 'Four accessible pickleball courts.', 'park-page count')

/* The refused rows: Glenora must still be an intersection, Twinbrook still unresolved. */
{
  const glenora = addressBlock('glenora-park', 'Glenora Park', 'Dundee Road and Wootton Parkway', null)
  const a = glenora.map(squeeze).indexOf('Address')
  if (/^\d/.test(glenora[a + 1])) throw new Error('glenora-park: the City now prints a house number for Glenora Park. Re-read and publish it.')
  addressBlock('twinbrook-park', 'Twinbrook Park', '12920 Twinbrook Parkway', '20851')
}

const counties = JSON.parse(
  readFileSync(join(REPO_ROOT, 'data/sources/rockville-county-census.json'), 'utf8'))

if (counties['twinbrook-park']?.matched) {
  throw new Error('twinbrook-park: "12920 Twinbrook Parkway" now resolves. The Foster Park ground for refusing it is gone; re-read the venue and publish it.')
}

const identityRegistry = loadIdentity(REPO_ROOT)
const allRows = loadRows().map(r => mapRow(r).venue)
const bySlug = new Map(
  allRows.filter(v => v.city === 'Rockville' && String(v.state).toUpperCase() === 'MD')
    .map(v => [v.slug, v]))

const overlay = {}
const changes = []

for (const p of VENUES) {
  const geo = counties[p.slug]
  if (!geo?.matched) throw new Error(`${p.slug}: no address resolver matched "${p.address}" as the City writes it.`)
  if (!geo.place_matches_city) throw new Error(`${p.slug}: the resolver places this at "${geo.place}", not Rockville.`)
  if (p.zipNoted) {
    if (geo.postal_code === p.cityZip) throw new Error(`${p.slug}: the resolver now agrees with the City's postcode ${p.cityZip}. Remove the note.`)
  } else if (geo.postal_code !== p.cityZip) {
    throw new Error(`${p.slug}: the resolver's postcode ${geo.postal_code} differs from the City's ${p.cityZip}.`)
  }
  if (p.importedSlug && !bySlug.has(p.importedSlug)) throw new Error(`${p.slug}: imported row ${p.importedSlug} is no longer in data.csv for Rockville, MD.`)

  const doc = new SourceDocument({
    url: LIST_URL, retrieved_at: RETRIEVED_AT, tier: 1, publisher: CITY, format: 'html',
  })
  const docPark = new SourceDocument({
    url: PLACE(p.page), retrieved_at: RETRIEVED_AT, tier: 1, publisher: CITY, format: 'html',
  })
  const docCensus = new SourceDocument({
    url: CENSUS_URL, retrieved_at: RETRIEVED_AT, tier: 1, publisher: 'US Census Bureau', format: 'json',
  })

  const shell = {
    slug: p.slug, name: null, city: 'Rockville', state: 'MD', county: null,
    postal_code: null, street_address: null, latitude: null, longitude: null,
    status: 'pending', source_url: null, date_checked: null, verified_by: null,
    claimed_by_owner: false, claim_date: null,
    rating: null, user_rating: null, review_count: null, claimed_or_verified: null,
    source_sport: 'pickleball',
  }
  for (const f of PUBLISHED_FACT_FIELDS) shell[f] = null
  const imported = p.importedSlug ? bySlug.get(p.importedSlug) : undefined
  const venue = imported ?? shell

  const row = `${p.name} | ${p.lines.join(' ')} | Lighted: ${p.lighted}`
  const lit = p.lighted === 'Yes'
  const split = p.slug === 'rockcrest-park'
    ? 'The City\'s row says neither "Dedicated" nor "pickleball lines on", so the three are counted and not split.'
    : `${p.dedicated} dedicated and ${p.striped} on tennis-court lines, by the City's own wording.`

  const facts = [
    doc.fact('name', p.name, {
      evidence: `The Park cell of the City's outdoor-courts table reads "${p.name}", and the place page is titled "${p.name} | City of Rockville".`,
    }),
    doc.fact('total_courts', p.courts, {
      evidence: `The Number of Courts cell of the City's table, under the heading "${HEADING}": ${p.lines.map(l => `"${l}"`).join(' and ')}.` +
        (p.lines.filter(l => /^\d/.test(l)).length > 1 ? ' Two count lines in one row sum into one venue, as Mount Pleasant\'s Park West and Henderson\'s Silver Springs do.' : '') +
        ` ${split}` +
        (p.pageQuote ? ` The park's own page: "${p.pageQuote}"` : ''),
    }),
    doc.fact('outdoor_courts', p.courts, {
      evidence: `The table sits under the City's heading "${HEADING}"; the heading is the operator's word, and every court in the table is outdoor by it. Indoor is not stated and stays null.`,
    }),
    docPark.fact('street_address', p.address, {
      evidence: `"${p.address}" under the "Address" heading on the park's place page, followed by "Rockville, MD ${p.cityZip}".`,
    }),
    docPark.fact('venue_type', 'public_park', {evidence: `Published by the ${CITY} among its parks and places.`}),
    doc.fact('play_format', 'open_play', {
      evidence: `"${RULE_OPEN}" - the City's own sentence for every row of the table, qualified by "${RULE_PRIORITY}"`,
    }),
    doc.fact('light', lit, {
      evidence: lit
        ? `The Lighted cell of the City's row is "Yes": ${row}. "${RULE_LIT}"`
        : `A stated negative: the Lighted cell of the City's row is "No": ${row}.`,
    }),
    doc.fact('hours_of_operation', lit ? HOURS_LIT : HOURS_UNLIT, {
      evidence: `"${RULE_OPEN}"` + (lit ? ` and, because the row's Lighted cell is "Yes", "${RULE_LIT}"` : ''),
    }),
    doc.fact('pricing_notes', PRICING_BASE, {
      evidence: `"${RULE_OPEN} ${RULE_PRIORITY}" No price and no "free" appear on the page.`,
    }),
    doc.fact('court_availability', p.availability, {
      evidence: `From the City's table row: ${row}; the three rule sentences under "${HEADING}"; and the address on the park's place page.`,
    }),
    docCensus.fact('county', geo.county, {
      evidence: `${geo.county} County, MD${geo.county_fips ? ` (FIPS ${geo.state_fips}${geo.county_fips})` : ''}. ${geo.basis} The resolver also places it in the incorporated place "${geo.place}", which is what allows it to be published under Rockville.`,
    }),
    docCensus.fact('postal_code', geo.postal_code, {
      evidence: p.zipNoted
        ? `${geo.basis} The City's own place page prints ${p.cityZip}; the Census address file returns ${geo.postal_code} for the same house number and street. The Census value publishes, as at Mesa's Chaparral Park, and the disagreement is stated on the venue page.`
        : geo.basis,
    }),
  ]

  if (p.nets === false) {
    facts.push(doc.fact('nets_provided', false, {
      evidence: `A stated negative in the City's count cell: "${p.lines.find(l => /bring your own net/.test(l))}".`,
    }))
  }

  const res = applyFacts(venue, facts)

  overlay[p.slug] = {
    minted: !imported,
    identity: {
      name: p.name, city: 'Rockville', state: 'MD',
      county: geo.county, postal_code: geo.postal_code ?? null,
      latitude: geo.lat ?? null, longitude: geo.lon ?? null,
      imported_slug: p.importedSlug ?? null,
      canonical_slug: identityRegistry.renames[p.importedSlug]?.canonical ?? p.slug,
    },
    match: {
      source_page: LIST_URL, quote: p.lines.join(' '),
      basis: !imported
        ? `Minted here. The import holds no row for ${p.name} in Rockville, MD` +
          (p.slug === 'north-farm-park' ? '; its "North Farm Courts" row at 916 Farm Haven Dr is a different address and stays pending.' : '.')
        : p.slug === 'mattie-j-t-stepanek-park'
          ? 'Matched to the imported king-farm-mattie-j-t-stepanek-park row in Rockville, MD, at the same address and the same four courts, and published under the name the City prints, "Mattie J.T. Stepanek Park". A second imported row, king-farm, describes the same courts at "Pleasant Drive , Mattie Stepanek Park" with a free price the City does not state; it stays pending.'
          : p.slug === 'dogwood-park'
            ? 'Matched to the imported dogwood-park row in Rockville, MD, at the same address; it carried four courts, and the City\'s two count lines make five.'
            : `Matched to the imported ${p.importedSlug} row in Rockville, MD, at the same address and the same count.`,
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
const litVenues = VENUES.filter(p => p.lighted === 'Yes')
const litCourts = litVenues.reduce((a, p) => a + p.courts, 0)
const dedicated = VENUES.reduce((a, p) => a + p.dedicated, 0)
const striped = VENUES.reduce((a, p) => a + p.striped, 0)

for (const [slug, entry] of Object.entries(overlay)) {
  const {total_courts: t, indoor_courts: i, outdoor_courts: o} = entry.patch
  if (i != null && o != null && t !== i + o) throw new Error(`Rule 13: ${slug} does not sum.`)
  if (o !== t) throw new Error(`Rule 13: ${slug} outdoor ${o} is not the total ${t}.`)
}

const METHOD_NOTE =
  `Rockville publishes one table under the heading "${HEADING}" on its Pickleball Courts and Programs page - Park, Number of Courts, Lighted - and every count here is that table's cell in the City's own words, which separates "Dedicated Pickleball Courts" from "pickleball lines on N tennis courts". Every row is asserted in order, with its count lines and its Lighted cell, so an added, dropped, renumbered or re-lit row fails the build. Three rows carry two count lines; they sum into one venue and both lines are quoted. Addresses come from each park's place page under its "Address" heading, and twelve of the fourteen resolve in the Census address file as written, inside Rockville city, Montgomery County. Twinbrook Park ("12920 Twinbrook Parkway") resolves nowhere and Glenora Park ("Dundee Road and Wootton Parkway") is an intersection, so neither publishes; the run throws if either changes. Dogwood, Rockcrest and Rockville Civic Center Park resolve as written in a postcode other than the one the City prints, and the Census value publishes with the disagreement stated. Every court is outdoor by the heading. The Lighted column publishes as stated - "Yes" lit, "No" a stated negative - so nothing about lighting is left unknown. "bring your own net" publishes as nets not provided; Dogwood, whose two lines say use the tennis net and bring your own, stays null. "${RULE_OPEN}" publishes as open play and as hours, and "${RULE_LIT}" adds a closing time at the five lit venues. No price and no "free" appear, so fee_type is null and the first-come and program-priority sentences publish as pricing notes. Surface and indoor are not stated. Three community centres are named for drop-in gym pickleball with no count and are not published.`

mkdirSync(join(REPO_ROOT, 'data/verified'), {recursive: true})
writeFileSync(join(REPO_ROOT, VERIFIED_PATH), JSON.stringify({
  city: 'Rockville', state: 'MD', retrieved_at: RETRIEVED_AT,
  method_note: METHOD_NOTE,
  sources: [
    {url: LIST_URL, publisher: CITY, tier: 1, format: 'html', snapshot: snapshotPath(LIST)},
    ...VENUES.map(v => ({url: PLACE(v.page), publisher: CITY, tier: 1, format: 'html', snapshot: snapshotPath(v.page)})),
    ...REFUSED_ROWS.map(r => ({url: PLACE(r.page), publisher: CITY, tier: 1, format: 'html', snapshot: snapshotPath(r.page)})),
    {url: CENSUS_URL, publisher: 'US Census Bureau', tier: 1, format: 'json', snapshot: 'data/sources/rockville-county-census.json'},
  ].map((s, i) => ({id: `S${i + 1}`, ...s})),
  totals: {
    venues: VENUES.length, courts: totalCourts,
    outdoor: totalCourts, indoor: null,
    dedicated, striped_on_tennis: striped, unsplit: totalCourts - dedicated - striped,
    lit_courts: litCourts, lit_venues: litVenues.length, unlit_venues: VENUES.length - litVenues.length,
    nets_not_provided_venues: VENUES.filter(p => p.nets === false).length,
    free_venues: 0,
  },
  excluded: EXCLUDED.map(e => ({name: e.name, why: e.reasons})),
  venues: overlay,
}, null, 2) + '\n')

const changed = changes.filter(r =>
  r.old_value !== null && r.old_value !== undefined && String(r.old_value) !== String(r.new_value))

writeFileSync(join(REPO_ROOT, 'reports', 'rockville-conflicts.md'), [
  '# Rockville verification - one table, fourteen rows, twelve venues', '',
  `Run ${RETRIEVED_AT}. ${VENUES.length} venues published, ${totalCourts} courts (${dedicated} dedicated, ${striped} on tennis-court lines, ${totalCourts - dedicated - striped} unsplit), ${litVenues.length} venues lit. 2 table rows refused; 3 community centres named without a count.`, '',
  'Rockville is the first city in Maryland on this site and the first in Montgomery County. Every count is a cell of',
  `the City's own table under "${HEADING}", every lighting answer is that table's Lighted column, and every address is`,
  'the "Address" block of the park\'s place page.', '',
  '| venue | courts | dedicated / striped | lit | nets | address | what the City writes |',
  '| --- | ---: | --- | --- | --- | --- | --- |',
  ...VENUES.map(p => `| \`${p.slug}\` | ${p.courts} | ${p.slug === 'rockcrest-park' ? 'unsplit' : `${p.dedicated} / ${p.striped}`} | ${p.lighted === 'Yes' ? 'yes' : 'no (stated)'} | ${p.nets === false ? 'not provided' : 'not stated'} | ${p.address} (${counties[p.slug].postal_code}) | ${p.lines.map(l => `"${l}"`).join(' ')} |`),
  '',
  '## Two count lines in one row', '',
  'Dogwood (1 + 4), Isreal (2 dedicated + 2) and Welsh (2 dedicated + 4) each print two count lines in one cell.',
  'They sum into one venue, as Mount Pleasant\'s Park West and Henderson\'s Silver Springs do, and both lines are',
  'quoted in the evidence. Dogwood\'s two lines disagree on nets - "use tennis net" and "bring your own net" - so',
  'nets_provided stays null there.',
  '',
  '## Postcodes the City prints and the resolver does not', '',
  'Dogwood Park: the City prints 20852, the Census address file returns 20850 for "800 Monroe St.". Rockcrest Park: the',
  'City prints 20850, the Census returns 20851 for "1331 Broadwood Drive". Rockville Civic',
  'Center Park: the City prints 20850, the Census returns 20851 for "603 Edmonston Drive". All three resolved as written,',
  'same house number, street and direction, so this is Mesa\'s Chaparral Park and not Foster Park: the Census value',
  'publishes and the disagreement is stated on the venue page. The run throws if the resolver ever agrees.',
  '',
  '## Refused', '',
  ...EXCLUDED.flatMap(e => [
    `**${e.name}** - "${e.spec}"`, '',
    ...e.reasons.map((r, i) => `${i + 1}. ${r}`), '']),
  '## Imported rows that stay pending', '',
  '- `king-farm` - "Pleasant Drive , Mattie Stepanek Park", 4 courts, fee "free". A second record of Mattie J.T. Stepanek',
  '  Park with no house number and a price the City does not state. The `king-farm-mattie-j-t-stepanek-park` row at',
  '  1800 Piccard Dr is the one matched.',
  '- `north-farm-courts` (imported as north-farm-courts-rockville-md) - "916 Farm Haven Dr", 4 courts. Not the City\'s',
  '  North Farm Park at 601 Farm Pond Lane; the City\'s park is minted.',
  '- The commercial and club rows (Dill Dinkers, Pickleball Climb, Old Farm, Bender JCC) and the community-centre rows',
  '  (Lincoln Park, Thomas Farm, Twinbrook, North Potomac, Dacek) are untouched; the City names three of the centres',
  '  for drop-in gym pickleball and counts none of them.',
  '',
  '## What Rockville does not say', '',
  '- **price**, anywhere; and not the word "free".',
  '- **surface.**',
  '- **indoor.** Every table row is outdoor by the heading; the centres named for gym pickleball carry no count.',
  '- **nets**, at the two dedicated-only rows (Broome, Stepanek), and at Dogwood where the two lines differ.',
  '- **whether Rockcrest\'s three are dedicated or striped** - the one row with neither word.',
  '',
  changed.length ? '## Values a source changed' : '_No imported row was overwritten._',
  ...(changed.length ? [
    '', '| venue | field | was | now | outcome |', '| --- | --- | --- | --- | --- |',
    ...changed.map(r => `| \`${r.venue_slug}\` | ${r.field} | ${JSON.stringify(r.old_value)} | ${JSON.stringify(r.new_value)} | ${r.outcome} |`),
  ] : []),
  '',
].join('\n'))

console.log(`\nRockville, MD - ${VENUES.length} venues, ${totalCourts} courts (${litVenues.length} lit venues), retrieved ${RETRIEVED_AT}`)
console.log(`  refused: ${EXCLUDED.map(e => e.name).join('; ')}`)
console.log(`\nWrote ${VERIFIED_PATH} and reports/rockville-conflicts.md\n`)
