#!/usr/bin/env node
/*
  Cary, NC verification run — city #3, and the second in Wake County.

  ============================================================
  WHY CARY
  ============================================================

  Same criterion as Raleigh: the operator STATES the court count. The Town
  of Cary does not publish one pickleball page with a table on it, the way
  Raleigh does — it states each count on the facility's own page, in a
  features list. So the counts here are quoted sentence by sentence:

    Ed Yerha Park          "Three pickleball courts"
    Carpenter Park         "Multi-Sport Courts: Basketball & 3 Pickleball Courts"
    McCrimmon Parkway      "Six Lighted Tennis Courts and Six Lighted Pickleball Courts"

  Cary is also in Wake County, which Raleigh already anchors, so this run
  roughly doubles what the Wake County page covers.

  ============================================================
  THE SNAPSHOTS ARE TEXT, NOT HTML, AND THAT IS RECORDED
  ============================================================

  carync.gov returns HTTP 403 to every scripted fetch we tried — curl and a
  plain client, with and without a full browser header set. The pages are
  public and load normally in a browser, so they were read in one and the
  extracted text is committed under data/sources/cary-parks/ with the URL
  and retrieval date at the head of each file.

  That is a weaker artefact than the byte-exact JSON snapshots Seattle and
  Raleigh have. It is written down in that directory's README rather than
  glossed over, and every fact below quotes the sentence it came from, so
  the claim and its wording travel together and a reader can re-open the
  page and compare.

  ============================================================
  TWO VENUES ARE DELIBERATELY NOT PUBLISHED
  ============================================================

  CARY TENNIS PARK. The town states "four lighted pickleball courts" there
  and it is the flagship — it hosts the PPA. It publishes no street address
  on any page we read, and Import Gate I1 requires one. Rather than geocode
  a guess or borrow an address from a directory, it waits. This is the same
  treatment Sacramento's Westshore Park and Seattle's SDOT street-end court
  got, and it costs us the best-known venue in the town, which is the point:
  the rule is not applied only when it is cheap.

  MIDDLE CREEK COMMUNITY CENTER. "Three (3) courts are available to rent" in
  the South Gym at $10 per hour per court. Indoor, and again no published
  street address. Same refusal.

  Both are recorded in data/sources/cary-parks/cary-tennis-park.txt so that
  the day an address is published, the work is already done.

  ============================================================
  WHAT THIS SET DOES NOT CLAIM
  ============================================================

  lights     Stated only at McCrimmon, whose own page heads the entry
             "Lighted Pickleball Courts". Ed Yerha and Carpenter say nothing
             about lighting for their courts, so both are null — not false.
             Carpenter's hours note mentions "lighted areas" in general,
             which is a statement about the park, not about its courts.
  surface    No page states one. Null everywhere.
  nets       No page states one. Null everywhere.
  fees       Cary publishes prices for indoor rentals and for Cary Tennis
             Park reservations, neither of which is one of these three
             venues. Nothing is said about the cost of walking up to these
             courts, so fee_type stays null rather than becoming "free".
  postal     Only McCrimmon's is known, and only because the Census address
             geocoder matched it. The other two pages give a street with no
             postcode, and the geocoder did not match either street as the
             town writes it.
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

const TOWN = 'Town of Cary, Parks, Recreation & Cultural Resources'
const CENSUS_URL = 'https://geocoding.geo.census.gov/geocoder/geographies'
const CARY_OPENDATA = 'https://data.townofcary.org/api/v2/catalog/datasets/parks-and-recreation-feature-map'

/*
  Identity, plus the exact sentence each fact is read out of. `quote` is not
  decoration: the snapshot is prose rather than a data file, so the run
  asserts that the sentence is still present before it will publish the
  number it contains. If the town rewords the page, this fails loudly
  instead of publishing a stale figure.
*/
const PARKS = [
  {
    slug: 'ed-yerha-park',
    name: 'Ed Yerha Park',
    file: 'ed-yerha-park',
    url: 'https://www.carync.gov/recreation-enjoyment/parks-greenways-environment/parks/ed-yerha-park',
    address: '1216 Jenks Carpenter Road',
    courts: 3,
    quote: 'Three pickleball courts',
    light: null,
    basis: 'No imported row. Formerly White Oak Park; the town renamed it for a former councilmember, and its own page still says so.',
  },
  {
    slug: 'carpenter-park',
    name: 'Carpenter Park',
    file: 'carpenter-park',
    url: 'https://www.carync.gov/recreation-enjoyment/parks-greenways-environment/parks/carpenter-park',
    address: '4420 Louis Stephens Drive',
    courts: 3,
    quote: 'Multi-Sport Courts: Basketball & 3 Pickleball Courts',
    light: null,
    basis: 'No imported row. The courts are multi-sport, shared with basketball, which the features list states outright.',
  },
  {
    slug: 'mccrimmon-park',
    /*
      The town uses two names for this park: "Neighborhood Park on McCrimmon
      Parkway" on the park's own page, and "McCrimmon Park" on the Cary
      Tennis Park page. Both are the town's own words. The shorter one is
      published because the longer produces a 70-character page title, and
      titles.mjs refuses to truncate mid-word rather than quietly emit a
      title over the 65-character limit. The full name is on the venue page.
    */
    name: 'McCrimmon Park',
    fullName: 'Neighborhood Park on McCrimmon Parkway',
    file: 'mccrimmon-parkway-park',
    url: 'https://www.carync.gov/recreation-enjoyment/parks-greenways-environment/parks/mccrimmon-parkway-park',
    address: '3870 Cary Glen Blvd',
    courts: 6,
    /*
      The count is on the Cary Tennis Park page's satellite list, not on the
      park's own page — the park page confirms the courts exist and are lit
      but gives no number. Both pages are the same publisher and both are
      snapshotted; the quote below is asserted against the file that holds it.
    */
    quoteFile: 'cary-tennis-park',
    quote: 'McCrimmon Park (3870 Cary Glen Blvd.)',
    countQuote: 'Six Lighted Tennis Courts and Six Lighted Pickleball Courts',
    light: true,
    lightQuote: 'Lighted Pickleball Courts: Non-reservable, first-come, first-served',
    basis: 'No imported row. The town calls this "Neighborhood Park on McCrimmon Parkway" on its own page and "McCrimmon Park" on the Cary Tennis Park page; the park\'s own name is used and the short form is treated as an alias.',
  },
]

