#!/usr/bin/env node
/*
  Lincoln, NE verification run — city #13, the first in Nebraska.

  ============================================================
  WHY LINCOLN
  ============================================================

  It sits fourth in the verification queue on volume — 51 imported rows,
  55 pages if it publishes — and, more to the point, the City states court
  counts in its own words. Its Tennis and Pickleball page carries a
  "Dedicated Pickleball Courts" section reading, venue by venue:

      "Includes six courts dedicated to pickleball play."   (Ballard)
      "Includes six courts dedicated to pickleball play."   (Eden)
      "Includes ten courts dedicated to pickleball play."   (Peterson)

  Dedicated outdoor pickleball courts are rare in this directory. Madison
  has one such venue, Bellevue one, Vancouver one; Lincoln has three of
  them on one page, and two of the three publish here.

  ============================================================
  THE CITY'S TWO RECORDS DISAGREE ABOUT WHICH PARKS HAVE PICKLEBALL
  ============================================================

  This is the second city in the directory where the operator keeps two
  records of its own courts that do not match — Saint Paul was the first,
  and the rule set there decides this one: the record that STATES A NUMBER
  is the record that publishes, and the disagreement is written onto the
  pages rather than quietly resolved.

  The Tennis and Pickleball page names the pickleball venues and counts
  three of them. Each park's own page in Parks A to Z carries a "Features"
  list, and those lists disagree in both directions:

    Ballard Park    6 dedicated courts on the pickleball page.
                    Its park page never mentions pickleball at all — the
                    Features list reads "Tennis Courts".
    Densmore Park   2 dedicated + 2 dual striped on the pickleball page.
                    Its park page never mentions pickleball either.
    Peterson Park   10 dedicated on the pickleball page, and its park page
                    agrees twice over: "includes ten pickleball courts" in
                    prose, and "Pickleball" in the Features list.
    Eden Park       6 dedicated on the pickleball page, "Pickleball" in the
                    Features list — the best-corroborated venue in the
                    city, and the one this run refuses. See below.

  So two of the three published venues rest on the pickleball page alone.
  That is stated on their own venue pages rather than smoothed over, the
  same way Bellevue's Highland Park carries its missing corroboration.

  ============================================================
  DENSMORE'S COUNT IS THE CITY'S OWN ARITHMETIC
  ============================================================

  Densmore's line reads, in full:

      "two dedicated pickleball courts; 2 dual striped (can be used as 4
       pickleball courts)"

  Six courts, and the City does the conversion itself: the parenthesis
  says what the two dual-striped courts amount to in pickleball. This run
  does not multiply anything — 2 + 4 is addition of two figures the City
  wrote down, and the venue page prints the sentence so a reader can check
  the sum.

  Every other dual-striped park on that page — Cooper, Henry, Roberts,
  Roper East, Seng, Tyrrell, UPCO — carries no pickleball number at all,
  and none of them publishes. Tyrrell's "one dedicated tennis court; one
  dual striped" is a count of tennis courts, not of pickleball courts, and
  reading it as one is exactly the inference this project refuses.

  ============================================================
  EDEN PARK IS REFUSED, AND IT IS THE EXPENSIVE ONE
  ============================================================

  Six dedicated courts, corroborated on the park's own Features list, and
  it does not publish, because the address does not resolve.

  The City prints "46 Antelope Creek Rd" in the Location field of the
  park's page. Its own description of the same park, three lines above,
  reads "A neighborhood park located along Antelope creek near 46th and
  Antelope Creek Road" — an intersection, not a house number, and "46"
  reads as a truncation of "46th". Neither address resolver finds it:
  the US Census address file returns no match, and OpenStreetMap returns
  nothing at house-number level.

  That is the same shape as Vancouver's Fisher Basin Community Park, which
  was refused for having no house number in any published address, and it
  is settled the same way. The park page's coordinates are not used as a
  substitute: Import Gate I1 asks for an address that resolves, and
  swapping in a latitude the day the rule costs something would be a rule
  rewritten to reach a wanted answer.

  ============================================================
  WHAT IS NOT CLAIMED
  ============================================================

  lighting    Not stated for any court. Densmore's page DOES say "Lights:
              MUSCO (2000). Tournament quality" — under the heading
              "DENSMORE PARK FIELDS", describing the four ballfields it
              rents out. Lighting on a ballfield is not lighting on a
              pickleball court, and this is the nearest miss in the run.
  surface     Stated nowhere in Lincoln.
  cost        Stated nowhere for an outdoor court. The City asks readers to
              "Call the recreation center for court times and fees" about
              its INDOOR courts, which is a statement about four buildings
              that publish no pickleball count and therefore do not appear
              here at all.
  play_format The City says Pickleball Lincoln, Inc. schedules programming
              at these parks and that "The public is welcome to participate
              in this programming." That is real and it is in the
              availability note, but the controlled vocabulary for
              play_format describes drop-in, league, lessons and the rest,
              and choosing one of them for "an outside body runs sessions
              here on a published schedule" would be a guess.
  nets        Never mentioned, at a city with fourteen dedicated courts.

  ============================================================
  FETCHING THESE PAGES
  ============================================================

  www.lincoln.ne.gov sits behind Akamai, which answers a bare curl with a
  488-byte "Access Denied" page. scripts/verify/fetch/lincoln.sh sends the
  header set a browser sends and gets the real document. Every snapshot
  under data/sources/lincoln/ was taken that way, and the assertions below
  read the committed snapshots rather than the network.
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

const CITY = 'City of Lincoln Parks and Recreation'
const PAGE = 'https://www.lincoln.ne.gov/City/Departments/Parks-and-Recreation/Parks-Facilities/Tennis-and-Pickleball'
const PARK_BASE = 'https://www.lincoln.ne.gov/City/Departments/Parks-and-Recreation/Parks-Facilities/Parks-A-to-Z'
const CENSUS_URL = 'https://geocoding.geo.census.gov/geocoder/geographies'

/* The city-wide statement about who runs play on these courts. */
const PROGRAMMING =
  'Pickleball Lincoln, Inc. organizes and schedules pickleball programming at Peterson Park, Ballard Park, Eden Park, Henry Park, Roberts Park, Densmore Park, and Seng Park at University Place.'
