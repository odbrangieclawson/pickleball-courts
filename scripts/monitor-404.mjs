#!/usr/bin/env node
/*
  404 monitor (Phase 6 deliverable 6).

  WHY THIS EXISTS AT ALL

  Pickleheads currently serves hard 404s on pages worth 1,475 and 463 visits
  a month. That is the single most expensive avoidable error in the whole
  competitive set, and decisions.md §3 was written to make it structurally
  impossible here: URLs are permanent, and a URL that must move gets a 301
  kept forever. This is the check that proves the rule is holding.

  WHAT IT CHECKS

  Every URL in the sitemap, plus every URL this monitor has EVER seen in a
  sitemap — that second part is the important one. A page that quietly
  disappears also disappears from the sitemap, so a monitor that only reads
  today's sitemap can never detect the failure it exists to catch. The
  known-URL ledger in data/monitor/known-urls.json is append-only for
  exactly that reason.

  MODES

    --built    (default) resolve against the built HTML in .next/server/app.
               Runs in CI with no server and no network.
    --live URL fetch each path from a running origin and check the status.
               This is the production mode; point it at the deployed site.

  ALERTING

  Non-zero exit on any non-200, plus a machine-readable report at
  reports/404-monitor.json. Wire the exit code to whatever pages someone:
  in CI it fails the build, and on a schedule it fails the cron job. The
  script deliberately does not embed a Slack or email integration — the
  alerting channel is a deployment decision, and an unconfigured webhook
  that silently swallows alerts is worse than an exit code.
*/

import {readFileSync, writeFileSync, existsSync, mkdirSync} from 'node:fs'
import {join} from 'node:path'
import {REPO_ROOT} from './lib/load-csv.mjs'
import {sitemapEntries} from '../lib/site/sitemap.mjs'

const args = process.argv.slice(2)
const liveIdx = args.indexOf('--live')
const LIVE = liveIdx >= 0 ? args[liveIdx + 1] : null

const LEDGER = join(REPO_ROOT, 'data', 'monitor', 'known-urls.json')
mkdirSync(join(REPO_ROOT, 'data', 'monitor'), {recursive: true})

const current = sitemapEntries().map(e => e.path)

/* The append-only ledger of every path we have ever published. */
let known = existsSync(LEDGER)
  ? JSON.parse(readFileSync(LEDGER, 'utf8'))
  : {note: 'Append-only. A path that leaves the sitemap stays here so its disappearance is detectable.', paths: {}}

const today = new Date().toISOString().slice(0, 10)
for (const p of current) {
  known.paths[p] ??= {first_seen: today}
  known.paths[p].last_in_sitemap = today
}
writeFileSync(LEDGER, JSON.stringify(known, null, 2) + '\n')

const all = Object.keys(known.paths).sort()
const inSitemap = new Set(current)

const APP = join(REPO_ROOT, '.next', 'server', 'app')
const builtStatus = path => {
  const rel = path === '/' ? 'index' : path.replace(/^\/|\/$/g, '')
  return existsSync(join(APP, `${rel}.html`)) ? 200 : 404
}

const results = []
for (const path of all) {
  let status
  if (LIVE) {
    try {
      const res = await fetch(new URL(path, LIVE), {redirect: 'manual'})
      status = res.status
    } catch (e) {
      status = `ERR ${e.message}`
    }
  } else {
    status = builtStatus(path)
  }
  results.push({
    path,
    status,
    in_sitemap: inSitemap.has(path),
    first_seen: known.paths[path].first_seen,
    last_in_sitemap: known.paths[path].last_in_sitemap,
  })
}

/*
  A 301 is a PASS. §3 permits exactly one response to a URL that must move —
  add a redirect and keep it forever — so a redirect is the rule working.
  A 404 or a 410 on a URL we have published is the failure this watches for.
*/
const ok = r => r.status === 200 || r.status === 301 || r.status === 308
const broken = results.filter(r => !ok(r))
const dropped = results.filter(r => !r.in_sitemap)

console.log(`\n=== 404 MONITOR ===`)
console.log(`mode:            ${LIVE ? `live against ${LIVE}` : 'built output'}`)
console.log(`URLs ever published: ${all.length}`)
console.log(`currently in sitemap: ${current.length}`)
console.log(`dropped from sitemap: ${dropped.length}`)
console.log(`non-200/301:          ${broken.length}\n`)

if (dropped.length) {
  console.log('Dropped from the sitemap since first seen (must still resolve):')
  for (const d of dropped) console.log(`  ${d.path}  status ${d.status}  first seen ${d.first_seen}`)
  console.log('')
}

if (broken.length) {
  console.log('BROKEN — a published URL that no longer resolves:')
  for (const b of broken) console.log(`  ${b.status}  ${b.path}  (first seen ${b.first_seen})`)
}

writeFileSync(join(REPO_ROOT, 'reports', '404-monitor.json'),
  JSON.stringify({checked_at: new Date().toISOString(), mode: LIVE ?? 'built', results}, null, 2) + '\n')

console.log(broken.length ? '\n404 MONITOR FAILED\n' : '\nALL PUBLISHED URLS RESOLVE\n')
process.exit(broken.length ? 1 : 0)
