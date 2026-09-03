import type {Metadata, Viewport} from 'next'
import type {ReactNode} from 'react'
import {Newsreader} from 'next/font/google'
import {ORIGIN} from '../lib/site/origin.mjs'
import './globals.css'

/*
  ONE typeface, loaded for headings and figures only.

  next/font self-hosts the file and generates a size-adjusted fallback, so
  there is no third-party request, no FOIT and no metric-mismatch shift —
  which is what the Phase 6 CWV note asked for from any face we did add.
  Body text stays on the system stack: free, instant, and better at small
  sizes than anything we would download for it.

  Newsreader rather than the obvious choice. A directory of verified facts
  should read like a reference work — a gazetteer, an almanac — and a text
  serif with real editorial voice does that. Setting everything in one
  geometric sans is the house style of every generated template on the
  internet, and this product's whole claim is that a person checked things.
*/
const display = Newsreader({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-display',
})
import {navView} from '../lib/site/views.mjs'

/*
  Root layout. Server Component — no 'use client' anywhere in the content
  render path, or Rule 1 / Page Gate 2 breaks.

  THE DEMO BANNER IS GONE, AND ITS REMOVAL WAS OVERDUE

  It read: "DEMONSTRATION BUILD. The venue data is real and sourced from
  Seattle Parks and Recreation. The directory is not published — pages here
  have not passed all six quality gates."

  Written in Phase 3, when the Seattle city page failed Gate 4 and nothing
  could lawfully publish. Its own comment said removing it "is a deliberate
  act that belongs with the commit that makes the page pass" — and then five
  cities passed and nobody removed it. It shipped to a live deployment
  announcing on all 64 pages that the directory was unpublishable, while
  every one of those pages was passing all six gates, and crediting Seattle
  for courts in Charlotte.

  Nothing replaces it. The site being noindex is a deployment decision that
  belongs in robots and metadata, not a banner claiming the pages are unfit.
*/

/*
  CANONICALS AND HREFLANG (Phase 6 deliverable 5).

  metadataBase turns every relative canonical below into an absolute URL, so
  each route declares `alternates: {canonical: '<its own path>'}` and Next
  emits <link rel="canonical">. That is what makes the noindex query
  parameters safe: a crawler that reaches /seattle/?sort=courts is told the
  canonical is /seattle/, so even a parameter URL that escapes robots.txt
  consolidates rather than competing.

  HREFLANG IS SCAFFOLDING AND IS DELIBERATELY INACTIVE. Phase 11 adds /ca/,
  /au/ and /uk/ under the same locked pattern, and the day it does, every
  page needs reciprocal hreflang or the alternates are worse than useless.
  The shape is here and commented; emitting hreflang now — pointing at
  locales that do not exist — would be declaring alternates for pages that
  404, which is the same class of error as linking to an unpublished page.

  O10: the origin comes from lib/site/origin.mjs, which reads SITE_ORIGIN and
  falls back to example.invalid. Setting that one variable now fixes the
  canonical tags, the sitemap AND every URL in the JSON-LD, which was not
  true while four files each defined the origin for themselves.
*/

export const metadata: Metadata = {
  metadataBase: new URL(ORIGIN),
  title: {
    default: 'Deep Pickleball — verified courts, with sources',
    template: '%s | Deep Pickleball',
  },
  description:
    'A US pickleball court directory that shows you where every fact came from and when it was last checked.',
  robots: {index: false, follow: false},
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({children}: {children: ReactNode}) {
  return (
    <html lang="en-US" className={display.variable}>
      <body>
        <header className="site-head">
          <div className="wrap">
            <a className="brand" href="/">
              <span className="dot" aria-hidden="true" />
              Deep Pickleball
            </a>
            {/*
              A <details> disclosure, not a scripted dropdown. Rule 1 says
              every page renders and works with JavaScript off, and Gate 2
              checks it — so the menu has to be HTML that opens by itself.
              <details> also gets keyboard support and the right ARIA for
              free, which a div-and-CSS :hover menu does not, and :hover
              menus are unusable on touch.

              Every link stays in the markup while the menu is shut, so the
              crawl report still sees the whole site three clicks from home.
            */}
            <nav className="site-nav" aria-label="Main">
              <details className="nav-menu">
                <summary>Browse</summary>
                <div className="nav-panel">
                  {navView().groups.map(g => (
                    <section key={g.state}>
                      <h2>
                        {g.href ? <a href={g.href}>{g.label}</a> : g.label}
                      </h2>
                      <ul>
                        {g.cities.map(c => (
                          <li key={c.href}><a href={c.href}>{c.label}</a></li>
                        ))}
                      </ul>
                      <ul className="nav-counties">
                        {g.counties.map(c => (
                          <li key={c.href}><a href={c.href}>{c.label}</a></li>
                        ))}
                      </ul>
                    </section>
                  ))}
                </div>
              </details>
              {navView().links.map(n => (
                <a key={n.href} href={n.href}>{n.label}</a>
              ))}
            </nav>
          </div>
        </header>

        <main>{children}</main>

        <footer className="site-foot">
          <div className="wrap">
            <p>
              <strong>Deep Pickleball.</strong> Every published fact carries a
              source and the date it was checked. Where we have not verified
              something, we say so rather than guessing or printing a zero.
            </p>
            {/*
              This used to read "Court data on this build comes from Seattle
              Parks and Recreation". It was true when Seattle was the only
              city and false on every page of the four that followed — a
              wrong source credit sitting directly under a promise that every
              fact carries its source. The footer no longer names a source at
              all, because the sources differ per page and each page lists
              its own.
            */}
            <p>
              Sources differ by city and are named on every page, beside the
              date each fact was checked.{' '}
              <a href="/how-we-verify/">How we verify</a>.
            </p>
          </div>
        </footer>
      </body>
    </html>
  )
}
