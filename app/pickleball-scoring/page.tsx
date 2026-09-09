import type {Metadata} from 'next'
import {ORIGIN, PAGE_ROBOTS} from '../../lib/site/origin.mjs'

/*
  PICKLEBALL SCORING.

  KEYWORDS. Everything under the parent topic "pickleball scoring", which
  is what one page may hold under Rule 9:

    pickleball scoring            6,300/mo US   KD 0
    pickleball scoring rules      2,000         KD 4
    how to score pickleball         900         KD 2
    how to keep score in pickleball 600         KD 1
    how to score in pickleball      600         KD 2
    pickleball score                400         KD 1
    how do you score in pickleball  350         KD 4
    + nine more                    ~1,000       KD 0-9

  About 12,000 searches a month, almost all of it at KD 0-4.

  NOT CHASED HERE, different parent topics, so separate pages if ever:
    pickleball score keeper                    250  (a device, not a rule)
    what is the starting score of a doubles game 150  -> "pickleball rules doubles"
    how to score pickleball singles              90  -> "can you play pickleball with two people"

  WHAT THE SOURCE DOES AND DOES NOT SAY. USA Pickleball's rules summary
  states who scores, what games are played to, and which side you serve
  from at an even or odd score. It does NOT state the three-number score
  call, and it never writes "0-0-2". Searching the snapshot for "0-0",
  "third number", "server number" and "call the score" returns nothing.

  So the three numbers are explained on this page as the convention that
  follows from rules the source does state, and are labelled as such rather
  than quoted. That is the same treatment the court-dimensions page gives
  its two derived rows. It matters more here than there, because the score
  call is the single most-searched confusion in the sport and it would be
  the easiest thing on this site to assert from memory.

  Snapshot: data/sources/rules/usapickleball-rules-summary.txt.
*/
export const metadata: Metadata = {
  title: 'Pickleball Scoring: How to Keep Score in Singles and Doubles',
  description:
    'Only the serving side scores. Games go to 11, win by 2. What the three numbers mean, which side you serve from, and how rally scoring differs.',
  robots: PAGE_ROBOTS,
  alternates: {canonical: '/pickleball-scoring/'},
}

const SRC = 'https://usapickleball.org/rules/summary/'
const RULEBOOK = 'https://usapickleball.org/rules/'
const CHECKED = '2026-09-09'

/* Quoted verbatim from the rules summary. */
const BASICS = [
  'Points are scored only by the serving team.',
  'Games are normally played to 11 points, win by 2.',
  'Tournament games may be to 15 or 21, win by 2.',
]

const SIDES = [
  'When the serving team’s score is even (0, 2, 4, 6, 8, 10) the player who was the first server in the game for that team will be in the right-side court when serving or receiving; when odd (1, 3, 5, 7, 9) that player will be in the left-side court when serving or receiving.',
  'In singles the server serves from the right-hand court when his or her score is even and from the left when the score is odd.',
]

const SEQUENCE = [
  'Both players on the serving doubles team have the opportunity to serve and score points until they commit a fault (except for the first service sequence of each new game).',
  'At the beginning of each new game only one partner on the serving team has the opportunity to serve before faulting, after which the service passes to the receiving team.',
  'When the first server loses the serve the partner then serves from their correct side of the court.',
  'The second server continues serving until his team commits a fault and loses the serve to the opposing team.',
]

const RALLY = [
  'A point is scored after every rally, regardless of which team is serving. This method rewards success after each point.',
]

