#!/usr/bin/env node
/*
  Vancouver, WA verification run — city #7, Washington's second city, and
  the first venue set in Clark County.

  ============================================================
  WHY VANCOUVER
  ============================================================

  The City of Vancouver runs one pickleball page and states a court count
  for three of the four venues on it, with a street address for each. Two
  of those numbers come with something rarer than the number:

    Oakbrook Community Park   "four dedicated pickleball courts"
                              "Nets and poles are permanently installed."
                              "The courts do not have lighting."
    Firstenburg Community Ctr "six courts open during scheduled play on a
                              wood gymnasium floor"

  "The courts do not have lighting" is a stated NEGATIVE, which is a
  different thing from a silence. Five cities of parks departments have said
  nothing at all about lights, and every one of those venues renders "not
  verified yet" — correctly, because unknown is not unlit. Oakbrook is the
  one City of Vancouver venue that can say no.

  CORRECTED 2026-09-04. This header originally called Oakbrook the first
  stated negative on lighting anywhere in the directory. It was not. Seattle
  shipped a day earlier from an ArcGIS layer carrying a LIGHTED field, and
  that field reads "No" for nineteen of its twenty-four venues — stated,
  sourced and dated. The claim was written by looking at the cities whose
  sources were prose and forgetting the one whose source was a table. What
  is true, and all that was ever true, is that Oakbrook is the only Vancouver
  venue whose lighting is on the record.

  ============================================================
  THE SOURCE CONTRADICTS ITSELF ABOUT AN ADDRESS
  ============================================================

  The pickleball page gives Fisher Basin Community Park the address
  "3103 NE 99th Ave." — which is Oakbrook Community Park's address, printed
  two paragraphs above it. The City's own park page for Fisher Basin gives
  "SE 192nd Ave. Vancouver, WA 98607", in a different quadrant of the city
  and a different postcode.

  Both pages are the City of Vancouver. One of them is wrong, and it is not
  hard to see which: Oakbrook's address is corroborated by its own park page
  (3103 NE 99th Ave, 98662) and matched cleanly by the Census geocoder, so
  the pickleball page has repeated it onto the neighbouring entry.

  Fisher Basin is excluded anyway on a simpler ground — the page states no
  court count for it, only "shared tennis and pickleball courts" — and it
  could not have been published regardless, because "SE 192nd Ave" carries
  no house number and the Census geocoder returns no match for it. Three
  independent reasons, and the run records all three rather than the first
  one that happened to be sufficient. Both snapshots are committed so the
  conflict can be read rather than taken on trust.

  ============================================================
  WHAT IS NOT CLAIMED
  ============================================================

  fee at Oakbrook   The City never calls its park courts free. They almost
                    certainly are. fee_type stays null: Portland is in this
                    directory with a verified `free` precisely because
                    Portland wrote the word down, and Vancouver did not.
  amount of the     "visitors must pay a daily drop-in fee" — the fee is
  drop-in fee       stated to exist and never priced, so fee_type is
                    drop_in_fee and drop_in_fee_usd is null. Knowing that
                    you will be charged is worth publishing; inventing the
                    number is not.
  surface           Stated only at Firstenburg ("wood gymnasium floor").
                    Null at Oakbrook and Marshall.
  lights            FALSE at Oakbrook, because the City says so. Null at
                    the two indoor centres, where the question is not one
                    the page answers.
  restroom          The Oakbrook park page lists a restroom among the
                    park's features, but the committed snapshot of it does
                    not carry the feature list in extractable form, so
                    nothing is published from a thing this run cannot
                    re-read. Null.

  ============================================================
  MARSHALL'S COUNT COMES FROM A SCHEDULING NOTE
  ============================================================

  Firstenburg's six courts are stated in a sentence describing the facility.
  Marshall's four are not: they appear in a note about summer opening hours
  — "The earlier time slot will use all four courts and provide capacity for
  up to 24 players". A facility cannot use all four of its courts unless it
  has four, so the number is sound, but it is a weaker sentence than the
  others and it is quoted in full on the venue page rather than smoothed
  into a bare figure.
*/

