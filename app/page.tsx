import type {Metadata} from 'next'
import {homeView} from '../lib/site/views.mjs'

/*
  Home.

  Modelled on findswimmingholes, which leads with "1,216 Verified Places to
  Swim" — the count IS the value proposition. Every number here comes from
  getCounts() via lib/site/views.mjs; this file holds no arithmetic, which
  is what keeps validate-no-bypass.mjs quiet and Decision D2 true.
*/

export const metadata: Metadata = {
  title: 'Deep Pickleball — verified courts, with sources',
  description:
    'Pickleball courts with a named source and a checked date on every fact. We publish what we have verified, and we publish the gaps too.',
  robots: {index: false, follow: false},
}

export default function Home() {
  const v = homeView()

  return (
    <div className="wrap page">
      <h1>{v.headline}</h1>
      <p className="lede">
        Every court count, every set of lights, every address on this site
        carries the source it came from and the date we checked it. Where a
        fact has not been verified, we say &ldquo;not verified yet&rdquo; —
        never a zero, never a guess.
      </p>

      <div className="stats">
        <div className="stat">
          <span className="n">{v.venues}</span>
          <span className="k">Verified venues</span>
        </div>
        <div className="stat">
          <span className="n">{v.courts}</span>
          <span className="k">Courts</span>
        </div>
        <div className="stat">
          <span className="n">{v.cityCount}</span>
          <span className="k">{v.cityWord}</span>
        </div>
        <div className="stat">
          <span className="n">{v.lastChecked}</span>
          <span className="k">Last checked</span>
        </div>
      </div>

      <h2>Where we have verified</h2>
      <ul className="cards">
        {v.cities.map(c => (
          <li className="card" key={c.href}>
            <h3><a href={c.href}>{c.title}</a></h3>
            <p className="meta">{c.meta}</p>
            <p>{c.blurb}</p>
            <span className="trust">{c.trust}</span>
          </li>
        ))}
      </ul>

      <h2>What makes this different</h2>
      <div className="note">
        <p>
          <strong>Three competitors, none of them show their working.</strong>{' '}
          Not one of the large pickleball directories tells you where a court
          count came from or when anyone last looked. One of them ships
          contradictory counts on the same city page. Another has 25,000 pages
          and needs JavaScript to show you any of them.
        </p>
        <p>
          This directory publishes a smaller number of pages and stands behind
          every one. <a href="/how-we-verify/">How we verify</a>.
        </p>
      </div>

      <h2>The gaps, published</h2>
      <p>
        {v.gapSentence} We would rather show you an honest hole than fill it
        with something we made up. Each one carries a link to tell us what we
        have wrong.
      </p>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{__html: v.jsonLd}}
      />
    </div>
  )
}
