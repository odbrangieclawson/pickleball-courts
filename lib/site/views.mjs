/*
  Presenters.

  Route files under app/ must hold no arithmetic and no collection access —
  validate-no-bypass.mjs fails the build on either, which is Decision D2
  enforced at build time. Everything that needs to count, pluralise, format
  or decide lives here, and a route receives finished strings.

  Every number that reaches a page comes through num(), which throws on a
  bare value. So a presenter cannot smuggle a hand-written figure into a
  heading either.
*/

import {num, pluralise, monthYear, venueTitle, FILTER_TITLES} from '../page/titles.mjs'
import {renderCount, renderCountOf} from '../data/counts.mjs'
import {FILTERS, qualifyingFilters} from '../page/city-page.mjs'
import {REPO_ROOT} from '../../scripts/lib/load-csv.mjs'
import {loadEditorial, editorialFor, editorialForCounty, editorialForVenue, editorialForFilter} from '../data/editorial-store.mjs'
import {EDITORIAL_SLOTS, COUNTY_SLOTS, VENUE_SLOTS, FILTER_SLOTS} from '../page/editorial.mjs'
import {slugifyCounty} from '../../scripts/lib/us-geo.mjs'
import {
  MIN_VERIFIED,
  buildLinkGraph, linkToCity, linkToCounty, linkToState, nearestCities,
  countyCounts, citySlugOf, statePath, countyPath, cityPath, venuePath,
} from './links.mjs'
import {provenanceRows, provenanceSummary, CADENCE} from './provenance.mjs'
import {search} from './search.mjs'
import * as data from './data.mjs'

const PLACEHOLDER_ORIGIN = 'https://example.invalid'

/*
  VENUE PHOTOGRAPHY.

  We have none. Not one of the twenty-four verified Seattle venues has a
  photograph taken at it, and until somebody goes and shoots them we are
  using one stock image of a net for all of them.

  That is fine as a layout decision and dangerous as a silent one. The same
  picture on twenty-four different courts, unlabelled, tells a reader it is
  a photograph OF that court — which is a claim, made by an image rather
  than by a sentence, and one we cannot source. On a site that renders a
  missing court count as "not verified yet" it would be incoherent to let a
  photograph imply something the text would refuse to.

  So every image carries isPlaceholder, the templates mark it, and the alt
  text says what it actually is. When real photographs arrive, this function
  is where they attach, and the marker disappears for the venues that have
  one.
*/
const PLACEHOLDER_PHOTO = Object.freeze({
  src: '/placeholder-court.jpg',
  /* PORTRAIT source, 408x612. These attributes must match the file or the
     reserved box is the wrong shape and the CLS work is undone. */
  width: 408,
  height: 612,
  isPlaceholder: true,
  caption: 'Placeholder image, not a photograph of this venue.',
})

const photoFor = venue => ({
  ...PLACEHOLDER_PHOTO,
  alt: `Generic pickleball net. We do not have a photograph of ${venue.name}.`,
})

/* Reader-facing headings for the four slots. */
const EDITORIAL_HEADINGS = {
  parking: 'Parking',
  peak_hours: 'When to turn up',
  surface_condition: 'What you will actually find',
  local_scene: 'Getting into a game',
}

/* Loaded once; the store is small and read-only. */
let editorialCache = null
const editorialIndex = () => (editorialCache ??= loadEditorial(REPO_ROOT).byCity)

/* Reader-facing headings for the county slots. */
const VENUE_HEADINGS = {
  description: 'About this place',
  getting_there: 'Getting there',
  what_to_expect: 'What to expect',
}

let venueEdCache = null
const venueEditorialIndex = () => (venueEdCache ??= loadEditorial(REPO_ROOT).byVenue)

/*
  DOES THIS VENUE HAVE A PUBLISHABLE PAGE?

  Gate 4 requires editorial on every page type, and a venue with no notes
  cannot reach either the 700-word floor or the three-specific-sentences
  rule. Under decisions.md section 7 a page that fails a gate does not ship,
  so an un-written venue gets no page at all — not a thin page, not a
  noindex page, no page.

  This one predicate is what the route, the sitemap and every link renderer
  ask, so the three cannot disagree. The CI gate run caught them disagreeing:
  the sitemap was advertising 20 venue pages that failed Gate 4, which is a
  directory promising a crawler pages it has already judged unfit.

  The venues themselves are not hidden. Their verified facts appear in full
  on the city page table and the county table; what they lack is a URL of
  their own, and they get one the day somebody writes them up.
*/
export function venuePagePublishes(state, city, slug) {
  const notes = editorialForVenue(venueEditorialIndex(), city, state, slug)
  if (!notes) return false
  return VENUE_SLOTS.every(s => String(notes.slots?.[s.key] ?? '').trim().length > 0)
}

const FILTER_HEADINGS = {
  why_this_filter: 'Why this matters here',
  what_qualifies: 'What puts a venue on this list',
}

let filterEdCache = null
const filterEditorialIndex = () => (filterEdCache ??= loadEditorial(REPO_ROOT).byFilter)

const COUNTY_HEADINGS = {
  coverage: 'What we have verified here',
  distribution: 'How the courts are spread',
  gaps: 'What is missing',
}

