export type StaticMapPin = {
  key: string
  name: string | null
  href: string | null
  left: number
  top: number
}

export type StaticMap = {
  width: number
  height: number
  zoom: number
  tiles: {z: number; x: number; y: number; src: string; left: number; top: number}[]
  pins: StaticMapPin[]
  attribution: {text: string; href: string}
}

export type SitePhoto = {
  /** Names what a borrowed photograph actually shows, on county pages. */
  depicts?: string | null
  src: string
  width: number
  height: number
  alt: string
  isPlaceholder: boolean
  caption?: string
  credit: {author: string | null; licence: string | null; licenceUrl: string | null; filePage: string | null} | null
}

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

export type Photo = {
  src: string
  width: number
  height: number
  alt: string
  isPlaceholder: boolean
  caption: string
}

export type CardLink = {
  href: string
  title: string
  meta: string
  blurb?: string
  trust?: string
  /** The home page's city cards. A court placeholder, never a landmark. */
  photo?: SitePhoto | null
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
  sourcesPerVenue: string
  /** Number of states with a published city, formatted. */
  stateCount: string
  hasFilterButtons: boolean
  filterButtons: {filter: string; label: string; href: string}[]
  jsonLd: string
  cities: CardLink[]
  statesHeading: string
  statesNote: string
  states: StateCard[]
}

/*
  A state card on the home page. Every card has an href since 2026-09-09:
  a state with three published cities and a written note gets its state
  page, and the rest get a search for the state, which resolves to their
  published cities and counties. `hrefKind` says which, so the template can
  announce a results page to assistive technology.
*/
export type StateCard = {
  key: string
  mark: string
  /*
    The state's own outline, from the US Census 20m cartographic boundary
    file (public domain), built by scripts/build-state-outlines.mjs. Null
    only if that data file is missing, in which case the card falls back to
    the postal abbreviation and still renders.
  */
  outline: {viewBox: string; d: string} | null
  stateName: string
  rank: string
  venues: string
  courts: string
  meta: string
  href: string
  /** 'state' = a real state page; 'search' = a search for that state. */
  hrefKind: 'state' | 'search'
  cityLabel: string
  cities: {href: string; label: string}[]
}

export type StateView = {
  stateName: string
  state: string
  /** Always null since 2026-09-09: no landmark hero. */
  photo: SitePhoto | null
  /**
   * The share and search-result image. A pickleball court, never a
   * landmark, and never rendered on the page itself.
   */
  cardPhoto: {
    src: string
    width: number
    height: number
    alt: string
    credit: {author: string | null; licence: string | null; licenceUrl: string | null; filePage: string | null} | null
  }
  title: string
  meta: string
  venues: string
  courts: string
  cityCount: string
  cityWord: string
  litLine: string
  lastChecked: string
  cities: CardLink[]
  hasVenueCards: boolean
  hasCityChips: boolean
  hasFilterChips: boolean
  /**
   * Only filters this state can answer: a chip exists where at least one of
   * its cities publishes that filter page. `cities` counts CITIES, not
   * courts, and the chip renders the word.
   */
  filterChips: {filter: string; label: string; cities: number; href: string}[]
  /** Every published venue in the state, biggest first. */
  venueCards: {
    key: string
    href: string
    name: string
    where: string
    /** Null where the operator publishes no count: no badge rather than a zero. */
    courts: string | null
    inOut: string | null
    type: string | null
    lit: boolean
    photo: Photo
  }[]
  /** Shortcut chips under the search box: published cities, largest first. */
  cityChips: {label: string; href: string}[]
  hasEditorial: boolean
  editorial: EditorialNote[]
  hasFaqs: boolean
  faqs: {q: string; a: string}[]
  jsonLd: string
}

export type CityFilterLink = {slug: string; href: string; label: string}

