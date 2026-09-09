import type {Metadata} from 'next'
import {PAGE_ROBOTS, ORIGIN} from '../../../../lib/site/origin.mjs'
import {notFound} from 'next/navigation'
import {stateView, allStateParams} from '../../../../lib/site/views.mjs'

type Params = {params: Promise<{state: string}>}

/*
  ONLY THE PAGES WE BUILT EXIST.

  Without this, Next treats any param outside generateStaticParams() as a
  page to render on demand, and in production that render died: every
  unmatched URL under /pickleball/us/ returned a 500 rather than a 404 —
  /pickleball/us/zz/, /pickleball/us/or/nosuchcity/, a mistyped venue slug,
  and /{city}/public/, the filter page decision O1 keeps unpublished. The
  static /nonexistent/ 404 worked fine; only the dynamic tree failed.

  A 500 is materially worse than a 404 for a directory. Search engines read
  it as "broken, come back later" and KEEP the URL; a 404 retires it. That
  is the same traffic leak decisions.md O9 records against a competitor,
  with the error class that keeps the dead URL alive instead of clearing it.

  dynamicParams = false is also the honest semantics for this site. The set
  of publishable pages is decided at build time by the link graph and the
  six gates, and §3 makes those URLs permanent. A page that did not clear a
  gate must not be conjurable by typing its address.

  This does NOT foreclose the incremental revalidation next.config.ts asks
  for (O6): dynamicParams governs params generateStaticParams never
  returned. Re-verifying one venue and refreshing that one prerendered page
  is untouched.
*/
export const dynamicParams = false

export function generateStaticParams() {
  return allStateParams()
}

export async function generateMetadata({params}: Params): Promise<Metadata> {
  const {state} = await params
  const v = stateView(state)
  if (!v) return {title: 'Not found', robots: {index: false, follow: false}}
  const card = {url: `${ORIGIN}${v.cardPhoto.src}`, width: v.cardPhoto.width,
    height: v.cardPhoto.height, alt: v.cardPhoto.alt}
  return {title: v.title, description: v.meta, robots: PAGE_ROBOTS,
    alternates: {canonical: `/pickleball/us/${state}/`},
    openGraph: {images: [card]},
    twitter: {card: 'summary_large_image', images: [card]}}
}

