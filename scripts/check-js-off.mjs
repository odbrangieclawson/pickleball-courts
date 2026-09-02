#!/usr/bin/env node
/*
  Page Gate 2: every page renders its full content, links and schema in raw
  HTML with JavaScript disabled.

  HOW THIS CHECKS IT
  A browser with JavaScript disabled renders exactly the bytes the server
  sent and runs none of the scripts. So the test is: read the HTML the server
  will send, ignore every <script>, and assert the page is still complete.
  This script does that against the prerendered output of `next build`
  (.next/server/app/**.html), which for a static route IS the served body.

  It is deliberately file-based rather than browser-based: no browser, no
  network, no flake, runs in CI. `npm run check:js-off:http` covers the same
  assertions over a real HTTP response if you want belt and braces.

  WHAT IT ASSERTS PER PAGE
    1. An <h1> exists.
    2. Visible text (all markup and <script>/<style> removed) is present and
       above a floor. The floor is NOT the Rule 5 word band - band
       enforcement is per page type and arrives with the content phase. This
       is only a "did anything render at all" tripwire.
    3. At least one <a href> exists, so navigation does not depend on JS.
    4. At least one application/ld+json block exists, it parses, and a
       BreadcrumbList is among the graph (Page Gate 3 requires BreadcrumbList
       everywhere).

  WHAT IT DOES NOT ASSERT
    Word bands (Gate 4), count consistency (Gate 5), provenance (Gate 6) and
    the venue/city-specific schema types (rest of Gate 3). Those need data
    and content, which Phase 0 forbids. They are separate checks, not this
    one. This script passing is necessary for Gate 2, and says nothing about
    the other five.
*/

import {readFileSync, existsSync, readdirSync, statSync} from 'node:fs'
import {fileURLToPath} from 'node:url'
import {basename, dirname, join, relative} from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const APP_DIR = join(root, '.next', 'server', 'app')

// Framework-generated pages, not directory content. Reported, never failed on.
const SKIP = new Set(['_not-found.html', '_global-error.html'])

const MIN_VISIBLE_CHARS = 200

if (!existsSync(APP_DIR)) {
  console.error(
    'FAIL: no build output at .next/server/app\n' +
      'Run `npm run build` first - this check reads what the build produced.',
  )
  process.exit(1)
}

const walk = dir =>
  readdirSync(dir).flatMap(name => {
    const p = join(dir, name)
    return statSync(p).isDirectory()
      ? walk(p)
      : name.endsWith('.html')
        ? [p]
        : []
  })

const stripScripts = h =>
  h
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')

const visibleText = h =>
  stripScripts(h)
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const files = walk(APP_DIR)
if (!files.length) {
  console.error('FAIL: build output contains no HTML pages')
  process.exit(1)
}

let failed = 0
let checked = 0
const skipped = []

console.log('JavaScript-off render check (Page Gate 2)\n')

for (const file of files) {
  const rel = relative(root, file)
  const base = basename(file)

  if (SKIP.has(base)) {
    skipped.push(rel)
    continue
  }

  const html = readFileSync(file, 'utf8')
  const problems = []

  // 1. h1
  if (!/<h1[\s>]/i.test(html)) problems.push('no <h1>')

  // 2. visible text
  const text = visibleText(html)
  if (text.length < MIN_VISIBLE_CHARS)
    problems.push(
      `only ${text.length} chars of visible text (floor ${MIN_VISIBLE_CHARS})`,
    )

  // 3. links, outside of <script>
  const anchors = stripScripts(html).match(/<a\s[^>]*href=/gi) ?? []
  if (!anchors.length) problems.push('no <a href> links in raw HTML')

  // 4. JSON-LD with a BreadcrumbList
  const blocks = [
    ...html.matchAll(
      /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
    ),
  ]
  if (!blocks.length) {
    problems.push('no application/ld+json block')
  } else {
    let sawBreadcrumb = false
    for (const [, raw] of blocks) {
      let parsed
      try {
        parsed = JSON.parse(raw.trim())
      } catch (e) {
        problems.push(`JSON-LD does not parse: ${e.message}`)
        continue
      }
      const nodes = Array.isArray(parsed)
        ? parsed
        : (parsed['@graph'] ?? [parsed])
      if (nodes.some(n => n && n['@type'] === 'BreadcrumbList'))
        sawBreadcrumb = true
    }
    if (!sawBreadcrumb) problems.push('JSON-LD present but no BreadcrumbList')
  }

  checked++
  if (problems.length) {
    failed++
    console.log(`  FAIL  ${rel}`)
    for (const p of problems) console.log(`          - ${p}`)
  } else {
    console.log(
      `  PASS  ${rel}  (${text.length} chars, ${anchors.length} link(s), ${blocks.length} schema block(s))`,
    )
  }
}

for (const s of skipped) console.log(`  SKIP  ${s}  (framework page)`)

console.log(`\n${checked - failed}/${checked} page(s) pass Gate 2.`)
if (failed) {
  console.error(`${failed} page(s) would render incomplete with JS disabled.`)
  process.exit(1)
}
process.exit(0)
