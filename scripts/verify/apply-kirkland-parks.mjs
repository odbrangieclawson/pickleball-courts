#!/usr/bin/env node
/*
  Kirkland, WA verification run - city #15, Washington's fourth city and
  the third in King County after Seattle and Bellevue.

  ============================================================
  THE SECOND CITY RECOVERED FROM THE 403 BUCKET
  ============================================================

  Kirkland was refused during the runs for cities #9 to #12 on an HTTP 403,
  one of sixteen cities in that bucket in PHASES.md. Mesa came out of it as
  city #14 and the retest was extended across the rest of the bucket while
  choosing this one. The complete result, which is now the useful part:

    reachable now   Mesa, Durham, Kirkland, Fort Collins
    still refusing  Spokane, Greensboro, Redmond, Wichita, Eugene,
                    Olympia, Overland Park, Minneapolis, Tucson

  Four of sixteen. Spokane is the painful one - it publishes a court count
  and a street address for twelve parks, which is among the best municipal
  data seen anywhere, and it answers both a bare curl and a full browser
  header set with a 403. It stays refused, and it stays on the list.

  ============================================================
  HOW KIRKLAND STATES A COURT COUNT
  ============================================================

  In a table, on one page, with a column headed "Number & Type of Courts":

      Everest Park          8 AM to dusk    3 pickleball courts
      Feriton Spur Park     8 AM to dusk    1 pickleball court
      Peter Kirk Park       8 AM to dusk    6 pickleball courts

  That column heading is doing real work. Most operators in this directory
  make you infer whether a number counts pickleball courts or tennis courts
  wearing pickleball lines. Kirkland names the type in the same cell as the
  number, and every one of the ten says "pickleball courts".

  ============================================================
  PETER KIRK'S SIX COURTS ARE TWO MONTHS OLD
  ============================================================

  The newest venue in this directory by a wide margin, and the City
  documents the whole conversion on the park's own page:

      "The Peter Kirk tennis courts closed on Monday, April 13, 2026 for
       conversion to six dedicated pickleball courts."
      "The new pickleball courts opened July 2, 2026 at 3 p.m."

  Six DEDICATED courts - the City's word - where six tennis courts stood in
  April. The imported dataset has no row for Peter Kirk Park at all, which
  is the expected consequence rather than a gap: the import predates the
  conversion, so the venue is minted here from the City's pages.

  ============================================================
  VAN AALST PARK IS REFUSED, AND THE CITY DISAGREES WITH ITSELF
  ============================================================

  The pickleball page's table is a closed list of three. A fourth park's own
  page says:

      "Van Aalst Park has half-basketball court with lines drawn for
       pickleball. This multisport court is available for drop-in use only.
       For pickleball use, players must bring their own nets."

  So the City has pickleball lines at a park its pickleball page does not
  list. That is the Saint Paul and Lincoln pattern for the third time: an
  operator keeping two records of its own courts that do not match. It is
  settled the same way - the record that states a NUMBER publishes - and
  here neither record states one, because "half-basketball court with lines
  drawn for pickleball" counts no courts. Both grounds are recorded and the
  run asserts both, so if the City ever puts Van Aalst in the table with a
  figure, this build fails rather than continuing to leave it out.

  ============================================================
  WHAT IS NOT CLAIMED
  ============================================================

  light       Not stated at any of the three, and this is the closest call
              in the run. Every court closes at DUSK - the City says so
              four times - which in practice means an unlit court, and
              Peter Kirk Park's page mentions "a lighted baseball field" in
              the same paragraph as the courts. A lit ballfield is not a
              lit court, and a closing time is not a statement about
              lighting. Vancouver's Oakbrook Park publishes "No" because
              the City wrote "The courts do not have lighting"; Kirkland
              has written no such sentence, so light stays null and no
              Kirkland venue reaches the /lights/ filter page.

  fee         Not stated for pickleball anywhere. There is a trap on
              Everest Park's page: it carries a heading reading "Free Play"
              with a schedule, and that programme is FIELD time - "field
              time set aside for the community", grass and synthetic turf.
              It is not a statement that the pickleball courts are free,
              and it is not read as one. fee_type stays null at all three,
              so Kirkland publishes no /free/ filter page.

  indoor/     Not stated in those words, though every venue is a park court
  outdoor     closing at dusk. Following the rule Mesa set eight days of
              work ago, the breakdowns stay null rather than being inferred
              from a closing time.

  surface     Stated nowhere in Kirkland.
*/

