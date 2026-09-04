#!/usr/bin/env node
/*
  Madison, WI verification run — city #9, the first city outside the Pacific
  Northwest and the Carolinas, and the first in Wisconsin.

  ============================================================
  WHY MADISON
  ============================================================

  Madison Parks publishes, on each park's own page, a line like this:

      Tennis & Pickleball
      Courts: 2, asphalt

  A count and a SURFACE, per venue, in a structured block, for every park it
  lists on its pickleball page. Surface is the field this directory has been
  worst at: across the eight cities published before this one, exactly five
  venues out of seventy-four had a verified playing surface, because cities
  describe what a court is shared with rather than what it is made of.
  Madison states it twenty times in one afternoon's reading.

  It also states the thing that makes a dual-striped court different to play
  on, which no other operator read for this project has mentioned:

      "Dual-striped courts use a tennis net which is about 2" taller than a
       standard pickleball net."

  ============================================================
  WHAT "COURTS: 8" MEANS, AND WHY WE CAN BE SURE
  ============================================================

  Most of these venues are tennis courts striped for pickleball, and their
  block is headed "Tennis & Pickleball". So does "Courts: 2" mean two courts
  you can play pickleball on, or two tennis courts of which some unknown
  number carry pickleball lines?

  Reindahl Park answers it. Its line reads:

      Courts: 8, asphalt; 4 striped for pickleball

  When only some of a park's courts carry pickleball lines, Madison says so.
  The exception establishes the rule for the other nineteen: an unqualified
  "Courts: N" under a "Tennis & Pickleball" heading is N courts you can play
  pickleball on. Reindahl itself is not published here — its address does not
  resolve — but its snapshot is committed and this run asserts that sentence
  is still present, because every other court count in this city rests on it.

  ============================================================
  THREE VENUES THE CITY LISTS AND THIS RUN REFUSES
  ============================================================

  Door Creek Park (8 courts), Reindahl Park (4 of 8 striped) and Rennebohm
  Park (6 courts) are all on Madison's pickleball list with counts and
  surfaces, and none of them is published. The Census address geocoder
  returns no match for 7035 Littlemore Dr, 1818 Portage Rd or 115 N Eau
  Claire Ave, on the spellings the City prints and on the variants tried.
  Import Gate I1 requires a street address that resolves.

  This is expensive — eighteen courts, including the largest outdoor count in
  the city — and it is the same rule that excluded Highland Community Park in
  Bellevue. A directory that waives its identity gate when the loss is large
  does not have an identity gate.

  ============================================================
  WARNER PARK IS TWO VENUES, AND BELLEVUE'S WAS ONE
  ============================================================

  Warner Park has three outdoor courts. The Warner Park Community Recreation
  Center, at the same street address, has five indoor courts across two gyms.
  They are published as TWO venues, where Bellevue's Hidden Valley Fieldhouse
  and Hidden Valley Sports Park were published as one. The difference is what
  the operator does with them, not what this project finds convenient:

    Hidden Valley  Two entries on one pickleball list, both hyperlinked to
                   the SAME park page. The fieldhouse had no page, no
                   separate name in the City's own records, no distinct
                   access rules and no fee.
    Warner Park    WPCRC is its own facility with its own pages, its own
                   department listing on cityofmadison.com, its own ID card,
                   its own membership or daily admission, and a booking
                   system. The outdoor courts have none of those things: they
                   are first come, first served, and free of any stated
                   charge.

  A visitor deciding between them is deciding between two different
  propositions at one address, which is exactly when two pages are right.

  ============================================================
  WHAT IS NOT CLAIMED
  ============================================================

  fees outdoors    Madison never calls its park courts free. It says the
                   courts "are available for individuals on a first-come,
                   first-served basis" and that leagues and lessons must
                   reserve. fee_type stays null at all nineteen outdoor
                   venues, on the same reasoning that kept Vancouver's park
                   courts unpriced.
  the WPCRC price  Membership and daily admission both exist and neither is
                   priced on the pages read here, so fee_type is drop_in_fee
                   — the least restrictive route a member of the public can
                   use, per O4 — and drop_in_fee_usd is null.
  lights           Stated at exactly one venue. Tenney Park's line reads
                   "Courts: 3, asphalt, lighted", and no other park's does.
                   The other eighteen outdoor venues are null, not false:
                   Madison marks the lit one rather than the unlit ones.
  Warner's surface The City states asphalt for the outdoor courts and nothing
                   about the two gym floors. One surface field cannot honestly
                   describe both, so the park keeps asphalt and the recreation
                   centre keeps null.
  nets             Never stated anywhere, indoors or out. The one thing
                   Madison does say about nets is that a dual-striped court
                   has a TENNIS net on it, about two inches too high, which
                   is published as a playing condition rather than as
                   nets_provided.
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

const CITY = 'City of Madison Parks Division'
const BASE = 'https://www.cityofmadison.com/parks'
const LIST_PAGE = `${BASE}/find-a-park/athletics/courts/pickleball`
const WPCRC_PAGE = `${BASE}/wpcrc/wpcrc-id/fitness-center-pickleball-membership`
const CENSUS_URL = 'https://geocoding.geo.census.gov/geocoder/geographies'

/* The city-wide sentences every venue below is read against. */
const DUAL_STRIPED =
  'Among the nearly 100 tennis courts in Madison, many are dual-striped for pickleball. Dual-striped courts use a tennis net which is about 2" taller than a standard pickleball net. Garner Park offers Madison\'s only dedicated outdoor pickleball courts.'
