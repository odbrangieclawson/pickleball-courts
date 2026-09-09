import type {Metadata} from 'next'
import type {SearchView} from '../../lib/site/views.d.mts'
import {searchView, searchFallbackView} from '../../lib/site/views.mjs'

/*
  Search results.

  Rendered on the server from the query string, so it works with JavaScript
  disabled — the form on the home page is a plain GET and this page reads
  what it sent. That is the whole implementation. No client bundle, no
  typeahead, no hydration.

  NOINDEX, and not in the sitemap. Decision D4 says exactly five facets get
  real indexable URLs and everything else is a noindex query parameter; a
  results page keyed on ?q= is the same class of thing. It is a navigation
  aid for a person, not a page competing for a search term, and letting
  thousands of ?q= permutations into the index is how a directory
  cannibalises its own city pages.
*/

export const metadata: Metadata = {
  title: 'Search',
  description: 'Find a verified pickleball venue by city, state, ZIP code or name.',
  robots: {index: false, follow: true},
}

type Props = {searchParams: Promise<{q?: string; filter?: string}>}

/*
  ?filter= is the home page's category buttons landing here. It is a
  separate parameter from ?q= rather than a canned query string, so the
  button is answered by the category itself and cannot start matching a
  venue whose name happens to contain the word. See lib/site/search.mjs.
*/
export default async function SearchPage({searchParams}: Props) {
  const {q, filter} = await searchParams
  /*
    A thrown error here used to become Next's generic 500. This route is
    the only one rendered on demand, so it is the only one that can fail
    at request time — and a 500 on a directory is the failure mode O9
    records a competitor losing traffic to, because a crawler keeps a
    500'd URL and retires a 404'd one.
  
    The fallback is server-rendered, so it still works with JavaScript
    off. The error is logged rather than swallowed: it stays in the
    function log, and npm run check:search still exercises the real path.
  */
  let v: SearchView
  try {
    v = searchView(q ?? '', filter ?? null)
  } catch (err) {
    console.error('[search] index unavailable, serving fallback:', err)
    v = searchFallbackView(typeof q === 'string' ? q : '')
  }
  return (
    <div className="wrap page">
      <nav aria-label="Breadcrumb" className="crumbs">
        <a href="/">Home</a> › Search
      </nav>

      <h1>{v.heading}</h1>

      {/* Same enhancement as the home page: the nearby dropdown attaches
          to this field too, so a reader who lands here from a bad query can
          be shown what is actually near them instead of retyping. */}
      <form className="searchbar is-page" action="/search/" method="get" role="search" data-suggest="">
        <label className="visually-hidden" htmlFor="q">
          City, state, ZIP code or court name
        </label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={v.inputValue}
          placeholder="City, state, ZIP code, or court name"
          autoComplete="off"
        />
        <button type="submit">Search</button>
      </form>

      <p className="lede">{v.note}</p>

      {/*
          Results are cards, the same shape the rest of the site uses: the
          court picture, the name, where it is, and the stated facts as
          badges. A row of underlined text told a reader nothing about
          whether a result was worth opening.

          The image is a link with aria-hidden and tabIndex -1, so the
          heading beneath is the one real link per card rather than two
          identical destinations for a keyboard or screen-reader user.
        */}
      {v.hasResults && (
        <ul className="cards is-tiles">
          {v.results.map(r => (
            <li className="card has-shot" key={r.href}>
              {r.photo && (
                <a className="card-shot" href={r.href} tabIndex={-1} aria-hidden="true">
                  <span className="shot">
                    <img
                      src={r.photo.src}
                      alt=""
                      width={r.photo.width}
                      height={r.photo.height}
                      loading="lazy"
                      decoding="async"
                    />
                    {r.photo.isPlaceholder && (
                      <span className="placeholder-mark">No photo yet</span>
                    )}
                  </span>
                </a>
              )}
              <div className="card-body">
                <h3><a href={r.href}>{r.label}</a></h3>
                <p className="meta">{r.detail ?? r.meta}</p>
                {(v.showResultType || r.badges[0]) && (
                  <p className="badges" data-not-prose>
                    {v.showResultType && <span className="badge">{r.typeLabel}</span>}
                    {r.badges.map(b => <span className="badge" key={b}>{b}</span>)}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {v.hasSuggestions && (
        <>
          <h2>Everything we publish</h2>
          <p>
            Every city and county page on the site, in full. We would rather
            show you the real extent of the directory than pad a results list
            with near-misses.
          </p>
          <ul className="cards is-tiles">
          {v.suggestions.map(r => (
            <li className="card has-shot" key={r.href}>
              {r.photo && (
                <a className="card-shot" href={r.href} tabIndex={-1} aria-hidden="true">
                  <span className="shot">
                    <img
                      src={r.photo.src}
                      alt=""
                      width={r.photo.width}
                      height={r.photo.height}
                      loading="lazy"
                      decoding="async"
                    />
                    {r.photo.isPlaceholder && (
                      <span className="placeholder-mark">No photo yet</span>
                    )}
                  </span>
                </a>
              )}
              <div className="card-body">
                <h3><a href={r.href}>{r.label}</a></h3>
                <p className="meta">{r.detail ?? r.meta}</p>
                {(true || r.badges[0]) && (
                  <p className="badges" data-not-prose>
                    {true && <span className="badge">{r.typeLabel}</span>}
                    {r.badges.map(b => <span className="badge" key={b}>{b}</span>)}
                  </p>
                )}
              </div>
            </li>
          ))}
          </ul>
        </>
      )}

      <div className="note is-gap">
        <h3>Why a search here returns so little</h3>
        <p>
          Search only ever returns pages that exist, and a page only exists
          once its facts have been checked against a named source.{' '}
          {v.scaleSentence}{' '}
          <a href="/how-we-verify/">How we verify</a> explains the standard a
          record has to meet.
        </p>
      </div>

      <script src="/search-suggest.js" defer />
    </div>
  )
}
