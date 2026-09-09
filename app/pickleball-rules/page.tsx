import type {Metadata} from 'next'
import {ORIGIN, PAGE_ROBOTS} from '../../lib/site/origin.mjs'

/*
  PICKLEBALL RULES.

  KEYWORDS. Everything Ahrefs gives the parent topic "pickleball rules",
  which is what one page may hold under Rule 9. US volume and difficulty:

    pickleball rules                 41,000   KD 7
    rules of pickleball               4,300   KD 7
    pickleball rules doubles          3,700   KD 0
    pickleball serving rules          3,400   KD 3
    pickleball singles rules          2,100   KD 0
    pickleball serve rules            1,700   KD 8
    pickleball rules for beginners    1,000   KD 10
    pickleball doubles rules            800   KD 4
    basic pickleball rules              800   KD 5
    pickleball rules and scoring        700   KD 5
    what are the rules of pickleball    700   KD 0
    + six more at KD 0-8              ~2,900

  About 63,000 searches a month on one page.

  WHAT THIS PAGE DELIBERATELY DOES NOT CHASE. Three neighbouring terms have
  DIFFERENT parent topics, so they are separate pages when they are written
  and must not be over-optimised here:

    pickleball kitchen rules   2,600  -> parent "what is the kitchen in pickleball"
    pickleball scoring rules   2,000  -> parent "pickleball scoring"
    pickleball rules singles   2,300  -> parent "pickleball singles rules"

  Both subjects appear below because a rules page without the kitchen or
  the score would be a bad rules page, but each is covered at the depth
  this page needs and no further, with the head term left alone.

  It is also distinct from /how-to-play-pickleball/, which owns "how to
  play pickleball" (23,000, KD 0). That page is an introduction for someone
  who has never held a paddle; this one is the rules, in the order a rally
  happens, for someone looking a specific rule up.

  Not in keyword-map.json, for the same reason as the dimensions page: the
  map validates url_patterns against LOCKED_URL_PATTERNS from decisions.md
  section 1, which is IMMUTABLE, and the editorial pages have never been in
  it.

  SOURCING. Every rule is quoted or closely paraphrased from USA
  Pickleball's own rules summary, read 2026-09-09 and snapshotted to
  data/sources/rules/usapickleball-rules-summary.txt. Where this page
  paraphrases, the governing body's sentence sits beside it. Nothing is
  written from memory, and no rule is stated that the source does not
  carry — the full Official Rulebook is an ebook this project cannot fetch
  and archive, so the summary is the source and the reader is sent to the
  rulebook for anything past it.
*/
export const metadata: Metadata = {
  title: 'Pickleball Rules: Serving, Scoring, the Kitchen and Faults',
  description:
    'The rules of pickleball in the order a rally happens: the serve, the two-bounce rule, the non-volley zone and what counts as a fault. Quoted from USA Pickleball.',
  robots: PAGE_ROBOTS,
  alternates: {canonical: '/pickleball-rules/'},
}

const SRC = 'https://usapickleball.org/rules/summary/'
const RULEBOOK = 'https://usapickleball.org/rules/'
const CHECKED = '2026-09-09'

/*
  Quoted verbatim. Each block is one rule as the governing body writes it,
  so the page can be checked against the source line by line.
*/
const SERVE = [
  'The server’s arm must be moving in an upward arc when the ball is struck.',
  'At the time the ball is struck, the server’s feet may not touch the court or outside the imaginary extension of the sideline or centerline and at least one foot must be behind the baseline on the playing surface or the ground.',
  'The serve is made diagonally crosscourt and must land within the confines of the opposite diagonal court.',
  'Only one serve attempt is allowed per server.',
  'A “drop serve” is also permitted in which case none of the elements above apply.',
]

const DOUBLES = [
  'Both players on the serving doubles team have the opportunity to serve and score points until they commit a fault (except for the first service sequence of each new game).',
  'The first serve of each side-out is made from the right-hand court.',
  'If a point is scored, the server switches sides and the server initiates the next serve from the lefthand court.',
  'When the first server loses the serve the partner then serves from their correct side of the court.',
  'Once the service goes to the opposition (at side out), the first serve is from the right-hand court.',
]

