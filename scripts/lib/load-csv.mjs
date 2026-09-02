/*
  Shared loader for the source dataset.

  Everything in scripts/import/ reads through here so that every report is
  looking at exactly the same parse of the same bytes. Hand-rolled comma
  splitting misaligns on quoted fields containing commas - this dataset has
  many, in pricing_notes and hours - so a real parser is not optional.

  Nothing in this file infers, fills or cleans. It returns the source rows as
  strings, with only two normalisations, both lossless:
    - the UTF-8 BOM is stripped from the first header name
    - surrounding whitespace is trimmed from values

  Blank-vs-null is preserved as the empty string here and only becomes null
  in the mapper, where the decision is documented.
*/

import {readFileSync} from 'node:fs'
import {fileURLToPath} from 'node:url'
import {dirname, join} from 'node:path'
import {parse} from 'csv-parse/sync'

export const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
export const CSV_PATH = join(REPO_ROOT, 'data.csv')

/** The 37 columns actually present in data.csv, in file order. */
export const SOURCE_COLUMNS = [
  'slug',
  'name',
  'city',
  'state',
  'postal_code',
  'street_address',
  'total_courts',
  'indoor_courts',
  'outdoor_courts',
  'surface',
  'access_type',
  'is_free',
  'drop_in_fee_usd',
  'membership_from_usd',
  'pricing_notes',
  'pricing_details',
  'rating',
  'lighted',
  'restrooms',
  'pro_shop',
  'climate_controlled',
  'covered',
  'amenities',
  'website',
  'latitude',
  'longitude',
  'phone',
  'hours',
  'venue_type',
  'parking',
  'level_of_play',
  'court_availability',
  'user_rating',
  'review_count',
  'claimed',
  'sport',
  'source_url',
]

export function loadRows(csvPath = CSV_PATH) {
  const raw = readFileSync(csvPath, 'utf8')
  const rows = parse(raw, {
    columns: header => header.map(h => h.replace(/^﻿/, '').trim()),
    skip_empty_lines: true,
    relax_column_count: true,
    trim: true,
    bom: true,
  })
  return rows
}

/** Header as it appears in the file, BOM stripped. */
export function loadHeader(csvPath = CSV_PATH) {
  const first = readFileSync(csvPath, 'utf8').split(/\r?\n/, 1)[0]
  return first.replace(/^﻿/, '').split(',').map(h => h.trim())
}

/**
 * Treat a source cell as absent. The dataset uses several spellings of
 * "nothing here" and they must all become null rather than surviving as
 * strings that later look like real values.
 *
 * NOTE: '0' is NOT in this list. A zero may be a real measurement. Detecting
 * zero-filled nulls is a REPORTING job (quality-report.mjs), never a silent
 * cleaning job - Rule 6 forbids inventing, and it equally forbids deleting a
 * value because it looks suspicious.
 */
const ABSENT = new Set(['', 'null', 'NULL', 'None', 'none', 'N/A', 'n/a', 'NA', '-', 'undefined'])

export const isAbsent = v => v === undefined || v === null || ABSENT.has(String(v).trim())

export const asString = v => (isAbsent(v) ? null : String(v).trim())

export const asNumber = v => {
  if (isAbsent(v)) return null
  const n = Number(String(v).replace(/[$,]/g, '').trim())
  return Number.isFinite(n) ? n : null
}

export const asInt = v => {
  const n = asNumber(v)
  if (n === null) return null
  return Number.isInteger(n) ? n : null
}

/**
 * Tri-state boolean (Rule 6). Returns true, false or null.
 * An unrecognised value returns null and is counted as unmappable rather
 * than being coerced to false.
 */
export const asTriBool = v => {
  if (isAbsent(v)) return null
  const s = String(v).trim().toLowerCase()
  if (['true', 't', 'yes', 'y', '1'].includes(s)) return true
  if (['false', 'f', 'no', 'n', '0'].includes(s)) return false
  return null
}
