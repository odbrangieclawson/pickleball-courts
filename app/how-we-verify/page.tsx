import type {Metadata} from 'next'

export const metadata: Metadata = {
  title: 'How we verify',
  description:
    'Every published fact has a named source and a date it was checked. Here is the ladder we work down, and what we refuse to do.',
  robots: {index: false, follow: false},
  alternates: {canonical: '/how-we-verify/'},
}

/* Gate 3: BreadcrumbList on every page, editorial pages included. */
const breadcrumbLd = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {'@type': 'ListItem', position: 1, name: 'Find Pickleball Courts', item: 'https://example.invalid/'},
    {'@type': 'ListItem', position: 2, name: 'How we verify', item: 'https://example.invalid/how-we-verify/'},
  ],
})

export default function HowWeVerify() {
  return (
    <div className="wrap page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{__html: breadcrumbLd}} />
      <nav aria-label="Breadcrumb" className="crumbs">
        <a href="/">Home</a> › How we verify
      </nav>

      <h1>How we verify</h1>
      <p className="lede">
        A directory is only worth as much as the worst number in it. So every
        published fact here carries a named source and the date someone
        checked it, and both are visible on the page rather than buried.
      </p>

      <h2>The source ladder</h2>
      <p>
        We work down this list and stop at the highest tier that answers the
        question. A tier-1 answer makes the rest unnecessary.
      </p>
      <ol>
        <li><strong>Municipal parks department</strong> — the operator of most public courts, publishing about its own facilities.</li>
        <li><strong>City or state open data</strong> — same publisher, machine-readable, so it parses cleanly and re-checks cheaply.</li>
        <li><strong>YMCA and recreation centres</strong> — operator-published, reliable on hours and fees.</li>
        <li><strong>Clubs and leagues</strong> — local players know the courts; good on lights and nets, weaker on official counts.</li>
        <li><strong>The venue&rsquo;s own site</strong> — authoritative on fees, but marketing copy inflates court counts.</li>
        <li><strong>Anything else</strong> — recorded as weak, and flagged for a better source.</li>
      </ol>

      <h2>What we refuse to do</h2>
      <ul>
        <li><strong>We never print a zero for something we do not know.</strong> &ldquo;No lights&rdquo; and &ldquo;we have not checked the lights&rdquo; are different claims, and one of them is a lie.</li>
        <li><strong>We never cite another directory as a source.</strong> A competitor repeating a number does not make it true.</li>
        <li><strong>An owner claiming a listing does not make it verified.</strong> A claim tells us who someone is; it is not evidence about the courts. Claimed venues get no ranking or placement advantage either.</li>
        <li><strong>We do not publish a city page from fewer than three verified venues.</strong> Thin pages are how the incumbents ended up with tens of thousands of URLs and almost no readers.</li>
      </ul>

      <h2>What this build actually is</h2>
      <div className="note is-warn">
        <p>
          <strong>A small directory that would rather be right than big.</strong>{' '}
          Every venue on it is real and every fact carries the name of the
          organisation that published it and the date we read it. The
          operators are city and county parks departments, and they differ by
          city — each page names its own.
        </p>
        <p>
          What you will notice most is how much is blank. Surface, fees and
          opening hours are missing far more often than not, because most
          operators do not publish them. Those show as &ldquo;not verified
          yet&rdquo;. We would rather show a hole than fill it, and where two
          of an operator&rsquo;s own records disagree we publish the
          disagreement rather than quietly picking one.
        </p>
      </div>

      <h2>The six gates</h2>
      <p>Every page passes all six or it does not ship.</p>
      <ol>
        <li><strong>Data threshold</strong> — three or more verified venues.</li>
        <li><strong>JavaScript-off render</strong> — all content, links and schema in the raw HTML.</li>
        <li><strong>Schema completeness</strong> — breadcrumbs everywhere, ItemList on city pages, and no fabricated ratings.</li>
        <li><strong>Word band and specificity</strong> — inside the band, with at least three genuinely specific sentences.</li>
        <li><strong>Count consistency</strong> — every number on the page comes from one shared query, so the title cannot disagree with the table.</li>
        <li><strong>Source and freshness</strong> — a source URL and a checked date on every fact.</li>
      </ol>
    </div>
  )
}
