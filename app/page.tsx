import type {Metadata} from 'next'
import {homeView} from '../lib/site/views.mjs'

/*
  Home.

  A photographic hero over a search field, then the directory on paper.

  The structural idea is still the one strategy §7 names: lead with the hard
  verified count, because the number IS the value proposition. It sits in the
  hero as a proof line under the search rather than being buried below the
  fold, which is where findswimmingholes puts "1,216 verified spots" and it
  is the right instinct.

  THE SEARCH IS A PLAIN GET FORM. No JavaScript, so it works with scripting
  disabled, the results are linkable and the back button behaves. The button
  is a real solid button with a word on it rather than an icon alone —
  icon-only controls fail people using screen readers and people who do not
  recognise the glyph, and a magnifier in a circle is not as obvious as the
  design convention assumes.

  THE HERO IMAGE IS DECORATIVE and carries an empty alt attribute on purpose.
  It is not standing in for a specific venue the way the venue-card
  placeholders are, so there is nothing to mislead anyone about; it is
  atmosphere behind a headline. That distinction is why this one needs no
  "no photo yet" marker and every venue card does.
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
    <>
      <section className="hero">
        <img
          className="hero-bg"
          src="/hero-court.jpg"
          alt=""
          width={630}
          height={360}
          /* The LCP element. Never lazy, and told to jump the queue. */
          loading="eager"
          fetchPriority="high"
          decoding="sync"
        />
        <div className="hero-veil" />

        <div className="wrap hero-inner">
          <p className="hero-eyebrow">A US pickleball court directory</p>
          <h1 className="hero-title">Find a court someone has actually checked</h1>
          <p className="hero-sub">
            Every court count, every set of lights, every address here carries
            the source it came from and the date we checked it.
          </p>

          <form className="hero-search" action="/search/" method="get" role="search">
            <label className="visually-hidden" htmlFor="q">
              Search by city, state, ZIP code or court name
            </label>
            <input
              id="q"
              name="q"
              type="search"
              placeholder="City, state, ZIP code, or court name"
              autoComplete="off"
            />
            <button type="submit">
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                width="17"
                height="17"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <circle cx="9" cy="9" r="6" />
                <path d="M13.5 13.5 18 18" />
              </svg>
              Search
            </button>
          </form>

          {v.hasQuickLinks && (
            <ul className="hero-links">
              {v.quickLinks.map(l => (
                <li key={l.href}><a href={l.href}>{l.label}</a></li>
              ))}
            </ul>
          )}

          <dl className="hero-proof">
            <div>
              <dt>Verified venues</dt>
              <dd>{v.venues}</dd>
            </div>
            <div>
              <dt>Courts</dt>
              <dd>{v.courts}</dd>
            </div>
            <div>
              <dt>Sources per venue</dt>
              <dd>{v.sourcesPerVenue}</dd>
            </div>
            <div>
              <dt>Last checked</dt>
              <dd>{v.lastChecked}</dd>
            </div>
          </dl>
        </div>
      </section>

      <div className="wrap page">
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
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{__html: v.jsonLd}}
      />
    </>
  )
}
