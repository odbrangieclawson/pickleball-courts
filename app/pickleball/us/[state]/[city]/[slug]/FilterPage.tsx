import type {FilterView} from '../../../../../../lib/site/views.mjs'

/*
  Filter page, 600-1,000 words, ItemList + BreadcrumbList (Phase 5).

  Exactly five of these can exist per city — indoor, outdoor, free, public,
  lights — and each exists only where 3+ verified venues match. Everything
  else is a query parameter with noindex; see app/robots.ts.

  Membership is decided in lib/site/views.mjs, not here, and deliberately
  narrowly:
    /indoor/  indoor_courts > 0. Never covered, never climate_control —
              a covered outdoor court is not year-round play in Seattle.
    /free/    fee_type === 'free'. Excludes drop-in-with-fee and any venue
              with membership_from_usd above zero.
    /public/  venue_type in the public set. Not "free", not "unlocked gate".
    /lights/  light === true. Never null — "we have not checked the lights"
              is not "there are lights".
*/

export default function FilterPage({f}: {f: FilterView}) {
  return (
    <div className="wrap page">
      <nav aria-label="Breadcrumb" className="crumbs">
        <a href="/">Home</a> › <a href={f.cityHref}>{f.city}</a> › {f.filterLabel}
      </nav>

      <h1 data-prose>{f.h1}</h1>
      <p className="lede" data-prose>
        {f.n} verified {f.venueWord} in {f.city}, {f.state} {f.predicate}.
        Every one has been checked against a named source, and the count
        above is drawn only from those — never from the imported records we
        have not confirmed.
      </p>

      <div className="stats">
        <div className="stat"><span className="n">{f.n}</span><span className="k">Matching venues</span></div>
        <div className="stat"><span className="n">{f.courtsN}</span><span className="k">Courts</span></div>
        <div className="stat"><span className="n">{f.cityVenuesN}</span><span className="k">Verified in {f.city}</span></div>
      </div>

      {f.hasEditorial ? (
        f.editorial.map(e => (
          <section key={e.key} data-prose>
            <h2>{e.heading}</h2>
            <p>{e.text}</p>
          </section>
        ))
      ) : (
        <div className="note is-gap" data-prose>
          <h2>No intro written for this list yet</h2>
          <p>
            A filter page is supposed to argue why this particular cut matters
            in this particular city, and nobody has written that for{' '}
            {f.city} yet. The list below is accurate — every venue on it is
            verified — but the page does not yet earn its own URL.
          </p>
        </div>
      )}

      {f.hasEditorial && (
        <p className="provenance" data-not-prose>
          Sources:{' '}
          {f.editorialSources.map((s, i) => (
            <span key={s.url}>
              {i > 0 && ' · '}
              <a href={s.url}>{s.publisher}</a>, checked {s.retrieved}
            </span>
          ))}
        </p>
      )}

      <h2 data-prose>The {f.n} venues</h2>
      <ul className="cards">
        {f.venues.map(x => (
          <li className="card" key={x.href}>
            <h3><a href={x.href}>{x.name}</a></h3>
            <p className="meta">{x.meta}</p>
            <p>{x.address}</p>
            <span className="trust">Checked {x.checked}</span>
          </li>
        ))}
      </ul>

      <div className="note is-gap" data-prose>
        <h2>What is deliberately not on this list</h2>
        <p>{f.exclusions}</p>
      </div>

      {f.hasFaqs && (
        <>
          <h2 data-prose>Questions about this list</h2>
          {f.faqs.map(q => (
            <section key={q.q} data-prose>
              <h3>{q.q}</h3>
              <p>{q.a}</p>
            </section>
          ))}
        </>
      )}

      <h2 data-prose>Wider area</h2>
      <p data-prose>
        This list exists because at least three verified {f.city} venues match
        it; below three we would not publish the page at all rather than ship
        a list of one. See <a href={f.cityHref}>every verified venue in{' '}
        {f.city}</a>, or <a href="/how-we-verify/">how we verify</a> for the
        source ladder behind each entry.
      </p>

      <script type="application/ld+json" dangerouslySetInnerHTML={{__html: f.jsonLd}} />
    </div>
  )
}
