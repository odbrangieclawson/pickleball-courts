#!/usr/bin/env node
/*
  Mount Pleasant, SC verification run - city #28, the first in South
  Carolina and the first in Charleston County.

  ============================================================
  ONE TOWN PAGE, FIVE ENTRIES, FOUR VENUES
  ============================================================

  The Town's pickleball page carries a "Drop-In/Open Pickleball Play"
  section split under two headings, "Indoor" and "Outdoor". Each entry is
  a name, a two-line address with a postcode, a count line, and a
  paragraph of rules that prices the play and says who brings the net:

      Indoor    Mount Pleasant Senior Center 50+   "1 Court"
                Park West Gym                      "6 Courts"
                The Deb Gym at Town Hall           "4 Courts"
      Outdoor   Miriam Brown Community Center      "4 Courts"
                Park West Tennis Courts            "4 Courts - Lighted"

  Indoor and outdoor are therefore the Town's own words, by heading
  (Saint Paul's rule), and each entry is asserted to sit under the right
  one. Park West Gym and Park West Tennis Courts share one address, 1251
  Park West Boulevard, one site with a gym and tennis courts, and they
  publish as ONE venue with courts on both sides of the indoor line -
  Bellevue's Hidden Valley Park and Tampa's Forest Hills set that rule.

  ============================================================
  WHAT THE TOWN PRICES, AND HOW
  ============================================================

  Three of the four venues are stated free in so many words: "Drop-in play
  is free." at Park West Gym and the Deb Gym, "Drop-in play is free and
  first come, first served." at Miriam Brown, "Drop-in play is first come
  first served and free." on the Park West tennis courts. The Senior Center
  is the exception and the Town prices it exactly: free for members, "$5
  for Mt. Pleasant residents and $10 for those residing outside of Mt.
  Pleasant" for non-members, and only for players 50 and older. That is a
  drop-in fee for the public, and it publishes as one, with the member
  and residency split in the pricing notes.

  ============================================================
  NETS
  ============================================================

  The Town says who supplies the net at every venue, which few operators
  do: "Nets, balls, and paddles are provided" (Senior Center), "Nets are
  provided for players to set up" (both gyms), "Nets are available
  weekdays from the G.M. Darby Building" (Miriam Brown), and on the tennis
  courts "Nets are available from the Program Building ... Monday through
  Friday 8:00 a.m. - 5:00 p.m." with "You must provide your own net if
  playing outside of business hours." All four publish nets_provided true,
  with the weekday caveats carried in the evidence and the prose.

  ============================================================
  WHAT IS NOT CLAIMED
  ============================================================

  surface     Not stated anywhere.
  lighting    Stated once, "4 Courts - Lighted", about the Park West
              tennis courts. Nothing is said about the Miriam Brown
              courts, so their lighting stays unknown; the gyms are
              indoor rooms and the Town says nothing about them either.
  hours       The Town publishes drop-in SESSION times, not building
              hours. They are published as sessions and labelled so.
*/

import {readFileSync, writeFileSync, mkdirSync} from 'node:fs'
import {join} from 'node:path'
import {SourceDocument} from './provenance.mjs'
import {applyFacts, changelogToRows} from './conflict.mjs'
import {loadRows, REPO_ROOT} from '../lib/load-csv.mjs'
import {PUBLISHED_FACT_FIELDS} from '../../lib/data/verified.mjs'
import {loadIdentity} from '../../lib/data/identity.mjs'
import {mapRow} from '../import/mapper.mjs'

const RETRIEVED_AT = process.env.RETRIEVED_AT ?? '2026-09-07'

const TOWN = 'Town of Mount Pleasant Recreation Department'
const PAGE = 'https://www.tompsc.com/1120/Pickleball'
const CENSUS_URL = 'https://geocoding.geo.census.gov/geocoder/geographies'

