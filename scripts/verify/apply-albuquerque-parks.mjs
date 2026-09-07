#!/usr/bin/env node
/*
  Albuquerque, NM verification run - city #22, the first in New Mexico and
  the first in Bernalillo County.

  ============================================================
  ONE TABLE, WITH NAME, ADDRESS AND COUNT IN THREE CELLS
  ============================================================

  The City's pickleball page carries one table under the heading
  "Pickleball Court Locations" - Name | Address | Description - and the
  description cell states the count and, where it applies, the lighting
  and the kind of court:

      Manzano Mesa Pickleball Complex   "Pickleball Complex / 33 Courts (21 Lighted)"
      Villela Pickleball Courts         "Pickleball Complex / 6 Courts"
      Sierra Vista Tennis Complex       "Tennis/Pickleball Courts / 2 Courts and 4 Lined Courts"
      Pat Hurley Park                   "Tennis/Pickleball Courts / 4 Courts and 4 Lined Courts"
      Alamosa Park                      "Tennis Courts with Pickleball Lines / 8 Lighted Pickleball Courts"
      Hoffman Park                      "... / 2 Pickleball Courts"
      Rinconada Park                    "... / 2 Pickleball Courts"
      Montgomery Park                   "... / 6 Pickleball Courts"
      Columbus Park                     "... / 4 Pickleball Courts"
      Eagle Ranch Park                  "... / 4 Pickleball Courts"
      Ventana Ranch Park                "... / 12 Lighted Pickleball Courts"
      Loma Del Norte Park               "... / 4 Pickleball Courts"
      Lynnewood Park                    "... / 4 Pickleball Courts"
      Lauren C. Bolles                  "... / 8 Pickleball Courts"
      Quintessence Park                 "... / 4 Pickleball Courts"
      Wells Park                        "3 Pickleball Courts"

  "Pickleball Complex" rows are dedicated pickleball courts; "Tennis Courts
  with Pickleball Lines" rows are tennis courts wearing pickleball lines,
  and the City says so in the cell. The prose beneath the table confirms
  the two shared complexes in words: "Sierra Vista Courts with 2 permanent
  pickleball courts, and 4 lined pickleball courts, and Pat Hurley Park
  with 4 dedicated and 4 blended lines". Six and eight are the City's own
  sums, written as two figures in one cell, as Jim Jeffers's were in Cape
  Coral.

  ============================================================
  THE OLDER LISTS ARE IN AN HTML COMMENT, AND THAT DECIDES THEIR WEIGHT
  ============================================================

  Below the visible prose the page source holds two further tables -
  "Locations: Pickleball Complexes" and "Locations: Tennis Courts Lined
  for Pickleball" - that disagree with the table above at four venues
  (Manzano Mesa "18 Courts (6 Lighted)" against 33 and 21; Eagle Ranch 2
  against 4; Montgomery 4 against 6; Ventana Ranch "8 Lighted" against 12)
  and name three parks the visible table does not (Barelas, Los Altos,
  Zuni). The whole block sits inside one <!-- --> comment. A browser does
  not render it. Nobody reading the City's page sees those numbers.

  So this is not the Los Olivos case, where the City published two counts
  on two pages and a reader could find either. The City publishes one
  record here; the other is source-code residue of an earlier version, and
  the two-records rule refuses a venue only when both records are
  statements. What the residue IS good for is a tripwire: the run asserts
  that it is still present AND still hidden, so if the City ever uncomments
  it - putting "18 Courts" back in front of readers beside "33 Courts" -
  the build fails and Manzano Mesa is re-read rather than published on the
  strength of a now-contradicted table. The same tripwire keeps "Players
  need to bring pickleball nets." from being published as a fact: it too
  is inside the comment, so nets_provided stays null everywhere.

  ============================================================
  MANZANO MESA IS THE LARGEST VENUE IN THE DIRECTORY
  ============================================================

  Thirty-three courts, twenty-one of them lit, in one City cell. Mesa's
  Tennis & Pickleball Center held the record at twenty-one. The lighting
  is published as Yes with the fraction stated, on the Jim Jeffers rule:
  the City's "Lighted" attaches to twenty-one of the thirty-three and the
  venue page prints both numbers.

  ============================================================
  WHAT IS REFUSED
  ============================================================

  Pat Hurley Park      8 courts (4 dedicated, 4 lined), open 6 a.m.-10
                       p.m. Neither resolver finds "3828 Rincon Rd NW".
  Alamosa Park         8 lighted lined courts. Neither resolver finds
                       "1100 Bataan SW".
  Ventana Ranch Park   12 lighted lined courts, the largest lined set the
                       City lists. Neither resolver finds "10000 Universe
                       NW". The three refusals together cost 28 courts,
                       20 of them lit; every one fails on its address
                       alone.

  Barelas, Los Altos and Zuni Parks are not refusals: the City does not
  publish them. They exist only inside the comment.

  ============================================================
  WHAT IS NOT CLAIMED
  ============================================================

  indoor/outdoor   Never stated. Null everywhere.
  fee              Never stated. "first come, first serve" is a play
                   format. Null.
  nets             The only statement is inside the comment. Null.
  surface          Not stated.
  hours            Stated for Manzano Mesa and Villela ("Villella" in the
                   prose, "Villela" in the table - the City spells it
                   both ways) and for Pat Hurley, which is refused.
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

const CITY = 'City of Albuquerque Parks & Recreation'
const PAGE = 'https://www.cabq.gov/parksandrecreation/recreation/pickleball'
const CENSUS_URL = 'https://geocoding.geo.census.gov/geocoder/geographies'

const HEADING = 'Pickleball Court Locations'
const COMPLEXES = 'The City of Albuquerque has two dedicated pickleball complexes: Manzano Mesa Pickleball Complex, and Villella Pickleball Courts. And two shared complexes at Sierra Vista Courts with 2 permanent pickleball courts, and 4 lined pickleball courts, and Pat Hurley Park with 4 dedicated and 4 blended lines.'
const HOURS = 'Manzano Mesa, Villella, and Pat Hurley are open from 6 a.m. to 10 p.m. daily.'
const SIERRA_RESERVE = 'Courts at Sierra Vista can be reserved in advanced by calling 505-767-5445.'
const FIRST_COME = 'Courts are typically available on a first come, first serve basis and play is limited to 1.5 hours when others are waiting.'
const LINED = 'Tennis Courts with Pickleball Lines'
const COMPLEX = 'Pickleball Complex'

/* The commented-out residue. Asserted present AND hidden. */
const HIDDEN = [
  'Locations: Pickleball Complexes',
  '18 Courts (6 Lighted)',
  'Locations: Tennis Courts Lined for Pickleball',
  'Players need to bring pickleball nets.',
  'Barelas Park 707 7th SW',
  'Los Altos Park 10100 Lomas NE Albuquerque, NM 87112 12 Lighted Pickleball Courts',
  'Zuni Park 7401 Cutler NE Albuquerque, NM 87110 5 Pickleball Courts',
  'Eagle Ranch Park 3500 ½ Congress NW Albuquerque, NM 87114 2 Pickleball Courts',
  'Montgomery Park 5510 Ponderosa NE Albuquerque, NM 87110 4 Pickleball Courts',
  'Ventana Ranch Park Universe NW Albuquerque, NM 87114 8 Lighted Pickleball Courts',
]

