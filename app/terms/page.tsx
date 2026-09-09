import type {Metadata} from 'next'
import {ORIGIN, PAGE_ROBOTS} from '../../lib/site/origin.mjs'
import {CONTACT_EMAIL} from '../../lib/site/contact.mjs'

/*
  TERMS OF USE.

  Written against what this site actually is: a directory of public courts,
  free to read, with no account, no payment and no user-generated content.
  Most of a standard terms template is about accounts, subscriptions,
  purchases and user submissions, and none of that exists here. Including
  it would be describing a different website.

  THE TWO CLAUSES THAT ACTUALLY MATTER HERE:

  The disclaimer about accuracy has to be honest in both directions. This
  site publishes facts with a source and a date attached and refuses to
  print what it cannot source, which is a stronger promise than a directory
  usually makes. It still cannot promise a court is open today. Saying both
  is the only version that matches the rest of the site.

  The licensing section has to be right about what is not ours. The court
  data comes from parks departments, the rules quotes from USA Pickleball,
  the map tiles from OpenStreetMap under ODbL, and the photographs from
  Wikimedia Commons under CC licences that require attribution. We cannot
  grant rights over any of that, and a terms page that claimed "all content
  is ours" would be making a false claim about other people's work.

  NOT LEGAL ADVICE, and the page says so.
*/
export const metadata: Metadata = {
  title: 'Terms of Use',
  description:
    'The terms for using this pickleball court directory: what it is, what it does not promise, and what you may do with what is published here.',
  robots: PAGE_ROBOTS,
  alternates: {canonical: '/terms/'},
}

const UPDATED = '9 September 2026'

const jsonLd = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {'@type': 'ListItem', position: 1, name: 'Find Pickleball Courts', item: `${ORIGIN}/`},
    {'@type': 'ListItem', position: 2, name: 'Terms of use', item: `${ORIGIN}/terms/`},
  ],
})

export default function TermsPage() {
  return (
    <div className="wrap page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{__html: jsonLd}} />
      <nav aria-label="Breadcrumb" className="crumbs">
        <a href="/">Home</a> › Terms of use
      </nav>

      <h1 data-prose>Terms of use</h1>
      <p className="lede" data-prose>
        Last updated {UPDATED}. Using this site means accepting what is
        below. It is short, because the site is a free directory with no
        accounts, no payments and nothing for you to sign up to.
      </p>

      <h2 data-prose>What this site is</h2>
      <p data-prose>
        A directory of places to play pickleball in the United States,
        together with a few pages explaining the game. Every court count,
        address, set of lights and cost we publish carries the source it
        came from and the date we checked it. It is free to read and there
        is nothing to buy.
      </p>

      <h2 data-prose>What we do not promise</h2>
      <p data-prose>
        That a court is open, playable, free, lit, or still there. We
        publish what an operator published, on the date we read it, and
        parks close, courts get resurfaced and prices change without anyone
        telling us. Where an operator states nothing we print{' '}
        &ldquo;Not stated&rdquo; rather than guessing, and{' '}
        <a href="/how-we-verify/">how we verify</a> sets out the standard a
        record has to meet before it appears at all.
      </p>
      <p data-prose>
        Treat every page as a good record of what a source said on a date,
        not as a guarantee about today. Ring the venue before you drive.
        Nothing here is advice about whether a place is safe or suitable for
        you, and we are not responsible for a wasted journey.
      </p>

      <h2 data-prose>Corrections</h2>
      <p data-prose>
        If something is wrong, tell us and we will check it against the
        source. Every venue page has a correction link, operators can{' '}
        <a href="/add-your-court/">claim a listing</a>, and either reaches a
        real queue. A claim gives an operator control of their own facts. It
        buys no ranking and no placement, and it does not make a listing
        more trusted than one checked against a municipal record.
      </p>

      <h2 data-prose>What you may do with what is here</h2>
      <p data-prose>
        Read it, link to it, quote a line of it with a credit, and use it to
        find somewhere to play. What you may not do is copy the directory
        wholesale, scrape it to rebuild it somewhere else, or republish it
        as your own work.
      </p>
      <p data-prose>
        Much of what is on these pages is not ours to license to you in any
        case:
      </p>
      <ul data-prose>
        <li>
          The court data comes from parks departments and other operators.
          Each page names its source and links to it.
        </li>
        <li>
          The rules and court measurements are quoted from USA Pickleball,
          the sport&rsquo;s governing body.
        </li>
        <li>
          The map tiles come from OpenStreetMap and are used under the Open
          Database Licence, with attribution on every map.
        </li>
        <li>
          The photographs come from Wikimedia Commons under Creative Commons
          licences that require attribution, which is given on the{' '}
          <a href="/image-credits/">image credits</a> page.
        </li>
      </ul>
      <p data-prose>
        Our own writing, page structure, diagrams and code are ours. If you
        want to use something and are not sure which category it falls into,
        ask rather than guess.
      </p>

      <h2 data-prose>Links to other sites</h2>
      <p data-prose>
        Venue pages link to the source they took their facts from, and the
        directions buttons open Google Maps. We do not control those sites
        and are not responsible for them.
      </p>

      <h2 data-prose>Availability</h2>
      <p data-prose>
        The site is provided as it is. We do not promise it will be
        available, and we may change or remove pages. Published addresses
        are meant to be permanent: a URL here is intended to keep working
        rather than be reorganised away.
      </p>

      <h2 data-prose>Changes to these terms</h2>
      <p data-prose>
        If these terms change, the date at the top changes with them.
      </p>

      <div className="note is-gap" data-prose>
        <h3>What this page is, and is not</h3>
        <p>
          A plain description of how this site expects to be used, written
          to match what it actually does. It is not legal advice and nobody
          here is a lawyer. If you need certainty that it covers you in a
          particular jurisdiction, have a solicitor read it before you rely
          on it.
        </p>
      </div>

      <p data-prose>
        Questions go to{' '}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. The{' '}
        <a href="/privacy/">privacy policy</a> covers what the site does and
        does not collect.
      </p>
    </div>
  )
}
