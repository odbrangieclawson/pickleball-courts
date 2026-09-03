import type {Metadata} from 'next'
import {provenanceView} from '../../../lib/site/views.mjs'

/*
  INTERNAL PROVENANCE AUDIT (Phase 6 deliverable 7).

  Every published fact, its source, its checked date and how stale it is —
  the tool for the monthly freshness sweep.

  INTERNAL MEANS INTERNAL. This page is noindex/nofollow, it is not in the
  sitemap, and nothing on the public site links to it. Those three together
  are what "internal" means for a statically built site: there is no login
  here and pretending otherwise would be worse than saying so. If this ever
  needs to be genuinely private rather than merely unlinked, it moves behind
  the deployment's auth or stops being a page and becomes a CLI report.

  It is deliberately not pretty. It is a working surface: sorted stalest
  first, so the top of the page is the work queue.
*/

export const metadata: Metadata = {
  title: 'Provenance audit (internal)',
  description: 'Every published fact with its source, checked date and staleness.',
  robots: {index: false, follow: false, nocache: true},
}

export default function ProvenanceAudit() {
  const v = provenanceView()

  return (
    <div className="wrap page">
      <h1>Provenance audit</h1>
      <p className="lede">
        Every published fact on the site with the source it came from, the
        date it was checked and how stale that makes it. Sorted oldest first,
        so the top of this table is the work queue. Internal — noindex, not in
        the sitemap, not linked from anywhere public.
      </p>

      <div className="stats">
        <div className="stat"><span className="n">{v.totalN}</span><span className="k">Published facts</span></div>
        <div className="stat"><span className="n">{v.venuesN}</span><span className="k">Venues</span></div>
        <div className="stat"><span className="n">{v.freshN}</span><span className="k">Fresh</span></div>
        <div className="stat is-gap"><span className="n">{v.dueN}</span><span className="k">Due</span></div>
        <div className="stat is-gap"><span className="n">{v.staleN}</span><span className="k">Stale</span></div>
      </div>

      <div className="note is-gap">
        <h3>The staleness bands are provisional</h3>
        <p>
          <strong>O3 is still open.</strong> Nobody has decided how long a
          checked date stays good, and it plainly differs by field — an
          address changes rarely, fees and hours change often. The bands used
          here are a working default: {v.cadenceSummary}. Import Gate I2
          currently checks only that a date exists and is not in the future,
          because there is no agreed cadence for it to check against.
        </p>
      </div>

      <h2>Sources behind the published set</h2>
      <div className="table-scroll">
        <table>
          <thead><tr><th>Source</th><th>Facts</th></tr></thead>
          <tbody>
            {v.sources.map(s => (
              <tr key={s.url}>
                <td><a href={s.url}>{s.url}</a></td>
                <td className="num">{s.facts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Verification routes</h2>
      <div className="table-scroll">
        <table>
          <thead><tr><th>verified_by</th><th>Facts</th></tr></thead>
          <tbody>
            {v.verifiers.map(x => (
              <tr key={x.by}><td>{x.by}</td><td className="num">{x.facts}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Every fact, oldest first</h2>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Venue</th><th>Field</th><th>Value</th><th>Checked</th>
              <th>Age</th><th>Cadence</th><th>State</th><th>verified_by</th>
            </tr>
          </thead>
          <tbody>
            {v.rows.map(r => (
              <tr key={`${r.slug}-${r.field}`}>
                <td>{r.venue}</td>
                <td>{r.field}</td>
                <td>{r.value ?? <span className="unverified">null</span>}</td>
                <td>{r.date_checked ?? '—'}</td>
                <td className="num">{r.age}</td>
                <td className="num">{r.cadence}</td>
                <td>{r.staleness}</td>
                <td>{r.verified_by}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