/*
  Each row is asserted as the squeezed run "name address description".
  The table cells wrap across lines in the snapshot ("Hoffman Park / 2480
  / Mesa / Linda NE"), so whitespace is removed before comparison.
*/
const VENUES = [
  {
    slug: 'manzano-mesa-park', geo: 'manzano-mesa-pickleball-complex', importedSlug: 'manzano-mesa-park-pickleball-courts',
    name: 'Manzano Mesa Pickleball Complex', address: '501 Elizabeth SE',
    row: 'Manzano Mesa Pickleball Complex 501 Elizabeth SE Pickleball Complex 33 Courts (21 Lighted)',
    kind: COMPLEX, count: '33 Courts (21 Lighted)', courts: 33, light: true, lit: 21, hours: true,
    availability: 'Thirty-three pickleball courts, twenty-one of them lit, in the City\'s own cell: "Pickleball Complex / 33 Courts (21 Lighted)". That is the largest single-venue count on this site, ahead of Mesa\'s twenty-one, and the City calls it one of its "two dedicated pickleball complexes", so these are pickleball courts rather than tennis courts wearing lines. The "Lighted" belongs to twenty-one of the thirty-three; the other twelve carry no lighting statement. Open 6 a.m. to 10 p.m. daily, in the City\'s sentence naming this complex, Villella and Pat Hurley. Play is first come, first served and limited to an hour and a half when others are waiting. The City runs lessons and programmes here and reserves the complex for special events through its Sports Office. The imported dataset carried this venue at eighteen courts; the City\'s table now says thirty-three, and the page source still holds the old eighteen inside a comment nobody sees. Price, surface, nets and indoor/outdoor are not stated.',
  },
  {
    slug: 'villela-park', geo: 'villela-pickleball-courts', importedSlug: 'villela-park-pickleball-courts',
    name: 'Villela Pickleball Courts', address: '4800 Cherokee NE',
    row: 'Villela Pickleball Courts 4800 Cherokee NE Pickleball Complex 6 Courts',
    kind: COMPLEX, count: '6 Courts', courts: 6, light: null, hours: true,
    availability: 'Six dedicated pickleball courts at the second of the City\'s "two dedicated pickleball complexes", in the north-east of the city. The table reads "Pickleball Complex / 6 Courts". Open 6 a.m. to 10 p.m. daily in the City\'s sentence, which spells the name "Villella" where the table has "Villela". First come, first served, with play limited to an hour and a half when others are waiting. Lighting is not stated for these courts; the City marks it in the description cell where it applies and this cell carries no such mark. Price, surface, nets and indoor/outdoor are not stated.',
  },
  {
    slug: 'sierra-vista-tennis-complex', geo: 'sierra-vista-tennis-complex', importedSlug: null,
    name: 'Sierra Vista Tennis Complex', address: '5001 Montano Rd. NW',
    row: 'Sierra Vista Tennis Complex 5001 Montano Rd. NW Tennis/Pickleball Courts 2 Courts and 4 Lined Courts',
    kind: 'Tennis/Pickleball Courts', count: '2 Courts and 4 Lined Courts', courts: 6, light: null, reserve: true,
    availability: 'Six pickleball courts of two kinds, and the six is the City\'s own arithmetic: "2 Courts and 4 Lined Courts" in the table, and in the prose beneath it "Sierra Vista Courts with 2 permanent pickleball courts, and 4 lined pickleball courts". Two courts stand as pickleball courts; four are lines on tennis courts. This is the one Albuquerque venue whose courts the City says can be booked: "Courts at Sierra Vista can be reserved in advanced by calling 505-767-5445." No price is stated for that. Otherwise first come, first served with a ninety-minute limit when others are waiting. Lighting, hours, price, surface, nets and indoor/outdoor are not stated.',
  },
  {
    slug: 'hoffman-park', geo: 'hoffman-park', importedSlug: null,
    name: 'Hoffman Park', address: '2480 Mesa Linda NE',
    row: 'Hoffman Park 2480 Mesa Linda NE Tennis Courts with Pickleball Lines 2 Pickleball Courts',
    kind: LINED, count: '2 Pickleball Courts', courts: 2, light: null,
    availability: 'Two pickleball courts lined onto the tennis courts at Hoffman Park in the north-east heights, in the City\'s cell "Tennis Courts with Pickleball Lines / 2 Pickleball Courts". Lined courts share the slab with tennis and carry a tennis net; the City says nothing on its visible page about who brings a pickleball net. First come, first served, an hour and a half when others are waiting. Two courts is a game rather than a rotation. Lighting, hours, price, surface and indoor/outdoor are not stated.',
  },
  {
    slug: 'rinconada-park', geo: 'rinconada-park', importedSlug: null,
    name: 'Rinconada Park', address: '3125 Painted Rock NW',
    row: 'Rinconada Park 3125 Painted Rock NW Tennis Courts with Pickleball Lines 2 Pickleball Courts',
    kind: LINED, count: '2 Pickleball Courts', courts: 2, light: null,
    availability: 'Two pickleball courts lined onto the tennis courts at Rinconada Park on the west side, "Tennis Courts with Pickleball Lines / 2 Pickleball Courts" in the City\'s table. Shared with tennis, first come, first served, ninety minutes when others are waiting. Lighting, hours, price, surface, nets and indoor/outdoor are not stated.',
  },
  {
    slug: 'montgomery-park', geo: 'montgomery-park', importedSlug: null,
    name: 'Montgomery Park', address: '5510 Ponderosa NE',
    row: 'Montgomery Park 5510 Ponderosa NE Tennis Courts with Pickleball Lines 6 Pickleball Courts',
    kind: LINED, count: '6 Pickleball Courts', courts: 6, light: null,
    availability: 'Six pickleball courts lined onto the tennis courts at Montgomery Park in the north-east, "Tennis Courts with Pickleball Lines / 6 Pickleball Courts" in the City\'s table - the largest lined set that publishes here, since Ventana Ranch\'s twelve and Alamosa\'s eight are refused on their addresses. Shared with tennis, first come, first served, ninety minutes when others are waiting. The page source carries an older figure of four for this park inside a comment a reader never sees; the visible table says six. Lighting, hours, price, surface, nets and indoor/outdoor are not stated.',
  },
  {
    slug: 'columbus-park', geo: 'columbus-park', importedSlug: null,
    name: 'Columbus Park', address: '5301 Guadalupe Trail NW',
    row: 'Columbus Park 5301 Guadalupe Trail NW Tennis Courts with Pickleball Lines 4 Pickleball Courts',
    kind: LINED, count: '4 Pickleball Courts', courts: 4, light: null,
    availability: 'Four pickleball courts lined onto the tennis courts at Columbus Park in the North Valley, "Tennis Courts with Pickleball Lines / 4 Pickleball Courts" in the City\'s table. Shared with tennis, first come, first served, ninety minutes when others are waiting. Lighting, hours, price, surface, nets and indoor/outdoor are not stated.',
  },
  {
    slug: 'eagle-ranch-park', geo: 'eagle-ranch-park', importedSlug: null,
    name: 'Eagle Ranch Park', address: '3500 1/2 Congress NW',
    row: 'Eagle Ranch Park 3500 1/2 Congress NW Tennis Courts with Pickleball Lines 4 Pickleball Courts',
    kind: LINED, count: '4 Pickleball Courts', courts: 4, light: null,
    availability: 'Four pickleball courts lined onto the tennis courts at Eagle Ranch Park on the west side, "Tennis Courts with Pickleball Lines / 4 Pickleball Courts" in the City\'s table, at an address the City writes with a half: 3500 1/2 Congress NW. Shared with tennis, first come, first served, ninety minutes when others are waiting. The page source holds an older figure of two for this park inside a comment; the visible table says four. Lighting, hours, price, surface, nets and indoor/outdoor are not stated.',
  },
  {
    slug: 'loma-del-norte-park', geo: 'loma-del-norte-park', importedSlug: null,
    name: 'Loma Del Norte Park', address: '7511 Burke NE',
    row: 'Loma Del Norte Park 7511 Burke NE Tennis Courts with Pickleball Lines 4 Pickleball Courts',
    kind: LINED, count: '4 Pickleball Courts', courts: 4, light: null,
    availability: 'Four pickleball courts lined onto the tennis courts at Loma Del Norte Park in the north-east, "Tennis Courts with Pickleball Lines / 4 Pickleball Courts" in the City\'s table. Shared with tennis, first come, first served, ninety minutes when others are waiting. Lighting, hours, price, surface, nets and indoor/outdoor are not stated.',
  },
  {
    slug: 'lynnewood-park', geo: 'lynnewood-park', importedSlug: null,
    name: 'Lynnewood Park', address: '2721 Marie Park NE',
    row: 'Lynnewood Park 2721 Marie Park NE Tennis Courts with Pickleball Lines 4 Pickleball Courts',
    kind: LINED, count: '4 Pickleball Courts', courts: 4, light: null,
    availability: 'Four pickleball courts lined onto the tennis courts at Lynnewood Park in the north-east heights, "Tennis Courts with Pickleball Lines / 4 Pickleball Courts" in the City\'s table. Shared with tennis, first come, first served, ninety minutes when others are waiting. Lighting, hours, price, surface, nets and indoor/outdoor are not stated.',
  },
  {
    slug: 'lauren-c-bolles', geo: 'lauren-c-bolles-park', importedSlug: null,
    name: 'Lauren C. Bolles', address: '13121 Skyview NE',
    row: 'Lauren C. Bolles 13121 Skyview NE Tennis Courts with Pickleball Lines 8 Pickleball Courts',
    kind: LINED, count: '8 Pickleball Courts', courts: 8, light: null,
    availability: 'Eight pickleball courts lined onto the tennis courts at the park the City\'s table names simply "Lauren C. Bolles", in the far north-east, "Tennis Courts with Pickleball Lines / 8 Pickleball Courts". That is the joint-largest lined set that publishes in Albuquerque, with Montgomery Park\'s six behind it. Shared with tennis, first come, first served, ninety minutes when others are waiting. Lighting, hours, price, surface, nets and indoor/outdoor are not stated.',
  },
  {
    slug: 'quintessence-park', geo: 'quintessence-park', importedSlug: null,
    name: 'Quintessence Park', address: '9801 Quintessence NE',
    row: 'Quintessence Park 9801 Quintessence NE Tennis Courts with Pickleball Lines 4 Pickleball Courts',
    kind: LINED, count: '4 Pickleball Courts', courts: 4, light: null,
    availability: 'Four pickleball courts lined onto the tennis courts at Quintessence Park in the far north-east, "Tennis Courts with Pickleball Lines / 4 Pickleball Courts" in the City\'s table. Shared with tennis, first come, first served, ninety minutes when others are waiting. Lighting, hours, price, surface, nets and indoor/outdoor are not stated.',
  },
  {
    slug: 'wells-park', geo: 'wells-park', importedSlug: null,
    name: 'Wells Park', address: '500 Mountain NW',
    row: 'Wells Park 500 Mountain NW 3 Pickleball Courts',
    kind: null, count: '3 Pickleball Courts', courts: 3, light: null,
    availability: 'Three pickleball courts at Wells Park near downtown, "3 Pickleball Courts" in the City\'s table - the one row whose description cell carries no kind, so whether these are dedicated courts or lines on tennis is not stated. First come, first served, ninety minutes when others are waiting. The imported dataset lists the Johnny Tapia Community Center at this address with three courts; the City\'s table names the park, and the park is what publishes. Lighting, hours, price, surface, nets and indoor/outdoor are not stated.',
  },
]

