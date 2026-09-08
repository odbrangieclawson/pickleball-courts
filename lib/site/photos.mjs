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

/** Everything we publish, for the credits page. */
export function allPhotoCredits() {
  const cities = Object.entries(DB.cities ?? {}).map(([key, p]) => ({
    kind: 'city',
    where: key,
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
  return {retrieved: DB.retrieved ?? null, cities, courts}
}
