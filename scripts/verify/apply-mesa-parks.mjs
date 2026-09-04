#!/usr/bin/env node
/*
  Mesa, AZ verification run - city #14, Arizona's second city and the
  second in Maricopa County after Scottsdale.

  ============================================================
  WHY MESA, AND HOW IT WAS FOUND
  ============================================================

  Mesa sits in the "HTTP 403" bucket in PHASES.md, refused during the runs
  for cities #9 to #12 along with fifteen other cities, on the ground that
  the parks site refused both of our fetchers. It does not refuse them now:
  a bare curl returns 200 from www.mesaaz.gov today.

  That is worth stating precisely, because the obvious explanation is the
  wrong one. Lincoln shipped with scripts/verify/fetch/lincoln.sh, which
  defeats an Akamai 403 by sending a browser's header set, and it would be
  tidy to say that tool reopened Mesa. It did not. Mesa answers a PLAIN
  curl with no special headers at all, and so does Durham, the other city
  retested from that bucket. Whatever refused us in the earlier runs is
  simply not refusing us now. No snapshot below needed a header set, and
  this run ships no fetch script, because Mesa does not need one.

  The consequence is bigger than one city: a 403 recorded against a site is
  a fact about one day, not a property of the operator, and the fourteen
  cities still sitting in that bucket have never been retested.

  ============================================================
  HOW MESA STATES A COURT COUNT
  ============================================================

  Two different ways, and only these two count here.

  1. In prose, on the Mesa Tennis & Pickleball Center's own page:

         "The Mesa Tennis & Pickleball Center (MTPC) is open to the public
          and features 16 lighted tennis courts, 21 lighted pickleball
          courts and 4 sand volleyball courts available for rental."

     Twenty-one is the largest single-venue count in this directory.

  2. In a parenthesis, in the "Reservable Spaces" list on a park page:

         Kleinman Park      "Pickleball Courts (4)"
         Chaparral Park     "Pickleball Court (1 lined court shared with
                             basketball use, bring your own portable net)"

  ============================================================
  THE AMENITY LABEL IS NOT A COUNT
  ============================================================

  Every Mesa park page carries a "Features" list, and on nine of them that
  list includes the words "Pickleball Court". It is a LABEL, printed
  identically whether the park has one court or several, and it is the
  reason five parks are refused here.

  The tell is that the label's own singular and plural carry no
  information. Sheepherders Park and Washington Park print "Pickleball
  Courts" in the reservable list and "Pickleball Court" in Features on the
  same page. Neither states a number anywhere.

  This is the rule already on record for Frisco TX, Lexington KY,
  Jacksonville NC and Milwaukee County: a flag is not a number. Chaparral
  Park publishes on one court not because its label is singular but because
  the City writes "(1 lined court ...)" beside it.

  ============================================================
  THE CENTER IS INSIDE GENE AUTRY PARK
  ============================================================

  Gene Autry Park is refused on two grounds, and the first is identity
  rather than data.

  The City's page for Gene Autry Park prints "4125 E Mckellips Rd" and the
  Center's page prints "4125 E McKellips Rd" - the same address, differing
  only in the capital K. The Center's page links to Gene Autry Park under
  "Additional Resources", and the imported dataset, which knows nothing of
  either page, files the Center under the slug
  "mesa-tennis-center-at-gene-autry-park". Three independent records say
  the Center stands in that park.

  Publishing both would put two venues at one street address. The Center is
  the one that states a pickleball count; the park states none. So the
  Center publishes and the park does not, and the second ground would have
  been enough on its own.

  ============================================================
  THE CENSUS AND THE CITY DISAGREE ABOUT ONE POSTCODE
  ============================================================

  For Chaparral Park the City prints "1635 N Gilbert Road, Mesa, AZ 85213".
  The Census address geocoder matches the same street address and returns
  85203. Both are tier 1 and they cannot both be right.

  The published postal_code is the Census value, which is what every other
  city in this directory uses and what Import Gate I3 checks against. The
  disagreement is not smoothed over: it is written onto the venue page, and
  this run asserts that BOTH statements still say what they say. If the
  City corrects its page, or the Census changes its answer, the build fails
  rather than continuing to publish a contradiction nobody is reading.

  ============================================================
  WHAT IS NOT CLAIMED
  ============================================================

  indoor/outdoor  Mesa never uses either word about any of these courts.
                  Lincoln had an "Outdoor Court Locations" heading to read;
                  Mesa has nothing equivalent, so total_courts publishes and
                  indoor_courts and outdoor_courts stay null. The practical
                  cost is real and is accepted: NO Mesa venue appears on the
                  /indoor/ or /outdoor/ filter pages, and Mesa's city page
                  therefore offers fewer filters than Lincoln's.

  light           TRUE at the Center, which writes "21 lighted pickleball
                  courts". NULL at Kleinman and Chaparral, and this is the
                  closest call in the run. Mesa's Features lists mark
                  lighting by appending it to the amenity - "Basketball
                  Court - Lighted", "Volleyball Courts (sand) - Lighted" -
                  and on both park pages the pickleball entry carries no
                  such suffix, while a lighted amenity sits directly above
                  it. That is a convention, not a statement. Vancouver's
                  Oakbrook Park publishes "No" because the City wrote "The
                  courts do not have lighting"; an unmarked label is not
                  that sentence, and reading it as one would be inferring a
                  fact from a house style.

  surface         Stated nowhere in Mesa.

  fee at parks    Stated nowhere for Kleinman or Chaparral. Neither park
                  page says "free", so fee_type stays null there rather
                  than being promoted from the absence of a price, which is
                  the rule Vancouver set.

  nets            FALSE at Chaparral, which is a stated negative: "bring
                  your own portable net". Not stated at the other two.
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

const CITY = 'City of Mesa Parks, Recreation and Community Facilities'
const BASE = 'https://www.mesaaz.gov/Activities-Culture/Parks-Recreation-and-Community-Facilities'
const PARK_BASE = `${BASE}/Parks-Facilities`
const MTPC_URL = `${BASE}/Recreational-Facilities/Mesa-Tennis-Pickleball-Center`
const CENSUS_URL = 'https://geocoding.geo.census.gov/geocoder/geographies'

const MTPC_SPEC =
  'The Mesa Tennis & Pickleball Center (MTPC) is open to the public and features 16 lighted tennis courts, 21 lighted pickleball courts and 4 sand volleyball courts available for rental.'

const VENUES = [
  {
    slug: 'tennis-center-at-gene-autry-park',
    importedSlug: 'mesa-tennis-center-at-gene-autry-park',
    name: 'Mesa Tennis & Pickleball Center',
    page: 'mtpc', url: MTPC_URL,
    address: '4125 E McKellips Rd', cityZip: '85215',
    courts: 21,
    quote: '21 lighted pickleball courts',
    light: true,
    fee_type: 'reservation_fee',
    pricing_notes:
      'Court rental is $9.00 per court per hour daytime (8 AM-5 PM) and $13.00 per court per hour nighttime (5 PM-9 PM). The City states that "Court fees must be paid inside pro shop before using the facility", so there is no free play here.',
    hours:
      'Open 5:30 a.m. to 11:30 a.m. daily, and again 5:00 p.m. to 10:00 p.m. Monday through Friday. Closed evenings at the weekend.',
    hoursQuote: '05:30 AM',
    restroom: true, pro_shop: true, phone: '480-644-3874',
    availability:
      'Twenty-one lighted pickleball courts, the largest count at any single venue in this directory, alongside sixteen lighted tennis courts and four sand volleyball courts. This is a staffed City facility with a pro shop rather than a park with lines painted on it: courts are reservable online up to two weeks ahead, and the City writes that "Court fees must be paid inside pro shop before using the facility." Play costs $9.00 per court per hour before 5 PM and $13.00 after. The Center stands inside Gene Autry Park and shares its street address, which is why the park itself is not listed separately here. The City does not say whether these courts are indoor or outdoor, so this directory does not say either.',
  },
  {
    slug: 'kleinman-park', importedSlug: 'kleinman-park', name: 'Kleinman Park',
    page: 'kleinman-park', url: `${PARK_BASE}/Kleinman-Park`,
    address: '710 S. Extension Rd.', cityZip: '85210',
    courts: 4,
    quote: 'Pickleball Courts (4)',
    light: null,
    hours: 'Open sunrise to 10 p.m., or as posted.',
    hoursQuote: 'Sunrise to 10 PM or as posted',
    restroom: true,
    availability:
      'Four pickleball courts, which the City counts in its own list of reservable spaces: "Pickleball Courts (4)". Courts here are booked through the Mesa Tennis & Pickleball Center. The park is open sunrise to 10 p.m. and also holds lighted softball fields, three lighted tennis courts, four lighted sand volleyball courts, a lighted basketball court, restrooms and an unpaved walking path. Whether the pickleball courts themselves are lit is not something the City says: it marks lighting by writing it into the amenity name, and every lighted thing in this park carries that mark except the pickleball courts, which carry no mark either way.',
  },
  {
    slug: 'chaparral-park', importedSlug: null, name: 'Chaparral Park',
    page: 'chaparral-park', url: `${PARK_BASE}/Chaparral-Park`,
    address: '1635 N Gilbert Road', cityZip: '85213',
    courts: 1,
    quote: 'Pickleball Court (1 lined court shared with basketball use, bring your own portable net)',
    light: null,
    nets_provided: false,
    hours: 'Open sunrise to 10 p.m.',
    hoursQuote: 'Sunrise - 10 PM',
    availability:
      'One court, and the City is unusually straight about what that means: "Pickleball Court (1 lined court shared with basketball use, bring your own portable net)". So it is lines on a basketball court, it is shared, and no net is provided - bring one. The park is open sunrise to 10 p.m. and also has a lighted basketball court, a BBQ grill, horseshoes, picnic tables, a playground and a non-reservable ramada. One thing to know about the address: the City prints this park at 85213 and the US Census address file places the same street address in 85203. This directory publishes the Census postcode, and records that the two disagree.',
  },
]

/*
  Refused, with the ground stated. Five of the six state no number; Gene
  Autry adds an identity ground that would stand on its own.
*/
const EXCLUDED = [
  {
    name: 'Gene Autry Park', page: 'gene-autry-park', address: '4125 E Mckellips Rd',
    reasons: [
      'It shares a street address with the Mesa Tennis & Pickleball Center, which does publish here. The park page prints "4125 E Mckellips Rd" and the Center\'s page prints "4125 E McKellips Rd" - the same address, differing only in one capital letter. Publishing both would put two venues at one address.',
      'Three independent records place the Center in this park: the shared address, the "Additional Resources" link from the Center\'s page to Gene Autry Park, and the imported dataset\'s own slug for the Center, "mesa-tennis-center-at-gene-autry-park".',
      'Independently of all that, the park page states no pickleball count. Its Features list carries the label "Pickleball Court" and no number, which is the same ground the five parks below are refused on.',
    ],
  },
  {
    name: 'Christopher J. Brady Park', page: 'brady-park', address: '7045 E. Monterey Ave.',
    reasons: [
      'The City states no pickleball count. The page says "Pickleball courts reservable online OR call the main line at 480-644-7529", which is a statement about booking, not a number, and the Features list carries the bare label "Pickleball Court".',
      'The City does publish a per-court weekly calendar PDF for this park, headed "Christopher J. Brady Pickleball Court 01 at Christopher J. Brady Park". Counting how many such PDFs exist would produce a number, and that is a derivation rather than a stated count - the same shape as counting points in a map layer, which this project falsified for Sacramento and refused again for Saint Paul.',
    ],
  },
  {
    name: 'Red Mountain Park', page: 'red-mountain-park', address: '7745 E. Brown Rd',
    reasons: [
      'The City states no pickleball count. It describes the courts - "Pickleball Court - Lines on Basketball court (requires personal net)" - and gives no number. The description tells you the kind of court and what to bring, which is more than most, and it still does not say how many.',
    ],
  },
  {
    name: 'Augusta Ranch Park', page: 'augusta-ranch-park', address: '9455 E Neville Ave',
    reasons: [
      'The City states no pickleball count: "Pickleball Court lines (shared with basketball court, requires personal net)." As at Red Mountain, this describes the courts without counting them.',
    ],
  },
  {
    name: 'Sheepherders Park', page: 'sheepherders-park', address: '2455 E McDowell Rd',
    reasons: [
      'The City states no pickleball count. "Pickleball Courts" appears in the reservable list and "Pickleball Court" in the Features list on the same page, which is the clearest demonstration in this city that the label\'s singular and plural carry no information.',
    ],
  },
  {
    name: 'Washington Park', page: 'washington-park', address: '44 E 5th St',
    reasons: [
      'The City states no pickleball count, in exactly the same shape as Sheepherders Park: "Pickleball Courts" in the reservable list, "Pickleball Court" in Features, no number on the page.',
    ],
  },
]

