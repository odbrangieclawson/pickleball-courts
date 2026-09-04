#!/usr/bin/env node
/*
  State outlines for the home page, derived from US Census boundary data.

  ============================================================
  WHY THIS EXISTS RATHER THAN A FOLDER OF PHOTOGRAPHS
  ============================================================

  The home page ranks the states we have verified, and the obvious way to
  illustrate that is the way every competitor does it: a photograph of a
  pickleball court behind each state name. We cannot do that honestly. We
  have no photographs of these places — venue pages say "No photo yet" for
  exactly this reason — and a stock court image captioned "Arizona" is a
  claim about Arizona that no source in this repository supports. It is
  also, in almost every case, someone else's copyright.

  A state's own outline has neither problem. It genuinely depicts the
  state, it is a fact rather than an impression, and the US Census
  publishes the geometry as a work of the federal government in the public
  domain. It is the same publisher this project already relies on for the
  address geocoder and the ZCTA-to-county file, so the provenance chain is
  the one already in use rather than a new one.

  ============================================================
  SOURCE
  ============================================================

    https://www2.census.gov/geo/tiger/GENZ2023/shp/cb_2023_us_state_20m.zip

  The 20m ("1:20,000,000") cartographic boundary file — the Census's own
  most-generalised version, which is the right one here: these render at
  about 120 pixels and a high-resolution coastline would be thrown away by
  the simplifier below anyway.

  ============================================================
  NO NEW DEPENDENCY
  ============================================================

  A shapefile is a documented binary format and a .dbf is dBASE III, and
  both are parsed here in about sixty lines. Adding a shapefile library to
  a project whose entire dependency list is next, react and react-dom, in
  order to draw nine decorative outlines, would be the wrong trade.

  USAGE
    node scripts/build-state-outlines.mjs
    node scripts/build-state-outlines.mjs --check    (verify, write nothing)
*/

import {readFileSync, writeFileSync, existsSync, mkdirSync, rmSync} from 'node:fs'
import {execFileSync} from 'node:child_process'
import {join} from 'node:path'
import {tmpdir} from 'node:os'
import {REPO_ROOT} from './lib/load-csv.mjs'

const SOURCE_URL = 'https://www2.census.gov/geo/tiger/GENZ2023/shp/cb_2023_us_state_20m.zip'
const OUT = 'data/reference/state-outlines.json'
const RETRIEVED = process.env.RETRIEVED_AT ?? '2026-09-04'

/* Rendered small. More than this many points per state is invisible detail. */
const MAX_POINTS_PER_STATE = 150
/* A ring smaller than this share of the state's largest ring is an islet. */
const MIN_RING_SHARE = 0.02

/* ---------------------------------------------------------------- */
/* dBASE III                                                         */

function readDbf(buf) {
  const numRec = buf.readUInt32LE(4)
  const headerLen = buf.readUInt16LE(8)
  const recLen = buf.readUInt16LE(10)
  const fields = []
  for (let o = 32; buf[o] !== 0x0d; o += 32) {
    fields.push({name: buf.toString('ascii', o, o + 11).replace(/\0.*/, ''), len: buf[o + 16]})
  }
  const rows = []
  for (let r = 0; r < numRec; r++) {
    let off = headerLen + r * recLen + 1
    const row = {}
    for (const f of fields) {
      row[f.name] = buf.toString('latin1', off, off + f.len).trim()
      off += f.len
    }
    rows.push(row)
  }
  return rows
}

/* ---------------------------------------------------------------- */
/* ESRI shapefile, polygon records only                              */

function readShp(buf) {
  const out = []
  let off = 100
  while (off < buf.length) {
    const lenWords = buf.readInt32BE(off + 4)
    const body = off + 8
    const type = buf.readInt32LE(body)
    if (type === 5) {
      const numParts = buf.readInt32LE(body + 36)
      const numPoints = buf.readInt32LE(body + 40)
      const partsOff = body + 44
      const ptsOff = partsOff + numParts * 4
      const parts = []
      for (let i = 0; i < numParts; i++) parts.push(buf.readInt32LE(partsOff + i * 4))
      const rings = []
      for (let p = 0; p < numParts; p++) {
        const s = parts[p]
        const e = p + 1 < numParts ? parts[p + 1] : numPoints
        const ring = []
        for (let i = s; i < e; i++) {
          ring.push([buf.readDoubleLE(ptsOff + i * 16), buf.readDoubleLE(ptsOff + i * 16 + 8)])
        }
        rings.push(ring)
      }
      out.push(rings)
    } else {
      out.push(null)
    }
    off = body + lenWords * 2
  }
  return out
}

/* ---------------------------------------------------------------- */
/* Simplify (Douglas-Peucker) and project                            */

function perpDist(p, a, b) {
  const [px, py] = p, [ax, ay] = a, [bx, by] = b
  const dx = bx - ax, dy = by - ay
  if (dx === 0 && dy === 0) return Math.hypot(px - ax, py - ay)
  const t = ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)
  const cx = ax + Math.max(0, Math.min(1, t)) * dx
  const cy = ay + Math.max(0, Math.min(1, t)) * dy
  return Math.hypot(px - cx, py - cy)
}

function simplify(points, tol) {
  if (points.length < 3) return points
  let maxD = 0, idx = 0
  for (let i = 1; i < points.length - 1; i++) {
    const d = perpDist(points[i], points[0], points[points.length - 1])
    if (d > maxD) { maxD = d; idx = i }
  }
  if (maxD <= tol) return [points[0], points[points.length - 1]]
  return [
    ...simplify(points.slice(0, idx + 1), tol).slice(0, -1),
    ...simplify(points.slice(idx), tol),
  ]
}

