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
  href: string
  name: string
  courts: string
  indoorOutdoor: string
  lights: string
  nets: string
  fee: string
  address: string
  checked: string | null
  source: string | null
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

export type VenueView = {
  name: string
  city: string
  state: string
  stateName: string
  title: string
  meta: string
  cityHref: string
  stateHref: string
  verifiedBy: string
  checked: string | null
  source: string | null
  facts: FactRow[]
  hasAlternatives: boolean
  alternatives: {href: string; name: string; meta: string}[]
  jsonLd: string
}

export type FilterVenue = {
  href: string
  name: string
  meta: string
  address: string
  checked: string | null
}

export type FilterView = {
  filter: string
  city: string
  state: string
  stateName: string
  title: string
  meta: string
  cityHref: string
  stateHref: string
  n: string
  coverage: string
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
