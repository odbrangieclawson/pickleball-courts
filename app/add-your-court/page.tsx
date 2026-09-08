import type {Metadata} from 'next'
import {ORIGIN, PAGE_ROBOTS} from '../../lib/site/origin.mjs'
import {CONTACT_EMAIL, addVenueMailto} from '../../lib/site/contact.mjs'

/*
  The one page an operator is sent to from every claim button, the nav and
  the footer. It answers three questions before anyone writes in: what a
  claim does, what it does not do (rule 11, D7 — in the operator's own
  words, not just ours), and what to put in the email so the first reply is
  not a request for the things we always need.

  Both routes end in a mailto: link rather than a form. Rule 1 wants the
  page to work with JavaScript off, and rule 11 wants a claim to open a
  conversation rather than write to the data; an email does both and needs
  no backend. See lib/site/contact.mjs.
*/
export const metadata: Metadata = {
  title: 'Add or claim your pickleball court',
  description:
    'Claim a pickleball court listing to correct it, or send us a court we are missing. What a claim does, what it does not, and what to send.',
  robots: PAGE_ROBOTS,
  alternates: {canonical: '/add-your-court/'},
}

/* Gate 3: BreadcrumbList on every page, editorial pages included. */
const breadcrumbLd = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {'@type': 'ListItem', position: 1, name: 'Find Pickleball Courts', item: `${ORIGIN}/`},
    {'@type': 'ListItem', position: 2, name: 'Add or claim your court', item: `${ORIGIN}/add-your-court/`},
  ],
})

export default function AddYourCourt() {
  return (
    <div className="wrap page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{__html: breadcrumbLd}} />
      <nav aria-label="Breadcrumb" className="crumbs">
        <a href="/">Home</a> › Add or claim your court
      </nav>

      <h1>Add or claim your pickleball court</h1>
      <p className="lede">
        If you run a court that is on this site, you can claim its listing and
        correct anything on it. If you run one that is not, you can send it to
        us. Both are an email, and both are answered by a person.
      </p>

      <h2>Claim a listing that is already here</h2>
      <p>
        Every venue page has a <strong>Claim this listing</strong> button under
        the photograph. It opens an email to us with the venue and its page
        already filled in. Tell us who you are, how we can confirm you speak
        for the venue, and what you want changed. A reply from an address on
        the venue&rsquo;s own domain, or a phone number that appears on the
        operator&rsquo;s published page, is usually enough to confirm you.
      </p>
      <p>
        Once a claim is confirmed, the listing says so — &ldquo;confirmed by
        the venue&rdquo; with the date — and you have a direct line to us for
        every future change: hours, fees, court counts, a real photograph in
        place of the stand-in.
      </p>

      <h2>What a claim does not do</h2>
      <div className="note is-warn">
        <p>
          <strong>A claim tells us who you are. It is not evidence about the
          courts.</strong> Every fact on this site carries the name of the
          organisation that published it and the date we read it, and a claim
          does not change that. When you send a correction we still ask where
          the new number is published, and a change to a court count is still
          checked against the city&rsquo;s own record before it goes live.
        </p>
        <p>
          A claimed venue gets no ranking, no sorting and no placement
          advantage over an unclaimed one. The moment claiming bought position
          this would be an advertising product rather than a directory, and
          nothing on it could be trusted.
        </p>
      </div>

      <h2>Add a court we do not have</h2>
      <p>
        We publish a court only when we can point at where its facts came
        from. So the most useful thing you can send is a link to the page
        where the operator lists the courts: a parks department page, a club
        page, or the venue&rsquo;s own site. With that we can usually publish
        within a few days. Without it we will ask for it, because a number we
        cannot source does not go on the page.
      </p>
      <p>
        <a className="button" href={addVenueMailto()}>Send us a court</a>
      </p>

      <h2>What to send</h2>
      <p>The email opens with these already laid out. Fill in what you can.</p>
      <ul>
        <li><strong>The venue name and full street address.</strong> We check it against the operator&rsquo;s record, so the exact form matters less than getting the right place.</li>
        <li><strong>How many pickleball courts there are,</strong> and how many are indoor and how many outdoor. Dedicated courts and lined tennis courts both count, but say which.</li>
        <li><strong>Where that is published.</strong> A link. This is the one thing we cannot do without.</li>
        <li><strong>Lights, fees and hours,</strong> if the operator publishes them. If they do not, say so rather than guessing; the page will read &ldquo;not verified yet&rdquo; for those, which is the truth.</li>
        <li><strong>Who you are,</strong> and your connection to the venue if you have one.</li>
      </ul>

      <h2>Corrections from players</h2>
      <p>
        You do not need to run a court to fix it. Every venue page has a
        <strong> Send a correction</strong> link at the foot of the page, and
        it reaches the same queue. A correction needs the same two things as
        everything else here: where the right answer is published, and when
        you last saw it that way.
      </p>

      <h2>Reaching us any other way</h2>
      <p>
        The buttons above open your email program. If that does not work
        where you are, write to <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>{' '}
        and start the subject with <em>Claim</em>, <em>Correction</em> or{' '}
        <em>New venue</em> so it lands in the right pile.
      </p>
    </div>
  )
}
