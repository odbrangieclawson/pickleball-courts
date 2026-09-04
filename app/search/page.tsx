import type {Metadata} from 'next'
import {searchView} from '../../lib/site/views.mjs'

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
  const v = searchView(q ?? '', filter ?? null)

  return (
    <div className="wrap page">
      <nav aria-label="Breadcrumb" className="crumbs">
        <a href="/">Home</a> › Search
      </nav>

      <h1>{v.heading}</h1>

      <form className="searchbar is-page" action="/search/" method="get" role="search">
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

      {v.hasResults && (
        <ul className="results">
          {v.results.map(r => (
            <li key={r.href}>
              <a href={r.href}>{r.label}</a>
              {v.showResultType && <span className="results-type">{r.typeLabel}</span>}
              <span className="results-meta">{r.meta}</span>
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
          <ul className="results">
            {v.suggestions.map(r => (
              <li key={r.href}>
                <a href={r.href}>{r.label}</a>
                <span className="results-type">{r.typeLabel}</span>
                <span className="results-meta">{r.meta}</span>
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
    </div>
  )
}
