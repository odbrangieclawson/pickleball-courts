/* Attempts a city page and reports the six gates. Proves the refusal is
   mechanical rather than a matter of my judgement. */
import {readFileSync} from 'node:fs'
import {join} from 'node:path'
import {loadRows, REPO_ROOT} from './lib/load-csv.mjs'
import {mapRow} from './import/mapper.mjs'
import {promoteAll} from '../lib/data/promote.mjs'
import {getCounts} from '../lib/data/counts.mjs'
import {checkPageGates, formatGateReport} from '../lib/page/gates.mjs'

const city = process.argv[2] ?? 'Jacksonville'
const state = process.argv[3] ?? 'FL'

const venues = loadRows().map(r => mapRow(r).venue)
const county = JSON.parse(readFileSync(join(REPO_ROOT, 'reports', 'county-per-row.json'), 'utf8'))
venues.forEach((v, i) => { v.county = county[i].needs_review ? null : county[i].county })

const {promoted} = promoteAll(venues)
const scope = {type: 'city', city, state}
const counts = getCounts(scope, promoted)
const onPage = promoted.filter(v => v.city === city && v.state === state)

console.log(`\nAttempting /pickleball/us/${state.toLowerCase()}/${city.toLowerCase().replace(/\s+/g, '-')}/\n`)
console.log(formatGateReport(checkPageGates({
  pageType: 'city', counts, venues: onPage, html: null, editorial: null, schema: [],
})))
console.log()
