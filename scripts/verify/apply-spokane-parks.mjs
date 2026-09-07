/*
  Spokane, WA - verification from a text snapshot read in a browser.

  The City of Spokane publishes its pickleball courts on one page,
  https://my.spokanecity.org/recreation/facilities/fields-and-sports/, inside
  a collapsed "Tennis and Pickleball Courts" section. The section holds three
  lists, each line a park, an address and a count:

    Tennis Courts                          - tennis, not published here
    Tennis Courts Striped for Pickleball   - pickleball lines on tennis courts
    Dedicated Pickleball Courts            - courts built for pickleball

  my.spokanecity.org answers every scripted fetch - a bare curl, the full
  browser header set and the web fetcher - with an HTTP 302 into a "Checking
  Your Browser" interstitial, on 2026-09-04 and again on 2026-09-07. The page
  loads normally in a browser, so it was read in one and saved as text with a
  header stating the method, as Cary's and Wichita's pages were. See
  data/sources/spokane/README.md. This run asserts the header, the section
  markers and every line of every list against that file, so the day the City
  adds, removes or renumbers a park, the run fails before anything publishes.

  What publishes and why:
  - The "Tennis Courts Striped for Pickleball" and "Dedicated Pickleball
    Courts" lists are the operator's stated pickleball counts. Each is one
    line, "Park, address, N Courts", and the number is the number.
  - The "Tennis Courts" list is asserted but not published. Corbin Park's
    "1 Court" there is a tennis court; its two pickleball courts are on the
    dedicated list.
  - Comstock (12 on 6 tennis courts) and Mission (16 on 8 tennis courts) are
    striped venues: two pickleball courts to a tennis court. The City's two
    numbers publish as stated; the tennis count is context in the note.
  - Sky Prairie Park is refused. The City writes "8501 N. Nettleton Ct." and
    neither the Census geocoder nor OpenStreetMap resolves that address at
    house-number level (Import Gate I1). The run throws the day it resolves.
  - indoor/outdoor, surface, lights, fee, hours, nets all stay null. The City
    never writes "outdoor", "lit" or a price on this page. "Tennis &
    Pickleball courts are first-come-first-served" publishes as open play;
    the reservation-permit sentence publishes as a pricing note without a
    price, because none is stated.
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
const CITY = 'City of Spokane Parks & Recreation'
const PAGE = 'https://my.spokanecity.org/recreation/facilities/fields-and-sports/'
const SNAPSHOT = 'data/sources/spokane/fields-and-sports.txt'
const CENSUS_URL = 'https://geocoding.geo.census.gov/geocoder/geographies'

const METHOD_LINE = 'METHOD: read in a browser (Chrome, via the Claude browser extension); my.spokanecity.org answers every scripted fetch'
const SECTION_START = '=== SECTION: Tennis and Pickleball Courts ==='
const SECTION_END = '=== END OF SECTION ==='
const INTRO = 'Throughout the city parks system are many tennis courts that host neighborhood pick-up games, parks and recreation classes and many tennis events.'
const RULES = 'Tennis & Pickleball courts are first-come-first-served, however if you would like to officially reserve a court and receive a reservation permit please fill out the online form.'

/* The three lists, exactly as the City prints them, in order. */
const TENNIS_HEADING = 'Tennis Courts'
const STRIPED_HEADING = 'Tennis Courts Striped for Pickleball'
const DEDICATED_HEADING = 'Dedicated Pickleball Courts'

const TENNIS_LIST = [
  'A.M. Cannon Park, 1511 N. Elm St., 2 Courts',
  'Coeur d\' Alene Park, 2195 W. 2nd Ave., 1 Court',
  'Comstock Park, 601 W. 29th Ave., 6 Courts',
  'Corbin Park, 2914 N. West Oval St, 1 Court',
  'Franklin Park, 302 W. Queen Ave., 3 Courts',
  'Friendship Park, 631 E. Greta Ave., 2 Courts',
  'Grant Park, 1015 S. Arthur St., 2 Courts',
  'Mission Park, 1208 E. Mission Ave., 8 Courts',
  'Peaceful Valley Park, 1602 W. Water Ave., 1 Court',
  'Sky Prairie Park, 8501 N. Nettleton Ct., 2 Courts',
  'Westgate Park, 5402 W. Conestoga Ave., 1 Court',
]
const STRIPED_LIST = [
  'A.M. Cannon Park, 1511 N. Elm St., 2 Courts',
  'Comstock Park, 601 W. 29th Ave., 12 Courts',
  'Mission Park, 1208 E. Mission Ave., 16 Courts',
  'Peaceful Valley Park, 1602 W. Water Ave., 2 Courts',
  'Sky Prairie Park, 8501 N. Nettleton Ct., 2 Courts',
]
const DEDICATED_LIST = [
  'Corbin Park, 2914 N. West Oval St, 2 Courts',
  'Underhill Park, 2910 E. Hartson Ave., 2 Courts',
]

