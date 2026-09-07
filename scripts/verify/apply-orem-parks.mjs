#!/usr/bin/env node
/*
  Orem, UT verification run - city #34, the second in Utah after St.
  George and the first in Utah County (Lehi, verified in the same batch,
  is the second).

  ============================================================
  THREE PARK PAGES, THREE COUNTS, EXACTLY THE THRESHOLD
  ============================================================

  The City of Orem publishes one page per park, each headed with the park
  name and a "Location:" line, followed by an amenity list. Three of those
  lists carry a pickleball count in the City's own words:

      Hillcrest Park    "12 Pickleball Courts (6 Courts reservable, 6
                        Courts open for public use)"        650 E 1400 S
      Sharon Park       "6 Pickleball Courts (we currently ONLY reserve
                        pickleball courts for the city's tournaments, not
                        for any other private use)."        600 N 300 E
      Bonneville Park   "Four Lighted Pickleball Courts"    1450 N 800 W

  Three venues is the threshold, not a margin over it. Every one of the
  three has to pass every gate or the city does not publish, and this run
  is written so that a single failure throws before a verified file is
  written - Chandler's shape, where the same threshold was missed by one.
  All three addresses resolve in the Census address file, as written,
  inside "Orem city", Utah County.

  Hillcrest's count is stated twice on its page - the amenity line, and
  then "6 Pickleball courts can be reserved for private use" followed by
  "6 of the other courts are for public use". Sharon's is stated twice too
  - "six pickleball courts" in the description and "6 Pickleball Courts" in
  the list. Bonneville's is stated twice - "one of the four new Pickleball
  courts" in the description and "Four Lighted Pickleball Courts" in the
  list. Every pair agrees with itself, and both halves of every pair are
  asserted, so a revision to either side stops the build.

  ============================================================
  ADDRESSES ARE UTAH GRID LINES
  ============================================================

  "650 E 1400 S" is 650 East on 1400 South. The City writes them without
  a city, state or postcode, and the Census address file resolves each as
  written - St. George's Vernon Worthen Park set that precedent. The
  street_address publishes as the City's line, exactly.

  ============================================================
  HOURS THAT ARE NOT THE COURTS' HOURS
  ============================================================

  Hillcrest's page carries "Hours of Operations: Monday-Saturday from
  10:00am-8:00pm". It sits under the heading "Splash Pad Hours", between
  that heading and "Concession will start June 10th from 10:00am-8:00pm",
  and the next paragraph says the splash pad "is open seasonally from
  Memorial Day at 10:00am to Labor Day at 8pm". Those are the splash pad
  and concession hours. Nothing on the page ties them to the courts, so
  hours_of_operation stays null at Hillcrest, and the ordering of those
  lines is asserted so that if the City ever moves the hours under the
  pickleball block the build stops and the question is re-read.

  ============================================================
  WHAT IS STATED, AND WHAT IS NOT
  ============================================================

  light         Bonneville only: "Four Lighted Pickleball Courts". The
                other two say nothing about lighting and stay null.

  play_format   Hillcrest: "6 Courts open for public use", held to the
                "Paddle Rotation System" the City describes in full. Sharon:
                the City reserves its courts only for its own tournaments,
                "not for any other private use", so the public plays on
                them otherwise. Bonneville: the description invites the
                reader to "enjoy a game of Pickleball on one of the four new
                Pickleball courts" and states no reservation rule at all.
                All three publish as open play; Bonneville's basis is the
                thinnest of the three and is quoted as such.

  fee_type      No page states a price, and no page says "free". The
                reservation sentences are about who may book a court, not
                what it costs. Null at all three, and the reservation rules
                are carried in the pricing notes so the reader has the
                City's words rather than a guess.

  surface, indoor/outdoor, nets, hours
                Not stated. A lighted court is not the word "outdoor". Null.

  ============================================================
  WHAT IS REFUSED
  ============================================================

  Cascade Park  The City's parks guide lists it, and its park page reads
                "Pickleball/Tennis Courts" - a label, with no number. The
                page could not be re-fetched at the guessed URL for this
                run (orem.gov/cascade-park/ answers 404), so it is refused
                on the count it lacks, and no snapshot of it is asserted.

  ============================================================
  THE IMPORT: TWO ROWS THAT CLAIM ONE SLUG
  ============================================================

  The imported dataset holds two Sharon Park rows in Orem - "sharon-park"
  at "500 N 300 E" with six courts, and "sharon-park-orem-orem-ut" at
  "285 500 N" - and the identity pass quarantines both for claiming one
  slug. The City publishes one Sharon Park at 600 N 300 E. This run
  matches the row whose address is the same grid corner off by one block
  and replaces its address with the City's; the other row is a second
  record of the same park at a different corner. A resolution in
  data/identity/resolutions.json naming sharon-park as the keeper is the
  parent's to write, exactly as Tallahassee's Tom Brown Park needed one.

  Bonneville matches "bonneville-park-orem-orem-ut", which the identity
  pass renames to bonneville-park, at the same address and the same count.
  Hillcrest has no imported row and is minted here.
*/

