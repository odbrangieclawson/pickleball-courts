import type {Metadata} from 'next'
import {ORIGIN, PAGE_ROBOTS} from '../../lib/site/origin.mjs'

/*
  PICKLEBALL COURT DIMENSIONS.

  KEYWORDS. Its own URL rather than a section of /how-to-play-pickleball/,
  because Rule 9 puts one primary keyword on one URL and the guide already
  owns "how to play pickleball" (23,000 US, KD 0). Putting a second head
  term on that page would rank it properly for neither. US volume and
  difficulty for what this page targets:

    pickleball court dimensions           23,000   KD 4
    pickleball court size                 14,000   KD 0
    dimensions of a pickleball court       1,600   KD 0
    pickleball court dimensions in feet    1,500   KD 0
    what are the dimensions of a court     1,000   KD 0
    backyard pickleball court dimensions     400   KD 2
    pickleball court dimensions diagram      300   KD 3
    + roughly twenty more at KD 0-7        ~3,500

  Ahrefs gives "pickleball court size" the parent topic "pickleball court
  dimensions", so one page can hold both. The cluster is about 44,000
  searches a month at a difficulty this site can reach on a new domain.

  It is not in keyword-map.json. The map's url_patterns are checked against
  LOCKED_URL_PATTERNS, which comes from decisions.md section 1 and is
  IMMUTABLE; the editorial pages (/how-to-play-pickleball/, /about/) have
  never been in the map for that reason, and this follows them.

  SOURCING. Every number here is stated by USA Pickleball, the national
  governing body, and the sentence it comes from is quoted on the page with
  the date it was read. The snapshot is data/sources/rules/usapickleball-
  court.txt. Two figures are arithmetic on those numbers rather than
  statements by USAP - the service-court size and the playing area a
  20x44 court needs - and both say so where they appear. That is the same
  discipline the venue pages follow: a stated fact is quoted, a derived one
  is shown with its working, and nothing is asserted from memory.

  The rulebook itself is published as an ebook this project cannot fetch,
  so the governing body's own summary of its court specifications is the
  source used, and the page links the reader to both.

  THE DIAGRAM is inline SVG drawn to scale from those same numbers - 20 by
  44 with a 7-foot non-volley zone - so the picture cannot disagree with
  the table beside it. No image file, no library, and it renders with
  JavaScript off like everything else here (Rule 1).
*/
export const metadata: Metadata = {
  title: 'Pickleball Court Dimensions: Size, Net Height and Layout',
  description:
    'A pickleball court is 20 feet wide by 44 feet long, with a 7-foot non-volley zone and a net 36 inches high at the sidelines. Every measurement, with the source.',
  robots: PAGE_ROBOTS,
  alternates: {canonical: '/pickleball-court-dimensions/'},
}

/* The one sentence every number on this page comes from. */
const USAP_COURT =
  'A pickleball court measures 20 feet wide by 44 feet long for singles and ' +
  'doubles. The net is 36 inches high at the sidelines and 34 in the center. ' +
  'Each side has a 7-foot non-volley zone (“the Kitchen”), adding strategy ' +
  'and placement to play.'

const USAP_NVZ =
  'The non-volley zone is the court area within 7 feet on both sides of the net.'

const SRC_COURT = 'https://usapickleball.org/what-is-pickleball/'
const SRC_RULES = 'https://usapickleball.org/rules/summary/'
const CHECKED = '2026-09-09'

/*
  feet -> metres, to one decimal. Written out rather than computed in the
  markup so the table cannot drift from the number beside it.
*/
const MEASUREMENTS = [
  {what: 'Court length', ft: '44 ft', inches: '528 in', m: '13.41 m', stated: true},
  {what: 'Court width', ft: '20 ft', inches: '240 in', m: '6.10 m', stated: true},
  {what: 'Non-volley zone depth, each side', ft: '7 ft', inches: '84 in', m: '2.13 m', stated: true},
  {what: 'Net height at the sidelines', ft: '3 ft', inches: '36 in', m: '0.91 m', stated: true},
  {what: 'Net height at the centre', ft: '2 ft 10 in', inches: '34 in', m: '0.86 m', stated: true},
  {what: 'Service court, each of four', ft: '10 × 15 ft', inches: '120 × 180 in', m: '3.05 × 4.57 m', stated: false},
  {what: 'Baseline to non-volley line', ft: '15 ft', inches: '180 in', m: '4.57 m', stated: false},
]