/* ---------------------------------------------------------------- */

const read = f => readFileSync(join(REPO_ROOT, 'data/sources/cary-parks', `${f}.txt`), 'utf8')
const counties = JSON.parse(readFileSync(join(REPO_ROOT, 'data/sources/cary-county-census.json'), 'utf8'))

const identityRegistry = loadIdentity(REPO_ROOT)
const allRows = loadRows().map(r => mapRow(r).venue)
/* Scoped to this town: slugs repeat across cities. */
const bySlug = new Map(
  allRows.filter(v => v.city === 'Cary' && String(v.state).toUpperCase() === 'NC')
    .map(v => [v.slug, v]))

const overlay = {}
const changes = []

for (const p of PARKS) {
  const page = read(p.file)
  const countPage = p.quoteFile ? read(p.quoteFile) : page
  const county = counties[p.slug]
  if (!county) throw new Error(`No county lookup for ${p.slug}`)

  /*
    Assert every sentence before publishing anything from it. A prose
    snapshot has no schema to validate against, so this is the substitute:
    the run refuses to mint a fact whose wording it can no longer find.
  */
  const must = (haystack, needle, what) => {
    if (!haystack.includes(needle)) {
      throw new Error(`${p.slug}: the snapshot no longer contains the ${what} sentence "${needle}". Re-read the page before trusting this run.`)
    }
  }
  must(page, p.address, 'address')
  must(countPage, p.countQuote ?? p.quote, 'court count')
  if (p.quoteFile) must(countPage, p.quote, 'venue-identifying')
  if (p.lightQuote) must(page, p.lightQuote, 'lighting')

  const doc = new SourceDocument({
    url: p.url, retrieved_at: RETRIEVED_AT, tier: 1, publisher: TOWN, format: 'html',
  })
  const docCount = p.quoteFile
    ? new SourceDocument({
      url: 'https://www.carync.gov/recreation-enjoyment/facilities/cary-tennis-park',
      retrieved_at: RETRIEVED_AT, tier: 1, publisher: TOWN, format: 'html',
    })
    : doc
  const docCensus = new SourceDocument({
    url: CENSUS_URL, retrieved_at: RETRIEVED_AT, tier: 1, publisher: 'US Census Bureau', format: 'json',
  })

  const shell = {
    slug: p.slug, name: null, city: 'Cary', state: 'NC', county: null,
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
      evidence: p.fullName
        ? `The town uses two names for this park: "${p.fullName}" on the park's own page and "${p.name}" on its Cary Tennis Park page. Both are the town's own words; the shorter is published because the longer overruns the 65-character page-title limit, and the full name is given on the venue page.`
        : `The park's own page on carync.gov is titled "${p.name}".`,
    }),
    docCount.fact('total_courts', p.courts, {
      evidence: `Quoted from the town's page: "${p.countQuote ?? p.quote}".` +
        (p.quoteFile ? ` Listed there under "${p.quote}", in the Cary Tennis Park satellite court list; the park's own page confirms the courts exist but states no number.` : ''),
    }),
    /*
      Outdoor. Every one of these is a court in a public park with hours of
      "sunrise to sunset", which is not a thing an indoor court has. The
      town does not use the word "outdoor" for them, so the evidence says
      what it is actually resting on rather than implying a quotation.
    */
    doc.fact('outdoor_courts', p.courts, {
      evidence: `Open-air courts in a public park; the page gives the park's hours as sunrise to sunset and lists the courts among outdoor features. The town does not use the word "outdoor" here, so this reads the setting rather than quoting a label. indoor_courts is left unverified rather than set to zero.`,
    }),
    doc.fact('street_address', p.address, {
      evidence: `The address printed at the head of the park's own page: "${p.address}".`,
    }),
    doc.fact('venue_type', 'public_park', {
      evidence: `Published by the ${TOWN} among its parks.`,
    }),
    docCensus.fact('county', county.county, {
      evidence: `${county.county} County, NC (FIPS ${county.state_fips}${county.county_fips}). ${county.basis}`,
    }),
  ]

  if (p.light === true) {
    facts.push(doc.fact('light', true, {
      evidence: `The park's features list heads the entry "${p.lightQuote}".`,
    }))
  }
  if (String(county.restroom).toLowerCase() === 'yes') {
    facts.push(new SourceDocument({
      url: CARY_OPENDATA, retrieved_at: RETRIEVED_AT, tier: 2, publisher: 'Town of Cary open data', format: 'json',
    }).fact('restroom', true, {
      evidence: `Town of Cary parks and recreation feature map, restroom = "Yes" for this park. The park's own page lists restrooms among its features.`,
    }))
  }

  const res = applyFacts(venue, facts)

  overlay[p.slug] = {
    minted: !bySlug.has(p.slug),
    identity: {
      name: p.name,
      city: 'Cary',
      state: 'NC',
      county: county.county,
      postal_code: county.postal_code ?? null,
      latitude: county.lat ?? null,
      longitude: county.lon ?? null,
      imported_slug: bySlug.has(p.slug) ? p.slug : null,
      canonical_slug: identityRegistry.renames[p.slug]?.canonical ?? p.slug,
    },
    match: {source_page: p.url, quote: p.countQuote ?? p.quote, basis: p.basis},
    patch: Object.fromEntries(facts.map(f => [f.field, f.value])),
    provenance: res.provenance,
    record: {source_url: res.venue.source_url, date_checked: res.venue.date_checked, verified_by: res.venue.verified_by},
    needs_recheck: res.needs_recheck,
    recheck: res.recheck,
  }
  changes.push(...changelogToRows(p.slug, res.changelog))
}

