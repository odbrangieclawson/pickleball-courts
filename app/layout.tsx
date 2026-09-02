import type {Metadata, Viewport} from 'next'
import type {ReactNode} from 'react'

/*
  Root layout. Server Component by default — no 'use client' anywhere in the
  render path for content, or Rule 1 / Page Gate 2 breaks.

  No stylesheet is imported yet. Phase 0 constraint: no CSS framework
  decisions. See decisions.md > "Open decisions".
*/

export const metadata: Metadata = {
  // Per-page titles supply the segment. Title format is not settled yet.
  title: {
    default: 'Deep Pickleball',
    template: '%s | Deep Pickleball',
  },
  description:
    'A US pickleball court directory that shows you where every fact came from and when it was last checked.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({children}: {children: ReactNode}) {
  return (
    <html lang="en-US">
      <body>{children}</body>
    </html>
  )
}