const FAQS = [
  {
    q: 'How do you keep score in pickleball?',
    a: 'Only the side that is serving can win a point. When your side wins a rally you add a point and the server moves to the other side of the court. When your side loses a rally you win nothing: the serve passes to your partner, or to the other team. Games are normally played to 11 points and you must win by 2.',
  },
  {
    q: 'What do the three numbers mean in pickleball?',
    a: 'Your team’s score, then the other team’s score, then whether you are the first or second server on your side. So "6-3-2" means your side has 6, theirs has 3, and you are the second of your two servers, so a fault ends your side’s turn. USA Pickleball’s rules summary does not spell this call out, but the first server and second server it describes are what the third number counts.',
  },
  {
    q: 'What score does pickleball go to?',
    a: 'Normally 11 points, win by 2. Tournament games may be played to 15 or 21, also win by 2. At 10-10 in a game to 11 nobody wins until one side leads by two, so games can run well past 11.',
  },
  {
    q: 'Which side do you serve from in pickleball?',
    a: 'It follows your own score. Even score, serve from the right. Odd score, serve from the left. That is true in singles and doubles, and it is a useful check: if you think you are on the wrong side, look at your score rather than trying to remember the last rally.',
  },
  {
    q: 'Why did we not get a point when we won the rally?',
    a: 'Because your side was receiving. In standard pickleball scoring only the serving team can add a point. Winning a rally as the receiving team wins you the serve, not a point. That is the rule newcomers find strangest, and it is why games last longer than the score suggests.',
  },
  {
    q: 'What is rally scoring in pickleball?',
    a: 'A different method, where a point is scored after every rally no matter who served. USA Pickleball describes it as rewarding success after each point. Some leagues and tournament formats use it because it makes games finish in a predictable time. Unless you have been told otherwise, the game you turn up to will use standard scoring, where only the serving side scores.',
  },
]