mkdirSync(join(REPO_ROOT, 'data/verified'), {recursive: true})
writeFileSync(join(REPO_ROOT, 'data/verified/cary-nc.json'), JSON.stringify({
  city: 'Cary', state: 'NC', retrieved_at: RETRIEVED_AT,
  method_note: 'Court counts are STATED by the Town of Cary on each facility\'s own page, and this run asserts that the exact sentence is still present in the snapshot before publishing the number it contains. Snapshots are extracted page text rather than raw HTML because carync.gov refuses scripted fetches; see data/sources/cary-parks/README.md. Cary Tennis Park and Middle Creek Community Center are excluded despite stated court counts, because neither publishes a street address and Import Gate I1 requires one.',
  sources: [
    {id: 'S1', url: 'https://www.carync.gov/recreation-enjoyment/parks-greenways-environment/parks', publisher: TOWN, tier: 1, format: 'html', snapshot: 'data/sources/cary-parks/'},
    {id: 'S2', url: 'https://www.carync.gov/recreation-enjoyment/facilities/cary-tennis-park', publisher: TOWN, tier: 1, format: 'html', snapshot: 'data/sources/cary-parks/cary-tennis-park.txt'},
    {id: 'S3', url: CARY_OPENDATA, publisher: 'Town of Cary open data', tier: 2, format: 'json', snapshot: 'data/sources/cary-county-census.json'},
    {id: 'S4', url: CENSUS_URL, publisher: 'US Census Bureau', tier: 1, format: 'json', snapshot: 'data/sources/cary-county-census.json'},
  ],
  excluded: [
    {name: 'Cary Tennis Park', courts: 4, why: 'The town states "four lighted pickleball courts" but publishes no street address. Import Gate I1 requires one.'},
    {name: 'Middle Creek Community Center', courts: 3, why: 'Indoor rental courts, "Three (3) courts are available to rent". No published street address.'},
  ],
  venues: overlay,
}, null, 2) + '\n')