import {readFileSync, writeFileSync, mkdirSync} from 'node:fs'
import {join} from 'node:path'
import {SourceDocument} from './provenance.mjs'
import {applyFacts, changelogToRows} from './conflict.mjs'
import {loadRows, REPO_ROOT} from '../lib/load-csv.mjs'
import {PUBLISHED_FACT_FIELDS} from '../../lib/data/verified.mjs'
import {loadIdentity} from '../../lib/data/identity.mjs'
import {mapRow} from '../import/mapper.mjs'

const RETRIEVED_AT = process.env.RETRIEVED_AT ?? '2026-09-03'

const CITY = 'City of Vancouver Parks, Recreation and Cultural Services'
const PAGE = 'https://www.cityofvancouver.us/government/department/parks-recreation-and-cultural-services/recreation-activities/pickleball/'
const OAKBROOK_PAGE = 'https://www.cityofvancouver.us/parks_trails/oakbrook-park/'
const FISHER_PAGE = 'https://www.cityofvancouver.us/parks_trails/fisher-basin-community-park/'
const CENSUS_URL = 'https://geocoding.geo.census.gov/geocoder/geographies'

const DROP_IN_NOTE =
  'Free for community center members. Visitors must pay a daily drop-in fee, which the City does not publish an amount for on this page.'

const VENUES = [
  {
    slug: 'oakbrook-community-park', name: 'Oakbrook Community Park',
    spec: 'Oakbrook Community Park (3103 NE 99th Ave.) has four dedicated pickleball courts that are open daily from 7 a.m. to 10 p.m. These courts are open play for all skill levels and cannot be reserved.',
    extra: 'Nets and poles are permanently installed. The courts do not have lighting.',
    address: '3103 NE 99th Ave',
    courts: 4, where: 'outdoor',
    venueType: 'public_park',
    nets: true,
    /* Stated FALSE. Seattle's dataset states it for nineteen venues too. */
    light: false,
    hours: '7 a.m. to 10 p.m. daily',
    availability: 'Open play for all skill levels; cannot be reserved. First come, first served, with players rotating in using the paddle rack system.',
    surface: null, fee: null,
  },
  {
    slug: 'firstenburg-community-center', name: 'Firstenburg Community Center',
    spec: 'Firstenburg Community Center (700 NE 136th Ave.) offers pickleball Monday-Friday for ages 12+. Play is free for community center members; visitors must pay a daily drop-in fee.',
    extra: 'There are six courts open during scheduled play on a wood gymnasium floor.',
    address: '700 NE 136th Ave',
    courts: 6, where: 'indoor',
    venueType: 'community_center',
    nets: null, light: null, hours: null, availability: null,
    surface: 'wood', fee: 'drop_in_fee',
  },
  {
    slug: 'marshall-community-center', name: 'Marshall Community Center',
    spec: 'Marshall Community Center (1009 E. McLoughlin Blvd.) offers pickleball Monday-Friday for ages 12+. Play is free for community center members; visitors must pay a daily drop-in fee.',
    /* Weaker sentence than the others; see the header. */
    extra: 'The earlier time slot will use all four courts and provide capacity for up to 24 players with a cooler gym environment during summer mornings.',
    address: '1009 E McLoughlin Blvd',
    courts: 4, where: 'indoor',
    venueType: 'community_center',
    nets: null, light: null, hours: null, availability: null,
    surface: null, fee: 'drop_in_fee',
    countFromSchedule: true,
  },
]

/* The venue the City lists and this run refuses. */
const EXCLUDED = {
  name: 'Fisher Basin Community Park',
  reasons: [
    'The pickleball page states no court count for it — only "shared tennis and pickleball courts".',
    'The pickleball page gives its address as "3103 NE 99th Ave.", which is Oakbrook Community Park\'s address, printed two paragraphs above. The City\'s own park page for Fisher Basin says "SE 192nd Ave. Vancouver, WA 98607".',
    'No published address for it carries a house number, and the Census address geocoder returns no match, so Import Gate I1 could not be satisfied even if a count appeared.',
  ],
}