const FIRST_COME =
  'While the courts are available for individuals on a first-come, first-served basis,'
const LEAGUES_RESERVE = 'all leagues and lessons must reserve in advance'
/* The exception that tells us what an unqualified count means. See header. */
const REINDAHL_LINE = 'Courts: 8, asphalt; 4 striped for pickleball'

const SHARED_NOTE =
  'A tennis court striped for pickleball. Madison states that its dual-striped courts "use a tennis net which is about 2" taller than a standard pickleball net", so the net you play over here is a tennis net at tennis height. Individuals play first come, first served; leagues and lessons must reserve in advance.'

const DEDICATED_NOTE =
  'Madison\'s only dedicated outdoor pickleball courts — the City says so itself, and these are the only outdoor courts in the city not shared with tennis. Individuals play first come, first served; leagues and lessons must reserve in advance.'

const VENUES = [
  {slug: 'bordner-park', name: 'Bordner Park', page: 'bordner-park', courts: 2, surface: 'asphalt', address: '5610 Elder Pl'},
  {slug: 'brittingham-park', name: 'Brittingham Park', page: 'brittingham', courts: 4, surface: 'asphalt', address: '388 S. Bassett St.',
    /* The courts have their own address, away from the park's main one. */
    courtAddressNote: true},
  {slug: 'elver-park', name: 'Elver Park', page: 'elver', courts: 3, surface: 'asphalt', address: '1250 McKenna Blvd.'},
  {slug: 'garner-park', name: 'Garner Park', page: 'garner', courts: 6, surface: 'asphalt', address: '333 S. Rosa Rd.', dedicated: true},
  {slug: 'heritage-heights-park', name: 'Heritage Heights Park', page: 'heritage-heights', courts: 2, surface: 'asphalt', address: '701 Meadowlark Dr.'},
  {slug: 'huegel-park', name: 'Huegel Park', page: 'huegel-park', courts: 2, surface: 'asphalt', address: '5902 Williamsburg Way'},
  {slug: 'kennedy-park', name: 'Kennedy Park', page: 'kennedy', courts: 2, surface: 'asphalt', address: '5202 Retana Dr.'},
  {slug: 'nakoma-park', name: 'Nakoma Park', page: 'nakoma-park', courts: 1, surface: 'asphalt', address: '3801 Cherokee Dr.'},
  {slug: 'norman-clayton-park', name: 'Norman Clayton Park', page: 'norman-clayton-park', courts: 2, surface: 'asphalt', address: '6401 Shoreham Dr.'},
  {slug: 'northland-manor-park', name: 'Northland Manor Park', page: 'northland-manor-park', courts: 2, surface: 'asphalt', address: '902 Northland Dr.'},
  {slug: 'olbrich-park', name: 'Olbrich Park', page: 'olbrich', courts: 2, surface: 'asphalt', address: '3527 Atwood Ave.'},
  {slug: 'reynolds-park', name: 'Reynolds Park', page: 'reynolds-park', courts: 2, surface: 'modular_tile', surfaceWords: 'sport court tile', address: '810 E. Mifflin St.'},
  {slug: 'richmond-hill-park', name: 'Richmond Hill Park', page: 'richmond-hill-park', courts: 2, surface: 'asphalt', address: '6117 Cottontail Trl.'},
  {slug: 'tenney-park', name: 'Tenney Park', page: 'tenney', courts: 3, surface: 'asphalt', address: '1414 E. Johnson St.', lighted: true},
  {slug: 'walnut-grove-park', name: 'Walnut Grove Park', page: 'walnut-grove', courts: 2, surface: 'asphalt', address: '202 N. Westfield Rd.'},
  {slug: 'warner-park', name: 'Warner Park', page: 'warner', courts: 3, surface: 'asphalt', address: '2930 N. Sherman Ave.'},
  {slug: 'waunona-park', name: 'Waunona Park', page: 'waunona-park', courts: 2, surface: 'asphalt', address: '5323 Raywood Rd.'},
  {slug: 'westhaven-trails-park', name: 'Westhaven Trails Park', page: 'westhaven-trails-park', courts: 2, surface: 'asphalt', address: '3020 Cimarron Trl.'},
  {slug: 'westmorland-park', name: 'Westmorland Park', page: 'westmorland', courts: 2, surface: 'modular_tile', surfaceWords: 'sport court tile', address: '4114 Tokay Blvd.'},
  {slug: 'wexford-park', name: 'Wexford Park', page: 'wexford', courts: 2, surface: 'asphalt', address: '1201 N. Westfield Rd.'},
]