export type CityVenueRow = {
  photo: Photo
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
  outdoorN: string | null
  indoorN: string | null
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
  allVenuesHavePages: boolean
  sources: {publisher: string; url: string; checked: string | null; tier: number | null}[]
  hasFilters: boolean
  filters: CityFilterLink[]
  venues: CityVenueRow[]
  jsonLd: string
  /** Null when no venue in the city carries a geocode. */
  map: StaticMap | null
  /** How many venues the map could place, which may be fewer than all. */
  mappedN: number
  /** Always null since 2026-09-09: city pages carry no landmark photograph. */
  photo: SitePhoto | null
  /**
   * The share and search-result image only. Never rendered on the page: it
   * is a pickleball court, not a photograph of a court in this city.
   */
  cardPhoto: {
    src: string
    width: number
    height: number
    alt: string
    credit: {author: string | null; licence: string | null; licenceUrl: string | null; filePage: string | null} | null
  }
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
  /** Prose rather than a word or number: rendered full-width, after the short rows. */
  wide: boolean
  verified: boolean
  source: string | null
  checked: string | null
  sourceLabel: string | null
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
  photo: Photo
  trust: string
  trustRank: number
  /** Off by default; see VENUE_MAPS in views.mjs for the repo-size trade-off. */
  map: StaticMap | null
  /** Get directions target, or null when the venue has neither coordinates nor an address. */
  directions: {href: string; precise: boolean} | null
  streetAddress: string | null
  /**
   * The action panel: what a player checks, and what they do next. Cost and
   * hours are always strings and say "Not stated" when the operator has not
   * published one. The two links are null when there is nothing to link to.
   */
  panel: {
    courts: number | null
    split: string | null
    cost: string
    hours: string
    phone: string | null
    phoneHref: string | null
    website: string | null
    websiteLabel: string | null
  }
  claimable: boolean
  /** mailto: links; see lib/site/contact.mjs. */
  claimHref: string
  correctionHref: string
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
  alternatives: {href: string; photo: Photo; name: string; meta: string}[]
  jsonLd: string
}

export type FilterVenue = {
  photo: Photo
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
  /** Always null since 2026-09-09: no landmark hero. */
  photo: SitePhoto | null
  /**
   * The share and search-result image. A pickleball court, never a
   * landmark, and never rendered on the page itself.
   */
  cardPhoto: {
    src: string
    width: number
    height: number
    alt: string
    credit: {author: string | null; licence: string | null; licenceUrl: string | null; filePage: string | null} | null
  }
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
  venuePagesN: string
  allVenuesHavePages: boolean
  venues: CountyVenueRow[]
  jsonLd: string
}

/*
  The county table row and its card are the same row rendered twice, so they
  are one type. `city` is what a county row has that a city row does not:
  a county spans several, and which one a venue is in is the fact that
  decides whether it is worth the drive.
*/
export type CountyVenueRow = {
  href: string | null
  name: string
  city: string
  courts: string
  lights: string
  checked: string | null
  address: string
  photo: Photo
  detail: string
}

export function countyView(stateSlug: string, countySlug: string): CountyView | null
export function allCountyParams(): {state: string; city: string}[]

export type NavGroup = {
  state: string
  label: string
  href: string | null
  cities: {href: string; label: string}[]
  counties: {href: string; label: string}[]
  hasCounties: boolean
  /** Where the state link in the Browse by state menu goes. */
  browseHref: string
  /** "3 cities", shown beside the name. */
  cityLabel: string
}

export function navView(): {
  groups: NavGroup[]
  /** The guide pages, as one submenu rather than three bar items. */
  guides: {href: string; label: string; blurb: string}[]
  links: {href: string; label: string}[]
}

export function venuePagePublishes(state: string, city: string, slug: string): boolean
export function statePagePublishes(state: string): boolean

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

export type SearchHit = {
  type: string
  typeLabel: string
  label: string
  href: string
  meta: string
  /** Where it is, or what it holds. Falls back to `meta` when absent. */
  detail: string | null
  /** The card image: a court, marked as a stand-in. */
  photo: Photo | null
  /** Stated facts only — no badge where the operator publishes nothing. */
  badges: string[]
}

export type SearchView = {
  query: string
  kind: string
  heading: string
  inputValue: string
  note: string
  hasResults: boolean
  results: SearchHit[]
  showResultType: boolean
  hasSuggestions: boolean
  suggestions: SearchHit[]
  scaleSentence: string
}

export function searchView(q: string, filter?: string | null): SearchView
/** The page rendered when the search index cannot be read. Needs no data. */
export function searchFallbackView(q?: string): SearchView
