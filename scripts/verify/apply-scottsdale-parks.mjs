#!/usr/bin/env node
/*
  Scottsdale, AZ verification run — city #11, the first in Arizona, and the
  first city whose operator publishes how to share a court.

  ============================================================
  WHY SCOTTSDALE
  ============================================================

  Every other city in this directory answers "how many courts" and stops.
  Scottsdale answers the question a player actually has when they arrive and
  four people are already on court:

      "Court use by individuals and groups is limited to standard game
       format; first side scoring 11 points or leading by at least 2 points
       wins. This comes with a 30 minute time limit, at which time players
       should rotate off the court with any waiting players."

  and then answers the one they have before they set out:

      "Mornings are typically the busiest time for pickleball play at Cholla."

  A stated peak time. Eleven cities in, no operator had published one — the
  peak_hours slot on every city page so far has been written out of rules and
  inference because there was nothing else to write it from.

  ============================================================
  EVERY PUBLISHED COURT IS LIT; THREE OF FOUR ARE FREE
  ============================================================

  All four venues carry "outdoor lighted courts" on the City's pickleball
  page. Three of them also carry "They are free to use" on their own park
  pages, which makes Scottsdale the second city in this directory with any
  verified `free` at all — Portland was the first, and Portland only got
  there because it wrote the word down. Ashler Hills Park's own page lists
  "8 lighted pickleball courts" among the park's features and carries none
  of the prose the other three carry, so its price is simply not stated.

  ============================================================
  ASHLER HILLS PARK, ADDED 2026-09-04
  ============================================================

  It was refused when this city first published, because the Census address
  file has no record of 32220 N. 74th Way and the Census was then the only
  resolver Import Gate I1 had. The gate now consults OpenStreetMap where the
  Census has nothing, and accepts the answer only when it is address-level —
  a house number present and equal to the one asked for. OSM resolves this
  one to 32220 North 74th Way, Scottsdale, Maricopa County, so the venue and
  its eight lighted courts publish.

  Its park page still prints "Scottsdale, AZ 32220" — the street number in
  the postcode's place — and Thompson Peak Park's carries the same fault.
  Neither changes what is published, because postcodes come from a resolver,
  and both are still asserted so the defect stays on the record.

  ============================================================
  ONE OF FIVE IS STILL REFUSED
  ============================================================

  SCOTTSDALE COMMUNITY COLLEGE has six lighted courts that Scottsdale Parks
  and Recreation runs a free public drop-in programme on, and the geocoder
  places 9000 E Chaparral Rd in NO incorporated place at all. It is not
  inside Scottsdale city limits. The City operating a programme somewhere
  does not move that somewhere into the city, and publishing it under
  Scottsdale would put a venue on a city page it is not in — the same test
  that kept a THPRD set out of Beaverton and unincorporated Clark County
  addresses out of Vancouver.

  That leaves four venues, one above the threshold. Note what the second
  resolver did NOT do: it also finds Chandler's Tumbleweed and Arbuckle
  addresses, at street level with no house number, and the address-level
  rule refuses both — which is the test of whether a rule was written to
  reach a wanted answer.

  ============================================================
  ONE VENUE IS CLOSED RIGHT NOW
  ============================================================

  Thompson Peak Park's three courts are shut for resurfacing from 17 August
  to 11 September 2026, reopening on the 12th "weather permitting". This run
  was made on 4 September, so the venue publishes with its closure stated on
  its own page rather than published as if open.

  The run asserts the closure sentence is present. When the City takes it
  down the build fails, which is the correct behaviour: a directory carrying
  a stale closure is worse than one carrying none.

  ============================================================
  WHAT IS NOT CLAIMED
  ============================================================

  surface     Stated nowhere, which is ordinary. What Thompson Peak does say
              is that its courts were being RESURFACED in August 2026 — a
              fact about work, not about a material, so it goes in the
              availability note and not in the surface field.
  nets        Thompson Peak's entry reads "Three portable nets" beneath its
              court count. That is more than most cities say and still not
              an answer to who brings them, so nets_provided stays null on
              the same reasoning that left Bellevue's "portable nets" alone.
  parking     Not published for any of the four on the pages read here.
              (restroom IS published, on every park page's feature list, and
              was missed until 2026-09-04 for the reason mustFeature explains.)
  the price   Not stated at Ashler Hills Park. Its park page names the courts
  at Ashler   in its feature list and says nothing else about them - no cost,
              no rotation rule, no peak time. The other three say "They are
              free to use" in as many words.
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

const CITY = 'City of Scottsdale Parks and Recreation'
const PAGE = 'https://www.scottsdaleaz.gov/adult-sports/pickleball'
const PARK_BASE = 'https://www.scottsdaleaz.gov/parks/find-a-park'
const CENSUS_URL = 'https://geocoding.geo.census.gov/geocoder/geographies'
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'

/* The city-wide rules, from the pickleball page. */
const FIRST_COME =
  'Courts are available on a first come, first served basis. No reservation is required. No amplified sound is permitted at these locations.'