/* The indoor venue, which is a facility rather than a park. */
const WPCRC = {
  slug: 'warner-park-community-recreation-center',
  name: 'Warner Park Community Recreation Center',
  page: 'wpcrc-fitness-center-pickleball-membership',
  address: '2930 N. Sherman Ave.',
  indoor: 5,
  blue: 'Blue Gym: 2 courts - 20ft x 44ft',
  green: 'Green Gym: 3 courts - 20ft x 44ft',
  access: 'To play pickleball, an active',
  dailyAdmission: "If you don't have a Fitness Center Membership, you're welcome to play by paying a Daily Admission and an active WPCRC ID is still required.",
}

const EXCLUDED = [
  {name: 'Door Creek Park', line: 'Courts: 8, asphalt', address: '7035 Littlemore Dr.'},
  {name: 'Reindahl (Amund) Park', line: REINDAHL_LINE, address: '1818 Portage Rd.'},
  {name: 'Rennebohm Park', line: 'Courts: 6, asphalt', address: '115 N. Eau Claire Ave.'},
]

/* ---------------------------------------------------------------- */

const snapshotPath = name => `data/sources/madison/${name}.html`

const textOf = rel => readFileSync(join(REPO_ROOT, rel), 'utf8')
  .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&#0?39;|&apos;|&lsquo;|&rsquo;|[‘’]/g, "'")
  .replace(/&quot;|[“”]/g, '"')
  .replace(/&#8211;|&#8212;|[–—‑]/g, '-')

const squeeze = s => s.replace(/\s+/g, '')

const PAGES = [...new Set([
  'pickleball',
  'wpcrc-fitness-center-pickleball-membership', 'wpcrc-wpcrc',
  'door-creek', 'reindahl', 'rennebohm',
  ...VENUES.map(v => v.page),
])]

const FLAT = Object.fromEntries(
  PAGES.map(name => [name, squeeze(textOf(snapshotPath(name)))]))

const must = (which, who, needle, what) => {
  if (!FLAT[which].includes(squeeze(needle))) {
    throw new Error(
      `${who}: the ${which} snapshot no longer contains the ${what} text "${needle}". ` +
      'Re-read the page before trusting this run.')
  }
}

/* The city-wide statements every venue is read against. */
must('pickleball', 'city-wide', DUAL_STRIPED, 'dual-striped explanation')
must('pickleball', 'city-wide', FIRST_COME, 'first-come rule')
must('pickleball', 'city-wide', LEAGUES_RESERVE, 'league reservation rule')

/*
  THE SENTENCE EVERY COUNT RESTS ON.

  Reindahl is not published — its address does not resolve — but its line is
  what tells us that an unqualified "Courts: N" is N pickleball courts rather
  than N tennis courts of which some are striped. If Madison ever drops that
  qualifier, every count in this city needs re-reading, so the run fails
  rather than continuing on an argument that has gone.
*/
must('reindahl', 'city-wide', REINDAHL_LINE, 'count-semantics')

const counties = JSON.parse(
  readFileSync(join(REPO_ROOT, 'data/sources/madison-county-census.json'), 'utf8'))

for (const ex of EXCLUDED) {
  const slug = ex.name.toLowerCase().replace(/\(.*?\)/g, '').trim().replace(/\s+/g, '-')
  const key = slug.endsWith('-park') ? slug : `${slug}-park`
  if (counties[key]?.matched) {
    throw new Error(
      `${ex.name} now geocodes. The reason it is excluded has changed; re-read the source and revisit the exclusion.`)
  }
}

const identityRegistry = loadIdentity(REPO_ROOT)
const allRows = loadRows().map(r => mapRow(r).venue)
const bySlug = new Map(
  allRows.filter(v => v.city === 'Madison' && String(v.state).toUpperCase() === 'WI')
    .map(v => [v.slug, v]))

const overlay = {}
const changes = []

const shellFor = slug => {
  const shell = {
    slug, name: null, city: 'Madison', state: 'WI', county: null,
    postal_code: null, street_address: null, latitude: null, longitude: null,
    status: 'pending', source_url: null, date_checked: null, verified_by: null,
    claimed_by_owner: false, claim_date: null,
    rating: null, user_rating: null, review_count: null, claimed_or_verified: null,
    source_sport: 'pickleball',
  }
  for (const f of PUBLISHED_FACT_FIELDS) shell[f] = null
  return shell
}

const record = (slug, name, facts, res, quote, basisWhenMinted) => {
  const geo = counties[slug]
  overlay[slug] = {
    minted: !bySlug.has(slug),
    identity: {
      name, city: 'Madison', state: 'WI',
      county: geo.county, postal_code: geo.postal_code ?? null,
      latitude: geo.lat ?? null, longitude: geo.lon ?? null,
      imported_slug: bySlug.has(slug) ? slug : null,
      canonical_slug: identityRegistry.renames[slug]?.canonical ?? slug,
    },
    match: {
      source_page: LIST_PAGE, quote,
      basis: bySlug.has(slug)
        ? `Matched to the imported ${slug} row in Madison, WI.`
        : basisWhenMinted,
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
  changes.push(...changelogToRows(slug, res.changelog))
}

const geoCheck = (slug, who) => {
  const geo = counties[slug]
  if (!geo?.matched) throw new Error(`${who}: the Census geocoder did not match its address`)
  if (geo.place !== 'Madison city') {
    throw new Error(`${who}: Census places this at "${geo.place}", not Madison city.`)
  }
  return geo
}

/* ---- the outdoor parks ---- */

for (const p of VENUES) {
  const courtsLine = `Courts: ${p.courts}, ${p.surfaceWords ?? p.surface}${p.lighted ? ', lighted' : ''}`
  const heading = p.dedicated ? 'Pickleball' : 'Tennis & Pickleball'

  must(p.page, p.slug, courtsLine, 'court count and surface')
  must('pickleball', p.slug, p.address, 'street address')

  const geo = geoCheck(p.slug, p.slug)

  const doc = new SourceDocument({
    url: `${BASE}/find-a-park/${p.page}`, retrieved_at: RETRIEVED_AT, tier: 1, publisher: CITY, format: 'html',
  })
  const docList = new SourceDocument({
    url: LIST_PAGE, retrieved_at: RETRIEVED_AT, tier: 1, publisher: CITY, format: 'html',
  })
  const docCensus = new SourceDocument({
    url: CENSUS_URL, retrieved_at: RETRIEVED_AT, tier: 1, publisher: 'US Census Bureau', format: 'json',
  })

  const venue = bySlug.get(p.slug) ?? shellFor(p.slug)
  const quoted = `Quoted from ${p.name}'s page on cityofmadison.com, under the "${heading}" heading: "${courtsLine}"`

  const facts = [
    doc.fact('name', p.name, {evidence: `Named "${p.name}" by the ${CITY} on the park's own page.`}),
    doc.fact('total_courts', p.courts, {
      evidence: p.dedicated
        ? `${quoted}. The heading is "Pickleball" rather than "Tennis & Pickleball": these are the only dedicated outdoor pickleball courts in Madison, and the City says so on its pickleball page.`
        : `${quoted}. An unqualified count under this heading is a count of courts you can play pickleball on: where only some of a park's courts are striped, Madison says so — Reindahl Park reads "${REINDAHL_LINE}".`,
    }),
    doc.fact('outdoor_courts', p.courts, {
      evidence: `${quoted}. An outdoor park court. The indoor count is left unverified rather than set to zero.`,
    }),
    docList.fact('street_address', p.address, {
      evidence: p.courtAddressNote
        ? `"${p.address}" is the address the City gives for these courts specifically. The park itself is listed at a different address, 829 W. Washington Ave., and the park page prints the court address separately under its "Tennis & Pickleball" block.`
        : `"${p.address}" is the address the City prints beside this venue on its pickleball courts list.`,
    }),
    doc.fact('surface', p.surface, {
      evidence: `${quoted}. The City states the surface in the same line as the count.${p.surfaceWords ? ` Its words are "${p.surfaceWords}", recorded here under the controlled value modular_tile.` : ''}`,
    }),
    doc.fact('venue_type', 'public_park', {evidence: `Published by the ${CITY} among its parks.`}),
    docList.fact('court_availability', p.dedicated ? DEDICATED_NOTE : SHARED_NOTE, {
      evidence: `From the City's pickleball page: "${DUAL_STRIPED}" and "${FIRST_COME} ${LEAGUES_RESERVE}".`,
    }),
    docCensus.fact('county', geo.county, {
      evidence: `${geo.county} County, WI (FIPS ${geo.state_fips}${geo.county_fips}). ${geo.basis} The geocoder also places it in the incorporated place "${geo.place}", which is what allows it to be published under Madison rather than an adjoining town with a Madison postal address.`,
    }),
    docCensus.fact('postal_code', geo.postal_code, {evidence: geo.basis}),
  ]

  if (p.lighted) {
    facts.push(doc.fact('light', true, {
      evidence: `${quoted}. Madison marks the lit courts rather than the unlit ones, and Tenney is the only venue on its pickleball list whose line ends in "lighted".`,
    }))
  }

  const res = applyFacts(venue, facts)
  record(p.slug, p.name, facts, res, courtsLine,
    `No imported row under this slug. Minted from the ${CITY} pickleball courts list, which states the address, and the park's own page, which states the count and the surface.`)
}

/* ---- the indoor facility ---- */
{
  must(WPCRC.page, WPCRC.slug, WPCRC.blue, 'Blue Gym count')
  must(WPCRC.page, WPCRC.slug, WPCRC.green, 'Green Gym count')
  must(WPCRC.page, WPCRC.slug, WPCRC.dailyAdmission, 'daily admission')
  must('wpcrc-wpcrc', WPCRC.slug, WPCRC.address, 'street address')

  const geo = geoCheck(WPCRC.slug, WPCRC.slug)

  const doc = new SourceDocument({
    url: WPCRC_PAGE, retrieved_at: RETRIEVED_AT, tier: 1, publisher: CITY, format: 'html',
  })
  const docCensus = new SourceDocument({
    url: CENSUS_URL, retrieved_at: RETRIEVED_AT, tier: 1, publisher: 'US Census Bureau', format: 'json',
  })

  const quoted = `Quoted from the Warner Park Community Recreation Center's pickleball page: "${WPCRC.blue}" and "${WPCRC.green}"`

  const facts = [
    doc.fact('name', WPCRC.name, {evidence: `Named "${WPCRC.name}" by the ${CITY}, which runs it as a facility with its own pages rather than as an amenity of Warner Park.`}),
    doc.fact('total_courts', WPCRC.indoor, {evidence: `${quoted}. Two gyms, five courts.`}),
    doc.fact('indoor_courts', WPCRC.indoor, {evidence: `${quoted}. Both gyms are indoor. The outdoor count is left unverified rather than set to zero; the three outdoor courts at the same address are published separately as Warner Park, which is how the City organises them.`}),
    doc.fact('street_address', WPCRC.address, {evidence: `"${WPCRC.address}" is the address the City prints for the recreation center. It is also Warner Park's address: the centre stands in the park, and the two are published as separate venues because the City runs them as separate facilities with different access rules.`}),
    doc.fact('venue_type', 'community_center', {evidence: 'The City runs this as a community recreation center with its own membership, ID card and booking system.'}),
    doc.fact('fee_type', 'drop_in_fee', {
      evidence: `From the centre's pickleball page: "${WPCRC.dailyAdmission}" A membership is the other route and neither is priced on this page, so under the O4 precedence rule the drop-in admission is what is recorded and drop_in_fee_usd is left null.`,
    }),
    doc.fact('pricing_notes', 'Play requires either a Fitness Center/Pickleball membership or a Daily Admission, and an active WPCRC ID card either way. The City does not publish the price of either on this page. Annual and 6-month memberships and 20-visit passes are available and include the fitness center as well as the courts.', {
      evidence: `From the centre's pickleball page: "${WPCRC.dailyAdmission}" and "Annual and 6-month membership and 20-visit passes are available and include use of the fitness center and pickleball courts."`,
    }),
    doc.fact('court_availability', 'Five indoor courts across two gyms — Blue Gym has two and Green Gym three, each 20ft by 44ft. Unlike every outdoor court in Madison, these are reservable: the City runs bookings through its WebTrac account system, and an active WPCRC ID is required to play whether you hold a membership or pay daily admission.', {
      evidence: `From the centre's pickleball page: "${WPCRC.blue}", "${WPCRC.green}", the "Reserve Indoor Pickleball Court" booking route and its WebTrac checklist, and "${WPCRC.access} WPCRC ID and Fitness Center/Pickleball Membership is required."`,
    }),
    docCensus.fact('county', geo.county, {
      evidence: `${geo.county} County, WI (FIPS ${geo.state_fips}${geo.county_fips}). ${geo.basis} The geocoder also places it in the incorporated place "${geo.place}".`,
    }),
    docCensus.fact('postal_code', geo.postal_code, {evidence: geo.basis}),
  ]

  const venue = bySlug.get(WPCRC.slug) ?? shellFor(WPCRC.slug)
  const res = applyFacts(venue, facts)
  record(WPCRC.slug, WPCRC.name, facts, res, WPCRC.blue,
    `No imported row under this slug. Minted from the ${CITY}'s Warner Park Community Recreation Center pages, which state the court counts, the access rules and the address.`)
}

/* ---------------------------------------------------------------- */

const outdoorCourts = VENUES.reduce((a, p) => a + p.courts, 0)
const indoorCourts = WPCRC.indoor
const totalCourts = outdoorCourts + indoorCourts
const venueCount = VENUES.length + 1

for (const [slug, entry] of Object.entries(overlay)) {
  const patch = entry.patch
  const parts = (patch.indoor_courts ?? 0) + (patch.outdoor_courts ?? 0)
  if (patch.total_courts !== parts) {
    throw new Error(`Rule 13: ${slug} totals ${patch.total_courts} but its parts sum to ${parts}.`)
  }
}

mkdirSync(join(REPO_ROOT, 'data/verified'), {recursive: true})
writeFileSync(join(REPO_ROOT, 'data/verified/madison-wi.json'), JSON.stringify({
  city: 'Madison', state: 'WI', retrieved_at: RETRIEVED_AT,
  method_note:
    'Madison Parks states a court count AND a surface for every pickleball venue it lists, in a structured block on each park\'s own page: "Tennis & Pickleball / Courts: 2, asphalt". Surface is the field this directory has been worst at — five verified surfaces across the seventy-four venues published before this city — and Madison supplies twenty in one reading. An unqualified count under a "Tennis & Pickleball" heading is a count of courts you can play pickleball on, and we know that because Reindahl Park is the exception that says so: "Courts: 8, asphalt; 4 striped for pickleball". Three venues the City lists are excluded because the Census address geocoder does not resolve their addresses, which costs eighteen courts including the city\'s largest outdoor count. Warner Park and the Warner Park Community Recreation Center share a street address and are published as two venues, because the City runs them as two facilities with different access, different booking and different cost — unlike Bellevue\'s Hidden Valley, where one park page carried both and neither had rules of its own. No fee is claimed at any outdoor court: Madison never calls them free.',
  sources: [
    {url: LIST_PAGE, publisher: CITY, tier: 1, format: 'html', snapshot: snapshotPath('pickleball')},
        ...VENUES.map(p => ({
      url: `${BASE}/find-a-park/${p.page}`, publisher: CITY, tier: 1, format: 'html', snapshot: snapshotPath(p.page),
    })),
    {url: WPCRC_PAGE, publisher: CITY, tier: 1, format: 'html', snapshot: snapshotPath(WPCRC.page)},
    {url: `${BASE}/wpcrc`, publisher: CITY, tier: 1, format: 'html', snapshot: snapshotPath('wpcrc-wpcrc')},
    ...EXCLUDED.map((e, i) => ({
      url: `${BASE}/find-a-park/${['door-creek', 'reindahl', 'rennebohm'][i]}`,
      publisher: CITY, tier: 1, format: 'html',
      snapshot: snapshotPath(['door-creek', 'reindahl', 'rennebohm'][i]),
    })),
    {url: CENSUS_URL, publisher: 'US Census Bureau', tier: 1, format: 'json', snapshot: 'data/sources/madison-county-census.json'},
  ].map((s, i) => ({id: `S${i + 1}`, ...s})),
  totals: {venues: venueCount, courts: totalCourts, outdoor: outdoorCourts, indoor: indoorCourts},
  excluded: EXCLUDED.map(e => ({
    name: e.name,
    why: [
      `The Census address geocoder returns no match for "${e.address}", the address the City prints, or for the spelling variants tried. Import Gate I1 requires a street address that resolves.`,
      `The City does state its courts — "${e.line}" — so this is an identity failure, not a data one. It publishes the moment the address resolves.`,
    ],
  })),
  venues: overlay,
}, null, 2) + '\n')

const changed = changes.filter(r =>
  r.old_value !== null && r.old_value !== undefined && String(r.old_value) !== String(r.new_value))

const surfaces = VENUES.reduce((m, p) => {
  m[p.surface] = (m[p.surface] ?? 0) + 1
  return m
}, {})

writeFileSync(join(REPO_ROOT, 'reports', 'madison-conflicts.md'), [
  '# Madison verification - the first city that states its surfaces', '',
  `Run ${RETRIEVED_AT}. ${venueCount} venues published, ${totalCourts} courts ` +
  `(${outdoorCourts} outdoor, ${indoorCourts} indoor). 3 venues excluded.`, '',
  'Madison Parks publishes a court count and a surface on each park page, in one line under a',
  '"Tennis & Pickleball" or "Pickleball" heading. Before this city, five of the seventy-four venues',
  'in this directory had a verified surface. Madison adds twenty.', '',
  '| venue | courts | surface | lit | what the City writes |',
  '| --- | ---: | --- | --- | --- |',
  ...VENUES.map(p => `| \`${p.slug}\` | ${p.courts} | ${p.surface} | ${p.lighted ? 'yes' : 'not stated'} | "Courts: ${p.courts}, ${p.surfaceWords ?? p.surface}${p.lighted ? ', lighted' : ''}" |`),
  `| \`${WPCRC.slug}\` | ${WPCRC.indoor} | not stated | not stated | "${WPCRC.blue}"; "${WPCRC.green}" |`,
  '',
  `Surfaces: ${Object.entries(surfaces).map(([k, n]) => `${n} ${k}`).join(', ')}.`,
  '',
  '## What "Courts: N" means', '',
  'Most of these are tennis courts striped for pickleball, so an unqualified count could have meant',
  'either the courts you can play on or the tennis courts of which some are striped. Reindahl Park',
  'settles it by being the exception:', '',
  `> ${REINDAHL_LINE}`, '',
  'When only some courts are striped, Madison says so. Reindahl is not published here - its address',
  'does not resolve - but its snapshot is committed and this run asserts that line still exists,',
  'because every other count in this city depends on it.',
  '',
  '## Excluded', '',
  ...EXCLUDED.flatMap(e => [
    `**${e.name}** - "${e.line}" at ${e.address}. The Census address geocoder returns no match, so`,
    'Import Gate I1 cannot be satisfied. The City states the courts; this is an identity failure',
    'rather than a data one, and it publishes the day the address resolves.', '',
  ]),
  'That is eighteen courts refused, including Door Creek\'s eight - the largest outdoor count in the',
  'city. It is the same rule that excluded Highland Community Park in Bellevue, and a directory that',
  'waives its identity gate when the loss is large does not have an identity gate.',
  '',
  '## One address, two venues', '',
  'Warner Park has three outdoor courts. The Warner Park Community Recreation Center, at the same',
  'address, has five indoor ones. They publish separately, where Bellevue\'s Hidden Valley Fieldhouse',
  'and Sports Park published as a single venue. The difference is the operator: WPCRC has its own',
  'pages, its own ID card, its own membership or daily admission and its own booking system, and the',
  'outdoor courts have none of those - they are first come, first served with no stated charge.',
  '',
  changed.length ? '## Values a source changed' : '_No imported row was overwritten._',
  ...(changed.length ? [
    '', '| venue | field | was | now | outcome |', '| --- | --- | --- | --- | --- |',
    ...changed.map(r => `| \`${r.venue_slug}\` | ${r.field} | ${JSON.stringify(r.old_value)} | ${JSON.stringify(r.new_value)} | ${r.outcome} |`),
  ] : []),
  '',
].join('\n'))

console.log(`\nMadison, WI - ${venueCount} venues, ${totalCourts} courts ` +
  `(${outdoorCourts} outdoor, ${indoorCourts} indoor), retrieved ${RETRIEVED_AT}`)
for (const [slug, o] of Object.entries(overlay)) {
  console.log(
    `  ${o.patch.name.padEnd(42)} ${String(o.patch.total_courts).padStart(2)}` +
    ` | ${String(o.patch.surface ?? 'surface not stated').padEnd(18)}` +
    ` | lights ${String(o.patch.light ?? 'not stated').padEnd(11)}` +
    ` | ${o.patch.county} County`)
}
console.log(`\n  excluded: ${EXCLUDED.map(e => e.name).join(', ')} - ${EXCLUDED.length} venues,`)
console.log('            18 courts, all on addresses the Census geocoder cannot resolve.')
console.log('\nWrote data/verified/madison-wi.json and reports/madison-conflicts.md\n')
