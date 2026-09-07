#!/usr/bin/env node
/*
  Long Beach, CA verification run - city #29, California's third city after
  Irvine and Huntington Beach, and the first in Los Angeles County.

  ============================================================
  ONE LIST, ONE LINE PER PARK, WITH THE ADDRESS IN BRACKETS
  ============================================================

  The City's pickleball page carries a list headed "Pickleball Courts at
  Park Locations:", and every line states the count and the address:

      DeForest Park (6255 DeForest Ave.) - 8 dedicated courts.
      Silverado Park (1545 W. 31st St.) - 4 dedicated pickleball courts.
      Veterans Park (101 E. 28th St.) - Hybrid location: 8 pickleball
        courts on 1 tennis court and 4 dedicated pickleball courts.
      Junipero Beach (2100 E. Ocean Blvd.) - 2 dedicated pickleball courts
        on repurposed half basketball court.
      El Dorado Park West (2800 N. Studebaker Rd.) - 3 pickleball courts
        on a shared sports court.
      Somerset Park (1500 E. Carson) - Dual striping 8 pickleball on 2
        tennis courts.
      Bayshore Park (5415 E. Ocean) - 1 dedicated court, 2 dual-striped.
      Marina Vista Park (Colorado St. & Santiago) - Hybrid location: 4
        dedicated pickleball courts and 4 dual-striped courts for either
        tennis or pickleball.
      Whaley Park (5620 Atherton St.) - Dual-striped pickleball and
        volleyball court.

  The City also distinguishes, line by line, a dedicated court from a
  court striped onto tennis, and where a line carries two figures the sum
  is the City's own arithmetic (Jim Jeffers, Densmore): Veterans 8 + 4,
  Bayshore 1 + 2, Marina Vista 4 + 4.

  Below the list the City prices its two tennis centres: "The pay-to-play
  rates at both tennis facilities are $5 per person for drop-in play (up to
  three hours), while private pickleball court reservations are $10 per
  court per hour."

  ============================================================
  THE CITY'S OWN AGGREGATE IS NOT A COUNT
  ============================================================

  "Currently there are 24 dedicated pickleball courts in Long Beach." That
  sentence is asserted and NOT used: the dedicated figures the City states
  venue by venue sum to 23 (8 + 4 + 4 + 2 + 1 + 4), and no page reconciles
  the two. A total is not a venue, and this one does not even agree with
  the City's own list.

  ============================================================
  WHAT IS REFUSED
  ============================================================

  Somerset Park       "1500 E. Carson" on the list, "1500 E. Carson St."
                      on the park page, no city on either. The Census
                      geocoder places that address in "Carson city", the
                      neighbouring incorporated city that shares the
                      street's name, in postcode 90745. A city page must
                      contain venues in that city; the run throws if the
                      address ever resolves inside Long Beach.

  Billie Jean King    The list says the centre "offers four shared-use
  Tennis Center       pickleball courts"; the centre's own page says "8
                      Pickleball Courts, Fully Lighted". Two City records,
                      two numbers - the Los Olivos rule. Both asserted.

  Whaley Park         "Dual-striped pickleball and volleyball court." A
                      court, not a count.

  ============================================================
  TWO VENUES AT 2800 STUDEBAKER ROAD
  ============================================================

  El Dorado Park West (3 courts on a shared sports court) and the El Dorado
  Park Tennis & Pickleball Center (8 lit courts, its own hours, its own
  prices, its own page) share one address. Madison's Warner Park set the
  test - a facility with its own page, hours and fees is its own venue -
  and both publish.

  ============================================================
  WHAT IS NOT CLAIMED
  ============================================================

  outdoor/indoor   The City never writes either word about the park
                   courts. Null, following Mesa and Irvine.
  fee at parks     "first-come, first-served" is a play format, not a
                   price. The City never writes "free". Null.
  lighting         Stated only at the tennis centre ("Fully Lighted"). El
                   Dorado Park West's page says the park has "night-lighted
                   basketball and multi-use courts"; the pickleball is "on
                   a shared sports court", and the run does not decide that
                   a sports court is a multi-use court. Null.
  surface, nets    Not stated.
  addresses        The park pages for DeForest, Silverado and Veterans
                   print no street address; those rest on the list page.
                   Marina Vista is the reverse - the list gives cross
                   streets and the park page gives "5355 Eliot St.", which
                   is what publishes.
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

const CITY = 'City of Long Beach Parks, Recreation and Marine'
const PAGE = 'https://www.longbeach.gov/park/recreation-programs/sports-and-athletics/pickleball/'
const PARK_BASE = 'https://www.longbeach.gov/park/park-and-facilities/directory'
const CENSUS_URL = 'https://geocoding.geo.census.gov/geocoder/geographies'

const AGGREGATE = 'Currently there are 24 dedicated pickleball courts in Long Beach.'
const FIRST_COME = 'NO reservations at this time. All courts (except those at Billy Jean King and El Dorado Tennis Center) are first-come, first-served and court signage regarding shared use must be observed.'
const HEADING = 'Pickleball Courts at Park Locations:'
const RATES = 'The pay-to-play rates at both tennis facilities are $5 per person for drop-in play (up to three hours), while private pickleball court reservations are $10 per court per hour.'
const TC_LIST = 'El Dorado Tennis Center offers eight shared-use pickleball courts with drop-in play available on Tuesday and Thursday mornings from 8 to 11 am, and Friday evenings from 6 to 9pm.'
const TC_HOURS = 'Hours of Operation: Monday through Friday: 7am- 9:30pm Saturday, & Sunday: 7am - 8pm'
const TC_FEATURES = '8 Pickleball Courts, Fully Lighted'

const VENUES = [
  {
    slug: 'deforest-park', importedSlug: null, name: 'DeForest Park', page: 'deforest-park', geo: 'deforest-park',
    courts: 8, dedicated: 8,
    line: 'DeForest Park (6255 DeForest Ave.) - 8 dedicated courts.',
    address: '6255 DeForest Ave', cityZip: null,
    parkQuote: 'Pickleball Courts', hours: 'Park Hours: Dawn to Dusk',
    availability: 'Eight dedicated pickleball courts in the north of the city, the largest dedicated set in Long Beach, stated on the City\'s pickleball page as "DeForest Park (6255 DeForest Ave.) - 8 dedicated courts." Dedicated means pickleball courts, not tennis courts wearing a second set of lines. The park\'s own page lists "Pickleball Courts" among its amenities and gives the park hours as "Dawn to Dusk"; the park is 49.6 acres, most of it the DeForest Wetlands and nature trail, with four lighted tennis courts, two playgrounds and restrooms on the 15 City-owned acres. The City\'s rule for all its park courts applies here: no reservations, first come, first served, and "court signage regarding shared use must be observed". Price, lighting and surface are not stated for the pickleball courts.',
  },
  {
    slug: 'silverado-park', importedSlug: null, name: 'Silverado Park', page: 'silverado-park', geo: 'silverado-park',
    courts: 4, dedicated: 4,
    line: 'Silverado Park (1545 W. 31st St.) - 4 dedicated pickleball courts. Call 562.570.1675.',
    address: '1545 W 31st St', cityZip: null,
    parkQuote: 'Pickleball Courts',
    availability: 'Four dedicated pickleball courts on the west side, stated on the City\'s pickleball page as "Silverado Park (1545 W. 31st St.) - 4 dedicated pickleball courts. Call 562.570.1675." The park\'s own page lists "Pickleball Courts" among a long amenity list - two baseball fields, softball fields, four tennis courts, a gymnasium with a wooden floor renovated in 2004, a pool, a roller hockey court and a community centre - but states no separate hours, price, lighting or surface for the pickleball courts. First come, first served under the City\'s rule for its park courts.',
  },
  {
    slug: 'veterans-park', importedSlug: 'veterans-park-14058', name: 'Veterans Park', page: 'veterans-park', geo: 'veterans-park',
    courts: 12, dedicated: 4,
    line: 'Veterans Park (101 E. 28th St.) - Hybrid location: 8 pickleball courts on 1 tennis court and 4 dedicated pickleball courts.',
    address: '101 E 28th St', cityZip: null,
    availability: 'Twelve pickleball courts, and the twelve is the City\'s own arithmetic: "Hybrid location: 8 pickleball courts on 1 tennis court and 4 dedicated pickleball courts." Eight are lines on a single tennis court, so what you find depends on who arrived first and whether a tennis game is on; four are pickleball courts in their own right. That makes Veterans the largest published pickleball venue in Long Beach by count, and the one with the most ambiguity built into the number. The park is 14.3 acres in central Long Beach with a community recreation centre, a lighted softball field, a lighted baseball field, a lighted soccer field, four basketball courts and two tennis courts on the City\'s history of the site; the park page does not mention the pickleball courts. Price, lighting and surface are not stated.',
  },
  {
    slug: 'junipero-beach', importedSlug: null, name: 'Junipero Beach', page: null, geo: 'junipero-beach',
    courts: 2, dedicated: 2,
    line: 'Junipero Beach (2100 E. Ocean Blvd.) - 2 dedicated pickleball courts on repurposed half basketball court.',
    address: '2100 E Ocean Blvd', cityZip: null,
    availability: 'Two dedicated pickleball courts on the beach at the foot of Junipero Avenue, on what the City describes as a "repurposed half basketball court". The line on the City\'s pickleball page is the only City record of these courts - there is no park page for Junipero Beach in the City\'s directory - and it states the count, the address and the surface\'s history in one breath: "Junipero Beach (2100 E. Ocean Blvd.) - 2 dedicated pickleball courts on repurposed half basketball court." Two courts is a game rather than a rotation. First come, first served. Price, lighting and surface material are not stated.',
  },
  {
    slug: 'el-dorado-park-west', importedSlug: null, name: 'El Dorado Park West', page: 'el-dorado-park-west', geo: 'el-dorado-park-west',
    courts: 3, dedicated: 0,
    line: 'El Dorado Park West (2800 N. Studebaker Rd.) - 3 pickleball courts on a shared sports court.',
    address: '2800 N Studebaker Rd', cityZip: null, parkAddress: '2800 Studebaker Road',
    availability: 'Three pickleball courts on a shared sports court in the 272.5-acre western section of El Dorado Regional Park, home to the Parks, Recreation and Marine Department\'s own offices. The City\'s line reads "El Dorado Park West (2800 N. Studebaker Rd.) - 3 pickleball courts on a shared sports court." The park page says the park has "night-lighted basketball and multi-use courts"; whether the shared sports court the pickleball sits on is one of those multi-use courts is not something the City says, so lighting is recorded as unknown. The same address holds the El Dorado Park Tennis & Pickleball Center, a separate facility with its own page, hours and prices, published here as its own venue. First come, first served. Price and surface are not stated.',
  },
  {
    slug: 'bayshore-park', importedSlug: null, name: 'Bayshore Park', page: null, geo: 'bayshore-park',
    courts: 3, dedicated: 1,
    line: 'Bayshore Park (5415 E. Ocean) - 1 dedicated court, 2 dual-striped.',
    address: '5415 E Ocean', cityZip: null,
    availability: 'Three pickleball courts on the bay at Belmont Shore, in the City\'s own arithmetic: "Bayshore Park (5415 E. Ocean) - 1 dedicated court, 2 dual-striped." One court is pickleball only; two are striped onto another court and shared. The City writes the address without a street type and the Census address file resolves it as 5415 E Ocean Blvd. There is no Bayshore Park page in the City\'s directory - the directory lists the site\'s handball courts, playground and roller hockey rink separately - so the line is the only City record. First come, first served. Price, lighting and surface are not stated.',
  },
  {
    slug: 'marina-vista-park', importedSlug: 'marina-vista-park', name: 'Marina Vista Park', page: 'marina-vista-park', geo: 'marina-vista-park',
    courts: 8, dedicated: 4,
    line: 'Marina Vista Park (Colorado St. & Santiago) - Hybrid location: 4 dedicated pickleball courts and 4 dual-striped courts for either tennis or pickleball.',
    address: '5355 Eliot St', cityZip: null, parkAddress: '5355 Eliot St.',
    availability: 'Eight pickleball courts, four of them dedicated and four dual-striped for either tennis or pickleball, in an 18.2-acre park in the south-east of the city: "Hybrid location: 4 dedicated pickleball courts and 4 dual-striped courts for either tennis or pickleball." The City\'s pickleball page locates the park by its cross streets, "Colorado St. & Santiago"; the park\'s own page gives the street address, "5355 Eliot St.", and that is the address published here. On the dual-striped four, a tennis player who arrived first has the court. First come, first served. Price, lighting and surface are not stated.',
  },
  {
    slug: 'el-dorado-park-tennis-center', importedSlug: 'el-dorado-park-tennis-center', name: 'El Dorado Park Tennis & Pickleball Center', page: 'el-dorado-tennis-center', geo: 'el-dorado-tennis-center',
    courts: 8, dedicated: 0, light: true, tennisCenter: true,
    line: TC_LIST,
    address: '2800 Studebaker Road', cityZip: null,
    availability: 'Eight lit pickleball courts at the City\'s tennis centre inside El Dorado Park, stated twice: "El Dorado Tennis Center offers eight shared-use pickleball courts" on the City\'s pickleball page and "8 Pickleball Courts, Fully Lighted" among the centre\'s own amenities. Shared-use means the courts are tennis courts in pickleball configuration at the times the centre allots to pickleball. This is the one Long Beach venue with a price: "$5 per person for drop-in play (up to three hours), while private pickleball court reservations are $10 per court per hour", with drop-in play "on Tuesday and Thursday mornings from 8 to 11 am, and Friday evenings from 6 to 9pm" as the page stood when read. The centre is open Monday to Friday 7 a.m. to 9:30 p.m. and weekends 7 a.m. to 8 p.m., has "NO LIGHT FEES", and shares its address with El Dorado Park West\'s three park courts, published as a separate venue. Surface is not stated.',
  },
]

const EXCLUDED = [
  {
    name: 'Somerset Park', page: 'somerset-park',
    line: 'Somerset Park (1500 E. Carson) - Dual striping 8 pickleball on 2 tennis courts.',
    parkAddress: '1500 E. Carson St.',
    reasons: [
      'The City writes "1500 E. Carson" on its pickleball page and "1500 E. Carson St." on the park\'s own page, with no city on either, and the Census address geocoder places that address in "Carson city", postcode 90745 - the neighbouring incorporated city that shares the street\'s name. A city page must contain venues in that city (the test that kept Scottsdale Community College off Scottsdale\'s page), and this one does not resolve inside Long Beach.',
      'The count is stated - "Dual striping 8 pickleball on 2 tennis courts" - and the site is a City of Long Beach park on the City\'s own directory. The venue fails on where the resolver puts its address, and the run fails the day the address resolves inside Long Beach, so it is re-read rather than forgotten.',
    ],
  },
  {
    name: 'Billie Jean King Tennis Center', page: 'billie-jean-king-tennis-center',
    line: 'Billie Jean King Tennis Center offers four shared-use pickleball courts',
    pageQuote: TC_FEATURES,
    reasons: [
      'Two City records, two numbers. The City\'s pickleball page says the centre "offers four shared-use pickleball courts"; the centre\'s own page lists "8 Pickleball Courts, Fully Lighted". The rule that decided Saint Paul and Lincoln - the record that states a number publishes - cannot choose between two numbers, and Irvine\'s Los Olivos was refused on exactly this shape. Both statements are asserted so the build fails when the City agrees with itself.',
    ],
  },
  {
    name: 'Whaley Park', page: 'whaley-park',
    line: 'Whaley Park (5620 Atherton St.) - Dual-striped pickleball and volleyball court.',
    reasons: [
      'The City states no number: "Dual-striped pickleball and volleyball court." A court is not a count, and Page Gate 1 requires a stated count.',
    ],
  },
]

/* ---------------------------------------------------------------- */

