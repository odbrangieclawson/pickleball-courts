#!/usr/bin/env node
/*
  Raleigh, NC verification run — city #2.

  ============================================================
  WHY RALEIGH, AFTER SACRAMENTO
  ============================================================

  Sacramento was withdrawn because its court counts were DERIVED by counting
  map points, and the derivation did not survive contact with a second
  source. See reports/sacramento-derivation-falsified.md.

  Raleigh is the opposite case, and that is the whole reason it was chosen:
  the operator STATES the number. Raleigh Parks publishes a pickleball page
  listing every outdoor location with its court count, and then states the
  total in prose:

    "Raleigh Parks has 44 outdoor pickleball courts located at 11 locations."

  The eleven per-park counts sum to exactly 44. A source that states both
  the parts and the whole, and reconciles, is the strongest kind of evidence
  this project can get short of standing on the court.

  Nothing here is inferred from geometry. Every number below is read out of
  a snapshot committed under data/sources/, by this script, at build time.
  The numbers are not typed into this file - the match table carries
  identity and the basis for the match, and nothing else.

  ============================================================
  THE SOURCES
  ============================================================

  S1  raleighnc.gov/pickleball, tier 1.
      Raleigh Parks' own pickleball page. States court count and lights per
      location, and whether the courts are permanent or lines painted on
      tennis or basketball courts. This is the operator telling players what
      it has, which outranks any inventory built for another purpose.

  S2  Raleigh Parks "Athletic Courts" feature service, tier 2.
      RaleighPRCR GIS Division. One POLYGON per court surface, each with a
      Pickleball field holding how many pickleball courts are on it. Used as
      an independent cross-check on S1, and as the source for surface.

  S3  Raleigh Parks "Park Amenities" feature service, tier 2.
      Same publisher. Joined on ParkID for the structured street address and
      the restroom flag.

  S4  Each park's own page on raleighnc.gov, tier 1.
      Read for the postal code, and for the detail that settles the
      disagreements below.

  S5  US Census Bureau geocoder, tier 1.
      County, resolved from each park's coordinates rather than assumed.
      Raleigh is not wholly inside one county - the Brier Creek area sits in
      Durham County - so "Raleigh is in Wake County" is not a safe default
      even though all eleven parks turn out to be in Wake.

  ============================================================
  WHERE THE SOURCES DISAGREE, AND WHAT SETTLED IT
  ============================================================

  S1 and S2 agree on nine of eleven counts. The two that differ are
  recorded as conflicts, resolved by tier, and flagged for re-check:

  BAILEYWICK PARK. S1 says 6, S2 says 4. The park's own page names three
  hard courts - Court A, Court B, Court C - and schedules pickleball on
  "Courts A and B". S2 holds polygons for A and B with 2 pickleball courts
  each, which is where its 4 comes from; it has no polygon for C. S1's 6 is
  consistent with three courts at 2 each. Unresolved on the evidence, so the
  tier decides: S1 wins at 6 and the venue is flagged. This is the honest
  outcome, not a confident one.

  CAROLINA PINES PARK. S1 says 4, S2 says 3. The park page's "3 courts" is
  under a Tennis Courts heading and is a count of tennis courts, so it does
  not corroborate S2. S1 wins at 4, and the venue is flagged.

  ADDRESSES. S1's Location column is a display label, not an address field,
  and it has a copy-paste bug: it lists FRED FLETCHER PARK at "514 Method
  Road", byte-identical to the address it gives Method Community Park in the
  row below. That is a duplicated cell, not a claim about the park, so the
  outdoor court table mints no address fact at all. Tier 1 does not win an
  argument it is not having.

  Addresses come instead from each park's own page (S4, tier 1), which is
  what the city tells a visitor, falling back to S3's structured ADDRESS
  field where the page names more than one frontage. This matters twice:
  Southgate Park is "1801 Proctor Street" on both city pages and "1801
  Proctor Rd" in the GIS, and Fred Fletcher's page gives "820 Clay Street"
  and "805 Washington Street" as two frontages of one park, of which S3
  holds the second. Every such difference is in the change log.

  ============================================================
  WHAT THIS SET DOES NOT CLAIM
  ============================================================

  fee_type   Not stated for the outdoor courts anywhere. The $3 session and
             $15 four-month pass on S1 are for INDOOR open play at community
             centres, which is a different programme at different sites.
             Publishing "free" here would be an inference. Left null, which
             costs Raleigh its /free/ filter page. Correct price.
  hours      S1 says "These courts are open from dusk until 10 p.m. with
             lighting on a timer". Read in context - and against Method's
             park page, which says "Lighting on timer from dusk to 10 p.m."
             - that is a statement about the LIGHTING timer, not opening
             hours. Reading it as hours would publish that every court in
             Raleigh is shut all morning. Left null everywhere except
             Baileywick, which publishes a real pickleball window.
  indoor     Left null rather than 0. Method Community Park and Tarboro Road
             Park share a site with a community centre that runs indoor
             play, so 0 would be false; and this venue is the outdoor courts.
  access_type  Decision O1 is still open and the vocabulary is not settled.
             Nothing is written to a field whose permitted values nobody has
             agreed.
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

const S1_URL = 'https://raleighnc.gov/pickleball'
const S2_URL = 'https://services.arcgis.com/v400IkDOw1ad7Yad/arcgis/rest/services/Raleigh_Parks_Athletic_Courts_and_Fields/FeatureServer/0'
const S3_URL = 'https://services.arcgis.com/v400IkDOw1ad7Yad/arcgis/rest/services/Raleigh_Park_Amenities/FeatureServer/0'
const S5_URL = 'https://geocoding.geo.census.gov/geocoder/geographies/coordinates'

const PRCR = 'City of Raleigh Parks, Recreation and Cultural Resources'

/*
  Identity only. The court counts, lights, addresses and postal codes are
  all read from the snapshots below - deliberately, so that a reviewer can
  change a source file and watch the published numbers change with it.

  `page` is the park's name on S1. `gis` is its LocationName on S2 and
  `parkId` its ParkID on S3. `slug` is the URL. `match` names an imported
  row where one exists; the rest are minted, because the commercial import
  holds Raleigh's community centres and private clubs but almost none of
  its outdoor park courts.
*/
const PARKS = [
  {slug: 'baileywick-park', page: 'Baileywick Park', gis: 'Baileywick', parkId: 156,
   file: 'baileywick-park',
   basis: 'No imported row. Raleigh Parks lists Baileywick Park among its eleven outdoor pickleball locations.'},

  {slug: 'carolina-pines-park', page: 'Carolina Pines Park', gis: 'Carolina Pines', parkId: 145,
   file: 'carolina-pines-park',
   basis: 'No imported row.'},

  {slug: 'fred-fletcher-park', page: 'Fred Fletcher Park', gis: 'Fred Fletcher', parkId: 85,
   file: 'fred-fletcher-park',
   basis: 'No imported row.'},

  {slug: 'jaycee-park', page: 'Jaycee Park', gis: 'Jaycee', parkId: 90,
   file: 'jaycee-park',
   basis: 'No imported row.'},

  {slug: 'method-community-park', page: 'Method Community Park', gis: 'Method', parkId: 40,
   file: 'method-community-park',
   basis: 'NOT matched to the imported "Method Road Community Center" row, which shares this address. That row is the indoor community centre and claims 9 courts; this venue is the park\'s 6 outdoor courts. Merging them would publish an outdoor court count under an indoor venue\'s name, or add three unsourced courts to an outdoor one. They stay separate and the community centre stays pending.'},

  {slug: 'north-hills-park', page: 'North Hills Park', gis: 'North Hills', parkId: 41,
   file: 'north-hills-park', match: 'north-hills-park',
   basis: 'Same site. The imported row is "North Hills Park" at 100 Chowan Circle with 6 courts, which agrees with Raleigh Parks on both address and count. Agreement with an unsourced row is not corroboration, but it is not a conflict either.'},

  {slug: 'powell-drive-park', page: 'Powell Drive Park', gis: 'Powell Drive', parkId: 92,
   file: 'powell-drive-park',
   basis: 'No imported row.'},

  {slug: 'roberts-park', page: 'Roberts Park', gis: 'Roberts', parkId: 43,
   file: 'roberts-park',
   basis: 'No imported row.'},

  {slug: 'sanderford-road-park', page: 'Sanderford Road Park', gis: 'Sanderford Road', parkId: 33,
   file: 'sanderford-road-park',
   basis: 'No imported row. Raleigh\'s largest pickleball site at 10 courts.'},

  {slug: 'southgate-park', page: 'Southgate Park', gis: 'Southgate', parkId: 118,
   file: 'southgate-park',
   basis: 'No imported row.'},

  {slug: 'tarboro-road-park', page: 'Tarboro Road Park', gis: 'Tarboro Road', parkId: 87,
   file: 'tarboro-road-park', match: 'tarboro-road-community-center-outdoor-courts-raleigh-nc',
   basis: 'Same courts. The imported row is named "Tarboro Road Community Center outdoor courts", sits at 121 N Tarboro St and claims 2 courts, which is what Raleigh Parks says the park has. The row names the outdoor courts explicitly, so unlike Method there is no indoor/outdoor ambiguity to preserve.'},
]