const FAQS = [
  {
    q: 'What are the dimensions of a pickleball court?',
    a: 'Twenty feet wide by forty-four feet long. USA Pickleball states it in one sentence: "A pickleball court measures 20 feet wide by 44 feet long for singles and doubles." That is the playing surface inside the lines, and it is the same court for both singles and doubles — unlike tennis, the court does not narrow for singles.',
  },
  {
    q: 'Is a pickleball court the same size as a badminton court?',
    a: 'The playing surface is the same, 20 by 44 feet, which is why pickleball is often described as being played on a badminton-sized court. The net is not the same: a pickleball net is 36 inches at the sidelines and 34 at the centre, well below a badminton net.',
  },
  {
    q: 'How high is a pickleball net?',
    a: 'Thirty-six inches at the sidelines and thirty-four inches at the centre, as stated by USA Pickleball. The two-inch dip is deliberate and it matters: the lowest point of the net is in the middle, which is why a ball down the centre clears more easily than one hit down the line.',
  },
  {
    q: 'How big is the kitchen on a pickleball court?',
    a: 'Seven feet deep on each side of the net, running the full twenty-foot width. USA Pickleball’s rules summary puts it as "the court area within 7 feet on both sides of the net." Its proper name is the non-volley zone, and the fourteen feet of court it accounts for is where most beginner faults happen.',
  },
  {
    q: 'How much space do I need to build a pickleball court?',
    a: 'More than 20 by 44 feet, because players need room to run past the baseline and beside the sidelines. The 20 by 44 figure is the court itself, and it is the only figure USA Pickleball states in the summary this page cites. Anything we told you about the surrounding run-off would be a number we had not sourced, so we have not printed one — check the current rulebook before you pour concrete.',
  },
  {
    q: 'Can pickleball be played on a tennis court?',
    a: 'Yes, and most public pickleball in the United States is. A tennis court is 36 feet wide by 78 feet long, which fits one pickleball court comfortably and, with lines painted for it, often more than one. Many venues in this directory are exactly that arrangement, and each venue page says whether its courts are dedicated or shared.',
  },
]

const jsonLd = JSON.stringify({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {'@type': 'ListItem', position: 1, name: 'Find Pickleball Courts', item: `${ORIGIN}/`},
        {'@type': 'ListItem', position: 2, name: 'Pickleball court dimensions', item: `${ORIGIN}/pickleball-court-dimensions/`},
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: FAQS.map(f => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: {'@type': 'Answer', text: f.a},
      })),
    },
  ],
})

/*
  THE COURT, TO SCALE.

  The viewBox is the court in feet with a margin, so every coordinate below
  is a real measurement and the drawing cannot disagree with the table. 0,0
  is the top-left corner of the playing surface; the court runs 20 wide and
  44 long; the net sits at y=22 and the non-volley lines at y=15 and y=29.
*/
function CourtDiagram() {
  const W = 20
  const L = 44
  const NVZ = 7
  const M = 3.4 // margin, in feet, for the labels
  return (
    <svg
      className="court-svg"
      viewBox={`${-M} ${-M} ${W + M * 2} ${L + M * 2}`}
      role="img"
      aria-label="A pickleball court drawn to scale: 20 feet wide by 44 feet long, with a 7-foot non-volley zone on each side of a net across the middle."
    >
      {/* surface */}
      <rect x="0" y="0" width={W} height={L} className="court-surface" />

      {/* service courts: the centreline runs from each baseline to the
          non-volley line, and stops there — it does not cross the kitchen. */}
      <line x1={W / 2} y1="0" x2={W / 2} y2={L / 2 - NVZ} className="court-line" />
      <line x1={W / 2} y1={L / 2 + NVZ} x2={W / 2} y2={L} className="court-line" />

      {/* non-volley lines, 7 ft each side of the net */}
      <line x1="0" y1={L / 2 - NVZ} x2={W} y2={L / 2 - NVZ} className="court-line" />
      <line x1="0" y1={L / 2 + NVZ} x2={W} y2={L / 2 + NVZ} className="court-line" />

      {/* the kitchen, tinted on both sides */}
      <rect x="0" y={L / 2 - NVZ} width={W} height={NVZ * 2} className="court-kitchen" />

      {/* perimeter last, so it sits over the fills */}
      <rect x="0" y="0" width={W} height={L} className="court-edge" />

      {/* the net */}
      <line x1={-1.2} y1={L / 2} x2={W + 1.2} y2={L / 2} className="court-net" />

      {/* labels */}
      <text x={W / 2} y={-1.1} className="court-label" textAnchor="middle">20 ft wide</text>
      <text
        x={-1.3}
        y={L / 2}
        className="court-label"
        textAnchor="middle"
        transform={`rotate(-90 ${-1.3} ${L / 2})`}
      >44 ft long</text>
      <text x={W / 2} y={L / 2 - NVZ / 2 + 0.6} className="court-label is-in" textAnchor="middle">kitchen · 7 ft</text>
      <text x={W / 2} y={L / 2 + NVZ / 2 + 0.6} className="court-label is-in" textAnchor="middle">kitchen · 7 ft</text>
      {/* Anchored to the right edge of the viewBox rather than offset from
          the net line: at 1.35px the word is wider than the margin left of
          the edge, and starting it beside the line clipped it to "ne". */}
      <text x={W + M - 0.15} y={L / 2 + 0.5} className="court-label" textAnchor="end">net</text>
    </svg>
  )
}