const snapshotPath = name => `data/sources/long-beach/${name}.html`

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

/* The city-wide statements. */
for (const [needle, what] of [
  [AGGREGATE, 'city-wide aggregate (asserted, not used)'],
  [FIRST_COME, 'first-come rule'],
  [HEADING, 'heading over the park list'],
  [RATES, 'tennis-centre rates'],
]) {
  must('pickleball', 'Long Beach', needle, what)
}

const counties = JSON.parse(
  readFileSync(join(REPO_ROOT, 'data/sources/long-beach-county-census.json'), 'utf8'))

/* ---------------------------------------------------------------- */
/* THE REFUSALS, ASSERTED RATHER THAN REMEMBERED.                    */

for (const e of EXCLUDED) {
  must('pickleball', e.name, e.line, 'line on the pickleball page')
  if (e.parkAddress) must(e.page, e.name, e.parkAddress, 'address on the park page')
  if (e.pageQuote) must(e.page, e.name, e.pageQuote, 'count on the centre\'s own page')
}
{
  const somerset = counties['somerset-park']
  if (somerset?.matched && somerset.place_matches_city) {
    throw new Error('Somerset Park now resolves inside Long Beach. Publish its eight courts on two tennis courts.')
  }
}
/* The dedicated figures the City states, venue by venue, sum to 23 against its "24". */
{
  const dedicatedSum = VENUES.reduce((a, p) => a + p.dedicated, 0)
  if (dedicatedSum === 24) {
    throw new Error('The venue-by-venue dedicated counts now sum to the City\'s 24. Update the note that says they do not.')
  }
}

