#!/usr/bin/env node
/*
  Seattle verification run, tier 2 of the source ladder.

  This is the first script in the repo that turns pending rows into verified
  ones. It exists because Phase 3 cannot close without it: Gate 1 needs 3+
  verified venues and the imported dataset supplies zero.

  ============================================================
  THE SOURCES, AND WHY THEY QUALIFY
  ============================================================

  Both are ArcGIS feature services published by SeattleParks_SeattleCityGIS,
  the GIS account of Seattle Parks and Recreation - the department that
  operates these courts. That makes them tier 2 on the ladder (same
  publisher as tier 1, machine-readable), earning verified_by =
  municipal_source.

  S1  Pickleball Courts        court counts, indoor/outdoor, lights, nets,
                               nearby restroom, parking
      Item 8797fa8b94074b3888c97e0fe64e38a2, last edited 2026-08-31.

  S2  Park Boundary (details)  street addresses
      Item 94e59cd6e7a6479c9131cc3eb40b29b8, Parks layer.

  Tier 1 was tried first and did not yield. seattle.gov's own pickleball
  page renders its court list with JavaScript, so a fetch returns a shell
  with no locations in it. That is worth recording rather than hiding: the
  city fails the same JS-off test this project's Gate 2 enforces, which is
  exactly why the machine-readable tier sits below it on the ladder.

  A snapshot of each response is committed under data/sources/ so every fact
  below can be audited without re-fetching, and so a later change at the
  city's end shows up as a diff rather than a silent correction.

  ============================================================
  WHY THE MATCHES ARE A HARD-CODED TABLE
  ============================================================

  Fuzzy name matching deciding which municipal record describes which
  imported row would be the most dangerous code in this repo. "Miller
  Playfield" and "Miller Community Center" share an address; "Rainier Beach
  Playfield" and "Rainier Beach Community Center" do not describe the same
  courts. A wrong match writes a real court count onto the wrong venue, and
  the page then states it with a municipal source attached.

  So the match is a human decision, recorded with its basis, and the script
  refuses to guess. Adding a venue means adding a row to MATCHES.

  ============================================================
  WHAT THIS RUN DELIBERATELY DOES NOT DO
  ============================================================

  fee_type is left null on every venue. Neither source states a fee, and the
  tier-1 page that does state one could not be read. Decision D6: a null
  renders "Not verified yet", never a guess. These courts are almost
  certainly free to play - that belief is not a source, so it is not
  recorded, and the /free/ filter will not list them until it is.
*/

import {readFileSync, writeFileSync, mkdirSync} from 'node:fs'
import {join} from 'node:path'
import {SourceDocument} from './provenance.mjs'
import {applyFacts, changelogToRows} from './conflict.mjs'
import {loadRows, REPO_ROOT} from '../lib/load-csv.mjs'
import {PUBLISHED_FACT_FIELDS} from '../../lib/data/verified.mjs'
import {mapRow} from '../import/mapper.mjs'
import {loadIdentity} from '../../lib/data/identity.mjs'

/* The date these sources were READ. Not the date they were published. */
const RETRIEVED_AT = process.env.RETRIEVED_AT ?? '2026-09-03'

const S1_URL = 'https://services.arcgis.com/ZOyb2t4B0UYuYNYH/arcgis/rest/services/Pickleball_Courts/FeatureServer/0'
const S2_URL = 'https://services.arcgis.com/ZOyb2t4B0UYuYNYH/arcgis/rest/services/Park_Boundary_(details)/FeatureServer/2'
const PUBLISHER = 'Seattle Parks and Recreation (SeattleParks_SeattleCityGIS)'

