import type {Metadata} from 'next'
import {homeView} from '../lib/site/views.mjs'

/*
  Home.

  Structure follows findswimmingholes, which the strategy names as the model
  in §7: lead with a hard verified count, then a browse directory with counts
  per place, then the trust argument. The count IS the value proposition, so
  it is the first thing on the page and it is set as a figure, not a stat
  tile.

  Two deliberate departures. There is no search box, because there is no
  search — this site is statically rendered and Rule 1 forbids a JS-only
  feature in the content path, so offering a box that cannot work would be
  worse than browsing. And there are no photographs, because we have none;
  the page is carried by type and rule instead, which suits a directory
  selling traceability better than stock imagery would.

  Every number here comes from getCounts() via lib/site/views.mjs. This file
  holds no arithmetic, which is what keeps validate-no-bypass.mjs quiet and
  Decision D2 true.
*/

export const metadata: Metadata = {
  title: 'Deep Pickleball — verified courts, with sources',
  description:
    'Pickleball courts with a named source and a checked date on every fact. We publish what we have verified, and we publish the gaps too.',
  robots: {index: false, follow: false},
  alternates: {canonical: '/'},
}

export default function Home() {
  const v = homeView()

  return (
    <div className="wrap page">
      <p className="eyebrow">A US pickleball court directory</p>
      <h1>{v.headline}</h1>
      <p className="lede">
        {v.venues} verified pickleball venues across {v.cityCount}{' '}
        {v.cityWordLower}, every fact checked against a named source before it
        earns a page here. Where something has not been verified, we say
        &ldquo;not verified yet&rdquo; — never a zero, never a guess.
      </p>

      <form className="searchbar" action="/search/" method="get" role="search">
        <label className="visually-hidden" htmlFor="q">
          City, state, ZIP code or court name
        </label>
        <input
          id="q"
          name="q"
          type="search"
          placeholder="City, state, ZIP code, or court name"
          autoComplete="off"
        />
        <button type="submit">Find courts</button>
      </form>

      {v.hasQuickLinks && (
        <ul className="quicklinks">
          {v.quickLinks.map(l => (
            <li key={l.href}><a href={l.href}>{l.label}</a></li>
          ))}
        </ul>
      )}

      <div className="stats">
        <div className="stat">
          <span className="n">{v.venues}</span>
          <span className="k">Verified venues</span>
        </div>
        <div className="stat">
          <span className="n">{v.courts}</span>
          <span className="k">Courts</span>
        </div>
        <div className="stat">
          <span className="n">{v.cityCount}</span>
          <span className="k">{v.cityWord}</span>
        </div>
        <div className="stat">
          <span className="n">{v.lastChecked}</span>
          <span className="k">Last checked</span>
        </div>
      </div>

      <h2>Where we have verified</h2>
      <ul className="cards">
        {v.cities.map(c => (
          <li className="card" key={c.href}>
            <h3><a href={c.href}>{c.title}</a></h3>
            <p className="meta">{c.meta}</p>
            <p>{c.blurb}</p>
            <span className="trust">{c.trust}</span>
          </li>
        ))}
      </ul>

      <h2>What makes this different</h2>
      <p>
        Not one of the large pickleball directories tells you where a court
        count came from or when anyone last looked. One ships contradictory
        counts on the same city page. Another has twenty-five thousand pages
        and needs JavaScript to show you any of them.
      </p>
      <p>
        This directory publishes a far smaller number of pages and stands
        behind every one. Each page passes six quality gates before it ships,
        and the gate that stops the most pages is the one that asks whether a
        person actually wrote about the place.{' '}
        <a href="/how-we-verify/">How we verify</a>.
      </p>

      <div className="note is-gap">
        <h3>The gaps, published</h3>
        <p>
          {v.gapSentence} We would rather show you an honest hole than fill it
          with something we made up. Every unverified field carries a link to
          tell us what we have wrong.
        </p>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{__html: v.jsonLd}}
      />
    </div>
  )
}