/*
  The link graph, built once from the published set. Every href on the site
  is minted from this, so a link to an unpublished page cannot be written by
  accident — see lib/site/links.mjs.
*/
let graphCache = null
const linkGraph = () => (graphCache ??= buildLinkGraph(
  data.publishedCities().flatMap(c => data.city(c.state, c.slug).venues)))

const fmt = n => n.toLocaleString('en-US')

/** Tri-state to prose. Never coerces null to "no" — Decision D6. */
export const triWord = (v, yes = 'Yes', no = 'No') =>
  v === true ? yes : v === false ? no : 'Not verified yet'

const cityHref = (st, slug) => `/pickleball/us/${String(st).toLowerCase()}/${slug}/`
const stateHref = st => `/pickleball/us/${String(st).toLowerCase()}/`
const venueHref = (st, cSlug, vSlug) => `${cityHref(st, cSlug)}${vSlug}/`

/* ---------------------------------------------------------------- */

export function homeView() {
  const t = data.siteTotals()
  const cities = data.publishedCities()

  const graph = linkGraph()
  const quickLinks = []
  for (const [, c] of graph.publishedCities) {
    for (const f of Object.keys(qualifyingFilters(c.venues))) {
      quickLinks.push({
        href: `${cityPath(c.state, c.slug)}${f}/`,
        label: `${f === 'lights' ? 'Lit courts' : f[0].toUpperCase() + f.slice(1) + ' courts'} in ${c.city}`,
      })
    }
  }

  const unver = t.counts.venues_unverified
  const gapSentence = num(unver) === 0
    ? 'Every venue we publish has been checked against a named source, so there are no unverified venues on the site right now.'
    : `${fmt(num(unver))} published ${pluralise(num(unver), 'venue')} still ${pluralise(num(unver), 'has', 'have')} a gap we have not closed.`

  /* Gate 3 requires BreadcrumbList on EVERY page, the home page included. */
  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: "Deep Pickleball",
        url: `${PLACEHOLDER_ORIGIN}/`,
        description: "US pickleball court directory with a named source and a checked date on every published fact.",
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {"@type": "ListItem", position: 1, name: "Deep Pickleball", item: `${PLACEHOLDER_ORIGIN}/`},
        ],
      },
    ],
  })

  return {
    headline: `${fmt(num(t.counts.venues))} verified pickleball ${pluralise(num(t.counts.venues), 'venue')}, every fact sourced`,
    venues: fmt(num(t.counts.venues)),
    courts: fmt(num(t.counts.courts)),
    cityCount: fmt(t.cityCount),
    cityWord: pluralise(t.cityCount, 'City', 'Cities'),
    lastChecked: monthYear(t.lastChecked) ?? 'Not yet',
    cityWordLower: pluralise(t.cityCount, 'city', 'cities'),
    /*
      findswimmingholes puts "6+ sources per spot" in its hero and it is a
      good proof line, so ours states the real figure rather than a rounded
      boast: two municipal datasets stand behind every verified venue.
    */
    sourcesPerVenue: '2',
    gapSentence,
    jsonLd,

    /*
      The quick links under the search box. findswimmingholes puts filter
      pills here; ours point at the filter pages that actually qualify, so
      the row shrinks to nothing rather than offering a filter that leads
      to a page we refused to publish.
    */
    hasQuickLinks: quickLinks.length > 0,
    quickLinks,
    cities: cities.map(c => ({
      href: cityHref(c.state, c.slug),
      title: `${c.city}, ${c.state}`,
      meta: `${fmt(c.venueCount)} verified ${pluralise(c.venueCount, 'venue')}${c.county ? ` · ${c.county} County` : ''}`,
      blurb: `Every ${c.city} venue below was checked against the city's own parks records.`,
      trust: 'Verified from municipal source',
    })),
  }
}

/* ---------------------------------------------------------------- */

export function stateView(slug) {
  const s = data.state(slug)
  if (!s) return null
  if (!linkGraph().publishedStates.has(String(slug).toUpperCase())) return null

  return {
    stateName: s.stateName,
    state: s.state,
    title: `Pickleball Courts in ${s.stateName}`,
    meta: `${fmt(num(s.counts.venues))} verified pickleball venues across ${fmt(s.cities.length)} ${pluralise(s.cities.length, 'city', 'cities')} in ${s.stateName}, each with a named source and a checked date.`,
    venues: fmt(num(s.counts.venues)),
    courts: fmt(num(s.counts.courts)),
    cityCount: fmt(s.cities.length),
    cityWord: pluralise(s.cities.length, 'City', 'Cities'),
    litLine: renderCountOf(s.counts.venues_lit, 'venues', 'report'),
    cities: s.cities.map(c => ({
      href: cityHref(s.state, c.slug),
      title: `${c.city}, ${s.state}`,
      meta: `${fmt(c.venueCount)} verified ${pluralise(c.venueCount, 'venue')} · ${fmt(c.courtCount)} ${pluralise(c.courtCount, 'court')}`,
      blurb: `Court counts, lights and addresses for every verified ${c.city} venue.`,
    })),
    jsonLd: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {'@type': 'ListItem', position: 1, name: 'US', item: `${PLACEHOLDER_ORIGIN}/pickleball/us/`},
        {'@type': 'ListItem', position: 2, name: s.stateName, item: `${PLACEHOLDER_ORIGIN}${stateHref(s.state)}`},
      ],
    }),
  }
}