import {readFileSync, writeFileSync, mkdirSync, existsSync, unlinkSync} from 'node:fs'
import {join} from 'node:path'
import {SourceDocument} from './provenance.mjs'
import {applyFacts, changelogToRows} from './conflict.mjs'
import {loadRows, REPO_ROOT} from '../lib/load-csv.mjs'
import {PUBLISHED_FACT_FIELDS} from '../../lib/data/verified.mjs'
import {loadIdentity} from '../../lib/data/identity.mjs'
import {mapRow} from '../import/mapper.mjs'

const RETRIEVED_AT = process.env.RETRIEVED_AT ?? '2026-09-07'

const CITY = 'City of Orem Parks'
const GUIDE = 'https://orem.gov/parks-guide/'
const CENSUS_URL = 'https://geocoding.geo.census.gov/geocoder/geographies'
const VERIFIED_PATH = 'data/verified/orem-ut.json'
const THRESHOLD = 3

const PADDLE =
  '6 of the other courts are for public use and will be held to the standard of using the "Paddle Rotation System." This means that waiting player place a paddle for each player on the paddle racks on the next open rack. When a game is finished players announce "Open Court" and the court vacated for the players with paddles on the rack.'
const HILLCREST_RESERVE = '6 Pickleball courts can be reserved for private use'
const HILLCREST_TOURNAMENT = 'If you are interested in hosting a tournament or an event specifically geared toward pickleball. Please contact us at:'
const SPLASH_HEADING = 'Splash Pad Hours'
const HOURS_LINE = 'Hours of Operations: Monday-Saturday from 10:00am-8:00pm'
const CONCESSION_LINE = 'Concession will start June 10th from 10:00am-8:00pm'
const SPLASH_SEASON = 'The Splash Pad is open seasonally from Memorial Day at 10:00am to Labor Day at 8pm. After Labor Day, it is closed until the following Memorial Day.'

