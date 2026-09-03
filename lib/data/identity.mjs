/*
  Identity, applied.

  scripts/identity/audit.mjs decides; this applies. Two effects:

  1. RENAME. A row whose slug carried a numeric row-id suffix takes its
     canonical slug. The imported slug is kept on the record as
     imported_slug so the trail back to data.csv is never lost.

  2. QUARANTINE. A row whose identity is unresolved gets
     identity_quarantine set, and Import Gate I1 in promote.mjs refuses it.

  WHY QUARANTINE IS A GATE AND NOT A FILTER

  A filter is something a caller can forget to apply. Every new script that
  loads venues would have to remember, and the one that forgets publishes a
  duplicated park or a venue in the wrong state - permanently, because §3
  makes URLs immutable at launch. Routing it through I1 instead means the
  refusal happens at the single point every publishable venue must pass.
*/

import {readFileSync, existsSync} from 'node:fs'
import {join} from 'node:path'

export function loadIdentity(repoRoot) {
  const read = name => {
    const p = join(repoRoot, 'data', 'identity', name)
    return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null
  }
  const slugs = read('slugs.json')
  const quar = read('quarantine.json')
  return {
    renames: slugs?.renames ?? {},
    quarantine: quar?.rows ?? {},
  }
}

/**
 * @param {object[]} venues
 * @param {{renames: object, quarantine: object}} identity
 */
export function applyIdentity(venues, identity) {
  let renamed = 0
  let quarantined = 0

  const out = venues.map(v => {
    const rename = identity.renames[v.slug]
    const held = identity.quarantine[v.slug]
    if (!rename && !held) return v

    const next = {...v}
    if (rename) {
      next.imported_slug = v.slug
      next.slug = rename.canonical
      next.slug_basis = rename.basis
      renamed++
    }
    if (held) {
      next.identity_quarantine = held
      quarantined++
    }
    return next
  })

  return {venues: out, renamed, quarantined}
}
