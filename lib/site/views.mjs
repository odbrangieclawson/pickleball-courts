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
import {loadEditorial, editorialFor} from '../data/editorial-store.mjs'
import {EDITORIAL_SLOTS} from '../page/editorial.mjs'
import * as data from './data.mjs'

const PLACEHOLDER_ORIGIN = 'https://example.invalid'

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
    gapSentence,
    jsonLd,
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
    /* 8c item 10. County and nearby-city pages do not exist until Phase 4,
       so the block says what is missing instead of linking into a 404. */
    countyName: c.county,
    countyPublished: false,
    nearbyPublished: [],

    hasBestFor: (editorial?.bestFor ?? []).length > 0,
    bestFor: (editorial?.bestFor ?? []).map(b => ({
      key: b.key,
      heading: b.heading,
      text: b.text,
      href: b.venue_slug ? venueHref(c.state, c.slug, b.venue_slug) : null,
    })),
    hasFaqs: (editorial?.faqs ?? []).length > 0,
    faqs: (editorial?.faqs ?? []).map(f => ({q: f.q, a: f.a})),

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
        href: venueHref(c.state, c.slug, v.slug),
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
  const {venue: v, city: c, alternatives} = r

  const prov = v.field_provenance ?? {}
  const factRow = (key, label, value) => ({
    label,
    value,
    source: prov[key]?.source_url ?? null,
    checked: prov[key]?.date_checked ?? null,
    evidence: prov[key]?.evidence ?? null,
  })

  return {
    name: v.name,
    city: c.city,
    state: c.state,
    stateName: c.stateName,
    title: venueTitle({name: v.name, city: c.city, state: c.state}),
    meta: `Pickleball at ${v.name} in ${c.city}, ${c.state}. Court count, lights, nets and address — each with the source it came from and the date it was checked.`,
    cityHref: cityHref(c.state, c.slug),
    stateHref: stateHref(c.state),
    verifiedBy: v.verified_by === 'municipal_source' ? 'Verified from municipal source'
      : v.verified_by === 'owner_submission' ? 'Confirmed by the venue'
        : v.verified_by ? 'Listed from public data, not yet verified' : 'Not verified yet',
    checked: v.date_checked ?? null,
    source: v.source_url ?? null,
    facts: [
      factRow('total_courts', 'Courts', v.total_courts === null || v.total_courts === undefined ? 'Not verified yet' : fmt(v.total_courts)),
      factRow('outdoor_courts', 'Outdoor', v.outdoor_courts === null || v.outdoor_courts === undefined ? 'Not verified yet' : fmt(v.outdoor_courts)),
      factRow('indoor_courts', 'Indoor', v.indoor_courts === null || v.indoor_courts === undefined ? 'Not verified yet' : fmt(v.indoor_courts)),
      factRow('light', 'Lights', triWord(v.light)),
      factRow('nets_provided', 'Nets provided', triWord(v.nets_provided)),
      factRow('restroom', 'Restroom nearby', triWord(v.restroom)),
      factRow('parking', 'Parking', v.parking ?? 'Not verified yet'),
      factRow('surface', 'Surface', v.surface ?? 'Not verified yet'),
      factRow('fee_type', 'Cost', v.fee_type ?? 'Not verified yet'),
      factRow('street_address', 'Address', v.street_address ?? 'Not verified yet'),
    ],
    hasAlternatives: alternatives.length > 0,
    alternatives: alternatives.map(a => ({
      href: venueHref(c.state, c.slug, a.slug),
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
            {'@type': 'ListItem', position: 2, name: c.stateName, item: `${PLACEHOLDER_ORIGIN}${stateHref(c.state)}`},
            {'@type': 'ListItem', position: 3, name: c.city, item: `${PLACEHOLDER_ORIGIN}${cityHref(c.state, c.slug)}`},
            {'@type': 'ListItem', position: 4, name: v.name, item: `${PLACEHOLDER_ORIGIN}${venueHref(c.state, c.slug, v.slug)}`},
          ],
        },
        {
          '@type': 'SportsActivityLocation',
          name: v.name,
          address: {
            '@type': 'PostalAddress',
            streetAddress: v.street_address ?? undefined,
            addressLocality: c.city,
            addressRegion: c.state,
            addressCountry: 'US',
          },
          /* No AggregateRating node. decisions.md O2 quarantines every
             rating field until its origin is documented, and Gate 3 allows
             the node only where real ratings exist. */
        },
      ],
    }),
  }
}