/*
  venue slug -> which municipal records describe it, and why that match is
  believed. `basis` is prose on purpose: a reviewer must be able to disagree
  with it without reading code.
*/
const MATCHES = [
  /* ---- matched to an imported row (address agreement unless noted) ---- */
  {
    slug: 'seattle-miller-playfield-pickleball-courts-capitol-hill',
    park: 'Miller Playfield',
    pma: 373,
    basis: 'Same site. The Parks record names it PENDLETON MILLER PLAYFIELD at 330 19th Ave E, the address the imported row already carries. NOT matched to the separate "Miller Community Center" row, which is the indoor building on the same block and is a different venue.',
  },
  {slug: 'seattle-alki-playground-pickleball-and-tennis-courts', park: 'Alki Playground', pma: 446,
   basis: 'Same name, and the imported address 5817 SW Lander St matches the Parks record exactly.'},
  {slug: 'seattle-brighton-playfield-seattle-wa', park: 'Brighton Playfield', pma: 402,
   basis: 'Same name, and the imported address 6000 39th Ave S matches the Parks record exactly.'},
  {
    slug: 'green-lake-pickleball-courts-seattle',
    park: 'Green Lake Park (East Courts)',
    pma: 307,
    basis: 'The only pickleball courts Seattle Parks records at Green Lake Park, and the only Green Lake row in the import. The municipal record is specific about WHICH courts (East); the imported row is not, so the municipal name describes the same courts more precisely.',
  },
  {slug: 'seattle-laurelhurst-pickleball-court-seattle-wa', park: 'Laurelhurst Playfield', pma: 340,
   basis: 'Same site, both a single court at Laurelhurst. The imported address is wrong by two blocks and is corrected.'},
  {slug: 'seattle-discovery-park-tennis-and-pickleball-courts', park: 'Discovery Park', pma: 310,
   basis: 'Address 3801 Discovery Park Blvd matches the Parks record exactly.'},
  {slug: 'seattle-beacon-hill-playground-tennis-courts-seattle-wa', park: 'Beacon Hill Park', pma: 400,
   basis: 'Address 1902 13th Ave S matches the Parks record exactly. The Parks record names it BEACON HILL PLAYGROUND; the pickleball layer calls the same site "Beacon Hill Park".'},
  {slug: 'seattle-observatory-courts-queen-anne-seattle-wa', park: 'Observatory Courts', pma: 322,
   basis: 'Same name, address 1405 Warren Ave N matches the Parks record.'},
  {
    slug: 'bitter-lake-pickleball-and-tennis-courts',
    park: 'Bitter Lake Playfield',
    pma: 288,
    basis: 'The OUTDOOR courts row, not the "Bitter Lake Community Center" row. The community centre row records 3 indoor courts and is the building; this municipal record is 8 outdoor courts under lights, which is the playfield. They share a campus and are not the same venue.',
  },
  {slug: 'seattle-georgetown-playfield-tennis-and-pickleball-courts', park: 'Georgetown Playfield', pma: 410,
   basis: 'Address 750 S Homer St matches the Parks record exactly.'},
  {slug: 'seattle-dearborn-park-seattle-wa', park: 'Dearborn Park', pma: 408,
   basis: 'Address 2919 S Brandon St matches the Parks record exactly.'},
  {
    slug: 'seattle-south-park-playground-tennis-and-pickleball-courts',
    park: 'South Park Playground',
    pma: 467,
    basis: 'Same named site. The imported address (8319 8th Ave S) and the Parks record (738 S Sullivan St) disagree; the Parks record is the property owner describing its own parcel, so it wins and the address is corrected.',
  },
  {slug: 'seattle-gilman-playground-pickleball-and-tennis-courts', park: 'Gilman Playground', pma: 242,
   basis: 'Address 923 NW 54th St matches the Parks record exactly.'},
  {slug: 'delridge-pickleball-and-tennis-courts', park: 'Delridge Playfield', pma: 450,
   basis: 'Same site on Delridge Way SW; the imported street number is off by a block and is corrected. NOT the "Delridge Community Center" indoor row.'},
  {
    slug: 'seattle-kinnear-park-queen-anne-seattle-wa',
    park: 'Kinnear Park',
    pma: 314,
    addressFix: '899 W Olympic Pl',
    basis: 'Same name, same site. The Parks record gives the street as "899 W Olumpic Pl", which is a typo for Olympic Place in the municipal data itself. Publishing it verbatim would republish a misspelled street name as a verified fact, so the spelling is corrected and the correction is recorded here rather than made silently. Same treatment as the "Greenwod" park name.',
  },
  {slug: 'seattle-montlake-playfield-multisport-court-seattle-wa', park: 'Montlake Playfield', pma: 376,
   basis: 'Address 1618 E Calhoun St matches the Parks record exactly. Both describe a single shared-use court.'},
  {
    slug: 'seattle-rainier-beach-playfield-seattle-wa',
    park: 'Rainier Beach Playfield',
    pma: 422,
    basis: 'The PLAYFIELD row, not the "Rainier Beach Community Center" row. The imported playfield row already records 8 outdoor courts, which is exactly what the municipal record states. The community centre row records 3 indoor courts and is a different venue.',
  },
  {slug: 'seattle-soundview-playfield-tennis-and-pickleball-courts', park: 'Soundview Playfield', pma: 251,
   basis: 'Address 1590 NW 90th St matches the Parks record exactly.'},
  {slug: 'seattle-lakeridge-playfield-pickleball-and-badminton-courts', park: 'Lakeridge Park', pma: 3972,
   basis: 'Address 10145 Rainier Ave S matches the Parks record exactly.'},
  {slug: 'seattle-mount-baker-pickleball-and-tennis-courts-seattle-wa', park: 'Mt. Baker Park', pma: 419,
   basis: 'Same site on Lake Park Dr S; the imported row has the street with no number, and the Parks record supplies 2521.'},

  /* ---- no imported row exists: minted from the municipal source alone ---- */
  {slug: 'maple-leaf-reservoir-park-pickleball-courts-seattle', park: 'Maple Leaf Reservoir Park', pma: 3881, mint: true,
   basis: 'Seattle Parks records dedicated pickleball courts here. The import has no row for it at all.'},
  {slug: 'west-magnolia-playfield-pickleball-courts-seattle', park: 'West Magnolia Playfield', pma: 319, mint: true,
   basis: 'No imported row. Deliberately NOT matched to "Magnolia Community Center", which is the indoor building nearby with 3 indoor courts.'},
  {slug: 'walt-hundley-playfield-pickleball-courts-seattle', park: 'Walt Hundley Playfield', pma: 3941, mint: true,
   basis: 'No imported row. Deliberately NOT matched to "High Point Community Center", which shares the 6920 34th Ave SW address but is the indoor building.'},
  {slug: 'greenwood-park-pickleball-courts-seattle', park: 'Greenwod Park', pma: 4408, mint: true, displayName: 'Greenwood Park',
   basis: 'No imported row. The pickleball layer misspells the park as "Greenwod"; the Parks record for the same parcel spells it GREENWOOD PARK, and that spelling is used for the name.'},

  /*
    EXCLUDED: "5th & Taylor Ave (SDOT)", 2 courts.

    A Seattle Department of Transportation street-end court, so it has no
    Parks PMA and therefore no address in the Parks layer, and no imported
    row to borrow one from. Import Gate I1 requires a street_address. Rather
    than compose one from the intersection in its name, it is left out. It
    is a real venue and belongs on the site the day a source states its
    address.
  */
]

