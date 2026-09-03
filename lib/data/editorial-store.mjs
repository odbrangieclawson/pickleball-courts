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
import {EDITORIAL_SLOTS, COUNTY_SLOTS} from '../page/editorial.mjs'

export const filterKey = (city, state, filter) =>
  `${String(state).toUpperCase()}/${String(city).toLowerCase().replace(/\s+/g, '-')}/filter:${filter}`

export const countyKey = (county, state) =>
  `${String(state).toUpperCase()}/county:${String(county).toLowerCase()}`

const key = (city, state) =>
  `${String(state).toUpperCase()}/${String(city).toLowerCase().replace(/\s+/g, '-')}`

export function loadEditorial(repoRoot) {
  const dir = join(repoRoot, 'data', 'editorial')
  const byCity = new Map()
  const byVenue = new Map()
  const byFilter = new Map()
  if (!existsSync(dir)) return {byCity, byVenue, byFilter}

  for (const f of readdirSync(dir).filter(n => n.endsWith('.json')).sort()) {
    const doc = JSON.parse(readFileSync(join(dir, f), 'utf8'))

    /*
      A venues file holds notes for many venues in one city, each keyed by
      slug, sharing one source list. Sources are declared once and referenced
      by id per venue, so a note cannot cite a source the file does not have.
    */
    if (doc.kind === 'filters') {
      const byId = new Map((doc.sources ?? []).map(x => [x.id, x]))
      if (byId.size === 0) throw new Error(`${f}: filter notes need at least one source (Rule 7)`)
      for (const [name, entry] of Object.entries(doc.filters ?? {})) {
        const ids = entry.sources ?? []
        if (ids.length === 0) throw new Error(`${f}: filter "${name}" has notes but cites no source (Rule 7)`)
        for (const id of ids) {
          if (!byId.has(id)) throw new Error(`${f}: filter "${name}" cites source "${id}", which the file does not declare`)
        }
        byFilter.set(filterKey(doc.city, doc.state, name), {
          slots: entry.slots ?? {},
          faqs: entry.faqs ?? [],
          sources: ids.map(id => byId.get(id)),
          date_checked: doc.date_checked ?? null,
          file: f,
        })
      }
      continue
    }

    if (doc.kind === 'venues') {
      const byId = new Map((doc.sources ?? []).map(s => [s.id, s]))
      if (byId.size === 0) throw new Error(`${f}: venue notes need at least one source (Rule 7)`)
      for (const [slug, entry] of Object.entries(doc.venues ?? {})) {
        const ids = entry.sources ?? []
        if (ids.length === 0) throw new Error(`${f}: venue "${slug}" has notes but cites no source (Rule 7)`)
        for (const id of ids) {
          if (!byId.has(id)) throw new Error(`${f}: venue "${slug}" cites source "${id}", which the file does not declare`)
        }
        byVenue.set(slug, {
          slots: entry.slots ?? {},
          faqs: entry.faqs ?? [],
          sources: ids.map(id => byId.get(id)),
          date_checked: doc.date_checked ?? null,
          file: f,
        })
      }
      continue
    }

    const isCounty = !!doc.county
    if (!isCounty && (!doc.city || !doc.state)) throw new Error(`${f}: editorial file needs city and state`)
    if (isCounty && !doc.state) throw new Error(`${f}: county editorial needs a state`)

    const sources = doc.sources ?? []
    if (sources.length === 0) {
      throw new Error(`${f}: editorial notes carry claims about a real place and need at least one source (Rule 7)`)
    }
    for (const s of sources) {
      if (!s.url || !s.retrieved) throw new Error(`${f}: source ${s.id ?? '?'} needs a url and a retrieved date`)
    }

    /* Every filled slot must be supported by at least one source. */
    const supported = new Set(sources.flatMap(s => s.supports ?? []))
    for (const slot of (isCounty ? COUNTY_SLOTS : EDITORIAL_SLOTS)) {
      const text = doc.slots?.[slot.key]
      if (text && String(text).trim() && !supported.has(slot.key)) {
        throw new Error(`${f}: slot "${slot.key}" is written but no source claims to support it (Rule 7)`)
      }
    }

    byCity.set(isCounty ? countyKey(doc.county, doc.state) : key(doc.city, doc.state), {
      slots: doc.slots ?? {},
      bestFor: doc.best_for ?? [],
      faqs: doc.faqs ?? [],
      sources,
      date_checked: doc.date_checked ?? null,
      written_by: doc.written_by ?? null,
      file: f,
    })
  }
  return {byCity, byVenue, byFilter}
}

/** The plain slot map lib/page/editorial.mjs expects, or null. */
export function editorialFor(byCity, city, state) {
  return byCity.get(key(city, state)) ?? null
}

export function editorialForCounty(byCity, county, state) {
  return byCity.get(countyKey(county, state)) ?? null
}

/** Filter notes, or null. */
export function editorialForFilter(byFilter, city, state, filter) {
  return byFilter.get(filterKey(city, state, filter)) ?? null
}

/** Venue notes by slug, or null. */
export function editorialForVenue(byVenue, slug) {
  return byVenue.get(slug) ?? null
}
