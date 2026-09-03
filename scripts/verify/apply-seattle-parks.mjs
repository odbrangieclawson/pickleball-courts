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
import {mapRow} from '../import/mapper.mjs'

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
  {
    slug: 'seattle-miller-playfield-pickleball-courts-capitol-hill',
    park: 'Miller Playfield',
    pma: 373,
    basis: 'Same site. The Parks record names it PENDLETON MILLER PLAYFIELD at 330 19th Ave E, the address the imported row already carries. NOT matched to the separate "Miller Community Center" row, which is the indoor building on the same block and is a different venue.',
  },
  {
    slug: 'seattle-alki-playground-pickleball-and-tennis-courts',
    park: 'Alki Playground',
    pma: 446,
    basis: 'Same site, same name, and the imported address 5817 SW Lander St matches the Parks record exactly.',
  },
  {
    slug: 'seattle-brighton-playfield-seattle-wa',
    park: 'Brighton Playfield',
    pma: 402,
    basis: 'Same site, same name, and the imported address 6000 39th Ave S matches the Parks record exactly.',
  },
  {
    slug: 'green-lake-pickleball-courts-seattle',
    park: 'Green Lake Park (East Courts)',
    pma: 307,
    basis: 'The only pickleball courts Seattle Parks records at Green Lake Park, and the only Green Lake row in the import. The municipal record is specific about WHICH courts (East); the imported row is not, so the municipal name describes the same courts more precisely.',
  },
  {
    slug: 'seattle-laurelhurst-pickleball-court-seattle-wa',
    park: 'Laurelhurst Playfield',
    pma: 340,
    basis: 'Same site. Both describe a single pickleball court at Laurelhurst. The imported address is wrong by two blocks and is corrected below.',
  },
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
const addrByPma = new Map()
for (const f of s2.features) {
  const a = f.attributes
  if (a.ADDRESS && !addrByPma.has(a.PMA)) addrByPma.set(a.PMA, a)
}

const county = JSON.parse(readFileSync(join(REPO_ROOT, 'reports/county-per-row.json'), 'utf8'))
const allRows = loadRows().map(r => mapRow(r).venue)
allRows.forEach((v, i) => { v.county = county[i].needs_review ? null : county[i].county })
const bySlug = new Map(allRows.map(v => [v.slug, v]))

const overlay = {}
const allChanges = []

for (const m of MATCHES) {
  const venue = bySlug.get(m.slug)
  if (!venue) throw new Error(`No imported row with slug ${m.slug}`)
  const pb = pbByName.get(m.park)
  if (!pb) throw new Error(`No municipal pickleball record named "${m.park}"`)
  const addr = addrByPma.get(m.pma)
  if (!addr) throw new Error(`No Parks address record for PMA ${m.pma}`)

  const n = courts(pb.NUMBEROFCOURTS)
  const outdoor = pb.INDOOROUTDOOR === 'Outdoor'
  const ev = `Pickleball Courts layer, PARKNAME="${pb.PARKNAME}": NUMBEROFCOURTS="${pb.NUMBEROFCOURTS}", INDOOROUTDOOR="${pb.INDOOROUTDOOR}", LIGHTED="${pb.LIGHTED}", NETS="${pb.NETS}"`

  const facts = [
    doc1.fact('total_courts', n, {evidence: ev}),
    doc1.fact('indoor_courts', outdoor ? 0 : n, {evidence: ev}),
    doc1.fact('outdoor_courts', outdoor ? n : 0, {evidence: ev}),
    doc1.fact('light', tri(pb.LIGHTED), {evidence: ev}),
    doc1.fact('nets_provided', tri(pb.NETS), {evidence: ev}),
    doc1.fact('restroom', restroomOf(pb.NEARBYRESTROOM), {evidence: `NEARBYRESTROOM="${pb.NEARBYRESTROOM}"`}),
    doc1.fact('parking', pb.PARKING && pb.PARKING !== '-' ? pb.PARKING : null, {evidence: `PARKING="${pb.PARKING}"`}),
    doc1.fact('venue_type', 'public_park', {evidence: `Published by Seattle Parks and Recreation as a park facility; Parks record OWNER="${addr.OWNER}"`}),
    doc2.fact('street_address', addr.ADDRESS, {evidence: `Parks layer PMA=${addr.PMA}, NAME="${addr.NAME}", ADDRESS="${addr.ADDRESS}"`}),
  ]

  const res = applyFacts(venue, facts)
  overlay[m.slug] = {
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