/* ---------------------------------------------------------------- */

const SNAPSHOTS = {
  pickleball: 'data/sources/vancouver/pickleball.html',
  oakbrook: 'data/sources/vancouver/oakbrook-park.html',
  fisher: 'data/sources/vancouver/fisher-basin-park.html',
}

const textOf = rel => readFileSync(join(REPO_ROOT, rel), 'utf8')
  .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&#0?39;|&apos;|&lsquo;|&rsquo;|[‘’]/g, "'")
  .replace(/&quot;|[“”]/g, '"')
  .replace(/&#8211;|&#8212;|[–—]/g, '-')

/* Whitespace-insensitive matching: the CMS breaks runs of text across
   inline elements, so the character sequence is the stable thing. */
const squeeze = s => s.replace(/\s+/g, '')
const FLAT = Object.fromEntries(
  Object.entries(SNAPSHOTS).map(([k, rel]) => [k, squeeze(textOf(rel))]))

const must = (which, who, needle, what) => {
  if (!FLAT[which].includes(squeeze(needle))) {
    throw new Error(
      `${who}: the ${which} snapshot no longer contains the ${what} text "${needle}". ` +
      'Re-read the page before trusting this run.')
  }
}

/*
  THE CONTRADICTION IS ASSERTED, NOT ASSUMED.

  This run's headline finding is that two City pages disagree about one
  park's address. If the City quietly fixes the pickleball page, the
  finding stops being true and the editorial built on it becomes a false
  accusation — so the run fails rather than continuing to publish it.
*/
must('pickleball', 'fisher-basin', 'Fisher Basin Community Park (3103 NE 99th Ave.)', 'wrong-address')
must('fisher', 'fisher-basin', 'SE 192nd Ave. Vancouver, WA 98607', 'correct-address')
must('oakbrook', 'oakbrook-community-park', '3103 NE 99th Ave. Vancouver, WA 98662', 'corroborating address')

const counties = JSON.parse(
  readFileSync(join(REPO_ROOT, 'data/sources/vancouver-county-census.json'), 'utf8'))

if (counties['fisher-basin-community-park']?.matched) {
  throw new Error(
    'Fisher Basin now geocodes. One of the three reasons it is excluded has changed; re-read the source and revisit the exclusion.')
}

const identityRegistry = loadIdentity(REPO_ROOT)
const allRows = loadRows().map(r => mapRow(r).venue)
const bySlug = new Map(
  allRows.filter(v => v.city === 'Vancouver' && String(v.state).toUpperCase() === 'WA')
    .map(v => [v.slug, v]))

const overlay = {}
const changes = []

for (const p of VENUES) {
  must('pickleball', p.slug, p.spec, 'venue and address')
  must('pickleball', p.slug, p.extra, 'court count')

  const geo = counties[p.slug]
  if (!geo?.matched) throw new Error(`${p.slug}: the Census geocoder did not match its address`)
  /*
    Every venue must be inside the city we are publishing it under. Cheap
    here, and the thing that would have stopped a THPRD-style district set
    being filed under one city name it does not all belong to.
  */
  if (geo.place !== 'Vancouver city') {
    throw new Error(`${p.slug}: Census places this at "${geo.place}", not Vancouver city.`)
  }

  const doc = new SourceDocument({
    url: PAGE, retrieved_at: RETRIEVED_AT, tier: 1, publisher: CITY, format: 'html',
  })
  const docPark = new SourceDocument({
    url: OAKBROOK_PAGE, retrieved_at: RETRIEVED_AT, tier: 1, publisher: CITY, format: 'html',
  })
  const docCensus = new SourceDocument({
    url: CENSUS_URL, retrieved_at: RETRIEVED_AT, tier: 1, publisher: 'US Census Bureau', format: 'json',
  })

  const shell = {
    slug: p.slug, name: null, city: 'Vancouver', state: 'WA', county: null,
    postal_code: null, street_address: null, latitude: null, longitude: null,
    status: 'pending', source_url: null, date_checked: null, verified_by: null,
    claimed_by_owner: false, claim_date: null,
    rating: null, user_rating: null, review_count: null, claimed_or_verified: null,
    source_sport: 'pickleball',
  }
  for (const f of PUBLISHED_FACT_FIELDS) shell[f] = null
  const venue = bySlug.get(p.slug) ?? shell

  const quoted = `Quoted from the City of Vancouver's pickleball page: "${p.extra}"`

  const facts = [
    doc.fact('name', p.name, {
      evidence: `Named "${p.name}" by the ${CITY} on its pickleball page.`,
    }),
    doc.fact('total_courts', p.courts, {
      evidence: p.countFromSchedule
        ? `${quoted}. This is a note about summer opening hours rather than a description of the facility: a centre cannot use all four of its courts unless it has four, so the number is sound, but the weaker sentence is quoted in full rather than reduced to a figure.`
        : `${quoted}.`,
    }),
    doc.fact(p.where === 'outdoor' ? 'outdoor_courts' : 'indoor_courts', p.courts, {
      evidence: `${quoted}. Listed under the page's "${p.where === 'outdoor' ? 'Outdoor' : 'Indoor'}" heading. The opposite count is left unverified rather than set to zero.`,
    }),
    p.slug === 'oakbrook-community-park'
      ? docPark.fact('street_address', p.address, {
        evidence: `"${p.address}" is given on the pickleball page and corroborated by the park's own page, which prints "3103 NE 99th Ave. Vancouver, WA 98662". The corroboration matters here: the same pickleball page repeats this address onto Fisher Basin Community Park, which is a different park in a different part of the city.`,
      })
      : doc.fact('street_address', p.address, {
        evidence: `The address the City prints beside the venue name: "${p.spec.split(') ')[0]})".`,
      }),
    doc.fact('venue_type', p.venueType, {
      evidence: p.venueType === 'public_park'
        ? `Published by the ${CITY} among its parks.`
        : `The City names this a community center and runs its pickleball as a scheduled indoor programme.`,
    }),
    docCensus.fact('county', geo.county, {
      evidence: `${geo.county} County, WA (FIPS ${geo.state_fips}${geo.county_fips}). ${geo.basis} The geocoder also places it in the incorporated place "${geo.place}", which is what allows it to be published under Vancouver rather than an unincorporated area with a Vancouver postal address.`,
    }),
    docCensus.fact('postal_code', geo.postal_code, {evidence: geo.basis}),
  ]

  if (p.nets !== null) {
    facts.push(doc.fact('nets_provided', p.nets, {
      evidence: `${quoted}. "Nets and poles are permanently installed" is a statement that you need bring nothing.`,
    }))
  }
  if (p.light === false) {
    facts.push(doc.fact('light', false, {
      evidence: `${quoted}. The City states this outright — "The courts do not have lighting" — which is why this reads "No" rather than "not verified yet". Seattle's parks dataset answers the same question in a LIGHTED field for all twenty-four of its venues; Vancouver is unusual for answering it in a sentence, and this is the only Vancouver venue where the answer is on the record.`,
    }))
  }
  if (p.surface) {
    facts.push(doc.fact('surface', p.surface, {
      evidence: `${quoted}. A gymnasium floor is a material, not a category.`,
    }))
  }
  if (p.fee === 'drop_in_fee') {
    facts.push(doc.fact('fee_type', 'drop_in_fee', {
      evidence: `From the City's page: "${p.spec}". Two routes exist — free for members, a daily fee for visitors — and under the O4 precedence rule the route open to a member of the public is the one recorded. drop_in_fee_usd is left null because the City states that a fee is charged and never states what it is.`,
    }))
    facts.push(doc.fact('pricing_notes', DROP_IN_NOTE, {
      evidence: `From the City's page: "${p.spec}".`,
    }))
  }
  if (p.hours) {
    facts.push(doc.fact('hours_of_operation', p.hours, {
      evidence: `From the City's page: "${p.spec}".`,
    }))
  }
  if (p.availability) {
    facts.push(doc.fact('court_availability', p.availability, {
      evidence: `From the City's page: "${p.spec}" and, for all its outdoor courts, "City of Vancouver courts are first come, first served" and "All players may rotate in using the paddle rack system."`,
    }))
  }

  const res = applyFacts(venue, facts)

  overlay[p.slug] = {
    minted: !bySlug.has(p.slug),
    identity: {
      name: p.name, city: 'Vancouver', state: 'WA',
      county: geo.county, postal_code: geo.postal_code ?? null,
      latitude: geo.lat ?? null, longitude: geo.lon ?? null,
      imported_slug: bySlug.has(p.slug) ? p.slug : null,
      canonical_slug: identityRegistry.renames[p.slug]?.canonical ?? p.slug,
    },
    match: {
      source_page: PAGE, quote: p.extra,
      basis: bySlug.has(p.slug)
        ? `Matched to the imported ${p.slug} row in Vancouver, WA.`
        : `No imported row. Minted from the ${CITY} pickleball page, which states the count and the street address.`,
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
const outdoorCourts = VENUES.filter(p => p.where === 'outdoor').reduce((a, p) => a + p.courts, 0)
const indoorCourts = VENUES.filter(p => p.where === 'indoor').reduce((a, p) => a + p.courts, 0)
if (outdoorCourts + indoorCourts !== totalCourts) {
  throw new Error('Rule 13: the indoor and outdoor courts do not sum to the total.')
}

mkdirSync(join(REPO_ROOT, 'data/verified'), {recursive: true})
writeFileSync(join(REPO_ROOT, 'data/verified/vancouver-wa.json'), JSON.stringify({
  city: 'Vancouver', state: 'WA', retrieved_at: RETRIEVED_AT,
  method_note:
    'Court counts, addresses and attributes are STATED by the City of Vancouver on one pickleball page, and this run asserts the exact sentence is still present in the committed snapshot before publishing anything read from it. Oakbrook Community Park is the only Vancouver venue whose lighting is on the record — "The courts do not have lighting" — so it reads No rather than "not verified yet"; Seattle\'s ArcGIS layer states the same answer in a field for nineteen of its own venues, and an earlier version of this note wrongly called Oakbrook the first anywhere. Fisher Basin Community Park is listed by the City and excluded here for three independent reasons, chief among them that the pickleball page gives it Oakbrook\'s address while the City\'s own park page for it gives a different street and postcode; both snapshots are committed and the run asserts the contradiction still exists rather than assuming it. No fee is claimed for the park courts: the City never calls them free, and this directory does not promote an assumption to a fact.',
  sources: [
    {id: 'S1', url: PAGE, publisher: CITY, tier: 1, format: 'html', snapshot: SNAPSHOTS.pickleball},
    {id: 'S2', url: OAKBROOK_PAGE, publisher: CITY, tier: 1, format: 'html', snapshot: SNAPSHOTS.oakbrook},
    {id: 'S3', url: FISHER_PAGE, publisher: CITY, tier: 1, format: 'html', snapshot: SNAPSHOTS.fisher},
    {id: 'S4', url: CENSUS_URL, publisher: 'US Census Bureau', tier: 1, format: 'json', snapshot: 'data/sources/vancouver-county-census.json'},
  ],
  totals: {venues: VENUES.length, courts: totalCourts, outdoor: outdoorCourts, indoor: indoorCourts},
  excluded: [{name: EXCLUDED.name, why: EXCLUDED.reasons}],
  venues: overlay,
}, null, 2) + '\n')

const changed = changes.filter(r =>
  r.old_value !== null && r.old_value !== undefined && String(r.old_value) !== String(r.new_value))

writeFileSync(join(REPO_ROOT, 'reports', 'vancouver-conflicts.md'), [
  '# Vancouver verification - one stated negative, and one source that contradicts itself', '',
  `Run ${RETRIEVED_AT}. ${VENUES.length} venues published, ${totalCourts} courts ` +
  `(${outdoorCourts} outdoor, ${indoorCourts} indoor). 1 venue excluded.`, '',
  '| venue | courts | where | cost | quoted from the City |',
  '| --- | --- | --- | --- | --- |',
  ...VENUES.map(p => `| \`${p.slug}\` | ${p.courts} | ${p.where} | ${p.fee ?? 'not stated'} | "${p.extra}" |`),
  '',
  '## The address conflict', '',
  'Two City of Vancouver pages disagree about where Fisher Basin Community Park is.', '',
  '| page | address it gives for Fisher Basin |',
  '| --- | --- |',
  `| pickleball page | \`3103 NE 99th Ave.\` — which is **Oakbrook Community Park\'s** address, printed two paragraphs above |`,
  '| Fisher Basin park page | `SE 192nd Ave. Vancouver, WA 98607` |',
  '',
  'Oakbrook\'s address is corroborated by its own park page (`3103 NE 99th Ave. Vancouver, WA 98662`)',
  'and matched cleanly by the Census geocoder, so the pickleball page has copied it onto the next entry.',
  'The run asserts both sentences are still present, so if the City fixes the page this report fails',
  'rather than continuing to make the accusation.',
  '',
  '## Excluded', '',
  `**${EXCLUDED.name}** — three independent reasons:`, '',
  ...EXCLUDED.reasons.map((r, i) => `${i + 1}. ${r}`),
  '',
  '## A stated negative, and a correction to what this file used to claim', '',
  'Oakbrook Community Park: "The courts do not have lighting." The other two Vancouver venues have',
  '`light` as null, because the City says nothing either way about an indoor room. Unknown is not',
  'unlit, and here we can say unlit and mean it.',
  '',
  'This section originally called it the FIRST stated negative on lighting in the directory. It was',
  'not, and the error is worth leaving on the record. Seattle shipped a day earlier from an ArcGIS',
  'layer with a LIGHTED field, and that field reads "No" for nineteen of its twenty-four venues -',
  'stated, sourced and dated. The claim came from reading the cities whose sources are prose and',
  'forgetting the one whose source is a table. Corrected 2026-09-04, while publishing Bellevue.',
  '',
  changed.length ? '## Values a source changed' : '_No imported row was overwritten: none of these venues was in the import._',
  ...(changed.length ? [
    '', '| venue | field | was | now | outcome |', '| --- | --- | --- | --- | --- |',
    ...changed.map(r => `| \`${r.venue_slug}\` | ${r.field} | ${JSON.stringify(r.old_value)} | ${JSON.stringify(r.new_value)} | ${r.outcome} |`),
  ] : []),
  '',
].join('\n'))

console.log(`\nVancouver, WA - ${VENUES.length} venues, ${totalCourts} courts, retrieved ${RETRIEVED_AT}`)
for (const p of VENUES) {
  const o = overlay[p.slug]
  console.log(
    `  ${o.patch.name.padEnd(30)} ${String(o.patch.total_courts).padStart(2)} ${p.where.padEnd(8)}` +
    ` | ${String(o.patch.fee_type ?? 'fee not stated').padEnd(14)}` +
    ` | lights ${String(o.patch.light ?? 'not stated').padEnd(11)}` +
    ` | ${o.patch.county} County`)
}
console.log(`\n  excluded: ${EXCLUDED.name} - no court count, and the City's own two pages`)
console.log("            disagree about its address (it is given Oakbrook's).")
console.log('\nWrote data/verified/vancouver-wa.json and reports/vancouver-conflicts.md\n')