export default async function StatePage({params}: Params) {
  const {state} = await params
  const v = stateView(state)
  if (!v) notFound()

  return (
    <>
      {/*
        THE STATE HERO.

        A state page is the first thing somebody lands on for "pickleball
        courts in Kansas", and it used to open with a breadcrumb and a
        paragraph. This gives it the shape of an entry point: what is here,
        a box to search it, and one tap to the biggest cities.

        The search form is the home page's, verbatim in behaviour: a plain
        GET to /search/, so it works with JavaScript off like everything
        else. The chips are ordinary anchors to city pages that already
        exist — no new URLs, so nothing here touches the locked pattern.
      */}
      <section className="hero is-state">
        <img
          className="hero-bg"
          src="/hero-court.jpg"
          alt=""
          width={630}
          height={360}
          loading="eager"
          fetchPriority="high"
          decoding="sync"
        />
        <div className="hero-veil" />

        <div className="wrap hero-inner">
          <nav aria-label="Breadcrumb" className="crumbs is-on-hero">
            <a href="/">Home</a> › {v.stateName}
          </nav>

          <h1 className="hero-title is-state">Pickleball Courts in {v.stateName}</h1>
          <p className="hero-sub">
            {v.venues} venues across {v.cityCount} {v.cityWord.toLowerCase()},
            {' '}{v.courts} courts in all.
          </p>

          <form className="hero-search" action="/search/" method="get" role="search">
            <label className="visually-hidden" htmlFor="q">
              Search by city, ZIP code or court name
            </label>
            <input
              id="q"
              name="q"
              type="search"
              placeholder="City, ZIP code, or court name"
              autoComplete="off"
            />
            <button type="submit">Search</button>
          </form>

          {v.hasCityChips && (
            <nav className="chips" aria-label={`Cities in ${v.stateName}`}>
              {v.cityChips.map(c => (
                <a className="chip" key={c.href} href={c.href}>{c.label}</a>
              ))}
            </nav>
          )}
        </div>
      </section>

    <div className="wrap page">
      <p className="lede" data-prose>{v.meta} Last checked {v.lastChecked}.</p>

      <div className="stats">
        <div className="stat"><span className="n">{v.venues}</span><span className="k">Venues</span></div>
        <div className="stat"><span className="n">{v.courts}</span><span className="k">Courts</span></div>
        <div className="stat"><span className="n">{v.cityCount}</span><span className="k">{v.cityWord}</span></div>
      </div>

      <p data-prose>Across {v.stateName}, {v.litLine} have lit courts for evening play.</p>

      {/*
        EVERY VENUE IN THE STATE.

        Badges are stated facts or they are absent. A venue whose court
        count nobody publishes gets no count badge rather than a zero, and
        one whose lighting is unstated gets no Lit badge rather than an
        unlit one. Rule 6 in badge form: here the honest gap is silence,
        because a row of grey "unknown" chips is noise where a missing chip
        says nothing at all.

        The photograph is the same marked stand-in the city cards carry. It
        is somebody else's court and the marker says so.
      */}
      {v.hasVenueCards && (
        <>
          <h2 data-prose>Every venue in {v.stateName}</h2>
          <ul className="cards venue-cards is-tiles">
            {v.venueCards.map(c => (
              <li className="card has-shot" key={c.key}>
                <a className="card-shot" href={c.href} tabIndex={-1} aria-hidden="true">
                  <span className="shot">
                    <img
                      src={c.photo.src}
                      alt=""
                      width={c.photo.width}
                      height={c.photo.height}
                      loading="lazy"
                      decoding="async"
                    />
                    {c.photo.isPlaceholder && (
                      <span className="placeholder-mark">No photo yet</span>
                    )}
                  </span>
                  {c.courts && <span className="badge is-count">{c.courts}</span>}
                </a>
                <div className="card-body">
                  <h3><a href={c.href}>{c.name}</a></h3>
                  <p className="meta">{c.where}</p>
                  <p className="badges" data-not-prose>
                    {c.inOut && <span className="badge">{c.inOut}</span>}
                    {c.type && <span className="badge">{c.type}</span>}
                    {c.lit && <span className="badge">Lit</span>}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      <h2 data-prose>Cities</h2>
      <ul className="cards">
        {v.cities.map(c => (
          <li className="card" key={c.href}>
            <h3><a href={c.href}>{c.title}</a></h3>
            <p className="meta">{c.meta}</p>
            <p>{c.blurb}</p>
          </li>
        ))}
      </ul>

      {/*
        The written state note. Without it this page does not publish at all —
        statePagePublishes() requires every slot filled, because a state page
        with three city cards and a stats strip is a directory of directories
        rather than a document, and its word band says so at 3,000.
      */}
      {v.hasEditorial && v.editorial.map(e => (
        <section key={e.key} data-prose>
          <h2>{e.heading}</h2>
          {e.text.split('\n\n').map((para, i) => <p key={i}>{para}</p>)}
          <p className="provenance" data-not-prose>
            {e.sources.map((s, i) => (
              <span key={s.url}>
                {i > 0 && ' · '}
                <a href={s.url}>{s.publisher}</a>, checked {s.retrieved}
              </span>
            ))}
          </p>
        </section>
      ))}

      {v.hasFaqs && (
        <>
          <h2 data-prose>Questions about pickleball in {v.stateName}</h2>
          {v.faqs.map(f => (
            <section key={f.q} data-prose>
              <h3>{f.q}</h3>
              <p>{f.a}</p>
            </section>
          ))}
        </>
      )}

      <div className="note is-gap">
        <h3>Why so few cities?</h3>
        <p>
          A city appears here only once at least three of its venues have been
          checked against a named source. We hold imported records for
          thousands more, and they stay unpublished until someone verifies
          them. Page count is an output, never a target.
        </p>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{__html: v.jsonLd}} />
    </div>
    </>
  )
}