/* ---------------------------------------------------------------- */

const snapshotPath = name => `data/sources/mesa/${name}.html`

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

/*
  Mesa's ONE way of writing a pickleball count is a parenthesised number
  beside the amenity. A refused park is refused because that shape is
  absent, so the absence is what gets asserted - not a remembered verdict.
  The day Mesa writes "Pickleball Courts (6)" on any of these pages, that
  is a venue this directory should be publishing, and the build stops.
*/
const COUNT_SHAPE = /PickleballCourts?\(\d/i

const mustHaveNoCount = (page, who) => {
  if (COUNT_SHAPE.test(textOf(page))) {
    throw new Error(
      `${who}: the ${page} snapshot NOW states a pickleball count. ` +
      'It was refused for stating none. Re-read the page and publish it.')
  }
}

/* Every refused park must still SAY pickleball, or it left for another reason. */
const mustMentionPickleball = (page, who) => {
  if (!/pickleball/i.test(textOf(page))) {
    throw new Error(`${who}: the ${page} snapshot no longer mentions pickleball at all; the refusal note has expired.`)
  }
}

/* ---------------------------------------------------------------- */
/* THE REFUSALS, ASSERTED RATHER THAN REMEMBERED.                    */

for (const e of EXCLUDED) {
  mustMentionPickleball(e.page, e.name)
  mustHaveNoCount(e.page, e.name)
  must(e.page, e.name, e.address, 'address of the refused venue')
}

/* Gene Autry's identity ground: the shared address, both spellings. */
must('gene-autry-park', 'Gene Autry Park', '4125 E Mckellips Rd', 'address shared with the Center')
must('mtpc', 'Gene Autry Park', '4125 E McKellips Rd', 'address shared with the park')
must('mtpc', 'Gene Autry Park', 'Gene Autry Park', 'link from the Center to the park')

/* The label that is not a count, demonstrated on one page in both numbers. */
must('sheepherders-park', 'Sheepherders Park', 'Pickleball Courts', 'plural reservable label')
must('sheepherders-park', 'Sheepherders Park', 'Pickleball Court', 'singular Features label')

const counties = JSON.parse(
  readFileSync(join(REPO_ROOT, 'data/sources/mesa-county-census.json'), 'utf8'))

/*
  The postcode disagreement at Chaparral Park, asserted from both sides so
  neither can quietly change under a published contradiction.
*/
must('chaparral-park', 'Chaparral Park', '1635 N Gilbert Road, Mesa, AZ 85213', "the City's postcode")
if (counties['chaparral-park']?.postal_code !== '85203') {
  throw new Error(
    'Chaparral Park: the Census no longer returns 85203 for 1635 N Gilbert Rd. ' +
    'The published note says the City and the Census disagree; re-read it.')
}

const identityRegistry = loadIdentity(REPO_ROOT)
const allRows = loadRows().map(r => mapRow(r).venue)
const bySlug = new Map(
  allRows.filter(v => v.city === 'Mesa' && String(v.state).toUpperCase() === 'AZ')
    .map(v => [v.slug, v]))

const overlay = {}
const changes = []

for (const p of VENUES) {
  must(p.page, p.slug, p.quote, 'court count')
  must(p.page, p.slug, p.address, 'street address')
  must(p.page, p.slug, p.hoursQuote, 'hours')

  const geo = counties[p.slug]
  if (!geo?.matched) throw new Error(`${p.slug}: no address resolver matched its address`)
  if (!geo.place_matches_city) {
    throw new Error(`${p.slug}: the resolver places this at "${geo.place}", not Mesa.`)
  }

  const doc = new SourceDocument({
    url: p.url, retrieved_at: RETRIEVED_AT, tier: 1, publisher: CITY, format: 'html',
  })
  const docCensus = new SourceDocument({
    url: CENSUS_URL, retrieved_at: RETRIEVED_AT, tier: 1, publisher: 'US Census Bureau', format: 'json',
  })

  const shell = {
    slug: p.slug, name: null, city: 'Mesa', state: 'AZ', county: null,
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
      evidence: `Named "${p.name}" by the ${CITY} on its own page.`,
    }),
    doc.fact('total_courts', p.courts, {
      evidence: p.slug === 'tennis-center-at-gene-autry-park'
        ? `Quoted from the Center's page: "${MTPC_SPEC}" Twenty-one is the largest single-venue pickleball count in this directory.`
        : `Quoted from the park's own "Reservable Spaces" list, where Mesa writes its counts in a parenthesis: "${p.quote}". Indoor and outdoor are left unverified rather than guessed: Mesa never uses either word about these courts.`,
    }),
    doc.fact('street_address', p.address, {
      evidence: `"${p.address}, Mesa, AZ ${p.cityZip}" is the address in the Location block of the City's page for this venue.`,
    }),
    doc.fact('venue_type', 'public_park', {
      evidence: `Operated by the ${CITY}.` +
        (p.slug === 'tennis-center-at-gene-autry-park'
          ? ' The Center is a staffed City facility standing inside Gene Autry Park, and it shares that park\'s street address.'
          : ''),
    }),
    doc.fact('hours_of_operation', p.hours, {
      evidence: `From the Hours block on the City's page, which reads "${p.hoursQuote}".`,
    }),
    doc.fact('court_availability', p.availability, {
      evidence: `From the City's page for this venue: "${p.quote}".`,
    }),
    docCensus.fact('county', geo.county, {
      evidence: `${geo.county} County, AZ${geo.county_fips ? ` (FIPS ${geo.state_fips}${geo.county_fips})` : ''}. ${geo.basis} The resolver also places it in the incorporated place "${geo.place}", which is what allows it to be published under Mesa.`,
    }),
    docCensus.fact('postal_code', geo.postal_code, {
      evidence: p.slug === 'chaparral-park'
        ? `${geo.basis} The City's own page prints 85213 for this address. The two tier-1 sources disagree; the Census value is published, because that is the resolver Import Gate I3 checks against, and the disagreement is stated on the venue page rather than resolved silently.`
        : geo.basis,
    }),
  ]

  if (p.light === true) {
    facts.push(doc.fact('light', true, {
      evidence: `The City writes "${p.quote}" - the word "lighted" is its own, applied to the pickleball courts specifically, alongside "16 lighted tennis courts".`,
    }))
  }
  if (p.fee_type) {
    facts.push(doc.fact('fee_type', p.fee_type, {
      evidence: 'Courts are rented by the hour and reservable online: "$9.00/court per hour" daytime, "$13.00/court per hour" nighttime. The City states that "Court fees must be paid inside pro shop before using the facility", so no free route to play is published here.',
    }))
    facts.push(doc.fact('pricing_notes', p.pricing_notes, {
      evidence: 'Quoted from the "Court Rental Fees" table on the Center\'s page, under its "Pickleball Fees" heading.',
    }))
  }
  if (p.nets_provided === false) {
    facts.push(doc.fact('nets_provided', false, {
      evidence: `A stated negative, in the City's own parenthesis: "${p.quote}". "Bring your own portable net" is a statement that no net is provided.`,
    }))
  }
  if (p.restroom) {
    facts.push(doc.fact('restroom', true, {
      evidence: 'Listed as "Restrooms" in the Features list on the City\'s page for this venue.',
    }))
  }
  if (p.pro_shop) {
    facts.push(doc.fact('pro_shop', true, {
      evidence: 'The City\'s page refers to the facility\'s pro shop: "Court fees must be paid inside pro shop before using the facility."',
    }))
  }
  if (p.phone) {
    facts.push(doc.fact('phone', p.phone, {
      evidence: 'Published in the Contact block on the Center\'s own page.',
    }))
  }

  const res = applyFacts(venue, facts)

  overlay[p.slug] = {
    minted: !imported,
    identity: {
      name: p.name, city: 'Mesa', state: 'AZ',
      county: geo.county, postal_code: geo.postal_code ?? null,
      latitude: geo.lat ?? null, longitude: geo.lon ?? null,
      imported_slug: p.importedSlug ?? null,
      canonical_slug: identityRegistry.renames[p.importedSlug]?.canonical ?? p.slug,
    },
    match: {
      source_page: p.url, quote: p.quote,
      basis: imported
        ? `Matched to the imported ${p.importedSlug} row in Mesa, AZ` +
          (p.importedSlug !== p.slug
            ? `, published under the canonical slug ${p.slug} (the identity pass dropped the leading "mesa-", which is already in the path).`
            : '.')
        : 'No imported row under this slug. The venue is minted here from the City\'s own park page, which states the count, the address and the hours.',
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
  'Mesa states a pickleball count in exactly two places and this run reads only those two. The Mesa Tennis & Pickleball Center says it in prose - "16 lighted tennis courts, 21 lighted pickleball courts and 4 sand volleyball courts" - and two park pages say it in a parenthesis inside a Reservable Spaces list, "Pickleball Courts (4)" at Kleinman and "Pickleball Court (1 lined court shared with basketball use, bring your own portable net)" at Chaparral. Twenty-one is the largest single-venue count in this directory. Six more Mesa parks carry the words "Pickleball Court" in a Features list with no number anywhere on the page, and none of them publishes: that label is printed identically whether a park has one court or several, and Sheepherders Park prints it in both singular and plural on the same page. Gene Autry Park is refused twice over - it states no count, and it shares a street address with the Center, which stands inside it. Mesa never says whether any of these courts are indoor or outdoor, so no Mesa venue appears on the indoor or outdoor filter pages. Lighting publishes true only at the Center, which uses the word itself; Mesa marks lighting by appending it to an amenity name and does not mark the pickleball courts at Kleinman or Chaparral, but a house style is not a statement and those two stay unverified. Chaparral Park carries the run\'s one source conflict: the City prints postcode 85213 and the Census address file returns 85203 for the same street address. The Census value publishes and the disagreement is printed on the venue page.'

mkdirSync(join(REPO_ROOT, 'data/verified'), {recursive: true})
writeFileSync(join(REPO_ROOT, 'data/verified/mesa-az.json'), JSON.stringify({
  city: 'Mesa', state: 'AZ', retrieved_at: RETRIEVED_AT,
  method_note: METHOD_NOTE,
  sources: [
    {url: MTPC_URL, publisher: CITY, tier: 1, format: 'html', snapshot: snapshotPath('mtpc')},
    ...VENUES.filter(p => p.page !== 'mtpc').map(p => ({
      url: p.url, publisher: CITY, tier: 1, format: 'html', snapshot: snapshotPath(p.page),
    })),
    ...EXCLUDED.map(e => ({
      url: `${PARK_BASE}/${e.page === 'brady-park'
        ? 'Christopher-J.-Brady-Park'
        : e.page.split('-').map(s => s[0].toUpperCase() + s.slice(1)).join('-')}`,
      publisher: CITY, tier: 1, format: 'html', snapshot: snapshotPath(e.page),
    })),
    {url: CENSUS_URL, publisher: 'US Census Bureau', tier: 1, format: 'json', snapshot: 'data/sources/mesa-county-census.json'},
  ].map((s, i) => ({id: `S${i + 1}`, ...s})),
  totals: {
    venues: VENUES.length, courts: totalCourts,
    outdoor: null, indoor: null,
    lighted_courts: VENUES.filter(p => p.light === true).reduce((a, p) => a + p.courts, 0),
  },
  excluded: EXCLUDED.map(e => ({name: e.name, why: e.reasons})),
  venues: overlay,
}, null, 2) + '\n')

const changed = changes.filter(r =>
  r.old_value !== null && r.old_value !== undefined && String(r.old_value) !== String(r.new_value))

writeFileSync(join(REPO_ROOT, 'reports', 'mesa-conflicts.md'), [
  '# Mesa verification - a label that is not a count, and a city that never says outdoor', '',
  `Run ${RETRIEVED_AT}. ${VENUES.length} venues published, ${totalCourts} courts. ${EXCLUDED.length} venues refused.`, '',
  'Mesa was sitting in the PHASES.md "HTTP 403" bucket, refused during the runs for cities #9 to #12.',
  'It does not refuse us now, and not because of Lincoln\'s browser-header fetcher: a BARE curl returns',
  '200 from www.mesaaz.gov today, as it does from Durham, the other city retested from that bucket.',
  'A 403 recorded against a site is a fact about one day. Fourteen cities in that bucket are untested.',
  '',
  '## Published', '',
  '| venue | courts | lit | what the City writes | address |',
  '| --- | ---: | --- | --- | --- |',
  ...VENUES.map(p => `| \`${p.slug}\` | ${p.courts} | ${p.light === true ? 'yes' : 'not stated'} | "${p.quote}" | ${p.address} |`),
  '',
  '## The amenity label is not a count', '',
  'Every Mesa park page carries a Features list, and nine of them include the words "Pickleball Court".',
  'It is a label, printed the same whether a park has one court or six, and it is why five parks below',
  'are refused. Sheepherders Park settles the question on a single page: "Pickleball Courts" in its',
  'reservable list, "Pickleball Court" in its Features list, and no number anywhere on it.',
  '',
  'Chaparral Park publishes one court not because its label is singular, but because the City writes',
  '"(1 lined court shared with basketball use, bring your own portable net)" beside it.',
  '',
  '## The Center is inside Gene Autry Park', '',
  'Three records agree, and none of them knows about the others:', '',
  '- the park page prints `4125 E Mckellips Rd`, the Center\'s page prints `4125 E McKellips Rd`',
  '- the Center\'s page links to Gene Autry Park under "Additional Resources"',
  '- the imported dataset files the Center under `mesa-tennis-center-at-gene-autry-park`',
  '',
  'Publishing both would put two venues at one street address. The Center states a count; the park',
  'does not. So the Center publishes, and the second ground would have been enough on its own.',
  '',
  '## One postcode, two tier-1 answers', '',
  '| source | postcode for 1635 N Gilbert Road |',
  '| --- | --- |',
  '| City of Mesa park page | 85213 |',
  '| US Census address geocoder | 85203 |',
  '',
  'The Census value publishes, because that is the resolver Import Gate I3 checks against. The',
  'disagreement is printed on the venue page, and this run asserts BOTH sides still say what they say -',
  'if either changes, the build fails rather than publishing a contradiction nobody is reading.',
  '',
  '## Refused', '',
  ...EXCLUDED.flatMap(e => [`**${e.name}** - ${e.address}`, '', ...e.reasons.map((r, i) => `${i + 1}. ${r}`), '']),
  '## What Mesa does not say', '',
  '- **indoor or outdoor.** Not once, about any of these courts. `total_courts` publishes and both',
  '  breakdowns stay null, so NO Mesa venue reaches the `/indoor/` or `/outdoor/` filter pages.',
  '- **lighting, at the two parks.** Mesa marks lighting by writing it into the amenity name',
  '  ("Basketball Court - Lighted"). Neither park marks its pickleball courts, and a lighted amenity',
  '  sits directly above them in both lists. That is a house style, not a sentence, and Vancouver\'s',
  '  rule is that only a stated negative publishes a No.',
  '- **surface**, anywhere in the city.',
  '- **a fee at the two parks.** Neither says "free", so `fee_type` stays null rather than being',
  '  promoted from the absence of a price.',
  '',
  changed.length ? '## Values a source changed' : '_No imported row was overwritten._',
  ...(changed.length ? [
    '', '| venue | field | was | now | outcome |', '| --- | --- | --- | --- | --- |',
    ...changed.map(r => `| \`${r.venue_slug}\` | ${r.field} | ${JSON.stringify(r.old_value)} | ${JSON.stringify(r.new_value)} | ${r.outcome} |`),
  ] : []),
  '',
].join('\n'))

console.log(`\nMesa, AZ - ${VENUES.length} venues, ${totalCourts} courts, retrieved ${RETRIEVED_AT}`)
for (const p of VENUES) {
  const o = overlay[p.slug]
  console.log(
    `  ${o.patch.name.padEnd(32)} ${String(o.patch.total_courts).padStart(2)}` +
    ` | ${(p.light === true ? 'lighted' : 'lighting not stated').padEnd(19)}` +
    ` | ${o.patch.county} County | ${o.minted ? 'minted' : 'matched import'}`)
}
console.log(`\n  refused: ${EXCLUDED.map(e => e.name).join(', ')}`)
console.log('  five for stating no count; Gene Autry also shares the Center\'s address.')
console.log('\nWrote data/verified/mesa-az.json and reports/mesa-conflicts.md\n')