const jsonLd = JSON.stringify({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {'@type': 'ListItem', position: 1, name: 'Find Pickleball Courts', item: `${ORIGIN}/`},
        {'@type': 'ListItem', position: 2, name: 'Pickleball scoring', item: `${ORIGIN}/pickleball-scoring/`},
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

function Rules({items}: {items: string[]}) {
  return (
    <ul className="ruleset" data-not-prose>
      {items.map(r => <li key={r}>{r}</li>)}
    </ul>
  )
}

/*
  WHICH SIDE YOU SERVE FROM, AS A PICTURE.

  The rule is one sentence and people still get it wrong mid-game, because
  in the moment it is a question about where your feet are rather than
  about a sentence. Two small courts, an even score and an odd one, drawn
  from the same geometry as the other diagrams on the site.
*/
function SidesDiagram() {
  const W = 20
  const L = 22        // one half of the court is enough to show this
  const NVZ = 7
  const M = 3.2
  const half = (label: string, right: boolean, key: string) => (
    <svg
      key={key}
      className="sides-svg"
      viewBox={`${-M} ${-M} ${W + M * 2} ${L + M * 2}`}
      role="img"
      aria-label={`With an ${label} score you serve from the ${right ? 'right' : 'left'} side.`}
    >
      <rect x="0" y="0" width={W} height={L} className="court-surface" />
      <rect
        x={right ? W / 2 : 0}
        y={0}
        width={W / 2}
        height={L - NVZ}
        className="sides-active"
      />
      <line x1={W / 2} y1="0" x2={W / 2} y2={L - NVZ} className="court-line" />
      <line x1="0" y1={L - NVZ} x2={W} y2={L - NVZ} className="court-line" />
      <rect x="0" y={L - NVZ} width={W} height={NVZ} className="court-kitchen" />
      <rect x="0" y="0" width={W} height={L} className="court-edge" />
      <line x1={-1} y1={L} x2={W + 1} y2={L} className="court-net" />
      <circle cx={right ? W * 0.75 : W * 0.25} cy={-1.4} r="1" className="serve-player" />
      <text x={W / 2} y={L + 2.6} className="court-label" textAnchor="middle">{label} score</text>
    </svg>
  )
  return (
    <div className="sides-pair" data-not-prose>
      {half('even', true, 'even')}
      {half('odd', false, 'odd')}
    </div>
  )
}

export default function PickleballScoringPage() {
  return (
    <div className="wrap page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{__html: jsonLd}} />
      <nav aria-label="Breadcrumb" className="crumbs">
        <a href="/">Home</a> › Pickleball scoring
      </nav>

      <h1 data-prose>Pickleball scoring</h1>
      <p className="lede" data-prose>
        Only the serving side can score. Games go to 11 points, win by 2.
        Which side you serve from follows your own score: even from the
        right, odd from the left. Everything below is quoted from USA
        Pickleball, read {CHECKED}, apart from one thing that is clearly
        marked because the source does not state it.
      </p>

      <h2 data-prose>The three rules that decide a game</h2>
      <Rules items={BASICS} />
      <p data-prose>
        The second one catches people out. At 10-10 in a game to 11 nobody
        has won, because you still need to lead by two. Games run past 11
        more often than newcomers expect.
      </p>

      <h2 data-prose>Winning a rally is not the same as winning a point</h2>
      <p data-prose>
        This is the rule that makes pickleball scoring feel strange for a
        week. If your side is receiving and you win the rally, you do not
        get a point. You get the serve. Points only come while you are
        serving, which is why a game can go several rallies without the
        score moving at all.
      </p>

      <h2 data-prose>Which side you serve from</h2>
      <p data-prose>
        Your own score tells you. Even means the right, odd means the left.
        If you lose track mid-game, look at the score rather than trying to
        remember the last rally.
      </p>
      <SidesDiagram />
      <Rules items={SIDES} />

      <h2 data-prose>What the three numbers mean</h2>
      <div className="note is-gap" data-prose>
        <h3>This part is convention, not a quoted rule</h3>
        <p>
          USA Pickleball&rsquo;s rules summary does not spell out the
          three-number call and never writes a score like 0-0-2. What it
          does describe is a first server and a second server on each
          doubles team, and the call below is how players count that. We
          have separated it from the quoted rules for that reason. For
          anything a match turns on, the{' '}
          <a href={RULEBOOK} rel="nofollow">Official Rulebook</a> governs.
        </p>
      </div>
      <p data-prose>
        In doubles the score is called as three numbers. Your team&rsquo;s
        score, then the other team&rsquo;s score, then whether you are the
        first or the second server on your side. So &ldquo;6-3-2&rdquo;
        means your side has six, theirs has three, and you are the second
        server, so a fault gives the serve away rather than passing it to
        your partner.
      </p>
      <p data-prose>
        The rules the third number counts are stated, and they are these:
      </p>
      <Rules items={SEQUENCE} />
      <p data-prose>
        The exception in the second line is why a game opens with a third
        number of 2. The side serving first gets one server rather than
        two, so it is treated as already being on its second.
      </p>

      <h2 data-prose>Scoring in singles</h2>
      <p data-prose>
        Simpler, because there is no server number to track. Only the
        server scores, games still go to 11 and win by 2, and the side you
        serve from still follows your score.
      </p>

      <h2 data-prose>Rally scoring</h2>
      <p data-prose>
        A different method you will meet in some leagues and tournament
        formats. USA Pickleball describes it this way:
      </p>
      <Rules items={RALLY} />
      <p data-prose>
        It makes games finish in a predictable length of time, which is why
        organisers like it. Unless somebody tells you otherwise, the game
        you turn up to will use standard scoring, where only the serving
        side scores.
      </p>

      <p className="provenance" data-not-prose>
        Every quoted rule on this page comes from{' '}
        <a href={SRC} rel="nofollow">USA Pickleball&rsquo;s rules summary</a>,
        read {CHECKED}. The summary is not the whole rulebook. The{' '}
        <a href={RULEBOOK} rel="nofollow">Official Rulebook</a> governs, and
        it is the document to check for anything a match turns on. We quote
        the summary because it is a page we can fetch and re-check, where
        the rulebook is published as an ebook we cannot archive.
      </p>

      <h2 data-prose>Questions people ask</h2>
      {FAQS.map(f => (
        <section key={f.q} data-prose>
          <h3>{f.q}</h3>
          <p>{f.a}</p>
        </section>
      ))}

      <div className="note is-gap" data-prose>
        <h3>The rest of the rules</h3>
        <p>
          Scoring is one part of it. The serve, the two-bounce rule, the
          kitchen and what counts as a fault are on{' '}
          <a href="/pickleball-rules/">the rules page</a>, and the court
          those rules describe is on{' '}
          <a href="/pickleball-court-dimensions/">court dimensions</a>.
          When you want somewhere to play, the{' '}
          <a href="/">directory</a> holds venues whose court counts, lights
          and addresses each carry their source and the date we checked it.
        </p>
      </div>
    </div>
  )
}