const EXCLUDED = [
  {
    name: 'Pat Hurley Park', geo: 'pat-hurley-park',
    row: 'Pat Hurley Park 3828 Rincon Rd NW Tennis/Pickleball Courts 4 Courts and 4 Lined Courts', address: '3828 Rincon Rd NW',
    reasons: [
      'Neither address resolver finds "3828 Rincon Rd NW": the US Census address file returns no match and OpenStreetMap returns nothing at house-number level. Import Gate I1 requires a street address that resolves.',
      'The City states eight courts ("4 Courts and 4 Lined Courts", "4 dedicated and 4 blended lines") and hours of 6 a.m. to 10 p.m. daily for it - more than it states for most venues that do publish. It fails on its address alone.',
    ],
  },
  {
    name: 'Alamosa Park', geo: 'alamosa-park',
    row: 'Alamosa Park 1100 Bataan SW Tennis Courts with Pickleball Lines 8 Lighted Pickleball Courts', address: '1100 Bataan SW',
    reasons: [
      'Neither address resolver finds "1100 Bataan SW". Import Gate I1.',
      'Eight lighted lined courts, one of only three lighting statements the City makes. It fails on its address alone.',
    ],
  },
  {
    name: 'Ventana Ranch Park', geo: 'ventana-ranch-park',
    row: 'Ventana Ranch Park 10000 Universe NW Tennis Courts with Pickleball Lines 12 Lighted Pickleball Courts', address: '10000 Universe NW',
    reasons: [
      'Neither address resolver finds "10000 Universe NW". Import Gate I1. The imported dataset carries this park with no house number at all ("Universe Blvd, Nw, Universe And Paradise Blvd."), and the commented-out older list on the City\'s own page also gives it without one.',
      'Twelve lighted lined courts, the largest lined set the City lists and the most expensive refusal in the city. It fails on its address alone.',
    ],
  },
]