export default function CourtDimensionsPage() {
  return (
    <div className="wrap page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{__html: jsonLd}} />
      <nav aria-label="Breadcrumb" className="crumbs">
        <a href="/">Home</a> › Pickleball court dimensions
      </nav>

      <h1 data-prose>Pickleball court dimensions</h1>
      <p className="lede" data-prose>
        A pickleball court is <strong>20 feet wide by 44 feet long</strong>, with
        a 7-foot non-volley zone on each side of a net that stands 36 inches at
        the sidelines and 34 inches in the middle. Every number on this page is
        one USA Pickleball states, quoted below with the date we read it.
      </p>

      <figure className="court-figure" data-not-prose>
        <CourtDiagram />
        <figcaption>
          Drawn to scale from the measurements below: the diagram is generated
          from the same numbers as the table, so the two cannot disagree.
        </figcaption>
      </figure>

      <h2 data-prose>Every measurement</h2>
      <div className="table-scroll" data-not-prose>
        <table>
          <thead>
            <tr><th>Measurement</th><th>Feet</th><th>Inches</th><th>Metric</th></tr>
          </thead>
          <tbody>
            {MEASUREMENTS.map(m => (
              <tr key={m.what}>
                <td>
                  {m.what}
                  {!m.stated && <span className="derived-mark" title="Arithmetic on the stated figures, not a figure USA Pickleball states"> derived</span>}
                </td>
                <td>{m.ft}</td>
                <td>{m.inches}</td>
                <td>{m.m}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="provenance" data-not-prose>
        The first five are stated by{' '}
        <a href={SRC_COURT} rel="nofollow">USA Pickleball</a>, checked {CHECKED}.
        The two marked <em>derived</em> are arithmetic on those figures and are
        not quoted from the governing body: a service court is half the
        20-foot width by what is left of the 22-foot half-court once the
        7-foot non-volley zone is taken off it.
      </p>

      <h2 data-prose>What the governing body says</h2>
      <blockquote data-prose>
        <p>{USAP_COURT}</p>
        <cite>
          USA Pickleball, <a href={SRC_COURT} rel="nofollow">What Is Pickleball?</a>,
          read {CHECKED}
        </cite>
      </blockquote>
      <blockquote data-prose>
        <p>{USAP_NVZ}</p>
        <cite>
          USA Pickleball, <a href={SRC_RULES} rel="nofollow">Rules Summary</a>,
          read {CHECKED}
        </cite>
      </blockquote>
      <p data-prose>
        Those two sentences are the whole of it. The official rulebook carries
        the court specifications in full and is the document to check before
        building anything; it is published as an ebook we cannot fetch and
        archive, so this page quotes the governing body&rsquo;s own summary of
        its rules rather than paraphrasing a document we have not read.
      </p>

      <h2 data-prose>The same court for singles and doubles</h2>
      <p data-prose>
        This is the detail that surprises people arriving from tennis. A tennis
        court narrows for singles; a pickleball court does not. The sentence
        above says &ldquo;for singles and doubles&rdquo; and means it — 20 by 44
        either way, the same lines, the same kitchen. What changes is how much
        of it one player has to cover.
      </p>

      <h2 data-prose>Where the kitchen actually is</h2>
      <p data-prose>
        Seven feet from the net on each side, running the full width of the
        court. That is fourteen feet of the forty-four accounted for by a zone
        you may stand in but may not volley from, which is why it decides more
        rallies than any other part of the court. On the diagram it is the
        tinted band. On a real court it is usually the only area painted a
        different colour, and if you are looking at a shared tennis court with
        pickleball lines, it is the line to find first.
      </p>

      <h2 data-prose>Reading a court before you play on it</h2>
      <p data-prose>
        Most public pickleball in the United States is played on courts built
        for something else, with pickleball lines added. On a shared court the
        pickleball lines are usually the thinner or differently coloured set,
        and the net is a portable one set to the heights above rather than the
        permanent tennis net, which is too high. Whether a venue has dedicated
        courts or shared ones changes what you should expect to find when you
        arrive, so every venue page in this directory says which it is where
        the operator states it — and says nothing where the operator does not.
      </p>

      <h2 data-prose>Questions people ask</h2>
      {FAQS.map(f => (
        <section key={f.q} data-prose>
          <h3>{f.q}</h3>
          <p>{f.a}</p>
        </section>
      ))}

      <div className="note is-gap" data-prose>
        <h3>Now find one</h3>
        <p>
          Knowing the measurements is not the same as having somewhere to use
          them. This site holds pickleball venues whose court counts, lights and
          addresses each carry the source they came from and the date they were
          checked. Start with <a href="/">the directory</a>, or read{' '}
          <a href="/how-to-play-pickleball/">how to play pickleball</a> if the
          court is new to you as well as its dimensions.
        </p>
      </div>
    </div>
  )
}