const VENUES = [
  {
    slug: 'hillcrest-park', importedSlug: null, name: 'Hillcrest Park', page: 'hillcrest-park',
    url: 'https://orem.gov/hillcrest-park/', geoKey: 'hillcrest-park',
    courts: 12, address: '650 E 1400 S', locationLine: 'Location: 650 E 1400 S',
    spec: '12 Pickleball Courts (6 Courts reservable, 6 Courts open for public use)',
    second: HILLCREST_RESERVE,
    light: null, restroom: null,
    playFormatEvidence:
      `"${HILLCREST_RESERVE}" and "${PADDLE}" Six of the twelve are public, first come, on the City's own paddle-rack rotation.`,
    pricing:
      'The City states no price. Six of the twelve courts can be reserved for private use through the City\'s online reservation link; the other six are held for public use on the "Paddle Rotation System": waiting players rack a paddle per player, and the finishing game announces "Open Court". Tournaments and pickleball events are arranged through the City at (801) 229-7154.',
    pricingEvidence:
      `"${HILLCREST_RESERVE}", "${PADDLE}", "Courts can be reserved on this link", and "${HILLCREST_TOURNAMENT} (801) 229-7154". No price appears on the page.`,
    availability:
      'Twelve pickleball courts at Hillcrest Park, the largest set in the city, from the City\'s own amenity list: "12 Pickleball Courts (6 Courts reservable, 6 Courts open for public use)". The City splits them on purpose: "6 Pickleball courts can be reserved for private use" through its online reservation link, and "6 of the other courts are for public use and will be held to the standard of using the \'Paddle Rotation System.\'" - waiting players rack one paddle per player on the next open rack, and when a game ends the players announce "Open Court" and hand the court to the paddles on the rack. Tournaments and pickleball events go through the City at (801) 229-7154. The page also prints "Hours of Operations: Monday-Saturday from 10:00am-8:00pm", but under the heading "Splash Pad Hours" and beside the concession season, so those are the splash pad\'s hours and not the courts\'; no court hours are stated. Nothing is stated about lighting, surface, price or whether any court is covered.',
  },
  {
    slug: 'sharon-park', importedSlug: 'sharon-park', name: 'Sharon Park', page: 'sharon-park',
    url: 'https://orem.gov/sharon-park/', geoKey: 'sharon-park',
    courts: 6, address: '600 N 300 E', locationLine: 'Location: 600 N 300 E',
    spec: '6 Pickleball Courts (we currently ONLY reserve pickleball courts for the city\'s tournaments, not for any other private use).',
    second: 'The park has a large playground and six pickleball courts.',
    light: null, restroom: true,
    playFormatEvidence:
      'The City\'s amenity line reads "6 Pickleball Courts (we currently ONLY reserve pickleball courts for the city\'s tournaments, not for any other private use)." A court that cannot be booked for private use is a court the public walks onto.',
    pricing:
      'The City states no price. Its courts here cannot be reserved for private use: "we currently ONLY reserve pickleball courts for the city\'s tournaments, not for any other private use".',
    pricingEvidence:
      'The bracketed clause of the City\'s amenity line: "(we currently ONLY reserve pickleball courts for the city\'s tournaments, not for any other private use)". No price appears on the page.',
    availability:
      'Six pickleball courts at Sharon Park, stated twice on the City\'s park page - "The park has a large playground and six pickleball courts." in the description and "6 Pickleball Courts" in the amenity list. The bracket on that line is the whole reservation policy: "(we currently ONLY reserve pickleball courts for the city\'s tournaments, not for any other private use)", so outside the City\'s own tournaments the courts are walk-on. The City describes the park as a sledding hill in winter and "a nice shady retreat for families" in summer, 5.2 acres with a playground, restrooms, a 0.42-mile walking path and a large pavilion. It states no price, no lighting, no surface and no hours for the courts. The imported dataset had this park at 500 N 300 E; the City\'s line, 600 N 300 E, replaces it.',
  },
  {
    slug: 'bonneville-park', importedSlug: 'bonneville-park-orem-orem-ut', name: 'Bonneville Park', page: 'bonneville',
    url: 'https://orem.gov/bonneville/', geoKey: 'bonneville-park',
    courts: 4, address: '1450 N 800 W', locationLine: 'Location: 1450 N 800 W',
    spec: 'Four Lighted Pickleball Courts',
    second: 'or enjoy a game of Pickleball on one of the four new Pickleball courts.',
    light: true, restroom: true,
    playFormatEvidence:
      'The City\'s description: "Watch the kids play on the excitingly large playground, relax under the shade of the many mature trees, or enjoy a game of Pickleball on one of the four new Pickleball courts." No reservation rule is stated for this park, unlike Hillcrest and Sharon. This is the thinnest basis of the three Orem venues: an invitation to play and the absence of any booking rule.',
    pricing:
      'The City states no price and no reservation rule for Bonneville\'s courts; its park page lists "Four Lighted Pickleball Courts" among the amenities and invites visitors to "enjoy a game of Pickleball on one of the four new Pickleball courts".',
    pricingEvidence:
      'The amenity line "Four Lighted Pickleball Courts" and the description sentence ending "enjoy a game of Pickleball on one of the four new Pickleball courts." Nothing on the page prices or books the courts.',
    availability:
      'Four lighted pickleball courts at Bonneville Park, "Located on the Northeast corner of Orem" in the City\'s words, and the one Orem venue where the City states lighting: "Four Lighted Pickleball Courts" in the amenity list, and in the description "enjoy a game of Pickleball on one of the four new Pickleball courts". The City describes 5.2 acres with a large pavilion seating a hundred, a small one seating sixteen, four barbecue braziers, a full-size basketball court, a tennis court, a shade-covered playground, a walking path and restrooms. It states no reservation rule, no price, no surface and no hours for the courts. The imported dataset carried the same address and the same four courts.',
  },
]

