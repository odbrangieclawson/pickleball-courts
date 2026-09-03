import type {CountyView} from '../../../../../lib/site/views.mjs'

/*
  County page, 900-1,500 words, ItemList schema (Phase 4 deliverable 2).

  It exists only where 3+ verified venues carry the county — countyView()
  returns null otherwise and the route 404s, so a below-threshold county has
  no page and nothing to link to.

  Note the state link. It is `v.stateLink`, which is null until the state
  itself publishes, and the page renders prose rather than a dead href when
  it is. §3 exists because Pickleheads serves hard 404s on pages worth 1,475
  visits a month; the cheapest way to ship one is to build an href from data
  without checking the target exists.
*/

export default function CountyPage({v}: {v: CountyView}) {
  return (
    <div className="wrap page">
      <nav aria-label="Breadcrumb" className="crumbs">
        <a href="/">Home</a> › {v.stateLink
          ? <a href={v.stateLink.href}>{v.stateName}</a>
          : <span>{v.stateName}</span>} › {v.county} County
      </nav>

      <h1 data-prose>{v.h1}</h1>
      <p className="lede" data-prose>
        {v.venuesN} verified pickleball venues in {v.county} County,{' '}
        {v.state}, covering {v.courtsN} courts across {v.cityCountN}{' '}
        {v.cityWord}. Every figure here is drawn only from venues checked
        against a named source, and each one shows the source and the date.
        Last checked {v.lastChecked}.
      </p>

      <div className="stats">
        <div className="stat"><span className="n">{v.venuesN}</span><span className="k">Verified venues</span></div>
        <div className="stat"><span className="n">{v.courtsN}</span><span className="k">Courts</span></div>
        <div className="stat"><span className="n">{v.cityCountN}</span><span className="k">Published {v.cityWord}</span></div>
      </div>

      <p data-prose>
        Across the county, {v.litLine} have lit courts for evening play.
      </p>

      <h2 data-prose>Cities we publish in {v.county} County</h2>
      <ul className="cards">
        {v.cities.map(c => (
          <li className="card" key={c.link.href}>
            <h3><a href={c.link.href}>{c.city}</a></h3>
            <p className="meta">{c.venues} verified venues · {c.courts} courts</p>
          </li>
        ))}
      </ul>

      {v.hasEditorial && v.editorial.map(e => (
        <section key={e.key} data-prose>
          <h2>{e.heading}</h2>
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

      <h2 data-prose>Every verified venue in {v.county} County</h2>
      <div className="table-scroll">
        <table>
          <thead>
            <tr><th>Venue</th><th>City</th><th>Courts</th><th>Lights</th><th>Checked</th></tr>
          </thead>
          <tbody>
            {v.venues.map(x => (
              <tr key={x.href}>
                <td>{x.href ? <a href={x.href}>{x.name}</a> : x.name}</td>
                <td>{x.city}</td>
                <td className="num">{x.courts}</td>
                <td>{x.lights}</td>
                <td>{x.checked}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {v.hasFaqs && (
        <>
          <h2 data-prose>Questions about {v.county} County</h2>
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
        {v.stateLink
          ? <>The {v.stateName} state page lists every county and city we
            publish. </>
          : <>We have not built the {v.stateName} state page yet. A state page
            needs at least three published cities before it is a document
            rather than a copy of the one city below it, and {v.stateName} has
            fewer than that today, so there is nothing honest to link up to. </>}
        Everything above is checked against a named source;{' '}
        <a href="/how-we-verify/">how we verify</a> explains the ladder we
        work down and what we refuse to do.
      </p>

      <script type="application/ld+json" dangerouslySetInnerHTML={{__html: v.jsonLd}} />
    </div>
  )
}
