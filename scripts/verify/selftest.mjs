/*
  Phase 1B self-test. Asserts the guarantees the phase claims, because a
  guarantee nobody tested is a comment.

  Run: npm run verify:selftest
*/

import {SourceDocument, factsToPatch, passesI2} from './provenance.mjs'
import {recordToFacts, parseCSV, parseHTMLTable, parseSocrata} from './parsers.mjs'
import {resolveFact, applyFacts, changelogToRows} from './conflict.mjs'
import {metroStatus} from './build-queue.mjs'

let pass = 0, fail = 0
const ok = (name, cond, detail = '') => {
  if (cond) { pass++; console.log(`  PASS  ${name}`) }
  else { fail++; console.log(`  FAIL  ${name}${detail ? ' — ' + detail : ''}`) }
}
const throws = (name, fn, match) => {
  try { fn(); fail++; console.log(`  FAIL  ${name} — expected a throw, got none`) }
  catch (e) {
    if (match && !String(e.message).includes(match)) { fail++; console.log(`  FAIL  ${name} — wrong error: ${e.message}`) }
    else { pass++; console.log(`  PASS  ${name}`) }
  }
}

console.log('\n1. Provenance cannot be omitted or backfilled\n')

throws('SourceDocument rejects a missing url', () => new SourceDocument({retrieved_at: '2026-09-02', tier: 1}), 'real http(s) url')
throws('SourceDocument rejects a non-http url', () => new SourceDocument({url: 'parks.pdf', retrieved_at: '2026-09-02', tier: 1}), 'real http(s) url')
throws('SourceDocument rejects a missing date', () => new SourceDocument({url: 'https://a.gov/x', tier: 1}), 'ISO date')
throws('SourceDocument rejects a non-ISO date', () => new SourceDocument({url: 'https://a.gov/x', retrieved_at: '2 Sep 2026', tier: 1}), 'ISO date')
throws('SourceDocument rejects an unknown tier', () => new SourceDocument({url: 'https://a.gov/x', retrieved_at: '2026-09-02', tier: 9}), 'tier 1-6')

const doc = new SourceDocument({
  url: 'https://www.example.gov/parks/courts',
  retrieved_at: '2026-09-02',
  tier: 1,
  publisher: 'Example City Parks',
  format: 'html_table',
})

const f = doc.fact('total_courts', 6, {evidence: 'Courts: 6'})
ok('fact carries source_url', f.source_url === 'https://www.example.gov/parks/courts')
ok('fact carries date_checked from the document', f.date_checked === '2026-09-02')
ok('tier 1 earns municipal_source', f.verified_by === 'municipal_source')
ok('fact is frozen (cannot be backfilled)', Object.isFrozen(f))

// The central claim: you cannot edit provenance after the fact.
try { f.source_url = 'https://elsewhere.example/' } catch { /* strict mode throws */ }
ok('source_url survives an overwrite attempt', f.source_url === 'https://www.example.gov/parks/courts')
try { f.date_checked = '2030-01-01' } catch { /* ignore */ }
ok('date_checked survives an overwrite attempt', f.date_checked === '2026-09-02')

throws('factsToPatch refuses a hand-made object', () => factsToPatch([{field: 'total_courts', value: 6}]), 'non-Fact')
ok('factsToPatch accepts real Facts', factsToPatch([f]).patch.total_courts === 6)

const tier4 = new SourceDocument({url: 'https://club.example/courts', retrieved_at: '2026-09-02', tier: 4})
ok('tier 4 earns staff_check', tier4.fact('light', true).verified_by === 'staff_check')

console.log('\n2. Import Gate I2\n')

ok('I2 rejects a CourtSource url',
  passesI2({source_url: 'https://www.courtsource.us/pickleball/ak/x', date_checked: '2026-09-02', verified_by: 'municipal_source'}).problems
    .some(p => p.includes('CourtSource')))
ok('I2 rejects a missing date_checked',
  !passesI2({source_url: 'https://a.gov/x', verified_by: 'municipal_source'}).pass)
ok('I2 rejects a future date_checked',
  passesI2({source_url: 'https://a.gov/x', date_checked: '2099-01-01', verified_by: 'municipal_source'}, {today: '2026-09-02'}).problems
    .some(p => p.includes('future')))
ok('I2 rejects an out-of-cadence date',
  passesI2({source_url: 'https://a.gov/x', date_checked: '2020-01-01', verified_by: 'municipal_source'}, {today: '2026-09-02', cadenceDays: 365}).problems
    .some(p => p.includes('cadence')))
ok('I2 rejects an invalid verified_by',
  !passesI2({source_url: 'https://a.gov/x', date_checked: '2026-09-02', verified_by: 'scraped'}).pass)
ok('I2 passes a good record',
  passesI2({source_url: 'https://a.gov/x', date_checked: '2026-09-02', verified_by: 'municipal_source'}, {today: '2026-09-02'}).pass)

console.log('\n3. Parsers attach provenance and refuse to guess\n')