/* ---------------------------------------------------------------- */

/* "-" and empty mean the source was silent, which is null, not false. */
const tri = v => (v === 'Yes' ? true : v === 'No' ? false : null)

const courts = v => {
  const n = Number.parseInt(String(v ?? '').trim(), 10)
  return Number.isFinite(n) && n > 0 ? n : null
}

const restroomOf = v => (!v || v === '-' ? null : v === 'No' ? false : true)

const s1 = JSON.parse(readFileSync(join(REPO_ROOT, 'data/sources/seattle-parks-pickleball-courts.arcgis.json'), 'utf8'))
const s2 = JSON.parse(readFileSync(join(REPO_ROOT, 'data/sources/seattle-parks-boundary-details.arcgis.json'), 'utf8'))

const doc1 = new SourceDocument({url: S1_URL, retrieved_at: RETRIEVED_AT, tier: 2, publisher: PUBLISHER, format: 'arcgis'})
const doc2 = new SourceDocument({url: S2_URL, retrieved_at: RETRIEVED_AT, tier: 2, publisher: PUBLISHER, format: 'arcgis'})

const pbByName = new Map(s1.features.map(f => [f.attributes.PARKNAME, f.attributes]))
const pbGeom = new Map(s1.features.map(f => [f.attributes.PARKNAME, f.geometry ?? null]))
const addrByPma = new Map()
for (const f of s2.features) {
  const a = f.attributes
  if (a.ADDRESS && !addrByPma.has(a.PMA)) addrByPma.set(a.PMA, a)
}

/*
  The canonical slug registry. It has to be recorded in the overlay, because
  a venue built from the overlay alone never passes through applyIdentity
  and would otherwise keep its imported slug — giving one set of URLs when
  data.csv is present and a different set when it is not. That silent fork
  cost twenty venue pages the first time CI built without the CSV.
*/
const identityRegistry = loadIdentity(REPO_ROOT)

const county = JSON.parse(readFileSync(join(REPO_ROOT, 'reports/county-per-row.json'), 'utf8'))
const allRows = loadRows().map(r => mapRow(r).venue)
allRows.forEach((v, i) => { v.county = county[i].needs_review ? null : county[i].county })
const bySlug = new Map(allRows.map(v => [v.slug, v]))