/* The five entries as the Town prints them, name line then the lines beneath. */
const ENTRIES = {
  senior: {
    name: 'Mount Pleasant Senior Center 50+', section: 'indoor',
    lines: ['840 Von Kolnitz Road', 'Mount Pleasant, SC 29464', '1 Court'],
    quotes: [
      'Drop-in play is for anyone 50 years and older and is free for members of the Senior Center. Non members may join in for a guest fee of $5 for Mt. Pleasant residents and $10 for those residing outside of Mt. Pleasant. Nets, balls, and paddles are provided.',
      'Tuesday/Thursday 3:00 - 4:50 pm', 'Friday 3:00 - 5:50 pm',
    ],
  },
  gym: {
    name: 'Park West Gym', section: 'indoor',
    lines: ['1251 Park West Boulevard', 'Mount Pleasant, SC 29466', '6 Courts'],
    quotes: [
      'Drop-in play is free. All players MUST sign in.', 'Nets are provided for players to set up.',
      'Bring your own balls and paddles.', 'Tuesdays & Thursdays: 8:00 am - 12:00 pm',
      'Additional Pickleball Open Gym Dates for 2026:', 'Sunday, September 13th - 8 a.m. to Noon',
    ],
  },
  deb: {
    name: 'The Deb Gym at Town Hall', section: 'indoor',
    lines: ['100 Ann Edwards Lane', 'Mount Pleasant, SC 29464', '4 Courts'],
    quotes: [
      'Drop-in play is free. All players MUST sign in.', 'Nets are provided for players to set up.',
      'Mondays: 1:00 - 3:00 pm', 'Wednesdays: 9:00 am- 12:00 pm', 'Fridays:  8:00 am - 12:00 pm',
      'During volleyball season - Friday, September 18th through Saturday, October 31st',
      'all Pickleball Open Gyms will only be played on two pickleball courts',
    ],
  },
  miriam: {
    name: 'Miriam Brown Community Center', section: 'outdoor',
    lines: ['118 Royall Avenue', 'Mount Pleasant, SC 29464', '4 Courts'],
    quotes: [
      'Drop-in play is free and first come, first served. Nets are available weekdays from the G.M. Darby Building from 8:30 a.m. - 5:00 p.m.',
      'Open Play Group Meets Monday - Sunday: 7:00am - 11:00 am',
      'NO OPEN PICKLEBALL PLAY WHEN THE COMMUNITY CENTER IS OPEN!',
      'Sept to May - Monday to Friday 2:30 - 6:30 pm, Saturday 11:00 am - 3:30 pm',
      'June to August - Monday to Friday 11:30 am - 3:30 pm',
    ],
  },
  tennis: {
    name: 'Park West Tennis Courts', section: 'outdoor',
    lines: ['1251 Park West Boulevard', 'Mount Pleasant, SC 29466', '4 Courts - Lighted'],
    quotes: [
      'Drop-in play is first come first served and free. Nets are available from the Program Building directly beside the courts Monday through Friday 8:00 a.m. - 5:00 p.m.',
      'You must provide your own net if playing outside of business hours.',
      '*Our MPRD Tennis Pros do have court priority for lessons!',
      'Organized Open Play Group Meets Every Monday, Tuesday & Wednesday 6:00 - 8:00 pm.',
    ],
  },
}