/* Named only inside the HTML comment. Not published by the City, so not venues and not refusals. */
const HIDDEN_ONLY = ['Barelas Park', 'Los Altos Park', 'Zuni Park']

/* ---------------------------------------------------------------- */

const snapshotPath = name => `data/sources/albuquerque/${name}.html`

const normalise = s => s
  .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
  .replace(/<[^>]+>/g, '\n')
  .replace(/&nbsp;|&#160;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&#0?39;|&apos;|&lsquo;|&rsquo;|&#8217;|[‘’]/g, "'")
  .replace(/&quot;|&ldquo;|&rdquo;|[“”]/g, '"')
  .replace(/&#8211;|&#8212;|&ndash;|&mdash;|[–—‑]/g, '-')
  .split('\n').map(s => s.trim()).filter(Boolean)

/* What a reader sees: comments removed before tags are. */
const linesOf = rel => normalise(readFileSync(join(REPO_ROOT, rel), 'utf8').replace(/<!--[\s\S]*?-->/g, ' '))
/* What the source holds, comments included. */
const rawLinesOf = rel => normalise(readFileSync(join(REPO_ROOT, rel), 'utf8').replace(/<!--/g, ' ').replace(/-->/g, ' '))

const squeeze = s => s.replace(/\s+/g, '')
const visible = squeeze(linesOf(snapshotPath('pickleball')).join(' '))
const raw = squeeze(rawLinesOf(snapshotPath('pickleball')).join(' '))

const must = (who, needle, what) => {
  if (!visible.includes(squeeze(needle))) {
    throw new Error(`${who}: the pickleball snapshot no longer shows the ${what} text "${needle}".`)
  }
}

/* The city-wide statements a reader can see. */
for (const [needle, what] of [
  [HEADING, 'table heading'],
  [COMPLEXES, 'complexes sentence'],
  [HOURS, 'hours sentence'],
  [SIERRA_RESERVE, 'Sierra Vista reservation sentence'],
  [FIRST_COME, 'first-come rule'],
]) must('Albuquerque', needle, what)

/*
  THE TRIPWIRE. The older lists must still be in the source (so the notes
  that mention them stay true) and must still be invisible (so the visible
  table is still the City's only published record). Either change means a
  re-read, not a quiet continuation.
*/
for (const h of HIDDEN) {
  if (!raw.includes(squeeze(h))) {
    throw new Error(`The commented-out residue no longer holds "${h}". The notes about the hidden older lists are stale; re-read the page.`)
  }
  if (visible.includes(squeeze(h))) {
    throw new Error(`"${h}" is now VISIBLE on the City's page. The City publishes two records again; re-read the city under the two-records rule.`)
  }
}
for (const name of HIDDEN_ONLY) {
  if (visible.includes(squeeze(name))) {
    throw new Error(`${name} is now on the visible page. It was only in the comment; re-read and consider publishing it.`)
  }
}

const counties = JSON.parse(
  readFileSync(join(REPO_ROOT, 'data/sources/albuquerque-county-census.json'), 'utf8'))

/* ---------------------------------------------------------------- */
/* THE REFUSALS, ASSERTED RATHER THAN REMEMBERED.                    */

for (const e of EXCLUDED) {
  must(e.name, e.row, 'table row of the refused venue')
  if (counties[e.geo]?.matched) {
    throw new Error(`${e.name} now resolves. The only reason it is excluded has gone: publish it.`)
  }
}

const identityRegistry = loadIdentity(REPO_ROOT)
const allRows = loadRows().map(r => mapRow(r).venue)
const bySlug = new Map(
  allRows.filter(v => v.city === 'Albuquerque' && String(v.state).toUpperCase() === 'NM')
    .map(v => [v.slug, v]))

const overlay = {}
const changes = []

for (const p of VENUES) {
  must(p.slug, p.row, 'table row')

  const geo = counties[p.geo]
  if (!geo?.matched) throw new Error(`${p.slug}: no address resolver matched its address`)
  if (!geo.place_matches_city) {
    throw new Error(`${p.slug}: the resolver places this at "${geo.place}", not Albuquerque.`)
  }

  const doc = new SourceDocument({
    url: PAGE, retrieved_at: RETRIEVED_AT, tier: 1, publisher: CITY, format: 'html',
  })
  const docCensus = new SourceDocument({
    url: CENSUS_URL, retrieved_at: RETRIEVED_AT, tier: 1, publisher: 'US Census Bureau', format: 'json',
  })

  const shell = {
    slug: p.slug, name: null, city: 'Albuquerque', state: 'NM', county: null,
    postal_code: null, street_address: null, latitude: null, longitude: null,
    status: 'pending', source_url: null, date_checked: null, verified_by: null,
    claimed_by_owner: false, claim_date: null,
    rating: null, user_rating: null, review_count: null, claimed_or_verified: null,
    source_sport: 'pickleball',
  }
  for (const f of PUBLISHED_FACT_FIELDS) shell[f] = null
  const imported = p.importedSlug ? bySlug.get(p.importedSlug) : undefined
  const venue = imported ?? shell

  const cell = p.kind ? `"${p.kind} / ${p.count}"` : `"${p.count}"`
  const facts = [
    doc.fact('name', p.name, {
      evidence: `Named "${p.name}" in the Name column of the City's "Pickleball Court Locations" table.` +
        (p.slug === 'villela-park' ? ' The prose beneath the table spells it "Villella".' : '') +
        (p.slug === 'lauren-c-bolles' ? ' The City writes the name without "Park".' : ''),
    }),
    doc.fact('total_courts', p.courts, {
      evidence: `The Description cell of the City's table: ${cell}.` +
        (p.slug === 'sierra-vista-tennis-complex'
          ? ' Six is the City\'s own sum of "2 Courts and 4 Lined Courts", confirmed in its prose: "Sierra Vista Courts with 2 permanent pickleball courts, and 4 lined pickleball courts".'
          : '') +
        (p.kind === LINED ? ' The City states in the same cell that these are tennis courts with pickleball lines.' : '') +
        (p.kind === COMPLEX ? ' The City calls this one of its "two dedicated pickleball complexes".' : ''),
    }),
    doc.fact('street_address', p.address, {
      evidence: `"${p.address}" in the Address column of the City's table, written as the City writes it.`,
    }),
    doc.fact('venue_type', 'public_park', {evidence: `Published by the ${CITY} among its parks.`}),
    doc.fact('play_format', 'open_play', {
      evidence: `"${FIRST_COME}" under "Availability & Reservations" on the City's page.`,
    }),
    doc.fact('court_availability', p.availability, {
      evidence: `From the City's table row ${cell} and the sentences beneath it.`,
    }),
    docCensus.fact('county', geo.county, {
      evidence: `${geo.county} County, NM${geo.county_fips ? ` (FIPS ${geo.state_fips}${geo.county_fips})` : ''}. ${geo.basis} The resolver also places it in the incorporated place "${geo.place}", which is what allows it to be published under Albuquerque.`,
    }),
    docCensus.fact('postal_code', geo.postal_code, {evidence: geo.basis}),
  ]

  if (p.light === true) {
    facts.push(doc.fact('light', true, {
      evidence: `"${p.count}" in the City's cell. The "Lighted" attaches to ${p.lit} of the ${p.courts} courts; the venue page prints both figures.`,
    }))
  }
  if (p.hours) {
    facts.push(doc.fact('hours_of_operation', '6 a.m. to 10 p.m. daily', {
      evidence: `"${HOURS}"`,
    }))
  }
  if (p.reserve) {
    facts.push(doc.fact('pricing_notes', 'Courts can be reserved in advance by calling 505-767-5445. No price is stated.', {
      evidence: `"${SIERRA_RESERVE}" The City states no price for a reservation.`,
    }))
  }

  const res = applyFacts(venue, facts)

  overlay[p.slug] = {
    minted: !imported,
    identity: {
      name: p.name, city: 'Albuquerque', state: 'NM',
      county: geo.county, postal_code: geo.postal_code ?? null,
      latitude: geo.lat ?? null, longitude: geo.lon ?? null,
      imported_slug: p.importedSlug ?? null,
      canonical_slug: identityRegistry.renames[p.importedSlug]?.canonical ?? p.slug,
    },
    match: {
      source_page: PAGE, quote: p.count,
      basis: imported
        ? `Matched to the imported ${p.importedSlug} row in Albuquerque, NM, at the same street address, and published under its canonical slug ${p.slug}.`
        : p.slug === 'wells-park'
          ? 'No imported row under this name. The imported dataset holds "Johnny Tapia Community Center at Wells Park" with three courts at this address; the City\'s table names the park, so the park is minted here and that row is left pending rather than published as a second venue.'
          : 'No imported row for this park. Minted here from the City\'s own table, which states the count and the address.',
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
const litCourts = VENUES.filter(p => p.light === true).reduce((a, p) => a + (p.lit ?? p.courts), 0)
const dedicated = VENUES.filter(p => p.kind === COMPLEX).reduce((a, p) => a + p.courts, 0) + 2 /* Sierra Vista's two permanent courts */

for (const [slug, entry] of Object.entries(overlay)) {
  const {total_courts: t, indoor_courts: i, outdoor_courts: o} = entry.patch
  if (i != null && o != null && t !== i + o) {
    throw new Error(`Rule 13: ${slug} does not sum.`)
  }
}

const METHOD_NOTE =
  'Albuquerque states name, address and count in three cells of one table on its pickleball page, and the description cell says what kind of court it is counting - "Pickleball Complex" for the two dedicated complexes, "Tennis Courts with Pickleball Lines" for the rest - and marks lighting where it applies. Thirteen of the sixteen rows publish; Pat Hurley, Alamosa and Ventana Ranch are refused because neither resolver finds the address the City writes, which costs twenty-eight courts, twenty of them lit. Manzano Mesa Pickleball Complex\'s "33 Courts (21 Lighted)" is the largest single-venue count on this site. The page source also holds two older tables inside an HTML comment that disagree with the visible table at four venues and name three parks it does not; a comment is not a published record, so those numbers do not invoke the two-records rule that refused Irvine\'s Los Olivos, but the run asserts that the residue is still present and still hidden, so the build fails the day the City puts it back in front of readers. The only statement about nets ("Players need to bring pickleball nets.") is inside that comment and is not published. Hours are stated for the two complexes and Pat Hurley; play is first come, first served with a ninety-minute limit when others are waiting; Sierra Vista\'s courts can be reserved by phone at no stated price. Indoor/outdoor, fee and surface are never stated.'

mkdirSync(join(REPO_ROOT, 'data/verified'), {recursive: true})
writeFileSync(join(REPO_ROOT, 'data/verified/albuquerque-nm.json'), JSON.stringify({
  city: 'Albuquerque', state: 'NM', retrieved_at: RETRIEVED_AT,
  method_note: METHOD_NOTE,
  sources: [
    {url: PAGE, publisher: CITY, tier: 1, format: 'html', snapshot: snapshotPath('pickleball')},
    {url: CENSUS_URL, publisher: 'US Census Bureau', tier: 1, format: 'json', snapshot: 'data/sources/albuquerque-county-census.json'},
  ].map((s, i) => ({id: `S${i + 1}`, ...s})),
  totals: {
    venues: VENUES.length, courts: totalCourts,
    outdoor: null, indoor: null,
    lit_courts: litCourts, dedicated_courts: dedicated,
    free_venues: 0,
  },
  excluded: EXCLUDED.map(e => ({name: e.name, why: e.reasons})),
  venues: overlay,
}, null, 2) + '\n')

const changed = changes.filter(r =>
  r.old_value !== null && r.old_value !== undefined && String(r.old_value) !== String(r.new_value))

writeFileSync(join(REPO_ROOT, 'reports', 'albuquerque-conflicts.md'), [
  '# Albuquerque verification - one table, and an older one hidden in a comment', '',
  `Run ${RETRIEVED_AT}. ${VENUES.length} venues published, ${totalCourts} courts (${litCourts} stated lit). ${EXCLUDED.length} venues refused.`, '',
  'Albuquerque is the first city in New Mexico on this site and the first in Bernalillo County.', '',
  '| venue | courts | kind | lit | what the City writes | address |',
  '| --- | ---: | --- | --- | --- | --- |',
  ...VENUES.map(p => `| \`${p.slug}\` | ${p.courts} | ${p.kind ?? 'not stated'} | ${p.light === true ? `yes (${p.lit} of ${p.courts})` : 'not stated'} | "${p.count}" | ${p.address} |`),
  '',
  '## The older lists are inside an HTML comment', '',
  'The page source carries two further tables - "Locations: Pickleball Complexes" and "Locations: Tennis Courts',
  'Lined for Pickleball" - inside one `<!-- -->` comment. They give Manzano Mesa "18 Courts (6 Lighted)" against the',
  'visible "33 Courts (21 Lighted)", Eagle Ranch 2 against 4, Montgomery 4 against 6, Ventana Ranch "8 Lighted" against',
  '12, and they name Barelas, Los Altos and Zuni Parks, which the visible table does not. A browser renders none of it.',
  'The two-records rule that refused Irvine\'s Los Olivos needs two published statements; a comment is not one. The run',
  'asserts the residue is still present and still hidden, so if the City ever uncomments it the build fails and the',
  'city is re-read under that rule. "Players need to bring pickleball nets." is also inside the comment, so',
  '`nets_provided` stays null.',
  '',
  '## Refused', '',
  ...EXCLUDED.flatMap(e => [
    `**${e.name}** - "${e.row}"`, '',
    ...e.reasons.map((r, i) => `${i + 1}. ${r}`), '']),
  '## What Albuquerque does not say', '',
  '- **indoor or outdoor**, about any venue. Null everywhere.',
  '- **price.** "first come, first serve" is a play format; the Sierra Vista phone reservation carries no price.',
  '- **surface.**',
  '- **lighting**, at every published venue but Manzano Mesa.',
  '- **nets**, on the visible page.',
  '',
  changed.length ? '## Values a source changed' : '_No imported row was overwritten._',
  ...(changed.length ? [
    '', '| venue | field | was | now | outcome |', '| --- | --- | --- | --- | --- |',
    ...changed.map(r => `| \`${r.venue_slug}\` | ${r.field} | ${JSON.stringify(r.old_value)} | ${JSON.stringify(r.new_value)} | ${r.outcome} |`),
  ] : []),
  '',
].join('\n'))

console.log(`\nAlbuquerque, NM - ${VENUES.length} venues, ${totalCourts} courts, retrieved ${RETRIEVED_AT}`)
for (const p of VENUES) {
  const o = overlay[p.slug]
  console.log(
    `  ${o.patch.name.padEnd(32)} ${String(o.patch.total_courts).padStart(2)} | ${(p.light === true ? `lit (${p.lit})` : 'lighting not stated').padEnd(19)} | ${(p.kind ?? 'kind not stated').padEnd(36)} | ${o.patch.county} County | via ${counties[p.geo].resolver}`)
}
console.log(`\n  refused: ${EXCLUDED.map(e => e.name).join(', ')}`)
console.log('\nWrote data/verified/albuquerque-nm.json and reports/albuquerque-conflicts.md\n')
