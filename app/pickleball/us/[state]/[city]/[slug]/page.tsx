import type {Metadata} from 'next'
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

export function generateStaticParams() {
  return allLeafParams()
}

export async function generateMetadata({params}: Params): Promise<Metadata> {
  const {state, city, slug} = await params
  const f = filterView(state, city, slug)
  if (f) return {title: f.title, description: f.meta, robots: {index: false, follow: false},
    alternates: {canonical: `/pickleball/us/${state}/${city}/${slug}/`}}
  const meta = venueView(state, city, slug)
  if (!meta) return {title: 'Not found', robots: {index: false, follow: false}}
  return {title: meta.title, description: meta.meta, robots: {index: false, follow: false},
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
        where it came from and when we checked it — {v.knownFactsN} of{' '}
        {v.totalFactsN} fields are confirmed, and the rest say so rather than
        guessing.
      </p>

      <p><span className="trust">{v.trust}</span></p>

      <h2 data-prose>The facts</h2>
      <div className="facts">
        {v.facts.map(x => (
          <div key={x.key}>
            <div className="k">{x.label}</div>
            <div className="v">
              {x.value === 'Not verified yet'
                ? <span className="unverified">Not verified yet</span>
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
                  ? <a href={x.source}>Seattle Parks open data</a>
                  : <span className="unverified">No source yet</span>}</td>
                <td>{x.checked ?? '—'}</td>
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
      </div>

      {v.hasAlternatives && (
        <>
          <h2 data-prose>Other courts in {v.city}</h2>
          <ul className="cards">
            {v.alternatives.map(a => (
              <li className="card" key={a.href}>
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