/* Every venue is one line in one list. `tennis` is the tennis line, context only. */
const STRIPED = [
  {
    slug: 'am-cannon-park', importedSlug: null, name: 'A.M. Cannon Park', geo: 'am-cannon-park',
    address: '1511 N Elm St', line: 'A.M. Cannon Park, 1511 N. Elm St., 2 Courts', courts: 2,
    tennis: 'A.M. Cannon Park, 1511 N. Elm St., 2 Courts', tennisCourts: 2,
    availability: 'Two pickleball courts striped on the two tennis courts at A.M. Cannon Park, in the West Central neighbourhood north of the river. The City\'s "Tennis Courts Striped for Pickleball" list reads "A.M. Cannon Park, 1511 N. Elm St., 2 Courts", and its "Tennis Courts" list reads the same park with "2 Courts" - so this is one pickleball court to a tennis court, and the courts are shared with tennis. City-wide, "Tennis & Pickleball courts are first-come-first-served", with a reservation permit available by online form. The City states no hours, no lighting, no surface and no price for this park, and does not write the word "outdoor" anywhere on the page.',
  },
  {
    slug: 'comstock-park', importedSlug: 'comstock-park', name: 'Comstock Park', geo: 'comstock-park',
    address: '601 W 29th Ave', line: 'Comstock Park, 601 W. 29th Ave., 12 Courts', courts: 12,
    tennis: 'Comstock Park, 601 W. 29th Ave., 6 Courts', tennisCourts: 6,
    availability: 'Twelve pickleball courts striped on the six tennis courts at Comstock Park on the South Hill, the second-largest set in Spokane. The City\'s "Tennis Courts Striped for Pickleball" list reads "Comstock Park, 601 W. 29th Ave., 12 Courts", and its "Tennis Courts" list reads "Comstock Park, 601 W. 29th Ave., 6 Courts" - two pickleball courts to a tennis court, and what you find depends on whether tennis is being played. Twelve is the City\'s number and publishes as stated. City-wide, "Tennis & Pickleball courts are first-come-first-served", with a reservation permit available by online form. No hours, lighting, surface or price are stated for this park. The imported dataset held Comstock at "3012 S Howard St" with four courts; the City\'s address and count replace both.',
  },
  {
    slug: 'mission-park', importedSlug: 'mission-park', name: 'Mission Park', geo: 'mission-park',
    address: '1208 E Mission Ave', line: 'Mission Park, 1208 E. Mission Ave., 16 Courts', courts: 16,
    tennis: 'Mission Park, 1208 E. Mission Ave., 8 Courts', tennisCourts: 8,
    availability: 'Sixteen pickleball courts striped on the eight tennis courts at Mission Park in the Logan neighbourhood, the largest set in Spokane. The City\'s "Tennis Courts Striped for Pickleball" list reads "Mission Park, 1208 E. Mission Ave., 16 Courts", and its "Tennis Courts" list reads "Mission Park, 1208 E. Mission Ave., 8 Courts" - two pickleball courts to a tennis court, shared with tennis. Sixteen is the City\'s number and publishes as stated. City-wide, "Tennis & Pickleball courts are first-come-first-served", with a reservation permit available by online form. No hours, lighting, surface or price are stated for this park. The imported dataset held the same address and the same count.',
  },
  {
    slug: 'peaceful-valley-park', importedSlug: 'peaceful-valley-park', name: 'Peaceful Valley Park', geo: 'peaceful-valley-park',
    address: '1602 W Water Ave', line: 'Peaceful Valley Park, 1602 W. Water Ave., 2 Courts', courts: 2,
    tennis: 'Peaceful Valley Park, 1602 W. Water Ave., 1 Court', tennisCourts: 1,
    availability: 'Two pickleball courts striped on the one tennis court at Peaceful Valley Park, below the bluff west of downtown. The City\'s "Tennis Courts Striped for Pickleball" list reads "Peaceful Valley Park, 1602 W. Water Ave., 2 Courts", and its "Tennis Courts" list reads "Peaceful Valley Park, 1602 W. Water Ave., 1 Court" - two pickleball courts on one tennis court, shared with tennis. City-wide, "Tennis & Pickleball courts are first-come-first-served", with a reservation permit available by online form. No hours, lighting, surface or price are stated for this park. The imported dataset held this park at "100-198 N Maple St", a street range rather than an address; the City\'s house number replaces it.',
  },
]

