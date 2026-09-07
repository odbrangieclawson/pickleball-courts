#!/usr/bin/env node
/*
  St. George, UT verification run - city #26, the first in Utah and the
  first in Washington County.

  ============================================================
  ONE LIST, FOUR LINES, AND A THIRTY-THREE
  ============================================================

  The City's pickleball page ends with a block headed "City of St. George
  Pickleball Courts":

      Little Valley / 2149 Horseman Park Drive / Courts:  33
      Vernon Worthen / 300 S. 400 E. / Courts: 6
      Bloomington Park / 650 Man O War Road / Courts: 7
      Ledges / ? / Courts: 4

  Name, address and count on one line each, in the operator's own hand.
  The block is asserted as a whole, in order, so a line moving, a count
  changing or a fifth site appearing fails the build.

  Little Valley's thirty-three is the largest single-venue count this
  directory has published anywhere, ahead of Mesa's twenty-one and San
  Antonio's eighteen. It is a City complex whose page calls it the "Little
  Valley Pickleball Complex", and the City's own description - a complex
  built for this one sport, with an attendant, a programme schedule and a
  court-reservation link - is the definition of the controlled value
  dedicated_pickleball_facility, so that is its venue_type. The other two
  are parks.

  ============================================================
  A DATED ARTICLE IS NOT A CONTRADICTION
  ============================================================

  The same page carries a press article headed "St. George, UT, August 19,
  2020", which says "The Little Valley Pickleball complex is home to 24
  well-maintained courts" and that the City's programme began in 2012 "on
  four permanent and two temporary courts at Vernon Worthen Park".
  Twenty-four is not thirty-three and six is not four-plus-two.

  Irvine's Los Olivos was refused for a disagreement of this shape - but
  there both records were undated and both current, and nothing on the
  page said which was newer. Here one record carries a date six years old
  and describes itself as history; the other is the City's undated
  present-tense inventory list. The list publishes. The article's figures
  are recorded on the venue pages as what the complex was in 2020, and
  both sentences are asserted so that if the City ever revises either, the
  build stops and the reasoning is re-read rather than inherited.

  ============================================================
  WHAT IS STATED, AND WHAT IS NOT
  ============================================================

  fee_type     The article says of Little Valley: "When courts are vacant
               the public readily takes advantage of them - free of
               charge." That is a stated free, for that venue only, with
               its own condition - the courts are reserved for the City's
               programmes on a published schedule, and "Players, please
               check in with the attendant or instructor to determine if
               courts are available during the St. George Pickleball
               programs". Vernon Worthen and Bloomington carry no price
               statement and stay null.

  play_format  No sentence says first come, first served. Null.

  light, surface, indoor/outdoor, hours
               None stated for any venue. All null.

  ============================================================
  WHAT IS REFUSED
  ============================================================

  Ledges       "Ledges / ? / Courts: 4". The City prints a question mark
               where the address goes. Import Gate I1 requires a street
               address, and the operator has said in its own list that it
               does not have one to give.

  ============================================================
  THREE SPELLINGS OF ONE CITY IN THE IMPORT
  ============================================================

  The imported dataset writes the city as "St. George", "St George" and
  "Saint George" on three rows that are these three venues. The overlay
  matches on state|city|slug, so only the row written the way the City
  writes it - worthen-park, "St. George" - is matched; Little Valley and
  Bloomington are minted here under the City's spelling, and the rows under
  the other two spellings stay pending. That is recorded in each venue's
  match block rather than papered over by editing the import.

  The Census address file spells Little Valley's street "HORESMAN PARK DR"
  - a transposition in the file, not a different street: same number, same
  type, no direction, and the only Horseman Park Drive in the city. It is
  noted on the record and the City's spelling publishes.
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

const CITY = 'City of St. George Parks and Recreation'
const PAGE = 'https://sgcityutah.gov/activity/recreation/sports___programs/pickleball/index.php'
const CENSUS_URL = 'https://geocoding.geo.census.gov/geocoder/geographies'

const HEADING = 'City of St. George Pickleball Courts'
const ARTICLE_DATE = 'St. George, UT, August 19, 2020'
const ARTICLE_24 = 'The Little Valley Pickleball complex is home to 24 well-maintained courts.'
const ARTICLE_2012 = 'In 2012, Wayne Bullock established the first pickleball program for the City of St. George on four permanent and two temporary courts at Vernon Worthen Park.'
const FREE = 'When courts are vacant the public readily takes advantage of them - free of charge.'
const CHECK_IN = 'Players, please check in with the attendant or instructor to determine if courts are available during the St. George Pickleball programs'
const COMPLEX_HEADING = 'Little Valley Pickleball Complex'

const VENUES = [
  {
    slug: 'little-valley-pickleball-complex', importedSlug: null, name: 'Little Valley Pickleball Complex',
    geoKey: 'little-valley-pickleball-complex',
    courts: 33, address: '2149 Horseman Park Drive', line: 'Little Valley / 2149 Horseman Park Drive / Courts:  33',
    venueType: 'dedicated_pickleball_facility', free: true,
    availability:
      'Thirty-three pickleball courts at the City\'s Little Valley complex, the largest single-venue count published anywhere in this directory, in the City\'s own list: "Little Valley / 2149 Horseman Park Drive / Courts:  33". This is a programmed facility rather than a park with lines on it: the same page carries the year\'s programme schedule of leagues, clinics, learn-to-play classes and tournaments with courts reserved for each, a "Reserve a Pickleball Court" link, and an attendant - "Players, please check in with the attendant or instructor to determine if courts are available during the St. George Pickleball programs". Outside those times the City states the price in a 2020 article on the same page: "When courts are vacant the public readily takes advantage of them - free of charge." That article also describes the complex as "home to 24 well-maintained courts"; it is dated August 2020, and the City\'s undated current list says thirty-three, which is what publishes. Lighting, surface, hours and whether any court is covered are not stated.',
  },
  {
    slug: 'worthen-park', importedSlug: 'worthen-park', name: 'Vernon Worthen Park',
    geoKey: 'vernon-worthen-park',
    courts: 6, address: '300 S. 400 E.', line: 'Vernon Worthen / 300 S. 400 E. / Courts: 6',
    venueType: 'public_park', free: false,
    availability:
      'Six pickleball courts at Vernon Worthen Park near the centre of St. George, from the City\'s list: "Vernon Worthen / 300 S. 400 E. / Courts: 6". The address is a Utah grid address - 300 South, 400 East - and the Census address file resolves it as written, inside the city. This is where the City\'s pickleball programme began: its own 2020 article says that "In 2012, Wayne Bullock established the first pickleball program for the City of St. George on four permanent and two temporary courts at Vernon Worthen Park", and the ladder-league format devised here was later adopted by USA Pickleball. Six is the current list\'s figure; four-plus-two is the 2012 one. The City states no price, no lighting, no surface and no hours for this park, and this page records each as unknown.',
  },
  {
    slug: 'bloomington-park', importedSlug: null, name: 'Bloomington Park',
    geoKey: 'bloomington-park',
    courts: 7, address: '650 Man O War Road', line: 'Bloomington Park / 650 Man O War Road / Courts: 7',
    venueType: 'public_park', free: false,
    availability:
      'Seven pickleball courts at Bloomington Park in the south-west of the city, from the City\'s list: "Bloomington Park / 650 Man O War Road / Courts: 7". Seven is an odd number for a court block and the City does not say how the courts are laid out or whether any of them share a slab with tennis. It states nothing else about this venue on its pickleball page - no price, no lighting, no surface, no hours - so this page records each of those as unknown rather than guessing from the two City venues that do carry more detail.',
  },
]

const EXCLUDED = [
  {
    name: 'Ledges', line: 'Ledges / ? / Courts: 4',
    reasons: [
      'The City publishes no address: its own list prints "?" where the other three lines carry a street address. Import Gate I1 requires a street address that resolves, and the operator has stated that it has none to give.',
      'Four courts, stated. The venue fails on the one fact it is missing, and the run asserts the question mark so that the day the City fills it in, the build stops and Ledges is re-read.',
    ],
  },
]

/* ---------------------------------------------------------------- */