import {readFileSync, writeFileSync, mkdirSync} from 'node:fs'
import {join} from 'node:path'
import {SourceDocument} from './provenance.mjs'
import {applyFacts, changelogToRows} from './conflict.mjs'
import {loadRows, REPO_ROOT} from '../lib/load-csv.mjs'
import {PUBLISHED_FACT_FIELDS} from '../../lib/data/verified.mjs'
import {loadIdentity} from '../../lib/data/identity.mjs'
import {mapRow} from '../import/mapper.mjs'

const RETRIEVED_AT = process.env.RETRIEVED_AT ?? '2026-09-04'

const CITY = 'City of Kirkland Parks and Community Services'
const BASE = 'https://www.kirklandwa.gov/Government/Departments/Parks-and-Community-Services'
const PAGE = `${BASE}/Recreation-Programs-Services/Pickleball`
const PARK_BASE = `${BASE}/Find-a-Park`
const CENSUS_URL = 'https://geocoding.geo.census.gov/geocoder/geographies'

/* The city-wide rules every venue page rests on. */
const FIRST_COME = 'All City of Kirkland pickleball courts are available on a first-come, first-served basis.'
const NO_BUSINESS = 'The use of pickleball courts for business purposes is not allowed, including lessons, leagues, or tournaments.'
const HOURS_RULE = 'Outdoor pickleball courts are available from 8 AM to dusk.'
const HOURS_TEXT = 'Open 8 a.m. to dusk, daily.'

const VENUES = [
  {
    slug: 'peter-kirk-park', importedSlug: null, name: 'Peter Kirk Park',
    page: 'peter-kirk-park', courts: 6,
    address: '202 3rd St', postcodeLine: '202 3rd St, Kirkland 98033',
    listQuote: '6 pickleball courts',
    parkQuote: 'Peter Kirk Park has six pickleball courts and one basketball court.',
    dedicated: true,
    restroom: true,
    parking: 'Parking is available in the Municipal Parking Garage or along Central Way.',
    availability:
      'Six dedicated pickleball courts, and they are the newest courts in this directory: the City closed the Peter Kirk tennis courts on 13 April 2026 for "conversion to six dedicated pickleball courts", and reopened them as pickleball courts on 2 July 2026 at 3 p.m. Dedicated means what it says here - these are not tennis courts wearing a second set of lines, they are courts that used to be tennis courts and are now not. The City splits them in two and posts a different rule on each half: three courts nearest the skate park are open play, where a full court with players waiting means one game to 11 points and then rotate off, and three courts nearest the street are timed courts, where a full court with players waiting means a 30-minute limit. They are drop-in only, first-come first-served, and open 8 a.m. to dusk daily. The park sits next to downtown Kirkland with a year-round restroom on its west side, public Wi-Fi, a skate park, a seasonal pool and the Kirkland Performance Center, library and transit centre next door.',
  },
  {
    slug: 'everest-park', importedSlug: 'everest-park-pickleball-courts', name: 'Everest Park',
    page: 'everest-park', courts: 3,
    address: '500 8th St S', postcodeLine: '500 8th St S, Kirkland 98033',
    listQuote: '3 pickleball courts',
    parkQuote: null,
    /* Its own page names pickleball and never counts it. Asserted as an absence. */
    parkPageUncounted: true,
    dedicated: false,
    restroom: true,
    parking: 'There are two parking lots at Everest with space for up to 100 vehicles.',
    availability:
      'Three pickleball courts in a community park south-east of downtown, open 8 a.m. to dusk and drop-in only - the park\'s own page says so in as many words: "The pickleball courts are available for drop in use only." All three are open play courts, and the City\'s rule for them is the one it posts city-wide: if the courts are full and players are waiting, play one game to 11 points and rotate off. Parking is the best-documented of any venue on this site - the City states "There are two parking lots at Everest with space for up to 100 vehicles" - and there are year-round restrooms, replaced in 2026, plus ballfields, a playground and a picnic shelter. One caveat belongs here rather than buried: the count of three comes from the City\'s pickleball page alone. The park\'s own page names the pickleball courts repeatedly and never says how many there are.',
  },
  {
    slug: 'feriton-spur-park', importedSlug: 'kirkland-feriton-spur-park-kirkland-wa', name: 'Feriton Spur Park',
    page: 'feriton-spur-park', courts: 1,
    address: '509 6th Street South', postcodeLine: '509 6th Street South, Kirkland 98033',
    listQuote: '1 pickleball court',
    parkQuote: 'a 44-foot pickleball court',
    dedicated: false,
    restroom: true,
    parking: null,
    availability:
      'One pickleball court, counted twice by the City in two different vocabularies: its pickleball page lists "1 pickleball court", and the park\'s own page describes "a 44-foot pickleball court" - forty-four feet being the regulation length of one. Open 8 a.m. to dusk, drop-in and first-come first-served like every Kirkland court. The park itself is newer than most: it was renovated and expanded by Google and SRM Development in 2021-2022, and alongside the court it carries a 16-foot-wide paved trail, an urban farm growing vegetables for Hopelink, a splash area, a zip-line, a sand volleyball court, a basketball court, a grass amphitheatre and year-round bathrooms. One court is one court, so this is a place to hit rather than a place to run a rotation.',
  },
]

