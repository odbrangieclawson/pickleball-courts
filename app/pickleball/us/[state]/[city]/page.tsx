import type {Metadata} from 'next'
import {notFound} from 'next/navigation'
import {cityView, allCityParams} from '../../../../../lib/site/views.mjs'

type Params = {params: Promise<{state: string; city: string}>}

export function generateStaticParams() {
  return allCityParams()
}

export async function generateMetadata({params}: Params): Promise<Metadata> {
  const {state, city} = await params
  const v = cityView(state, city)
  if (!v) return {title: 'Not found', robots: {index: false, follow: false}}
  return {title: v.title, description: v.meta, robots: {index: false, follow: false}}
}

export default async function CityPage({params}: Params) {
  const {state, city} = await params
  const v = cityView(state, city)
  if (!v) notFound()

  return (
    <div className="wrap page">
      <nav aria-label="Breadcrumb" className="crumbs">
        <a href="/">Home</a> › <a href={v.stateHref}>{v.stateName}</a> › {v.city}
      </nav>

      <h1 data-prose>{v.h1}</h1>
      <p className="lede" data-prose>
        We have verified {v.venuesN} pickleball venues in {v.city}, covering{' '}
        {v.courtsN} courts. Every figure on this page comes from {v.city}&rsquo;s
        own parks records, and every venue below carries the source it came
        from and the date we checked it. Last checked {v.lastChecked}.
      </p>

      <div className="stats">
        <div className="stat"><span className="n">{v.venuesN}</span><span className="k">Verified venues</span></div>
        <div className="stat"><span className="n">{v.courtsN}</span><span className="k">Courts</span></div>
        <div className="stat"><span className="n">{v.outdoorN}</span><span className="k">Outdoor courts</span></div>
        <div className="stat"><span className="n">{v.indoorN}</span><span className="k">Indoor courts</span></div>
      </div>

      <p data-prose>
        On lighting, {v.litLine} have lit courts for evening play. On cost,{" "}
        {v.freeLine} are free to play — the city&rsquo;s open pickleball data
        does not state fees, so we have not claimed one either way.
      </p>

      {v.hasFilters && (
        <>
          <h2>Browse by what you need</h2>
          <ul className="filters">
            {v.filters.map(f => (
              <li key={f.slug}><a href={f.href}>{f.label}</a></li>
            ))}
          </ul>
        </>
      )}

      <h2>Every verified venue in {v.city}</h2>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Venue</th>
              <th>Courts</th>
              <th>Type</th>
              <th>Lights</th>
              <th>Nets</th>
              <th>Address</th>
            </tr>
          </thead>
          <tbody>
            {v.venues.map(x => (
              <tr key={x.href}>
                <td><a href={x.href}>{x.name}</a></td>
                <td className="num">{x.courts}</td>
                <td>{x.indoorOutdoor}</td>
                <td>{x.lights}</td>
                <td>{x.nets}</td>
                <td>{x.address}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 data-prose>Every venue, with the detail</h2>
      <ul className="cards">
        {v.venues.map(x => (
          <li className="card" key={`card-${x.href}`}>
            <h3><a href={x.href}>{x.name}</a></h3>
            <p className="meta">{x.detail}</p>
            <p>{x.address}</p>
            <span className="trust">Checked {x.checked}</span>
          </li>
        ))}
      </ul>

      {v.hasBestFor && (
        <>
          <h2 data-prose>Where to play, depending on what you want</h2>
          {v.bestFor.map(b => (
            <section key={b.key} data-prose>
              <h3>{b.heading}</h3>
              <p>{b.text}</p>
              {b.href && <p><a href={b.href}>See the venue</a></p>}
            </section>
          ))}
        </>
      )}

      {v.hasEditorial && (
        <>
          <h2 data-prose>Playing here</h2>
          {v.editorial.map(e => (
            <section key={e.key} data-prose>
              <h3>{e.heading}</h3>
              <p>{e.text}</p>
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
        </>
      )}

      <div className="note is-gap" data-prose>
        <h3>What we have not verified</h3>
        <p>
          Surface type, fees and opening hours are not in the city&rsquo;s
          pickleball dataset, so they show as &ldquo;not verified yet&rdquo;
          rather than being guessed at. These courts are very probably free to
          play — but a belief is not a source, so we do not print it as one.
        </p>
      </div>

      {v.hasFaqs && (
        <>
          <h2 data-prose>Questions people actually ask</h2>
          {v.faqs.map(f => (
            <section key={f.q} data-prose>
              <h3>{f.q}</h3>
              <p>{f.a}</p>
            </section>
          ))}
        </>
      )}

      <h2 data-prose>Wider area</h2>
      <p data-prose>
        {v.city} sits in {v.countyName} County. We have not built the{' '}
        {v.countyName} County page yet, and no other {v.stateName} city has
        enough verified venues to publish, so there is nothing honest to link
        across to. Both arrive when more of the state is verified — until
        then, <a href={v.stateHref}>{v.stateName}</a> is the level above this
        page.
      </p>

      <h2>Sources</h2>
      <p className="provenance">
        Court counts, lights, nets, restrooms and parking: Seattle Parks and
        Recreation, Pickleball Courts open dataset. Addresses: Seattle Parks
        and Recreation, Park Boundary (details). Both retrieved and checked{' '}
        {v.lastChecked}. <a href="/how-we-verify/">How we verify</a>.
      </p>

      <script type="application/ld+json" dangerouslySetInnerHTML={{__html: v.jsonLd}} />
    </div>
  )
}
