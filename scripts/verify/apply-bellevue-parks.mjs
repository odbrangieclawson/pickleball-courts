#!/usr/bin/env node
/*
  Bellevue, WA verification run — city #8, Washington's third city, and the
  second city published in King County.

  ============================================================
  WHY BELLEVUE
  ============================================================

  The City of Bellevue publishes one page that names fourteen pickleball
  venues and states a court count for every single one of them, indoor and
  outdoor, in one list. Nothing else read for this directory has come close:
  Seattle needed two ArcGIS feature services joined together, Portland's
  counts sat inside prose, and Vancouver's page stated a number for three
  venues out of four.

  It also does the thing that makes a count usable rather than merely
  present — it says what KIND of court each number describes:

    Eastgate Park              "4 courts (dedicated)"
    Hillaire Park              "3 courts (1 dedicated, 2 portable nets)"
    Cherry Crest Mini Park     "1 court (over tennis net)"
    Lewis Creek Park           "2 courts (basketball court overlay, portable nets)"
    North Bellevue Comm. Ctr   "2 courts (with low ceiling)"

  and then states the default explicitly, which is rarer still:

    "Bellevue's pickleball courts are shared use with tennis courts,
     unless otherwise noted."

  A city that writes down its own default has told you what every unmarked
  entry means. That single sentence is what lets these venues carry a sourced
  court_availability instead of a shrug.

  ============================================================
  A COURT COUNT THREE DAYS OLD
  ============================================================

  Eastgate Park is the only venue in this directory whose current state has a
  date on it. On 28 August 2026 the City published a news item saying that
  from 1 September the tennis nets would come off its two dual-use sport
  courts and the four pickleball courts would become permanent — which is why
  the pickleball page reads "4 courts (dedicated)" and the park page says
  "four dedicated pickleball courts". That page was checked on 4 September.

  The same notice carries a stated negative, which is rarer than the news:

    "Bellevue's Parks & Community Services Department does not currently
     have conversions planned at any other dual-use courts in Bellevue."

  Both sentences are asserted by this run. A directory that says nothing else
  is coming had better fail the day something else is announced.

  ============================================================
  ONE PARK, TWO ENTRIES, ONE VENUE
  ============================================================

  The City lists "Hidden Valley Fieldhouse: 3 courts" under Indoor and
  "Hidden Valley Sports Park: 2 courts (portable nets)" under Outdoor. Both
  names link, on the City's own page, to the same park page — 1903 112th Ave
  NE — and there is one imported row for the place, not two.

  They are published here as ONE venue with indoor_courts 3 and
  outdoor_courts 2, which makes Hidden Valley Park the only venue in this
  directory where both numbers are above zero — the twenty-five others
  carrying both fields have a zero on one side, because Seattle's source
  states an explicit indoor 0 for every park it counts. The alternative was
  two venue pages sharing a
  street address, competing for the same search, and splitting a total of
  five courts between them for no reason a visitor would recognise: the
  fieldhouse is a building inside the park, not a second address.

  The merge is a judgement, so it is recorded as one — in the method note, in
  the conflicts report, and on the venue page itself.

  ============================================================
  HIGHLAND PARK IS EXCLUDED, ON THREE GROUNDS
  ============================================================

  The pickleball page lists "Highland Community Park: 4 courts (portable
  nets)". It is not published, for three independent reasons:

  1. The Census address geocoder returns NO MATCH for 14224 Bel-Red Road —
     the address the City's own park page gives — and no match for four
     spelling variants of it either. Import Gate I1 requires a street address
     that resolves. This one does not resolve against the only resolver this
     project has.
  2. The park's own page never mentions pickleball. It lists "two tennis
     courts" in its description and "Tennis Courts" in its amenity list, with
     no pickleball anywhere, so the count has no corroboration on the City's
     own record card for the park.
  3. The two City pages do not agree on its name: the pickleball page calls
     it "Highland Community Park" and the park page calls it "Highland Park".

  Any one of these would be survivable. Together they describe a venue this
  run cannot place on a map, cannot corroborate, and cannot name with
  confidence. The run asserts all three still hold, so the day the address
  resolves this file fails rather than quietly continuing to exclude a venue
  for a reason that has expired.

  ============================================================
  WHAT IS NOT CLAIMED
  ============================================================

  parking          The word "Parking" appears in every one of these
                   snapshots — in the site's own navigation, as "Permits,
                   Parking and Utilities". A naive amenity match would have
                   published a parking fact for all twelve venues from a menu
                   item. Nothing is published for parking at all.
  nets at the      "portable nets" says the nets are portable. It does not
  outdoor courts   say who brings them, and the City does not say elsewhere.
                   nets_provided is null everywhere except South Bellevue
                   Community Center, which writes "We provide pickleball
                   balls, nets, and poles."
  lights           Null at all twelve. Hidden Valley Park's page mentions "a
                   lighted tennis court" — one court, on a page that also
                   lists a separate sports court, and nothing says the
                   pickleball is played on the lit one. Unknown is not unlit,
                   and a guess here would be a guess about whether you can
                   play at 8 p.m. in November.
  surface          Stated nowhere. Bellevue names what a court is SHARED
                   with — tennis, basketball — which is a use, not a
                   material. Null at all twelve.
  fees at the      The City says "Pickleball schedules and fees can be viewed
  other two        on our registration site, or on a community center's
  community        drop-in schedule" and then links three PDFs. That says a
  centres          fee exists somewhere; it does not state one for Crossroads
                   or North Bellevue, and the linked schedules are dated 2023
                   and 2024. fee_type is null at both, and the sentence
                   itself is published as a pricing note so a reader knows
                   where the City says to look.

  ============================================================
  THE ONE PRICE THIS RUN COULD VERIFY
  ============================================================

  South Bellevue Community Center publishes its drop-in pricing as HTML on
  the page the pickleball page links to:

    "All Adult Drop-In Sports / Bellevue Residents- $4 / Non-Residents- $5"

  drop_in_fee_usd is recorded as 5, the undiscounted adult rate, on the same
  reasoning Portland's $6 was recorded rather than its $5 senior rate: the
  field holds what someone with no local standing pays to play once, and the
  residency discount belongs in the note beside it. The same page also states
  that family drop-in sessions are free — which is true, and comes with a
  condition (an adult and a child under 18 from one household, both on court)
  that makes it no route for two adults wanting a game. All three appear in
  pricing_notes.
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

const CITY = 'City of Bellevue Parks & Community Services'
const BASE = 'https://bellevuewa.gov/city-government/departments/parks'
const PAGE = `${BASE}/sports-and-athletics/pickleball-courts`
const NEWS_PAGE = 'https://bellevuewa.gov/city-news/eastgate-park-pickleball'
const CENSUS_URL = 'https://geocoding.geo.census.gov/geocoder/geographies'

/* The City's stated default for every entry it does not mark otherwise. */
const SHARED_USE =
  "Bellevue's pickleball courts are shared use with tennis courts, unless otherwise noted."