const PROGRAMMING_RULE =
  'During the time frames identified in the Programming Schedule, the dual use court(s) at these parks are reserved for pickleball play.'
const PUBLIC_WELCOME = 'The public is welcome to participate in this programming.'

/* Every published park keeps the same hours, and each park page says so. */
const HOURS = '05:00 AM-11:00 PM'
const HOURS_TEXT = 'Open 5:00 a.m. to 11:00 p.m., seven days a week.'

const VENUES = [
  {
    slug: 'ballard-park', name: 'Ballard Park', page: 'ballard-park',
    listAddress: '3901 N 66th', address: '3901 N 66th St.', postcodeLine: '3901 N 66th St., Lincoln 68507',
    courts: 6,
    spec: 'Includes six courts dedicated to pickleball play.',
    dedicated: true,
    /* Its own park page never mentions pickleball. Asserted as an absence. */
    parkPageSilent: true,
    availability: 'Six courts dedicated to pickleball — not striped onto tennis, but pickleball courts, which in this directory is still the exception rather than the rule. The park is open 5:00 a.m. to 11:00 p.m. every day. One thing to know before you go, and it is the City\'s own doing rather than ours: the park\'s page in Parks A to Z never mentions pickleball at all. Its Features list reads "Tennis Courts", and the six dedicated courts appear only on the City\'s Tennis and Pickleball page. Nothing contradicts the count; it is simply stated once rather than twice. Pickleball Lincoln, Inc. schedules programming here, and the City says the public is welcome to join it.',
  },
  {
    slug: 'densmore-park', name: 'Densmore Park', page: 'densmore-park',
    listAddress: '6701 S 14th St', address: '6701 S. 14th Street', postcodeLine: '6701 S. 14th Street, Lincoln 68512',
    courts: 6,
    spec: 'two dedicated pickleball courts; 2 dual striped (can be used as 4 pickleball courts)',
    dedicated: false,
    parkPageSilent: true,
    availability: 'Six courts, and the City spells out how it gets to six: "two dedicated pickleball courts; 2 dual striped (can be used as 4 pickleball courts)". So two of them are pickleball courts and four of them are a pair of tennis courts wearing pickleball lines, which means what you actually find depends on whether anyone is playing tennis. The park is open 5:00 a.m. to 11:00 p.m. daily. As at Ballard, the park\'s own page in Parks A to Z does not mention pickleball — its Features list stops at "Tennis Courts" — so this count rests on the City\'s Tennis and Pickleball page alone. Pickleball Lincoln, Inc. schedules programming here, and during those times the dual-use courts are reserved for pickleball.',
  },
  {
    slug: 'peterson-park', name: 'Peterson (Erwin) Park', page: 'peterson-park',
    listAddress: '4400 Southwood Drive', address: '4400 Southwood Drive', postcodeLine: '4400 Southwood Drive, Lincoln 68512',
    courts: 10,
    spec: 'Includes ten courts dedicated to pickleball play.',
    dedicated: true,
    parkPageSilent: false,
    /* The only Lincoln venue whose own park page states the count too. */
    parkQuote: 'includes ten',
    availability: 'Ten courts dedicated to pickleball — the largest count in Lincoln and one of the larger dedicated sets anywhere in this directory. Open 5:00 a.m. to 11:00 p.m. daily. This is the only Lincoln venue the City counts twice: the Tennis and Pickleball page says "Includes ten courts dedicated to pickleball play", and the park\'s own page says the park "includes ten pickleball courts", with Pickleball in its Features list. The park is 35 acres and also holds ballfields, an open shelter, a playground and the Stransky Dog Run. Pickleball Lincoln, Inc. schedules programming here, and the City says the public is welcome to join it.',
  },
]

