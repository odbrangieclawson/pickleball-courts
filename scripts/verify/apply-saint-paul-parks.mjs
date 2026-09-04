#!/usr/bin/env node
/*
  Saint Paul, MN verification run — city #12, the first in Minnesota, and the
  first city where the operator's two records of its own courts disagree
  about which parks have any.

  ============================================================
  THERE IS NO LIST
  ============================================================

  Every city published before this one had a page naming its pickleball
  venues. Saint Paul does not. Its pickleball page says only:

      "Use our pickleball maps to find indoor and outdoor pickleball courts
       in Saint Paul. Unless otherwise noted, outdoor pickleball courts are
       located on tennis courts and indoor pickleball courts are located in
       the gymnasium."

  and then links an interactive map and a PDF. So the venue set had to be
  assembled rather than read, and this run is explicit about how:

    1. The City's own pickleball GIS layer — Amenities_Parks layer 17,
       published by CityofSaintPaul_BI — gives candidate site names. It is
       one point per court, carries no address and no count, and is the data
       behind the interactive map.
    2. Each candidate's facility page on stpaul.gov is then read for the
       court count and the street address, in the City's own amenity format:
       "(2) Pickleball Courts".

  A venue publishes only when step 2 produces a count and an address. The
  layer alone never publishes anything: counting points on a map and calling
  the total a court count is exactly the derivation this project falsified
  for Sacramento and refuses to repeat.

  ============================================================
  THE CITY'S TWO RECORDS DISAGREE
  ============================================================

  The GIS layer and the facility pages do not describe the same set of parks,
  in both directions:

    In the layer, not on the pages   Baker, Carty, Eastview, Hazel Park,
                                     Mattocks, Prosperity Heights, Rice Rec
                                     Center, MLK Rec Center. Their facility
                                     pages state no pickleball count; several
                                     never mention pickleball at all.
    On the pages, not in the layer   Clayland Park and Edgcumbe Recreation
                                     Center both publish a pickleball count
                                     in their amenity lists and appear
                                     nowhere in the layer.

  Neither record is dismissed here. The facility pages decide what publishes,
  because they are the ones that state a count, and the disagreement is
  written into the city page rather than quietly resolved.

  ============================================================
  WHAT IS REFUSED
  ============================================================

  Assembly Union Park is the one that hurts. Its page states "3 pickleball
  courts" and the City calls them the first dedicated pickleball courts in
  the Saint Paul park system — and the Census geocoder returns no match for
  875 Mount Curve Boulevard. Import Gate I1 requires an address that
  resolves, so the newest and most interesting venue in the city is the one
  that cannot publish.

  Mattocks Park lists "Pickleball (Outdoor)" among its amenities with no
  number at all. A venue needs a verified court count to exist here.

  ============================================================
  WHY EVERY COURT HERE IS OUTDOOR
  ============================================================

  Not by assumption. The two recreation centres split their amenity lists
  into "Indoor Amenities:" and "Outdoor Amenities:", and the pickleball line
  sits under Outdoor at both. The four parks describe their courts as
  striping on tennis courts, which the City's pickleball page ties to
  outdoor in as many words. Saint Paul does run indoor pickleball in
  gymnasiums; none of it carries a count on a facility page, so none of it
  is published.

  ============================================================
  WHAT IS NOT CLAIMED
  ============================================================

  lights, fees,   Stated nowhere for any of the six. Saint Paul's facility
  surface, hours  pages are amenity inventories rather than court guides:
                  they list what exists and say nothing about when it is
                  open, what it costs or what it is made of.
  the courts in   Orchard Park lists "2 Pickleball Courts" AND "1 Tennis
  addition        Court (w/ pickleball lines)". Only the stated pickleball
                  count publishes; the tennis court with lines on it is
                  described on the venue page and not added to the number.
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

const CITY = 'City of Saint Paul Parks and Recreation'
const FACILITY_BASE = 'https://www.stpaul.gov/facilities'
const PICKLEBALL_PAGE = 'https://www.stpaul.gov/departments/parks-and-recreation/recreation-centers/pickleball'
const LAYER_URL = 'https://services1.arcgis.com/9meaaHE3uiba0zr8/arcgis/rest/services/Amenities_Parks/FeatureServer/17'
const CENSUS_URL = 'https://geocoding.geo.census.gov/geocoder/geographies'

const OUTDOOR_RULE =
  'Unless otherwise noted, outdoor pickleball courts are located on tennis courts and indoor pickleball courts are located in the gymnasium.'

const VENUES = [
  {
    slug: 'arlington-arkwright-park', name: 'Arlington/Arkwright Park', page: 'arlington-arkwright-park',
    address: '400 Arlington Ave. E.', courts: 1,
    spec: '1 Pickleball court (striped tennis court)',
    venueType: 'public_park',
    availability: 'One pickleball court, striped onto a tennis court — the City says so in the amenity line itself, "1 Pickleball court (striped tennis court)". It is the smallest published venue in Saint Paul, and being a single overlaid court it is also the least reliable: a tennis match takes the whole venue.',
  },
  {
    slug: 'clayland-park', name: 'Clayland Park', page: 'clayland-park',
    address: '901 Fairview Ave. N.', courts: 2,
    spec: '(2) Pickleball Courts',
    prose: 'Clayland Park, adjacent to Newell Park, features two tennis courts striped for pickleball as well as two designated handball courts.',
    venueType: 'public_park',
    availability: 'Two pickleball courts striped onto the park\'s two tennis courts, which the City describes in prose as well as counting in its amenity list. The park also has two designated handball courts and sits adjacent to Newell Park.',
  },
  {
    slug: 'duluth-and-case-recreation-center', name: 'Duluth and Case Recreation Center', page: 'duluth-and-case-recreation-center',
    address: '1020 Duluth St.', courts: 2,
    spec: '(2) Pickleball Courts',
    venueType: 'community_center',
    availability: 'Two pickleball courts, listed under the recreation centre\'s Outdoor Amenities rather than its Indoor ones — so these are outside the building, alongside a football field, a soccer field, a playground and three Kato/Sepak Takraw courts. The centre itself has a small gym, and no pickleball count is published for it.',
  },
  {
    slug: 'edgcumbe-recreation-center', name: 'Edgcumbe Recreation Center', page: 'edgcumbe-recreation-center',
    address: '320 Griggs St. S.', courts: 4,
    spec: '(4) Pickleball Courts',
    venueType: 'community_center',
    availability: 'Four pickleball courts — the largest published count in Saint Paul — listed under the recreation centre\'s Outdoor Amenities. The building beside them holds a medium gym, a fitness centre, two racquetball/walleyball courts and a warming room, and the City publishes no pickleball count for any indoor space here.',
  },
  {
    slug: 'homecroft-park', name: 'Homecroft Park', page: 'homecroft-park',
    address: '1850 Sheridan Ave.', courts: 2,
    spec: '(2) Pickleball Courts',
    venueType: 'public_park',
    availability: 'Two pickleball courts listed alongside two tennis courts and a tennis backboard, which is the ordinary Saint Paul arrangement: pickleball striped onto the tennis surface. The park also has open space and, per the City\'s amenity list, nothing else that competes for the courts.',
  },
  {
    slug: 'orchard-park', name: 'Orchard Park', page: 'orchard-park',
    address: '875 Orchard Ave.', courts: 2,
    spec: '2 Pickleball Courts',
    extra: '1 Tennis Court (w/ pickleball lines)',
    venueType: 'public_park',
    availability: 'Two pickleball courts, and separately one tennis court with pickleball lines on it — the City lists both. Only the stated pickleball count is published as the court number; the lined tennis court is a third surface you may be able to use and is not added to the total, because the City counts it as a tennis court.',
  },
]

const EXCLUDED = [
  {
    name: 'Assembly Union Park',
    spec: '3 pickleball courts',
    reasons: [
      'The Census address geocoder returns no match for "875 Mount Curve Boulevard", the address the City prints on the park\'s own page. Import Gate I1 requires a street address that resolves.',
      'This is the most costly exclusion in the run: the City describes these as the first dedicated pickleball courts in the Saint Paul park system, and dedicated courts are rarer in this city than anywhere else published so far.',
    ],
  },
  {
    name: 'Mattocks Park',
    spec: 'Pickleball (Outdoor)',
    reasons: [
      'The City lists "Pickleball (Outdoor)" among the park\'s amenities and states no number. Page Gate 1 requires a verified court count and there is none to verify.',
    ],
  },
]

/* Sites the City's GIS layer marks as having pickleball whose facility pages
   state no count. Named on the city page rather than silently dropped. */