const VENUES = [
  {
    slug: 'senior-center', importedSlug: 'mount-pleasant-senior-center', name: 'Mount Pleasant Senior Center',
    entries: ['senior'], courts: 1, indoor: 1, outdoor: null, light: null,
    address: '840 Von Kolnitz Road', cityZip: '29464', venueType: 'community_center',
    fee: 'drop_in_fee', dropIn: 5,
    pricing: 'Drop-in play is for players 50 and older only. Free for Senior Center members; non-members pay a guest fee of $5 for Mount Pleasant residents and $10 for non-residents.',
    hours: 'Pickleball sessions: Tuesday and Thursday 3:00-4:50 pm, Friday 3:00-5:50 pm',
    nets: true,
    availability: 'One indoor pickleball court at the Town\'s Senior Center on Von Kolnitz Road, and the one venue in Mount Pleasant with a condition on who may play: "Drop-in play is for anyone 50 years and older". The Town prices it exactly - free for Senior Center members, "a guest fee of $5 for Mt. Pleasant residents and $10 for those residing outside of Mt. Pleasant" for non-members - and supplies everything: "Nets, balls, and paddles are provided." Sessions run Tuesday and Thursday from 3:00 to 4:50 pm and Friday from 3:00 to 5:50 pm, with a Friday lesson hour beforehand. One court is one game at a time. The Town states nothing about the surface, and lighting in a gym is not something it addresses.',
  },
  {
    slug: 'park-west', importedSlug: null, name: 'Park West',
    entries: ['gym', 'tennis'], courts: 10, indoor: 6, outdoor: 4, light: true,
    address: '1251 Park West Boulevard', cityZip: '29466', venueType: 'public_park',
    fee: 'free', dropIn: null, pricing: null,
    hours: 'Indoor gym pickleball sessions: Tuesdays and Thursdays 8:00 am-12:00 pm, plus listed Sunday dates 8 a.m. to noon in autumn 2026. Outdoor organised open play: Monday, Tuesday and Wednesday 6:00-8:00 pm, reserved through the TeamReach app; otherwise first come, first served.',
    nets: true,
    availability: 'Ten pickleball courts at one address in the Park West complex, on both sides of the indoor line: six in the Park West Gym and four lighted courts on the Park West tennis courts. The Town lists them as two entries, "Park West Gym / 6 Courts" under Indoor and "Park West Tennis Courts / 4 Courts - Lighted" under Outdoor, at the same 1251 Park West Boulevard, and they publish here as one venue. Both are free: "Drop-in play is free. All players MUST sign in." in the gym, "Drop-in play is first come first served and free." on the courts outside. Indoors the Town provides the nets and the sessions are Tuesday and Thursday mornings, 8:00 am to 12:00 pm, plus a run of Sunday mornings the Town lists by date for autumn 2026. Outdoors the nets come from the Program Building beside the courts, weekdays 8:00 a.m. to 5:00 p.m., and "You must provide your own net if playing outside of business hours." The tennis courts are tennis courts first: "Our MPRD Tennis Pros do have court priority for lessons!" An organised open-play group meets on them Monday, Tuesday and Wednesday evenings, 6:00 to 8:00 pm, with a spot reserved through the TeamReach app. Bring your own balls and paddles everywhere on the site. Lighting is stated for the four outdoor courts only; the surface is not stated.',
  },
  {
    slug: 'deb-gym-at-town-hall', importedSlug: null, name: 'The Deb Gym at Town Hall',
    entries: ['deb'], courts: 4, indoor: 4, outdoor: null, light: null,
    address: '100 Ann Edwards Lane', cityZip: '29464', venueType: 'community_center',
    fee: 'free', dropIn: null, pricing: null,
    hours: 'Pickleball sessions: Mondays 1:00-3:00 pm, Wednesdays 9:00 am-12:00 pm, Fridays 8:00 am-12:00 pm',
    nets: true,
    availability: 'Four indoor pickleball courts in the gym at Town Hall on Ann Edwards Lane, free to drop in on three weekday sessions: Mondays 1:00 to 3:00 pm, Wednesdays 9:00 am to 12:00 pm and Fridays 8:00 am to 12:00 pm. "Drop-in play is free. All players MUST sign in." The Town provides the nets ("Nets are provided for players to set up.") and asks players to bring their own balls and paddles, to enter at their designated time, and to break down a few minutes before the end. The Town also states a seasonal reduction: "During volleyball season - Friday, September 18th through Saturday, October 31st all Pickleball Open Gyms will only be played on two pickleball courts." Four courts is the count the Town states and two is what it says to expect for six weeks of the autumn. Holiday closures are listed by date on the same page. The surface is not stated, and lighting in a gym is not something the Town addresses.',
  },
  {
    slug: 'miriam-brown-community-center', importedSlug: 'miriam-brown-community-center', name: 'Miriam Brown Community Center',
    entries: ['miriam'], courts: 4, indoor: null, outdoor: 4, light: null,
    address: '118 Royall Avenue', cityZip: '29464', venueType: 'community_center',
    fee: 'free', dropIn: null, pricing: null,
    hours: 'Open play group Monday to Sunday 7:00-11:00 am. No open pickleball play while the community centre is open: September to May, Monday to Friday 2:30-6:30 pm and Saturday 11:00 am-3:30 pm; June to August, Monday to Friday 11:30 am-3:30 pm.',
    nets: true,
    availability: 'Four outdoor pickleball courts at the Miriam Brown Community Center on Royall Avenue in the Old Village, free and first come, first served in the Town\'s words: "Drop-in play is free and first come, first served." Nets are supplied on weekdays - "Nets are available weekdays from the G.M. Darby Building from 8:30 a.m. - 5:00 p.m." - and the Town asks you to bring your own paddles and balls. An open-play group meets every morning, "Monday - Sunday: 7:00am - 11:00 am", and the Town warns that "Times may vary to accommodate MPRD activities." The rule that shapes the day is printed in capitals: "NO OPEN PICKLEBALL PLAY WHEN THE COMMUNITY CENTER IS OPEN!" - which the Town defines as Monday to Friday 2:30 to 6:30 pm and Saturday 11:00 am to 3:30 pm from September to May, and Monday to Friday 11:30 am to 3:30 pm from June to August. The Town also runs coached clinics and private lessons here at published prices. Lighting and surface are not stated.',
  },
]