/* Where the City sends you for indoor schedules and fees. */
const INDOOR_FEE_SENTENCE =
  "Pickleball schedules and fees can be viewed on our registration site, or on a community center's drop-in schedule."

const SBCC_PRICING =
  'Adult drop-in sessions cost $4 for Bellevue residents and $5 for non-residents. Family drop-in sessions are free, but require an adult and a child under 18 from the same household to be on court together.'

const INDOOR_FEE_NOTE =
  `The City does not publish a price for pickleball here. It says: "${INDOOR_FEE_SENTENCE}" The drop-in schedules it links are PDFs dated 2023 and 2024.`

/*
  Every venue the City states a court count for, with the page that states
  its address. `spec` is asserted against the pickleball snapshot verbatim;
  `address` and the corroborating quotes are asserted against the venue's own
  page. Nothing below is published that is not one of those two things.
*/
const VENUES = [
  {
    slug: 'cherry-crest-mini-park', name: 'Cherry Crest Mini Park', page: 'cherry-crest-mini-park',
    spec: 'Cherry Crest Mini Park: 1 court (over tennis net)',
    courts: {outdoor: 1}, venueType: 'public_park',
    address: '2532 127th Ave NE',
    corroboration: 'This 5-acre park also features a basketball court and a tennis court with a pickleball overlay.',
    availability: 'One court, played over the tennis net on the park\'s single tennis court. The City marks it "over tennis net" rather than listing a portable net, and the park page describes the same thing from the other direction: "a tennis court with a pickleball overlay".',
    restroom: null,
  },
  {
    slug: 'crossroads-park', name: 'Crossroads Park', page: 'crossroads-park',
    spec: 'Crossroads Community Park: 4 courts (portable nets)',
    courts: {outdoor: 4}, venueType: 'public_park',
    address: '999 164th Ave NE',
    corroboration: 'Pickleball',
    availability: `Four courts on shared-use tennis courts, played with portable nets. ${SHARED_USE}`,
    restroom: true,
    /* The City's two pages name this place differently. */
    alias: 'Crossroads Community Park',
  },
  {
    slug: 'eastgate-park', name: 'Eastgate Park', page: 'eastgate-park',
    spec: 'Eastgate Park: 4 courts (dedicated)',
    courts: {outdoor: 4}, venueType: 'public_park',
    address: '14500 SE Newport Way',
    corroboration: "this park's recreational features include a ballfield, four dedicated pickleball courts, picnic tables, play area and nature trails.",
    availability: 'Four dedicated pickleball courts, and the only venue in Bellevue where every court is pickleball and nothing else. It became that on 1 September 2026, three days before this page was checked: the City removed the tennis nets from two dual-use sport courts and made the change permanent. The courts "will remain first-come, first-serve and will be open during posted park hours", and a follow-up project is planned to resurface them with pickleball lines only.',
    availability_page: 'eastgate-conversion-news',
    availability_quote: 'will remain first-come, first-serve and will be open during posted park hours',
    restroom: null,
  },
  {
    slug: 'hidden-valley-park', name: 'Hidden Valley Park', page: 'hidden-valley-park',
    /* Two entries on the City's list, one park, one address. See the header. */
    spec: 'Hidden Valley Sports Park: 2 courts (portable nets)',
    spec_indoor: 'Hidden Valley Fieldhouse: 3 courts',
    courts: {indoor: 3, outdoor: 2}, venueType: 'public_park',
    address: '1903 112th Ave NE',
    corroboration: 'Pickleball',
    availability: `Two outdoor courts on shared-use tennis courts with portable nets, plus three indoor courts in the Hidden Valley Fieldhouse, which the City lists as a separate entry at the same park. ${SHARED_USE}`,
    restroom: true,
    alias: 'Hidden Valley Fieldhouse, and Hidden Valley Sports Park',
  },
  {
    slug: 'hillaire-park', name: 'Hillaire Park', page: 'hillaire-park',
    spec: 'Hillaire Park: 3 courts (1 dedicated, 2 portable nets)',
    courts: {outdoor: 3}, venueType: 'public_park',
    address: '15803 NE 6th St',
    corroboration: 'Hillaire Park, located just south of Crossroads, is 4.2 acres and includes paved trails, two tennis courts, a basketball court, three pickleball courts (one dedicated, two overlay), a play area, a picnic area and seasonal restrooms.',
    availability: 'Three courts, of which one is dedicated pickleball and two are portable nets on the park\'s two tennis courts. The park page words the same split as "three pickleball courts (one dedicated, two overlay)".',
    restroom: true,
    restroom_quote: 'seasonal restrooms',
  },
  {
    slug: 'lakemont-community-park', name: 'Lakemont Community Park', page: 'lakemont-community-park',
    spec: 'Lakemont Community Park: 4 courts (portable nets)',
    courts: {outdoor: 4}, venueType: 'public_park',
    address: '5170 Village Park Drive SE',
    corroboration: 'Lakemont Community Park is 16 acres and features a play area, two picnic shelters, a basketball court, two tennis courts, four pickleball courts (overlay on the two tennis courts), a skate bowl, trails, restrooms, and a softball field.',
    availability: `Four courts overlaid on the park's two tennis courts, played with portable nets — the park page spells out the arithmetic, "four pickleball courts (overlay on the two tennis courts)". ${SHARED_USE}`,
    restroom: true,
  },
  {
    slug: 'lewis-creek-park', name: 'Lewis Creek Park', page: 'lewis-creek-park',
    spec: 'Lewis Creek Park: 2 courts (basketball court overlay, portable nets)',
    courts: {outdoor: 2}, venueType: 'public_park',
    address: '5808 Lakemont Blvd SE',
    corroboration: null,
    availability: 'Two courts marked out on the basketball court, played with portable nets. This is the only venue in Bellevue whose pickleball shares with basketball rather than tennis, and the only one where the City names what the overlay is on.',
    restroom: true,
  },
  {
    slug: 'norwood-village-neighborhood-park', name: 'Norwood Village Neighborhood Park', page: 'norwood-village-neighborhood-park',
    spec: 'Norwood Village Park: 2 courts (over tennis net)',
    courts: {outdoor: 2}, venueType: 'public_park',
    address: '12309 SE 23rd Place',
    corroboration: 'Norwood Village Neighborhood Park is 1.65 acres large and has 2 tennis courts with pickleball overlay, playground, picnic area, and a basketball/multi-purpose sport court.',
    availability: 'Two courts played over the tennis nets on the park\'s two tennis courts. The park page confirms the overlay from its own side: "2 tennis courts with pickleball overlay".',
    restroom: null,
    alias: 'Norwood Village Park',
  },
  {
    slug: 'spiritridge-park', name: 'Spiritridge Park', page: 'spiritridge-park',
    spec: 'Spiritridge Park: 2 courts (portable nets)',
    courts: {outdoor: 2}, venueType: 'public_park',
    address: '16100 SE 33rd Place',
    corroboration: null,
    availability: `Two courts on shared-use tennis courts, played with portable nets. ${SHARED_USE}`,
    restroom: null,
  },
  {
    slug: 'crossroads-community-center', name: 'Crossroads Community Center', page: 'crossroads-community-center',
    spec: 'Crossroads Community Center: 3 courts',
    courts: {indoor: 3}, venueType: 'community_center',
    address: '16000 NE 10th St',
    corroboration: null,
    availability: 'Three indoor courts, run as drop-in sessions on a published schedule. The centre\'s own programme page says of its drop-in activities: "No registration required: first-come, first-served. Space is limited."',
    availability_page: 'ccc-programs',
    availability_quote: 'No registration required: first-come, first-served. Space is limited.',
    restroom: null,
    pricing_notes: INDOOR_FEE_NOTE,
  },
  {
    slug: 'north-bellevue-community-center', name: 'North Bellevue Community Center', page: 'north-bellevue-community-center',
    spec: 'North Bellevue Community Center: 2 courts (with low ceiling)',
    courts: {indoor: 2}, venueType: 'community_center',
    address: '4063 148th Ave NE',
    corroboration: null,
    availability: 'Two indoor courts, and the City warns about them in the same breath as it counts them: "2 courts (with low ceiling)". It is the only venue on Bellevue\'s list carrying a caveat about the room rather than about the court.',
    restroom: null,
    pricing_notes: INDOOR_FEE_NOTE,
  },
  {
    slug: 'south-bellevue-community-center', name: 'South Bellevue Community Center', page: 'south-bellevue-community-center',
    spec: 'South Bellevue Community Center: 6 courts',
    courts: {indoor: 6}, venueType: 'community_center',
    address: '14509 SE Newport Way',
    corroboration: null,
    availability: 'Six indoor courts — the largest single count in Bellevue — run as adult and family drop-in sessions on a published schedule. The centre asks participants to check in at the front desk before playing, and takes no reservations: "All Drop-In Sports times are strictly drop-in only."',
    availability_page: 'sbcc-drop-in-sports',
    availability_quote: 'All Drop-In Sports times are strictly drop-in only.',
    restroom: null,
    fee: {
      type: 'drop_in_fee', usd: 5, notes: SBCC_PRICING,
      page: 'sbcc-drop-in-sports',
      quote: 'All Adult Drop-In Sports',
    },
    nets: true,
    nets_page: 'sbcc-drop-in-sports',
    nets_quote: 'We provide pickleball balls, nets, and poles.',
  },
]

