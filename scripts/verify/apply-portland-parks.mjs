#!/usr/bin/env node
/*
  Portland, OR verification run — city #6, and the first outside Washington
  and North Carolina.

  ============================================================
  WHY PORTLAND
  ============================================================

  Same criterion as every city since Sacramento was withdrawn: the operator
  STATES the court count. Portland Parks & Recreation states it, and then
  states considerably more than that. One page — /parks/recreation/pickleball
  — gives, for every venue it lists, a line of this shape:

    Columbia Park | 4503 N Lombard St., Portland, OR 97203
    8 Outdoor hard courts, free, permanent lines, bring your own net.
    Amenities: restrooms and water.

  Count, full postal address, indoor/outdoor, surface, cost, whether the
  lines are permanent, whether you have to bring a net, and what else is
  there. That is the richest municipal source this directory has found. It
  is the first one that lets us publish a fee at all: five cities in, every
  fee_type and every drop_in_fee_usd in data/verified was still null, and
  the site has been saying "we have not claimed one either way" about cost
  on every page because nobody had stated one.

  ============================================================
  WHAT THE PAGE STATES THAT WE STILL DO NOT PUBLISH
  ============================================================

  SURFACE, at nine of eleven venues. The page says "hard courts", and the
  import vocabulary REFUSES "hard" — asphalt, concrete and acrylic are all
  hard, so the word names a category, not a material (scripts/import/
  vocab.mjs, SURFACE_REFUSED). It would have been easy to write "hard"
  through as a verified surface because a tier-1 source said it. The
  vocabulary exists precisely to stop a sourced-but-empty word becoming a
  fact, and it is applied here against our own interest. Two venues survive
  it: Pier Park says "concrete", Southwest and St. Johns say "wood".

  "PERMANENT LINES", stated at nine venues, has no field. It is a real and
  useful fact — it is the difference between a court you can play on and a
  tennis court someone has taped — and inventing a column for it in a
  verification run is the wrong place to do it. It is left unrecorded
  rather than crammed into amenities, and noted here so the day the schema
  gains a `dedicated_lines` field, the source is already snapshotted.

  LIGHTS, nowhere. The page says nothing about lighting at any of the
  eleven, so light is null at all eleven — not false. Several of these
  parks certainly have lit courts. A belief is not a source.

  ============================================================
  TWO VENUES ARE LISTED TWICE, AND THE SECOND LISTING IS READ NARROWLY
  ============================================================

  Southwest Community Center and St. Johns Community Center appear under
  "Indoor Courts" with a court count and a drop-in price, and again under
  "Registered Activities" with "Indoor wood courts, permanent lines, nets
  provided. Amenities: restrooms and water."

  From the second listing this run takes SURFACE and RESTROOMS, which are
  properties of the building and true whichever door you came through, and
  refuses NETS PROVIDED, which is a statement about what that registered
  programme supplies. A gym almost certainly puts the same nets up for
  drop-in. Almost certainly is the word that got Sacramento withdrawn, so
  nets_provided stays null at all four community centres.

  ============================================================
  PORTLAND TENNIS CENTER IS PUBLISHED, SEASONALITY AND ALL
  ============================================================

  Sixteen courts, the largest single venue in the directory, and pickleball
  there runs as a registered summer programme: "Available from mid June
  until early September." The courts and their permanent lines are not
  seasonal; the access is. Rather than drop it or publish it as though it
  were open today, court_availability says so in the venue's own terms and
  the city page carries it. Hiding a stated sixteen courts would be its own
  kind of inaccuracy.

  ============================================================
  ASSERTION METHOD
  ============================================================

  Same as Cary: every number below is quoted, and the run refuses to publish
  a number whose sentence it can no longer find in the snapshot. The
  comparison strips ALL whitespace from both sides before matching, because
  portland.gov breaks words across inline elements — "8 Outdoor" arrives as
  "8 O utdoor" and "45th Ave" as "45 th Ave" once tags come out. Matching on
  the character sequence rather than the spacing is what makes the assertion
  survive markup without weakening into a fuzzy search.
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

const PPR = 'Portland Parks & Recreation'
const PAGE = 'https://www.portland.gov/parks/recreation/pickleball'
const CENSUS_URL = 'https://geocoding.geo.census.gov/geocoder/geographies'

const DAWN_TO_DUSK = 'Dawn to dusk'
const FCFS = 'First come, first served. Limit play to 60 minutes when courts are in demand.'
const DROP_IN_NOTE = '$6 for adults, $5 for seniors, per drop-in session.'

/*
  Every venue, with the sentence each fact is read out of. `line` identifies
  the venue and carries its address; `spec` carries the count and the
  attributes. Both are asserted against the snapshot before anything is
  published.
*/
const VENUES = [
  /* ---- Outdoor courts ------------------------------------------- */
  {
    slug: 'columbia-park', name: 'Columbia Park',
    line: 'Columbia Park | 4503 N Lombard St., Portland, OR 97203',
    spec: '8 Outdoor hard courts, free, permanent lines, bring your own net. Amenities: restrooms and water.',
    address: '4503 N Lombard St',
    courts: 8, where: 'outdoor', fee: 'free', nets: false,
    surface: null, surfaceWord: 'hard',
    restroom: true, amenities: ['Restrooms', 'Drinking water'],
    venueType: 'public_park',
  },
  {
    slug: 'pier-park', name: 'Pier Park',
    line: 'Pier Park | 10325 N Lombard St., Portland OR 97203',
    spec: '4 Outdoor concrete courts, free, permanent lines, bring your own net. Amenities: restrooms.',
    address: '10325 N Lombard St',
    courts: 4, where: 'outdoor', fee: 'free', nets: false,
    /* The only outdoor venue that names a material rather than a category. */
    surface: 'concrete', surfaceWord: 'concrete',
    restroom: true, amenities: ['Restrooms'],
    venueType: 'public_park',
  },
  {
    slug: 'sellwood-park', name: 'Sellwood Park',
    line: 'Sellwood Park | 7987 SE Grand Ave., Portland, OR 97202',
    spec: '8 Outdoor hard courts, free, permanent lines, bring your own net. Amenities: restrooms and water.',
    address: '7987 SE Grand Ave',
    courts: 8, where: 'outdoor', fee: 'free', nets: false,
    surface: null, surfaceWord: 'hard',
    restroom: true, amenities: ['Restrooms', 'Drinking water'],
    venueType: 'public_park',
  },
  {
    slug: 'laurelhurst-park', name: 'Laurelhurst Park',
    line: 'Laurelhurst Park | 3789 SE Oak St., Portland, OR 97214',
    spec: "2 Outdoor 'pickleball only' hard courts, free, permanent lines, nets included. Amenities: restrooms and water.",
    address: '3789 SE Oak St',
    courts: 2, where: 'outdoor', fee: 'free', nets: true,
    surface: null, surfaceWord: 'hard',
    restroom: true, amenities: ['Restrooms', 'Drinking water'],
    venueType: 'public_park', dedicated: true,
  },
  {
    slug: 'gabriel-park', name: 'Gabriel Park',
    line: 'Gabriel Park | 4508 SW Nevada St., Portland, OR 97219',
    spec: "6 Outdoor 'pickleball only' hard courts, free, permanent lines, nets included. Amenities: restrooms and water.",
    address: '4508 SW Nevada St',
    courts: 6, where: 'outdoor', fee: 'free', nets: true,
    surface: null, surfaceWord: 'hard',
    restroom: true, amenities: ['Restrooms', 'Drinking water'],
    venueType: 'public_park', dedicated: true,
  },
  {
    slug: 'hillside-park', name: 'Hillside Park',
    line: 'Hillside Park | 653 NW Culpepper Terrace Portland, OR 97210',
    spec: "1 outdoor 'pickleball only' hard court, free, bring your own net.",
    address: '653 NW Culpepper Terrace',
    courts: 1, where: 'outdoor', fee: 'free', nets: false,
    surface: null, surfaceWord: 'hard',
    /* The only outdoor entry with no "Amenities:" clause. Null, not false. */
    restroom: null, amenities: null,
    venueType: 'public_park', dedicated: true,
  },

  /* ---- Indoor courts -------------------------------------------- */
  {
    slug: 'east-portland-community-center', name: 'East Portland Community Center',
    line: 'East Portland Community Center | 740 SE 106th Ave., Portland, OR 97216',
    spec: '4 courts, $6 for adults/$5 for seniors',
    address: '740 SE 106th Ave',
    courts: 4, where: 'indoor', fee: 'drop_in_fee', dropIn: 6, nets: null,
    surface: null, restroom: null, amenities: null,
    venueType: 'community_center',
  },
  {
    slug: 'southwest-community-center', name: 'Southwest Community Center',
    line: 'Southwest Community Center | 6820 SW 45th Ave., Portland, OR 97219',
    spec: '5 courts, $6 for adults/$5 for seniors',
    address: '6820 SW 45th Ave',
    courts: 5, where: 'indoor', fee: 'drop_in_fee', dropIn: 6, nets: null,
    /* From the venue's second listing. See the header: building facts only. */
    secondListing: 'Southwest Community Center | 6820 SW 45th Ave., Portland, OR 97219',
    secondSpec: 'Indoor wood courts, permanent lines, nets provided. Registration is required. No court reservations. Amenities: restrooms and water.',
    surface: 'wood', restroom: true, amenities: ['Restrooms', 'Drinking water'],
    venueType: 'community_center',
  },
  {
    slug: 'st-johns-community-center', name: 'St. Johns Community Center',
    line: 'St. Johns Community Center | 8427 N Central St., Portland, OR 97203',
    spec: '2 courts, $6/Adult and $5 for seniors',
    address: '8427 N Central St',
    courts: 2, where: 'indoor', fee: 'drop_in_fee', dropIn: 6, nets: null,
    secondListing: 'St. Johns Community Center | 8427 N Central St., Portland, OR 97203',
    secondSpec: 'Indoor wood courts, permanent lines, nets provided. Registration is required. No court reservations. Amenities: restrooms and water.',
    surface: 'wood', restroom: true, amenities: ['Restrooms', 'Drinking water'],
    venueType: 'community_center',
  },
  {
    slug: 'montavilla-community-center', name: 'Montavilla Community Center',
    line: 'Montavilla Community Center | 8219 NE Glisan St., Portland, OR 97220',
    spec: '3 courts, $6 for adults/$5 for seniors',
    address: '8219 NE Glisan St',
    courts: 3, where: 'indoor', fee: 'drop_in_fee', dropIn: 6, nets: null,
    surface: null, restroom: null, amenities: null,
    venueType: 'community_center',
  },

  /* ---- Registered activities ------------------------------------ */
  {
    slug: 'portland-tennis-center', name: 'Portland Tennis Center',
    line: 'Portland Tennis Center | 324 NE 12th Ave., Portland, OR 97232',
    spec: '16 outdoor hard courts, permanent lines, nets provided. Available from mid June until early September.',
    address: '324 NE 12th Ave',
    courts: 16, where: 'outdoor', nets: true,
    surface: null, surfaceWord: 'hard',
    restroom: true, amenities: ['Restrooms', 'Drinking water'],
    /*
      No fee is stated. Registration runs through ActiveNet, which prices
      per activity, and the page names no figure — so fee_type stays null
      rather than being guessed from the fact that registration exists.

      venue_type is null too. The vocabulary offers public_park (it is not
      one), racquet_club (it is municipal, not a club) and community_center
      (it is not). None of them is true, and the nearest wrong answer is
      still a wrong answer.
    */
    fee: null, venueType: null,
    seasonal: 'Pickleball here runs as a registered summer programme, mid June to early September. Registration required; no court reservations.',
  },
]

