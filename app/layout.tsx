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

  THE DEMO BANNER

  This build is a local demonstration. Every venue fact in it is real and
  sourced from Seattle Parks and Recreation, but the city page does not yet
  pass Page Gate 4, so under the project's own rules it is not publishable.
  The banner says so on every page. Removing it is a deliberate act that
  belongs with the commit that makes the page pass.
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
        <div className="demo-banner" role="alert">
          <strong>DEMONSTRATION BUILD.</strong> The venue data is real and sourced
          from Seattle Parks and Recreation. The directory is not published —
          pages here have not passed all six quality gates.
        </div>

        <header className="site-head">
          <div className="wrap">
            <a className="brand" href="/">
              <span className="dot" aria-hidden="true" />
              Deep Pickleball
            </a>
            <nav className="site-nav" aria-label="Main">
              {navView().map(n => (
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
            <p>
              Court data on this build comes from Seattle Parks and Recreation
              open data, retrieved 3 September 2026.
            </p>
          </div>
        </footer>
      </body>
    </html>
  )
}