/* The venue the City lists and this run refuses. */
const EXCLUDED = {
  name: 'Highland Community Park',
  spec: 'Highland Community Park: 4 courts (portable nets)',
  reasons: [
    'The Census address geocoder returns no match for "14224 Bel-Red Road", the address the City\'s own park page gives, and no match for four spelling variants of it. Import Gate I1 requires a street address that resolves.',
    'The park\'s own page never mentions pickleball: its description lists "two tennis courts" and its amenity list carries "Tennis Courts", with no pickleball anywhere. The court count has no corroboration on the City\'s record card for the park.',
    'The City\'s two pages disagree on its name. The pickleball page says "Highland Community Park"; the park page says "Highland Park".',
  ],
}

/* ---------------------------------------------------------------- */

const snapshotPath = name => `data/sources/bellevue/${name}.html`

const venueUrl = p =>
  `${BASE}/${p.venueType === 'community_center' ? 'community-centers' : 'parks-and-trails/parks'}/${p.page}`

const textOf = rel => readFileSync(join(REPO_ROOT, rel), 'utf8')
  .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&#0?39;|&apos;|&lsquo;|&rsquo;|[‘’]/g, "'")
  .replace(/&quot;|[“”]/g, '"')
  /*
    U+2011 NON-BREAKING HYPHEN is in here because the City's newsroom uses it.
    "first‑come, first‑serve" on the Eastgate conversion notice is not spelled
    with the hyphen anyone would type, and a needle written with a plain one
    silently fails to match — which, in a file whose whole job is to refuse to
    publish text it cannot find, means losing a fact rather than catching an
    error.
  */
  .replace(/&#8211;|&#8212;|[–—‑]/g, '-')

/*
  Whitespace-insensitive matching. The CMS breaks a run of text across inline
  elements — "Crossroads Community Center" is a link and ": 3 courts" is the
  text node after it — so the character sequence is the stable thing and the
  spacing is not.
*/
const squeeze = s => s.replace(/\s+/g, '')

const PAGES = [...new Set([
  'pickleball',
  'highland-park',
  'eastgate-conversion-news',
  ...VENUES.map(v => v.page),
  ...VENUES.map(v => v.availability_page).filter(Boolean),
  ...VENUES.map(v => v.fee?.page).filter(Boolean),
  ...VENUES.map(v => v.nets_page).filter(Boolean),
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

const mustNot = (which, who, needle, what) => {
  if (FLAT[which].toLowerCase().includes(squeeze(needle).toLowerCase())) {
    throw new Error(
      `${who}: the ${which} snapshot NOW contains "${needle}". ` +
      `The ${what} this run recorded has changed; re-read the page and revisit the decision built on it.`)
  }
}

/* The City's stated default, which every unmarked venue's availability rests on. */
must('pickleball', 'city-wide', SHARED_USE, 'shared-use default')
must('pickleball', 'city-wide', INDOOR_FEE_SENTENCE, 'indoor fees')

/*
  The Eastgate conversion, and the sentence that bounds it. The City did not
  merely announce a conversion — it said there are no others planned, which is
  a stated negative and the kind of sentence a directory can be wrong about
  loudly. Both are asserted so that a later announcement breaks this run
  rather than leaving a page claiming nothing else is coming.
*/
must('eastgate-conversion-news', 'city-wide', 'Published  August 28 2026', 'publication date')
must('eastgate-conversion-news', 'city-wide',
  'does not currently have conversions planned at any other dual-use courts in Bellevue',
  'no-further-conversions')

/*
  THE EXCLUSION IS ASSERTED, NOT ASSUMED.

  Highland Park is left out for three reasons and every one of them is a claim
  about a page that could change. If the park page starts naming pickleball,
  this run fails rather than going on excluding a venue for a reason that has
  expired.
*/
must('pickleball', 'highland-park', EXCLUDED.spec, 'excluded venue')
must('highland-park', 'highland-park', 'Highland Park', 'park-page name')
mustNot('highland-park', 'highland-park', 'pickleball', 'absence of pickleball on the park page')

const counties = JSON.parse(
  readFileSync(join(REPO_ROOT, 'data/sources/bellevue-county-census.json'), 'utf8'))

if (counties['highland-park']?.matched) {
  throw new Error(
    'Highland Park now geocodes. One of the three reasons it is excluded has changed; re-read the source and revisit the exclusion.')
}

const identityRegistry = loadIdentity(REPO_ROOT)
const allRows = loadRows().map(r => mapRow(r).venue)
const bySlug = new Map(
  allRows.filter(v => v.city === 'Bellevue' && String(v.state).toUpperCase() === 'WA')
    .map(v => [v.slug, v]))

const overlay = {}
const changes = []

for (const p of VENUES) {
  must('pickleball', p.slug, p.spec, 'venue and court count')
  if (p.spec_indoor) must('pickleball', p.slug, p.spec_indoor, 'indoor court count')
  must(p.page, p.slug, p.address, 'street address')
  if (p.corroboration) must(p.page, p.slug, p.corroboration, 'corroborating')
  if (p.availability_quote) must(p.availability_page, p.slug, p.availability_quote, 'availability')
  if (p.restroom_quote) must(p.page, p.slug, p.restroom_quote, 'restroom')
  if (p.nets_quote) must(p.nets_page, p.slug, p.nets_quote, 'nets')
  if (p.fee) must(p.fee.page, p.slug, p.fee.quote, 'pricing')

  const geo = counties[p.slug]
  if (!geo?.matched) throw new Error(`${p.slug}: the Census geocoder did not match its address`)
  /*
    Every venue must be inside the city it is published under. A great many
    addresses reading "Bellevue, WA" sit in unincorporated King County, and a
    postal address is not a jurisdiction.
  */
  if (geo.place !== 'Bellevue city') {
    throw new Error(`${p.slug}: Census places this at "${geo.place}", not Bellevue city.`)
  }

  const doc = new SourceDocument({
    url: PAGE, retrieved_at: RETRIEVED_AT, tier: 1, publisher: CITY, format: 'html',
  })
  const docVenue = new SourceDocument({
    url: venueUrl(p), retrieved_at: RETRIEVED_AT, tier: 1, publisher: CITY, format: 'html',
  })
  const docCensus = new SourceDocument({
    url: CENSUS_URL, retrieved_at: RETRIEVED_AT, tier: 1, publisher: 'US Census Bureau', format: 'json',
  })

  const shell = {
    slug: p.slug, name: null, city: 'Bellevue', state: 'WA', county: null,
    postal_code: null, street_address: null, latitude: null, longitude: null,
    status: 'pending', source_url: null, date_checked: null, verified_by: null,
    claimed_by_owner: false, claim_date: null,
    rating: null, user_rating: null, review_count: null, claimed_or_verified: null,
    source_sport: 'pickleball',
  }
  for (const f of PUBLISHED_FACT_FIELDS) shell[f] = null
  const venue = bySlug.get(p.slug) ?? shell

  const indoor = p.courts.indoor ?? null
  const outdoor = p.courts.outdoor ?? null
  const total = (indoor ?? 0) + (outdoor ?? 0)
  const quoted = `Quoted from the City of Bellevue's pickleball courts page: "${p.spec}"`

  const facts = [
    doc.fact('name', p.name, {
      evidence: p.alias
        ? `The City names this venue two ways. Its pickleball page says "${p.alias}"; the venue's own page — the one the pickleball page links to — says "${p.name}", which is the name published here.`
        : `Named "${p.name}" by the ${CITY} on its pickleball courts page and on the venue's own page.`,
    }),
    doc.fact('total_courts', total, {
      evidence: p.spec_indoor
        ? `${quoted} and "${p.spec_indoor}". The City lists this park twice — once under Outdoor and once under Indoor — and links both entries to the same park page at one address, so the two counts are published as one venue of ${total} courts rather than two venues sharing a street.`
        : `${quoted}.`,
    }),
  ]

  if (outdoor !== null) {
    facts.push(doc.fact('outdoor_courts', outdoor, {
      evidence: `${quoted}. Listed under the page's "Outdoor" heading.${indoor === null ? ' The indoor count is left unverified rather than set to zero.' : ''}`,
    }))
  }
  if (indoor !== null) {
    facts.push(doc.fact('indoor_courts', indoor, {
      evidence: p.spec_indoor
        ? `Quoted from the same page, under its "Indoor" heading: "${p.spec_indoor}".`
        : `${quoted}. Listed under the page's "Indoor" heading.${outdoor === null ? ' The outdoor count is left unverified rather than set to zero.' : ''}`,
    }))
  }

  facts.push(
    docVenue.fact('street_address', p.address, {
      evidence: `"${p.address}" is the address the City prints in the contact block of this venue's own page, which the pickleball page links to by name.`,
    }),
    doc.fact('venue_type', p.venueType, {
      evidence: p.venueType === 'public_park'
        ? `Published by the ${CITY} among its parks, and linked from the pickleball page to its park page.`
        : 'The City names this a community center and runs its pickleball as scheduled indoor drop-in sessions.',
    }),
    doc.fact('court_availability', p.availability, {
      evidence: p.availability_quote
        ? `From the City's pickleball page, "${p.spec}", together with ${
          p.availability_page === 'eastgate-conversion-news'
            ? 'the City\'s news item of 28 August 2026 announcing the conversion'
            : "the venue's own page"}: "${p.availability_quote}"`
        : `${quoted}, read against the City's stated default for every unmarked entry: "${SHARED_USE}"`,
    }),
    docCensus.fact('county', geo.county, {
      evidence: `${geo.county} County, WA (FIPS ${geo.state_fips}${geo.county_fips}). ${geo.basis} The geocoder also places it in the incorporated place "${geo.place}", which is what allows it to be published under Bellevue rather than an unincorporated area with a Bellevue postal address.`,
    }),
    docCensus.fact('postal_code', geo.postal_code, {evidence: geo.basis}),
  )

  if (p.restroom === true) {
    facts.push(docVenue.fact('restroom', true, {
      evidence: p.restroom_quote
        ? `The park's own page says the park includes "${p.restroom_quote}".`
        : 'The park\'s own page lists "Restrooms" among its amenities.',
    }))
  }
  if (p.nets === true) {
    facts.push(docVenue.fact('nets_provided', true, {
      evidence: `From the centre's drop-in sports page: "${p.nets_quote}" This is the only venue in Bellevue where the City says who supplies the net.`,
    }))
  }
  if (p.fee) {
    facts.push(docVenue.fact('fee_type', p.fee.type, {
      evidence: `From the centre's drop-in sports page, under "Pricing Information": "${p.fee.quote}" — Bellevue Residents $4, Non-Residents $5. Family drop-in sessions are free but require an adult and a child under 18 from one household on court together, which is not a route two adults can use, so under the O4 precedence rule the drop-in fee is what is recorded.`,
    }))
    facts.push(docVenue.fact('drop_in_fee_usd', p.fee.usd, {
      evidence: 'The undiscounted adult rate. $4 is the Bellevue resident price and $5 is what everyone else pays; the field holds what someone with no local standing pays to play once, and the discount is recorded in the pricing note beside it.',
    }))
    facts.push(docVenue.fact('pricing_notes', p.fee.notes, {
      evidence: 'From the centre\'s drop-in sports page, under "Pricing Information".',
    }))
  } else if (p.pricing_notes) {
    facts.push(doc.fact('pricing_notes', p.pricing_notes, {
      evidence: `From the City's pickleball courts page: "${INDOOR_FEE_SENTENCE}" No price is stated for pickleball at this centre, so fee_type is left unverified and the reader is told where the City says to look.`,
    }))
  }

  const res = applyFacts(venue, facts)

  overlay[p.slug] = {
    minted: !bySlug.has(p.slug),
    identity: {
      name: p.name, city: 'Bellevue', state: 'WA',
      county: geo.county, postal_code: geo.postal_code ?? null,
      latitude: geo.lat ?? null, longitude: geo.lon ?? null,
      imported_slug: bySlug.has(p.slug) ? p.slug : null,
      canonical_slug: identityRegistry.renames[p.slug]?.canonical ?? p.slug,
    },
    match: {
      source_page: PAGE, quote: p.spec,
      basis: bySlug.has(p.slug)
        ? `Matched to the imported ${p.slug} row in Bellevue, WA.`
        : `No imported row under this slug. Minted from the ${CITY} pickleball courts page, which states the count, and from the venue's own page, which states the address.`,
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

const sum = pick => VENUES.reduce((a, p) => a + (p.courts[pick] ?? 0), 0)
const outdoorCourts = sum('outdoor')
const indoorCourts = sum('indoor')
const totalCourts = outdoorCourts + indoorCourts

for (const p of VENUES) {
  const patch = overlay[p.slug].patch
  const parts = (patch.indoor_courts ?? 0) + (patch.outdoor_courts ?? 0)
  if (patch.total_courts !== parts) {
    throw new Error(`Rule 13: ${p.slug} totals ${patch.total_courts} but its parts sum to ${parts}.`)
  }
}

mkdirSync(join(REPO_ROOT, 'data/verified'), {recursive: true})
writeFileSync(join(REPO_ROOT, 'data/verified/bellevue-wa.json'), JSON.stringify({
  city: 'Bellevue', state: 'WA', retrieved_at: RETRIEVED_AT,
  method_note:
    'The City of Bellevue states a court count for every pickleball venue it lists, on one page, indoor and outdoor together, and states its own default for the ones it does not mark: "Bellevue\'s pickleball courts are shared use with tennis courts, unless otherwise noted." That sentence is why these venues carry a sourced note on what kind of court you are turning up to rather than a bare number. Addresses come from each venue\'s own City page, which the pickleball page links to by name. Eastgate Park\'s four courts became pickleball-only on 1 September 2026, three days before this check, and the City\'s notice of it also states that no other dual-use court in Bellevue is scheduled to convert — both sentences are asserted by the run rather than taken on trust. Hidden Valley Park is listed by the City twice — a fieldhouse under Indoor and a sports park under Outdoor — with both entries linking to one park page at one address; it is published as one venue carrying 3 indoor and 2 outdoor courts, and that merge is a judgement recorded as one. Highland Community Park is listed by the City and excluded here on three independent grounds, chief among them that its stated address does not resolve in the Census geocoder. Lights, surface and parking are published nowhere in this city: the City states none of them, one snapshot\'s "lighted tennis court" is not a statement about a pickleball court, and the word "Parking" appears on every page as a navigation menu item.',
  /*
    Ids are assigned by position rather than written in. The list has grown
    twice already, and a hand-numbered S14 that stops being the fourteenth
    entry is a citation pointing at the wrong document.
  */
  sources: [
    {url: PAGE, publisher: CITY, tier: 1, format: 'html', snapshot: snapshotPath('pickleball')},
    ...VENUES.map(p => ({
      url: venueUrl(p), publisher: CITY, tier: 1, format: 'html', snapshot: snapshotPath(p.page),
    })),
    {url: `${BASE}/community-centers/sbcc/drop-sports`, publisher: CITY, tier: 1, format: 'html', snapshot: snapshotPath('sbcc-drop-in-sports')},
    {url: `${BASE}/community-centers/crossroads/crossroads-community-center-programs`, publisher: CITY, tier: 1, format: 'html', snapshot: snapshotPath('ccc-programs')},
    {url: NEWS_PAGE, publisher: CITY, tier: 1, format: 'html', snapshot: snapshotPath('eastgate-conversion-news')},
    {url: `${BASE}/parks-and-trails/parks/highland-park`, publisher: CITY, tier: 1, format: 'html', snapshot: snapshotPath('highland-park')},
    {url: CENSUS_URL, publisher: 'US Census Bureau', tier: 1, format: 'json', snapshot: 'data/sources/bellevue-county-census.json'},
  ].map((s, i) => ({id: `S${i + 1}`, ...s})),
  totals: {venues: VENUES.length, courts: totalCourts, outdoor: outdoorCourts, indoor: indoorCourts},
  excluded: [{name: EXCLUDED.name, why: EXCLUDED.reasons}],
  venues: overlay,
}, null, 2) + '\n')

const changed = changes.filter(r =>
  r.old_value !== null && r.old_value !== undefined && String(r.old_value) !== String(r.new_value))

writeFileSync(join(REPO_ROOT, 'reports', 'bellevue-conflicts.md'), [
  '# Bellevue verification - one page, fourteen counts, and the one that could not be placed', '',
  `Run ${RETRIEVED_AT}. ${VENUES.length} venues published, ${totalCourts} courts ` +
  `(${outdoorCourts} outdoor, ${indoorCourts} indoor). 1 venue excluded.`, '',
  'The City of Bellevue publishes a court count for every pickleball venue it lists, indoor and',
  'outdoor, on a single page - the richest municipal source read for this directory so far. It also',
  'states its own default, which is rarer than the counts:', '',
  `> "${SHARED_USE}"`, '',
  "| venue | courts | where | what kind, in the City's words |",
  '| --- | ---: | --- | --- |',
  ...VENUES.map(p => {
    const where = p.courts.indoor && p.courts.outdoor ? 'both'
      : p.courts.indoor ? 'indoor' : 'outdoor'
    const n = (p.courts.indoor ?? 0) + (p.courts.outdoor ?? 0)
    return `| \`${p.slug}\` | ${n} | ${where} | "${p.spec.split(': ')[1]}"` +
      `${p.spec_indoor ? ` and "${p.spec_indoor.split(': ')[1]}"` : ''} |`
  }),
  '',
  '## Excluded', '',
  `**${EXCLUDED.name}** - "${EXCLUDED.spec.split(': ')[1]}" - three independent reasons:`, '',
  ...EXCLUDED.reasons.map((r, i) => `${i + 1}. ${r}`),
  '',
  'The run asserts all three still hold. The day the address resolves, or the park page starts',
  'naming pickleball, this run fails rather than continuing to exclude a venue for a reason that',
  'has expired.',
  '',
  '## One park listed twice', '',
  'The City lists `Hidden Valley Fieldhouse: 3 courts` under Indoor and `Hidden Valley Sports Park:',
  '2 courts (portable nets)` under Outdoor, and links both names to the same park page at',
  '1903 112th Ave NE. They are published as one venue with 3 indoor and 2 outdoor courts - the only',
  'venue in this directory with both numbers above zero - rather than two venue pages sharing a',
  'street address and competing for the same search.',
  '',
  '## A count with a date on it', '',
  'Eastgate Park went pickleball-only on 1 September 2026, three days before this check. The City',
  'announced it on 28 August: the tennis nets come off two dual-use sport courts, the four',
  'pickleball courts become permanent, the courts stay first-come first-serve, and a resurfacing',
  'with pickleball lines only is planned to follow. The same notice states that the department',
  '"does not currently have conversions planned at any other dual-use courts in Bellevue" - a',
  'stated negative, and one this run asserts, so that a later announcement breaks the build rather',
  'than leaving a page quietly claiming nothing else is coming.',
  '',
  '## What this city does not say', '',
  '| field | venues with a value | why |',
  '| --- | ---: | --- |',
  '| `light` | 0 | Stated nowhere. Hidden Valley Park mentions "a lighted tennis court", which is not a statement about a pickleball court. |',
  '| `surface` | 0 | Bellevue names what a court is shared with - tennis, basketball - which is a use, not a material. |',
  '| `parking` | 0 | The word "Parking" appears in every snapshot as a navigation item, "Permits, Parking and Utilities". A naive amenity match would have published a parking fact for all twelve venues from a menu. |',
  "| `fee_type` | 1 | Only South Bellevue Community Center publishes a price. The City's outdoor courts are never called free, and the other two centres point at PDF schedules dated 2023 and 2024. |",
  '| `nets_provided` | 1 | "portable nets" says the nets are portable, not who brings them. Only South Bellevue says: "We provide pickleball balls, nets, and poles." |',
  '',
  changed.length ? '## Values a source changed' : '_No imported row was overwritten._',
  ...(changed.length ? [
    '', '| venue | field | was | now | outcome |', '| --- | --- | --- | --- | --- |',
    ...changed.map(r => `| \`${r.venue_slug}\` | ${r.field} | ${JSON.stringify(r.old_value)} | ${JSON.stringify(r.new_value)} | ${r.outcome} |`),
  ] : []),
  '',
].join('\n'))

console.log(`\nBellevue, WA - ${VENUES.length} venues, ${totalCourts} courts ` +
  `(${outdoorCourts} outdoor, ${indoorCourts} indoor), retrieved ${RETRIEVED_AT}`)
for (const p of VENUES) {
  const o = overlay[p.slug]
  console.log(
    `  ${o.patch.name.padEnd(34)} ${String(o.patch.total_courts).padStart(2)}` +
    ` | in ${String(o.patch.indoor_courts ?? '-').padStart(2)} out ${String(o.patch.outdoor_courts ?? '-').padStart(2)}` +
    ` | ${String(o.patch.fee_type ?? 'fee not stated').padEnd(14)}` +
    ` | ${o.patch.county} County`)
}
console.log(`\n  excluded: ${EXCLUDED.name} - its address does not resolve in the`)
console.log('            Census geocoder, its park page never mentions pickleball,')
console.log("            and the City's two pages disagree about its name.")
console.log('\nWrote data/verified/bellevue-wa.json and reports/bellevue-conflicts.md\n')