const DEDICATED = [
  {
    slug: 'corbin-park', importedSlug: 'corbin-park-spokane-wa', name: 'Corbin Park', geo: 'corbin-park',
    address: '2914 N West Oval St', line: 'Corbin Park, 2914 N. West Oval St, 2 Courts', courts: 2,
    tennis: 'Corbin Park, 2914 N. West Oval St, 1 Court', tennisCourts: 1,
    availability: 'Two dedicated pickleball courts at Corbin Park, the oval park in the Emerson-Garfield neighbourhood north of downtown. The City\'s "Dedicated Pickleball Courts" list reads "Corbin Park, 2914 N. West Oval St, 2 Courts" - courts built for pickleball, not lines on a tennis court. The park also has one tennis court on the City\'s "Tennis Courts" list, which is a different sport and is not counted here. City-wide, "Tennis & Pickleball courts are first-come-first-served", with a reservation permit available by online form. No hours, lighting, surface or price are stated for this park. The imported dataset held Corbin at "501 West Park Place", another side of the same oval; the City\'s address replaces it.',
  },
  {
    slug: 'underhill-park', importedSlug: 'underhill-park-spokane-wa', name: 'Underhill Park', geo: 'underhill-park',
    address: '2910 E Hartson Ave', line: 'Underhill Park, 2910 E. Hartson Ave., 2 Courts', courts: 2,
    tennis: null, tennisCourts: null,
    availability: 'Two dedicated pickleball courts at Underhill Park in the East Central neighbourhood. The City\'s "Dedicated Pickleball Courts" list reads "Underhill Park, 2910 E. Hartson Ave., 2 Courts" - courts built for pickleball, and the only pickleball venue in Spokane with no tennis court beside it, since the park does not appear on the City\'s "Tennis Courts" list. City-wide, "Tennis & Pickleball courts are first-come-first-served", with a reservation permit available by online form. No hours, lighting, surface or price are stated for this park. The imported dataset held the same address and the same count.',
  },
]

const EXCLUDED = [
  {
    name: 'Sky Prairie Park', geo: 'sky-prairie-park', line: 'Sky Prairie Park, 8501 N. Nettleton Ct., 2 Courts',
    reasons: [
      'The City states two pickleball courts and an address, "Sky Prairie Park, 8501 N. Nettleton Ct., 2 Courts", and the address does not resolve. The Census address geocoder returns no match for 8501 N Nettleton Ct, Spokane, WA, and OpenStreetMap has no house number for it. Import Gate I1 requires an address that resolves as written at house-number level; this project has never published one that does not, and has never taken an address from outside the operator.',
      'The count is real and the refusal is on the address alone. This run throws the day either resolver matches it, so the venue cannot stay refused once it is publishable.',
    ],
  },
]

/* ---------------------------------------------------------------- */

const raw = readFileSync(join(REPO_ROOT, SNAPSHOT), 'utf8')
const lines = raw.split('\n').map(s => s.trim()).filter(Boolean)
const squeeze = s => s.replace(/\s+/g, '')
const whole = squeeze(lines.join(' '))

const must = (needle, what) => {
  if (!whole.includes(squeeze(needle))) {
    throw new Error(`Spokane: the snapshot no longer contains the ${what} text "${needle}". Re-read the page in a browser before trusting this run.`)
  }
}

/* The file's own provenance, then the page's framing. */
must(`URL: ${PAGE}`, 'snapshot URL header')
must(`RETRIEVED: ${RETRIEVED_AT}`, 'snapshot retrieval date')
must(METHOD_LINE, 'snapshot METHOD header')
must(SECTION_START, 'section start marker')
must(SECTION_END, 'section end marker')
must(INTRO, 'section introduction')
must(RULES, 'first-come-first-served and reservation-permit sentence')

