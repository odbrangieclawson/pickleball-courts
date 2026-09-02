/*
  Exploration only. Prints value distributions for the columns that need
  mapping decisions. Writes nothing, changes nothing.
*/
import {loadRows, SOURCE_COLUMNS} from '../lib/load-csv.mjs'

const rows = loadRows()

const dist = col => {
  const m = new Map()
  for (const r of rows) {
    const v = r[col] === undefined || r[col] === '' ? '(empty)' : r[col]
    m.set(v, (m.get(v) ?? 0) + 1)
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1])
}

const show = (col, limit = 20) => {
  const d = dist(col)
  console.log(`\n=== ${col} === (${d.length} distinct)`)
  for (const [v, c] of d.slice(0, limit)) {
    const pct = ((c / rows.length) * 100).toFixed(1)
    console.log(`  ${String(c).padStart(6)}  ${pct.padStart(5)}%  ${JSON.stringify(v).slice(0, 90)}`)
  }
  if (d.length > limit) console.log(`  ... ${d.length - limit} more distinct values`)
}

console.log(`rows: ${rows.length}`)

for (const col of [
  'sport',
  'surface',
  'access_type',
  'venue_type',
  'is_free',
  'claimed',
  'lighted',
  'covered',
  'climate_controlled',
  'level_of_play',
  'court_availability',
  'parking',
]) {
  show(col)
}

// Null-ish rate for every column, using the raw empty-string test only.
console.log('\n=== empty-string rate per column ===')
const empties = SOURCE_COLUMNS.map(c => {
  const n = rows.filter(r => (r[c] ?? '') === '').length
  return [c, n, ((n / rows.length) * 100).toFixed(1)]
}).sort((a, b) => b[1] - a[1])
for (const [c, n, pct] of empties) {
  console.log(`  ${c.padEnd(20)} ${String(n).padStart(6)}  ${pct.padStart(5)}%`)
}