const changed = changes.filter(r =>
  r.old_value !== null && r.old_value !== undefined && String(r.old_value) !== String(r.new_value))

writeFileSync(join(REPO_ROOT, 'reports', 'cary-conflicts.md'), [
  '# Cary verification - what the town states, and what it does not', '',
  `Run ${RETRIEVED_AT}. ${PARKS.length} venues published, 2 excluded.`, '',
  '| venue | courts | quoted from the town |',
  '| --- | --- | --- |',
  ...PARKS.map(p => `| \`${p.slug}\` | ${p.courts} | "${p.countQuote ?? p.quote}" |`),
  '',
  '## Stated, but not published', '',
  '| venue | courts | why not |',
  '| --- | --- | --- |',
  '| Cary Tennis Park | 4 | No street address published anywhere we read. Gate I1 requires one. |',
  '| Middle Creek Community Center | 3 | Indoor rentals; no street address published. |',
  '',
  changed.length ? '## Values a source changed' : '_No imported row was overwritten: none of these venues was in the import._',
  ...(changed.length ? [
    '', '| venue | field | was | now | outcome |', '| --- | --- | --- | --- |',
    ...changed.map(r => `| \`${r.venue_slug}\` | ${r.field} | ${JSON.stringify(r.old_value)} | ${JSON.stringify(r.new_value)} | ${r.outcome} |`),
  ] : []),
  '',
].join('\n'))

console.log(`\nCary, NC - ${PARKS.length} venues, retrieved ${RETRIEVED_AT}`)
for (const p of PARKS) {
  const o = overlay[p.slug]
  console.log(
    `  ${o.patch.name.padEnd(38)} ${String(o.patch.total_courts).padStart(2)} courts` +
    ` | lights ${String(o.patch.light ?? 'not stated').padEnd(11)}` +
    ` | ${o.patch.county} County`)
}
console.log('\n  excluded: Cary Tennis Park (4 courts) and Middle Creek Community Center (3),')
console.log('            both stated by the town, neither with a published street address.')
console.log('\nWrote data/verified/cary-nc.json and reports/cary-conflicts.md\n')