const EXCLUDED = [
  {
    name: 'Cascade Park', spec: 'Pickleball/Tennis Courts',
    reasons: [
      'The City\'s park page carries "Pickleball/Tennis Courts" in its amenity list and no number. A label is not a count, and a venue needs a stated count to exist here.',
      'The page could not be re-fetched for this run - orem.gov/cascade-park/ answers 404 - so no snapshot of it is asserted; the refusal rests on the count it lacks, and the parks guide, which is asserted, lists the park by name.',
    ],
  },
]

/* ---------------------------------------------------------------- */

const snapshotPath = name => `data/sources/orem/${name}.html`

const linesOf = rel => readFileSync(join(REPO_ROOT, rel), 'utf8')
  .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
  .replace(/<[^>]+>/g, '\n')
  .replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&#0?39;|&apos;|&lsquo;|&rsquo;|&#8217;|[‘’]/g, "'")
  .replace(/&quot;|&ldquo;|&rdquo;|&#8220;|&#8221;|[“”]/g, '"')
  .replace(/&#8211;|&#8212;|&ndash;|&mdash;|[–—‑]/g, '-')
  .split('\n').map(s => s.trim()).filter(Boolean)

const squeeze = s => s.replace(/\s+/g, '')
const textOf = name => squeeze(linesOf(snapshotPath(name)).join(' '))

const must = (page, who, needle, what) => {
  if (!textOf(page).includes(squeeze(needle))) {
    throw new Error(`${who}: the ${page} snapshot no longer contains the ${what} text "${needle}".`)
  }
}

/* The parks guide names every park this run reads, and the one it refuses. */
for (const name of [...VENUES.map(v => v.name), ...EXCLUDED.map(e => e.name)]) {
  must('parks-guide', 'Orem', name, 'parks-guide entry')
}

/*
  Each park page: its title, its Location line, the count line, and the
  second statement of the same number. The count line must sit in the
  amenity list after the Location line.
*/
for (const p of VENUES) {
  const lines = linesOf(snapshotPath(p.page))
  const title = lines.findIndex(l => squeeze(l) === squeeze(`${p.name} - City of Orem`))
  if (title < 0) throw new Error(`${p.slug}: the ${p.page} snapshot is no longer titled "${p.name} - City of Orem".`)
  const loc = lines.findIndex(l => squeeze(l) === squeeze(p.locationLine))
  if (loc < 0) throw new Error(`${p.slug}: the ${p.page} snapshot no longer carries the line "${p.locationLine}".`)
  const count = lines.findIndex((l, i) => i > loc && squeeze(l) === squeeze(p.spec))
  if (count < 0) throw new Error(`${p.slug}: the ${p.page} snapshot no longer carries the count line "${p.spec}" after its Location line.`)
  must(p.page, p.slug, p.second, 'second statement of the count')
  /* No other line on the page states a different pickleball number. */
  const numbers = lines.filter(l => /pickleball/i.test(l) && /\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\b/i.test(l))
  for (const l of numbers) {
    if (!/\b(courts?|of the other courts)\b/i.test(l)) continue
    if (![p.spec, p.second, HILLCREST_RESERVE, PADDLE].some(s => squeeze(l).includes(squeeze(s)))) {
      throw new Error(`${p.slug}: the ${p.page} snapshot has grown a pickleball line with a number this run does not read: "${l}". Re-read the park.`)
    }
  }
}

/* Hillcrest: the reservation sentences, and the hours that belong to the splash pad. */
must('hillcrest-park', 'hillcrest-park', PADDLE, 'paddle-rotation rule')
must('hillcrest-park', 'hillcrest-park', 'Courts can be reserved on this', 'reservation link sentence')
must('hillcrest-park', 'hillcrest-park', HILLCREST_TOURNAMENT, 'tournament contact sentence')
must('hillcrest-park', 'hillcrest-park', '(801) 229-7154', 'tournament phone number')
{
  const lines = linesOf(snapshotPath('hillcrest-park')).map(squeeze)
  const at = s => lines.indexOf(squeeze(s))
  const splash = at(SPLASH_HEADING), hours = at(HOURS_LINE), conc = at(CONCESSION_LINE), season = at(SPLASH_SEASON)
  const reserve = at(HILLCREST_RESERVE)
  if (splash < 0 || hours < 0 || conc < 0 || season < 0) {
    throw new Error('hillcrest-park: the splash-pad hours block ("Splash Pad Hours", "Hours of Operations...", "Concession will start...", "The Splash Pad is open seasonally...") is no longer on the page as this run read it. Re-read whether the hours now belong to the courts.')
  }
  if (!(splash < hours && hours < conc && conc < season && season < reserve)) {
    throw new Error('hillcrest-park: the "Hours of Operations" line has moved relative to the splash-pad heading and the pickleball reservation sentences. This run attributes those hours to the splash pad, not the courts; re-read the page before publishing hours.')
  }
}

/* Bonneville: the lighting word, and the restroom. */
must('bonneville', 'bonneville-park', 'Located on the Northeast corner of Orem, Bonneville park offers park-goers wide open spaces and a number of amenities.', 'City location sentence')
must('bonneville', 'bonneville-park', 'Four Lighted Pickleball Courts', 'lighted-courts line')
must('bonneville', 'bonneville-park', 'Tennis Court', 'tennis court amenity')
must('bonneville', 'bonneville-park', 'Restrooms', 'restrooms amenity')

/* Sharon: the description and the amenities the prose leans on. */
must('sharon-park', 'sharon-park', 'In the winter, Sharon Park is often used for tubing and sledding.', 'winter description')
must('sharon-park', 'sharon-park', 'Restrooms', 'restrooms amenity')
must('sharon-park', 'sharon-park', 'Walking Path - 0.42 miles', 'walking path')

const counties = JSON.parse(
  readFileSync(join(REPO_ROOT, 'data/sources/orem-county-census.json'), 'utf8'))

const identityRegistry = loadIdentity(REPO_ROOT)
const allRows = loadRows().map(r => mapRow(r).venue)
const bySlug = new Map(
  allRows.filter(v => v.city === 'Orem' && String(v.state).toUpperCase() === 'UT')
    .map(v => [v.slug, v]))

/*
  Every venue must resolve, as written, inside Orem. Failures are
  collected rather than thrown one at a time, so the report can say how
  far short the city fell; then the threshold decides whether anything is
  written at all.
*/
const failures = []
const publishable = []
for (const p of VENUES) {
  const geo = counties[p.geoKey]
  if (!geo?.matched) { failures.push({venue: p, why: `no address resolver matched "${p.address}" as the City writes it`}); continue }
  if (!geo.place_matches_city) { failures.push({venue: p, why: `the resolver places "${p.address}" at "${geo.place}", not Orem`}); continue }
  if (p.importedSlug && !bySlug.has(p.importedSlug)) throw new Error(`${p.slug}: imported row ${p.importedSlug} is no longer in data.csv for Orem, UT.`)
  publishable.push({p, geo})
}

if (publishable.length < THRESHOLD) {
  const verified = join(REPO_ROOT, VERIFIED_PATH)
  if (existsSync(verified)) unlinkSync(verified)
  throw new Error(
    `Orem: ${publishable.length} publishable venues, below the threshold of ${THRESHOLD}. ` +
    failures.map(f => `${f.venue.slug}: ${f.why}`).join('; ') + '. No verified file is written.')
}

const overlay = {}
const changes = []

for (const {p, geo} of publishable) {
  const doc = new SourceDocument({
    url: p.url, retrieved_at: RETRIEVED_AT, tier: 1, publisher: CITY, format: 'html',
  })
  const docCensus = new SourceDocument({
    url: CENSUS_URL, retrieved_at: RETRIEVED_AT, tier: 1, publisher: 'US Census Bureau', format: 'json',
  })

  const shell = {
    slug: p.slug, name: null, city: 'Orem', state: 'UT', county: null,
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
      evidence: `The City's park page is titled "${p.name} - City of Orem" and headed "${p.name}"; the parks guide lists it under the same name.`,
    }),
    doc.fact('total_courts', p.courts, {
      evidence: `Quoted from the amenity list on the City's park page: "${p.spec}". Stated a second time on the same page: "${p.second}"`,
    }),
    doc.fact('street_address', p.address, {
      evidence: `"${p.locationLine}" on the City's park page. A Utah grid address, written by the City without a city, state or postcode, which the Census address file resolves as written.`,
    }),
    doc.fact('venue_type', 'public_park', {
      evidence: `Published by the ${CITY} in its parks guide and on its own park page.`,
    }),
    doc.fact('play_format', 'open_play', {evidence: p.playFormatEvidence}),
    doc.fact('pricing_notes', p.pricing, {evidence: p.pricingEvidence}),
    doc.fact('court_availability', p.availability, {
      evidence: `From the City's park page: "${p.spec}" and "${p.second}"` +
        (p.slug === 'hillcrest-park' ? `, with "${HILLCREST_RESERVE}", "${PADDLE}", and the splash-pad hours block.` : '.'),
    }),
    docCensus.fact('county', geo.county, {
      evidence: `${geo.county} County, UT${geo.county_fips ? ` (FIPS ${geo.state_fips}${geo.county_fips})` : ''}. ${geo.basis} The resolver also places it in the incorporated place "${geo.place}", which is what allows it to be published under Orem.`,
    }),
    docCensus.fact('postal_code', geo.postal_code, {evidence: geo.basis}),
  ]

  if (p.light === true) {
    facts.push(doc.fact('light', true, {
      evidence: `The City's amenity line is "${p.spec}" - its word is "Lighted".`,
    }))
  }
  if (p.restroom === true) {
    facts.push(doc.fact('restroom', true, {evidence: '"Restrooms" in the amenity list on the City\'s park page.'}))
  }

  const res = applyFacts(venue, facts)

  overlay[p.slug] = {
    minted: !imported,
    identity: {
      name: p.name, city: 'Orem', state: 'UT',
      county: geo.county, postal_code: geo.postal_code ?? null,
      latitude: geo.lat ?? null, longitude: geo.lon ?? null,
      imported_slug: p.importedSlug ?? null,
      canonical_slug: identityRegistry.renames[p.importedSlug]?.canonical ?? p.slug,
    },
    match: {
      source_page: p.url, quote: p.spec,
      basis: p.slug === 'hillcrest-park'
        ? 'Minted here. The import holds no row for Hillcrest Park in Orem, UT.'
        : p.slug === 'sharon-park'
          ? 'Matched to the imported sharon-park row in Orem, UT, which carried "500 N 300 E" and six courts; the City\'s line, 600 N 300 E, replaces the address, and the count agrees. A second imported row, sharon-park-orem-orem-ut, describes the same park at "285 500 N" and canonicalises to the same slug; the identity pass holds both until data/identity/resolutions.json names this row as the keeper. The City publishes one Sharon Park.'
          : 'Matched to the imported bonneville-park-orem-orem-ut row in Orem, UT, at the same address and the same four courts, published under the canonical slug bonneville-park; the identity pass dropped the trailing "-orem-orem-ut", which is already in the path.',
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

const totalCourts = publishable.reduce((a, {p}) => a + p.courts, 0)

for (const [slug, entry] of Object.entries(overlay)) {
  const {total_courts: t, indoor_courts: i, outdoor_courts: o} = entry.patch
  if (i != null && o != null && t !== i + o) {
    throw new Error(`Rule 13: ${slug} does not sum.`)
  }
}

const METHOD_NOTE =
  'Orem publishes one page per park with a "Location:" line and an amenity list, and three of those lists state a pickleball count in the City\'s own words: "12 Pickleball Courts (6 Courts reservable, 6 Courts open for public use)" at Hillcrest, "6 Pickleball Courts" at Sharon and "Four Lighted Pickleball Courts" at Bonneville. Each count is stated twice on its page and both statements are asserted, as are the title, the Location line and the parks guide entry, so a revision to any of them fails the build. Three venues is exactly the threshold: the run collects every gate failure and throws before writing a verified file if fewer than three survive, as Chandler\'s does. The addresses are Utah grid lines written without a city or postcode, and the Census address file resolves all three as written inside Orem city, Utah County. Hillcrest\'s "Hours of Operations: Monday-Saturday from 10:00am-8:00pm" sits under the heading "Splash Pad Hours" beside the concession season, so it is the splash pad\'s and hours stay null; the ordering of those lines is asserted. Lighting publishes at Bonneville only, from the word "Lighted". No page states a price or the word "free", so fee_type is null everywhere and the City\'s reservation rules - six of Hillcrest\'s courts reservable and six on a paddle rotation, Sharon\'s reserved only for City tournaments, nothing at Bonneville - publish as pricing notes with no price. All three publish as open play, Bonneville on the thinnest basis. Surface, indoor or outdoor, nets and hours are not stated and stay null. Cascade Park is refused for carrying a label and no number. The import holds two Sharon Park rows that claim one slug; the row at the same grid corner is matched and the other stays held pending a resolution.'

mkdirSync(join(REPO_ROOT, 'data/verified'), {recursive: true})
writeFileSync(join(REPO_ROOT, VERIFIED_PATH), JSON.stringify({
  city: 'Orem', state: 'UT', retrieved_at: RETRIEVED_AT,
  method_note: METHOD_NOTE,
  sources: [
    {url: GUIDE, publisher: CITY, tier: 1, format: 'html', snapshot: snapshotPath('parks-guide')},
    ...VENUES.map(v => ({url: v.url, publisher: CITY, tier: 1, format: 'html', snapshot: snapshotPath(v.page)})),
    {url: CENSUS_URL, publisher: 'US Census Bureau', tier: 1, format: 'json', snapshot: 'data/sources/orem-county-census.json'},
  ].map((s, i) => ({id: `S${i + 1}`, ...s})),
  totals: {
    venues: publishable.length, courts: totalCourts,
    outdoor: null, indoor: null,
    lit_courts: publishable.filter(({p}) => p.light === true).reduce((a, {p}) => a + p.courts, 0),
    free_venues: 0,
  },
  excluded: EXCLUDED.map(e => ({name: e.name, why: e.reasons})),
  venues: overlay,
}, null, 2) + '\n')

const changed = changes.filter(r =>
  r.old_value !== null && r.old_value !== undefined && String(r.old_value) !== String(r.new_value))

writeFileSync(join(REPO_ROOT, 'reports', 'orem-conflicts.md'), [
  '# Orem verification - three park pages, three counts, exactly the threshold', '',
  `Run ${RETRIEVED_AT}. ${publishable.length} venues published, ${totalCourts} courts. ${EXCLUDED.length} venue refused.`, '',
  'Orem is the second city in Utah on this site, after St. George, and the first in Utah County. Every count',
  'and address comes from the City\'s own park page for that park, and each count is stated twice on its page.',
  'Three venues is the threshold, not a margin over it; the run throws before writing anything if one fails.', '',
  '| venue | courts | lit | address | what the City writes |',
  '| --- | ---: | --- | --- | --- |',
  ...publishable.map(({p, geo}) => `| \`${p.slug}\` | ${p.courts} | ${p.light === true ? 'yes ("Lighted")' : 'not stated'} | ${p.address} (${geo.postal_code}) | "${p.spec}" |`),
  '',
  '## Hours that belong to the splash pad', '',
  `Hillcrest's page prints "${HOURS_LINE}" under the heading "${SPLASH_HEADING}", between that heading and`,
  `"${CONCESSION_LINE}", and the next paragraph says "${SPLASH_SEASON}" Nothing ties those hours to the courts,`,
  'so hours stay null at Hillcrest, and the order of those lines is asserted so that a page that moves the hours',
  'under the pickleball block stops the build.',
  '',
  '## What is not a price', '',
  'No Orem park page states a price or the word "free". The reservation rules are about who may book a court:',
  `"${HILLCREST_RESERVE}" and the paddle rotation at Hillcrest, "(we currently ONLY reserve pickleball courts for`,
  'the city\'s tournaments, not for any other private use)" at Sharon, and nothing at Bonneville. They publish as',
  'pricing notes with no price, and fee_type is null at all three.',
  '',
  '## Refused', '',
  ...EXCLUDED.flatMap(e => [
    `**${e.name}** - "${e.spec}"`, '',
    ...e.reasons.map((r, i) => `${i + 1}. ${r}`), '']),
  '## Two Sharon Park rows in the import', '',
  'The import holds "sharon-park" at "500 N 300 E" with six courts, and "sharon-park-orem-orem-ut" at "285 500 N";',
  'the identity pass quarantines both for claiming one slug. The City publishes one Sharon Park at 600 N 300 E.',
  'This run matches the first row and replaces its address with the City\'s; the second is a second record of the',
  'same park. A resolution in `data/identity/resolutions.json` naming sharon-park as the keeper is needed, as it',
  'was for Tallahassee\'s Tom Brown Park.',
  '',
  '## What Orem does not say', '',
  '- **lighting**, at Hillcrest and Sharon. Only Bonneville writes "Lighted".',
  '- **surface.**',
  '- **indoor or outdoor.** A lighted court is not the word "outdoor". Null everywhere.',
  '- **hours**, for the courts. The only hours line on any page is the splash pad\'s.',
  '- **price**, anywhere.',
  '- **nets.**',
  '',
  changed.length ? '## Values a source changed' : '_No imported row was overwritten._',
  ...(changed.length ? [
    '', '| venue | field | was | now | outcome |', '| --- | --- | --- | --- | --- |',
    ...changed.map(r => `| \`${r.venue_slug}\` | ${r.field} | ${JSON.stringify(r.old_value)} | ${JSON.stringify(r.new_value)} | ${r.outcome} |`),
  ] : []),
  '',
].join('\n'))

console.log(`\nOrem, UT - ${publishable.length} venues, ${totalCourts} courts, retrieved ${RETRIEVED_AT}`)