/* The venue the City counts and this run refuses. */
const EXCLUDED = [
  {
    name: 'Eden Park',
    spec: 'Includes six courts dedicated to pickleball play.',
    page: 'eden-park',
    reasons: [
      'Neither address resolver finds "46 Antelope Creek Rd", the address the City prints in the Location field of the park\'s own page: the US Census address file returns no match, and OpenStreetMap returns nothing at house-number level. Import Gate I1 requires a street address that resolves.',
      'The City\'s own description of the park, on the same page, places it "near 46th and Antelope Creek Road" — an intersection rather than a house number, which is what "46" appears to be a truncation of. The two statements do not agree with each other.',
      'This is the costliest refusal in the run and the best-corroborated venue in the city: six dedicated courts on the Tennis and Pickleball page, and "Pickleball" in the park page\'s own Features list. The park page also publishes coordinates. They are not used as a substitute for an address that resolves.',
    ],
  },
]

/* Dual-striped parks the City names with no pickleball count of any kind. */
const UNCOUNTED = [
  'Cooper Park', 'Henry Park', 'Roberts Park', 'Roper (Max E.) Park',
  'Seng Park at University Place', 'Tyrrell Park', 'UPCO Park',
]

/* Indoor sites the City lists with an address, a phone number and no count. */
const INDOOR_UNCOUNTED = [
  'Air Park Community Center', 'Calvert Recreation Center',
  'Easterday Recreation Center', 'Woods Tennis Center',
]

/* ---------------------------------------------------------------- */

const snapshotPath = name => `data/sources/lincoln/${name}.html`

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

