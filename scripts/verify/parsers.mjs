/*
  Phase 1B deliverable 3: parsers for the common municipal formats.

  Every parser takes a SourceDocument as its first argument and returns
  Facts minted from it. None of them can return a bare value, so provenance
  is attached at extraction and cannot be added afterwards.

  FORMATS COVERED, in rough order of how often US municipal open data uses
  them for park and facility inventories:

    socrata     data.cityofX.gov / *.socrata.com  - JSON rows
    arcgis      services*.arcgis.com FeatureServer - GeoJSON-ish features
    ckan        open-data portals running CKAN     - JSON records
    csv         a downloaded CSV export
    html_table  a parks-department page with a facilities table
    pdf_text    text already extracted from a parks-department PDF

  WHAT THE PARSERS DO NOT DO

  They do not guess. A parser maps a source field to a v4 field only when
  the mapping is declared in its fieldMap. An unrecognised column is
  reported as unmapped, never inferred from its name, because a column
  called "courts" might be tennis courts and a column called "lighted"
  might mean the car park.

  They do not fill nulls. If a source omits a value, no Fact is minted for
  that field, so the venue keeps whatever it had and the field stays
  unverified. A source that is silent has said nothing, which is different
  from a source that says "none".
*/

import {SourceDocument} from './provenance.mjs'

const asInt = v => {
  if (v === null || v === undefined || v === '') return null
  const n = Number(String(v).replace(/[^0-9.-]/g, ''))
  return Number.isInteger(n) ? n : (Number.isFinite(n) ? Math.round(n) : null)
}

const asBool = v => {
  if (v === null || v === undefined || v === '') return null
  const s = String(v).trim().toLowerCase()
  if (['true', 'yes', 'y', '1'].includes(s)) return true
  if (['false', 'no', 'n', '0'].includes(s)) return false
  return null
}

const asText = v => {
  if (v === null || v === undefined) return null
  const s = String(v).trim()
  return s === '' ? null : s
}

/** Coercers by v4 field. Anything not listed is refused rather than guessed. */
export const FIELD_COERCE = {
  name: asText,
  street_address: asText,
  city: asText,
  postal_code: asText,
  total_courts: asInt,
  indoor_courts: asInt,
  outdoor_courts: asInt,
  surface: asText, // normalised later through the controlled vocabulary
  light: asBool,
  restroom: asBool,
  nets_provided: asBool,
  covered: asBool,
  climate_control: asBool,
  hours_of_operation: asText,
  phone: asText,
  website: asText,
  fee_type: asText,
  access_type: asText,
  pricing_notes: asText,
}

/**
 * Turn one source record into Facts.
 *
 * @param {SourceDocument} doc
 * @param {object} record          one row/feature/record from the source
 * @param {object} fieldMap        {sourceKey: v4Field} - declared, never inferred
 */
export function recordToFacts(doc, record, fieldMap) {
  if (!(doc instanceof SourceDocument)) {
    throw new Error('recordToFacts needs a SourceDocument - provenance is not optional')
  }
  const facts = []
  const unmapped = []
  for (const [key, raw] of Object.entries(record)) {
    const field = fieldMap[key]
    if (!field) {
      if (asText(raw) !== null) unmapped.push(key)
      continue
    }
    const coerce = FIELD_COERCE[field]
    if (!coerce) {
      unmapped.push(`${key} -> ${field} (no coercer declared)`)
      continue
    }
    const value = coerce(raw)
    // A source that is silent on a field says nothing. No Fact is minted.
    if (value === null) continue
    facts.push(doc.fact(field, value, {evidence: `${key}=${String(raw).slice(0, 120)}`}))
  }
  return {facts, unmapped}
}

/* ---------------------------------------------------------------- */
/* Format adapters. Each normalises to plain records, then delegates. */
/* ---------------------------------------------------------------- */

/** Socrata: JSON array of flat objects. */
export function parseSocrata(doc, json, fieldMap) {
  const rows = Array.isArray(json) ? json : (json.data ?? [])
  return rows.map(r => recordToFacts(doc, r, fieldMap))
}

