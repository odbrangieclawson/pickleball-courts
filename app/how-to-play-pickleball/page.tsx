import type {Metadata} from 'next'
import {ORIGIN, PAGE_ROBOTS} from '../../lib/site/origin.mjs'

/*
  THE GUIDE PAGE.

  The directory answers "where can I play". This answers "what is this game
  and how do I get better at it", which is what most people search before
  they ever look for a court.

  KEYWORDS. The owner asked to target "pickleball", which Ahrefs puts at
  640,000 US searches a month. That head term is not winnable and is not
  what this page is for: its results are the governing body and an
  encyclopaedia, and the intent behind it is not "find a court". The
  winnable cluster underneath it is, with US volume and difficulty:

    pickleball rules              41,000   KD 7
    how to play pickleball        23,000   KD 0
    what is pickleball            16,000   KD 4
    pickleball for beginners       1,100   KD 2
    pickleball tips                  900   KD 0

  So the URL is /how-to-play-pickleball/ and the page covers what the game
  is, the rules a beginner actually needs, and how to get better. The word
  pickleball carries through the title and headings without pretending the
  head term is the target.

  SOURCING. This is the one page on the site that is not about a venue, so
  it has no verified record behind it. The rules are not ours to assert: the
  page states them and points at the official rulebook, which is the same
  discipline the rest of the site follows. The tips are advice and are
  written as advice, never as fact. No growth statistics appear anywhere,
  because the ones in circulation trace back to reports this project has not
  read.

  NOT A COACHING PRODUCT. Three competitors sell coaching. This page gives
  the advice away and sends the reader to a court, which is what a directory
  is for.
*/
export const metadata: Metadata = {
  title: 'How to Play Pickleball: Rules, Scoring and Tips',
  description:
    'What pickleball is, the rules you need on your first day, and the habits that make you better. Written for beginners, with the official rulebook linked.',
  robots: PAGE_ROBOTS,
  alternates: {canonical: '/how-to-play-pickleball/'},
}

const FAQS = [
  {
    q: 'Is pickleball easy to learn?',
    a: 'The basics take about ten minutes. The court is small, the ball is slow, and the underhand serve is easy to make. Playing well takes far longer, because the game rewards patience and placement over power, which is the opposite of what most newcomers try first.',
  },
  {
    q: 'What do I need to bring?',
    a: 'A paddle and shoes you can move sideways in. Balls are usually shared. Whether nets are provided depends on the venue, and many public courts expect you to bring a portable net, so check the venue page before you go.',
  },
  {
    q: 'What is the kitchen in pickleball?',
    a: 'The non-volley zone, a seven-foot strip on both sides of the net. You may stand in it, but you may not volley the ball while any part of you is touching it. Almost every beginner fault happens here.',
  },
  {
    q: 'Can I play pickleball on a tennis court?',
    a: 'Yes, and most public pickleball in the United States happens on tennis courts with pickleball lines painted on them. A portable net sets the height. Many venues in this directory are exactly that arrangement, and each venue page says whether its courts are dedicated or shared.',
  },
]

