/*
  WHERE THE VISITOR APPEARS TO BE — the coarse, no-prompt half of the
  search box's nearby suggestions.

  ============================================================
  WHY THIS ROUTE EXISTS
  ============================================================

  Tapping the search field should show courts near you before you type
  anything. The browser's own Geolocation API cannot do that: it always
  raises a permission dialog, and a site that throws a location prompt at
  somebody who has clicked into a text box has asked for something before
  giving them a reason to say yes.

  Vercel already resolves the requesting IP to a city and a rough
  coordinate, and hands it to the function as request headers. That is
  enough to say "near Seattle" on the first tap with no dialog at all, and
  it is derived from an IP address the host was going to log anyway —
  nothing new is collected about anybody. The precise answer stays behind
  an explicit button, where it belongs.

  ============================================================
  WHAT THIS ROUTE DOES NOT DO
  ============================================================

  It does not store anything. It does not receive anything: there is no
  request body, no query parameter, and in particular no path by which a
  browser's precise coordinates could be posted here. When a visitor grants
  precise location, the ranking happens in their browser against
  /suggest.json and their position never leaves the device — see
  public/search-suggest.js.

  It returns a city and a coordinate pair and forgets the request.

  ============================================================
  WHY IT IS AN api ROUTE AND NOT PART OF A PAGE
  ============================================================

  Every page on this site is prerendered. Reading a request header on the
  home page would make the home page dynamic — the LCP element behind a
  function invocation, on the one route that must be fastest, to decorate a
  dropdown most visitors never open. So the page stays static and this one
  small handler is the only thing that runs per request.

  Rule 1 is untouched: the search form is a plain GET that works with
  scripting off, and this route is only ever reached by an enhancement
  layered on top of it. Nothing here renders content, so nothing here can
  be content that fails to render.
*/
import {headers} from 'next/headers'

/*
  A header read makes this request-time by construction. Saying so
  explicitly means the build never tries to prerender an answer, which
  would bake one visitor's city into a file served to everybody.
*/
export const dynamic = 'force-dynamic'

/** Vercel percent-encodes city names, so "New York" arrives as "New%20York". */
const decode = (v: string | null) => {
  if (!v) return null
  try {
    return decodeURIComponent(v).trim() || null
  } catch {
    return v.trim() || null
  }
}

/*
  THE MISSING-HEADER CASE HAS TO BE CAUGHT BEFORE Number() SEES IT.

  Number(null) is 0 and Number('') is 0, so a first draft of this that read
  a header which was not there answered {lat: 0, lng: 0} — Null Island, in
  the Atlantic off Ghana — with known: true. Every visitor who was not on
  Vercel would have been told the nearest court to them was in Florida,
  confidently and with a distance attached.

  It is the same failure Rule 6 exists to stop: a null coerced into a
  number that looks like an answer. An absent coordinate is not zero.
*/
const coord = (v: string | null, limit: number) => {
  if (v === null || v.trim() === '') return null
  const n = Number(v)
  return Number.isFinite(n) && Math.abs(n) <= limit ? n : null
}

export async function GET() {
  const h = await headers()

  const lat = coord(h.get('x-vercel-ip-latitude'), 90)
  const lng = coord(h.get('x-vercel-ip-longitude'), 180)
  const city = decode(h.get('x-vercel-ip-city'))
  const region = decode(h.get('x-vercel-ip-country-region'))
  const country = decode(h.get('x-vercel-ip-country'))

  /*
    In `next dev`, and anywhere that is not Vercel, none of those headers
    exist. That is not an error — it is a visitor we cannot place, and the
    dropdown has a perfectly good answer for that case: the list of cities
    we publish. So this returns a well-formed "we do not know" rather than
    a status code the client has to special-case.
  */
  const known = lat !== null && lng !== null

  return Response.json(
    known
      ? {known: true, lat, lng, city, region, country, source: 'ip'}
      : {known: false},
    {
      headers: {
        /*
          The answer is different for every visitor, so it must never be
          held in a shared cache. `private` keeps a CDN out of it and
          `no-store` keeps it out of the browser's disk cache too: a file
          on disk saying which city somebody was in is a record we said we
          would not keep.
        */
        'cache-control': 'private, no-store',
        /* Nothing here is a page. Keep it out of any index. */
        'x-robots-tag': 'noindex',
      },
    },
  )
}