const fieldMap = {'Facility': 'name', 'Address': 'street_address', 'Courts': 'total_courts', 'Lighted': 'light'}
const csv = 'Facility,Address,Courts,Lighted,Notes\n"Elm Park","1 Elm St",4,Yes,"busy"\n"Oak Park","2 Oak Ave",,No,\n'
const csvOut = parseCSV(doc, csv, fieldMap)
ok('CSV parsed two records', csvOut.length === 2)
ok('every CSV fact carries the source url', csvOut.flatMap(r => r.facts).every(x => x.source_url === doc.url))
ok('an undeclared column is reported, not inferred', csvOut[0].unmapped.includes('Notes'))
ok('a blank cell mints no fact (silence is not "none")',
  !csvOut[1].facts.some(x => x.field === 'total_courts'),
  JSON.stringify(csvOut[1].facts.map(x => x.field)))
ok('Yes/No coerced to a real boolean', csvOut[0].facts.find(x => x.field === 'light')?.value === true)

const html = '<table><tr><th>Facility</th><th>Courts</th></tr><tr><td>Elm Park</td><td>4</td></tr></table>'
const htmlOut = parseHTMLTable(doc, html, fieldMap)
ok('HTML table parsed', htmlOut.length === 1 && htmlOut[0].facts.find(x => x.field === 'total_courts')?.value === 4)

const soc = parseSocrata(doc, [{Facility: 'Elm Park', Courts: '4'}], fieldMap)
ok('Socrata rows parsed', soc[0].facts.find(x => x.field === 'total_courts')?.value === 4)

throws('a parser refuses to run without a SourceDocument',
  () => recordToFacts({url: 'https://a.gov'}, {Courts: 4}, fieldMap), 'needs a SourceDocument')

console.log('\n4. Conflict protocol\n')

const imported = {slug: 'elm-park', total_courts: 4, surface: 'asphalt', light: null, source_url: 'https://www.courtsource.us/x'}
const muni = new SourceDocument({url: 'https://www.example.gov/parks/elm', retrieved_at: '2026-09-02', tier: 1})

const r1 = resolveFact(imported, muni.fact('total_courts', 6))
ok('municipal source overrides an unsourced imported value', r1.outcome === 'overridden' && r1.winner === 'new')
ok('the override is flagged for one re-check', r1.needs_recheck === true)
ok('the change log keeps the OLD value', r1.entry.old_value === 4)
ok('the change log keeps BOTH sources',
  r1.entry.new_source.url === 'https://www.example.gov/parks/elm' && r1.entry.old_source.url === 'https://www.courtsource.us/x')

const r2 = resolveFact(imported, muni.fact('light', true))
ok('filling a null is not a conflict', r2.outcome === 'filled' && r2.needs_recheck === false)

const r3 = resolveFact(imported, muni.fact('surface', 'Asphalt'))
ok('case difference is not a conflict', r3.outcome === 'agreed')

const club = new SourceDocument({url: 'https://club.example/x', retrieved_at: '2026-09-03', tier: 4})
const prior = {source_tier: 1, date_checked: '2026-09-02', source_url: 'https://www.example.gov/parks/elm'}
const r4 = resolveFact({total_courts: 6}, club.fact('total_courts', 8), prior)
ok('a lower-trust newer source does NOT beat a municipal one', r4.outcome === 'rejected' && r4.winner === 'old')

const muniNewer = new SourceDocument({url: 'https://www.example.gov/parks/elm-2', retrieved_at: '2026-10-01', tier: 1})
const r5 = resolveFact({total_courts: 6}, muniNewer.fact('total_courts', 8), prior)
ok('same tier, newer reading wins', r5.outcome === 'overridden')

const muniSameDay = new SourceDocument({url: 'https://www.example.gov/other', retrieved_at: '2026-09-02', tier: 1})
const r6 = resolveFact({total_courts: 6}, muniSameDay.fact('total_courts', 9), prior)
ok('two equal sources disagreeing are ESCALATED, not guessed', r6.outcome === 'unresolved' && r6.winner === null)

const applied = applyFacts(imported, [muni.fact('total_courts', 6), muni.fact('light', true)])
ok('applyFacts updates the record', applied.venue.total_courts === 6 && applied.venue.light === true)
ok('applyFacts sets a real source_url', applied.venue.source_url === 'https://www.example.gov/parks/elm')
ok('applyFacts sets date_checked', applied.venue.date_checked === '2026-09-02')
ok('applyFacts schedules exactly one re-check', applied.recheck?.times === 1)
ok('the updated record now passes I2', passesI2(applied.venue, {today: '2026-09-02'}).pass)
ok('changelog rows carry both sources', changelogToRows('elm-park', applied.changelog)[0].old_source_url !== undefined)

// Record freshness is the OLDEST field date, not the newest.
const twoDocs = applyFacts({}, [
  new SourceDocument({url: 'https://a.gov/1', retrieved_at: '2024-01-01', tier: 1}).fact('total_courts', 4),
  new SourceDocument({url: 'https://a.gov/2', retrieved_at: '2026-09-02', tier: 1}).fact('light', true),
])
ok('record date_checked is the STALEST field, not the freshest', twoDocs.venue.date_checked === '2024-01-01')

console.log('\n5. The hard rule\n')

ok('0 verified venues blocks the metro', metroStatus(0).publishable === false)
ok('2 verified venues still blocks the metro', metroStatus(2).publishable === false)
ok('3 verified venues clears it', metroStatus(3).publishable === true)
ok('there is no partial-publish state', !('partial' in metroStatus(2)))

console.log(`\n${pass} passed, ${fail} failed\n`)
process.exit(fail ? 1 : 0)