/* The section's lines: from its start marker to its end marker. */
const from = lines.findIndex(l => l === SECTION_START)
const to = lines.findIndex((l, i) => i > from && l === SECTION_END)
if (from < 0 || to < 0) throw new Error('Spokane: the section markers are missing or out of order.')
const SECTION = lines.slice(from + 1, to)
if (!SECTION.includes(INTRO) || !SECTION.includes(RULES)) throw new Error('Spokane: the introduction is no longer inside the section.')

/*
  A list: from its heading to the next heading or the end of the section. It
  must equal the expected lines exactly, in order - one line more, one line
  fewer, one number changed, and the run fails.
*/
const HEADINGS = [TENNIS_HEADING, STRIPED_HEADING, DEDICATED_HEADING]
function assertList(heading, expected) {
  const at = SECTION.findIndex(l => l === heading)
  if (at < 0) throw new Error(`Spokane: the section no longer carries the heading "${heading}". Re-read the page.`)
  const end = SECTION.findIndex((l, i) => i > at && HEADINGS.includes(l))
  const got = SECTION.slice(at + 1, end < 0 ? undefined : end)
  if (got.length !== expected.length || got.some((l, i) => squeeze(l) !== squeeze(expected[i]))) {
    throw new Error(`Spokane: the "${heading}" list no longer reads as asserted.\n  expected: ${JSON.stringify(expected)}\n  found:    ${JSON.stringify(got)}\nRe-read the page.`)
  }
  return got
}
assertList(TENNIS_HEADING, TENNIS_LIST)
assertList(STRIPED_HEADING, STRIPED_LIST)
assertList(DEDICATED_HEADING, DEDICATED_LIST)

/* A park name must appear once in each pickleball list, and not in both. */
const parkOf = l => l.split(',')[0].trim()
const stripedNames = STRIPED_LIST.map(parkOf)
const dedicatedNames = DEDICATED_LIST.map(parkOf)
for (const list of [stripedNames, dedicatedNames]) {
  for (const n of list) if (list.filter(x => x === n).length > 1) throw new Error(`Spokane: "${n}" appears twice in one list; two numbers for one park.`)
}
for (const n of stripedNames) if (dedicatedNames.includes(n)) throw new Error(`Spokane: "${n}" is on both pickleball lists; the two counts would have to be summed and stated as such.`)

/* Every published venue's line is in its list and its tennis line, where claimed, in the tennis list. */
for (const p of STRIPED) if (!STRIPED_LIST.includes(p.line)) throw new Error(`${p.slug}: line not in the striped list.`)
for (const p of DEDICATED) if (!DEDICATED_LIST.includes(p.line)) throw new Error(`${p.slug}: line not in the dedicated list.`)
for (const p of [...STRIPED, ...DEDICATED]) {
  const tennisLines = TENNIS_LIST.filter(l => parkOf(l) === p.name)
  if (p.tennis) {
    if (!tennisLines.includes(p.tennis)) throw new Error(`${p.slug}: tennis line "${p.tennis}" not in the tennis list.`)
    if (!p.tennis.endsWith(`, ${p.tennisCourts} Court${p.tennisCourts === 1 ? '' : 's'}`)) throw new Error(`${p.slug}: tennis count ${p.tennisCourts} does not match its line.`)
  } else if (tennisLines.length) {
    throw new Error(`${p.slug}: now has a tennis line "${tennisLines[0]}"; the note says it has none.`)
  }
  if (!p.line.endsWith(`, ${p.courts} Courts`)) throw new Error(`${p.slug}: count ${p.courts} does not match its line "${p.line}".`)
}

/* The refusal, asserted rather than remembered. */
const counties = JSON.parse(readFileSync(join(REPO_ROOT, 'data/sources/spokane-county-census.json'), 'utf8'))
for (const e of EXCLUDED) {
  if (!STRIPED_LIST.includes(e.line)) throw new Error(`${e.name}: its line is no longer in the striped list; re-read and reconsider the refusal.`)
  const geo = counties[e.geo]
  if (!geo) throw new Error(`${e.name}: no geocoder result recorded; run the geocoder before deciding.`)
  if (geo.matched) throw new Error(`${e.name}: its address now resolves via ${geo.resolver} ("${geo.matched}"). The refusal no longer holds - publish it.`)
}

const identityRegistry = loadIdentity(REPO_ROOT)
const allRows = loadRows().map(r => mapRow(r).venue)
const bySlug = new Map(
  allRows.filter(v => v.city === 'Spokane' && String(v.state).toUpperCase() === 'WA')
    .map(v => [v.slug, v]))