const snapshotPath = name => `data/sources/st-george/${name}.html`

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
  The list, asserted as a block: the heading, then exactly these four
  lines in this order, and nothing between them.
*/
const page = linesOf(snapshotPath('pickleball'))
const start = page.findIndex(l => squeeze(l) === squeeze(HEADING))
if (start < 0) throw new Error(`The St. George pickleball page no longer carries the heading "${HEADING}".`)
const expected = [...VENUES.map(v => v.line), ...EXCLUDED.map(e => e.line)]
const got = page.slice(start + 1, start + 1 + expected.length)
if (got.map(squeeze).join('|') !== expected.map(squeeze).join('|')) {
  throw new Error(
    'The court list on the St. George pickleball page has changed. Expected exactly the four lines this run ' +
    `reads; the page now reads: "${got.join(' | ')}". Re-read the city.`)
}
if (/Courts?:\s*\d/i.test(page[start + 1 + expected.length] ?? '')) {
  throw new Error(`The St. George list has grown a fifth line: "${page[start + 1 + expected.length]}". Re-read the city.`)
}

/* The dated article, whose figures publish only as history. */
must('pickleball', 'St. George', ARTICLE_DATE, 'article date')
must('pickleball', 'St. George', ARTICLE_24, '2020 count of twenty-four')
must('pickleball', 'St. George', ARTICLE_2012, '2012 origin at Vernon Worthen')
must('pickleball', 'St. George', FREE, 'free-of-charge sentence')
must('pickleball', 'St. George', CHECK_IN, 'check-in rule')
must('pickleball', 'St. George', COMPLEX_HEADING, 'complex heading')

