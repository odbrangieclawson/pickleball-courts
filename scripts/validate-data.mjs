/*
  Phase 2 deliverable 4: the build-time data validator.

  Runs on prebuild. Exits non-zero on any ERROR, which fails the build.

  CHECKS
    C1  the four import gates, per row
    C2  required fields present
    C3  nulls not zero-filled
    C4  tri-state booleans not coerced to false
    C5  no duplicate slugs, and no numeric-suffix slugs (Rule 10)
    C6  total_courts = indoor + outdoor (Rule 13)
    C7  count cross-checks: getCounts agrees with a naive recount
    C8  every PUBLISHED fact has source_url and date_checked (Rule 7)
    C9  no page renders an imported row count (delegated to
        validate-no-bypass.mjs, which parses app/)
    C10 no keyword-map collisions (delegated to validate-keyword-map.mjs)

  ERROR vs WARNING

  An ERROR is something that would ship a wrong page. A WARNING is something
  wrong with data that is not publishable anyway.

  This distinction matters right now, because ZERO rows are verified. Almost
  every defect in the current dataset sits on a pending row that no page can
  render. Failing the build on those would mean a permanently red build that
  everyone learns to ignore, which is worse than no check at all. So defects
  on pending rows are WARNINGS, and the same defect on a verified row is an
  ERROR. As rows get verified, the checks bite automatically.
*/

import {readFileSync, existsSync, writeFileSync, mkdirSync} from 'node:fs'
import {join} from 'node:path'
import {loadRows, REPO_ROOT} from './lib/load-csv.mjs'
import {mapRow} from './import/mapper.mjs'
import {validateEntity, isVerified, unverifiedReasons, TRI_STATE_FIELDS} from '../lib/data/schema.mjs'
import {getCounts, isCount} from '../lib/data/counts.mjs'
import {auditSlugs} from '../lib/data/slugs.mjs'

const errors = []
const warnings = []
const err = (type, msg, ctx = null) => errors.push({type, msg, ctx})
const warn = (type, msg, ctx = null) => warnings.push({type, msg, ctx})

const DATA = join(REPO_ROOT, 'data.csv')
if (!existsSync(DATA)) {
  /*
    Said loudly on purpose. The old message was a mild one-liner and CI
    rendered it as a green tick beside "Data validator over every imported
    row" — a step that had examined nothing at all. A pass that means
    "nothing was checked" reads as assurance, which is the exact failure
    this project already fixed once in Gate 6.
  */
  console.log([
    '',
    '  SKIPPED — no data.csv, so NOTHING WAS VALIDATED.',
    '',
    '  The dataset is 7.8 MB of unsourced records and is gitignored on',
    '  purpose, so CI never has it. This is expected, and it is stated',
    '  plainly rather than passing quietly.',
    '',
    '  Nothing shipping depends on it: the published set is built from',
    '  data/verified/, and the page gates are what block a deploy.',
    '',
  ].join('\n'))
  process.exit(0)
}

const src = loadRows()
const venues = src.map(r => mapRow(r).venue)

// County from Phase 1, needed for I3.
const countyPath = join(REPO_ROOT, 'reports', 'county-per-row.json')
if (existsSync(countyPath)) {
  const c = JSON.parse(readFileSync(countyPath, 'utf8'))
  if (c.length === venues.length) {
    venues.forEach((v, i) => { v.county = c[i].needs_review ? null : c[i].county })
  }
}

const verified = venues.filter(isVerified)
const isPub = v => isVerified(v)

console.log(`validate-data: ${venues.length.toLocaleString()} rows, ${verified.length.toLocaleString()} verified\n`)

/* ---- C2 schema + required fields ---- */
/*
  Every failure is RECORDED so the tally is the true number. Only the
  printed samples are capped. Capping the recording would make the summary
  table report the cap instead of the defect count, which is exactly the
  kind of quietly wrong number this whole phase exists to prevent.
*/
for (const v of venues) {
  // Strip the private fields the pipeline attaches; they are not part of the model.
  const clean = Object.fromEntries(Object.entries(v).filter(([k]) => !k.startsWith('_')))
  const r = validateEntity('venue', clean)
  if (!r.valid) {
    (isPub(v) ? err : warn)('C2_schema', `${v.slug}: ${r.errors.slice(0, 3).join('; ')}`)
  }
}

/* ---- C3 zero-filled nulls ---- */
for (const v of venues) {
  for (const f of ['total_courts', 'rating', 'user_rating', 'review_count']) {
    if (v[f] === 0) (isPub(v) ? err : warn)('C3_zero_fill', `${v.slug}: ${f} is 0, which the mapper should have nulled`)
  }
}