/* The rotation rule, repeated verbatim on each park page. */
const ROTATION =
  'Court use by individuals and groups is limited to standard game format; first side scoring 11 points or leading by at least'

const CLOSURE =
  'All pickleball courts at Thompson Peak Park will be closed Monday, Aug. 17 through Friday, Sept. 11, 2026, for resurfacing. Courts are expected to reopen Saturday, Sept. 12, weather permitting.'

const VENUES = [
  {
    /*
      Published from 2026-09-04, when Import Gate I1 gained a second address
      resolver. The Census address file has no record of 32220 N. 74th Way;
      OpenStreetMap resolves it to that house number in Scottsdale, Maricopa
      County. Its own park page lists "8 lighted pickleball courts" among the
      park's features - corroborating the count and the lighting - and carries
      none of the prose the other three do, so it publishes without the price
      and the sharing rule they state.
    */
    slug: 'ashler-hills-park', name: 'Ashler Hills Park', page: 'ashler-hills-park',
    address: '32220 N. 74th Way', courts: 8,
    spec: 'Eight outdoor lighted pickleball courts',
    feature: '8 lighted pickleball courts', restroomFeature: 'Restrooms',
    noParkProse: true,
    availability: "Eight lighted courts, first come and not reservable like every Scottsdale court. Its own park page lists \"8 lighted pickleball courts\" among the park's features, which corroborates the count and the lighting, but carries none of the prose the City's other three pickleball venues do - so the price and the sharing rule published for those three are simply not stated here.",
  },
  {
    slug: 'cholla-park', name: 'Cholla Park', page: 'cholla-park',
    address: '11320 E. Via Linda', courts: 8,
    spec: 'Eight outdoor lighted courts',
    feature: 'Eight Pickleball Courts (Lighted)', restroomFeature: 'Restroom',
    parkQuote: 'There are eight pickleball courts at Cholla Park, which are available for drop in public use and are not reservable. They are free to use, and are open from sunrise until 10:30 p.m. daily.',
    busiest: 'Mornings are typically the busiest time for pickleball play at Cholla.',
    availability: 'Eight lighted courts, drop-in and not reservable, on a first come, first served basis. Scottsdale publishes the sharing rule as well as the count: play is standard format to 11, win by 2, with a 30-minute time limit after which players "should rotate off the court with any waiting players". The City also states that mornings are typically the busiest time here.',
  },
  {
    slug: 'horizon-park', name: 'Horizon Park', page: 'horizon-park',
    address: '15444 N. 100th St.', courts: 10,
    spec: '10 outdoor lighted courts',
    feature: 'Ten Pickleball Courts (Lighted)', restroomFeature: 'Restrooms',
    parkQuote: 'There are ten pickleball courts at Horizon Park, which are available for drop in public use and are not reservable. They are free to use, and are open from sunrise until 10:30 p.m. daily.',
    busiest: 'Mornings are typically the busiest time for pickleball play at Horizon.',
    availability: 'Ten lighted courts — the largest count in Scottsdale — drop-in and not reservable, first come first served. The same sharing rule applies as at every Scottsdale court: standard game to 11, win by two, a 30-minute limit, then rotate off for anyone waiting. The City states that mornings are typically the busiest time here.',
  },
  {
    slug: 'thompson-peak-park', name: 'Thompson Peak Park', page: 'thompson-peak-park',
    address: '20199 N. 78th Pl.', courts: 3,
    spec: 'Three outdoor lighted courts',
    feature: 'Three Pickleball Courts (Lighted)', restroomFeature: 'Restrooms',
    parkQuote: 'There are three pickleball courts at Thompson Peak Park, which are available for drop in public use and are not reservable. They are free to use, and are open from sunrise until 10:30 p.m. daily.',
    busiest: 'Mornings are typically the busiest time for pickleball play at Thompson Peak.',
    closed: true,
    availability: 'CLOSED FOR RESURFACING at the time of checking: the City states that all pickleball courts here are shut from 17 August to 11 September 2026 and are expected to reopen on Saturday 12 September, weather permitting. When open: three lighted courts with three portable nets, drop-in and not reservable, first come first served, standard game to 11 with a 30-minute limit and rotation for waiting players. Mornings are typically the busiest time.',
  },
]

