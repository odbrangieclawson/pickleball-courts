import type {Metadata} from 'next'
import {notFound} from 'next/navigation'
import {venueView, filterView, allLeafParams} from '../../../../../../lib/site/views.mjs'

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
  if (f) return {title: f.title, description: f.meta, robots: {index: false, follow: false}}
  const v = venueView(state, city, slug)
  if (!v) return {title: 'Not found', robots: {index: false, follow: false}}
  return {title: v.title, description: v.meta, robots: {index: false, follow: false}}
}

export default async function LeafPage({params}: Params) {
  const {state, city, slug} = await params

  const f = filterView(state, city, slug)
  if (f) {
    return (
      <div className="wrap page">
        <nav aria-label="Breadcrumb" className="crumbs">
          {/* No state link: the state page does not publish below the
              three-city threshold, and a breadcrumb into a 404 is the
              §3 failure this project exists to avoid. */}
          <a href="/">Home</a> › <a href={f.cityHref}>{f.city}</a> › {f.filter}
        </nav>

        <h1>{f.title}</h1>
        <p className="lede">{f.meta}</p>
        <p>Across every verified {f.city} venue, {f.coverage} match this filter.</p>

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

        <p className="provenance">
          This list exists only because at least three verified venues match
          it. <a href={f.cityHref}>Back to all {f.city} venues</a>.
        </p>

        <script type="application/ld+json" dangerouslySetInnerHTML={{__html: f.jsonLd}} />
      </div>
    )
  }

  const v = venueView(state, city, slug)
  if (!v) notFound()

  return (
    <div className="wrap page">
      <nav aria-label="Breadcrumb" className="crumbs">
        <a href="/">Home</a> › <a href={v.cityHref}>{v.city}</a> › {v.name}
      </nav>

      <h1>{v.name}</h1>
      <p className="lede">
        Pickleball at {v.name} in {v.city}, {v.state}. Every fact below shows
        where it came from and when we checked it.
      </p>
      <p><span className="trust">{v.verifiedBy}</span></p>

      <h2>The facts</h2>
      <div className="facts">
        {v.facts.map(x => (
          <div key={x.label}>
            <div className="k">{x.label}</div>
            <div className="v">{x.value}</div>
          </div>
        ))}
      </div>

      <h2>Where each fact came from</h2>
      <div className="table-scroll">
        <table>
          <thead>
            <tr><th>Fact</th><th>Value</th><th>Source</th><th>Checked</th></tr>
          </thead>
          <tbody>
            {v.facts.map(x => (
              <tr key={x.label}>
                <td>{x.label}</td>
                <td>{x.value}</td>
                <td>{x.source ? <a href={x.source}>Seattle Parks open data</a> : <span className="unverified">No source yet</span>}</td>
                <td>{x.checked ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="note is-gap">
        <h3>Something wrong here?</h3>
        <p>
          If you play here and this is out of date, tell us. Corrections come
          with a source and a date attached, the same as everything else.
        </p>
      </div>

      {v.hasAlternatives && (
        <>
          <h2>Other courts nearby</h2>
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
