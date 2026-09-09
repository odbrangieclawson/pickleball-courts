import type {Metadata} from 'next'
import {ORIGIN, PAGE_ROBOTS} from '../../lib/site/origin.mjs'
import {CONTACT_EMAIL} from '../../lib/site/contact.mjs'

/*
  PRIVACY POLICY.

  WRITTEN FROM AN AUDIT, NOT FROM A TEMPLATE. Everything asserted here was
  checked against the built site on 2026-09-09 before a word of it was
  written, because a privacy policy that describes collection the site does
  not do is worse than no policy at all: it is a false statement about your
  own conduct, and it is the first thing a regulator or a reader will test.

  What the audit found:

    Set-Cookie headers on / , a city page, a venue page and /search/   none
    analytics or tracking packages in package.json                     none
    third-party <script>, <img>, <iframe> or stylesheet                none
    localStorage / sessionStorage / IndexedDB in shipped JS            none
    fonts                                    self-hosted, /_next/static/media
    google.com references                    30, all <a>, none loaded

  The google.com references are the "Get directions" links. An anchor loads
  nothing until somebody clicks it, which is why they belong in the section
  about leaving the site rather than the section about what we collect.

  RE-AUDITED 2026-09-09, WHEN THE SEARCH BOX LEARNED WHERE YOU ARE. The
  geolocation line above used to read "none" alongside the storage line and
  it no longer can: public/search-suggest.js calls the Geolocation API when
  somebody presses a button asking it to. Everything else in the audit is
  unchanged, and deliberately so —

    device storage of any kind                still none
    third-party requests                      still none
    what /api/where/ stores                   nothing
    where precise coordinates are sent        nowhere; ranked in the page

  The two-tier design is what keeps the rest of this page true. The coarse
  tier reads the city Vercel has already derived from the IP address it was
  logging anyway, so it collects nothing new. The precise tier never leaves
  the browser, so there is no server-side record of it to describe. And the
  permission state is read back from the browser rather than remembered
  here, which is why the storage line still says none.

  The section below says all of that in words a reader can check.

  THE COOKIE POLICY IS THIS PAGE. There is no separate cookie policy
  because there are no cookies to have a policy about. A page that existed
  only to say "we set none" would be padding, and the honest version is one
  section here. If analytics or advertising are ever added, that section is
  the first thing that has to change, and a consent banner becomes
  necessary at the same moment.

  NOT LEGAL ADVICE. This describes accurately what the software does, which
  is the part that can be verified. Whether that satisfies a particular
  jurisdiction is a question for a lawyer, and the page says so.
*/
export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'What this site collects, which is almost nothing: no cookies, no analytics, no third-party trackers. What the host logs, and what happens when you email us.',
  robots: PAGE_ROBOTS,
  alternates: {canonical: '/privacy/'},
}

const UPDATED = '9 September 2026'

const jsonLd = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {'@type': 'ListItem', position: 1, name: 'Find Pickleball Courts', item: `${ORIGIN}/`},
    {'@type': 'ListItem', position: 2, name: 'Privacy policy', item: `${ORIGIN}/privacy/`},
  ],
})

