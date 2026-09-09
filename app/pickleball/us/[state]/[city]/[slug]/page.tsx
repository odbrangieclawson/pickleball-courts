import type {Metadata} from 'next'
import {PAGE_ROBOTS} from '../../../../../../lib/site/origin.mjs'
import {notFound} from 'next/navigation'
import {venueView, filterView, allLeafParams} from '../../../../../../lib/site/views.mjs'
import FilterPage from './FilterPage'

/*
  One route serves two page types, because the locked URL pattern gives them
  the same shape:

    /pickleball/us/{state}/{city}/{indoor|outdoor|free|public|lights}/
    /pickleball/us/{state}/{city}/{venue}/

  filterView() returns null for anything that is not one of the five filter
  slugs, so a venue slug falls through to venueView(). The five filter slugs
  are reserved — a venue can never be given one, because Decision D4 fixes
  the list and the slug registry would collide.
*/

type Params = {params: Promise<{state: string; city: string; slug: string}>}

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
  return allLeafParams()
}

export async function generateMetadata({params}: Params): Promise<Metadata> {
  const {state, city, slug} = await params
  const f = filterView(state, city, slug)
  if (f) return {title: f.title, description: f.meta, robots: PAGE_ROBOTS,
    alternates: {canonical: `/pickleball/us/${state}/${city}/${slug}/`}}
  const meta = venueView(state, city, slug)
  if (!meta) return {title: 'Not found', robots: {index: false, follow: false}}
  return {title: meta.title, description: meta.meta, robots: PAGE_ROBOTS,
    alternates: {canonical: `/pickleball/us/${state}/${city}/${slug}/`}}
}