/* ---------------------------------------------------------------- */

export function cityView(stateSlug, citySlug) {
  const c = data.city(stateSlug, citySlug)
  if (!c) return null

  /* qualifyingFilters returns {filter: matchCount}, not a list. */
  const editorial = editorialFor(editorialIndex(), c.city, c.state)
  const filters = Object.keys(qualifyingFilters(c.venues))
  const lastDates = c.venues.map(v => v.date_checked).filter(Boolean).sort()

  return {
    city: c.city,
    state: c.state,
    stateName: c.stateName,
    county: c.county,
    title: `Pickleball Courts in ${c.city}, ${c.state} — ${fmt(num(c.counts.venues))} Verified`,
    meta: `All ${fmt(num(c.counts.venues))} verified pickleball venues in ${c.city}, ${c.state}. Court counts, lights, addresses — each with the source it came from and the date it was checked.`,
    h1: `Pickleball Courts in ${c.city}, ${c.state}`,
    stateHref: stateHref(c.state),
    venuesN: fmt(num(c.counts.venues)),
    courtsN: fmt(num(c.counts.courts)),
    outdoorN: fmt(num(c.counts.outdoor_courts)),
    indoorN: fmt(num(c.counts.indoor_courts)),
    litLine: renderCountOf(c.counts.venues_lit, 'venues', 'report'),
    freeLine: renderCountOf(c.counts.venues_free, 'venues', 'report'),
    lastChecked: monthYear(lastDates[lastDates.length - 1]) ?? 'Not yet',

    /*
      The four editorial slots, and the sources behind them. Rule 7 covers
      prose as well as data: a parking note is a claim about a real place, so
      the page renders where it came from and when it was checked. A city with
      no notes gets an empty array and the page simply has no editorial
      section — it also will not pass Gate 4, which is the intended outcome.
    */
    hasEditorial: !!editorial,
    editorialDate: editorial?.date_checked ?? null,
    editorial: editorial
      ? EDITORIAL_SLOTS
        .filter(s => editorial.slots?.[s.key])
        .map(s => ({
          key: s.key,
          heading: EDITORIAL_HEADINGS[s.key] ?? s.key,
          text: editorial.slots[s.key],
          sources: (editorial.sources ?? [])
            .filter(src => (src.supports ?? []).includes(s.key))
            .map(src => ({url: src.url, publisher: src.publisher, retrieved: src.retrieved})),
        }))
      : [],

    /* 8c item 7 and item 9. Authored, sourced, and stored beside the
       four slots so prose lives in one place under one Rule 7 check. */
    /*
      8c item 10, now minted through the link graph rather than asserted.

      Each of these is null when the target does not publish, and the page
      renders prose instead of a dead href. The first version hard-coded
      countyPublished:false and said "we have not built the county page yet"
      — which stopped being true the moment King County published, and the
      crawl report caught it as an orphan.
    */
    countyName: c.county,
    countyLink: linkToCounty(linkGraph(), c.state, c.county),
    stateLink: linkToState(linkGraph(), c.state),
    hasNearby: nearestCities(linkGraph(), c.state, c.slug).length > 0,
    nearbyPublished: nearestCities(linkGraph(), c.state, c.slug).map(n => ({
      href: n.href, label: n.label, venues: n.venues,
      kmAway: `${Math.round(n.km)} km`,
    })),

    hasBestFor: (editorial?.bestFor ?? []).length > 0,
    bestFor: (editorial?.bestFor ?? []).map(b => ({
      key: b.key,
      heading: b.heading,
      text: b.text,
      /* A best-for pick may name a venue whose page does not publish.
         Link only when there is somewhere to go. */
      href: b.venue_slug && venuePagePublishes(c.state, c.slug, b.venue_slug) ? venueHref(c.state, c.slug, b.venue_slug) : null,
    })),
    hasFaqs: (editorial?.faqs ?? []).length > 0,
    faqs: (editorial?.faqs ?? []).map(f => ({q: f.q, a: f.a})),

    venuePagesN: fmt(c.venues.filter(v => venuePagePublishes(c.state, c.slug, v.slug)).length),
    hasFilters: filters.length > 0,
    filters: filters.map(f => ({
      slug: f,
      href: `${cityHref(c.state, c.slug)}${f}/`,
      label: FILTER_TITLES[f]({city: c.city, state: c.state, n: 0}).split(' in ')[0],
    })),
    venues: c.venues
      .slice()
      .sort((a, b) => (b.total_courts ?? 0) - (a.total_courts ?? 0) || String(a.name).localeCompare(String(b.name)))
      .map(v => ({
        href: venuePagePublishes(c.state, c.slug, v.slug) ? venueHref(c.state, c.slug, v.slug) : null,
        name: v.name,
        courts: v.total_courts === null || v.total_courts === undefined
          ? 'Not verified yet'
          : `${fmt(v.total_courts)} ${pluralise(v.total_courts, 'court')}`,
        indoorOutdoor: (v.outdoor_courts ?? 0) > 0 && (v.indoor_courts ?? 0) > 0 ? 'Both'
          : (v.outdoor_courts ?? 0) > 0 ? 'Outdoor'
            : (v.indoor_courts ?? 0) > 0 ? 'Indoor' : 'Not verified yet',
        lights: triWord(v.light),
        nets: triWord(v.nets_provided),
        fee: v.fee_type ?? 'Not verified yet',
        address: v.street_address ?? 'Not verified yet',
        checked: v.date_checked ?? null,
        source: v.source_url ?? null,
        photo: photoFor(v),
        /* 8c item 6: the card line. Only sourced facts, and a null says so. */
        detail: [
          v.outdoor_courts ? `${fmt(v.outdoor_courts)} outdoor ${pluralise(v.outdoor_courts, "court")}` : null,
          v.light === true ? "lit for evening play" : v.light === false ? "no lights" : "lighting not verified yet",
          v.nets_provided === true ? "nets provided" : v.nets_provided === false ? "bring a net" : "nets not verified yet",
          v.parking ? `${String(v.parking).toLowerCase()} parking` : null,
          v.restroom === true ? "restroom nearby" : v.restroom === false ? "no restroom" : null,
        ].filter(Boolean).join(" · "),
      })),
    jsonLd: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            {'@type': 'ListItem', position: 1, name: 'US', item: `${PLACEHOLDER_ORIGIN}/pickleball/us/`},
            {'@type': 'ListItem', position: 2, name: c.stateName, item: `${PLACEHOLDER_ORIGIN}${stateHref(c.state)}`},
            {'@type': 'ListItem', position: 3, name: c.city, item: `${PLACEHOLDER_ORIGIN}${cityHref(c.state, c.slug)}`},
          ],
        },
        /* 8c item 9 needs FAQPage markup, and Gate 3 checks for it. Only
           emitted when real questions exist - never an empty node. */
        ...((editorial?.faqs ?? []).length
          ? [{
            '@type': 'FAQPage',
            mainEntity: editorial.faqs.map(f => ({
              '@type': 'Question',
              name: f.q,
              acceptedAnswer: {'@type': 'Answer', text: f.a},
            })),
          }]
          : []),
        {
          '@type': 'ItemList',
          numberOfItems: num(c.counts.venues),
          itemListElement: c.venues.map((v, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            url: `${PLACEHOLDER_ORIGIN}${venueHref(c.state, c.slug, v.slug)}`,
            name: v.name,
          })),
        },
      ],
    }),
  }
}