export default function PrivacyPage() {
  return (
    <div className="wrap page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{__html: jsonLd}} />
      <nav aria-label="Breadcrumb" className="crumbs">
        <a href="/">Home</a> › Privacy policy
      </nav>

      <h1 data-prose>Privacy policy</h1>
      <p className="lede" data-prose>
        Last updated {UPDATED}. This site sets no cookies, runs no
        analytics, and loads nothing from anybody else&rsquo;s servers. The
        short version is that we do not know who you are and have not built
        anything that could find out.
      </p>

      <h2 data-prose>What we collect</h2>
      <p data-prose>
        Nothing that identifies you, through the site itself. There is no
        account to create, no form that stores anything, and no tracking
        code of any kind.
      </p>

      <h2 data-prose>Cookies</h2>
      <p data-prose>
        This site sets none. Not for analytics, not for advertising, not for
        preferences. We checked the responses for the home page, a city
        page, a venue page and the search page on {UPDATED} and none of them
        sets a cookie. That is why you are not being asked to accept
        anything: there is nothing to accept.
      </p>
      <p data-prose>
        There is no separate cookie policy because there are no cookies to
        have a policy about. If that ever changes, this section changes with
        it, and you would be asked before anything non-essential was set.
      </p>

      <h2 data-prose>No third-party trackers, and no third-party anything</h2>
      <p data-prose>
        Every script, image, stylesheet and font on these pages is served
        from this site. That includes the map tiles: the maps are built from
        images we host ourselves rather than loaded from a tile service, so
        looking at a map here does not tell any mapping company that you
        did. There is no Google Analytics, no advertising network, no social
        media widget and no embedded video.
      </p>

      <h2 data-prose>Location, and the search box</h2>
      <p data-prose>
        Tapping the search field offers you courts near where you are. There
        are two ways it can know that, and they are worth separating.
      </p>
      <p data-prose>
        <strong>Without asking you anything</strong>, it uses the town our
        host reads from your IP address. Vercel works that out from a
        request it is already handling, so nothing new is collected about
        you and nothing is written down; the page asks for a town, gets one,
        and forgets. Distances measured from it say &ldquo;about&rdquo;,
        because they are measured from a town rather than from you.
      </p>
      <p data-prose>
        <strong>Only if you press the button</strong> that says so does your
        browser ask whether you want to share your exact position, and you
        can say no. If you say yes, <em>that position is never sent to this
        site.</em> The list of courts is downloaded to your browser and the
        distances are worked out there, on your device. There is no address
        on this site that accepts a location, so there is nothing here that
        could receive, log or leak one.
      </p>
      <p data-prose>
        We do not remember your answer, because we do not have to: your
        browser already does, and we ask it. That is why the search box can
        show you nearby courts on a later visit without asking again, and
        also why nothing about you is stored on your device by us. If you
        want to withdraw the permission, it lives in your browser&rsquo;s
        site settings, not in ours.
      </p>
      <p data-prose>
        None of this is required to use the site. With JavaScript disabled
        the search box is an ordinary form that sends what you type to the
        search page, and every one of these pages renders in full without
        it.
      </p>

      <h2 data-prose>What the host records</h2>
      <p data-prose>
        The site runs on Vercel, which serves the pages. Like any web host,
        Vercel processes the requests it serves, and its logs can include an
        IP address, the page requested, the time and a browser user-agent
        string. We do not use those logs to build a profile of anybody and
        we have no way to connect them to a person. If your searches matter
        to you, note that a search term travels in the address of the search
        page and can therefore appear in a server log.
      </p>
      <p data-prose>
        Vercel is the processor for that data and handles it under its own
        terms.
      </p>

      <h2 data-prose>When you email us</h2>
      <p data-prose>
        The claim, correction and add-a-court links on this site open your
        own email program. Nothing is submitted through a form and nothing
        is stored here before you press send. When you do send one we
        receive your email address and whatever you wrote, and we keep it
        for as long as it takes to deal with the correction and to have a
        record of why a published fact changed. We do not add you to
        anything or pass it on.
      </p>
      <p data-prose>
        You can ask what we hold about you, ask for it to be corrected, or
        ask for it to be deleted, by writing to{' '}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>

      <h2 data-prose>Leaving the site</h2>
      <p data-prose>
        Two kinds of link take you elsewhere. Every venue page links to the
        source it took its facts from, which is usually a parks department.
        The Get directions button opens Google Maps. Nothing is loaded from
        either until you click, and once you arrive you are on their site
        under their privacy policy rather than ours.
      </p>

      <h2 data-prose>Children</h2>
      <p data-prose>
        This site is a directory of public places to play a sport. It is not
        aimed at children and it collects nothing from anybody, so it
        collects nothing from them either.
      </p>

      <h2 data-prose>Changes</h2>
      <p data-prose>
        If this policy changes, the date at the top changes with it. The
        changes that would matter most are adding analytics, advertising or
        any third-party script, and each of those would mean rewriting the
        cookies section above rather than quietly amending a sentence.
      </p>

      <div className="note is-gap" data-prose>
        <h3>What this page is, and is not</h3>
        <p>
          It is an accurate description of what the software does, checked
          against the built site rather than written from a template. It is
          not legal advice, and nobody here is a lawyer. If you need to be
          certain this satisfies a particular law in a particular place,
          have a solicitor read it. The facts in it should stand up, which
          is the part that is usually hardest to get right.
        </p>
      </div>

      <p data-prose>
        Questions about any of this go to{' '}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. The{' '}
        <a href="/terms/">terms of use</a> cover what you may do with what
        is published here.
      </p>
    </div>
  )
}