/* ---------------------------------------------------------------- */

/*
  Strip tags, decode the handful of entities the page uses, and normalise
  the curly quotation marks around 'pickleball only'. Whitespace is left
  alone here and removed at comparison time.
*/
const SNAPSHOT = 'data/sources/portland/pickleball.html'
const rawHtml = readFileSync(join(REPO_ROOT, SNAPSHOT), 'utf8')
const pageText = rawHtml
  .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&#0?39;|&apos;|&lsquo;|&rsquo;|[‘’]/g, "'")
  .replace(/&quot;|[“”]/g, '"')
  .replace(/&#8211;|[–—]/g, '-')

const squeeze = s => s.replace(/\s+/g, '')
const flatPage = squeeze(pageText)

const must = (slug, needle, what) => {
  if (!flatPage.includes(squeeze(needle))) {
    throw new Error(
      `${slug}: the snapshot no longer contains the ${what} text "${needle}". ` +
      `Re-read ${PAGE} before trusting this run.`)
  }
}

const counties = JSON.parse(
  readFileSync(join(REPO_ROOT, 'data/sources/portland-county-census.json'), 'utf8'))

const identityRegistry = loadIdentity(REPO_ROOT)
const allRows = loadRows().map(r => mapRow(r).venue)
/* Scoped to this city: a slug is only unique inside one city. */
const bySlug = new Map(
  allRows.filter(v => v.city === 'Portland' && String(v.state).toUpperCase() === 'OR')
    .map(v => [v.slug, v]))

const overlay = {}
const changes = []

for (const p of VENUES) {
  must(p.slug, p.line, 'venue and address')
  must(p.slug, p.spec, 'court count')
  if (p.secondSpec) {
    must(p.slug, p.secondListing, 'second-listing venue')
    must(p.slug, p.secondSpec, 'second-listing surface and amenities')
  }

  const county = counties[p.slug]
  if (!county) throw new Error(`No county lookup for ${p.slug}`)
  if (!county.matched) throw new Error(`${p.slug}: the Census geocoder did not match its address`)

  const doc = new SourceDocument({
    url: PAGE, retrieved_at: RETRIEVED_AT, tier: 1, publisher: PPR, format: 'html',
  })
  const docCensus = new SourceDocument({
    url: CENSUS_URL, retrieved_at: RETRIEVED_AT, tier: 1, publisher: 'US Census Bureau', format: 'json',
  })

  const shell = {
    slug: p.slug, name: null, city: 'Portland', state: 'OR', county: null,
    postal_code: null, street_address: null, latitude: null, longitude: null,
    status: 'pending', source_url: null, date_checked: null, verified_by: null,
    claimed_by_owner: false, claim_date: null,
    rating: null, user_rating: null, review_count: null, claimed_or_verified: null,
    source_sport: 'pickleball',
  }
  for (const f of PUBLISHED_FACT_FIELDS) shell[f] = null
  const venue = bySlug.get(p.slug) ?? shell

  const quoted = `Quoted from ${PPR}'s pickleball page: "${p.spec}"`

  const facts = [
    doc.fact('name', p.name, {
      evidence: `Listed by ${PPR} as "${p.name}" on its pickleball page.`,
    }),
    doc.fact('total_courts', p.courts, {evidence: `${quoted}.`}),
    doc.fact('street_address', p.address, {
      evidence: `The address printed beside the venue name: "${p.line}".`,
    }),
    docCensus.fact('county', county.county, {
      evidence: `${county.county} County, OR (FIPS ${county.state_fips}${county.county_fips}). ${county.basis}`,
    }),
  ]

  /*
    Indoor and outdoor are STATED here, as section headings the venue sits
    under and as the word in its own line — unlike Cary, where the setting
    had to be read. The opposite count is still left null rather than set
    to zero: the page lists where pickleball IS, and says nothing about
    whether a park also has an indoor court nobody plays pickleball on.
  */
  if (p.where === 'outdoor') {
    facts.push(doc.fact('outdoor_courts', p.courts, {
      evidence: `${quoted}. Listed under the page's "Outdoor courts" heading. indoor_courts is left unverified rather than set to zero.`,
    }))
  } else {
    facts.push(doc.fact('indoor_courts', p.courts, {
      evidence: `${quoted}. Listed under the page's "Indoor Courts" heading. outdoor_courts is left unverified rather than set to zero.`,
    }))
  }

  if (p.venueType) {
    facts.push(doc.fact('venue_type', p.venueType, {
      evidence: p.venueType === 'public_park'
        ? `Published by ${PPR} among its parks.`
        : `${PPR} names this a community center.`,
    }))
  }

  /*
    ACCESS_TYPE IS DELIBERATELY NOT WRITTEN HERE, AND THE FIRST DRAFT OF
    THIS RUN GOT IT WRONG.

    Portland says enough to fill it — "The outdoor courts are available on
    a first-come, first-served basis" — and this run originally set
    access_type to 'public' on ten of the eleven venues. Two reasons it
    does not any more.

    Decision O1 is open: access_type drives an indexable filter page and
    has no signed-off controlled vocabulary, so writing it is writing to a
    filtered field whose values nobody has agreed. And it buys nothing a
    reader sees — access_type appears in no fact panel, no table and no
    schema node. Its only consumer is the filter matcher, where its one
    effect was to make the site advertise a /public/ page that filterView()
    refuses to build.

    That link is fixed properly in lib/page/city-page.mjs, and the fix
    stays whether or not this field is written. But refusing "hard" as a
    surface from a tier-1 source and then filling an unsettled field from
    the same page would be applying the rule only where it costs nothing.
  */
  if (p.fee === 'free') {
    facts.push(doc.fact('fee_type', 'free', {
      evidence: `${quoted}. The word "free" is the city's own, applied to these courts specifically.`,
    }))
  } else if (p.fee === 'drop_in_fee') {
    facts.push(doc.fact('fee_type', 'drop_in_fee', {evidence: `${quoted}.`}))
    facts.push(doc.fact('drop_in_fee_usd', p.dropIn, {
      evidence: `${quoted}. The adult drop-in rate; the senior rate is $5 and is recorded in pricing notes.`,
    }))
    facts.push(doc.fact('pricing_notes', DROP_IN_NOTE, {evidence: `${quoted}.`}))
  }

  if (p.surface) {
    facts.push((p.secondSpec ? doc : doc).fact('surface', p.surface, {
      evidence: p.secondSpec
        ? `From the venue's second listing on the same page: "${p.secondSpec}".`
        : `${quoted}. "concrete" names a material; the "hard courts" used elsewhere on this page names a category and is refused by the surface vocabulary.`,
    }))
  }

  if (p.nets !== null && p.nets !== undefined) {
    facts.push(doc.fact('nets_provided', p.nets, {
      evidence: p.nets
        ? `${quoted}.`
        : `${quoted}. "bring your own net" is a statement that nets are not provided, not an absence of information.`,
    }))
  }

  if (p.restroom === true) {
    facts.push(doc.fact('restroom', true, {
      evidence: p.secondSpec
        ? `From the venue's second listing on the same page: "${p.secondSpec}".`
        : `${quoted}.`,
    }))
  }

  if (p.amenities) {
    facts.push(doc.fact('amenities', p.amenities, {
      evidence: p.secondSpec
        ? `From the venue's second listing on the same page: "${p.secondSpec}".`
        : `${quoted}.`,
    }))
  }

  if (p.where === 'outdoor' && !p.seasonal) {
    facts.push(doc.fact('hours_of_operation', DAWN_TO_DUSK, {
      evidence: `The page's outdoor courts section: "Play from dawn to dusk.", repeated in its rules as "Courts are open from Dawn to Dusk."`,
    }))
    facts.push(doc.fact('court_availability', FCFS, {
      evidence: `"The outdoor courts are available on a first-come, first-served basis. Please limit play to 60 minutes when courts are in demand as a courtesy to other players."`,
    }))
  }

  if (p.seasonal) {
    facts.push(doc.fact('court_availability', p.seasonal, {
      evidence: `${quoted}. Listed under "Registered Activities", which the page introduces with "All pickleball activities will require an ActiveNet account and pre-registration."`,
    }))
  }

  facts.push(docCensus.fact('postal_code', county.postal_code, {
    evidence: `${county.basis} The city prints the same postcode beside the venue name.`,
  }))

  const res = applyFacts(venue, facts)

  overlay[p.slug] = {
    minted: !bySlug.has(p.slug),
    identity: {
      name: p.name,
      city: 'Portland',
      state: 'OR',
      county: county.county,
      postal_code: county.postal_code ?? null,
      latitude: county.lat ?? null,
      longitude: county.lon ?? null,
      imported_slug: bySlug.has(p.slug) ? p.slug : null,
      canonical_slug: identityRegistry.renames[p.slug]?.canonical ?? p.slug,
    },
    match: {
      source_page: PAGE,
      quote: p.spec,
      basis: bySlug.has(p.slug)
        ? `Matched to the imported ${p.slug} row in Portland, OR.`
        : `No imported row. Minted from ${PPR}'s pickleball page, which states the count and the full postal address on one line.`,
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
writeFileSync(join(REPO_ROOT, 'data/verified/portland-or.json'), JSON.stringify({
  city: 'Portland', state: 'OR', retrieved_at: RETRIEVED_AT,
  method_note:
    'Every court count, address, cost and net statement is STATED by Portland Parks & Recreation on one page, and this run asserts the exact sentence is still present in the committed HTML snapshot before publishing anything read from it. The comparison ignores whitespace because portland.gov splits words across inline elements. "hard courts", stated at nine of eleven venues, is NOT published as a surface: the import vocabulary refuses it as a category rather than a material, and that refusal is applied here even though a tier-1 source said it. Lighting is stated nowhere on the page and is null at all eleven venues, not false. Southwest and St. Johns community centers are listed twice; the second listing supplies surface and restrooms, which are building facts, and its "nets provided" is refused because it describes a registered programme rather than drop-in play.',
  sources: [
    {id: 'S1', url: PAGE, publisher: PPR, tier: 1, format: 'html', snapshot: SNAPSHOT},
    {id: 'S2', url: CENSUS_URL, publisher: 'US Census Bureau', tier: 1, format: 'json', snapshot: 'data/sources/portland-county-census.json'},
  ],
  totals: {venues: VENUES.length, courts: totalCourts, outdoor: outdoorCourts, indoor: indoorCourts},
  venues: overlay,
}, null, 2) + '\n')

const changed = changes.filter(r =>
  r.old_value !== null && r.old_value !== undefined && String(r.old_value) !== String(r.new_value))

writeFileSync(join(REPO_ROOT, 'reports', 'portland-conflicts.md'), [
  '# Portland verification - what the city states, and what we refused to publish', '',
  `Run ${RETRIEVED_AT}. ${VENUES.length} venues, ${totalCourts} courts ` +
  `(${outdoorCourts} outdoor, ${indoorCourts} indoor), one source page.`, '',
  '| venue | courts | where | cost | nets | quoted from the city |',
  '| --- | --- | --- | --- | --- | --- |',
  ...VENUES.map(p => `| \`${p.slug}\` | ${p.courts} | ${p.where} | ${p.fee ?? 'not stated'} | ` +
    `${p.nets === true ? 'provided' : p.nets === false ? 'bring your own' : 'not stated'} | "${p.spec}" |`),
  '',
  '## Stated by the city, refused by us', '',
  '| what | where | why refused |',
  '| --- | --- | --- |',
  '| surface "hard courts" | 9 of 11 venues | The surface vocabulary refuses "hard": asphalt, concrete and acrylic are all hard, so the word names a category, not a material. Pier Park ("concrete") and the two wood-floored community centres pass. |',
  '| "permanent lines" | 9 venues | Real and useful, but there is no field for it, and a verification run is the wrong place to invent one. |',
  '| "nets provided" | Southwest CC, St. Johns CC | Stated only in their second listing, which describes a registered programme, not drop-in play. |',
  '| a fee | Portland Tennis Center | Registration runs through ActiveNet and the page names no figure. |',
  '| venue_type | Portland Tennis Center | Municipal tennis centre: not a park, not a club, not a community centre. The nearest wrong answer is still wrong. |',
  '',
  '## Not stated anywhere on the page', '',
  'Lighting, at all eleven venues. `light` is null, not false.',
  '',
  changed.length ? '## Values a source changed' : '_No imported row was overwritten: none of these venues was in the import._',
  ...(changed.length ? [
    '', '| venue | field | was | now | outcome |', '| --- | --- | --- | --- | --- |',
    ...changed.map(r => `| \`${r.venue_slug}\` | ${r.field} | ${JSON.stringify(r.old_value)} | ${JSON.stringify(r.new_value)} | ${r.outcome} |`),
  ] : []),
  '',
].join('\n'))

console.log(`\nPortland, OR - ${VENUES.length} venues, ${totalCourts} courts, retrieved ${RETRIEVED_AT}`)
for (const p of VENUES) {
  const o = overlay[p.slug]
  console.log(
    `  ${o.patch.name.padEnd(32)} ${String(o.patch.total_courts).padStart(2)} ${p.where.padEnd(8)}` +
    ` | ${String(o.patch.fee_type ?? 'fee not stated').padEnd(14)}` +
    ` | nets ${String(o.patch.nets_provided ?? 'not stated').padEnd(10)}` +
    ` | surface ${o.patch.surface ?? 'not published'}`)
}
console.log(`\n  ${outdoorCourts} outdoor + ${indoorCourts} indoor = ${totalCourts} courts, all in ${counties['columbia-park'].county} County`)
console.log('\nWrote data/verified/portland-or.json and reports/portland-conflicts.md\n')