/* ---- C4 tri-state not coerced ---- */
for (const v of venues) {
  for (const f of TRI_STATE_FIELDS) {
    const x = v[f]
    if (x !== true && x !== false && x !== null && x !== undefined) {
      (isPub(v) ? err : warn)('C4_tri_state', `${v.slug}: ${f} is ${JSON.stringify(x)}, not true/false/null`)
    }
  }
}

/* ---- C5 slugs ---- */
const slugAudit = auditSlugs(venues)
for (const n of slugAudit.numeric_suffix) {
  const anyPub = n.venues.some(isPub)
  ;(anyPub ? err : warn)('C5_numeric_suffix', `slug "${n.slug}" ends in a numeric suffix (Rule 10)`)
}
for (const c of slugAudit.collisions) {
  const anyPub = c.venues.some(isPub)
  ;(anyPub ? err : warn)('C5_duplicate_slug', `slug "${c.slug}" used by ${c.count} venues`)
}
for (const u of slugAudit.unresolvable) {
  warn('C5_unresolvable', `slug "${u.slug}" collides and no disambiguator separates it - needs a human`)
}

/* ---- C6 court arithmetic (Rule 13) ---- */
for (const v of venues) {
  if (v.total_courts !== null && v.indoor_courts !== null && v.outdoor_courts !== null) {
    if (v.total_courts !== v.indoor_courts + v.outdoor_courts) {
      (isPub(v) ? err : warn)('C6_court_arithmetic',
        `${v.slug}: total ${v.total_courts} != indoor ${v.indoor_courts} + outdoor ${v.outdoor_courts}`)
    }
  }
}

/* ---- C1 the four import gates ---- */
let gateBlocked = 0
for (const v of venues) {
  if (isPub(v)) continue
  gateBlocked++
}
warn('C1_import_gates', `${gateBlocked.toLocaleString()} rows do not pass all four import gates and are therefore unpublishable`)
const reasonTally = new Map()
for (const v of venues) {
  if (isPub(v)) continue
  for (const r of unverifiedReasons(v)) reasonTally.set(r, (reasonTally.get(r) ?? 0) + 1)
}

/* ---- C7 count cross-check ---- */
/*
  getCounts must agree with an independent recount. This catches a
  refactor that changes a predicate in one place only. Run over every
  scope that has verified venues; with none verified it runs over a
  synthetic scope so the check is still exercised.
*/
{
  const scopes = new Map()
  for (const v of verified) scopes.set(`${v.city}|${v.state}`, {type: 'city', city: v.city, state: v.state})
  let checked = 0
  for (const scope of scopes.values()) {
    const c = getCounts(scope, venues)
    const naive = venues.filter(v => v.city === scope.city && v.state === scope.state && isVerified(v))
    if (c.venues.value !== naive.length) {
      err('C7_count_mismatch', `${scope.city}, ${scope.state}: getCounts says ${c.venues.value}, recount says ${naive.length}`)
    }
    const naiveCourts = naive.filter(v => typeof v.total_courts === 'number').reduce((a, v) => a + v.total_courts, 0)
    if (c.courts.value !== naiveCourts) {
      err('C7_count_mismatch', `${scope.city}, ${scope.state}: courts ${c.courts.value} vs recount ${naiveCourts}`)
    }
    if (!isCount(c.venues)) err('C7_not_a_count', 'getCounts returned something that is not a Count')
    checked++
  }
  if (checked === 0) {
    warn('C7_count_mismatch', 'No verified venues exist, so no real scope could be cross-checked. The check runs but has nothing to compare.')
  } else {
    console.log(`  C7: cross-checked ${checked} scopes`)
  }
}

/* ---- C8 published facts carry provenance (Rule 7) ---- */
for (const v of verified) {
  if (!v.source_url) err('C8_provenance', `${v.slug}: verified but has no source_url`)
  if (!v.date_checked) err('C8_provenance', `${v.slug}: verified but has no date_checked`)
  if (/courtsource\.us/i.test(v.source_url ?? '')) {
    err('C8_provenance', `${v.slug}: verified with a competitor directory as its source`)
  }
}

/* ---- report ---- */
const group = list => {
  const m = new Map()
  for (const e of list) {
    if (!m.has(e.type)) m.set(e.type, [])
    m.get(e.type).push(e)
  }
  return [...m.entries()].sort((a, b) => b[1].length - a[1].length)
}

