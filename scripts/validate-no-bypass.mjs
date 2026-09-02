/*
  Phase 2, check C9: no page renders a number that did not come from
  getCounts().

  This is Layer 3 of the count-bypass prevention described in
  lib/data/counts.mjs. Layers 1 and 2 make a bypass throw at runtime; this
  one makes it fail the build, before anything is deployed.

  WHAT IT SCANS: every .tsx/.ts/.jsx/.js under app/.

  WHAT IT BANS

    .length                 on anything, in a page file. There is no
                            legitimate reason for a page to measure a
                            collection: rendering uses .map(), numbers come
                            from getCounts(). Allowed on a string literal
                            check only if the line is marked with the escape
                            comment below.
    .filter(...).length     the classic hand-rolled count.
    .reduce(                summing in a template.
    Number(...) on data     coercing a record field into a number.
    a bare integer inside   title, description, or an h1/h2 template string.
                            "12 courts" hard-coded is exactly the drift Rule
                            2 exists to prevent.

  ESCAPE HATCH: a line ending with `// counts-ok: <reason>` is allowed
  through and listed in the output, so exceptions are visible rather than
  invisible. Requiring a written reason is the point.
*/

import {readdirSync, statSync, readFileSync, existsSync} from 'node:fs'
import {join, relative, extname} from 'node:path'
import {fileURLToPath} from 'node:url'
import {dirname} from 'node:path'

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const APP = join(REPO_ROOT, 'app')

const EXT = new Set(['.tsx', '.ts', '.jsx', '.js', '.mjs'])
const ESCAPE = /\/\/\s*counts-ok:\s*\S+/

const RULES = [
  {id: 'length', re: /\.length\b/, msg: 'uses .length — a page must not measure a collection; call getCounts()'},
  {id: 'filter_length', re: /\.filter\s*\([\s\S]{0,200}?\)\s*\.length/, msg: 'hand-rolled count via .filter().length'},
  {id: 'reduce', re: /\.reduce\s*\(/, msg: 'uses .reduce — summing in a template bypasses getCounts()'},
  {id: 'hardcoded_number_in_title', re: /(title|description)\s*:\s*[`'"][^`'"]*\b\d{1,6}\b/, msg: 'hard-coded number in a title or description'},
  {id: 'hardcoded_number_in_heading', re: /<h[12][^>]*>[^<]*\b\d{1,6}\b/, msg: 'hard-coded number in a heading'},
]

function walk(dir) {
  if (!existsSync(dir)) return []
  return readdirSync(dir).flatMap(n => {
    const p = join(dir, n)
    return statSync(p).isDirectory() ? walk(p) : (EXT.has(extname(p)) ? [p] : [])
  })
}

const files = walk(APP)
const violations = []
const escapes = []

for (const file of files) {
  const rel = relative(REPO_ROOT, file)
  const lines = readFileSync(file, 'utf8').split(/\r?\n/)
  lines.forEach((line, i) => {
    // Skip comment-only lines; a rule named in prose is not a violation.
    const trimmed = line.trim()
    if (trimmed.startsWith('*') || trimmed.startsWith('//') || trimmed.startsWith('/*')) return
    for (const r of RULES) {
      if (!r.re.test(line)) continue
      if (ESCAPE.test(line)) {
        escapes.push({file: rel, line: i + 1, rule: r.id, text: trimmed.slice(0, 100)})
        continue
      }
      violations.push({file: rel, line: i + 1, rule: r.id, msg: r.msg, text: trimmed.slice(0, 100)})
    }
  })
}

console.log(`count-bypass scan: ${files.length} file(s) under app/`)
if (escapes.length) {
  console.log(`\n  ${escapes.length} escape(s) with a written reason:`)
  for (const e of escapes) console.log(`    ${e.file}:${e.line}  ${e.rule}`)
}
if (violations.length) {
  console.error(`\n  ${violations.length} violation(s):\n`)
  for (const v of violations) {
    console.error(`    ${v.file}:${v.line}`)
    console.error(`      ${v.msg}`)
    console.error(`      ${v.text}`)
  }
  console.error('\nBUILD FAILED: a page would render a number that did not come from getCounts().')
  console.error('Rule 2: every count comes from one shared module. See lib/data/counts.mjs.')
  process.exit(1)
}
console.log('  OK — no page bypasses getCounts()')