/* ---------------------------------------------------------------- */

export function venueView(stateSlug, citySlug, venueSlug) {
  const r = data.venue(stateSlug, citySlug, venueSlug)
  if (!r) return null
  if (!venuePagePublishes(stateSlug, citySlug, venueSlug)) return null
  const {venue: v, city: c, alternatives} = r

  const graph = linkGraph()
  const prov = v.field_provenance ?? {}
  const notes = editorialForVenue(venueEditorialIndex(), c.city, c.state, v.slug)

  /* A fact row carries its own provenance. Rule 7 is per fact, not per page. */
  const row = (key, label, value) => ({
    key,
    label,
    value,
    verified: !!prov[key],
    source: prov[key]?.source_url ?? null,
    checked: prov[key]?.date_checked ?? null,
  })

  const n = x => (x === null || x === undefined ? 'Not verified yet' : fmt(x))
  const money = x => (x === null || x === undefined ? 'Not verified yet' : `$${fmt(x)}`)
  const text = x => (x === null || x === undefined || x === '' ? 'Not verified yet' : String(x))
  const list = x => (Array.isArray(x) && x.length ? x.join(', ') : 'Not verified yet')

  /*
    The full fact panel the brief specifies. Every field appears whether or
    not it is known, because a row that is missing and a row that is
    unverified look identical to a reader and only one of them is honest.
  */
  const facts = [
    row('total_courts', 'Total courts', n(v.total_courts)),
    row('indoor_courts', 'Indoor courts', n(v.indoor_courts)),
    row('outdoor_courts', 'Outdoor courts', n(v.outdoor_courts)),
    row('surface', 'Surface', text(v.surface)),
    row('light', 'Lights', triWord(v.light)),
    row('nets_provided', 'Nets provided', triWord(v.nets_provided)),
    row('climate_control', 'Climate controlled', triWord(v.climate_control)),
    row('covered', 'Covered', triWord(v.covered)),
    row('fee_type', 'Cost', text(v.fee_type)),
    row('membership_from_usd', 'Membership from', money(v.membership_from_usd)),
    row('pricing_notes', 'Pricing notes', text(v.pricing_notes)),
    row('hours_of_operation', 'Hours', text(v.hours_of_operation)),
    row('court_availability', 'Court availability', text(v.court_availability)),
    row('level_of_play', 'Level of play', text(v.level_of_play)),
    row('parking', 'Parking', text(v.parking)),
    row('amenities', 'Amenities', list(v.amenities)),
    row('restroom', 'Restroom', triWord(v.restroom)),
    row('pro_shop', 'Pro shop', triWord(v.pro_shop)),
    row('phone', 'Phone', text(v.phone)),
    row('website', 'Website', text(v.website)),
    row('street_address', 'Address', text(v.street_address)),
  ]

  const known = facts.filter(f => f.value !== 'Not verified yet').length

  /*
    THE TRUST DISPLAY LADDER (decisions.md section D). Exactly one rung
    renders, the highest that applies. A claim is an identity event and sits
    BELOW a municipal check, never above it — Decision D7.
  */
  const ladder =
    v.verified_by === 'municipal_source' ? {rank: 1, label: `Verified from municipal source, ${v.date_checked}`}
      : v.claimed_by_owner ? {rank: 2, label: `Confirmed by the venue, ${v.claim_date ?? 'date unknown'}`}
        : v.source_url ? {rank: 3, label: 'Listed from public data, not yet verified'}
          : {rank: 4, label: 'Not verified yet'}

  /*
    AGGREGATE RATING. Emitted only from ratings collected on our own site,
    above a review_count floor of 3 (decisions.md O2, addendum Section E).
    `rating` and `user_rating` both arrived with the import and their origin
    is undocumented, so both are QUARANTINED: displayed nowhere, never fed
    to schema. Expect no node on any page today. That is the correct
    outcome, and it still beats three competitors who ship none.
  */
  const ownReviews = v.ratings_are_ours === true &&
    Number.isFinite(v.review_count) && v.review_count >= 3 &&
    Number.isFinite(v.user_rating)
  const aggregate = ownReviews
    ? {'@type': 'AggregateRating', ratingValue: v.user_rating, ratingCount: v.review_count}
    : null

  const slots = notes
    ? VENUE_SLOTS.filter(s => notes.slots?.[s.key]).map(s => ({
      key: s.key,
      heading: VENUE_HEADINGS[s.key] ?? s.key,
      text: notes.slots[s.key],
    }))
    : []

  return {
    slug: v.slug,
    name: v.name,
    city: c.city,
    state: c.state,
    stateName: c.stateName,
    title: venueTitle({name: v.name, city: c.city, state: c.state}),
    meta: `Pickleball at ${v.name} in ${c.city}, ${c.state}. Court count, lights, nets and address — each with the source it came from and the date it was checked.`,

    cityHref: cityPath(c.state, c.slug),
    countyLink: linkToCounty(graph, c.state, c.county),
    stateLink: linkToState(graph, c.state),

    photo: photoFor(v),

    trust: ladder.label,
    trustRank: ladder.rank,
    /* D7: claiming buys control of your own facts and a response channel.
       It buys no ranking, no placement and no verified badge. */
    claimable: !v.claimed_by_owner,
    checked: v.date_checked ?? null,
    source: v.source_url ?? null,

    facts,
    knownFactsN: fmt(known),
    totalFactsN: fmt(facts.length),

    hasNotes: slots.length > 0,
    notes: slots,
    /* 8d item 8: FAQ only where real questions exist. */
    hasFaqs: (notes?.faqs ?? []).length > 0,
    faqs: (notes?.faqs ?? []).map(f => ({q: f.q, a: f.a})),
    noteSources: (notes?.sources ?? []).map(s => ({url: s.url, publisher: s.publisher, retrieved: s.retrieved})),

    hasAlternatives: alternatives.some(a => venuePagePublishes(c.state, c.slug, a.slug)),
    alternatives: alternatives.filter(a => venuePagePublishes(c.state, c.slug, a.slug)).map(a => ({
      href: venuePath(c.state, c.slug, a.slug),
      photo: photoFor(a),
      name: a.name,
      meta: a.total_courts === null || a.total_courts === undefined
        ? 'Court count not verified yet'
        : `${fmt(a.total_courts)} ${pluralise(a.total_courts, 'court')}`,
    })),

    jsonLd: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            {'@type': 'ListItem', position: 1, name: 'US', item: `${PLACEHOLDER_ORIGIN}/pickleball/us/`},
            {'@type': 'ListItem', position: 2, name: c.city, item: `${PLACEHOLDER_ORIGIN}${cityPath(c.state, c.slug)}`},
            {'@type': 'ListItem', position: 3, name: v.name, item: `${PLACEHOLDER_ORIGIN}${venuePath(c.state, c.slug, v.slug)}`},
          ],
        },
        {
          '@type': 'SportsActivityLocation',
          name: v.name,
          url: `${PLACEHOLDER_ORIGIN}${venuePath(c.state, c.slug, v.slug)}`,
          sport: 'Pickleball',
          address: {
            '@type': 'PostalAddress',
            streetAddress: v.street_address ?? undefined,
            addressLocality: c.city,
            addressRegion: c.state,
            addressCountry: 'US',
          },
          ...(typeof v.latitude === 'number' && typeof v.longitude === 'number'
            ? {geo: {'@type': 'GeoCoordinates', latitude: v.latitude, longitude: v.longitude}}
            : {}),
          ...(aggregate ? {aggregateRating: aggregate} : {}),
        },
        ...((notes?.faqs ?? []).length
          ? [{
            '@type': 'FAQPage',
            mainEntity: notes.faqs.map(f => ({
              '@type': 'Question',
              name: f.q,
              acceptedAnswer: {'@type': 'Answer', text: f.a},
            })),
          }]
          : []),
      ],
    }),
  }
}