/* The venue the City has pickleball lines at and does not count. */
const EXCLUDED = [
  {
    name: 'Van Aalst Park', page: 'van-aalst-park', address: '335 13th Avenue',
    quote: 'Van Aalst Park has half-basketball court with lines drawn for pickleball.',
    reasons: [
      'The City states no court count. Its page reads "Van Aalst Park has half-basketball court with lines drawn for pickleball", which describes a surface rather than counting courts, and Page Gate 1 requires a stated count.',
      'It is also absent from the City\'s own pickleball page, whose "Where to Play" table is a closed list of three parks. So Kirkland is the third city in this directory whose operator keeps two records of its own courts that do not agree, after Saint Paul and Lincoln. Neither of Kirkland\'s two records states a number for Van Aalst, so unlike those cities there is nothing here to publish.',
      'The park page adds that "For pickleball use, players must bring their own nets", so this is a half-basketball court you may play pickleball on rather than a pickleball court. That is context for the refusal rather than a ground of its own.',
    ],
  },
]

/* ---------------------------------------------------------------- */

const snapshotPath = name => `data/sources/kirkland/${name}.html`

const linesOf = rel => readFileSync(join(REPO_ROOT, rel), 'utf8')
  .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
  .replace(/<[^>]+>/g, '\n')
  .replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&#0?39;|&apos;|&lsquo;|&rsquo;|&#8217;|[‘’]/g, "'")
  .replace(/&quot;|[“”]/g, '"')
  .replace(/&#8211;|&#8212;|&ndash;|&mdash;|[–—‑]/g, '-')
  .split('\n').map(s => s.trim()).filter(Boolean)

const squeeze = s => s.replace(/\s+/g, '')
const textOf = name => squeeze(linesOf(snapshotPath(name)).join(' '))

const must = (page, who, needle, what) => {
  if (!textOf(page).includes(squeeze(needle))) {
    throw new Error(`${who}: the ${page} snapshot no longer contains the ${what} text "${needle}".`)
  }
}

const mustNot = (page, who, needle, what) => {
  if (textOf(page).includes(squeeze(needle))) {
    throw new Error(
      `${who}: the ${page} snapshot NOW contains "${needle}" (${what}). ` +
      'What this run says about that page has expired; re-read it.')
  }
}

const pickleball = textOf('pickleball')

/* The city-wide rules every availability note and every play_format rests on. */
for (const [needle, what] of [
  [FIRST_COME, 'first-come first-served rule'],
  [NO_BUSINESS, 'no-business-use rule'],
  [HOURS_RULE, 'dusk closing rule'],
  ['Number & Type of Courts', 'the column heading that names the court type'],
]) {
  if (!pickleball.includes(squeeze(needle))) {
    throw new Error(`The Kirkland pickleball page no longer states the ${what}: "${needle}"`)
  }
}

/* ---------------------------------------------------------------- */
/* THE REFUSAL, ASSERTED RATHER THAN REMEMBERED.                     */

for (const e of EXCLUDED) {
  must(e.page, e.name, e.quote, 'the uncounted description')
  must(e.page, e.name, e.address, 'address of the refused venue')
  /*
    Two grounds, two assertions. If the City counts it, or lists it on the
    pickleball page, this venue should be published and the build stops.
  */
  if (/\b(one|two|three|four|five|six|\d+)\s*pickleballcourt/i.test(textOf(e.page).replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\s+/g, ''))) {
    throw new Error(`${e.name}: its page NOW states a pickleball court count. Re-read it and publish it.`)
  }
  mustNot('pickleball', e.name, e.name, 'it is now listed on the City pickleball page')
}

