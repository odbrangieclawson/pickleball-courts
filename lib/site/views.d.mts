/*
  Types for views.mjs.

  The data and page layers are plain .mjs on purpose — they are shared with
  the Node scripts under scripts/, which run without a build step. The route
  files under app/ are TypeScript, so this declaration is the seam between
  them. It describes what a route may render and nothing else.

  Note what is absent: no view exposes a raw venue record or an array of
  them to a route. A route receives finished strings and booleans, which is
  Decision D2 expressed in the type system as well as in the build scan.
*/

export type CardLink = {
  href: string
  title: string
  meta: string
  blurb?: string
  trust?: string
}

export type HomeView = {
  headline: string
  venues: string
  courts: string
  cityCount: string
  cityWord: string
  lastChecked: string
  gapSentence: string
  cityWordLower: string
  hasQuickLinks: boolean
  quickLinks: {href: string; label: string}[]
  jsonLd: string
  cities: CardLink[]
}

export type StateView = {
  stateName: string
  state: string
  title: string
  meta: string
  venues: string
  courts: string
  cityCount: string
  cityWord: string
  litLine: string
  cities: CardLink[]
  jsonLd: string
}

export type CityFilterLink = {slug: string; href: string; label: string}

export type CityVenueRow = {
  href: string | null
  name: string
  courts: string
  indoorOutdoor: string
  lights: string
  nets: string
  fee: string
  address: string
  checked: string | null
  source: string | null
  detail: string
}

export type EditorialNote = {
  key: string
  heading: string
  text: string
  sources: {url: string; publisher: string; retrieved: string}[]
}

export type CityView = {
  city: string
  state: string
  stateName: string
  county: string | null
  title: string
  meta: string
  h1: string
  stateHref: string
  venuesN: string
  courtsN: string
  outdoorN: string
  indoorN: string
  litLine: string
  freeLine: string
  lastChecked: string
  hasEditorial: boolean
  editorialDate: string | null
  editorial: EditorialNote[]
  countyName: string | null
  countyLink: {href: string; label: string; venues: number} | null
  stateLink: {href: string; label: string} | null
  hasNearby: boolean
  nearbyPublished: {href: string; label: string; venues: number; kmAway: string}[]
  hasBestFor: boolean
  bestFor: {key: string; heading: string; text: string; href: string | null}[]
  hasFaqs: boolean
  faqs: {q: string; a: string}[]
  venuePagesN: string
  hasFilters: boolean
  filters: CityFilterLink[]
  venues: CityVenueRow[]
  jsonLd: string
}

export type FactRow = {
  label: string
  value: string
  source: string | null
  checked: string | null
  evidence: string | null
}

export type VenueFact = {
  key: string
  label: string
  value: string
  verified: boolean
  source: string | null
  checked: string | null
}

export type VenueView = {
  slug: string
  name: string
  city: string
  state: string
  stateName: string
  title: string
  meta: string
  cityHref: string
  countyLink: {href: string; label: string; venues: number} | null
  stateLink: {href: string; label: string} | null
  trust: string
  trustRank: number
  claimable: boolean
  checked: string | null
  source: string | null
  facts: VenueFact[]
  knownFactsN: string
  totalFactsN: string
  hasNotes: boolean
  notes: {key: string; heading: string; text: string}[]
  hasFaqs: boolean
  faqs: {q: string; a: string}[]
  noteSources: {url: string; publisher: string; retrieved: string}[]
  hasAlternatives: boolean
  alternatives: {href: string; name: string; meta: string}[]
  jsonLd: string
}

export type FilterVenue = {
  slug: string
  href: string | null
  name: string
  meta: string
  address: string
  checked: string | null
}

export type FilterView = {
  filter: string
  filterLabel: string
  city: string
  state: string
  stateName: string
  title: string
  meta: string
  h1: string
  predicate: string
  exclusions: string
  cityHref: string
  n: string
  venueWord: string
  courtsN: string
  cityVenuesN: string
  coverage: string
  hasEditorial: boolean
  editorial: {key: string; heading: string; text: string}[]
  editorialSources: {url: string; publisher: string; retrieved: string}[]
  hasFaqs: boolean
  faqs: {q: string; a: string}[]
  venues: FilterVenue[]
  jsonLd: string
}

export function homeView(): HomeView
export function stateView(slug: string): StateView | null
export function cityView(stateSlug: string, citySlug: string): CityView | null
export function venueView(stateSlug: string, citySlug: string, venueSlug: string): VenueView | null
export function filterView(stateSlug: string, citySlug: string, filter: string): FilterView | null
export function triWord(v: boolean | null | undefined, yes?: string, no?: string): string

export function allStateParams(): {state: string}[]
export function allCityParams(): {state: string; city: string}[]
export function allLeafParams(): {state: string; city: string; slug: string}[]

export type CountyView = {
  county: string
  state: string
  stateName: string
  slug: string
  title: string
  meta: string
  h1: string
  venuesN: string
  courtsN: string
  cityCountN: string
  cityWord: string
  litLine: string
  lastChecked: string
  stateLink: {href: string; label: string} | null
  stateHrefFallback: string
  cities: {city: string; slug: string; venues: number; courts: number; link: {href: string; label: string; venues: number}}[]
  hasFaqs: boolean
  faqs: {q: string; a: string}[]
  hasEditorial: boolean
  editorial: EditorialNote[]
  venues: {href: string | null; name: string; city: string; courts: string; lights: string; checked: string | null}[]
  jsonLd: string
}

export function countyView(stateSlug: string, countySlug: string): CountyView | null
export function allCountyParams(): {state: string; city: string}[]

export function navView(): {href: string; label: string}[]

export function venuePagePublishes(slug: string): boolean

export type ProvenanceView = {
  totalN: string
  venuesN: string
  freshN: string
  dueN: string
  staleN: string
  cadenceSummary: string
  sources: {url: string; facts: string}[]
  verifiers: {by: string; facts: string}[]
  rows: {
    slug: string; venue: string; field: string; value: string | null
    date_checked: string | null; age: string; cadence: string
    staleness: string; verified_by: string
  }[]
}

export function provenanceView(): ProvenanceView

export type SearchHit = {type: string; label: string; href: string; meta: string}

export type SearchView = {
  query: string
  kind: string
  heading: string
  note: string
  hasResults: boolean
  results: SearchHit[]
  hasSuggestions: boolean
  suggestions: SearchHit[]
}

export function searchView(q: string): SearchView