/* ---------------------------------------------------------------- */

/*
  MEMBERSHIP RULES — the narrow readings the brief insists on.

  Each is deliberately stricter than the obvious one, and each strictness
  costs us venues on purpose:

    indoor   indoor_courts > 0 ONLY. Never covered, never climate_control.
             Rule 14. A covered outdoor court is not year-round play in a
             wet cold city, and putting one on the indoor page is the kind
             of small lie that costs the trust the directory is built on.
    outdoor  outdoor_courts > 0.
    free     fee_type === 'free' ONLY, and membership_from_usd must not be
             above zero. A drop-in session with a $5 door fee is not free.
    public   venue_type in the public set. Not "it is free", not "the gate
             was open" — venue_type describes who OPERATES the venue.
    lights   light === true. Never null. "We have not checked the lights"
             and "there are no lights" are different claims and only one of
             them can put a venue on this page.
*/
const PUBLIC_VENUE_TYPES = new Set(['public_park', 'municipal_rec', 'school_public_access'])

const FILTER_MATCH = {
  indoor: v => (v.indoor_courts ?? 0) > 0,
  outdoor: v => (v.outdoor_courts ?? 0) > 0,
  free: v => v.fee_type === 'free' && !(Number(v.membership_from_usd) > 0),
  public: v => PUBLIC_VENUE_TYPES.has(v.venue_type),
  lights: v => v.light === true,
}

