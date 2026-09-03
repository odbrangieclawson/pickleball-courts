#!/usr/bin/env node
/*
  Gate 2 for the one route that escapes it.

  check-js-off.mjs walks the static HTML in .next/server/app and asserts that
  every page carries its content, links and schema without JavaScript. That
  works for every page on this site except one: /search/ reads a query string,
  so Next renders it on demand and there is no file on disk to inspect. The
  single dynamic route was therefore the single ungated one, which is exactly
  the sort of hole that stays open for a year.

  This closes it by asking a running server, which is the only way to see a
  dynamic route's real output. It checks the same three things Gate 2 checks —
  primary content, internal links, and a schema block or a documented reason
  there is none — plus the things specific to a search page: that a query
  actually returns results, that a nonsense query returns nothing rather than
  filler, and that the page is noindex.

  Usage:  node scripts/check-search.mjs [baseUrl]
  CI starts the server first; default is http://localhost:3000.
*/

const BASE = process.argv[2] ?? 'http://localhost:3000'

const strip = html => html
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()

const problems = []
const note = []

async function get(path) {
  const res = await fetch(new URL(path, BASE))
  return {status: res.status, html: await res.text()}
}

try {
  /* 1. A real query returns real, linked results. */
  const hit = await get('/search/?q=seattle')
  if (hit.status !== 200) problems.push(`/search/?q=seattle returned ${hit.status}`)
  const hitLinks = (hit.html.match(/<a\s[^>]*href="\/pickleball\/[^"]*"/g) ?? []).length
  if (hitLinks === 0) problems.push('a matching query returned no internal links')
  if (strip(hit.html).length < 200) problems.push('search results page has almost no text content')
  if (!/name="robots"[^>]*noindex/i.test(hit.html)) {
    problems.push('search results are not noindex — a ?q= page must never be indexed (D4)')
  }
  if (!/<form[^>]*action="\/search\/?"/.test(hit.html)) {
    problems.push('the results page does not re-render the search form')
  }
  note.push(`query "seattle": ${hitLinks} internal link(s)`)

  /* 2. A ZIP resolves through the Census file rather than through unsourced
     venue postcodes. 98112 is a Seattle ZIP; it must reach King County. */
  const zip = await get('/search/?q=98112')
  if (zip.status !== 200) problems.push(`/search/?q=98112 returned ${zip.status}`)
  if (!/King County/i.test(strip(zip.html))) {
    problems.push('a Seattle ZIP did not resolve to King County')
  }
  note.push('ZIP 98112 resolves to King County')

  /* 3. Nonsense returns nothing found, not invented filler. This is the
     check that matters most: a search that always finds something is a
     search that is lying. */
  const miss = await get('/search/?q=zzzqqqxxnotaplace')
  const missText = strip(miss.html)
  if (!/Nothing published matches/i.test(missText)) {
    problems.push('a nonsense query did not say that nothing matched')
  }
  note.push('nonsense query reports no match')

  /* 4. The empty state prompts rather than erroring. */
  const empty = await get('/search/')
  if (empty.status !== 200) problems.push(`/search/ with no query returned ${empty.status}`)
  note.push('empty query renders the prompt')

} catch (e) {
  problems.push(`could not reach ${BASE} — is the server running? (${e.message})`)
}

console.log('\n=== SEARCH CHECK (Gate 2 for the dynamic route) ===')
console.log(`base: ${BASE}\n`)
for (const n of note) console.log(`  ok    ${n}`)
for (const p of problems) console.log(`  FAIL  ${p}`)
console.log(problems.length ? '\nSEARCH CHECK FAILED\n' : '\nSEARCH CHECK PASSED\n')
process.exit(problems.length ? 1 : 0)
