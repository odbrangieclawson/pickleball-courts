import type {Metadata} from 'next'
import {PAGE_ROBOTS} from '../lib/site/origin.mjs'
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

/*
  THE HOME PAGE TITLE CARRIES THE HEAD KEYWORD, NOT THE BRAND TWICE.

  It used to be the bare brand name, "Find Pickleball Courts", which is the
  one string a searcher never types. The head terms this page can actually
  win are "pickleball courts near me" (69,000 US searches a month, KD 2) and
  "pickleball courts" (16,000, KD 0), and neither appeared in the title or
  the description; the phrase "near me" appeared nowhere on the page at all.

  The title now leads with the keyword and the verified count, which is the
  same shape every city page uses. "Near You" rather than "near me" is
  deliberate: a searcher types "near me", a page says "near you", and Google
  resolves that intent by location rather than by matching the literal
  string. Writing "near me" in our own copy would read as written for a
  crawler instead of a reader, which is the opposite of this site's point.

  The count comes from homeView(), which reads getCounts() — Rule 2, and D8,
  which allows only verified counts in a title.
*/
const home = homeView()

export const metadata: Metadata = {
  title: `Pickleball Courts Near You: ${home.venues} Verified`,
  description:
    `Find pickleball courts near you. ${home.venues} verified venues across ${home.cityCount} ${home.cityWordLower}, with court counts, lights, nets and cost, and the source and date behind every fact.`,
  robots: PAGE_ROBOTS,
  alternates: {canonical: '/'},
}

export default function Home() {
  const v = home

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
          <h1 className="hero-title">Find Pickleball Courts Near You</h1>
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

          {/*
            Anchors styled as buttons, not <button>s. Each one navigates,
            and a thing that navigates is a link — which is also what
            makes it work with JavaScript off, open in a new tab, and be
            followed by the crawl report.
          */}
          {v.hasFilterButtons && (
            <nav className="hero-filters" aria-label="Browse by court type">
              {v.filterButtons.map(b => (
                <a key={b.filter} href={b.href}>{b.label}</a>
              ))}
            </nav>
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
        {/*
          States first, cities second. With thirty-five cities the card grid
          is nine rows deep, and a reader who has just left the search box
          wants a map of the coverage before a list of it. The state cards
          are that map: nineteen tiles, each naming its cities, so the whole
          directory is one screen and one click.
        */}
        <h2>{v.statesHeading}</h2>
        <p className="lede">{v.statesNote}</p>
        <ul className="states">
          {v.states.map(s => (
            <li className="state-card" key={s.key}>
              <span className="state-rank">{s.rank}</span>
              {/*
                The state's own outline, US Census public-domain geometry.
                Decorative: the state NAME below is the real content, so
                this is hidden from assistive technology rather than given
                a title that would be read out twice.
              */}
              {s.outline ? (
                <svg
                  className="state-shape"
                  viewBox={s.outline.viewBox}
                  aria-hidden="true"
                  focusable="false"
                  preserveAspectRatio="xMidYMid meet"
                >
                  <path d={s.outline.d} />
                </svg>
              ) : (
                <span className="state-mark" aria-hidden="true">{s.mark}</span>
              )}
              {/*
                Every state name is a link now. Five go to a state page;
                the rest go to a search for the state, which resolves to
                its published cities and counties. Sighted readers get one
                consistent affordance; assistive technology is told which
                of the two it is, because "Texas" landing on a results page
                is worth announcing.
              */}
              <h3>
                <a
                  href={s.href}
                  aria-label={s.hrefKind === 'search'
                    ? `${s.stateName}: everything we publish there`
                    : undefined}
                >{s.stateName}</a>
              </h3>
              <p className="meta">{s.meta}</p>
              <p className="state-cities">
                <span className="state-cities-label">{s.cityLabel}</span>
                {s.cities.map(c => (
                  <a href={c.href} key={c.href}>{c.label}</a>
                ))}
              </p>
            </li>
          ))}
        </ul>

        <h2>Every verified city</h2>
        <ul className="cards is-tiles">
          {v.cities.map(c => (
            <li className={c.photo ? 'card has-shot' : 'card'} key={c.href}>
              {/*
                A pickleball court, not the city. It is somebody else's
                court, so it carries the same "No photo yet" marker the
                venue cards carry: the picture is here to say what the page
                is about, never to claim it shows a court in this city.
              */}
              {c.photo && (
                <span className="shot">
                  <img
                    src={c.photo.src}
                    alt={c.photo.alt}
                    width={c.photo.width}
                    height={c.photo.height}
                    loading="lazy"
                    decoding="async"
                  />
                  {c.photo.isPlaceholder && (
                    <span className="placeholder-mark">No photo yet</span>
                  )}
                </span>
              )}
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