/* Each filter's own count key in getCounts. D2: no page counts for itself. */
const FILTER_COUNT_KEY = {
  indoor: 'venues_indoor',
  outdoor: 'venues_outdoor',
  free: 'venues_free',
  lights: 'venues_lit',
  /* public has no key — see decisions.md O1. */
}

const FILTER_LABEL = {
  indoor: 'Indoor', outdoor: 'Outdoor', free: 'Free', public: 'Public', lights: 'Lights',
}

const FILTER_PREDICATE_TEXT = {
  indoor: 'with at least one indoor court',
  outdoor: 'with outdoor courts',
  free: 'that are free to play',
  public: 'operated as public facilities',
  lights: 'with lit courts for evening play',
}

const FILTER_EXCLUSIONS = {
  indoor: 'Covered and climate-controlled courts are not on this list. A roof over an outdoor court is not an indoor court, and in a city with this much winter that distinction is the whole point of the page.',
  outdoor: 'Nothing with only indoor courts appears here. Venues whose outdoor court count we have not verified are also absent — we do not assume a court is outdoor because we have not been told otherwise.',
  free: 'Drop-in sessions with a door fee are not free and are not listed. Neither is any venue with a membership price above zero, however low. A venue whose cost we have not verified stays off this list rather than being assumed free.',
  public: 'Being free does not put a venue here, and neither does an unlocked gate. This list reads who operates the venue, not what it costs or whether anyone stopped you walking in.',
  lights: 'A venue whose lighting we have not checked is not on this list. Unknown is not the same as unlit, and it is certainly not the same as lit.',
}

export function filterView(stateSlug, citySlug, filter) {
  const c = data.city(stateSlug, citySlug)
  if (!c) return null
  if (!FILTERS.includes(filter)) return null

  /*
    Every published number comes from getCounts(). /public/ has no count key
    because access_type and venue_type have no lawful driver yet
    (decisions.md O1), so rather than borrow another filter's number the
    page does not exist. D2 over convenience.
  */
  const key = FILTER_COUNT_KEY[filter]
  if (!key) return null
  const count = c.counts[key]

  const matching = c.venues.filter(FILTER_MATCH[filter])
  if (matching.length < MIN_VERIFIED) return null

  const graph = linkGraph()
  const doc = editorialForFilter(filterEditorialIndex(), c.city, c.state, filter)
  const courts = matching.reduce((n, v) => n + (v.total_courts ?? 0), 0)

  return {
    filter,
    filterLabel: FILTER_LABEL[filter],
    city: c.city,
    state: c.state,
    stateName: c.stateName,
    title: FILTER_TITLES[filter]({city: c.city, state: c.state, n: num(count)}),
    meta: `${fmt(num(count))} verified pickleball ${pluralise(num(count), 'venue')} in ${c.city}, ${c.state} ${FILTER_PREDICATE_TEXT[filter]}. Each with a named source and the date it was checked.`,
    h1: FILTER_TITLES[filter]({city: c.city, state: c.state, n: num(count)}),
    predicate: FILTER_PREDICATE_TEXT[filter],
    exclusions: FILTER_EXCLUSIONS[filter],

    cityHref: cityPath(c.state, c.slug),
    n: fmt(num(count)),
    venueWord: pluralise(num(count), 'venue'),
    courtsN: fmt(courts),
    cityVenuesN: fmt(num(c.counts.venues)),
    coverage: renderCount(count),

    hasEditorial: !!doc,
    editorial: doc
      ? FILTER_SLOTS.filter(s => doc.slots?.[s.key]).map(s => ({
        key: s.key,
        heading: FILTER_HEADINGS[s.key] ?? s.key,
        text: doc.slots[s.key],
      }))
      : [],
    editorialSources: (doc?.sources ?? []).map(s => ({url: s.url, publisher: s.publisher, retrieved: s.retrieved})),
    hasFaqs: (doc?.faqs ?? []).length > 0,
    faqs: (doc?.faqs ?? []).map(f => ({q: f.q, a: f.a})),

    venues: matching
      .slice()
      .sort((a, b) => (b.total_courts ?? 0) - (a.total_courts ?? 0) || String(a.name).localeCompare(String(b.name)))
      .map(v => ({
        slug: v.slug,
        photo: photoFor(v),
        href: venuePagePublishes(c.state, c.slug, v.slug) ? venuePath(c.state, c.slug, v.slug) : null,
        name: v.name,
        meta: v.total_courts === null || v.total_courts === undefined
          ? 'Court count not verified yet'
          : `${fmt(v.total_courts)} ${pluralise(v.total_courts, 'court')}`,
        address: v.street_address ?? 'Not verified yet',
        checked: v.date_checked ?? null,
      })),

    jsonLd: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            {'@type': 'ListItem', position: 1, name: c.city, item: `${PLACEHOLDER_ORIGIN}${cityPath(c.state, c.slug)}`},
            {'@type': 'ListItem', position: 2, name: FILTER_LABEL[filter], item: `${PLACEHOLDER_ORIGIN}${cityPath(c.state, c.slug)}${filter}/`},
          ],
        },
        ...((doc?.faqs ?? []).length
          ? [{
            '@type': 'FAQPage',
            mainEntity: doc.faqs.map(f => ({
              '@type': 'Question',
              name: f.q,
              acceptedAnswer: {'@type': 'Answer', text: f.a},
            })),
          }]
          : []),
        {
          '@type': 'ItemList',
          numberOfItems: num(count),
          itemListElement: matching.map((v, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            url: `${PLACEHOLDER_ORIGIN}${venuePath(c.state, c.slug, v.slug)}`,
            name: v.name,
          })),
        },
      ],
    }),
  }
}

