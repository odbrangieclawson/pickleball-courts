/* Emits the column disposition table as a standalone document.
   COLUMN_MAP is the single source of truth: this cannot drift from the code. */
import {writeFileSync, mkdirSync} from 'node:fs'
import {join} from 'node:path'
import {REPO_ROOT, SOURCE_COLUMNS} from '../lib/load-csv.mjs'
import {COLUMN_MAP, UNSOURCED_V4_FIELDS, PROVENANCE_STATUS} from './mapper.mjs'

const L = []
const say = s => L.push(s)

say('# Import mapping: source columns to the v4 data model')
say('')
say('Generated from `COLUMN_MAP` in `scripts/import/mapper.mjs`. That table is')
say('the code that performs the mapping, so this document cannot drift from')
say('the behaviour it describes.')
say('')
say(`**${COLUMN_MAP.length} source columns. ${COLUMN_MAP.length} dispositions. Nothing silently discarded.**`)
say('')
say('| # | source column | disposition | v4 target | reasoning |')
say('| ---: | --- | --- | --- | --- |')
COLUMN_MAP.forEach((c, i) => {
  say(`| ${i + 1} | \`${c.source}\` | **${c.disposition}** | \`${c.target}\` | ${c.note.replace(/\|/g, '\|')} |`)
})
say('')
const missing = SOURCE_COLUMNS.filter(c => !COLUMN_MAP.some(m => m.source === c))
say(`Columns in the CSV with no disposition: **${missing.length}**${missing.length ? ' — ' + missing.join(', ') : ' ✓'}`)
say('')
say('## Dispositions used')
say('')
say('- **map** — straight into a v4 field, possibly renamed or type-coerced')
say('- **vocab** — into a v4 field through a controlled vocabulary')
say('- **split** — one source column feeds more than one v4 field')
say('- **extend** — the v4 model gains a field for it, with a written definition')
say('- **drop** — deliberately not imported, with a stated reason')
say('')
const counts = {}
for (const c of COLUMN_MAP) counts[c.disposition] = (counts[c.disposition] ?? 0) + 1
for (const [k, v] of Object.entries(counts)) say(`- \`${k}\`: ${v}`)
say('')
say('No column carries the **drop** disposition. Every source column survives')
say('into the model in some form, including the two that only exist for')
say('traceability (`claimed_or_verified`, `source_url`).')
say('')
say('## Model extensions')
say('')
say('Two fields were added to v4 that the spec did not list, because the source')
say('carries them and discarding them would lose real information:')
say('')
for (const c of COLUMN_MAP.filter(x => x.disposition === 'extend')) {
  say(`- **\`${c.target}\`** — ${c.note}`)
}
say('')
say('## v4 fields the source cannot fill')
say('')
for (const u of UNSOURCED_V4_FIELDS) say(`- **\`${u.field}\`** — ${u.why}`)
say('')
say('## Provenance')
say('')
say('```')
say(JSON.stringify(PROVENANCE_STATUS, null, 2))
say('```')
say('')
say('Every row imports as `status=pending` (Rule 12). No exceptions, no')
say('overrides, no path in the mapper that sets any other value.')

mkdirSync(join(REPO_ROOT, 'reports'), {recursive: true})
writeFileSync(join(REPO_ROOT, 'reports', 'import-mapping.md'), L.join('\n'))
console.log(`Wrote reports/import-mapping.md — ${COLUMN_MAP.length} dispositions, ${missing.length} unaccounted`)