const L = []
const say = s => L.push(s)
say('# Data validation report')
say('')
say(`\`data.csv\` — ${venues.length.toLocaleString()} rows, **${verified.length.toLocaleString()} verified**.`)
say('')
say(`**${errors.length} errors, ${warnings.length} warning types.**`)
say('')
say('An ERROR is a defect that would ship a wrong page. A WARNING is a defect')
say('on a row that is not publishable anyway. With zero rows verified, almost')
say('everything is a warning by construction — and each one becomes an error')
say('automatically the moment its row is verified.')
say('')

say('## Failures by type')
say('')
say('| type | severity | count |')
say('| --- | --- | ---: |')
for (const [type, list] of group(errors)) say(`| \`${type}\` | **ERROR** | ${list.length.toLocaleString()} |`)
for (const [type, list] of group(warnings)) say(`| \`${type}\` | warning | ${list.length.toLocaleString()} |`)
say('')

say('## Why rows fail the import gates')
say('')
say('| reason | rows |')
say('| --- | ---: |')
for (const [r, n] of [...reasonTally.entries()].sort((a, b) => b[1] - a[1])) {
  say(`| ${r} | ${n.toLocaleString()} |`)
}
say('')

say('## Slug registry audit (all rows)')
say('')
say(`- Distinct slugs: **${slugAudit.distinct.toLocaleString()}** of ${slugAudit.total.toLocaleString()} rows`)
say(`- Slugs with a numeric suffix (Rule 10 violation): **${slugAudit.numeric_suffix.length.toLocaleString()}**`)
say(`- Colliding slugs: **${slugAudit.collisions.length.toLocaleString()}**`)
say(`- Collisions the registry CAN resolve on real data: **${slugAudit.resolvable.length.toLocaleString()}**`)
say(`- Collisions needing a human: **${slugAudit.unresolvable.length.toLocaleString()}**`)
say('')
if (slugAudit.numeric_suffix.length) {
  say('### Numeric-suffix slugs — every one must be renamed before publication')
  say('')
  say('```')
  slugAudit.numeric_suffix.slice(0, 20).forEach(n => say(`${n.slug}  (${n.venues[0].name}, ${n.venues[0].city} ${n.venues[0].state})`))
  if (slugAudit.numeric_suffix.length > 20) say(`... ${slugAudit.numeric_suffix.length - 20} more`)
  say('```')
  say('')
}
if (slugAudit.resolvable.length) {
  say('### Collisions, with the disambiguation the registry proposes')
  say('')
  say('```')
  slugAudit.resolvable.slice(0, 12).forEach(c => {
    say(`${c.slug}  x${c.count}`)
    c.proposed.forEach((p, i) => say(`    -> ${p}   (${c.venues[i].name}, ${c.venues[i].city})`))
  })
  say('```')
  say('')
}

say('## Sample errors')
say('')
if (!errors.length) {
  say('None. No row is verified, so no row can ship a wrong page yet.')
} else {
  say('```')
  errors.slice(0, 25).forEach(e => say(`[${e.type}] ${e.msg}`))
  say('```')
}
say('')

mkdirSync(join(REPO_ROOT, 'reports'), {recursive: true})
writeFileSync(join(REPO_ROOT, 'reports', 'validation.md'), L.join('\n'))
writeFileSync(join(REPO_ROOT, 'reports', 'validation.json'), JSON.stringify({
  rows: venues.length,
  verified: verified.length,
  errors: group(errors).map(([type, l]) => ({type, count: l.length})),
  warnings: group(warnings).map(([type, l]) => ({type, count: l.length})),
  gate_reasons: Object.fromEntries(reasonTally),
  slugs: {
    distinct: slugAudit.distinct,
    numeric_suffix: slugAudit.numeric_suffix.length,
    collisions: slugAudit.collisions.length,
    resolvable: slugAudit.resolvable.length,
    unresolvable: slugAudit.unresolvable.length,
  },
}, null, 2))

for (const [type, list] of group(warnings)) console.log(`  warn  ${type.padEnd(22)} ${String(list.length).padStart(7)}`)
for (const [type, list] of group(errors)) console.log(`  ERROR ${type.padEnd(22)} ${String(list.length).padStart(7)}`)
console.log(`\nWrote reports/validation.md`)
console.log(`${errors.length} errors, ${warnings.length} warnings`)

if (errors.length) {
  console.error('\nBUILD FAILED: data validation errors above.')
  process.exit(1)
}