const jsonLd = JSON.stringify({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {'@type': 'ListItem', position: 1, name: 'Find Pickleball Courts', item: `${ORIGIN}/`},
        {'@type': 'ListItem', position: 2, name: 'How to play pickleball', item: `${ORIGIN}/how-to-play-pickleball/`},
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

export default function HowToPlayPickleball() {
  return (
    <div className="wrap page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{__html: jsonLd}} />
      <nav aria-label="Breadcrumb" className="crumbs">
        <a href="/">Home</a> › How to play pickleball
      </nav>

      <h1>How to play pickleball</h1>
      <p className="lede">
        Pickleball is a paddle sport played on a badminton-sized court with a
        perforated plastic ball and a solid paddle. The rules take ten minutes
        to learn. Here is what the game is, what you need to know on your
        first day, and the handful of habits that separate people who have
        played twice from people who have played for a season.
      </p>

      <h2>What pickleball is</h2>
      <p>
        Two or four players hit a plastic ball over a net that is 36 inches
        high at the sidelines and 34 inches at the centre. The court is 20
        feet wide and 44 feet long, the same as a doubles badminton court, and
        about a quarter the playing area of a tennis court. Most games are
        doubles. The ball travels slowly enough that rallies are long and
        points are usually won by placing the ball where an opponent is not,
        rather than by hitting it hard.
      </p>
      <p>
        That small court is the reason the sport spread the way it did. Four
        people can share a space that would hold one tennis singles match, and
        a beginner can return a serve on their first attempt, which is not
        true of most racquet sports.
      </p>

      <h2>The rules you need on day one</h2>
      <p>
        These are the rules that come up in the first game. The complete set
        is published by USA Pickleball, and where this page and the rulebook
        ever disagree, the rulebook is right.
      </p>
      <ul>
        <li><strong>The serve is underhand.</strong> You must strike the ball below your waist with an upward motion, hit it diagonally into the opposite service court, and clear the non-volley zone. You get one attempt, not two.</li>
        <li><strong>The ball must bounce twice before anyone volleys.</strong> The return of serve must bounce, and the serving side&rsquo;s next shot must bounce too. Only after those two bounces may anyone hit the ball out of the air. This is the two-bounce rule, and it is the one beginners forget.</li>
        <li><strong>You cannot volley from the kitchen.</strong> The non-volley zone runs seven feet back from the net on both sides. Standing in it is legal; hitting the ball out of the air while any part of you touches it is not, including the line itself.</li>
        <li><strong>Only the serving side scores.</strong> Games go to 11 points and you must win by two. In doubles the score is called as three numbers: your score, their score, and whether you are the first or second server.</li>
        <li><strong>The usual faults.</strong> Hitting the ball out, into the net, volleying from the kitchen, or breaking the two-bounce rule. A fault by the serving side ends its serve; a fault by the receiving side gives the servers a point.</li>
      </ul>
      <p className="provenance" data-not-prose>
        Rules as published by{' '}
        <a href="https://usapickleball.org/what-is-pickleball/official-rules/" rel="nofollow">
          USA Pickleball, official rulebook
        </a>. This page summarises; it does not replace it.
      </p>

      <h2>How to get better</h2>
      <p>
        This is advice rather than fact, and it is the advice most players
        wish they had been given earlier. None of it needs a coach.
      </p>
      <ul>
        <li><strong>Get to the kitchen line and stay there.</strong> The team standing at the non-volley line wins most points at every level. Move up as soon as the two-bounce rule allows, and move up together with your partner.</li>
        <li><strong>Stop hitting hard.</strong> The instinct from tennis is to drive the ball. On a court this small, a hard shot comes back faster than you can recover. A soft ball that lands in the kitchen buys you the time to move forward.</li>
        <li><strong>Learn to dink.</strong> A dink is a soft shot that drops into the opponent&rsquo;s kitchen. Rallies at the net are won by whoever loses patience last. Practising twenty dinks in a row is dull and it is the single fastest way to improve.</li>
        <li><strong>Serve deep, return deep.</strong> A deep serve keeps the receiver back. A deep return keeps the servers back and buys you time to reach the net first, which is the whole point of the return.</li>
        <li><strong>Do not stand in the middle.</strong> The area between the baseline and the kitchen line is where balls land at your feet. Be at one end or the other, not in transit.</li>
        <li><strong>Keep the paddle up and in front.</strong> Ready position is paddle at chest height, pointing forward. Most missed volleys are not reaction speed, they are a paddle that started by someone&rsquo;s knees.</li>
        <li><strong>Call the ball in doubles.</strong> Say &ldquo;mine&rdquo;, &ldquo;yours&rdquo;, &ldquo;bounce it&rdquo; or &ldquo;out&rdquo;. Two players who talk beat two better players who do not.</li>
        <li><strong>Play people who beat you.</strong> Open play at a public court will put you in games above your level. That is the point. Losing to better players teaches faster than winning against beginners.</li>
      </ul>

      <h2>What beginners get wrong</h2>
      <p>
        Three mistakes account for most lost points in a first month. Smashing
        every ball that sits up, which sends it long. Stepping into the
        kitchen to volley, which is a fault however good the shot was. And
        standing at the baseline all game, which hands the net to the other
        team and with it the rally.
      </p>

      <h2>Questions people ask</h2>
      {FAQS.map(f => (
        <section key={f.q}>
          <h3>{f.q}</h3>
          <p>{f.a}</p>
        </section>
      ))}

      <h2>Now go and play</h2>
      <p>
        Reading about pickleball has a short useful life. Every court in this
        directory has been checked against the operator&rsquo;s own record, so
        you can see the court count, whether there are lights, whether nets are
        provided and what it costs before you drive anywhere.{' '}
        <a href="/">Find a court near you</a>, or browse by state from the menu
        at the top of any page.
      </p>
    </div>
  )
}