const overlay = {}
const allChanges = []

/*
  A venue the import never had. Everything factual about it comes from the
  two municipal sources below; this only supplies the identity shell the
  facts attach to, with every fact field null so applyFacts is the sole
  writer.

  county is King for all of these. Seattle lies wholly within King County,
  which is the same Census county reference the Phase 1 backfill uses -
  data/reference/2023_Gaz_counties_national.txt - rather than a guess.
*/
function mintVenue(slug, park, pb) {
  const shell = {
    slug, name: park, city: 'Seattle', state: 'WA', county: 'King',
    postal_code: null, street_address: null,
    latitude: null, longitude: null,
    status: 'pending', source_url: null, date_checked: null, verified_by: null,
    claimed_by_owner: false, claim_date: null,
    rating: null, user_rating: null, review_count: null, claimed_or_verified: null,
    source_sport: 'pickleball',
  }
  for (const f of PUBLISHED_FACT_FIELDS) shell[f] = null
  return shell
}

for (const m of MATCHES) {
  const pbRec = pbByName.get(m.park)
  const venue = m.mint
    ? mintVenue(m.slug, (addrByPma.get(m.pma)?.NAME ?? m.park), pbRec)
    : bySlug.get(m.slug)
  if (!venue) throw new Error(`No imported row with slug ${m.slug}`)
  const pb = pbRec
  if (!pb) throw new Error(`No municipal pickleball record named "${m.park}"`)
  const addr = addrByPma.get(m.pma)
  if (!addr) throw new Error(`No Parks address record for PMA ${m.pma}`)

  const n = courts(pb.NUMBEROFCOURTS)
  const outdoor = pb.INDOOROUTDOOR === 'Outdoor'
  const ev = `Pickleball Courts layer, PARKNAME="${pb.PARKNAME}": NUMBEROFCOURTS="${pb.NUMBEROFCOURTS}", INDOOROUTDOOR="${pb.INDOOROUTDOOR}", LIGHTED="${pb.LIGHTED}", NETS="${pb.NETS}"`

  const facts = [
    /*
      The venue NAME comes from the source too.

      The imported names are the city stamped onto a description -
      "Seattle - Laurelhurst Pickleball Court", "Seattle - Miller Playfield
      Pickleball Courts (Capitol Hill)". Fed into the venue title formula
      those produce "Seattle - Laurelhurst Pickleball Court - Pickleball
      Courts in Seattle, WA": 73 characters, the city twice, the sport
      twice. The title assembler refuses it rather than truncating, which is
      how this surfaced.

      Seattle Parks names its own parks, so the fix is the same as every
      other field: take the name from the source. displayName overrides it
      only where the pickleball layer has a typo the Parks layer does not.
    */
    doc1.fact('name', m.displayName ?? pb.PARKNAME, {
      evidence: `Pickleball Courts layer PARKNAME="${pb.PARKNAME}"` +
        (m.displayName ? `; spelling corrected against the Parks layer NAME="${addr.NAME}"` : ''),
    }),
    doc1.fact('total_courts', n, {evidence: ev}),
    doc1.fact('indoor_courts', outdoor ? 0 : n, {evidence: ev}),
    doc1.fact('outdoor_courts', outdoor ? n : 0, {evidence: ev}),
    doc1.fact('light', tri(pb.LIGHTED), {evidence: ev}),
    doc1.fact('nets_provided', tri(pb.NETS), {evidence: ev}),
    doc1.fact('restroom', restroomOf(pb.NEARBYRESTROOM), {evidence: `NEARBYRESTROOM="${pb.NEARBYRESTROOM}"`}),
    doc1.fact('parking', pb.PARKING && pb.PARKING !== '-' ? pb.PARKING : null, {evidence: `PARKING="${pb.PARKING}"`}),
    doc1.fact('venue_type', 'public_park', {evidence: `Published by Seattle Parks and Recreation as a park facility; Parks record OWNER="${addr.OWNER}"`}),
    doc2.fact('street_address', m.addressFix ?? addr.ADDRESS, {evidence: `Parks layer PMA=${addr.PMA}, NAME="${addr.NAME}", ADDRESS="${addr.ADDRESS}"`}),
    /*
      County. The Phase 1 backfill derives county from postal_code and flags
      the ambiguous ones for review - Lakeridge came back low-confidence and
      was therefore refused by Import Gate I3. It does not need deriving
      here: the Parks record establishes the parcel is City of Seattle parks
      property, and Seattle lies wholly inside King County per the Census
      county file already in data/reference/.
    */
    doc2.fact('county', 'King', {evidence: `Parks layer PMA=${addr.PMA} is City of Seattle parks property (OWNER="${addr.OWNER}"); the City of Seattle lies wholly within King County`}),
  ]

  const res = applyFacts(venue, facts)
  overlay[m.slug] = {
    minted: !!m.mint,
    /*
      IDENTITY IS WRITTEN FOR EVERY VENUE, not only the minted ones.

      It used to be minted-only, which quietly made the published site
      depend on data.csv: twenty of these venues took their city, state,
      coordinates and postcode from the imported row at build time. data.csv
      is 7.8 MB of unsourced commercial records and is gitignored on
      purpose, so CI could never build the site at all — it failed on the
      first run for exactly this reason.

      Recording identity here makes the verified set self-contained. The
      published directory is then buildable from data/verified/,
      data/editorial/ and data/sources/ alone, all of which are committed
      and small. The 18,037-row CSV goes back to being what it always should
      have been: a staging pile for import and triage, not a build
      dependency for twenty-four published pages.
    */
    identity: {
      name: venue.name,
      city: venue.city,
      state: venue.state,
      county: venue.county,
      postal_code: venue.postal_code ?? null,
      latitude: venue.latitude ?? pbGeom.get(m.park)?.y ?? null,
      longitude: venue.longitude ?? pbGeom.get(m.park)?.x ?? null,
      imported_slug: m.mint ? null : m.slug,
      canonical_slug: identityRegistry.renames[m.slug]?.canonical ?? m.slug,
    },
    match: {park: m.park, pma: m.pma, basis: m.basis},
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
  allChanges.push(...changelogToRows(m.slug, res.changelog))
}

mkdirSync(join(REPO_ROOT, 'data/verified'), {recursive: true})
writeFileSync(join(REPO_ROOT, 'data/verified/seattle-wa.json'), JSON.stringify({
  city: 'Seattle',
  state: 'WA',
  retrieved_at: RETRIEVED_AT,
  sources: [
    {id: 'S1', url: S1_URL, publisher: PUBLISHER, tier: 2, format: 'arcgis', snapshot: 'data/sources/seattle-parks-pickleball-courts.arcgis.json'},
    {id: 'S2', url: S2_URL, publisher: PUBLISHER, tier: 2, format: 'arcgis', snapshot: 'data/sources/seattle-parks-boundary-details.arcgis.json'},
  ],
  venues: overlay,
}, null, 2) + '\n')

/* The conflict log. Every value the municipal source overwrote. */
const changed = allChanges.filter(r =>
  r.old_value !== null && r.old_value !== undefined && String(r.old_value) !== String(r.new_value))

const lines = [
  '# Seattle verification — what the municipal source changed',
  '',
  `Run ${RETRIEVED_AT}. ${MATCHES.length} venues, tier 2, verified_by = municipal_source.`,
  '',
  'Policy: the municipal source wins. The imported rows carry no qualifying',
  'source at all — their `source_url` points at CourtSource, a competitor',
  'directory, which Import Gate I2 rejects by name. So every disagreement',
  'below is a sourced value replacing an unsourced one.',
  '',
  '| venue | field | imported | municipal | outcome |',
  '| --- | --- | --- | --- | --- |',
  ...changed.map(r => `| \`${r.venue_slug}\` | ${r.field} | ${JSON.stringify(r.old_value)} | ${JSON.stringify(r.new_value)} | ${r.outcome} |`),
  '',
  `**${changed.length} values changed** across ${MATCHES.length} venues.`,
  '',
]
writeFileSync(join(REPO_ROOT, 'reports/seattle-conflicts.md'), lines.join('\n'))

console.log(`\nSeattle verification run — ${MATCHES.length} venues, retrieved ${RETRIEVED_AT}`)
for (const m of MATCHES) {
  const o = overlay[m.slug]
  console.log(`  ${m.slug}`)
  console.log(`     ${o.patch.total_courts} courts (${o.patch.outdoor_courts} outdoor), lit=${o.patch.light}, nets=${o.patch.nets_provided}`)
  console.log(`     ${o.record.verified_by} / ${o.record.date_checked} / ${o.record.source_url}`)
}
console.log(`\n${changed.length} values overwritten. See reports/seattle-conflicts.md`)
console.log('Wrote data/verified/seattle-wa.json\n')