const counties = JSON.parse(
  readFileSync(join(REPO_ROOT, 'data/sources/st-george-county-census.json'), 'utf8'))

const identityRegistry = loadIdentity(REPO_ROOT)
const allRows = loadRows().map(r => mapRow(r).venue)
const bySlug = new Map(
  allRows.filter(v => v.city === 'St. George' && String(v.state).toUpperCase() === 'UT')
    .map(v => [v.slug, v]))

const overlay = {}
const changes = []

for (const p of VENUES) {
  const geo = counties[p.geoKey]
  if (!geo?.matched) throw new Error(`${p.slug}: no address resolver matched its address`)
  if (!geo.place_matches_city) {
    throw new Error(`${p.slug}: the resolver places this at "${geo.place}", not St. George.`)
  }

  const doc = new SourceDocument({
    url: PAGE, retrieved_at: RETRIEVED_AT, tier: 1, publisher: CITY, format: 'html',
  })
  const docCensus = new SourceDocument({
    url: CENSUS_URL, retrieved_at: RETRIEVED_AT, tier: 1, publisher: 'US Census Bureau', format: 'json',
  })

  const shell = {
    slug: p.slug, name: null, city: 'St. George', state: 'UT', county: null,
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
    doc.fact('name', p.name, {
      evidence: p.slug === 'little-valley-pickleball-complex'
        ? `Headed "${COMPLEX_HEADING}" on the City's pickleball page, and listed as "Little Valley" in its court list: "${p.line}".`
        : p.slug === 'worthen-park'
          ? `Listed as "Vernon Worthen" in the City's court list ("${p.line}") and named "Vernon Worthen Park" in the City's own article on the same page.`
          : `Named "${p.name}" in the City's court list: "${p.line}".`,
    }),
    doc.fact('total_courts', p.courts, {
      evidence: `Quoted from the City's pickleball page, under the heading "${HEADING}": "${p.line}".` +
        (p.slug === 'little-valley-pickleball-complex'
          ? ` The City's article on the same page, dated "${ARTICLE_DATE}", says "${ARTICLE_24}" That figure is six years old and describes itself as history; the undated current list says thirty-three, and that is what publishes.`
          : p.slug === 'worthen-park'
            ? ` The City's article on the same page, dated "${ARTICLE_DATE}", says "${ARTICLE_2012}" That is the 2012 origin; the undated current list says six.`
            : ''),
    }),
    doc.fact('street_address', p.address, {
      evidence: `"${p.line}" on the City's pickleball page.` +
        (p.slug === 'little-valley-pickleball-complex'
          ? ' The Census address file spells the street "HORESMAN PARK DR" - a transposition in the file, same number, same type, no direction, and the only Horseman Park Drive in the city; the City\'s spelling publishes.'
          : p.slug === 'worthen-park'
            ? ' A Utah grid address - 300 South, 400 East - which the Census address file resolves as written.'
            : ''),
    }),
    doc.fact('venue_type', p.venueType, {
      evidence: p.venueType === 'dedicated_pickleball_facility'
        ? `The City heads it "${COMPLEX_HEADING}", lists thirty-three courts, publishes a programme schedule with courts reserved for each session, a court-reservation link and an attendant to check in with. A City complex built for one sport is the controlled vocabulary's "purpose-built club or complex where pickleball is the primary sport".`
        : `Published by the ${CITY} among its parks.`,
    }),
    doc.fact('court_availability', p.availability, {
      evidence: `From the City's pickleball page: "${p.line}"` +
        (p.slug === 'little-valley-pickleball-complex' ? `, "${FREE}", "${CHECK_IN}", and "${ARTICLE_24}"` : '') +
        (p.slug === 'worthen-park' ? `, and "${ARTICLE_2012}"` : '') + '.',
    }),
    docCensus.fact('county', geo.county, {
      evidence: `${geo.county} County, UT${geo.county_fips ? ` (FIPS ${geo.state_fips}${geo.county_fips})` : ''}. ${geo.basis} The resolver also places it in the incorporated place "${geo.place}", which is what allows it to be published under St. George.`,
    }),
    docCensus.fact('postal_code', geo.postal_code, {evidence: geo.basis}),
  ]

  if (p.free) {
    facts.push(doc.fact('fee_type', 'free', {
      evidence: `A stated price, in the City's own article on its pickleball page: "${FREE}" It applies to the courts when they are vacant; when the City's programmes have them, "${CHECK_IN}".`,
    }))
    facts.push(doc.fact('pricing_notes',
      'Free of charge when courts are vacant, in the City\'s words. Courts are reserved for the City\'s leagues, clinics, classes and tournaments on the schedule published on its pickleball page; players check in with the attendant or instructor during programme times, and the City also offers online court reservations.', {
        evidence: `"${FREE}" and "${CHECK_IN}", plus the "Reserve a Pickleball Court" link and the programme schedule on the same page.`,
      }))
  }

  const res = applyFacts(venue, facts)

  overlay[p.slug] = {
    minted: !imported,
    identity: {
      name: p.name, city: 'St. George', state: 'UT',
      county: geo.county, postal_code: geo.postal_code ?? null,
      latitude: geo.lat ?? null, longitude: geo.lon ?? null,
      imported_slug: p.importedSlug ?? null,
      canonical_slug: identityRegistry.renames[p.importedSlug]?.canonical ?? p.slug,
    },
    match: {
      source_page: PAGE, quote: p.line,
      basis: imported
        ? 'Matched to the imported worthen-park row in St. George, UT, which carried the address "200 South 400 East" and seven courts; the City\'s own line, 300 S. 400 E. and six courts, replaces both, and the changes are in the changelog.'
        : p.slug === 'little-valley-pickleball-complex'
          ? 'Minted here. The import holds a row for this complex, little-valley-pickleball-court-complex, with the city written "St George" and twenty-four courts; the overlay matches on the city as the City writes it, "St. George", so that row is not matched and stays pending.'
          : 'Minted here. The import holds a row for this park, bloomington-park-saint-george-ut, with the city written "Saint George"; the overlay matches on the city as the City writes it, "St. George", so that row is not matched and stays pending.',
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
  'St. George states a name, a street address and a court count on one line per venue under the heading "City of St. George Pickleball Courts", and the block is asserted as a whole so a line moving or a count changing fails the build. Three venues publish, 46 courts, and Little Valley\'s thirty-three is the largest single-venue count in this directory. Ledges is refused because the City prints "?" where its address goes. The same page carries an article dated 19 August 2020 saying the complex had twenty-four courts and that the programme began in 2012 on four permanent and two temporary courts at Vernon Worthen Park; a dated record that describes itself as history does not contradict an undated current list the way Irvine\'s two current Los Olivos counts contradicted each other, so the list publishes and the article\'s figures are printed as what the venues were. The article also states that Little Valley\'s courts are free of charge when vacant, which publishes as a stated free with the City\'s check-in rule beside it; the other two venues carry no price. Nothing is stated about lighting, surface, indoor or outdoor, or hours at any venue. The imported dataset spells the city three ways across these three venues, so only the row spelled as the City spells it is matched.'

mkdirSync(join(REPO_ROOT, 'data/verified'), {recursive: true})
writeFileSync(join(REPO_ROOT, 'data/verified/st-george-ut.json'), JSON.stringify({
  city: 'St. George', state: 'UT', retrieved_at: RETRIEVED_AT,
  method_note: METHOD_NOTE,
  sources: [
    {url: PAGE, publisher: CITY, tier: 1, format: 'html', snapshot: snapshotPath('pickleball')},
    {url: CENSUS_URL, publisher: 'US Census Bureau', tier: 1, format: 'json', snapshot: 'data/sources/st-george-county-census.json'},
  ].map((s, i) => ({id: `S${i + 1}`, ...s})),
  totals: {
    venues: VENUES.length, courts: totalCourts,
    outdoor: null, indoor: null,
    lit_courts: null, free_venues: VENUES.filter(p => p.free).length,
  },
  excluded: EXCLUDED.map(e => ({name: e.name, why: e.reasons})),
  venues: overlay,
}, null, 2) + '\n')

const changed = changes.filter(r =>
  r.old_value !== null && r.old_value !== undefined && String(r.old_value) !== String(r.new_value))

writeFileSync(join(REPO_ROOT, 'reports', 'st-george-conflicts.md'), [
  '# St. George verification - one list, a thirty-three, and a dated article that is not a contradiction', '',
  `Run ${RETRIEVED_AT}. ${VENUES.length} venues published, ${totalCourts} courts. ${EXCLUDED.length} venue refused.`, '',
  'St. George is the first city in Utah on this site and the first in Washington County. Every count and address',
  `comes from one block on the City's pickleball page, under the heading "${HEADING}".`, '',
  '| venue | courts | fee | what the City writes |',
  '| --- | ---: | --- | --- |',
  ...VENUES.map(p => `| \`${p.slug}\` | ${p.courts} | ${p.free ? 'free (stated, when vacant)' : 'not stated'} | "${p.line}" |`),
  '',
  '## The dated article', '',
  `The page also carries an article dated "${ARTICLE_DATE}" which says "${ARTICLE_24}" and "${ARTICLE_2012}"`,
  'Twenty-four is not thirty-three. Irvine\'s Los Olivos was refused for a disagreement of this shape, but there',
  'both City records were undated and current. Here one record is six years old and describes itself as history,',
  'and the other is the City\'s present-tense inventory. The list publishes; the article\'s figures are printed on',
  'the venue pages as what the venues were, and both sentences are asserted by this run.',
  '',
  '## Refused', '',
  ...EXCLUDED.flatMap(e => [
    `**${e.name}** - "${e.line}"`, '',
    ...e.reasons.map((r, i) => `${i + 1}. ${r}`), '']),
  '## Three spellings of one city', '',
  'The import writes "St. George" (worthen-park), "St George" (little-valley-pickleball-court-complex, 24 courts)',
  'and "Saint George" (bloomington-park-saint-george-ut). The overlay matches on the city as the City writes it,',
  'so only worthen-park is matched; the other two venues are minted and their rows stay pending under the other',
  'spellings.',
  '',
  '## What St. George does not say', '',
  '- **lighting**, at any venue.',
  '- **surface.**',
  '- **indoor or outdoor.** Null everywhere.',
  '- **hours.** The programme schedule gives session times, not opening hours.',
  '- **price**, at Vernon Worthen and Bloomington. Only Little Valley carries the "free of charge" sentence.',
  '',
  changed.length ? '## Values a source changed' : '_No imported row was overwritten._',
  ...(changed.length ? [
    '', '| venue | field | was | now | outcome |', '| --- | --- | --- | --- | --- |',
    ...changed.map(r => `| \`${r.venue_slug}\` | ${r.field} | ${JSON.stringify(r.old_value)} | ${JSON.stringify(r.new_value)} | ${r.outcome} |`),
  ] : []),
  '',
].join('\n'))

console.log(`\nSt. George, UT - ${VENUES.length} venues, ${totalCourts} courts, retrieved ${RETRIEVED_AT}`)
for (const p of VENUES) {
  const o = overlay[p.slug]
  console.log(
    `  ${o.patch.name.padEnd(32)} ${String(o.patch.total_courts).padStart(2)} | ${(p.free ? 'free (stated)' : 'fee not stated').padEnd(15)} | ${o.patch.county} County | ${counties[p.geoKey].postal_code} | via ${counties[p.geoKey].resolver}`)
}
console.log(`\n  refused: ${EXCLUDED.map(e => e.name).join(', ')}`)
console.log('\nWrote data/verified/st-george-ut.json and reports/st-george-conflicts.md\n')