const TWO_BOUNCE = [
  'When the ball is served, the receiving team must let it bounce before returning, and then the serving team must let it bounce before returning, thus two bounces.',
  'After the ball has bounced once in each team’s court, both teams may either volley the ball (hit the ball before it bounces) or play it off a bounce (ground stroke).',
  'The two-bounce rule eliminates the serve and volley advantage and extends rallies.',
]

const KITCHEN = [
  'The non-volley zone is the court area within 7 feet on both sides of the net.',
  'Volleying is prohibited within the non-volley zone. This rule prevents players from executing smashes from a position within the zone.',
  'It is a fault if, when volleying a ball, the player steps on the non-volley zone, including the line and/or when the player’s momentum causes them or anything they are wearing or carrying to touch the non-volley zone including the associated lines.',
  'It is a fault if, after volleying, a player is carried by momentum into or touches the non-volley zone, even if the volleyed ball is declared dead before this happens.',
  'A player may legally be in the non-volley zone any time other than when volleying a ball.',
  'The non-volley zone is commonly referred to as “the kitchen.”',
]

const FAULTS = [
  'A serve does not land within the confines of the receiving court',
  'The ball is hit into the net on the serve or any return',
  'The ball is volleyed before a bounce has occurred on each side',
  'A ball is volleyed from the non-volley zone',
  'A ball bounces twice before being struck by the receiver',
  'A player, player’s clothing, or any part of a player’s paddle touches the net or the net post when the ball is in play',
  'A ball in play strikes a player or anything the player is wearing or carrying',
]

const LINES = [
  'A ball contacting any line, except the non-volley zone line on a serve, is considered “in.”',
  'A serve contacting the non-volley zone line is short and a fault.',
]

const FAQS = [
  {
    q: 'What are the basic rules of pickleball?',
    a: 'Serve underhand and diagonally. Let the ball bounce once on each side before anyone volleys. Do not volley from the seven-foot zone beside the net. Only the serving side scores. Games are normally to 11, win by 2. Everything else is detail on those five.',
  },
  {
    q: 'What are the rules for doubles pickleball?',
    a: 'Both partners get to serve before the serve passes over, except in the first service sequence of a game where only one does. The first serve of each side-out comes from the right-hand court, and the server switches sides after each point their team wins. Otherwise doubles and singles share the same rules.',
  },
  {
    q: 'What are the serving rules in pickleball?',
    a: 'The arm must move in an upward arc, at least one foot must be behind the baseline, the serve goes diagonally crosscourt, and you get one attempt. A drop serve is also allowed, and if you use it none of those elements apply.',
  },
  {
    q: 'Can you volley in pickleball?',
    a: 'Yes, once the ball has bounced once on each side. Before that the two-bounce rule applies. You may also never volley while standing in the non-volley zone, or while your momentum carries you into it afterwards. That is a fault even if the ball is already dead.',
  },
  {
    q: 'Is a ball on the line in or out in pickleball?',
    a: 'In, with one exception. USA Pickleball puts it as "A ball contacting any line, except the non-volley zone line on a serve, is considered in." A serve that touches the kitchen line is short, and a fault.',
  },
  {
    q: 'How do you win a point in pickleball?',
    a: 'Only the serving side scores. You win a point when the receiving team faults: the ball goes into the net or out, bounces twice, is volleyed too early or from the kitchen, or touches a player. Games are normally played to 11 points, win by 2, and tournament games may go to 15 or 21.',
  },
]