const EXCLUDED = [
  {
    name: 'Scottsdale Community College',
    spec: 'Six outdoor lighted pickleball courts',
    reasons: [
      'The Census geocoder places 9000 E Chaparral Rd in NO incorporated place: it is not inside Scottsdale city limits. Every venue in this directory must be inside the city it is published under, and a City-run programme at a site outside the city does not move the site.',
      'The courts belong to the college; Scottsdale Parks and Recreation runs a free public drop-in programme on them in partnership. That makes the operator relationship worth recording and does not change where the courts are.',
    ],
  },
]

/* ---------------------------------------------------------------- */

const snapshotPath = name => `data/sources/scottsdale/${name}.html`

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

const pickleballLines = linesOf(snapshotPath('pickleball'))

/*
  PER-VENUE BLOCKS ON THE PICKLEBALL PAGE.

  "Open sunrise to 10:30 p.m." appears four times on that page and the word
  "lighted" five. Asserting against the whole page would prove nothing about
  which venue a count or a lighting claim belongs to — the same reasoning
  that made Austin's run block-scoped, and the reason this is now how a
  repeated-string source gets read.
*/
const NAMES = [...VENUES.map(v => v.name), ...EXCLUDED.map(e => e.name)]
const blocks = new Map()
{
  const at = pickleballLines.findIndex(l => squeeze(l) === squeeze('Locations'))
  const seg = pickleballLines.slice(at < 0 ? 0 : at)
  const starts = []
  seg.forEach((line, i) => {
    const hit = NAMES.find(n => squeeze(line) === squeeze(n))
    if (hit && !starts.some(s => s.name === hit)) starts.push({name: hit, i})
  })
  const missing = NAMES.filter(n => !starts.some(s => s.name === n))
  if (missing.length) {
    throw new Error(
      `The Scottsdale pickleball page no longer names: ${missing.join(', ')}. Re-read it before trusting this run.`)
  }
  starts.sort((a, b) => a.i - b.i)
  starts.forEach((s, k) => {
    const end = k + 1 < starts.length ? starts[k + 1].i : seg.length
    blocks.set(s.name, seg.slice(s.i, end).join(' '))
  })
}

const inBlock = (name, needle) => squeeze(blocks.get(name)).includes(squeeze(needle))
const mustBlock = (name, needle, what) => {
  if (!inBlock(name, needle)) {
    throw new Error(`${name}: its block on the Scottsdale pickleball page no longer contains the ${what} text "${needle}".`)
  }
}

const parkText = name => squeeze(linesOf(snapshotPath(name)).join(' '))
const mustPark = (page, who, needle, what) => {
  if (!parkText(page).includes(squeeze(needle))) {
    throw new Error(`${who}: the ${page} park page no longer contains the ${what} text "${needle}".`)
  }
}