/* ---------------------------------------------------------------- */

const snapshotPath = 'data/sources/mount-pleasant/pickleball.html'

const linesOf = rel => readFileSync(join(REPO_ROOT, rel), 'utf8')
  .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
  .replace(/<[^>]+>/g, '\n')
  .replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&#0?39;|&apos;|&lsquo;|&rsquo;|&#8217;|[‘’]/g, "'")
  .replace(/&quot;|&ldquo;|&rdquo;|[“”]/g, '"')
  .replace(/&#8211;|&#8212;|&ndash;|&mdash;|[–—‑]/g, '-')
  .split('\n').map(s => s.trim()).filter(Boolean)

const squeeze = s => s.replace(/\s+/g, '')
const page = linesOf(snapshotPath)

const indexOfLine = (needle, from = 0, to = page.length) =>
  page.findIndex((l, i) => i >= from && i < to && squeeze(l) === squeeze(needle))

const indoorAt = indexOfLine('Indoor')
const outdoorAt = indexOfLine('Outdoor', indoorAt + 1)
if (indoorAt < 0 || outdoorAt < 0 || outdoorAt < indoorAt) {
  throw new Error('The Town\'s pickleball page no longer has an "Indoor" heading followed by an "Outdoor" heading.')
}
const section = e => e.section === 'indoor' ? [indoorAt, outdoorAt] : [outdoorAt, page.length]

/*
  An entry is asserted as a block: the name line inside its section, the
  three lines directly beneath it (address, address, count), and every
  quote somewhere between that name and the next entry's name.
*/
const allNames = Object.values(ENTRIES).map(e => e.name)
function assertEntry(key) {
  const e = ENTRIES[key]
  const [from, to] = section(e)
  const at = indexOfLine(e.name, from, to)
  if (at < 0) throw new Error(`${e.name}: no longer listed under the "${e.section === 'indoor' ? 'Indoor' : 'Outdoor'}" heading of the Town's pickleball page.`)
  const got = page.slice(at + 1, at + 1 + e.lines.length).map(squeeze)
  if (got.join('|') !== e.lines.map(squeeze).join('|')) {
    throw new Error(`${e.name}: the lines beneath the name have changed. Expected ${JSON.stringify(e.lines)}, page reads ${JSON.stringify(page.slice(at + 1, at + 1 + e.lines.length))}.`)
  }
  const next = page.findIndex((l, i) => i > at && allNames.some(n => squeeze(n) === squeeze(l)))
  const block = squeeze(page.slice(at, next < 0 ? undefined : next).join(' '))
  for (const q of e.quotes) {
    if (!block.includes(squeeze(q))) throw new Error(`${e.name}: the entry no longer contains "${q}".`)
  }
}

for (const key of Object.keys(ENTRIES)) assertEntry(key)

/* The section header the whole listing sits under. */
if (indexOfLine('Drop-In/Open Pickleball Play') < 0) {
  throw new Error('The Town\'s page no longer carries the "Drop-In/Open Pickleball Play" heading.')
}

const counties = JSON.parse(
  readFileSync(join(REPO_ROOT, 'data/sources/mount-pleasant-county-census.json'), 'utf8'))

const identityRegistry = loadIdentity(REPO_ROOT)
const allRows = loadRows().map(r => mapRow(r).venue)
const bySlug = new Map(
  allRows.filter(v => v.city === 'Mount Pleasant' && String(v.state).toUpperCase() === 'SC')
    .map(v => [v.slug, v]))

const overlay = {}
const changes = []

for (const p of VENUES) {
  const geo = counties[p.slug]
  if (!geo?.matched) throw new Error(`${p.slug}: no address resolver matched its address`)
  if (!geo.place_matches_city) throw new Error(`${p.slug}: the resolver places this at "${geo.place}", not Mount Pleasant.`)
  if (geo.postal_code !== p.cityZip) throw new Error(`${p.slug}: the resolver's postcode ${geo.postal_code} differs from the Town's ${p.cityZip}.`)

  const doc = new SourceDocument({url: PAGE, retrieved_at: RETRIEVED_AT, tier: 1, publisher: TOWN, format: 'html'})
  const docCensus = new SourceDocument({url: CENSUS_URL, retrieved_at: RETRIEVED_AT, tier: 1, publisher: 'US Census Bureau', format: 'json'})

  const shell = {
    slug: p.slug, name: null, city: 'Mount Pleasant', state: 'SC', county: null,
    postal_code: null, street_address: null, latitude: null, longitude: null,
    status: 'pending', source_url: null, date_checked: null, verified_by: null,
    claimed_by_owner: false, claim_date: null,
    rating: null, user_rating: null, review_count: null, claimed_or_verified: null,
    source_sport: 'pickleball',
  }
  for (const f of PUBLISHED_FACT_FIELDS) shell[f] = null
  const imported = p.importedSlug ? bySlug.get(p.importedSlug) : undefined
  const venue = imported ?? shell

  const entries = p.entries.map(k => ENTRIES[k])
  const cards = entries.map(e => `"${e.name} / ${e.lines.join(' / ')}"`).join(' and ')
  const heading = e => e.section === 'indoor' ? 'Indoor' : 'Outdoor'

  const facts = [
    doc.fact('name', p.name, {
      evidence: p.slug === 'park-west'
        ? 'The Town lists "Park West Gym" under Indoor and "Park West Tennis Courts" under Outdoor at one address, 1251 Park West Boulevard; published as one venue under the site\'s shared name.'
        : p.slug === 'senior-center'
          ? 'Listed as "Mount Pleasant Senior Center 50+" on the Town\'s pickleball page; the "50+" is the Town\'s age condition and is published as one rather than as part of the name.'
          : `Named "${p.name}" on the Town's pickleball page.`,
    }),
    doc.fact('total_courts', p.courts, {
      evidence: p.slug === 'park-west'
        ? 'Two Town entries at one address: "Park West Gym / 6 Courts" under Indoor and "Park West Tennis Courts / 4 Courts - Lighted" under Outdoor. Ten is their sum.'
        : `Quoted from the Town's pickleball page: ${cards}.`,
    }),
    doc.fact('street_address', p.address, {evidence: `${cards} on the Town's pickleball page.`}),
    doc.fact('venue_type', p.venueType, {
      evidence: p.venueType === 'public_park'
        ? 'A Town park site with a gym and tennis courts, listed under both the Indoor and Outdoor headings.'
        : 'A Town recreation building, listed under the Town\'s "Indoor" heading.' + (p.slug === 'miriam-brown-community-center' ? ' Miriam Brown\'s four courts are outdoor, at a community centre.' : ''),
    }),
    doc.fact('fee_type', p.fee, {
      evidence: p.fee === 'free'
        ? entries.map(e => `"${e.quotes[0].split('.')[0]}."`).join(' ') + ' The Town\'s own word.'
        : `"${ENTRIES.senior.quotes[0]}" Free for members, a guest fee for everyone else: for the public that is a drop-in fee, and the member and residency split is in the pricing notes.`,
    }),
    doc.fact('hours_of_operation', p.hours, {
      evidence: `Session times as printed under the entry on the Town's pickleball page: ${entries.flatMap(e => e.quotes.filter(q => /am|pm|a\.m\.|Noon/.test(q))).map(q => `"${q}"`).join(', ')}. These are pickleball sessions, not building hours.`,
    }),
    doc.fact('play_format', 'open_play', {
      evidence: entries.map(e => `"${e.quotes[0]}"`).join(' ') + ' Drop-in, first come, first served.',
    }),
    doc.fact('nets_provided', true, {
      evidence: p.slug === 'senior-center' ? '"Nets, balls, and paddles are provided."'
        : p.slug === 'park-west' ? '"Nets are provided for players to set up." in the gym; outdoors "Nets are available from the Program Building directly beside the courts Monday through Friday 8:00 a.m. - 5:00 p.m." and "You must provide your own net if playing outside of business hours."'
          : p.slug === 'deb-gym-at-town-hall' ? '"Nets are provided for players to set up."'
            : '"Nets are available weekdays from the G.M. Darby Building from 8:30 a.m. - 5:00 p.m." - provided on weekdays, in the Town\'s words.',
    }),
    doc.fact('court_availability', p.availability, {evidence: `From the Town's pickleball page: ${cards}, and the rules printed beneath.`}),
    docCensus.fact('county', geo.county, {
      evidence: `${geo.county} County, SC${geo.county_fips ? ` (FIPS ${geo.state_fips}${geo.county_fips})` : ''}. ${geo.basis} The resolver also places it in the incorporated place "${geo.place}", which is what allows it to be published under Mount Pleasant.`,
    }),
    docCensus.fact('postal_code', geo.postal_code, {evidence: geo.basis}),
  ]
  if (p.indoor != null) {
    facts.push(doc.fact('indoor_courts', p.indoor, {
      evidence: `Listed under the Town's "Indoor" heading: ${entries.filter(e => e.section === 'indoor').map(e => `"${e.name} / ${e.lines[2]}"`).join(', ')}.`,
    }))
  }
  if (p.outdoor != null) {
    facts.push(doc.fact('outdoor_courts', p.outdoor, {
      evidence: `Listed under the Town's "Outdoor" heading: ${entries.filter(e => e.section === 'outdoor').map(e => `"${e.name} / ${e.lines[2]}"`).join(', ')}.`,
    }))
  }
  if (p.light === true) {
    facts.push(doc.fact('light', true, {
      evidence: '"4 Courts - Lighted" is the Town\'s own line for the Park West tennis courts, the outdoor four. The six gym courts are indoors and the Town says nothing about lighting there.',
    }))
  }
  if (p.dropIn != null) {
    facts.push(doc.fact('drop_in_fee_usd', p.dropIn, {
      evidence: '"a guest fee of $5 for Mt. Pleasant residents and $10 for those residing outside of Mt. Pleasant" - the resident rate is published as the fee, the non-resident rate in the pricing notes.',
    }))
  }
  if (p.pricing) {
    facts.push(doc.fact('pricing_notes', p.pricing, {evidence: `"${ENTRIES.senior.quotes[0]}"`}))
  }

  const res = applyFacts(venue, facts)

  overlay[p.slug] = {
    minted: !imported,
    identity: {
      name: p.name, city: 'Mount Pleasant', state: 'SC',
      county: geo.county, postal_code: geo.postal_code ?? null,
      latitude: geo.lat ?? null, longitude: geo.lon ?? null,
      imported_slug: p.importedSlug ?? null,
      canonical_slug: identityRegistry.renames[p.importedSlug]?.canonical ?? p.slug,
    },
    match: {
      source_page: PAGE, quote: entries.map(e => e.lines[2]).join(' + '),
      basis: imported
        ? `Matched to the imported ${p.importedSlug} row in Mount Pleasant, SC, at the same street address${identityRegistry.renames[p.importedSlug] ? `, published under the canonical slug ${p.slug}` : ''}.`
        : p.slug === 'park-west'
          ? 'Minted as one venue from the Town\'s two entries at 1251 Park West Boulevard. The imported row park-west-gym-mount-pleasant-sc (six indoor courts) describes the gym half only and is left pending under its own slug rather than published as a second venue at the same address.'
          : 'No imported row for this venue. Minted here from the Town\'s pickleball page, which states the count and the address.',
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
const indoorCourts = VENUES.reduce((a, p) => a + (p.indoor ?? 0), 0)
const outdoorCourts = VENUES.reduce((a, p) => a + (p.outdoor ?? 0), 0)

for (const [slug, entry] of Object.entries(overlay)) {
  const {total_courts: t, indoor_courts: i, outdoor_courts: o} = entry.patch
  if (i != null && o != null && t !== i + o) throw new Error(`Rule 13: ${slug} does not sum.`)
}
if (indoorCourts + outdoorCourts !== totalCourts) throw new Error('Rule 13: the city does not sum.')

const METHOD_NOTE =
  'Mount Pleasant states everything on one Town page, under two headings: "Indoor" (the Senior Center, Park West Gym, the Deb Gym at Town Hall) and "Outdoor" (Miriam Brown Community Center, Park West Tennis Courts). Every entry carries a count line - "1 Court", "6 Courts", "4 Courts", "4 Courts - Lighted" - a two-line address with a postcode, and a paragraph that prices the play and says who brings the net. Indoor and outdoor are the Town\'s headings, asserted per entry. Park West Gym and Park West Tennis Courts share 1251 Park West Boulevard and publish as one venue with six indoor and four lighted outdoor courts, after Bellevue\'s Hidden Valley Park and Tampa\'s Forest Hills. Three venues are free in the Town\'s own words; the Senior Center is free for members and a $5 or $10 guest fee for everyone else, players 50 and older only, and publishes as a drop-in fee. Nets are provided at all four, with the weekday caveats the Town prints. The Deb Gym drops to two courts during volleyball season, 18 September to 31 October, which the Town states and the run asserts. No surface is stated anywhere; lighting is stated once, for the Park West tennis courts.'

mkdirSync(join(REPO_ROOT, 'data/verified'), {recursive: true})
writeFileSync(join(REPO_ROOT, 'data/verified/mount-pleasant-sc.json'), JSON.stringify({
  city: 'Mount Pleasant', state: 'SC', retrieved_at: RETRIEVED_AT,
  method_note: METHOD_NOTE,
  sources: [
    {url: PAGE, publisher: TOWN, tier: 1, format: 'html', snapshot: snapshotPath},
    {url: CENSUS_URL, publisher: 'US Census Bureau', tier: 1, format: 'json', snapshot: 'data/sources/mount-pleasant-county-census.json'},
  ].map((s, i) => ({id: `S${i + 1}`, ...s})),
  totals: {
    venues: VENUES.length, courts: totalCourts,
    outdoor: outdoorCourts, indoor: indoorCourts,
    lit_courts: 4, free_venues: VENUES.filter(p => p.fee === 'free').length,
  },
  excluded: [],
  venues: overlay,
}, null, 2) + '\n')

const changed = changes.filter(r =>
  r.old_value !== null && r.old_value !== undefined && String(r.old_value) !== String(r.new_value))

writeFileSync(join(REPO_ROOT, 'reports', 'mount-pleasant-conflicts.md'), [
  '# Mount Pleasant verification - five entries under two headings, four venues', '',
  `Run ${RETRIEVED_AT}. ${VENUES.length} venues published, ${totalCourts} courts (${outdoorCourts} outdoor, ${indoorCourts} indoor). No venue refused.`, '',
  'Mount Pleasant is the first city in South Carolina on this site and the first in Charleston County. Every',
  'fact comes from one Town page.', '',
  '| venue | courts | in | out | fee | nets | what the Town writes |',
  '| --- | ---: | ---: | ---: | --- | --- | --- |',
  ...VENUES.map(p => `| \`${p.slug}\` | ${p.courts} | ${p.indoor ?? '-'} | ${p.outdoor ?? '-'} | ${p.fee === 'free' ? 'free (stated)' : 'drop-in $5 / $10, members free, 50+'} | provided${p.slug === 'park-west' || p.slug === 'miriam-brown-community-center' ? ' (weekdays outdoors)' : ''} | ${p.entries.map(k => `"${ENTRIES[k].name} / ${ENTRIES[k].lines[2]}"`).join(' + ')} |`),
  '',
  '## Park West is one venue', '',
  'The Town lists "Park West Gym / 6 Courts" under Indoor and "Park West Tennis Courts / 4 Courts - Lighted" under',
  'Outdoor, both at 1251 Park West Boulevard. One site, one venue, courts on both sides of the indoor line. The',
  'imported row for the gym half is left pending rather than published as a second venue at the same address.',
  '',
  '## The Senior Center is a drop-in fee, not free', '',
  '"Drop-in play is for anyone 50 years and older and is free for members of the Senior Center. Non members may',
  'join in for a guest fee of $5 for Mt. Pleasant residents and $10 for those residing outside of Mt. Pleasant."',
  'Free for a member is not free for the public. The resident guest fee is the published drop-in fee; the',
  'non-resident rate, the member exemption and the age condition are in the pricing notes.',
  '',
  '## What the Town says that most operators do not', '',
  '- who supplies the net, at every venue, with the hours the nets can be collected outdoors',
  '- a seasonal reduction at the Deb Gym: two courts instead of four during volleyball season, 18 September to 31 October',
  '- when NOT to play at Miriam Brown: "NO OPEN PICKLEBALL PLAY WHEN THE COMMUNITY CENTER IS OPEN!", with the hours',
  '- that the tennis pros have priority on the Park West tennis courts',
  '',
  '## What Mount Pleasant does not say', '',
  '- **surface**, anywhere.',
  '- **lighting** at Miriam Brown, and in the gyms.',
  '- building hours: the Town publishes pickleball session times, which are what is published, labelled as sessions.',
  '',
  changed.length ? '## Values a source changed' : '_No imported row was overwritten._',
  ...(changed.length ? [
    '', '| venue | field | was | now | outcome |', '| --- | --- | --- | --- | --- |',
    ...changed.map(r => `| \`${r.venue_slug}\` | ${r.field} | ${JSON.stringify(r.old_value)} | ${JSON.stringify(r.new_value)} | ${r.outcome} |`),
  ] : []),
  '',
].join('\n'))

console.log(`\nMount Pleasant, SC - ${VENUES.length} venues, ${totalCourts} courts (${outdoorCourts} outdoor, ${indoorCourts} indoor), retrieved ${RETRIEVED_AT}`)
for (const p of VENUES) {
  const o = overlay[p.slug]
  console.log(`  ${o.patch.name.padEnd(30)} ${String(o.patch.total_courts).padStart(2)} | in ${String(o.patch.indoor_courts ?? '-').padStart(2)} out ${String(o.patch.outdoor_courts ?? '-').padStart(2)} | ${p.fee.padEnd(11)} | ${o.patch.county} County | ${counties[p.slug].postal_code} | via ${counties[p.slug].resolver}`)
}
console.log('\nWrote data/verified/mount-pleasant-sc.json and reports/mount-pleasant-conflicts.md\n')
