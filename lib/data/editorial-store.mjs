/*
  Editorial notes, loaded from data/editorial/.

  lib/page/editorial.mjs is deliberate that the four slots are INPUTS, not
  outputs — nothing generates them, because a parking note is a claim about a
  real place and inventing one is fabricating a fact. This module is where
  the written input enters the build.

  WHAT A NOTE HAS TO CARRY

  A note is prose, so Rule 7 applies to it exactly as it applies to a court
  count: every claim needs a source and a date. A note file therefore holds
  its `sources` alongside the slots, each source saying which slots it
  supports, and the city page renders them. A note with no source is refused
  here rather than being allowed to reach a page, because unsourced prose is
  the easiest place on the site to smuggle in a fact nobody checked.
*/

import {readFileSync, readdirSync, existsSync} from 'node:fs'
import {join} from 'node:path'
import {EDITORIAL_SLOTS} from '../page/editorial.mjs'

const key = (city, state) =>
  `${String(state).toUpperCase()}/${String(city).toLowerCase().replace(/\s+/g, '-')}`

export function loadEditorial(repoRoot) {
  const dir = join(repoRoot, 'data', 'editorial')
  const byCity = new Map()
  if (!existsSync(dir)) return {byCity}

  for (const f of readdirSync(dir).filter(n => n.endsWith('.json')).sort()) {
    const doc = JSON.parse(readFileSync(join(dir, f), 'utf8'))
    if (!doc.city || !doc.state) throw new Error(`${f}: editorial file needs city and state`)

    const sources = doc.sources ?? []
    if (sources.length === 0) {
      throw new Error(`${f}: editorial notes carry claims about a real place and need at least one source (Rule 7)`)
    }
    for (const s of sources) {
      if (!s.url || !s.retrieved) throw new Error(`${f}: source ${s.id ?? '?'} needs a url and a retrieved date`)
    }

    /* Every filled slot must be supported by at least one source. */
    const supported = new Set(sources.flatMap(s => s.supports ?? []))
    for (const slot of EDITORIAL_SLOTS) {
      const text = doc.slots?.[slot.key]
      if (text && String(text).trim() && !supported.has(slot.key)) {
        throw new Error(`${f}: slot "${slot.key}" is written but no source claims to support it (Rule 7)`)
      }
    }

    byCity.set(key(doc.city, doc.state), {
      slots: doc.slots ?? {},
      sources,
      date_checked: doc.date_checked ?? null,
      written_by: doc.written_by ?? null,
      file: f,
    })
  }
  return {byCity}
}

/** The plain slot map lib/page/editorial.mjs expects, or null. */
export function editorialFor(byCity, city, state) {
  return byCity.get(key(city, state)) ?? null
}