/* ---------------------------------------------------------------- */
/* Read the sources.                                                 */
/* ---------------------------------------------------------------- */

const read = p => readFileSync(join(REPO_ROOT, p), 'utf8')
const stripTags = s => s.replace(/<[^>]+>/g, ' ')
const unescapeHtml = s => s
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#0?39;|&apos;|&#x27;/g, "'")
  .replace(/&#8217;|&rsquo;/g, "'").replace(/&#8211;|&ndash;/g, '-')
const tidy = s => unescapeHtml(stripTags(s)).replace(/\s+/g, ' ').trim()

/*
  S1: the outdoor court table. Columns are Location, Courts, Lights, Notes.
  The Location cell holds the park name followed by its address, which is
  why parks are matched on a name PREFIX rather than on equality.
*/
function parseS1() {
  const html = read('data/sources/raleigh-pickleball-page.html')
  const rows = []
  for (const table of html.match(/<table[\s\S]*?<\/table>/gi) ?? []) {
    for (const tr of table.match(/<tr[\s\S]*?<\/tr>/gi) ?? []) {
      const cells = (tr.match(/<t[dh][\s\S]*?<\/t[dh]>/gi) ?? []).map(tidy)
      if (cells.length === 4 && /^\d+$/.test(cells[1])) {
        rows.push({location: cells[0], courts: Number(cells[1]), lights: cells[2], notes: cells[3]})
      }
    }
  }
  /* The prose total, so the parts can be checked against the whole. */
  const m = /Raleigh Parks has\s+(\d+)\s+outdoor pickleball courts located at\s+(\d+)\s+locations/i
    .exec(tidy(html))
  return {rows, statedTotal: m ? Number(m[1]) : null, statedLocations: m ? Number(m[2]) : null, statement: m?.[0] ?? null}
}

/* S2: sum the stated Pickleball value over each park's court polygons. */
function parseS2() {
  const src = JSON.parse(read('data/sources/raleigh-athletic-courts.arcgis.json'))
  const per = new Map()
  for (const f of src.features) {
    const a = f.attributes
    const n = Number(a.Pickleball)
    if (!Number.isFinite(n) || n <= 0) continue
    const e = per.get(a.LocationName) ?? {courts: 0, polygons: 0, surfaces: new Set(), lighting: new Set(), io: new Set()}
    e.courts += n
    e.polygons++
    if (a.Surface) e.surfaces.add(String(a.Surface).toLowerCase())
    if (a.Lighting) e.lighting.add(a.Lighting)
    if (a.IndoorOutdoor) e.io.add(a.IndoorOutdoor)
    per.set(a.LocationName, e)
  }
  return per
}

/* S3: address and restroom, by ParkID. */
function parseS3() {
  const src = JSON.parse(read('data/sources/raleigh-park-amenities.arcgis.json'))
  const per = new Map()
  for (const f of src.features) {
    const a = f.attributes
    const g = f.geometry
    per.set(a.PARK_ID, {
      name: a.PARK_NAME, address: a.ADDRESS, website: a.WEBSITE,
      restrooms: a.RESTROOMS, pickleballFlag: a.PICKLEBALL,
      latitude: g && typeof g.y === 'number' ? Number(g.y.toFixed(6)) : null,
      longitude: g && typeof g.x === 'number' ? Number(g.x.toFixed(6)) : null,
    })
  }
  return per
}

/*
  S4: the park's own address block.

  The street address of record is the one on the park's own page, because
  that is what the city tells a visitor. Where a park's page names more
  than one frontage - Fred Fletcher gives "820 Clay Street and 805
  Washington Street", both true - the page cannot be reduced to a single
  address field, so S3's structured ADDRESS is used instead and this
  returns null.
*/
const STREET = /^(\d{2,5} [A-Z][A-Za-z0-9.' ]*?(?:Street|St|Road|Rd|Drive|Dr|Avenue|Ave|Circle|Cir|Way|Lane|Ln|Blvd|Boulevard|Court|Ct|Place|Pl)\.?)$/

const NL = String.fromCharCode(10)

function addressFrom(file) {
  const html = read(`data/sources/raleigh-parks/${file}.html`)
  const lines = unescapeHtml(html.replace(/<[^>]+>/g, NL))
    .split(NL).map(l => l.replace(/\s+/g, ' ').trim()).filter(Boolean)
  for (const l of lines.slice(0, 400)) {
    /* More than one frontage: the page cannot be reduced to one field. */
    if (/\band\b/.test(l)) continue
    const m = STREET.exec(l)
    if (m) return m[1]
  }
  return null
}

/* S4: the postal code, from the park's own page. */
function postalFrom(file) {
  const html = read(`data/sources/raleigh-parks/${file}.html`)
  const zips = new Set([...html.matchAll(/Raleigh,\s*NC\s*(27\d{3})/g)].map(m => m[1]))
  if (zips.size !== 1) {
    throw new Error(`${file}: expected exactly one postal code on the park page, found ${[...zips].join(', ') || 'none'}`)
  }
  return [...zips][0]
}

const s1 = parseS1()
const s2 = parseS2()
const s3 = parseS3()
const counties = JSON.parse(read('data/sources/raleigh-county-census.json'))

/*
  The check Sacramento never had: do the parts sum to the whole the source
  itself states? If a future refresh of the page breaks this, the run stops
  rather than publishing a set that no longer adds up.
*/
const parsedTotal = s1.rows.reduce((n, r) => n + r.courts, 0)
if (s1.statedTotal === null) throw new Error('S1 no longer states a total. Re-read the page before trusting the table.')
if (parsedTotal !== s1.statedTotal || s1.rows.length !== s1.statedLocations) {
  throw new Error(
    `S1 does not reconcile: table gives ${parsedTotal} courts at ${s1.rows.length} locations, ` +
    `prose says ${s1.statedTotal} at ${s1.statedLocations}. Nothing published until that is understood.`)
}

/* ---------------------------------------------------------------- */

const docS1 = new SourceDocument({url: S1_URL, retrieved_at: RETRIEVED_AT, tier: 1, publisher: PRCR, format: 'html'})
const docS2 = new SourceDocument({url: S2_URL, retrieved_at: RETRIEVED_AT, tier: 2, publisher: `${PRCR}, GIS Division`, format: 'arcgis'})
const docS3 = new SourceDocument({url: S3_URL, retrieved_at: RETRIEVED_AT, tier: 2, publisher: `${PRCR}, GIS Division`, format: 'arcgis'})
const docS5 = new SourceDocument({url: S5_URL, retrieved_at: RETRIEVED_AT, tier: 1, publisher: 'US Census Bureau', format: 'json'})

const identityRegistry = loadIdentity(REPO_ROOT)
const allRows = loadRows().map(r => mapRow(r).venue)
/* Scoped to this city: slugs repeat across cities and an unscoped lookup
   would hand the match table a same-named park in another state. */
const bySlug = new Map(
  allRows.filter(v => v.city === 'Raleigh' && String(v.state).toUpperCase() === 'NC')
    .map(v => [v.slug, v]))

const overlay = {}
const changes = []
const notes = []

for (const p of PARKS) {
  const row = s1.rows.find(r => r.location.startsWith(p.page))
  if (!row) throw new Error(`S1 has no row for "${p.page}"`)
  const gis = s2.get(p.gis)
  const amen = s3.get(p.parkId)
  if (!amen) throw new Error(`S3 has no park with ParkID ${p.parkId} (${p.page})`)
  if (!amen.address) throw new Error(`${p.page} has no address in S3; it must be excluded, not published`)
  const county = counties[p.gis]
  if (!county) throw new Error(`No Census county lookup for ${p.gis}`)

  const postal = postalFrom(p.file)
  const pageAddress = addressFrom(p.file)

  const venue = p.match
    ? bySlug.get(p.match)
    : (() => {
      const shell = {
        slug: p.slug, name: null, city: 'Raleigh', state: 'NC', county: null,
        postal_code: null, street_address: null, latitude: null, longitude: null,
        status: 'pending', source_url: null, date_checked: null, verified_by: null,
        claimed_by_owner: false, claim_date: null,
        rating: null, user_rating: null, review_count: null, claimed_or_verified: null,
        source_sport: 'pickleball',
      }
      for (const f of PUBLISHED_FACT_FIELDS) shell[f] = null
      return shell
    })()
  if (!venue) throw new Error(`No imported row with slug ${p.match}`)

  /*
    PASS ONE: the tier-2 GIS inventory. Applied first so that when the
    operator's own page disagrees below, the disagreement is resolved by
    the conflict protocol and written to the change log, rather than one
    value silently replacing the other.
  */
  const gisFacts = []
  if (gis) {
    gisFacts.push(docS2.fact('total_courts', gis.courts, {
      evidence: `Athletic Courts layer, LocationName="${p.gis}": ${gis.polygons} court polygon(s) whose Pickleball field sums to ${gis.courts}. The count is stated per polygon by the layer, not measured from the geometry.`,
    }))
    const surfaces = [...gis.surfaces]
    if (surfaces.length === 1) {
      gisFacts.push(docS2.fact('surface', surfaces[0], {
        evidence: `Athletic Courts layer, Surface="${surfaces[0]}" on every pickleball polygon at "${p.gis}".`,
      }))
    }
  }
  gisFacts.push(docS3.fact('street_address', amen.address, {
    evidence: `Park Amenities layer, PARK_ID=${p.parkId}, ADDRESS="${amen.address}".`,
  }))
  if (amen.website) {
    gisFacts.push(docS3.fact('website', amen.website, {
      evidence: `Park Amenities layer, PARK_ID=${p.parkId}, WEBSITE="${amen.website}".`,
    }))
  }
  /*
    Restroom: TRUE only. RESTROOMS holds 1 or 0 across all 134 parks with no
    blanks, which is the signature import policy P1 was written for - a
    column that cannot say "unknown" did not record one, so its 0 is an
    absence wearing a value rather than a checked negative. A 1 is a
    positive statement and is published; a 0 is left null.
  */
  if (Number(amen.restrooms) === 1) {
    gisFacts.push(docS3.fact('restroom', true, {
      evidence: `Park Amenities layer, PARK_ID=${p.parkId}, RESTROOMS=1.`,
    }))
  }

  const pass1 = applyFacts(venue, gisFacts)

  /*
    PASS TWO: the operator's own page, tier 1. Passing pass1.provenance in
    is what makes the two passes argue properly instead of the second
    overwriting the first without a record.
  */
  const lightsYes = /^yes$/i.test(row.lights)
  const lightsNo = /^no$/i.test(row.lights)

  const pageFacts = [
    docS1.fact('name', p.page, {
      evidence: `Outdoor court table, Location cell "${row.location}".`,
    }),
    docS1.fact('total_courts', row.courts, {
      evidence: `Outdoor court table: "${p.page}" is listed with ${row.courts} in the Courts column. The same page states "${s1.statement}", and the eleven listed locations sum to exactly ${parsedTotal}.`,
    }),
    /*
      Every court in this table is outdoor: the table's own heading says so
      and the prose says "44 outdoor pickleball courts". indoor_courts is
      left null rather than 0 - see the header.
    */
    docS1.fact('outdoor_courts', row.courts, {
      evidence: `The table is the city's list of OUTDOOR courts and the page states "${s1.statement}". All ${row.courts} of this venue's courts are outdoor.`,
    }),
    docS1.fact('venue_type', 'public_park', {
      evidence: `Listed by ${PRCR} as one of its public park pickleball locations.`,
    }),
  ]

  if (lightsYes || lightsNo) {
    pageFacts.push(docS1.fact('light', lightsYes, {
      evidence: `Outdoor court table, Lights column reads "${row.lights}" for ${p.page}.`,
    }))
  }

  /*
    Nets. Published only where the page says so in words. "Tennis courts
    with pickleball lines" is not a statement about nets, however strongly
    it hints, so those venues get null and a "Not verified yet".
  */
  if (/bring your own net|bring of borrow a net|bring or borrow a net/i.test(row.notes)) {
    pageFacts.push(docS1.fact('nets_provided', false, {
      evidence: `Outdoor court table, Notes for ${p.page}: "${row.notes}".`,
    }))
  }

  /* Baileywick is the only venue whose pickleball hours the page states. */
  const hours = /Available\s+(Monday[^.]*?)(?:\s*Please check|$)/i.exec(row.notes)
  if (hours) {
    pageFacts.push(docS1.fact('hours_of_operation', hours[1].trim(), {
      evidence: `Outdoor court table, Notes for ${p.page}: "${row.notes}".`,
    }))
  }

  /*
    The address, from the park's own page. Tier 1, so where it differs from
    S3's structured field it wins and the difference is logged - Southgate
    is "1801 Proctor Street" on both city pages and "1801 Proctor Rd" in the
    GIS. Where the page names two frontages this is null and S3's value,
    already applied in pass one, stands.
  */
  if (pageAddress) {
    pageFacts.push(docS1.fact('street_address', pageAddress, {
      evidence: `Address block on the park's own page, ${amen.website ?? 'raleighnc.gov'}: "${pageAddress}".`,
    }))
  }

  /* Covered, from the park's own page. Rule 14: covered is NOT indoor. */
  if (p.slug === 'baileywick-park') {
    pageFacts.push(docS1.fact('covered', true, {
      evidence: 'The park page lists "Court A - Covered" and "Court B - Covered Center", and schedules pickleball on Courts A and B. Rule 14: covered is not indoor, and these courts are counted as outdoor.',
    }))
  }

  const countyFact = docS5.fact('county', county.county, {
    evidence: `Census geocoder, coordinates ${amen.latitude},${amen.longitude} fall in ${county.county} County, NC (FIPS ${county.state_fips}${county.county_fips}). Resolved per park rather than assumed: the Brier Creek part of Raleigh lies in Durham County.`,
  })

  const res = applyFacts(pass1.venue, [...pageFacts, countyFact], pass1.provenance)

  if (gis && gis.courts !== row.courts) {
    notes.push({slug: p.slug, park: p.page, s1: row.courts, s2: gis.courts})
  }

  /*
    KEYED BY THE IMPORTED SLUG where there is one. applyVerifiedOverlay
    looks a venue up by `imported_slug ?? slug`, because the imported slug
    is the only identifier that does not move; the slug the site publishes
    travels in identity.canonical_slug.
  */
  const key = p.match ?? p.slug
  overlay[key] = {
    minted: !p.match,
    identity: {
      name: p.page,
      city: 'Raleigh',
      state: 'NC',
      county: county.county,
      postal_code: postal,
      latitude: amen.latitude,
      longitude: amen.longitude,
      imported_slug: p.match ?? null,
      canonical_slug: p.match ? (identityRegistry.renames[p.match]?.canonical ?? p.match) : p.slug,
    },
    match: {
      s1_location: row.location, s1_courts: row.courts, s1_lights: row.lights, s1_notes: row.notes,
      s2_courts: gis?.courts ?? null, s2_polygons: gis?.polygons ?? null,
      basis: p.basis,
    },
    patch: Object.fromEntries([...gisFacts, ...pageFacts, countyFact]
      .filter(f => res.provenance[f.field]?.source_url === f.source_url)
      .map(f => [f.field, f.value])),
    provenance: res.provenance,
    record: {source_url: res.venue.source_url, date_checked: res.venue.date_checked, verified_by: res.venue.verified_by},
    needs_recheck: res.needs_recheck,
    recheck: res.recheck,
  }
  changes.push(...changelogToRows(key, [...pass1.changelog, ...res.changelog]))
}

/* ---------------------------------------------------------------- */

mkdirSync(join(REPO_ROOT, 'data/verified'), {recursive: true})
writeFileSync(join(REPO_ROOT, 'data/verified/raleigh-nc.json'), JSON.stringify({
  city: 'Raleigh', state: 'NC', retrieved_at: RETRIEVED_AT,
  method_note: 'Court counts are STATED by Raleigh Parks, not derived. The operator publishes a per-location table and, in prose on the same page, the total across all locations; this run refuses to write anything unless the table sums to the stated total. Where the tier-2 GIS inventory disagrees with the tier-1 page, the conflict is recorded and the venue flagged for re-check.',
  sources: [
    {id: 'S1', url: S1_URL, publisher: PRCR, tier: 1, format: 'html', snapshot: 'data/sources/raleigh-pickleball-page.html'},
    {id: 'S2', url: S2_URL, publisher: `${PRCR}, GIS Division`, tier: 2, format: 'arcgis', snapshot: 'data/sources/raleigh-athletic-courts.arcgis.json'},
    {id: 'S3', url: S3_URL, publisher: `${PRCR}, GIS Division`, tier: 2, format: 'arcgis', snapshot: 'data/sources/raleigh-park-amenities.arcgis.json'},
    {id: 'S4', url: 'https://raleighnc.gov/places/', publisher: PRCR, tier: 1, format: 'html', snapshot: 'data/sources/raleigh-parks/'},
    {id: 'S5', url: S5_URL, publisher: 'US Census Bureau', tier: 1, format: 'json', snapshot: 'data/sources/raleigh-county-census.json'},
  ],
  venues: overlay,
}, null, 2) + '\n')

const changed = changes.filter(r =>
  r.old_value !== null && r.old_value !== undefined && String(r.old_value) !== String(r.new_value))

writeFileSync(join(REPO_ROOT, 'reports', 'raleigh-conflicts.md'), [
  '# Raleigh verification - what the sources changed and where they disagree', '',
  `Run ${RETRIEVED_AT}. ${PARKS.length} venues.`, '',
  `Raleigh Parks states: "${s1.statement}". The eleven per-location counts`,
  `sum to ${parsedTotal}, so the source reconciles with itself. This run refuses`,
  'to write anything if it stops doing so.', '',
  '## Where the tier-1 page and the tier-2 GIS inventory disagree', '',
  notes.length ? '| venue | raleighnc.gov/pickleball (tier 1) | Athletic Courts layer (tier 2) |' : '_None._',
  notes.length ? '| --- | --- | --- |' : '',
  ...notes.map(n => `| \`${n.slug}\` | ${n.s1} | ${n.s2} |`),
  '',
  'Both are resolved in favour of tier 1 and flagged for one re-check.', '',
  '## Every value a source changed', '',
  '| venue | field | was | now | outcome |',
  '| --- | --- | --- | --- | --- |',
  ...changed.map(r => `| \`${r.venue_slug}\` | ${r.field} | ${JSON.stringify(r.old_value)} | ${JSON.stringify(r.new_value)} | ${r.outcome} |`),
  '', `**${changed.length} values changed** across ${PARKS.length} venues.`, '',
].join('\n'))

console.log(`\nRaleigh, NC - ${PARKS.length} venues, retrieved ${RETRIEVED_AT}`)
console.log(`S1 states: "${s1.statement}"`)
console.log(`S1 table sums to ${parsedTotal} across ${s1.rows.length} locations - reconciles.\n`)
for (const p of PARKS) {
  const o = overlay[p.match ?? p.slug]
  const flag = o.needs_recheck ? ' <- CONFLICT, flagged' : ''
  console.log(
    `  ${o.patch.name.padEnd(23)} ${String(o.patch.total_courts).padStart(2)} courts` +
    ` | lights ${String(o.patch.light ?? 'not stated').padEnd(11)}` +
    ` | ${o.patch.county} County${flag}`)
}
console.log(`\n${changed.length} values changed. ${notes.length} source disagreement(s). See reports/raleigh-conflicts.md`)
console.log('Wrote data/verified/raleigh-nc.json\n')
