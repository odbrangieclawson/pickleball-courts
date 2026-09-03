import type {Metadata, Viewport} from 'next'
import type {ReactNode} from 'react'
import './globals.css'
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

export const metadata: Metadata = {
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
    <html lang="en-US">
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