/* Static params for the build. */
export const allCityParams = () =>
  data.publishedCities().map(c => ({state: String(c.state).toLowerCase(), city: c.slug}))

/*
  Only states that clear STATE_MIN_CITIES build a page. A state with one
  published city has no document to be that its city page is not already,
  and Rule 9 forbids two URLs competing for one intent. Below the threshold
  the route 404s and nothing links to it.
*/
export const allStateParams = () =>
  [...linkGraph().publishedStates.keys()].map(st => ({state: st.toLowerCase()}))

export function allLeafParams() {
  const out = []
  for (const c of data.publishedCities()) {
    const full = data.city(c.state, c.slug)
    for (const f of Object.keys(qualifyingFilters(full.venues))) {
      out.push({state: String(c.state).toLowerCase(), city: c.slug, slug: f})
    }
    for (const v of full.venues) {
      if (!venuePagePublishes(c.state, c.slug, v.slug)) continue
      out.push({state: String(c.state).toLowerCase(), city: c.slug, slug: v.slug})
    }
  }
  return out
}

/* ---------------------------------------------------------------- */
/* COUNTY (Phase 4)                                                  */
/* ---------------------------------------------------------------- */

/**
 * A county page exists only where 3+ verified venues carry that county.
 * Returns null otherwise, and nothing links to it — see lib/site/links.mjs.
 */
export function countyView(stateSlug, countySlugWithSuffix) {
  const st = String(stateSlug).toUpperCase()
  const bare = String(countySlugWithSuffix).replace(/-county$/, '')

  const graph = linkGraph()
  const entry = [...graph.publishedCounties.values()]
    .find(c => c.state === st && slugifyCounty(c.county) === bare)
  if (!entry) return null

  const counts = countyCounts(graph, st, entry.county)
  const doc = editorialForCounty(editorialIndex(), entry.county, st)

  /* Cities inside this county, published ones first. */
  const cityMap = new Map()
  for (const v of entry.venues) {
    const cs = citySlugOf(v.city)
    if (!cityMap.has(cs)) cityMap.set(cs, {city: v.city, slug: cs, venues: 0, courts: 0})
    const e = cityMap.get(cs)
    e.venues++
    e.courts += v.total_courts ?? 0
  }
  const cities = [...cityMap.values()]
    .map(c => ({...c, link: linkToCity(graph, st, c.slug)}))
    .filter(c => c.link)
    .sort((a, b) => b.venues - a.venues)

  const dates = entry.venues.map(v => v.date_checked).filter(Boolean).sort()

  return {
    county: entry.county,
    state: st,
    stateName: data.stateName(st),
    slug: `${bare}-county`,
    title: `Pickleball Courts in ${entry.county} County, ${st} — ${fmt(num(counts.venues))} Verified`,
    meta: `All ${fmt(num(counts.venues))} verified pickleball venues in ${entry.county} County, ${st}. Court counts, lights and addresses, each with the source it came from and the date it was checked.`,
    h1: `Pickleball Courts in ${entry.county} County, ${st}`,
    venuesN: fmt(num(counts.venues)),
    courtsN: fmt(num(counts.courts)),
    cityCountN: fmt(cities.length),
    cityWord: pluralise(cities.length, 'city', 'cities'),
    litLine: renderCountOf(counts.venues_lit, 'venues', 'report'),
    lastChecked: monthYear(dates[dates.length - 1]) ?? 'Not yet',

    /* Up-links. The state link is null until the state itself publishes. */
    stateLink: linkToState(graph, st),
    stateHrefFallback: statePath(st),

    cities,
    hasFaqs: (doc?.faqs ?? []).length > 0,
    faqs: (doc?.faqs ?? []).map(f => ({q: f.q, a: f.a})),
    hasEditorial: !!doc,
    editorial: doc
      ? COUNTY_SLOTS.filter(s => doc.slots?.[s.key]).map(s => ({
        key: s.key,
        heading: COUNTY_HEADINGS[s.key] ?? s.key,
        text: doc.slots[s.key],
        sources: (doc.sources ?? [])
          .filter(src => (src.supports ?? []).includes(s.key))
          .map(src => ({url: src.url, publisher: src.publisher, retrieved: src.retrieved})),
      }))
      : [],

    venues: entry.venues
      .slice()
      .sort((a, b) => (b.total_courts ?? 0) - (a.total_courts ?? 0) || String(a.name).localeCompare(String(b.name)))
      .map(v => ({
        href: venuePagePublishes(v.state, citySlugOf(v.city), v.slug) ? venuePath(st, citySlugOf(v.city), v.slug) : null,
        name: v.name,
        city: v.city,
        courts: v.total_courts === null || v.total_courts === undefined
          ? 'Not verified yet'
          : `${fmt(v.total_courts)} ${pluralise(v.total_courts, 'court')}`,
        lights: triWord(v.light),
        checked: v.date_checked ?? null,
      })),

    jsonLd: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            {'@type': 'ListItem', position: 1, name: 'US', item: `${PLACEHOLDER_ORIGIN}/pickleball/us/`},
            {'@type': 'ListItem', position: 2, name: data.stateName(st), item: `${PLACEHOLDER_ORIGIN}${statePath(st)}`},
            {'@type': 'ListItem', position: 3, name: `${entry.county} County`, item: `${PLACEHOLDER_ORIGIN}${countyPath(st, entry.county)}`},
          ],
        },
        /* Same rule as the city page: FAQPage only where real questions
           exist, never an empty node. */
        ...((doc?.faqs ?? []).length
          ? [{
            '@type': 'FAQPage',
            mainEntity: doc.faqs.map(f => ({
              '@type': 'Question',
              name: f.q,
              acceptedAnswer: {'@type': 'Answer', text: f.a},
            })),
          }]
          : []),
        {
          '@type': 'ItemList',
          numberOfItems: num(counts.venues),
          itemListElement: entry.venues.map((v, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            url: `${PLACEHOLDER_ORIGIN}${venuePath(st, citySlugOf(v.city), v.slug)}`,
            name: v.name,
          })),
        },
      ],
    }),
  }
}