const counties = JSON.parse(
  readFileSync(join(REPO_ROOT, 'data/sources/kirkland-county-census.json'), 'utf8'))

const identityRegistry = loadIdentity(REPO_ROOT)
const allRows = loadRows().map(r => mapRow(r).venue)
const bySlug = new Map(
  allRows.filter(v => v.city === 'Kirkland' && String(v.state).toUpperCase() === 'WA')
    .map(v => [v.slug, v]))

const overlay = {}
const changes = []

for (const p of VENUES) {
  /* The count, on the page whose column heading names the type. */
  must('pickleball', p.slug, p.listQuote, 'court count')
  must('pickleball', p.slug, p.name, 'venue name in the Where to Play table')
  must(p.page, p.slug, p.postcodeLine, 'address on the park page')

  if (p.parkPageUncounted) {
    /*
      Everest names its pickleball courts and never counts them. The day it
      does, this venue gains a second City source and its page stops needing
      to say it has only one.
    */
    must(p.page, p.slug, 'pickleball', 'pickleball named on the park page')
    if (/\b(one|two|three|four|five|six|\d+)\s*pickleballcourt/i.test(
      textOf(p.page).replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\s+/g, ''))) {
      throw new Error(
        `${p.slug}: its park page NOW states a court count. The venue page says the count rests ` +
        'on the pickleball page alone; that caveat has expired.')
    }
  } else {
    must(p.page, p.slug, p.parkQuote, 'corroborating count')
  }

  const geo = counties[p.slug]
  if (!geo?.matched) throw new Error(`${p.slug}: no address resolver matched its address`)
  if (!geo.place_matches_city) {
    throw new Error(`${p.slug}: the resolver places this at "${geo.place}", not Kirkland.`)
  }

  const doc = new SourceDocument({
    url: PAGE, retrieved_at: RETRIEVED_AT, tier: 1, publisher: CITY, format: 'html',
  })
  const docPark = new SourceDocument({
    url: `${PARK_BASE}/${p.page.split('-').map(s => s[0].toUpperCase() + s.slice(1)).join('-')}`,
    retrieved_at: RETRIEVED_AT, tier: 1, publisher: CITY, format: 'html',
  })
  const docCensus = new SourceDocument({
    url: CENSUS_URL, retrieved_at: RETRIEVED_AT, tier: 1, publisher: 'US Census Bureau', format: 'json',
  })

  const shell = {
    slug: p.slug, name: null, city: 'Kirkland', state: 'WA', county: null,
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
      evidence: `Named "${p.name}" by the ${CITY} in the "Where to Play" table on its pickleball page, and on the park's own page.`,
    }),
    doc.fact('total_courts', p.courts, {
      evidence: `Quoted from the City's pickleball page, from a table column headed "Number & Type of Courts": "${p.listQuote}". The heading is what makes this a count of pickleball courts rather than of tennis courts striped for pickleball.` +
        (p.parkPageUncounted
          ? ' The park\'s own page names the pickleball courts and states no number, so this count has no second City source.'
          : ` The park's own page states it again: "${p.parkQuote}".`),
    }),
    docPark.fact('street_address', p.address, {
      evidence: `"${p.postcodeLine}" is the address published on the park's own page.`,
    }),
    doc.fact('venue_type', 'public_park', {evidence: `Published by the ${CITY} among its parks.`}),
    doc.fact('play_format', ['open_play'], {
      evidence: `The City states "${FIRST_COME}" and "${NO_BUSINESS}" Drop-in play is not merely the norm here, it is the only permitted use: lessons, leagues and tournaments are prohibited on every Kirkland pickleball court.`,
    }),
    doc.fact('hours_of_operation', HOURS_TEXT, {
      evidence: `The City's pickleball page gives "8 AM to dusk" for this venue in its "Where to Play" table, and states the rule city-wide: "${HOURS_RULE}"`,
    }),
    doc.fact('court_availability', p.availability, {
      evidence: `From the City's pickleball page ("${p.listQuote}") and the park's own page.` +
        (p.parkPageUncounted
          ? ' The absence of a count on the park page is asserted by the run, so the caveat cannot outlive its truth.'
          : ''),
    }),
    docCensus.fact('county', geo.county, {
      evidence: `${geo.county} County, WA${geo.county_fips ? ` (FIPS ${geo.state_fips}${geo.county_fips})` : ''}. ${geo.basis} The resolver also places it in the incorporated place "${geo.place}", which is what allows it to be published under Kirkland.`,
    }),
    docCensus.fact('postal_code', geo.postal_code, {evidence: geo.basis}),
  ]

  if (p.restroom) {
    facts.push(docPark.fact('restroom', true, {
      evidence: 'Listed among the park\'s amenities on its own page as a year-round restroom.',
    }))
  }
  if (p.parking) {
    facts.push(docPark.fact('parking', p.parking, {
      evidence: `Quoted from the park's own page: "${p.parking}" Kirkland is one of very few operators in this directory that publishes anything about parking at all.`,
    }))
  }

  const res = applyFacts(venue, facts)

  overlay[p.slug] = {
    minted: !imported,
    identity: {
      name: p.name, city: 'Kirkland', state: 'WA',
      county: geo.county, postal_code: geo.postal_code ?? null,
      latitude: geo.lat ?? null, longitude: geo.lon ?? null,
      imported_slug: p.importedSlug ?? null,
      canonical_slug: identityRegistry.renames[p.importedSlug]?.canonical ?? p.slug,
    },
    match: {
      source_page: PAGE, quote: p.listQuote,
      basis: imported
        ? `Matched to the imported ${p.importedSlug} row in Kirkland, WA, published under the canonical slug ${p.slug}.`
        : 'No imported row exists for this park, and that is the expected consequence of its history rather than a gap: it held six TENNIS courts until 13 April 2026 and reopened as six dedicated pickleball courts on 2 July 2026, after the import was taken. Minted here from the City\'s own pages.',
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
const dedicatedCourts = VENUES.filter(p => p.dedicated).reduce((a, p) => a + p.courts, 0)

for (const [slug, entry] of Object.entries(overlay)) {
  const {total_courts: t, indoor_courts: i, outdoor_courts: o} = entry.patch
  if (i != null && o != null && t !== i + o) {
    throw new Error(`Rule 13: ${slug} does not sum.`)
  }
}

const METHOD_NOTE =
  'Kirkland states its court counts in a table on one page, under a column heading that names the kind of court: "Number & Type of Courts", then "6 pickleball courts", "3 pickleball courts", "1 pickleball court". That heading is why this city needed no inference about whether a number counts pickleball courts or tennis courts wearing pickleball lines. Peter Kirk Park\'s six are the newest courts in this directory: the City closed its tennis courts on 13 April 2026 "for conversion to six dedicated pickleball courts" and opened them on 2 July 2026, which is also why no imported row exists for that park and it is minted here. Everest Park\'s three rest on the pickleball page alone - the park\'s own page names its pickleball courts repeatedly and never counts them - and the venue page says so. Feriton Spur\'s one is counted twice, as "1 pickleball court" on the pickleball page and "a 44-foot pickleball court" on the park\'s own, forty-four feet being the regulation length of one. Van Aalst Park is refused: it has "half-basketball court with lines drawn for pickleball" and no number, and it is missing from the pickleball page entirely, which makes Kirkland the third city here whose operator keeps two records of its courts that disagree. Every court closes at dusk and none is stated to be lit, so Kirkland publishes no lights filter page; no fee is stated for pickleball anywhere, so it publishes no free page either. The "Free Play" schedule on Everest Park\'s page is field time on grass and turf, not a statement about the courts, and is not read as one. All three venues are drop-in only and first-come first-served, and the City prohibits lessons, leagues and tournaments on every one of its pickleball courts.'

mkdirSync(join(REPO_ROOT, 'data/verified'), {recursive: true})
writeFileSync(join(REPO_ROOT, 'data/verified/kirkland-wa.json'), JSON.stringify({
  city: 'Kirkland', state: 'WA', retrieved_at: RETRIEVED_AT,
  method_note: METHOD_NOTE,
  sources: [
    {url: PAGE, publisher: CITY, tier: 1, format: 'html', snapshot: snapshotPath('pickleball')},
    ...VENUES.map(p => ({
      url: `${PARK_BASE}/${p.page.split('-').map(s => s[0].toUpperCase() + s.slice(1)).join('-')}`,
      publisher: CITY, tier: 1, format: 'html', snapshot: snapshotPath(p.page),
    })),
    ...EXCLUDED.map(e => ({
      url: `${PARK_BASE}/${e.page.split('-').map(s => s[0].toUpperCase() + s.slice(1)).join('-')}`,
      publisher: CITY, tier: 1, format: 'html', snapshot: snapshotPath(e.page),
    })),
    {url: CENSUS_URL, publisher: 'US Census Bureau', tier: 1, format: 'json', snapshot: 'data/sources/kirkland-county-census.json'},
  ].map((s, i) => ({id: `S${i + 1}`, ...s})),
  totals: {
    venues: VENUES.length, courts: totalCourts,
    outdoor: null, indoor: null,
    dedicated_courts: dedicatedCourts,
  },
  excluded: EXCLUDED.map(e => ({name: e.name, why: e.reasons})),
  venues: overlay,
}, null, 2) + '\n')

const changed = changes.filter(r =>
  r.old_value !== null && r.old_value !== undefined && String(r.old_value) !== String(r.new_value))

writeFileSync(join(REPO_ROOT, 'reports', 'kirkland-conflicts.md'), [
  '# Kirkland verification - a column heading that names the court type', '',
  `Run ${RETRIEVED_AT}. ${VENUES.length} venues published, ${totalCourts} courts. 1 venue refused.`, '',
  'Kirkland puts its counts in a table whose column is headed "Number & Type of Courts", so each cell',
  'reads "6 pickleball courts" rather than a bare number that might be counting tennis courts. No other',
  'operator in this directory removes that ambiguity in the heading.', '',
  '| venue | courts | counted twice? | what the City writes | address |',
  '| --- | ---: | --- | --- | --- |',
  ...VENUES.map(p => `| \`${p.slug}\` | ${p.courts} | ${p.parkPageUncounted ? 'no - pickleball page only' : 'yes'} | "${p.listQuote}" | ${p.address} |`),
  '',
  '## The newest courts on the site', '',
  'Peter Kirk Park held six TENNIS courts until 13 April 2026. The City closed them "for conversion to',
  'six dedicated pickleball courts" and reopened them on 2 July 2026 at 3 p.m., two months before this',
  'check. The imported dataset has no row for the park at all, which is the expected consequence of',
  'that history rather than a gap in the import, so the venue is minted from the City\'s own pages.',
  '',
  'The City posts a different rule on each half of the new courts: three are open play (one game to 11,',
  'then rotate) and three are timed (30 minutes, then rotate).',
  '',
  '## The City keeps two records and they disagree', '',
  'The pickleball page\'s "Where to Play" table is a closed list of three parks. A fourth park page says:',
  '',
  '> Van Aalst Park has half-basketball court with lines drawn for pickleball. This multisport court is',
  '> available for drop-in use only. For pickleball use, players must bring their own nets.',
  '',
  'That is the third city here whose operator keeps two records of its courts that do not match, after',
  'Saint Paul and Lincoln. Those two were settled by the rule that the record stating a NUMBER',
  'publishes. Neither Kirkland record states one for Van Aalst, so nothing publishes, and the run',
  'asserts both grounds: if the City counts it, or adds it to the table, this build fails.',
  '',
  '## Refused', '',
  ...EXCLUDED.flatMap(e => [`**${e.name}** - ${e.address}`, '', ...e.reasons.map((r, i) => `${i + 1}. ${r}`), '']),
  '## What Kirkland does not say', '',
  '- **lighting.** Every court closes at dusk, which the City states four times, and Peter Kirk Park\'s',
  '  page mentions a lighted BASEBALL field in the same breath as the courts. A closing time is not a',
  '  statement about lighting and a lit ballfield is not a lit court, so `light` stays null and Kirkland',
  '  publishes no `/lights/` filter page.',
  '- **any fee for pickleball.** Everest Park\'s page carries a "Free Play" heading, and that programme',
  '  is field time on grass and synthetic turf. It is not about the courts and is not read as though it',
  '  were, so `fee_type` stays null and there is no `/free/` page for Kirkland.',
  '- **indoor or outdoor**, in those words. The breakdowns stay null, following Mesa.',
  '- **surface**, anywhere in the city.',
  '',
  '## The 403 bucket, retested in full', '',
  'Kirkland was refused on an HTTP 403 during the runs for cities #9 to #12. The whole bucket has now',
  'been retested:', '',
  '| result | cities |',
  '| --- | --- |',
  '| reachable now | Mesa, Durham, Kirkland, Fort Collins |',
  '| still refusing | Spokane, Greensboro, Redmond, Wichita, Eugene, Olympia, Overland Park, Minneapolis, Tucson |',
  '',
  'Spokane is the expensive one: it publishes a court count and a street address for twelve parks, and',
  'it refuses both a bare curl and a full browser header set.',
  '',
  changed.length ? '## Values a source changed' : '_No imported row was overwritten._',
  ...(changed.length ? [
    '', '| venue | field | was | now | outcome |', '| --- | --- | --- | --- | --- |',
    ...changed.map(r => `| \`${r.venue_slug}\` | ${r.field} | ${JSON.stringify(r.old_value)} | ${JSON.stringify(r.new_value)} | ${r.outcome} |`),
  ] : []),
  '',
].join('\n'))

console.log(`\nKirkland, WA - ${VENUES.length} venues, ${totalCourts} courts, retrieved ${RETRIEVED_AT}`)
for (const p of VENUES) {
  const o = overlay[p.slug]
  console.log(
    `  ${o.patch.name.padEnd(20)} ${String(o.patch.total_courts).padStart(2)}` +
    ` | ${(p.dedicated ? 'dedicated' : 'type stated').padEnd(12)}` +
    ` | ${o.patch.county} County | ${o.minted ? 'minted' : 'matched import'}` +
    (p.parkPageUncounted ? ' | park page states no number' : ' | counted twice'))
}
console.log(`\n  refused: ${EXCLUDED.map(e => e.name).join(', ')} - lines on a half-basketball court, no count, absent from the City's pickleball page.`)
console.log('\nWrote data/verified/kirkland-wa.json and reports/kirkland-conflicts.md\n')