/** ArcGIS FeatureServer: {features: [{attributes, geometry}]}. */
export function parseArcGIS(doc, json, fieldMap) {
  const feats = json.features ?? []
  return feats.map(f => {
    const rec = {...(f.attributes ?? f.properties ?? {})}
    // Geometry is treated as data like anything else, and only when the
    // caller declared a mapping for it.
    const g = f.geometry
    if (g && typeof g.y === 'number' && typeof g.x === 'number') {
      rec.__lat = g.y
      rec.__lon = g.x
    } else if (g && g.type === 'Point' && Array.isArray(g.coordinates)) {
      rec.__lon = g.coordinates[0]
      rec.__lat = g.coordinates[1]
    }
    return recordToFacts(doc, rec, fieldMap)
  })
}

/** CKAN: {result: {records: [...]}}. */
export function parseCKAN(doc, json, fieldMap) {
  const rows = json?.result?.records ?? []
  return rows.map(r => recordToFacts(doc, r, fieldMap))
}

/**
 * CSV export. Minimal RFC4180 handling: quoted fields, doubled quotes,
 * embedded commas and newlines.
 */
export function parseCSV(doc, text, fieldMap) {
  const rows = []
  let row = [], field = '', inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ } else inQuotes = false
      } else field += c
    } else if (c === '"') inQuotes = true
    else if (c === ',') { row.push(field); field = '' }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = '' }
    else if (c !== '\r') field += c
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row) }
  if (!rows.length) return []
  const header = rows[0].map(h => h.trim().replace(/^﻿/, ''))
  return rows.slice(1).filter(r => r.length && r.some(x => x !== '')).map(r => {
    const rec = {}
    header.forEach((h, i) => { rec[h] = r[i] ?? '' })
    return recordToFacts(doc, rec, fieldMap)
  })
}

/**
 * HTML table on a parks-department page.
 *
 * Regex-based on purpose: these are small, static, well-formed government
 * tables, and adding a DOM parser dependency for them is not worth it. If a
 * page defeats this, extract it by hand and use parseCSV - do not make the
 * regex cleverer.
 */
export function parseHTMLTable(doc, html, fieldMap, {tableIndex = 0} = {}) {
  const tables = [...html.matchAll(/<table[\s\S]*?<\/table>/gi)].map(m => m[0])
  const table = tables[tableIndex]
  if (!table) return []
  const rows = [...table.matchAll(/<tr[\s\S]*?<\/tr>/gi)].map(m => m[0])
  if (!rows.length) return []

  const cells = tr => [...tr.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)]
    .map(m => m[1].replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim())

  const header = cells(rows[0])
  return rows.slice(1).map(tr => {
    const c = cells(tr)
    const rec = {}
    header.forEach((h, i) => { rec[h] = c[i] ?? '' })
    return recordToFacts(doc, rec, fieldMap)
  }).filter(r => r.facts.length)
}

/**
 * Text already extracted from a PDF.
 *
 * Takes TEXT, not a PDF. Extracting text from a PDF is a separate concern
 * with its own failure modes, and pretending to parse a binary here would
 * hide them. Use pdftotext, or the browser, then pass the text in with the
 * PDF's URL as the SourceDocument url.
 *
 * @param {RegExp} pattern  must use named capture groups whose names are
 *                          v4 field names.
 */
export function parsePDFText(doc, text, pattern) {
  if (!pattern.flags.includes('g')) throw new Error('parsePDFText needs a global regex')
  const out = []
  for (const m of text.matchAll(pattern)) {
    const rec = m.groups ?? {}
    const facts = []
    for (const [field, raw] of Object.entries(rec)) {
      const coerce = FIELD_COERCE[field]
      if (!coerce) continue
      const value = coerce(raw)
      if (value === null) continue
      facts.push(doc.fact(field, value, {evidence: m[0].slice(0, 160).replace(/\s+/g, ' ')}))
    }
    if (facts.length) out.push({facts, unmapped: []})
  }
  return out
}

export const PARSERS = {
  socrata: parseSocrata,
  arcgis: parseArcGIS,
  ckan: parseCKAN,
  csv: parseCSV,
  html_table: parseHTMLTable,
  pdf_text: parsePDFText,
}