/*
  Squeezing removes whitespace before comparing, which matters more here
  than it did elsewhere: the City's markup opens an anchor in the MIDDLE of
  a park name, so the stripped text reads "Ballar\nd Park". Rejoining on
  whitespace is what makes "Ballard Park" findable at all.
*/
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

/* The city-wide statements every availability note rests on. */
for (const [needle, what] of [
  [PROGRAMMING, 'programming operator'],
  [PROGRAMMING_RULE, 'reserved-time rule'],
  [PUBLIC_WELCOME, 'public welcome'],
  ['Dedicated Pickleball Courts', 'dedicated-courts heading'],
  ['These courts are dual striped for both tennis and pickleball.', 'dual-striped explanation'],
]) {
  if (!pickleball.includes(squeeze(needle))) {
    throw new Error(`The Lincoln pickleball page no longer states the ${what}: "${needle}"`)
  }
}

/*
  THE REFUSALS, ASSERTED RATHER THAN REMEMBERED.

  Eden Park publishes the day its address resolves, so the geocode file is
  checked rather than the exclusion being carried forward on trust.
*/
const counties = JSON.parse(
  readFileSync(join(REPO_ROOT, 'data/sources/lincoln-county-census.json'), 'utf8'))

if (counties['eden-park']?.matched) {
  throw new Error(
    'Eden Park now resolves. The only reason it is excluded has gone: re-read the page and publish its six courts.')
}
must('pickleball', 'eden-park', 'Includes six courts dedicated to pickleball play.', 'excluded court count')
must('eden-park', 'eden-park', '46 Antelope Creek Rd', 'unresolvable address')
must('eden-park', 'eden-park', 'near 46th and Antelope Creek Road', 'contradicting description')

/*
  The uncounted parks are the reason this city publishes three venues and
  not ten. If the City ever gives one of them a number, that is a venue we
  should be publishing, so the run fails rather than continuing to ignore it.
*/
for (const name of UNCOUNTED) {
  if (!pickleball.includes(squeeze(name))) {
    throw new Error(`The pickleball page no longer lists ${name}; the uncounted set has changed.`)
  }
}
if (/courts?dedicatedtopickleballplay/gi.test(pickleball.replace(/Includes(six|ten)/gi, '')) === false) {
  throw new Error('The "courts dedicated to pickleball play" wording has gone from the pickleball page.')
}

const identityRegistry = loadIdentity(REPO_ROOT)
const allRows = loadRows().map(r => mapRow(r).venue)
const bySlug = new Map(
  allRows.filter(v => v.city === 'Lincoln' && String(v.state).toUpperCase() === 'NE')
    .map(v => [v.slug, v]))

const overlay = {}
const changes = []

