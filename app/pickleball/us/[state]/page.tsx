import type {Metadata} from 'next'
import {notFound} from 'next/navigation'
import {stateView, allStateParams} from '../../../../lib/site/views.mjs'

type Params = {params: Promise<{state: string}>}

export function generateStaticParams() {
  return allStateParams()
}

export async function generateMetadata({params}: Params): Promise<Metadata> {
  const {state} = await params
  const v = stateView(state)
  if (!v) return {title: 'Not found', robots: {index: false, follow: false}}
  return {title: v.title, description: v.meta, robots: {index: false, follow: false},
    alternates: {canonical: `/pickleball/us/${state}/`}}
}

export default async function StatePage({params}: Params) {
  const {state} = await params
  const v = stateView(state)
  if (!v) notFound()

  return (
    <div className="wrap page">
      <nav aria-label="Breadcrumb" className="crumbs">
        <a href="/">Home</a> › {v.stateName}
      </nav>

      <h1>Pickleball Courts in {v.stateName}</h1>
      <p className="lede">{v.meta}</p>

      <div className="stats">
        <div className="stat"><span className="n">{v.venues}</span><span className="k">Verified venues</span></div>
        <div className="stat"><span className="n">{v.courts}</span><span className="k">Courts</span></div>
        <div className="stat"><span className="n">{v.cityCount}</span><span className="k">{v.cityWord}</span></div>
      </div>

      <p>Across {v.stateName}, {v.litLine} have lit courts for evening play.</p>

      <h2>Cities</h2>
      <ul className="cards">
        {v.cities.map(c => (
          <li className="card" key={c.href}>
            <h3><a href={c.href}>{c.title}</a></h3>
            <p className="meta">{c.meta}</p>
            <p>{c.blurb}</p>
          </li>
        ))}
      </ul>

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
  )
}