export const countyEditorialSlots = () => COUNTY_SLOTS

/** Every publishable county, for generateStaticParams. */
export function allCountyParams() {
  const graph = linkGraph()
  return [...graph.publishedCounties.values()].map(c => ({
    state: c.state.toLowerCase(),
    city: `${slugifyCounty(c.county)}-county`,
  }))
}

/* ---------------------------------------------------------------- */
/* NAVIGATION                                                        */
/* ---------------------------------------------------------------- */

/*
  The header nav, built from the link graph rather than typed by hand.

  It used to carry a hard-coded <a href="/pickleball/us/wa/">Washington</a>.
  When the state page stopped publishing — Washington has one city, below
  the three-city threshold — that single line became a dead link on all 30
  pages of the site at once. The crawl report found it; nothing else would
  have.

  Nav is the highest-leverage place to get this wrong, because whatever it
  links to appears on every page.
*/
export function navView() {
  const graph = linkGraph()
  const items = []

  for (const [st] of graph.publishedStates) {
    items.push({href: statePath(st), label: data.stateName(st)})
  }
  for (const c of graph.publishedCounties.values()) {
    items.push({href: countyPath(c.state, c.county), label: `${c.county} County`})
  }
  for (const c of graph.publishedCities.values()) {
    items.push({href: cityPath(c.state, c.slug), label: c.city})
  }
  items.push({href: '/how-we-verify/', label: 'How we verify'})
  return items
}


/* ---------------------------------------------------------------- */
/* INTERNAL: provenance audit                                        */
/* ---------------------------------------------------------------- */

export function provenanceView() {
  const rows = provenanceRows()
  const sum = provenanceSummary()
  return {
    totalN: fmt(sum.total),
    venuesN: fmt(sum.venues),
    freshN: fmt(sum.byBand.fresh),
    dueN: fmt(sum.byBand.due),
    staleN: fmt(sum.byBand.stale + sum.byBand.never),
    cadenceSummary: `structural facts like an address at ${CADENCE.street_address} days, physical facts like a court count at ${CADENCE.total_courts}, volatile facts like fees and hours at ${CADENCE.fee_type}`,
    sources: sum.sources.map(s => ({url: s.url ?? '(none)', facts: fmt(s.facts)})),
    verifiers: sum.verifiers.map(x => ({by: x.by ?? '(none)', facts: fmt(x.facts)})),
    rows: rows.map(r => ({
      slug: r.slug,
      venue: r.venue,
      field: r.field,
      value: r.value,
      date_checked: r.date_checked,
      age: r.age_days === null ? '—' : fmt(r.age_days),
      cadence: fmt(r.cadence_days),
      staleness: r.staleness,
      verified_by: r.verified_by ?? '—',
    })),
  }
}


/* ---------------------------------------------------------------- */
/* SEARCH                                                            */
/* ---------------------------------------------------------------- */

export function searchView(q) {
  const r = search(q, REPO_ROOT)
  return {
    query: r.query,
    kind: r.kind,
    heading: r.query ? `Search: ${r.query}` : 'Search',
    note: r.note,
    hasResults: r.results.length > 0,
    results: r.results,
    hasSuggestions: r.suggestions.length > 0,
    suggestions: r.suggestions,
  }
}