/** Ring area by the shoelace formula, used only to rank rings by size. */
const ringArea = r => {
  let a = 0
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    a += (r[j][0] * r[i][1]) - (r[i][0] * r[j][1])
  }
  return Math.abs(a / 2)
}

/*
  Equirectangular with a cosine correction at the state's own mid-latitude.
  A proper Albers would be better for a map of the whole country; for one
  state drawn on its own at 120px it is indistinguishable, and this keeps
  the whole file dependency-free. Without the cosine term Washington comes
  out visibly stretched east-west.
*/
function toPath(rings, decimals = 1) {
  const all = rings.flat()
  const lats = all.map(p => p[1])
  const midLat = (Math.min(...lats) + Math.max(...lats)) / 2
  const k = Math.cos((midLat * Math.PI) / 180)

  const proj = rings.map(r => r.map(([lon, lat]) => [lon * k, -lat]))
  const flat = proj.flat()
  const xs = flat.map(p => p[0]), ys = flat.map(p => p[1])
  const minX = Math.min(...xs), maxX = Math.max(...xs)
  const minY = Math.min(...ys), maxY = Math.max(...ys)
  const w = maxX - minX, h = maxY - minY
  const scale = 100 / Math.max(w, h)

  const vbW = +(w * scale).toFixed(decimals)
  const vbH = +(h * scale).toFixed(decimals)

  const d = proj.map(r => {
    const pts = r.map(([x, y]) => [
      +((x - minX) * scale).toFixed(decimals),
      +((y - minY) * scale).toFixed(decimals),
    ])
    return 'M' + pts.map(p => `${p[0]} ${p[1]}`).join('L') + 'Z'
  }).join('')

  return {viewBox: `0 0 ${vbW} ${vbH}`, d}
}

/* ---------------------------------------------------------------- */

const check = process.argv.includes('--check')
const cache = join(tmpdir(), 'cb_2023_us_state_20m')

if (!existsSync(join(cache, 'cb_2023_us_state_20m.shp'))) {
  mkdirSync(cache, {recursive: true})
  const zip = join(cache, 'src.zip')
  console.log(`fetching ${SOURCE_URL}`)
  execFileSync('curl', ['-sS', '-L', '--fail', '--max-time', '120', '-o', zip, SOURCE_URL])

  /*
    Git Bash ships an MSYS tar that reads a Windows path as host:path and
    tries to resolve "C:" as a remote machine. unzip has no such idea, so
    it is tried first; --force-local is what tells tar to stop being clever
    when unzip is not installed.
  */
  try {
    execFileSync('unzip', ['-o', '-q', zip, '-d', cache])
  } catch {
    execFileSync('tar', ['--force-local', '-xf', zip, '-C', cache])
  }
}

const rowsDbf = readDbf(readFileSync(join(cache, 'cb_2023_us_state_20m.dbf')))
const geom = readShp(readFileSync(join(cache, 'cb_2023_us_state_20m.shp')))
if (rowsDbf.length !== geom.length) {
  throw new Error(`dbf has ${rowsDbf.length} rows and shp has ${geom.length} shapes`)
}

const outlines = {}
let totalPoints = 0
for (let i = 0; i < rowsDbf.length; i++) {
  const {STUSPS: code, NAME: name} = rowsDbf[i]
  const rings = geom[i]
  if (!rings || !code) continue

  /* Drop islets: they add points and vanish at this size. */
  const areas = rings.map(ringArea)
  const biggest = Math.max(...areas)
  let kept = rings.filter((_, j) => areas[j] / biggest >= MIN_RING_SHARE)

  /*
    Tolerance is searched rather than guessed, because one value cannot
    suit both Colorado (a rectangle) and Alaska (a fractal coastline).
    Loosen until the state is under the point budget.
  */
  let tol = 0.02
  let simplified = kept.map(r => simplify(r, tol))
  while (simplified.reduce((n, r) => n + r.length, 0) > MAX_POINTS_PER_STATE && tol < 5) {
    tol *= 1.6
    simplified = kept.map(r => simplify(r, tol))
  }
  simplified = simplified.filter(r => r.length >= 4)
  if (simplified.length === 0) continue

  const points = simplified.reduce((n, r) => n + r.length, 0)
  totalPoints += points
  outlines[code] = {name, ...toPath(simplified)}
}

const payload = {
  source: SOURCE_URL,
  publisher: 'US Census Bureau',
  licence: 'Public domain (a work of the United States federal government).',
  retrieved: RETRIEVED,
  note:
    'Simplified state outlines for decorative use on the home page. Derived from the Census '
    + '20m cartographic boundary file by scripts/build-state-outlines.mjs. Projected '
    + 'equirectangular with a cosine correction at each state\'s mid-latitude and normalised '
    + 'into a 100-unit viewBox, so these are indicative shapes at card size and not a basis '
    + 'for measurement.',
  states: outlines,
}

const json = JSON.stringify(payload, null, 2) + '\n'
const path = join(REPO_ROOT, OUT)

if (check) {
  const existing = existsSync(path) ? readFileSync(path, 'utf8') : null
  if (existing !== json) {
    throw new Error(`${OUT} is stale. Re-run: node scripts/build-state-outlines.mjs`)
  }
  console.log(`${OUT} is current — ${Object.keys(outlines).length} states.`)
} else {
  writeFileSync(path, json)
  console.log(
    `Wrote ${OUT} — ${Object.keys(outlines).length} states, `
    + `${totalPoints} points, ${(json.length / 1024).toFixed(1)} KB.`)
}
