import type {Metadata} from 'next'
import {notFound} from 'next/navigation'
import {cityView, allCityParams, countyView, allCountyParams} from '../../../../../lib/site/views.mjs'
import CountyPage from './CountyPage'

type Params = {params: Promise<{state: string; city: string}>}

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

/*
  The locked URL pattern puts city pages and county pages on the same
  segment: /{state}/{city}/ and /{state}/{county}-county/. One route serves
  both, and the -county suffix is what tells them apart.
*/
export function generateStaticParams() {
  return [...allCityParams(), ...allCountyParams()]
}

export async function generateMetadata({params}: Params): Promise<Metadata> {
  const {state, city} = await params
  if (city.endsWith('-county')) {
    const co = countyView(state, city)
    if (!co) return {title: 'Not found', robots: {index: false, follow: false}}
    return {title: co.title, description: co.meta, robots: {index: false, follow: false},
      alternates: {canonical: `/pickleball/us/${state}/${city}/`}}
  }
  const v = cityView(state, city)
  if (!v) return {title: 'Not found', robots: {index: false, follow: false}}
  return {title: v.title, description: v.meta, robots: {index: false, follow: false},
    alternates: {canonical: `/pickleball/us/${state}/${city}/`}}
}

export default async function CityOrCountyPage({params}: Params) {
  const {state, city} = await params
  if (city.endsWith('-county')) {
    const co = countyView(state, city)
    if (!co) notFound()
    return <CountyPage v={co} />
  }
  const v = cityView(state, city)
  if (!v) notFound()

  return (
    <div className="wrap page">
      <nav aria-label="Breadcrumb" className="crumbs">
        <a href="/">Home</a> ›{" "}
        {v.stateLink ? <a href={v.stateLink.href}>{v.stateName}</a> : <span>{v.stateName}</span>} ›{" "}
        {v.countyLink ? <a href={v.countyLink.href}>{v.countyLink.label}</a> : <span>{v.countyName} County</span>} ›{" "}
        {v.city}
      </nav>

      <h1 data-prose>{v.h1}</h1>
      <p className="lede" data-prose>
        We have verified {v.venuesN} pickleball venues in {v.city}, covering{' '}
        {v.courtsN} courts. Every figure on this page comes from the parks
        records of the authority that runs them, and every venue below carries
        the source it came from and the date we checked it. Last checked{' '}
        {v.lastChecked}.
      </p>

      <div className="stats">
        <div className="stat"><span className="n">{v.venuesN}</span><span className="k">Verified venues</span></div>
        <div className="stat"><span className="n">{v.courtsN}</span><span className="k">Courts</span></div>
        {/* Only shown where at least one venue actually reported it. A "0"
            here would be the exact thing the footer promises we never do. */}
        {v.outdoorN && <div className="stat"><span className="n">{v.outdoorN}</span><span className="k">Outdoor courts</span></div>}
        {v.indoorN && <div className="stat"><span className="n">{v.indoorN}</span><span className="k">Indoor courts</span></div>}
      </div>

      <p data-prose>
        On lighting, {v.litLine} have lit courts for evening play. On cost,{" "}
        {v.freeLine} are free to play. Where an operator does not state a
        fee we have not claimed one either way.
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
                <td>{x.href ? <a href={x.href}>{x.name}</a> : x.name}</td>
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
      <p data-prose>
        {v.allVenuesHavePages
          ? <>All {v.venuePagesN} have a page of their own, with the source
            behind every fact and the date it was checked. </>
          : <>{v.venuePagesN} of these have a page of their own. The rest are
            verified to exactly the same standard — every fact above and
            below comes from the same records — but nobody has written
            them up yet, and a venue page here needs a couple of paragraphs
            about the actual place before it earns a URL. Their facts are
            all on this page. </>}
      </p>
      <ul className="cards">
        {v.venues.map((x, i) => (
          <li className="card has-shot" key={`card-${x.name}`}>
            <span className="shot">
              <img
                src={x.photo.src}
                alt={x.photo.alt}
                width={x.photo.width}
                height={x.photo.height}
                /* The first card is the likely LCP element, so it must not
                   be lazy. Everything below the fold is. */
                loading={i === 0 ? 'eager' : 'lazy'}
                decoding="async"
                fetchPriority={i === 0 ? 'high' : 'auto'}
              />
              {x.photo.isPlaceholder && (
                <span className="placeholder-mark">No photo yet</span>
              )}
            </span>
            <h3>{x.href ? <a href={x.href}>{x.name}</a> : x.name}</h3>
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
          Anything an operator does not publish shows as &ldquo;not verified
          yet&rdquo; rather than being guessed at — most often surface, fees
          and opening hours. Many of these courts are very probably free to
          play, but a belief is not a source, so we do not print it as one.
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
        {v.city} sits in {v.countyName} County.{' '}
        {v.countyLink
          ? <>Every verified venue in the county, including these, is listed
            on <a href={v.countyLink.href}>{v.countyLink.label}</a>. </>
          : <>We have not published a {v.countyName} County page: a county
            needs three verified venues before it exists, and we are short of
            that outside this city. </>}
        {v.stateLink
          ? <>The <a href={v.stateLink.href}>{v.stateName}</a> page covers
            every city we publish in the state. </>
          : <>There is no {v.stateName} state page yet either. A state page
            needs at least three published cities before it is a document
            rather than a copy of this one, and {v.stateName} has fewer than
            that today, so we have not written one. </>}
      </p>

      {v.hasNearby ? (
        <>
          <h3 data-prose>Nearby cities we publish</h3>
          <ul className="cards">
            {v.nearbyPublished.map(n => (
              <li className="card" key={n.href}>
                <h3><a href={n.href}>{n.label}</a></h3>
                <p className="meta">{n.venues} verified venues · {n.kmAway} away</p>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p data-prose>
          No other city near {v.city} has three verified venues yet, so there
          is nothing to send you across to. We would rather leave the space
          empty than link you to a page with nothing on it.
        </p>
      )}

      {/*
        Built from the venues' own field provenance, never asserted. This
        block used to name Seattle's two datasets on every city page, which
        was a false source line on four cities — the one error this site
        cannot afford, since naming the source IS the product.
      */}
      <h2>Sources</h2>
      <p className="provenance">
        Every fact on this page comes from one of these, and each venue names
        the source behind each of its own fields:{' '}
        {v.sources.map((s, i) => (
          <span key={s.url}>
            {i > 0 && ' · '}
            <a href={s.url}>{s.publisher}</a>
            {s.checked ? `, checked ${s.checked}` : ''}
          </span>
        ))}
        . <a href="/how-we-verify/">How we verify</a>.
      </p>

      <script type="application/ld+json" dangerouslySetInnerHTML={{__html: v.jsonLd}} />
    </div>
  )
}