const LAYER_ONLY = [
  'Baker Park', 'Carty Park', 'Eastview Park', 'Hazel Park',
  'Prosperity Heights Park', 'Rice Recreation Center',
  'Martin Luther King Recreation Center',
]

/* ---------------------------------------------------------------- */

const snapshotPath = name => `data/sources/saint-paul/${name}.html`

const linesOf = rel => readFileSync(join(REPO_ROOT, rel), 'utf8')
  .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
  .replace(/<[^>]+>/g, '\n')
  .replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&#0?39;|&apos;|&lsquo;|&rsquo;|&#8217;|[‘’]/g, "'")
  .replace(/&quot;|[“”]/g, '"')
  .replace(/&#8211;|&#8212;|[–—‑]/g, '-')
  .split('\n').map(s => s.trim()).filter(Boolean)

const squeeze = s => s.replace(/\s+/g, '')

const pageText = name => squeeze(linesOf(snapshotPath(name)).join(' '))
const must = (page, who, needle, what) => {
  if (!pageText(page).includes(squeeze(needle))) {
    throw new Error(`${who}: the ${page} facility page no longer contains the ${what} text "${needle}".`)
  }
}

/*
  WHICH AMENITY SECTION A LINE SITS IN.

  The recreation centres split their amenities into Indoor and Outdoor, and
  the pickleball count sits under Outdoor at both. That is the whole basis
  for calling those courts outdoor, so it is checked rather than remembered.
*/
const sectionOf = (page, needle) => {
  let section = null
  for (const line of linesOf(snapshotPath(page))) {
    if (/^Indoor Amenities:/.test(line)) section = 'indoor'
    else if (/^Outdoor Amenities:/.test(line)) section = 'outdoor'
    if (squeeze(line).includes(squeeze(needle))) return section
  }
  return undefined
}

const counties = JSON.parse(
  readFileSync(join(REPO_ROOT, 'data/sources/saint-paul-county-census.json'), 'utf8'))

if (counties['assembly-union-park']?.matched) {
  throw new Error('Assembly Union Park now geocodes. The reason it is excluded has changed; revisit it and publish it.')
}

/* The excluded venues, asserted rather than assumed. */
must('assembly-union-park', 'assembly-union-park', '3 pickleball courts', 'court count')
must('mattocks-park', 'mattocks-park', 'Pickleball (Outdoor)', 'uncounted pickleball')
if (/\(\s*\d+\s*\)\s*Pickleball/i.test(linesOf(snapshotPath('mattocks-park')).join(' '))) {
  throw new Error('Mattocks Park now states a numbered pickleball count. Revisit the exclusion and publish it.')
}

const identityRegistry = loadIdentity(REPO_ROOT)
const allRows = loadRows().map(r => mapRow(r).venue)
const bySlug = new Map(
  allRows.filter(v => ['Saint Paul', 'St. Paul', 'St Paul'].includes(v.city) &&
    String(v.state).toUpperCase() === 'MN')
    .map(v => [v.slug, v]))

const overlay = {}
const changes = []

for (const p of VENUES) {
  must(p.page, p.slug, p.spec, 'court count')
  must(p.page, p.slug, p.address, 'street address')
  if (p.prose) must(p.page, p.slug, p.prose, 'descriptive')
  if (p.extra) must(p.page, p.slug, p.extra, 'additional court')

  if (p.venueType === 'community_center') {
    const sec = sectionOf(p.page, p.spec)
    if (sec !== 'outdoor') {
      throw new Error(
        `${p.slug}: its pickleball line is no longer under "Outdoor Amenities:" (found: ${sec ?? 'no section'}). ` +
        'The basis for calling these courts outdoor has changed; re-read the page.')
    }
  }

  const geo = counties[p.slug]
  if (!geo?.matched) throw new Error(`${p.slug}: the Census geocoder did not match its address`)
  if (geo.place !== 'St. Paul city') {
    throw new Error(`${p.slug}: Census places this at "${geo.place}", not St. Paul city.`)
  }

  const doc = new SourceDocument({
    url: `${FACILITY_BASE}/${p.page}`, retrieved_at: RETRIEVED_AT, tier: 1, publisher: CITY, format: 'html',
  })
  const docCity = new SourceDocument({
    url: PICKLEBALL_PAGE, retrieved_at: RETRIEVED_AT, tier: 1, publisher: CITY, format: 'html',
  })
  const docCensus = new SourceDocument({
    url: CENSUS_URL, retrieved_at: RETRIEVED_AT, tier: 1, publisher: 'US Census Bureau', format: 'json',
  })

  const shell = {
    slug: p.slug, name: null, city: 'Saint Paul', state: 'MN', county: null,
    postal_code: null, street_address: null, latitude: null, longitude: null,
    status: 'pending', source_url: null, date_checked: null, verified_by: null,
    claimed_by_owner: false, claim_date: null,
    rating: null, user_rating: null, review_count: null, claimed_or_verified: null,
    source_sport: 'pickleball',
  }
  for (const f of PUBLISHED_FACT_FIELDS) shell[f] = null
  const venue = bySlug.get(p.slug) ?? shell

  const quoted = `Quoted from the ${CITY}'s facility page for this venue, in its amenity list: "${p.spec}"`

  const facts = [
    doc.fact('name', p.name, {evidence: `Named "${p.name}" by the ${CITY} on its own facility page.`}),
    doc.fact('total_courts', p.courts, {
      evidence: p.extra
        ? `${quoted}. The same list separately carries "${p.extra}", which is counted by the City as a tennis court and is therefore not added to this number.`
        : `${quoted}.`,
    }),
    doc.fact('outdoor_courts', p.courts, {
      evidence: p.venueType === 'community_center'
        ? `${quoted}. The line sits under this recreation centre's "Outdoor Amenities:" heading rather than its "Indoor Amenities:" one, which is what makes these outdoor courts rather than gym courts. The indoor count is left unverified rather than set to zero.`
        : `${quoted}. The City's pickleball page states the rule this rests on: "${OUTDOOR_RULE}" These courts are striped on the park's tennis courts. The indoor count is left unverified rather than set to zero.`,
    }),
    doc.fact('street_address', p.address, {
      evidence: `"${p.address}" is the address the City prints on this venue's facility page.`,
    }),
    doc.fact('venue_type', p.venueType, {
      evidence: p.venueType === 'community_center'
        ? 'The City runs this as a recreation centre; the pickleball courts are among its outdoor amenities.'
        : `Published by the ${CITY} among its parks.`,
    }),
    doc.fact('court_availability', p.availability, {
      evidence: `${quoted}${p.prose ? `, and the park description: "${p.prose}"` : ''}. The City's pickleball page adds: "${OUTDOOR_RULE}"`,
    }),
    docCensus.fact('county', geo.county, {
      evidence: `${geo.county} County, MN (FIPS ${geo.state_fips}${geo.county_fips}). ${geo.basis} The geocoder also places it in the incorporated place "${geo.place}", which is what allows it to be published under Saint Paul.`,
    }),
    docCensus.fact('postal_code', geo.postal_code, {evidence: geo.basis}),
  ]

  const res = applyFacts(venue, facts)

  overlay[p.slug] = {
    minted: !bySlug.has(p.slug),
    identity: {
      name: p.name, city: 'Saint Paul', state: 'MN',
      county: geo.county, postal_code: geo.postal_code ?? null,
      latitude: geo.lat ?? null, longitude: geo.lon ?? null,
      imported_slug: bySlug.has(p.slug) ? p.slug : null,
      canonical_slug: identityRegistry.renames[p.slug]?.canonical ?? p.slug,
    },
    match: {
      source_page: `${FACILITY_BASE}/${p.page}`, quote: p.spec,
      basis: bySlug.has(p.slug)
        ? `Matched to the imported ${p.slug} row in Saint Paul, MN.`
        : `No imported row under this slug. The site name came from the City's own pickleball GIS layer; the count and the address come from this facility page, which is what makes the venue publishable.`,
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
  const patch = entry.patch
  if (patch.total_courts !== (patch.outdoor_courts ?? 0) + (patch.indoor_courts ?? 0)) {
    throw new Error(`Rule 13: ${slug} does not sum.`)
  }
}

mkdirSync(join(REPO_ROOT, 'data/verified'), {recursive: true})
writeFileSync(join(REPO_ROOT, 'data/verified/saint-paul-mn.json'), JSON.stringify({
  city: 'Saint Paul', state: 'MN', retrieved_at: RETRIEVED_AT,
  method_note:
    'Saint Paul publishes no list of its pickleball venues. Its pickleball page links an interactive map and a PDF and says only that "outdoor pickleball courts are located on tennis courts and indoor pickleball courts are located in the gymnasium", so the venue set had to be assembled: candidate site names from the City\'s own pickleball GIS layer, then a court count and a street address from each candidate\'s facility page, in the City\'s amenity format "(2) Pickleball Courts". Nothing publishes on the layer alone — it is one point per court with no count and no address, and counting map points to produce a court total is the derivation this project falsified for Sacramento. The City\'s two records disagree in both directions: eight sites the layer marks for pickleball state no count on their facility pages, and two that do state a count, Clayland Park and Edgcumbe Recreation Center, are absent from the layer. Every published court is outdoor on the City\'s own evidence — at the two recreation centres the pickleball line sits under "Outdoor Amenities:", which this run checks rather than assumes. Assembly Union Park, whose three courts the City calls the first dedicated pickleball courts in the park system, is refused because its address does not resolve.',
  sources: [
    {url: PICKLEBALL_PAGE, publisher: CITY, tier: 1, format: 'html', snapshot: snapshotPath('pickleball')},
    ...VENUES.map(p => ({
      url: `${FACILITY_BASE}/${p.page}`, publisher: CITY, tier: 1, format: 'html', snapshot: snapshotPath(p.page),
    })),
    {url: `${FACILITY_BASE}/assembly-union-park`, publisher: CITY, tier: 1, format: 'html', snapshot: snapshotPath('assembly-union-park')},
    {url: `${FACILITY_BASE}/mattocks-park`, publisher: CITY, tier: 1, format: 'html', snapshot: snapshotPath('mattocks-park')},
    {url: LAYER_URL, publisher: 'City of Saint Paul (CityofSaintPaul_BI)', tier: 2, format: 'json', snapshot: 'data/sources/saint-paul-pickleball-layer.json'},
    {url: CENSUS_URL, publisher: 'US Census Bureau', tier: 1, format: 'json', snapshot: 'data/sources/saint-paul-county-census.json'},
  ].map((s, i) => ({id: `S${i + 1}`, ...s})),
  totals: {venues: VENUES.length, courts: totalCourts, outdoor: totalCourts, indoor: 0},
  excluded: EXCLUDED.map(e => ({name: e.name, why: e.reasons})),
  layer_only_sites: LAYER_ONLY,
  venues: overlay,
}, null, 2) + '\n')

const changed = changes.filter(r =>
  r.old_value !== null && r.old_value !== undefined && String(r.old_value) !== String(r.new_value))

writeFileSync(join(REPO_ROOT, 'reports', 'saint-paul-conflicts.md'), [
  '# Saint Paul verification - a city with no list, and two records that disagree', '',
  `Run ${RETRIEVED_AT}. ${VENUES.length} venues published, ${totalCourts} courts, all outdoor. 2 venues refused.`, '',
  'Saint Paul is the first city in this directory that publishes no list of its pickleball venues.',
  'Its pickleball page links an interactive map and a PDF. The venue set here was assembled from the',
  "City's own pickleball GIS layer for candidate names, then verified one page at a time:", '',
  '| venue | courts | what the City writes | address |',
  '| --- | ---: | --- | --- |',
  ...VENUES.map(p => `| \`${p.slug}\` | ${p.courts} | "${p.spec}" | ${p.address} |`),
  '',
  '## The two records disagree, in both directions', '',
  'In the GIS layer, with no count on the facility page:', '',
  ...LAYER_ONLY.map(n => `- ${n}`),
  '',
  'On the facility pages with a count, absent from the GIS layer:', '',
  '- Clayland Park (2 courts)',
  '- Edgcumbe Recreation Center (4 courts)',
  '',
  'The facility pages decide what publishes here, because they are the ones that state a count. The',
  'layer is one point per court with no address and no number, and counting map points to produce a',
  'court total is the derivation this project falsified for Sacramento and will not repeat.',
  '',
  '## Refused', '',
  ...EXCLUDED.flatMap(e => [`**${e.name}** - "${e.spec}"`, '', ...e.reasons.map((r, i) => `${i + 1}. ${r}`), '']),
  '## Why every court here is outdoor', '',
  'Not by assumption. Edgcumbe and Duluth and Case are recreation centres whose amenity lists are',
  'split into "Indoor Amenities:" and "Outdoor Amenities:", and at both the pickleball line sits under',
  'Outdoor - which this run checks on every build rather than remembering. The four parks describe',
  'their courts as striping on tennis courts, and the City\'s pickleball page ties that to outdoor in',
  'as many words.',
  '',
  changed.length ? '## Values a source changed' : '_No imported row was overwritten._',
  ...(changed.length ? [
    '', '| venue | field | was | now | outcome |', '| --- | --- | --- | --- | --- |',
    ...changed.map(r => `| \`${r.venue_slug}\` | ${r.field} | ${JSON.stringify(r.old_value)} | ${JSON.stringify(r.new_value)} | ${r.outcome} |`),
  ] : []),
  '',
].join('\n'))

console.log(`\nSaint Paul, MN - ${VENUES.length} venues, ${totalCourts} courts (all outdoor), retrieved ${RETRIEVED_AT}`)
for (const p of VENUES) {
  const o = overlay[p.slug]
  console.log(`  ${o.patch.name.padEnd(36)} ${String(o.patch.total_courts).padStart(2)} | ${o.patch.venue_type.padEnd(17)} | ${o.patch.county} County`)
}
console.log(`\n  refused: ${EXCLUDED.map(e => e.name).join(', ')}`)
console.log(`  in the City's map layer with no count on their page: ${LAYER_ONLY.length} more sites`)
console.log('\nWrote data/verified/saint-paul-mn.json and reports/saint-paul-conflicts.md\n')