/*
  THE FEATURE LIST LIVES IN AN ATTRIBUTE, NOT IN THE TEXT

  Every Scottsdale park page carries its amenities in
  <ul class="parkFeatures" data-features="..."> and paints them in with
  JavaScript on DOMContentLoaded. linesOf() turns tags into newlines, so it
  never saw any of it, and the first reading of these pages concluded that
  Ashler Hills Park said nothing about pickleball. It says "8 lighted
  pickleball courts".

  That matters twice. It is a second, independent statement of the count and
  the lighting on each park's own page, and at Ashler Hills it is the only
  thing that park page says about pickleball at all - which is a different
  claim from the one this file made before, and a better one.
*/
const parkRaw = name => readFileSync(join(REPO_ROOT, snapshotPath(name)), 'utf8')
const mustFeature = (page, who, needle) => {
  const attr = (parkRaw(page).match(/data-features="([^"]*)"/) ?? [])[1]
  if (!attr) throw new Error(`${who}: the ${page} park page no longer carries a data-features list.`)
  if (!squeeze(attr).toLowerCase().includes(squeeze(needle).toLowerCase())) {
    throw new Error(`${who}: the ${page} park page's feature list no longer contains "${needle}". It reads: ${attr}`)
  }
}

/* The city-wide rule every venue's availability rests on. */
if (!squeeze(pickleballLines.join(' ')).includes(squeeze(FIRST_COME))) {
  throw new Error(`The Scottsdale pickleball page no longer states the first-come rule: "${FIRST_COME}"`)
}

/* The closure, asserted on both pages that carry it. */
mustBlock('Thompson Peak Park', 'Three outdoor lighted courts', 'court count')
mustPark('thompson-peak-park', 'thompson-peak-park', CLOSURE, 'closure')

/* The exclusion, asserted rather than assumed. */
for (const e of EXCLUDED) mustBlock(e.name, e.spec, 'excluded venue count')

/*
  The City's postcode defect, still recorded now that Ashler Hills publishes:
  its park page prints the street number where the postcode belongs, and so
  does Thompson Peak's. Published postcodes come from a resolver, so this
  changes nothing on the site - and somebody should know.
*/
mustPark('ashler-hills-park', 'ashler-hills-park', 'Scottsdale, AZ 32220', 'malformed postcode')

const counties = JSON.parse(
  readFileSync(join(REPO_ROOT, 'data/sources/scottsdale-county-census.json'), 'utf8'))

if (counties['scottsdale-community-college']?.place) {
  throw new Error(
    'Scottsdale Community College now geocodes into an incorporated place. The reason it is excluded has changed; revisit it.')
}

const identityRegistry = loadIdentity(REPO_ROOT)
const allRows = loadRows().map(r => mapRow(r).venue)
const bySlug = new Map(
  allRows.filter(v => v.city === 'Scottsdale' && String(v.state).toUpperCase() === 'AZ')
    .map(v => [v.slug, v]))

const overlay = {}
const changes = []