const identityRegistry = loadIdentity(REPO_ROOT)
const allRows = loadRows().map(r => mapRow(r).venue)
const bySlug = new Map(
  allRows.filter(v => v.city === 'Long Beach' && String(v.state).toUpperCase() === 'CA')
    .map(v => [v.slug, v]))

const overlay = {}
const changes = []

for (const p of VENUES) {
  must('pickleball', p.slug, p.line, 'line on the pickleball page')
  if (p.parkQuote) must(p.page, p.slug, p.parkQuote, 'pickleball in the park\'s amenity list')
  if (p.parkAddress) must(p.page, p.slug, p.parkAddress, 'address on the park page')
  if (p.hours) must(p.page, p.slug, p.hours, 'hours on the park page')
  if (p.tennisCenter) {
    must(p.page, p.slug, TC_FEATURES, 'count in the centre\'s amenity line')
    must(p.page, p.slug, TC_HOURS, 'hours on the centre\'s page')
    must(p.page, p.slug, 'NO LIGHT FEES', 'no-light-fees line')
  }

  const geo = counties[p.geo]
  if (!geo?.matched) throw new Error(`${p.slug}: no address resolver matched its address`)
  if (!geo.place_matches_city) {
    throw new Error(`${p.slug}: the resolver places this at "${geo.place}", not Long Beach.`)
  }
  if (geo.county !== 'Los Angeles') throw new Error(`${p.slug}: resolved to ${geo.county} County, not Los Angeles.`)

  const doc = new SourceDocument({
    url: PAGE, retrieved_at: RETRIEVED_AT, tier: 1, publisher: CITY, format: 'html',
  })
  const docPark = p.page
    ? new SourceDocument({url: `${PARK_BASE}/${p.page}/`, retrieved_at: RETRIEVED_AT, tier: 1, publisher: CITY, format: 'html'})
    : null
  const docCensus = new SourceDocument({
    url: CENSUS_URL, retrieved_at: RETRIEVED_AT, tier: 1, publisher: 'US Census Bureau', format: 'json',
  })

  const shell = {
    slug: p.slug, name: null, city: 'Long Beach', state: 'CA', county: null,
    postal_code: null, street_address: null, latitude: null, longitude: null,
    status: 'pending', source_url: null, date_checked: null, verified_by: null,
    claimed_by_owner: false, claim_date: null,
    rating: null, user_rating: null, review_count: null, claimed_or_verified: null,
    source_sport: 'pickleball',
  }
  for (const f of PUBLISHED_FACT_FIELDS) shell[f] = null
  const imported = p.importedSlug ? bySlug.get(p.importedSlug) : undefined
  const venue = imported ?? shell

  const addressDoc = p.parkAddress ? docPark : doc
  const facts = [
    (docPark ?? doc).fact('name', p.name, {
      evidence: p.tennisCenter
        ? `Named "El Dorado Park Tennis & Pickleball Center" on the centre's own page; the City's pickleball page calls it "El Dorado Tennis Center".`
        : `Named "${p.name}" on the City's pickleball page${p.page ? ' and on the park\'s own page' : ''}.`,
    }),
    doc.fact('total_courts', p.courts, {
      evidence: p.slug === 'veterans-park'
        ? `Quoted from the City's pickleball page: "${p.line}" Twelve is the sum of the City's own two figures, eight on one tennis court and four dedicated.`
        : p.slug === 'bayshore-park'
          ? `Quoted from the City's pickleball page: "${p.line}" Three is the sum of the City's own two figures.`
          : p.slug === 'marina-vista-park'
            ? `Quoted from the City's pickleball page: "${p.line}" Eight is the sum of the City's own two figures, four dedicated and four dual-striped.`
            : p.tennisCenter
              ? `Stated twice by the City: "${TC_LIST}" on its pickleball page, and "${TC_FEATURES}" among the centre's own amenities.`
              : `Quoted from the City's pickleball page: "${p.line}"`,
    }),
    addressDoc.fact('street_address', p.address, {
      evidence: p.parkAddress
        ? (p.slug === 'marina-vista-park'
          ? `"${p.parkAddress}" on the park's own page. The City's pickleball page locates the park by cross streets only, "Colorado St. & Santiago"; the park page's street address is the one published.`
          : `"${p.parkAddress}" on the page's address block; the City's pickleball page writes it "2800 N. Studebaker Rd."`)
        : `From the City's pickleball page: "${p.line}"` +
          (p.slug === 'bayshore-park' ? ' The City writes the address without a street type; the Census address file resolves it as E Ocean Blvd.' : '') +
          (['deforest-park', 'silverado-park', 'veterans-park'].includes(p.slug) ? ' The park\'s own page prints no street address.' : ''),
    }),
    doc.fact('venue_type', 'public_park', {
      evidence: p.tennisCenter
        ? `A City tennis centre inside El Dorado Park, published by the ${CITY} in its park directory and managed for the City under contract; the controlled vocabulary's "racquet_club" is a private membership club, which this is not.`
        : `Published by the ${CITY} among its parks.`,
    }),
    doc.fact('court_availability', p.availability, {
      evidence: `From the City's pickleball page: "${p.line}"` + (p.page ? ` and the park's own page.` : ''),
    }),
    docCensus.fact('county', geo.county, {
      evidence: `${geo.county} County, CA${geo.county_fips ? ` (FIPS ${geo.state_fips}${geo.county_fips})` : ''}. ${geo.basis} The resolver also places it in the incorporated place "${geo.place}", which is what allows it to be published under Long Beach.`,
    }),
    docCensus.fact('postal_code', geo.postal_code, {evidence: geo.basis}),
  ]

  if (p.tennisCenter) {
    facts.push(docPark.fact('light', true, {evidence: `"${TC_FEATURES}" among the centre's own amenities.`}))
    facts.push(doc.fact('fee_type', 'drop_in_fee', {
      evidence: `"${RATES}"`,
    }))
    facts.push(doc.fact('drop_in_fee_usd', 5, {evidence: `"$5 per person for drop-in play (up to three hours)".`}))
    facts.push(doc.fact('pricing_notes',
      'Drop-in play $5 per person for up to three hours; private pickleball court reservations $10 per court per hour. Drop-in pickleball on Tuesday and Thursday mornings 8 to 11 am and Friday evenings 6 to 9 pm when read. No light fees.', {
        evidence: `"${RATES}" "${TC_LIST}" "NO LIGHT FEES" on the centre's page.`,
      }))
    facts.push(docPark.fact('hours_of_operation', 'Monday to Friday 7 a.m. to 9:30 p.m.; Saturday and Sunday 7 a.m. to 8 p.m.', {
      evidence: `"${TC_HOURS}" on the centre's page.`,
    }))
  } else {
    facts.push(doc.fact('play_format', 'open_play', {
      evidence: `The City's rule for its park courts: "${FIRST_COME}"`,
    }))
    if (p.hours) {
      facts.push(docPark.fact('hours_of_operation', 'Dawn to dusk', {evidence: `"${p.hours}" on the park's own page.`}))
    }
  }

  const res = applyFacts(venue, facts)

  overlay[p.slug] = {
    minted: !imported,
    identity: {
      name: p.name, city: 'Long Beach', state: 'CA',
      county: geo.county, postal_code: geo.postal_code ?? null,
      latitude: geo.lat ?? null, longitude: geo.lon ?? null,
      imported_slug: p.importedSlug ?? null,
      canonical_slug: identityRegistry.renames[p.importedSlug]?.canonical ?? p.slug,
    },
    match: {
      source_page: PAGE, quote: p.line,
      basis: imported
        ? (p.slug === 'veterans-park'
          ? 'Matched to the imported veterans-park-14058 row in Long Beach, CA, at the same street address, published under the canonical slug veterans-park (the identity pass dropped the import row id).'
          : p.tennisCenter
            ? 'Matched to the imported el-dorado-park-tennis-center row in Long Beach, CA, at the same street address. El Dorado Park West, at the same address, is published as a separate venue on the Madison Warner Park precedent: this centre has its own page, hours and prices.'
            : `Matched to the imported ${p.importedSlug} row in Long Beach, CA.`)
        : (p.slug === 'deforest-park'
          ? 'Minted from the City\'s pickleball page. The imported dataset holds a deforest-park-pickleball-center row at the same address with the same count; it is left pending rather than published under a name the City does not use.'
          : p.slug === 'bayshore-park'
            ? 'Minted from the City\'s pickleball page. The imported dataset holds bayshore-playground (2 courts) and bayshore (3) rows for this site; both are left pending.'
            : p.slug === 'el-dorado-park-west'
              ? 'No imported row for the park courts. Minted from the City\'s pickleball page. The El Dorado Park Tennis & Pickleball Center at the same address is published as a separate venue on the Madison Warner Park precedent.'
              : 'No imported row for this venue. Minted from the City\'s pickleball page, which states the count and the address.'),
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
const dedicatedCourts = VENUES.reduce((a, p) => a + p.dedicated, 0)
const litCourts = VENUES.filter(p => p.light === true).reduce((a, p) => a + p.courts, 0)

for (const [slug, entry] of Object.entries(overlay)) {
  const {total_courts: t, indoor_courts: i, outdoor_courts: o} = entry.patch
  if (i != null && o != null && t !== i + o) throw new Error(`Rule 13: ${slug} does not sum.`)
}

const METHOD_NOTE =
  'Long Beach states a count and an address on one line per park under "Pickleball Courts at Park Locations:", and says line by line whether a court is dedicated or striped onto tennis - "8 dedicated courts", "Hybrid location: 8 pickleball courts on 1 tennis court and 4 dedicated pickleball courts", "1 dedicated court, 2 dual-striped". Where a line carries two figures the sum is the City\'s own arithmetic. Eight venues publish, 48 courts; the El Dorado Park Tennis & Pickleball Center adds the only price in the city ($5 drop-in, $10 a court an hour to reserve) and the only stated lighting, and shares its address with El Dorado Park West\'s three park courts, published separately on the Madison Warner Park precedent. Three refusals: Somerset Park, whose "1500 E. Carson" the Census places in the neighbouring city of Carson; the Billie Jean King Tennis Center, where the City\'s page says four courts and the centre\'s page says eight; and Whaley Park, a court without a count. The City\'s own sentence "Currently there are 24 dedicated pickleball courts in Long Beach" is asserted and not used - its venue-by-venue dedicated figures sum to 23. Indoor or outdoor, price at the parks, surface and nets are never stated.'

mkdirSync(join(REPO_ROOT, 'data/verified'), {recursive: true})
writeFileSync(join(REPO_ROOT, 'data/verified/long-beach-ca.json'), JSON.stringify({
  city: 'Long Beach', state: 'CA', retrieved_at: RETRIEVED_AT,
  method_note: METHOD_NOTE,
  sources: [
    {url: PAGE, publisher: CITY, tier: 1, format: 'html', snapshot: snapshotPath('pickleball')},
    ...VENUES.filter(p => p.page).map(p => ({
      url: `${PARK_BASE}/${p.page}/`, publisher: CITY, tier: 1, format: 'html', snapshot: snapshotPath(p.page),
    })),
    ...EXCLUDED.filter(e => e.page).map(e => ({
      url: `${PARK_BASE}/${e.page}/`, publisher: CITY, tier: 1, format: 'html', snapshot: snapshotPath(e.page),
    })),
    {url: CENSUS_URL, publisher: 'US Census Bureau', tier: 1, format: 'json', snapshot: 'data/sources/long-beach-county-census.json'},
  ].map((s, i) => ({id: `S${i + 1}`, ...s})),
  totals: {
    venues: VENUES.length, courts: totalCourts,
    outdoor: null, indoor: null,
    lit_courts: litCourts, dedicated_courts: dedicatedCourts,
    free_venues: 0,
  },
  excluded: EXCLUDED.map(e => ({name: e.name, why: e.reasons})),
  venues: overlay,
}, null, 2) + '\n')

const changed = changes.filter(r =>
  r.old_value !== null && r.old_value !== undefined && String(r.old_value) !== String(r.new_value))

writeFileSync(join(REPO_ROOT, 'reports', 'long-beach-conflicts.md'), [
  '# Long Beach verification - one line per park, dedicated and striped counted apart', '',
  `Run ${RETRIEVED_AT}. ${VENUES.length} venues published, ${totalCourts} courts (${dedicatedCourts} dedicated). ${EXCLUDED.length} venues refused.`, '',
  'Long Beach is the third city in California on this site and the first in Los Angeles County.', '',
  '| venue | courts | dedicated | what the City writes | address |',
  '| --- | ---: | ---: | --- | --- |',
  ...VENUES.map(p => `| \`${p.slug}\` | ${p.courts} | ${p.dedicated} | "${p.line}" | ${p.address} |`),
  '',
  '## The City\'s aggregate does not match its own list', '',
  `"${AGGREGATE}" The dedicated figures the City states venue by venue sum to ${dedicatedCourts}. The sentence is`,
  'asserted, not used: a total is not a venue, and this one disagrees with the list beneath it.',
  '',
  '## Two venues at 2800 Studebaker Road', '',
  'El Dorado Park West (three courts on a shared sports court) and the El Dorado Park Tennis & Pickleball Center',
  '(eight lit courts, its own hours and prices, its own page) share one address and publish as two venues, on',
  'the test Madison\'s Warner Park set.',
  '',
  '## Refused', '',
  ...EXCLUDED.flatMap(e => [`**${e.name}** - "${e.line}"`, '', ...e.reasons.map((r, i) => `${i + 1}. ${r}`), '']),
  '## What Long Beach does not say', '',
  '- **indoor or outdoor**, about any venue. Null.',
  '- **price at the parks.** "first-come, first-served" is a play format. Only the tennis centre is priced.',
  '- **lighting**, except "8 Pickleball Courts, Fully Lighted" at the tennis centre. El Dorado Park West\'s',
  '  "night-lighted basketball and multi-use courts" is not tied to the shared sports court the pickleball is on.',
  '- **surface and nets.**',
  '- **street addresses on the DeForest, Silverado and Veterans park pages**; those rest on the pickleball page.',
  '',
  changed.length ? '## Values a source changed' : '_No imported row was overwritten._',
  ...(changed.length ? [
    '', '| venue | field | was | now | outcome |', '| --- | --- | --- | --- | --- |',
    ...changed.map(r => `| \`${r.venue_slug}\` | ${r.field} | ${JSON.stringify(r.old_value)} | ${JSON.stringify(r.new_value)} | ${r.outcome} |`),
  ] : []),
  '',
].join('\n'))

console.log(`\nLong Beach, CA - ${VENUES.length} venues, ${totalCourts} courts (${dedicatedCourts} dedicated), retrieved ${RETRIEVED_AT}`)
for (const p of VENUES) {
  const o = overlay[p.slug]
  console.log(`  ${o.patch.name.padEnd(42)} ${String(o.patch.total_courts).padStart(2)} | ${(p.light === true ? 'lit' : 'lighting not stated').padEnd(19)} | ${o.patch.county} County | ${counties[p.geo].postal_code} | via ${counties[p.geo].resolver}`)
}
console.log(`\n  refused: ${EXCLUDED.map(e => e.name).join(', ')}`)
console.log('\nWrote data/verified/long-beach-ca.json and reports/long-beach-conflicts.md\n')
