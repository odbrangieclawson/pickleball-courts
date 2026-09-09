/*
  Phase 2 deliverable 1: the schema implementation.

  The JSON Schemas in data/schemas/ are the single source of truth. This
  module loads and compiles them rather than restating the field list in a
  second place, because a data model written down twice is a data model that
  disagrees with itself within a month.

  Covers venue, city, county, state and gear item, including the claim
  fields (claimed_by_owner, claim_date) and the provenance fields
  (source_url, date_checked, verified_by, status).
*/

import {readFileSync} from 'node:fs'
import {fileURLToPath} from 'node:url'
import {dirname, join} from 'node:path'
import Ajv from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'

const HERE = dirname(fileURLToPath(import.meta.url))
export const REPO_ROOT = join(HERE, '..', '..')
const SCHEMA_DIR = join(REPO_ROOT, 'data', 'schemas')

export const ENTITIES = ['venue', 'city', 'county', 'state', 'gear-item']

/*
  LOADED ON FIRST USE, NOT ON IMPORT.

  This used to read and compile all five schemas at module scope. That is
  fine everywhere the module is used — the validation scripts, the tests
  and every prerendered page, all of which run with the repository on disk.

  It broke the one place it could: /search/ is the only route rendered on
  demand, and its import graph reaches here through counts.mjs, which wants
  isVerified() and isTrue() and nothing else. Next traces the files a
  function needs, and data/schemas/*.json is read through a path built at
  runtime from import.meta.url, so the tracer never saw it and never
  shipped it. In production every request died with

      ENOENT ... open '/var/task/data/schemas/venue.schema.json'
      at module evaluation

  before any handler ran — which is why the route's own try/catch could not
  catch it and served Next's generic 500 instead.

  Nothing in the request path needs a schema. The predicates below are pure
  and the validators exist for scripts/validate-data.mjs and the tests. So
  the read happens when a validator is actually asked for, and the search
  function never touches these files at all.
*/
let compiled = null
function compile() {
  if (compiled) return compiled
  const ajv = new Ajv({allErrors: true, strict: false})
  addFormats(ajv)
  const schemas = {}
  const validators = {}
  for (const e of ENTITIES) {
    schemas[e] = JSON.parse(readFileSync(join(SCHEMA_DIR, `${e}.schema.json`), 'utf8'))
    validators[e] = ajv.compile(schemas[e])
  }
  compiled = {schemas, validators}
  return compiled
}

/** The parsed schemas. Reads from disk on first call. */
export const schemas = () => compile().schemas

/**
 * @typedef {'pending'|'verified'|'rejected'} Status
 * @typedef {'municipal_source'|'owner_submission'|'staff_check'|'user_report'} VerifiedBy
 */

/**
 * Validate one record against its entity schema.
 * @returns {{valid: boolean, errors: string[]}}
 */
export function validateEntity(entity, record) {
  const v = compile().validators[entity]
  if (!v) throw new Error(`No schema for entity "${entity}"`)
  const valid = v(record)
  return {
    valid,
    errors: valid ? [] : v.errors.map(e => `${e.instancePath || '(root)'} ${e.message}`),
  }
}

/* ------------------------------------------------------------------ */
/* THE VERIFICATION PREDICATE                                          */
/* ------------------------------------------------------------------ */

/*
  isVerified() is the gate every count depends on, so it lives here, is
  exported once, and is used everywhere. There is no second definition of
  "verified" anywhere in the codebase.

  Rule 12: a row is verified only with a verified address, a verified court
  count, a source_url and a date_checked.

  Rule 11: CLAIMED IS NOT VERIFIED. claimed_by_owner is deliberately not
  consulted here. A venue whose owner has claimed it, with no source, is
  exactly as unverified as one nobody has touched. That is asserted by test.
*/
export function isVerified(v) {
  if (!v) return false
  if (v.status !== 'verified') return false
  if (!v.source_url) return false
  if (/courtsource\.us/i.test(v.source_url)) return false // a competitor is not a source
  if (!v.date_checked) return false
  if (!v.verified_by) return false
  if (!v.street_address) return false
  if (v.total_courts === null || v.total_courts === undefined) return false
  return true
}

/** Why a venue is not verified. For dashboards and error reports. */
export function unverifiedReasons(v) {
  const r = []
  if (!v) return ['no record']
  if (v.status !== 'verified') r.push(`status is "${v.status}", not "verified"`)
  if (!v.source_url) r.push('no source_url')
  else if (/courtsource\.us/i.test(v.source_url)) r.push('source_url points to a competitor directory')
  if (!v.date_checked) r.push('no date_checked')
  if (!v.verified_by) r.push('no verified_by')
  if (!v.street_address) r.push('no verified street_address')
  if (v.total_courts === null || v.total_courts === undefined) r.push('no verified court count')
  return r
}

/* ------------------------------------------------------------------ */
/* TRI-STATE HELPERS                                                   */
/* ------------------------------------------------------------------ */

export const TRI_STATE_FIELDS = Object.freeze([
  'light', 'restroom', 'pro_shop', 'climate_control', 'covered', 'nets_provided',
])

/**
 * Rule 6: null is not false. These helpers exist so no call site is tempted
 * to write `if (v.light)`, which silently treats "nobody checked" as "no
 * lights".
 */
export const isTrue = v => v === true
export const isFalse = v => v === false
export const isUnknown = v => v === null || v === undefined
