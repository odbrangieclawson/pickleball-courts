import type {Metadata} from 'next'
import {ORIGIN, PAGE_ROBOTS} from '../../lib/site/origin.mjs'
import {homeView} from '../../lib/site/views.mjs'
import {CONTACT_EMAIL} from '../../lib/site/contact.mjs'

/*
  The page that says what this site is, in plain words, for someone who
  has landed on it and wants to know whether to trust it.

  Every number on it comes from homeView(), which reads getCounts() — rule
  2. An About page is the most tempting place on a site to type a figure
  by hand, and a hand-typed figure is stale the day after the next city
  ships. So the venue, court, city and state counts here are the same
  values the home page hero shows, and they move together.

  It does not name a founder, an office or a team, because none of that is
  recorded anywhere in this repository and inventing it would be exactly
  the kind of claim the rest of the site refuses to make.
*/
export const metadata: Metadata = {
  title: 'About',
  description:
    'A US pickleball court directory where every published fact carries a named source and the date it was checked. What it is, what is on it, and what it refuses to do.',
  robots: PAGE_ROBOTS,
  alternates: {canonical: '/about/'},
}

/* Gate 3: BreadcrumbList on every page, editorial pages included. */
const breadcrumbLd = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {'@type': 'ListItem', position: 1, name: 'Find Pickleball Courts', item: `${ORIGIN}/`},
    {'@type': 'ListItem', position: 2, name: 'About', item: `${ORIGIN}/about/`},
  ],
})

export default function About() {
  const v = homeView()

  return (
    <div className="wrap page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{__html: breadcrumbLd}} />
      <nav aria-label="Breadcrumb" className="crumbs">
        <a href="/">Home</a> › About
      </nav>

      <h1>About Find Pickleball Courts</h1>
      <p className="lede">
        A directory of public pickleball courts in the United States, built
        on one rule: every published fact carries the name of the organisation
        that published it and the date we checked it. Where we have not
        checked something, the page says so instead of guessing.
      </p>

      <h2>Why it exists</h2>
      <p>
        Finding a court should be simple, and the large directories make it
        harder than it needs to be. They will tell you a park has six courts
        without saying who counted them or when. Some carry two different
        counts for the same city on the same page. Some publish tens of
        thousands of city pages with nothing verified on any of them, and
        need JavaScript running before they will show you a single address.
      </p>
      <p>
        So we built the directory we wanted to use. It is small, because
        every venue on it was checked against a named source before it was
        published, and a city page exists only when at least three venues
        in that city have passed that check. We would rather be right than
        big, and we would rather show a gap than fill it.
      </p>

      <h2>What is on it today</h2>
      <dl className="hero-proof about-proof">
        <div>
          <dt>Verified venues</dt>
          <dd>{v.venues}</dd>
        </div>
        <div>
          <dt>Courts</dt>
          <dd>{v.courts}</dd>
        </div>
        <div>
          <dt>{v.cityWord}</dt>
          <dd>{v.cityCount}</dd>
        </div>
        <div>
          <dt>States</dt>
          <dd>{v.stateCount}</dd>
        </div>
        <div>
          <dt>Last checked</dt>
          <dd>{v.lastChecked}</dd>
        </div>
      </dl>
      <p>
        {v.gapSentence} The sources are almost all city and county parks
        departments, either their published facility pages or their open
        data, and each city page names its own. The full list of what we
        will and will not treat as a source is on{' '}
        <a href="/how-we-verify/">How we verify</a>.
      </p>

      <h2>What we refuse to do</h2>
      <ul>
        <li><strong>Print a zero for something we have not checked.</strong> &ldquo;No lights&rdquo; and &ldquo;not verified yet&rdquo; are different statements, and only one of them is true when we have not looked.</li>
        <li><strong>Cite another directory.</strong> A number repeated by three sites that copied each other is still one unsourced number.</li>
        <li><strong>Sell position.</strong> A venue that claims its listing gets a direct line to us and control of its own facts. It gets no ranking, no badge and no placement over a venue that has not.</li>
        <li><strong>Publish a thin page.</strong> Fewer than three verified venues in a city means no city page, however good the keyword looks.</li>
      </ul>

      <h2>Help us get it right</h2>
      <p>
        Most of what is missing here is missing because the operator does
        not publish it, not because we did not look. If you play at a court
        we have wrong, every venue page has a correction link that reaches a
        real queue. If you run a court, on the site or not, the{' '}
        <a href="/add-your-court/">Add or claim your court</a> page explains
        what a claim does and what to send. And if none of that fits, write
        to <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </div>
  )
}