const overlay = {}
const changes = []

const ALL = [
  ...STRIPED.map(p => ({...p, list: 'striped'})),
  ...DEDICATED.map(p => ({...p, list: 'dedicated'})),
]

for (const p of ALL) {
  const geo = counties[p.geo]
  if (!geo?.matched) throw new Error(`${p.slug}: no address resolver matched its address`)
  if (!geo.place_matches_city) throw new Error(`${p.slug}: the resolver places this at "${geo.place}", not Spokane.`)
  if (p.importedSlug && !bySlug.has(p.importedSlug)) throw new Error(`${p.slug}: imported row ${p.importedSlug} is no longer in data.csv for Spokane, WA.`)

  const doc = new SourceDocument({url: PAGE, retrieved_at: RETRIEVED_AT, tier: 1, publisher: CITY, format: 'text'})
  const docCensus = new SourceDocument({url: CENSUS_URL, retrieved_at: RETRIEVED_AT, tier: 1, publisher: 'US Census Bureau', format: 'json'})

  const shell = {
    slug: p.slug, name: null, city: 'Spokane', state: 'WA', county: null,
    postal_code: null, street_address: null, latitude: null, longitude: null,
    status: 'pending', source_url: null, date_checked: null, verified_by: null,
    claimed_by_owner: false, claim_date: null,
    rating: null, user_rating: null, review_count: null, claimed_or_verified: null,
    source_sport: 'pickleball',
  }
  for (const f of PUBLISHED_FACT_FIELDS) shell[f] = null
  const imported = p.importedSlug ? bySlug.get(p.importedSlug) : undefined
  const venue = imported ?? shell

  const listName = p.list === 'striped' ? STRIPED_HEADING : DEDICATED_HEADING
  const quoted = `"${p.line}"`

  const facts = [
    doc.fact('name', p.name, {
      evidence: `Named "${p.name}" on the "${listName}" list of the City's Tennis and Pickleball Courts section.`,
    }),
    doc.fact('total_courts', p.courts, {
      evidence: p.list === 'striped'
        ? `Quoted from the "${listName}" list: ${quoted}. The same park's tennis line reads "${p.tennis}"; the pickleball count is the one published.`
        : `Quoted from the "${listName}" list: ${quoted}.` + (p.tennis ? ` The park's "${p.tennis}" on the Tennis Courts list is a tennis court, not counted.` : ''),
    }),
    doc.fact('street_address', p.address, {
      evidence: `${quoted} on the "${listName}" list; the City writes the street with a full stop after the type.`,
    }),
    doc.fact('venue_type', 'public_park', {
      evidence: `Published by ${CITY} among the parks of the city parks system.`,
    }),
    doc.fact('play_format', 'open_play', {
      evidence: `"${RULES}" - the rule is stated for every tennis and pickleball court in the section, this park included.`,
    }),
    doc.fact('pricing_notes',
      'Courts are first-come-first-served. A court can be officially reserved with a reservation permit by online form; the City publishes no price for the permit and does not say the courts are free.', {
        evidence: `"${RULES}" No fee or price appears anywhere in the section.`,
      }),
    doc.fact('court_availability', p.availability, {
      evidence: `From the "${listName}" list: ${quoted}.` + (p.tennis ? ` Tennis Courts list: "${p.tennis}".` : ''),
    }),
    docCensus.fact('county', geo.county, {
      evidence: `${geo.county} County, WA${geo.county_fips ? ` (FIPS ${geo.state_fips}${geo.county_fips})` : ''}. ${geo.basis} The resolver also places it in the incorporated place "${geo.place}", which is what allows it to be published under Spokane.`,
    }),
    docCensus.fact('postal_code', geo.postal_code, {evidence: geo.basis}),
  ]

  const res = applyFacts(venue, facts)

  overlay[p.slug] = {
    minted: !imported,
    identity: {
      name: p.name, city: 'Spokane', state: 'WA',
      county: geo.county, postal_code: geo.postal_code ?? null,
      latitude: geo.lat ?? null, longitude: geo.lon ?? null,
      imported_slug: p.importedSlug ?? null,
      canonical_slug: identityRegistry.renames[p.importedSlug]?.canonical ?? p.slug,
    },
    match: {
      source_page: PAGE, quote: p.line,
      basis: imported
        ? p.slug === 'comstock-park'
          ? 'Matched to the imported comstock-park row in Spokane, WA (which carried "3012 S Howard St" and four courts). Howard Street and 29th Avenue bound the same park; the City\'s address and count publish.'
          : p.slug === 'peaceful-valley-park'
            ? 'Matched to the imported peaceful-valley-park row in Spokane, WA (which carried the street range "100-198 N Maple St"). The City\'s house number publishes.'
            : p.slug === 'corbin-park'
              ? 'Matched to the imported corbin-park-spokane-wa row in Spokane, WA (which carried "501 West Park Place", another side of the same oval), published under the canonical slug corbin-park; the identity pass dropped the trailing "-spokane-wa", which is already in the path.'
              : p.slug === 'underhill-park'
                ? 'Matched to the imported underhill-park-spokane-wa row in Spokane, WA at the same street address, published under the canonical slug underhill-park.'
                : `Matched to the imported ${p.importedSlug} row in Spokane, WA, at the same street address.`
        : 'Minted from the City\'s page. The imported dataset holds no row for A.M. Cannon Park in Spokane, WA.',
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

const totalCourts = ALL.reduce((a, p) => a + p.courts, 0)
const stripedCourts = STRIPED.reduce((a, p) => a + p.courts, 0)
const dedicatedCourts = DEDICATED.reduce((a, p) => a + p.courts, 0)

/* Rule 13: nothing here states indoor or outdoor, so there is no sum to check per venue; the lists must sum to the city. */
for (const [slug, entry] of Object.entries(overlay)) {
  const {total_courts: t, indoor_courts: i, outdoor_courts: o} = entry.patch
  if (i != null || o != null) throw new Error(`Rule 13: ${slug} carries an indoor or outdoor count the City never states.`)
  if (!Number.isInteger(t) || t < 1) throw new Error(`Rule 13: ${slug} has no count.`)
}
if (stripedCourts + dedicatedCourts !== totalCourts) throw new Error('Rule 13: the city does not sum.')

const METHOD_NOTE =
  'Spokane\'s Tennis and Pickleball Courts section states a count for every park it lists, in three lists: tennis courts, tennis courts striped for pickleball, and dedicated pickleball courts. The page could not be fetched by any script - my.spokanecity.org answers a bare request, a full browser header set and the web fetcher with a 302 into a "Checking Your Browser" interstitial - so it was read in a browser and saved as text with a header stating the method, as Cary\'s and Wichita\'s pages were; this run asserts the header, the section markers and every line of all three lists against that file. The striped and dedicated lists publish; the tennis list is asserted for context only, and Corbin Park\'s one tennis court is not counted. Comstock (twelve on six tennis courts) and Mission (sixteen on eight) publish the City\'s pickleball number as stated. Sky Prairie Park is refused because "8501 N. Nettleton Ct." resolves at no house number in either resolver. Indoor and outdoor stay null: the City never writes "outdoor" on this page. Surface, lighting, hours and nets stay null for the same reason. "Tennis & Pickleball courts are first-come-first-served" publishes as open play; the reservation permit publishes as a pricing note with no price, because none is stated, and no venue is published as free.'

mkdirSync(join(REPO_ROOT, 'data/verified'), {recursive: true})
writeFileSync(join(REPO_ROOT, 'data/verified/spokane-wa.json'), JSON.stringify({
  city: 'Spokane', state: 'WA', retrieved_at: RETRIEVED_AT,
  method_note: METHOD_NOTE,
  sources: [
    {url: PAGE, publisher: CITY, tier: 1, format: 'text', snapshot: SNAPSHOT,
      method: 'Read in a browser on 2026-09-07 because my.spokanecity.org answers scripted fetches with a 302 into a "Checking Your Browser" interstitial; the collapsed "Tennis and Pickleball Courts" section was captured from the rendered DOM. See data/sources/spokane/README.md.'},
    {url: CENSUS_URL, publisher: 'US Census Bureau', tier: 1, format: 'json', snapshot: 'data/sources/spokane-county-census.json'},
  ].map((s, i) => ({id: `S${i + 1}`, ...s})),
  totals: {
    venues: ALL.length, courts: totalCourts,
    outdoor: null, indoor: null,
    striped_on_tennis: stripedCourts, dedicated: dedicatedCourts,
    lit_courts: 0, free_venues: 0,
  },
  excluded: EXCLUDED.map(e => ({name: e.name, why: e.reasons})),
  venues: overlay,
}, null, 2) + '\n')

const changed = changes.filter(r =>
  r.old_value !== null && r.old_value !== undefined && String(r.old_value) !== String(r.new_value))

writeFileSync(join(REPO_ROOT, 'reports', 'spokane-conflicts.md'), [
  '# Spokane verification - a page behind a browser check, read in a browser', '',
  `Run ${RETRIEVED_AT}. ${ALL.length} venues published, ${totalCourts} courts (${stripedCourts} striped on tennis courts, ${dedicatedCourts} dedicated). ${EXCLUDED.length} venue refused.`, '',
  'Spokane is the fifth city in Washington on this site and the first in Spokane County. Its source is a',
  'text snapshot read in a browser, because my.spokanecity.org answers every scripted fetch with a 302 into',
  'a "Checking Your Browser" interstitial; see `data/sources/spokane/README.md`. Every line of all three',
  'lists in the Tennis and Pickleball Courts section is asserted against that file, in order.', '',
  '| venue | courts | list | what the City writes | tennis line |',
  '| --- | ---: | --- | --- | --- |',
  ...ALL.map(p => `| \`${p.slug}\` | ${p.courts} | ${p.list} | "${p.line}" | ${p.tennis ? `"${p.tennis}"` : '-'} |`),
  '',
  '## Striped means two numbers, and the pickleball one publishes', '',
  'Comstock has "6 Courts" on the Tennis Courts list and "12 Courts" on the striped list; Mission has "8"',
  'and "16"; Peaceful Valley "1" and "2"; A.M. Cannon "2" and "2". The pickleball number is the operator\'s',
  'stated pickleball count and publishes as stated. The tennis number is quoted in each venue\'s note so a',
  'reader knows the courts are shared with tennis.',
  '',
  '## Corbin\'s tennis court is not a pickleball court', '',
  '"Corbin Park, 2914 N. West Oval St, 1 Court" is on the Tennis Courts list and "Corbin Park, 2914 N. West',
  'Oval St, 2 Courts" on the Dedicated Pickleball Courts list. Two publishes; the tennis court is a different',
  'sport.',
  '',
  '## Nothing is indoor, outdoor, lit, surfaced or priced', '',
  'The City does not write "outdoor", "lit", a surface or a price anywhere in the section, so every one of',
  'those fields is null on every venue. "Tennis & Pickleball courts are first-come-first-served" publishes',
  'as open play, and the reservation permit as a pricing note without a price. No venue is published as free.',
  '',
  '## Refused', '',
  ...EXCLUDED.flatMap(e => [`**${e.name}** - "${e.line}"`, '', ...e.reasons.map((r, i) => `${i + 1}. ${r}`), '']),
  '## Imported rows left pending', '',
  '- **Grant Park** (imported as one pickleball court at 1015 South Arthur Street) is on the City\'s Tennis',
  '  Courts list only, "Grant Park, 1015 S. Arthur St., 2 Courts", and on neither pickleball list. Not published.',
  '- **Sky Prairie Park** (imported as four courts) is refused above; the City says two.',
  '- Schools, clubs, churches and gyms in the imported rows are not on the City\'s page and stay pending.',
  '',
  changed.length ? '## Values a source changed' : '_No imported row was overwritten._',
  ...(changed.length ? [
    '', '| venue | field | was | now | outcome |', '| --- | --- | --- | --- | --- |',
    ...changed.map(r => `| \`${r.venue_slug}\` | ${r.field} | ${JSON.stringify(r.old_value)} | ${JSON.stringify(r.new_value)} | ${r.outcome} |`),
  ] : []),
  '',
].join('\n'))

console.log(`\nSpokane, WA - ${ALL.length} venues, ${totalCourts} courts (${stripedCourts} striped on tennis courts, ${dedicatedCourts} dedicated), retrieved ${RETRIEVED_AT}`)
for (const p of ALL) {
  const o = overlay[p.slug]
  console.log(`  ${o.patch.name.padEnd(24)} ${String(o.patch.total_courts).padStart(2)} | ${p.list.padEnd(9)} | ${o.patch.county} County | ${counties[p.geo].postal_code} | via ${counties[p.geo].resolver}`)
}
console.log(`\n  refused: ${EXCLUDED.map(e => e.name).join(', ')}`)
console.log('\nWrote data/verified/spokane-wa.json and reports/spokane-conflicts.md\n')