for (const p of VENUES) {
  /* The count and the address, on the page that states them. */
  must('pickleball', p.slug, p.spec, 'court count')
  must('pickleball', p.slug, p.listAddress, 'street address')
  must(p.page, p.slug, p.postcodeLine, 'address on the park page')
  must(p.page, p.slug, HOURS, 'park hours')

  if (p.parkPageSilent) {
    /*
      Asserted as an ABSENCE. The day this park page starts naming
      pickleball, the venue gains a corroborating source and its page
      stops needing to say it has none.
    */
    mustNot(p.page, p.slug, 'pickleball', 'its park page now mentions pickleball')
  } else {
    must(p.page, p.slug, p.parkQuote, 'corroborating count')
  }

  const geo = counties[p.slug]
  if (!geo?.matched) throw new Error(`${p.slug}: no address resolver matched its address`)
  if (!geo.place_matches_city) {
    throw new Error(`${p.slug}: the resolver places this at "${geo.place}", not Lincoln.`)
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
    slug: p.slug, name: null, city: 'Lincoln', state: 'NE', county: null,
    postal_code: null, street_address: null, latitude: null, longitude: null,
    status: 'pending', source_url: null, date_checked: null, verified_by: null,
    claimed_by_owner: false, claim_date: null,
    rating: null, user_rating: null, review_count: null, claimed_or_verified: null,
    source_sport: 'pickleball',
  }
  for (const f of PUBLISHED_FACT_FIELDS) shell[f] = null
  const venue = bySlug.get(p.slug) ?? shell

  const facts = [
    doc.fact('name', p.name, {
      evidence: `Named "${p.name}" by the ${CITY} on its Tennis and Pickleball page and on the park's own page in Parks A to Z.`,
    }),
    doc.fact('total_courts', p.courts, {
      evidence: p.dedicated
        ? `Quoted from the City's Tennis and Pickleball page, under its "Dedicated Pickleball Courts" heading: "${p.spec}"` +
          (p.parkPageSilent
            ? ' The park\'s own page in Parks A to Z does not mention pickleball, so this count has no second City source.'
            : ` The park's own page states it again: the park "${p.parkQuote} pickleball courts".`)
        : `Quoted from the City's Tennis and Pickleball page, under its "Dual Striped" heading: "${p.spec}" ` +
          'Six is the City\'s own arithmetic rather than ours: two dedicated courts, plus the four it says the two dual-striped courts can be used as. ' +
          'The park\'s own page in Parks A to Z does not mention pickleball, so this count has no second City source.',
    }),
    doc.fact('outdoor_courts', p.courts, {
      evidence: 'Listed by the City under "Outdoor Court Locations". The indoor count is left unverified rather than set to zero — Lincoln lists four indoor sites and states a pickleball count for none of them.',
    }),
    docPark.fact('street_address', p.address, {
      evidence: `"${p.postcodeLine}" is the address in the Location block of the park's own page. The Tennis and Pickleball page prints it more briefly as "${p.listAddress}".`,
    }),
    doc.fact('venue_type', 'public_park', {evidence: `Published by the ${CITY} among its parks.`}),
    docPark.fact('hours_of_operation', HOURS_TEXT, {
      evidence: `From the Hours block on the park's own page, which gives "${HOURS}" for all seven days. Lincoln is one of the few operators in this directory that publishes park hours at all.`,
    }),
    doc.fact('court_availability', p.availability, {
      evidence: `From the City's Tennis and Pickleball page: "${p.spec}", and the city-wide statement "${PROGRAMMING}" with "${PROGRAMMING_RULE} ${PUBLIC_WELCOME}"` +
        (p.parkPageSilent
          ? ' The absence of any pickleball mention on this park\'s own page is asserted by the run, so it cannot quietly stop being true.'
          : ` The park's own page corroborates the count and lists Pickleball among its Features.`),
    }),
    docCensus.fact('county', geo.county, {
      evidence: `${geo.county} County, NE${geo.county_fips ? ` (FIPS ${geo.state_fips}${geo.county_fips})` : ''}. ${geo.basis} The resolver also places it in the incorporated place "${geo.place}", which is what allows it to be published under Lincoln.`,
    }),
    docCensus.fact('postal_code', geo.postal_code, {evidence: geo.basis}),
  ]

  const res = applyFacts(venue, facts)

  overlay[p.slug] = {
    minted: !bySlug.has(p.slug),
    identity: {
      name: p.name, city: 'Lincoln', state: 'NE',
      county: geo.county, postal_code: geo.postal_code ?? null,
      latitude: geo.lat ?? null, longitude: geo.lon ?? null,
      imported_slug: bySlug.has(p.slug) ? p.slug : null,
      canonical_slug: identityRegistry.renames[p.slug]?.canonical ?? p.slug,
    },
    match: {
      source_page: PAGE, quote: p.spec,
      basis: bySlug.has(p.slug)
        ? `Matched to the imported ${p.slug} row in Lincoln, NE.`
        : 'No imported row under this slug. The import holds this park under longer commercial names such as "Ballard Park - Public Open Play"; the venue is minted here from the City\'s own pages, which state the count, the address and the hours.',
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
  const patch = entry.patch
  if (patch.total_courts !== (patch.outdoor_courts ?? 0) + (patch.indoor_courts ?? 0)) {
    throw new Error(`Rule 13: ${slug} does not sum.`)
  }
}

mkdirSync(join(REPO_ROOT, 'data/verified'), {recursive: true})
writeFileSync(join(REPO_ROOT, 'data/verified/lincoln-ne.json'), JSON.stringify({
  city: 'Lincoln', state: 'NE', retrieved_at: RETRIEVED_AT,
  method_note:
    'Lincoln states its court counts in prose on one page, under a heading that says what kind of court it is counting: "Dedicated Pickleball Courts", then "Includes six courts dedicated to pickleball play." Sixteen of the twenty-two published courts here are dedicated to pickleball rather than striped onto tennis, which is a higher proportion than any other city in this directory. It is also the second city whose operator keeps two records of its own courts that disagree: the Tennis and Pickleball page counts four venues, and the parks\' own pages in Parks A to Z mention pickleball at only two of them — Ballard and Densmore publish on the pickleball page alone, and each venue page says so. Densmore\'s six is the City\'s own arithmetic, "two dedicated pickleball courts; 2 dual striped (can be used as 4 pickleball courts)". Eden Park and its six dedicated courts are refused: neither the Census address file nor OpenStreetMap resolves "46 Antelope Creek Rd", and the City\'s own description of that park places it at an intersection instead. Seven more dual-striped parks are named by the City with no pickleball count at all, and four indoor sites are listed with a phone number and no count; none of them publishes. Lighting is claimed nowhere — Densmore\'s page states "Lights: MUSCO (2000)" under a heading describing its four rentable ballfields, which is not a statement about a pickleball court. All three parks publish hours, 5:00 a.m. to 11:00 p.m. daily.',
  sources: [
    {url: PAGE, publisher: CITY, tier: 1, format: 'html', snapshot: snapshotPath('pickleball')},
    ...VENUES.map(p => ({
      url: `${PARK_BASE}/${p.page.split('-').map(s => s[0].toUpperCase() + s.slice(1)).join('-')}`,
      publisher: CITY, tier: 1, format: 'html', snapshot: snapshotPath(p.page),
    })),
    {url: `${PARK_BASE}/Eden-Park`, publisher: CITY, tier: 1, format: 'html', snapshot: snapshotPath('eden-park')},
    {url: CENSUS_URL, publisher: 'US Census Bureau', tier: 1, format: 'json', snapshot: 'data/sources/lincoln-county-census.json'},
  ].map((s, i) => ({id: `S${i + 1}`, ...s})),
  totals: {
    venues: VENUES.length, courts: totalCourts, outdoor: totalCourts, indoor: 0,
    dedicated_courts: dedicatedCourts,
  },
  excluded: EXCLUDED.map(e => ({name: e.name, why: e.reasons})),
  uncounted_dual_striped: UNCOUNTED,
  uncounted_indoor: INDOOR_UNCOUNTED,
  venues: overlay,
}, null, 2) + '\n')

const changed = changes.filter(r =>
  r.old_value !== null && r.old_value !== undefined && String(r.old_value) !== String(r.new_value))

writeFileSync(join(REPO_ROOT, 'reports', 'lincoln-conflicts.md'), [
  '# Lincoln verification - dedicated courts, and a city page its parks do not confirm', '',
  `Run ${RETRIEVED_AT}. ${VENUES.length} venues published, ${totalCourts} courts, all outdoor. 1 venue refused.`, '',
  'Lincoln counts its pickleball courts in prose under a heading that names the kind of court:',
  '"Dedicated Pickleball Courts", then "Includes six courts dedicated to pickleball play." Sixteen',
  `of the ${totalCourts} published courts are dedicated rather than striped onto tennis.`, '',
  '| venue | courts | dedicated | what the City writes | address |',
  '| --- | ---: | --- | --- | --- |',
  ...VENUES.map(p => `| \`${p.slug}\` | ${p.courts} | ${p.dedicated ? 'yes' : '2 of 6'} | "${p.spec}" | ${p.address} |`),
  '',
  '## The City keeps two records and they disagree', '',
  'The Tennis and Pickleball page names and counts the pickleball venues. Each park also has a page',
  'in Parks A to Z with its own Features list. They do not match:', '',
  '| park | on the pickleball page | on the park page |',
  '| --- | --- | --- |',
  '| Ballard | six dedicated courts | no mention of pickleball; Features reads "Tennis Courts" |',
  '| Densmore | two dedicated + two dual striped | no mention of pickleball; Features reads "Tennis Courts" |',
  '| Peterson | ten dedicated courts | "includes ten pickleball courts", Pickleball in Features |',
  '| Eden | six dedicated courts | Pickleball in Features - and refused, on its address |',
  '',
  'The record that states a number is the record that publishes, which is the rule Saint Paul set.',
  'Where the second record is silent, the venue page says so rather than implying two sources agree.',
  'The run asserts that silence: if a park page starts naming pickleball, this build fails.',
  '',
  '## Densmore is six, and the City did the arithmetic', '',
  '> two dedicated pickleball courts; 2 dual striped (can be used as 4 pickleball courts)',
  '',
  'Two plus four. The parenthesis is the City converting its own tennis courts, not us multiplying',
  'anything. Tyrrell Park\'s "one dedicated tennis court; one dual striped" is a count of TENNIS',
  'courts and yields no pickleball number, so Tyrrell does not publish.',
  '',
  '## Refused', '',
  ...EXCLUDED.flatMap(e => [`**${e.name}** - "${e.spec}"`, '', ...e.reasons.map((r, i) => `${i + 1}. ${r}`), '']),
  '## Named by the City with no count', '',
  'Dual-striped parks, no pickleball number of any kind:', '',
  ...UNCOUNTED.map(n => `- ${n}`),
  '',
  'Indoor sites, listed with an address and a phone number and no count:', '',
  ...INDOOR_UNCOUNTED.map(n => `- ${n}`),
  '',
  '## The nearest miss on lighting', '',
  'Densmore Park\'s page states "Lights: MUSCO (2000). Tournament quality" - under the heading',
  '"DENSMORE PARK FIELDS", describing the four ballfields the City rents out. That is lighting on a',
  'ballfield, not on a pickleball court, and no Lincoln venue publishes a lighting answer.',
  '',
  changed.length ? '## Values a source changed' : '_No imported row was overwritten._',
  ...(changed.length ? [
    '', '| venue | field | was | now | outcome |', '| --- | --- | --- | --- | --- |',
    ...changed.map(r => `| \`${r.venue_slug}\` | ${r.field} | ${JSON.stringify(r.old_value)} | ${JSON.stringify(r.new_value)} | ${r.outcome} |`),
  ] : []),
  '',
].join('\n'))

console.log(`\nLincoln, NE - ${VENUES.length} venues, ${totalCourts} courts (all outdoor), retrieved ${RETRIEVED_AT}`)
for (const p of VENUES) {
  const o = overlay[p.slug]
  console.log(
    `  ${o.patch.name.padEnd(24)} ${String(o.patch.total_courts).padStart(2)}` +
    ` | ${(p.dedicated ? 'dedicated' : '2 dedicated + 4 dual').padEnd(20)}` +
    ` | ${o.patch.county} County` +
    (p.parkPageSilent ? ' | park page silent on pickleball' : ' | corroborated on the park page'))
}
console.log(`\n  refused: ${EXCLUDED.map(e => e.name).join(', ')} - its address resolves in neither resolver.`)
console.log(`  named with no count: ${UNCOUNTED.length} dual-striped parks, ${INDOOR_UNCOUNTED.length} indoor sites.`)
console.log('\nWrote data/verified/lincoln-ne.json and reports/lincoln-conflicts.md\n')