for (const p of VENUES) {
  mustBlock(p.name, p.address, 'street address')
  mustBlock(p.name, p.spec, 'court count and lighting')
  mustBlock(p.name, 'Open sunrise to 10:30 p.m.', 'hours')
  /* The park page's own statement of the same count, from its feature list. */
  mustFeature(p.page, p.slug, p.feature)
  mustFeature(p.page, p.slug, p.restroomFeature)
  if (p.noParkProse) {
    /* Asserted as an ABSENCE: the day this park page gains a pickleball
       section, its price and sharing rule become publishable and this venue
       needs re-reading rather than continuing to say they are unstated. */
    if (parkText(p.page).includes(squeeze('pickleball courts at'))) {
      throw new Error(`${p.slug}: its park page NOW carries pickleball prose. Re-read it: the price and the sharing rule may now be publishable.`)
    }
  } else {
    mustPark(p.page, p.slug, p.parkQuote, 'court count, cost and hours')
    mustPark(p.page, p.slug, ROTATION, 'rotation rule')
    mustPark(p.page, p.slug, p.busiest, 'peak time')
  }

  const geo = counties[p.slug]
  if (!geo?.matched) throw new Error(`${p.slug}: the Census geocoder did not match its address`)
  /*
    Resolver-agnostic. The Census writes "Scottsdale city" and OpenStreetMap
    writes "Scottsdale"; both mean inside Scottsdale, and geocode.mjs settles
    that comparison so no apply run has to guess at suffixes.
  */
  if (!geo.place_matches_city) {
    throw new Error(`${p.slug}: the resolver places this at "${geo.place}", not Scottsdale.`)
  }

  const doc = new SourceDocument({
    url: PAGE, retrieved_at: RETRIEVED_AT, tier: 1, publisher: CITY, format: 'html',
  })
  const docPark = new SourceDocument({
    url: `${PARK_BASE}/${p.page}`, retrieved_at: RETRIEVED_AT, tier: 1, publisher: CITY, format: 'html',
  })
  /*
    The geo document names the resolver that actually answered. Ashler Hills
    was resolved by OpenStreetMap because the Census address file has no
    record of it, and citing the Census for a fact the Census did not supply
    would be a false provenance in the one place this project cannot afford
    one.
  */
  const viaOSM = geo.resolver === 'osm'
  const docCensus = viaOSM
    ? new SourceDocument({
        url: NOMINATIM_URL, retrieved_at: RETRIEVED_AT, tier: 2,
        publisher: 'OpenStreetMap contributors (Nominatim)', format: 'json',
      })
    : new SourceDocument({
        url: CENSUS_URL, retrieved_at: RETRIEVED_AT, tier: 1, publisher: 'US Census Bureau', format: 'json',
      })

  const shell = {
    slug: p.slug, name: null, city: 'Scottsdale', state: 'AZ', county: null,
    postal_code: null, street_address: null, latitude: null, longitude: null,
    status: 'pending', source_url: null, date_checked: null, verified_by: null,
    claimed_by_owner: false, claim_date: null,
    rating: null, user_rating: null, review_count: null, claimed_or_verified: null,
    source_sport: 'pickleball',
  }
  for (const f of PUBLISHED_FACT_FIELDS) shell[f] = null
  const venue = bySlug.get(p.slug) ?? shell

  const facts = [
    doc.fact('name', p.name, {evidence: `Named "${p.name}" by the ${CITY} on its pickleball page and on the park's own page.`}),
    doc.fact('total_courts', p.courts, {
      evidence: `Quoted from the City's pickleball page, in this venue's own entry: "${p.spec}". Corroborated on the park's own page, which lists "${p.feature}" among the park's features` +
        (p.parkQuote ? ` and states: "${p.parkQuote}"` : ' and says nothing further about pickleball.'),
    }),
    doc.fact('outdoor_courts', p.courts, {
      evidence: `Both sources call these outdoor courts. The indoor count is left unverified rather than set to zero.`,
    }),
    doc.fact('street_address', p.address, {
      evidence: `"${p.address}" is the address the City prints beside this venue on its pickleball page.`,
    }),
    doc.fact('venue_type', 'public_park', {evidence: `Published by the ${CITY} among its parks.`}),
    doc.fact('light', true, {
      evidence: `This venue's entry on the City's pickleball page reads "${p.spec}" — the word "lighted" is part of the count itself. All four published Scottsdale venues carry it, and each park page repeats it in its own feature list.`,
    }),
    ...(p.noParkProse ? [] : [docPark.fact('fee_type', 'free', {
      evidence: `From the park's own page: "${p.parkQuote}" The City writes "They are free to use", which is a stated price rather than an assumption about municipal courts.`,
    })]),
    docPark.fact('restroom', true, {
      evidence: `The park's own page lists "${p.restroomFeature}" among the park's features, alongside "${p.feature}". Both live in the page's data-features attribute, which is why neither was read until 2026-09-04.`,
    }),
    doc.fact('hours_of_operation', 'Open sunrise to 10:30 p.m. daily.', {
      evidence: `From this venue's entry on the City's pickleball page: "Open sunrise to 10:30 p.m." The park page words it as "open from sunrise until 10:30 p.m. daily".`,
    }),
    (p.noParkProse ? doc : docPark).fact('court_availability', p.availability, {
      evidence: p.noParkProse
        ? `From the City's pickleball page: "${p.spec}", "Open sunrise to 10:30 p.m." and the city-wide rule "${FIRST_COME}" This park's own page lists \"${p.feature}\" among the park's features and says nothing further about pickleball, which is why no price and no sharing rule is recorded for it.`
        : `From the park's own page: "${p.parkQuote}", the rotation rule — "${ROTATION} 2 points wins. This comes with a 30 minute time limit, at which time players should rotate off the court with any waiting players." — and "${p.busiest}"` +
          (p.closed ? ` Plus the closure notice: "${CLOSURE}"` : '') +
          ` The City's pickleball page adds: "${FIRST_COME}"`,
    }),
    docCensus.fact('county', geo.county, {
      evidence: `${geo.county} County, AZ${geo.county_fips ? ` (FIPS ${geo.state_fips}${geo.county_fips})` : ''}. ${geo.basis} The resolver also places it in the incorporated place "${geo.place}", which is what allows it to be published under Scottsdale.${viaOSM ? '' : ' The same check excluded Scottsdale Community College, whose courts the City runs a programme on and which the Census places in no incorporated place at all.'}`,
    }),
    docCensus.fact('postal_code', geo.postal_code, {evidence: geo.basis}),
  ]

  const res = applyFacts(venue, facts)

  overlay[p.slug] = {
    minted: !bySlug.has(p.slug),
    identity: {
      name: p.name, city: 'Scottsdale', state: 'AZ',
      county: geo.county, postal_code: geo.postal_code ?? null,
      latitude: geo.lat ?? null, longitude: geo.lon ?? null,
      imported_slug: bySlug.has(p.slug) ? p.slug : null,
      canonical_slug: identityRegistry.renames[p.slug]?.canonical ?? p.slug,
    },
    match: {
      source_page: PAGE, quote: p.spec,
      basis: bySlug.has(p.slug)
        ? `Matched to the imported ${p.slug} row in Scottsdale, AZ.`
        : `No imported row under this slug. Minted from the ${CITY} pickleball page, which states the count, the lighting, the address and the hours, and from the park's own page, which states the cost and the sharing rule.`,
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
writeFileSync(join(REPO_ROOT, 'data/verified/scottsdale-az.json'), JSON.stringify({
  city: 'Scottsdale', state: 'AZ', retrieved_at: RETRIEVED_AT,
  method_note:
    `Scottsdale is the first operator in this directory to publish how a court is shared and when it is busy. Three of its four park pages carry the same rule — standard game to 11, win by two, a 30-minute limit, then rotate off for anyone waiting — and each one states that mornings are typically the busiest time for pickleball there. Eleven cities in, no operator had published a peak time at all. Every one of the four published venues is stated lighted on the City's pickleball page and again in its own park page's feature list, and three of the four are "free to use" in their park pages' own words; the fourth, Ashler Hills Park, is named in its feature list and described nowhere else on that page, so its price is unstated rather than free. Ashler Hills publishes from 4 September 2026, when Import Gate I1 gained a second address resolver: the Census address file has no record of 32220 N. 74th Way and OpenStreetMap resolves it at house-number level. One of the City's five listed locations is still refused — Scottsdale Community College, which the geocoder places in no incorporated place at all; the City runs a free public drop-in programme on the college's courts, and that does not put them inside the city. Thompson Peak Park is published with its courts closed for resurfacing until 11 September 2026, because that is what the City says on the day this was checked.`,
  sources: [
    {url: PAGE, publisher: CITY, tier: 1, format: 'html', snapshot: snapshotPath('pickleball')},
    ...VENUES.map(p => ({
      url: `${PARK_BASE}/${p.page}`, publisher: CITY, tier: 1, format: 'html', snapshot: snapshotPath(p.page),
    })),
    {url: `${PARK_BASE}/ashler-hills-park`, publisher: CITY, tier: 1, format: 'html', snapshot: snapshotPath('ashler-hills-park')},
    {url: CENSUS_URL, publisher: 'US Census Bureau', tier: 1, format: 'json', snapshot: 'data/sources/scottsdale-county-census.json'},
  ].map((s, i) => ({id: `S${i + 1}`, ...s})),
  totals: {
    venues: VENUES.length, courts: totalCourts, outdoor: totalCourts, indoor: 0,
    lit: VENUES.length, free: VENUES.filter(p => !p.noParkProse).length,
  },
  excluded: EXCLUDED.map(e => ({name: e.name, why: e.reasons})),
  venues: overlay,
}, null, 2) + '\n')

const changed = changes.filter(r =>
  r.old_value !== null && r.old_value !== undefined && String(r.old_value) !== String(r.new_value))

writeFileSync(join(REPO_ROOT, 'reports', 'scottsdale-conflicts.md'), [
  '# Scottsdale verification - the first operator that says how to share a court', '',
  `Run ${RETRIEVED_AT}. ${VENUES.length} venues published, ${totalCourts} courts, all outdoor, all lit, all free.`,
  '2 of the City\'s 5 listed locations refused.', '',
  'Every other city in this directory answers "how many courts" and stops. Scottsdale publishes the',
  'rule for sharing one, on every park page:', '',
  '> Court use by individuals and groups is limited to standard game format; first side scoring 11',
  '> points or leading by at least 2 points wins. This comes with a 30 minute time limit, at which',
  '> time players should rotate off the court with any waiting players.', '',
  'and a peak time, which no operator had published before:', '',
  ...VENUES.map(p => `> ${p.busiest}`), '',
  '| venue | courts | lit | cost | hours |',
  '| --- | ---: | --- | --- | --- |',
  ...VENUES.map(p => `| \`${p.slug}\` | ${p.courts} | yes | free | sunrise - 10:30 p.m. |`),
  '',
  '## One venue is closed right now', '',
  'Thompson Peak Park is published with its courts shut. The City states they are closed from',
  '17 August to 11 September 2026 for resurfacing and expected to reopen on the 12th, weather',
  'permitting; this run was made on 4 September. The closure sentence is asserted, so when the City',
  'takes it down the build fails - a directory carrying a stale closure is worse than one carrying none.',
  '',
  '## Refused', '',
  ...EXCLUDED.flatMap(e => [`**${e.name}** - "${e.spec}"`, '', ...e.reasons.map((r, i) => `${i + 1}. ${r}`), '']),
  'Three venues is exactly the threshold this site requires. A city at the minimum is still a city.',
  '',
  '## A postcode defect in the City\'s own records', '',
  'Ashler Hills Park\'s page prints "Scottsdale, AZ 32220" and Thompson Peak Park\'s prints',
  '"Scottsdale, AZ 20199" - in both cases the street number where the postcode belongs. The',
  'pickleball page has the correct postcodes (85266 and 85255), and the published postcodes here come',
  'from the Census geocoder as they do everywhere on this site. Recorded because it is the City\'s',
  'record and somebody should know.',
  '',
  changed.length ? '## Values a source changed' : '_No imported row was overwritten._',
  ...(changed.length ? [
    '', '| venue | field | was | now | outcome |', '| --- | --- | --- | --- | --- |',
    ...changed.map(r => `| \`${r.venue_slug}\` | ${r.field} | ${JSON.stringify(r.old_value)} | ${JSON.stringify(r.new_value)} | ${r.outcome} |`),
  ] : []),
  '',
].join('\n'))

console.log(`\nScottsdale, AZ - ${VENUES.length} venues, ${totalCourts} courts, retrieved ${RETRIEVED_AT}`)
for (const p of VENUES) {
  const o = overlay[p.slug]
  console.log(
    `  ${o.patch.name.padEnd(22)} ${String(o.patch.total_courts).padStart(2)}` +
    ` | lights ${o.patch.light} | ${String(o.patch.fee_type ?? 'price not stated').padEnd(15)} | ${o.patch.county} County` +
    (p.closed ? ' | CLOSED for resurfacing until 11 Sep' : ''))
}
console.log('\n  refused: Scottsdale Community College - the geocoder places it in no incorporated place.')
console.log('  Ashler Hills Park publishes from 2026-09-04 via the second address resolver.')
console.log('\nWrote data/verified/scottsdale-az.json and reports/scottsdale-conflicts.md\n')