/* ---------------------------------------------------------------- */

export function filterView(stateSlug, citySlug, filter) {
  const c = data.city(stateSlug, citySlug)
  if (!c) return null
  if (!FILTERS.includes(filter)) return null
  const qualifying = Object.keys(qualifyingFilters(c.venues))
  if (!qualifying.includes(filter)) return null

  /*
    Every filter page needs its own count from getCounts(). Four of the five
    have one. /public/ does not, and must not borrow another - that is
    decisions.md O1: access_type has no controlled vocabulary, so nothing
    lawfully drives the public filter yet. Rather than render a page whose
    headline number came from a different question, the page does not exist.
  */
  const key = {
    indoor: 'venues_indoor', outdoor: 'venues_outdoor',
    free: 'venues_free', lights: 'venues_lit',
  }[filter]
  if (!key) return null
  const count = c.counts[key]

  const match = {
    indoor: v => (v.indoor_courts ?? 0) > 0,
    outdoor: v => (v.outdoor_courts ?? 0) > 0,
    free: v => v.fee_type === 'free',
    public: v => v.access_type === 'public',
    lights: v => v.light === true,
  }[filter]

  const list = c.venues.filter(match)

  return {
    filter,
    city: c.city,
    state: c.state,
    stateName: c.stateName,
    title: FILTER_TITLES[filter]({city: c.city, state: c.state, n: num(count)}),
    meta: `${fmt(num(count))} verified pickleball ${pluralise(num(count), 'venue')} in ${c.city}, ${c.state} ${filter === 'lights' ? 'with lit courts' : filter === 'free' ? 'that are free to play' : `with ${filter} courts`}. Each with a named source and a checked date.`,
    cityHref: cityHref(c.state, c.slug),
    stateHref: stateHref(c.state),
    n: fmt(num(count)),
    coverage: renderCount(count),
    venues: list
      .slice()
      .sort((a, b) => (b.total_courts ?? 0) - (a.total_courts ?? 0))
      .map(v => ({
        href: venueHref(c.state, c.slug, v.slug),
        name: v.name,
        meta: v.total_courts === null || v.total_courts === undefined
          ? 'Court count not verified yet'
          : `${fmt(v.total_courts)} ${pluralise(v.total_courts, 'court')}`,
        address: v.street_address ?? 'Not verified yet',
        checked: v.date_checked ?? null,
      })),
    jsonLd: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {'@type': 'ListItem', position: 1, name: c.stateName, item: `${PLACEHOLDER_ORIGIN}${stateHref(c.state)}`},
        {'@type': 'ListItem', position: 2, name: c.city, item: `${PLACEHOLDER_ORIGIN}${cityHref(c.state, c.slug)}`},
        {'@type': 'ListItem', position: 3, name: filter, item: `${PLACEHOLDER_ORIGIN}${cityHref(c.state, c.slug)}${filter}/`},
      ],
    }),
  }
}

/* Static params for the build. */
export const allCityParams = () =>
  data.publishedCities().map(c => ({state: String(c.state).toLowerCase(), city: c.slug}))

export const allStateParams = () =>
  data.publishedStates().map(s => ({state: s.slug}))

export function allLeafParams() {
  const out = []
  for (const c of data.publishedCities()) {
    const full = data.city(c.state, c.slug)
    for (const f of Object.keys(qualifyingFilters(full.venues))) {
      out.push({state: String(c.state).toLowerCase(), city: c.slug, slug: f})
    }
    for (const v of full.venues) {
      out.push({state: String(c.state).toLowerCase(), city: c.slug, slug: v.slug})
    }
  }
  return out
}