const jsonLd = JSON.stringify({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {'@type': 'ListItem', position: 1, name: 'Find Pickleball Courts', item: `${ORIGIN}/`},
        {'@type': 'ListItem', position: 2, name: 'Pickleball rules', item: `${ORIGIN}/pickleball-rules/`},
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
  THE SERVE AND THE TWO BOUNCES, IN ONE PICTURE.

  These are the two rules a newcomer gets wrong, and both are about where
  the ball goes rather than how it is hit, so a drawing says them faster
  than a paragraph. The viewBox is the court in feet, like the diagram on
  the dimensions page, so the service boxes are where they actually are.

  THE TWO PATHS BOW OPPOSITE WAYS ON PURPOSE. Drawn with mirrored control
  points they landed on top of each other and read as one straight line,
  which told the reader nothing. The serve bows left and the return bows
  right, so the eye follows a zigzag and sees two separate shots.

  The margin is 6ft rather than 4.6 because the server label sits below the
  baseline and was being clipped by the viewBox at the smaller value.
*/
function ServeDiagram() {
  const W = 20
  const L = 44
  const NVZ = 7
  const M = 6
  const mid = L / 2
  /* Where each shot lands: the serve in the far service box, the return
     back on the serving side. */
  const b1 = {x: 5, y: (mid - NVZ) / 2}
  const b2 = {x: 12, y: L - 6}
  return (
    <svg
      className="court-svg is-wide"
      viewBox={`${-M} ${-M} ${W + M * 2} ${L + M * 2}`}
      role="img"
      aria-label="The serve is hit from behind the baseline on the right, diagonally across the net into the far service box, where it bounces once. The return must also bounce once on the serving side. Only after those two bounces may either side volley, and nobody may volley from the shaded non-volley zone."
    >
      <rect x="0" y="0" width={W} height={L} className="court-surface" />
      <line x1={W / 2} y1="0" x2={W / 2} y2={mid - NVZ} className="court-line" />
      <line x1={W / 2} y1={mid + NVZ} x2={W / 2} y2={L} className="court-line" />
      <line x1="0" y1={mid - NVZ} x2={W} y2={mid - NVZ} className="court-line" />
      <line x1="0" y1={mid + NVZ} x2={W} y2={mid + NVZ} className="court-line" />
      <rect x="0" y={mid - NVZ} width={W} height={NVZ * 2} className="court-kitchen" />
      <rect x="0" y="0" width={W} height={L} className="court-edge" />
      <line x1={-1.2} y1={mid} x2={W + 1.2} y2={mid} className="court-net" />

      {/* the server, behind the baseline on the right */}
      <circle cx={15} cy={L + 2.4} r="1.15" className="serve-player" />
      <text x={15} y={L + 5.6} className="court-label" textAnchor="middle">server</text>

      {/* the serve, bowing LEFT into the far service box */}
      <path d={`M 15 ${L + 1.1} Q 7 ${mid + 2} ${b1.x} ${b1.y}`} className="serve-path" />
      {/* the return, bowing RIGHT so the two shots never overlap */}
      <path d={`M ${b1.x} ${b1.y + 1.3} Q 17 ${mid} ${b2.x} ${b2.y}`} className="serve-path is-return" />

      <circle cx={b1.x} cy={b1.y} r="1.15" className="serve-bounce" />
      <text x={b1.x} y={b1.y + 0.6} className="serve-num" textAnchor="middle">1</text>
      <circle cx={b2.x} cy={b2.y} r="1.15" className="serve-bounce is-return" />
      <text x={b2.x} y={b2.y + 0.6} className="serve-num" textAnchor="middle">2</text>

      <text x={W / 2} y={-3.4} className="court-label" textAnchor="middle">1. the serve lands diagonally</text>
      <text x={W / 2} y={-1.3} className="court-label" textAnchor="middle">2. the return must bounce too</text>
      <text x={W / 2} y={mid + NVZ / 2 + 0.6} className="court-label is-in" textAnchor="middle">no volleys in here</text>
    </svg>
  )
}

/* A block of rules quoted from the source, with one attribution under it. */
function Rules({items}: {items: string[]}) {
  return (
    <ul className="ruleset" data-not-prose>
      {items.map(r => <li key={r}>{r}</li>)}
    </ul>
  )
}

export default function PickleballRulesPage() {
  return (
    <div className="wrap page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{__html: jsonLd}} />
      <nav aria-label="Breadcrumb" className="crumbs">
        <a href="/">Home</a> › Pickleball rules
      </nav>

      <h1 data-prose>Pickleball rules</h1>
      <p className="lede" data-prose>
        The rules in the order a rally happens: the serve, the two bounces,
        the non-volley zone, the faults and the score. Every rule below is
        quoted from USA Pickleball&rsquo;s own rules summary, read{' '}
        {CHECKED}, so you can check this page against the governing body
        line by line.
      </p>

      <div className="note is-gap" data-prose>
        <h3>The five that decide most rallies</h3>
        <p>
          Serve underhand and diagonally. Let the ball bounce once on each
          side before anyone volleys. Do not volley from the seven-foot zone
          beside the net. Only the serving side scores. Games go to 11, win
          by 2. Everything below is detail on those five.
        </p>
      </div>

      <figure className="court-figure" data-not-prose>
        <ServeDiagram />
        <figcaption>
          The serve crosses the net diagonally and bounces once (1). The
          return must bounce too (2). Only after those two bounces may
          either side volley, and nobody may volley from the shaded zone.
        </figcaption>
      </figure>

      <h2 data-prose>The serve</h2>
      <p data-prose>
        The serve is underhand by construction. The rule is written as a
        requirement about the arm, not about the height of the ball, which is
        what catches out players arriving from tennis.
      </p>
      <Rules items={SERVE} />

      <h2 data-prose>Serving in doubles</h2>
      <p data-prose>
        This is the part newcomers find hardest, and the reason doubles scores
        are called as three numbers rather than two. Both partners serve
        before the ball goes over, with one exception at the start of a game.
      </p>
      <Rules items={DOUBLES} />
      <p data-prose>
        In singles it is simpler:{' '}
        <em>
          in singles the server serves from the right-hand court when his or
          her score is even and from the left when the score is odd.
        </em>
      </p>

      <h2 data-prose>The two-bounce rule</h2>
      <p data-prose>
        This is the rule that makes pickleball its own game rather than small
        tennis. It is why a big serve wins far less here than you would
        expect.
      </p>
      <Rules items={TWO_BOUNCE} />

      <h2 data-prose>The non-volley zone, or kitchen</h2>
      <p data-prose>
        Seven feet from the net on each side, running the full width of the
        court. See{' '}
        <a href="/pickleball-court-dimensions/">the court dimensions</a> for
        where it sits. You may stand in it. You may not volley from it, and the
        rule reaches further than most players realise: your own momentum
        can fault you after the ball is dead.
      </p>
      <Rules items={KITCHEN} />

      <h2 data-prose>Faults</h2>
      <p data-prose>
        A fault is <em>any action that stops play because of a rule
        violation</em>. A fault by the receiving team gives the serving team
        a point; a fault by the serving team loses the serve. It is a fault
        when:
      </p>
      <Rules items={FAULTS} />

      <h2 data-prose>Lines</h2>
      <Rules items={LINES} />

      <h2 data-prose>Scoring, in brief</h2>
      <p data-prose>
        <em>Points are scored only by the serving team.</em> Games are
        normally played to 11 points, win by 2, and tournament games may be
        to 15 or 21, win by 2. Which side you stand on follows the score:
        when the serving team&rsquo;s score is even, the player who served
        first for that team is in the right-side court; when it is odd, they
        are on the left.
      </p>

      <p className="provenance" data-not-prose>
        Every rule on this page is quoted from{' '}
        <a href={SRC} rel="nofollow">USA Pickleball&rsquo;s rules summary</a>,
        read {CHECKED}. The summary is not the whole rulebook: the{' '}
        <a href={RULEBOOK} rel="nofollow">Official Rulebook</a> governs, and
        it is the document to check for anything a match turns on. We quote
        the summary because it is a page we can fetch and re-check; the
        rulebook is published as an ebook we cannot archive, and this site
        does not publish from a source it cannot re-read.
      </p>

      <h2 data-prose>Questions people ask</h2>
      {FAQS.map(f => (
        <section key={f.q} data-prose>
          <h3>{f.q}</h3>
          <p>{f.a}</p>
        </section>
      ))}

      <div className="note is-gap" data-prose>
        <h3>Somewhere to use them</h3>
        <p>
          Rules are easier to learn on a court than off one. This site holds
          pickleball venues whose court counts, lights and addresses each
          carry the source they came from and the date they were checked.
          Start with <a href="/">the directory</a>, or read{' '}
          <a href="/how-to-play-pickleball/">how to play pickleball</a> if
          you are starting from the beginning.
        </p>
      </div>
    </div>
  )
}