export default async function LeafPage({params}: Params) {
  const {state, city, slug} = await params

  const f = filterView(state, city, slug)
  if (f) return <FilterPage f={f} />

  const v = venueView(state, city, slug)
  if (!v) notFound()

  return (
    <div className="wrap page">
      <nav aria-label="Breadcrumb" className="crumbs">
        <a href="/">Home</a> ›{' '}
        {v.countyLink ? <><a href={v.countyLink.href}>{v.countyLink.label}</a> › </> : null}
        <a href={v.cityHref}>{v.city}</a> › {v.name}
      </nav>

      <h1 data-prose>{v.name}</h1>
      <p className="lede" data-prose>
        Pickleball at {v.name} in {v.city}, {v.state}. Every fact below shows
        where it came from and when we checked it. {v.knownFactsN} of{' '}
        {v.totalFactsN} fields are confirmed, and the rest say so rather than
        guessing.
      </p>

      <p><span className="trust">{v.trust}</span></p>

      {/*
        Where it is, and one click to get there. An anchor, not a scripted
        map: Rule 1 wants the page to work with JavaScript off, and on a
        phone this hands off to the reader's own map app. The address beside
        it is the operator's own wording, so what the reader reads and what
        the button routes to are the same place.
      */}
      {v.directions && (
        <p className="venue-actions" data-not-prose>
          {v.streetAddress && <span className="venue-where">{v.streetAddress}, {v.city}, {v.state}</span>}
          <a className="button is-quiet" href={v.directions.href}>Get directions</a>
        </p>
      )}

      <figure className="venue-shot">
        <span className="shot is-hero">
          <img
            src={v.photo.src}
            alt={v.photo.alt}
            width={v.photo.width}
            height={v.photo.height}
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />
          {v.photo.isPlaceholder && (
            <span className="placeholder-mark">No photo yet</span>
          )}
        </span>
        <figcaption data-not-prose>
          {v.photo.caption} We have not photographed {v.name}, and we would
          rather show a marked stand-in than a picture that implies we have.
          The correction link below reaches the same queue a photograph would.
        </figcaption>
      </figure>

      {/*
        The claim panel sits under the hero, where an operator lands, rather
        than only in the prose at the foot of the page. It is a mailto:
        anchor, not a form — Rule 1, and rule 11: a claim opens a
        conversation, it does not write to the data. data-not-prose keeps it
        out of the word band, since it says the same thing on every venue.
        The longer explanation of what a claim does and does not do stays
        below, in prose, where the page already had it.
      */}
      {v.claimable && (
        <aside className="claim-panel" data-not-prose aria-labelledby="claim-heading">
          <div>
            <p className="claim-title" id="claim-heading">Do you run {v.name}?</p>
            <p className="claim-sub">
              Claim the listing to correct hours, fees, court counts and
              photos. A claim identifies you; it does not put a source
              behind anything, and it buys no placement.{' '}
              <a href="/add-your-court/">How claiming works</a>.
            </p>
          </div>
          <a className="button" href={v.claimHref}>Claim this listing</a>
        </aside>
      )}

      <h2 data-prose>The facts</h2>
      <div className="facts">
        {v.facts.map(x => (
          <div key={x.key} className={x.wide ? 'wide' : undefined}>
            <div className="k">{x.label}</div>
            <div className="v">
              {x.value === 'Not stated'
                ? <span className="unverified">Not stated</span>
                : x.value}
            </div>
          </div>
        ))}
      </div>

      {v.hasNotes ? (
        v.notes.map(nt => (
          <section key={nt.key} data-prose>
            <h2>{nt.heading}</h2>
            <p>{nt.text}</p>
          </section>
        ))
      ) : (
        <div className="note is-gap" data-prose>
          <h2>We have not written about this venue yet</h2>
          <p>
            Everything above is confirmed against a named source, but nobody
            has been to {v.name} and written it up. A venue page on this site
            needs two or three paragraphs about the specific place — what it
            is like, where you park, whether you will get on a court — and we
            do not generate that from a spreadsheet. Inventing it would be
            worse than leaving it out, because the people searching a court by
            name already know the court and would spot the invention
            immediately. So this page carries the facts and stops there.
          </p>
          <p>
            If you play at {v.name}, the correction link below reaches a real
            queue and your note would go in with a source and a date attached,
            the same as everything else here.
          </p>
        </div>
      )}

      {v.hasNotes && (
        <p className="provenance" data-not-prose>
          Sources for the above:{' '}
          {v.noteSources.map((s, i) => (
            <span key={s.url}>
              {i > 0 && ' · '}
              <a href={s.url}>{s.publisher}</a>, checked {s.retrieved}
            </span>
          ))}
        </p>
      )}

      <h2 data-prose>Where each fact came from</h2>
      <div className="table-scroll">
        <table>
          <thead>
            <tr><th>Fact</th><th>Value</th><th>Source</th><th>Checked</th></tr>
          </thead>
          <tbody>
            {v.facts.map(x => (
              <tr key={x.key}>
                <td>{x.label}</td>
                <td>{x.value}</td>
                <td>{x.source
                  ? <a href={x.source} rel="nofollow">{x.sourceLabel}</a>
                  : <span className="unverified">No source yet</span>}</td>
                {/* Empty rather than a dash: rule 6 says a null is written
                    out, never printed as a glyph, and the Source cell beside
                    this one already says there is no source yet. */}
                <td>{x.checked ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {v.hasFaqs && (
        <>
          <h2 data-prose>Questions about {v.name}</h2>
          {v.faqs.map(q => (
            <section key={q.q} data-prose>
              <h3>{q.q}</h3>
              <p>{q.a}</p>
            </section>
          ))}
        </>
      )}

      {v.claimable && (
        <div className="note" data-prose>
          <h2>Do you run {v.name}?</h2>
          <p>
            You can claim this listing and correct anything on it. To be clear
            about what claiming does and does not do: it gives you control of
            your own facts and a channel to reach us, and it is shown on the
            page as confirmed by the venue with the date you confirmed it.
          </p>
          <p>
            It does not mark the listing verified, because a claim tells us
            who you are rather than checking what is here, and those are
            different things. It also buys no ranking, no sorting and no
            placement advantage over an unclaimed venue. The moment claiming
            bought position this would be an advertising product rather than a
            directory, and the whole promise would be gone.
          </p>
          <p data-not-prose>
            <a href={v.claimHref}>Claim this listing by email</a> · <a href="/add-your-court/">What a claim needs</a>
          </p>
        </div>
      )}

      <div className="note is-gap" data-prose>
        <h2>Something wrong here?</h2>
        <p>
          If you play here and this is out of date, tell us. Corrections come
          with a source and a date attached, the same as everything else, and
          a correction that changes a court count gets checked against the
          city record before it goes live.
        </p>
        {/* The link the paragraphs above have promised since the page was
            written. Outside the word band: it is the same line on every venue. */}
        <p data-not-prose>
          <a href={v.correctionHref}>Send a correction for {v.name}</a>
        </p>
      </div>

      {v.hasAlternatives && (
        <>
          <h2 data-prose>Other courts in {v.city}</h2>
          <ul className="cards">
            {v.alternatives.map(a => (
              <li className="card has-shot" key={a.href}>
                <span className="shot">
                  <img
                    src={a.photo.src}
                    alt={a.photo.alt}
                    width={a.photo.width}
                    height={a.photo.height}
                    loading="lazy"
                    decoding="async"
                  />
                  {a.photo.isPlaceholder && (
                    <span className="placeholder-mark">No photo yet</span>
                  )}
                </span>
                <h3><a href={a.href}>{a.name}</a></h3>
                <p className="meta">{a.meta}</p>
              </li>
            ))}
          </ul>
        </>
      )}

      <script type="application/ld+json" dangerouslySetInnerHTML={{__html: v.jsonLd}} />
    </div>
  )
}
