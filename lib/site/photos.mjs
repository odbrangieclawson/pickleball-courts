/*
  WHICH PICTURE GOES ON WHICH PAGE, AND WHAT IT CLAIMS.

  Two sets, and the difference between them is the whole point.

  A CITY PHOTO IS A PHOTOGRAPH OF THAT CITY. Seattle Center on the Seattle
  card, Pearl Street Mall on Boulder's. It is true, so it carries no
  disclaimer, only its credit.

  A COURT PHOTO IS NOT A PHOTOGRAPH OF THAT VENUE. Nobody has been to the
  275 venues on this site. These are openly licensed photographs of other
  people's pickleball courts, assigned so that the same venue always shows
  the same one and a city page does not repeat a single image down the grid.
  Every one keeps the "No photo yet" marker it has always had, because the
  alternative is an image asserting something no source supports, which is
  the exact failure the marker was invented to prevent.

  Provenance lives in data/images/photos.json, written by
  scripts/images/fetch-photos.mjs: author, licence, licence URL and the
  Commons file page for every file. CC BY and CC BY-SA require attribution,
  so the credit is not decoration; it is the term we publish under.
*/
import {readFileSync, existsSync} from 'node:fs'
import {join} from 'node:path'
import {REPO_ROOT} from '../../scripts/lib/load-csv.mjs'

const PATH = join(REPO_ROOT, 'data', 'images', 'photos.json')
const DB = existsSync(PATH) ? JSON.parse(readFileSync(PATH, 'utf8')) : {cities: {}, courts: []}

const creditOf = p => ({
  author: p.author ?? null,
  licence: p.licence ?? null,
  licenceUrl: p.licenceUrl ?? null,
  filePage: p.filePage ?? null,
})

/**
 * The photograph of a city, or null where we have none. Null is a real
 * answer: the card renders without an image rather than borrowing one from
 * somewhere else.
 */
export function cityPhoto(state, citySlug, cityName) {
  const p = DB.cities?.[`${String(state).toUpperCase()}/${citySlug}`]
  if (!p) return null
  return {
    src: p.src,
    width: p.width,
    height: p.height,
    alt: p.alt ?? `${cityName ?? citySlug}.`,
    isPlaceholder: false,
    credit: creditOf(p),
  }
}

/** The photograph of a state, or null. */
export function statePhoto(state, stateName) {
  const p = DB.states?.[String(state).toUpperCase()]
  if (!p) return null
  return {
    src: p.src, width: p.width, height: p.height,
    alt: p.alt ?? `${stateName ?? state}.`,
    isPlaceholder: false,
    depicts: null,
    credit: creditOf(p),
  }
}

/*
  The photograph of a county.

  Most county articles lead with their courthouse, which is a real
  photograph of the county and the wrong picture for a directory of places
  to play. Those counties borrow the photograph of their largest published
  city, and `depicts` names that city so the caption can say what the
  picture actually shows. A photograph of Seattle IS a photograph of
  somewhere in King County; it would only mislead if the page implied it
  were a view of the whole county.
*/
export function countyPhoto(state, county) {
  const p = DB.counties?.[`${String(state).toUpperCase()}/${county}`]
  if (!p) return null
  if (p.useCity) {
    const c = DB.cities?.[p.useCity]
    if (!c) return null
    return {
      src: c.src, width: c.width, height: c.height,
      alt: `${p.depicts}, in ${p.label}.`,
      isPlaceholder: false,
      depicts: p.depicts,
      credit: creditOf(c),
    }
  }
  return {
    src: p.src, width: p.width, height: p.height,
    alt: p.alt ?? `${p.label}.`,
    isPlaceholder: false,
    depicts: null,
    credit: creditOf(p),
  }
}

/*
  A small stable hash. The same venue must get the same photograph on every
  build and on every page it appears, or a reader who saw a card and then
  opened the page would be looking at two different pictures of a place we
  have never photographed at all.
*/
const hash = s => {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) }
  return Math.abs(h)
}

/** One of the court photographs, chosen from the venue's slug. */
export function courtPhoto(venueSlug, venueName) {
  const set = DB.courts ?? []
  if (!set.length) {
    /* The set is empty only before the fetch script has run. */
    return {
      src: '/placeholder-court.jpg',
      width: 1600,
      height: 977,
      alt: `Generic pickleball net. We do not have a photograph of ${venueName}.`,
      isPlaceholder: true,
      credit: null,
    }
  }
  const p = set[hash(String(venueSlug)) % set.length]
  return {
    src: p.src,
    width: p.width,
    height: p.height,
    alt: `A pickleball court, not ${venueName}. We do not have a photograph of this venue.`,
    isPlaceholder: true,
    credit: creditOf(p),
  }
}

/*
  THE PICTURE A CITY, COUNTY OR STATE SHOWS.

  None of them carries a landmark photograph any more. A skyline, a
  courthouse or a mountain is a true picture of the place and the wrong
  picture for this site: somebody who meets "Pickleball Courts in Wichita"
  in a result list, a shared link or the home page grid should see a court,
  not a bridge. So these draw from the same court set the venue cards use,
  chosen by a stable hash of the page key so the picture never moves between
  builds and neighbouring places do not collide.

  Every one is a placeholder and says so. It is NOT a photograph of a court
  in that place — nobody has been to these venues — so wherever it renders
  on a page it keeps the "No photo yet" marker, exactly like a venue card.
  The only place the marker is absent is the share/search card, which has no
  room for one; its alt text carries the disclaimer instead.

  cityPhoto(), countyPhoto() and statePhoto() below are unused as of
  2026-09-09. They are left in place, with their files under public/city,
  public/county and public/state, so that restoring landmark photography is
  a one-line change rather than a re-fetch.
*/
export function courtCardPhoto(key, label) {
  const set = DB.courts ?? []
  const alt = `A pickleball court. Not a photograph of a court in ${label}.`
  if (!set.length) {
    return {src: '/placeholder-court.jpg', width: 1600, height: 977, alt, isPlaceholder: true, depicts: null, credit: null}
  }
  const p = set[hash(String(key)) % set.length]
  return {src: p.src, width: p.width, height: p.height, alt, isPlaceholder: true, depicts: null, credit: creditOf(p)}
}

/** The court picture that stands for a city. */
export const cityCourtPhoto = (state, citySlug, cityName) =>
  courtCardPhoto(`${String(state).toUpperCase()}/${citySlug}`, cityName ?? citySlug)

/** Everything we publish, for the credits page. */
export function allPhotoCredits() {
  const cities = Object.entries(DB.cities ?? {}).map(([key, p]) => ({
    kind: 'city',
    /* The city in words. Older records predate the label, so the key is the
       fallback rather than the default. */
    where: p.label ?? key,
    src: p.src,
    file: p.file,
    ...creditOf(p),
  }))
  const courts = (DB.courts ?? []).map(p => ({
    kind: 'court',
    where: 'venue cards',
    src: p.src,
    file: p.file,
    ...creditOf(p),
  }))
  const states = Object.entries(DB.states ?? {}).map(([key, p]) => ({
    kind: 'state', where: p.label ?? key, src: p.src, file: p.file, ...creditOf(p),
  }))
  /* A county that borrows its city's photograph is credited on the city
     row, so listing it again here would credit one file twice. */
  const counties = Object.entries(DB.counties ?? {})
    .filter(([, p]) => !p.useCity)
    .map(([key, p]) => ({kind: 'county', where: p.label ?? key, src: p.src, file: p.file, ...creditOf(p)}))
  return {retrieved: DB.retrieved ?? null, cities, counties, states, courts}
}
