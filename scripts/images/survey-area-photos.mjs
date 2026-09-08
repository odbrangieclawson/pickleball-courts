#!/usr/bin/env node
/*
  Candidate photographs for the county and state pages.

  Survey only, like the city one, and for a sharper reason: a county
  article's lead image is very often a LOCATOR MAP or a courthouse, and a
  state's is very often a MONTAGE stitched from several files whose author
  field is then a run-on list. Both look wrong as a page hero and the second
  produces exactly the unreadable credit Louisville and Rockville had.

  So every candidate is scored and the unsuitable kinds are named rather
  than quietly published. Nothing is downloaded.

    node scripts/images/survey-area-photos.mjs
*/
import {writeFileSync} from 'node:fs'
import {join} from 'node:path'
import {REPO_ROOT} from '../lib/load-csv.mjs'
import * as data from '../../lib/site/data.mjs'
import {buildLinkGraph} from '../../lib/site/links.mjs'
import {statePagePublishes} from '../../lib/site/views.mjs'

const UA = 'FindPickleballCourtsBot/1.0 (https://pickleballcourtsguide.com; images@pickleballcourtsguide.com) node-fetch'
const sleep = ms => new Promise(r => setTimeout(r, ms))
const strip = s => String(s ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()

async function api(url, tries = 5) {
  for (let i = 0; i < tries; i++) {
    const r = await fetch(url, {headers: {'User-Agent': UA, accept: 'application/json'}})
    if (r.status === 429) { await sleep(4000 * (i + 1)); continue }
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    return r.json()
  }
  throw new Error('rate limited after retries')
}

/* The kinds of file that are technically the article's lead image and
   completely wrong as a photograph of a place. */
const UNSUITABLE = [
  {rx: /map|locator|highlighting|\.svg$/i, why: 'a map or diagram'},
  {rx: /montage|collage|infobox|composite/i, why: 'a montage, whose credit is a list of authors'},
  {rx: /seal|flag|coat.of.arms|logo/i, why: 'a seal, flag or logo'},
]

const OK = /^(cc0|cc-by-\d|cc-by-sa-\d|pd|public domain)/i

async function summaryFor(title) {
  const j = await api(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, '_'))}`)
  if (j.type === 'disambiguation') return null
  if (!j.originalimage?.source) return null
  return {title: j.title, image: j.originalimage.source}
}

async function commonsMeta(imageUrl) {
  const file = decodeURIComponent(imageUrl.split('/').pop().split('?')[0]).replace(/^\d+px-/, '')
  const j = await api(`https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent('File:' + file)}&prop=imageinfo&iiprop=extmetadata|url|size&format=json`)
  const info = Object.values(j.query?.pages ?? {})[0]?.imageinfo?.[0]
  if (!info) return null
  const m = info.extmetadata ?? {}
  const v = k => (m[k] ? strip(m[k].value) : null)
  return {
    file, width: info.width, height: info.height,
    licence: v('LicenseShortName'), licenceCode: v('License'),
    author: v('Artist'), restrictions: v('Restrictions'),
  }
}

/* Every county with a published page, and every published state. */
const cities = data.publishedCities().map(c => ({...c, ...data.city(c.state, c.slug)}))
const graph = buildLinkGraph(cities.flatMap(c => c.venues))

const targets = []
for (const c of graph.publishedCounties.values()) {
  targets.push({kind: 'county', key: `${c.state}/${c.county}`, article: `${c.county} County, ${data.stateName(c.state)}`})
}
for (const [st] of graph.publishedStates) {
  if (!statePagePublishes(st)) continue
  targets.push({kind: 'state', key: st, article: data.stateName(st)})
}

const rows = []
for (const t of targets) {
  const row = {...t, ok: false, why: null}
  try {
    const s = await summaryFor(t.article)
    if (!s) { row.why = 'no lead image'; rows.push(row); continue }
    await sleep(700)
    const meta = await commonsMeta(s.image)
    if (!meta) { row.why = 'not on Commons'; rows.push(row); continue }
    Object.assign(row, meta)
    const bad = UNSUITABLE.find(u => u.rx.test(meta.file))
    if (bad) row.why = bad.why
    else if (!OK.test(meta.licenceCode ?? '') && !OK.test(meta.licence ?? '')) row.why = `licence ${meta.licence}`
    else if (meta.restrictions) row.why = `restrictions: ${meta.restrictions}`
    else if (meta.width < 1200 || meta.width <= meta.height) row.why = 'too small or portrait'
    else row.ok = true
  } catch (e) { row.why = e.message }
  rows.push(row)
  await sleep(1500)
}

writeFileSync(join(REPO_ROOT, 'reports', 'area-photos-survey.json'), JSON.stringify(rows, null, 2))

const md = ['# County and state photo survey', '', 'Lead image from the English Wikipedia article for each published county and state.', 'Nothing downloaded. A county article usually leads with a map and a state with a montage, so most of these need a hand-picked replacement.', '']
md.push('| Area | Kind | Usable | Why not | Licence | File |')
md.push('| --- | --- | --- | --- | --- | --- |')
for (const r of rows) md.push(`| ${r.article} | ${r.kind} | ${r.ok ? 'yes' : 'NO'} | ${r.ok ? '' : (r.why ?? '')} | ${r.licence ?? ''} | ${(r.file ?? '').slice(0, 44)} |`)
writeFileSync(join(REPO_ROOT, 'reports', 'area-photos-survey.md'), md.join('\n') + '\n')

const good = rows.filter(r => r.ok)
console.log(`\n${good.length} of ${rows.length} areas have a usable lead image.`)
for (const r of rows.filter(x => !x.ok)) console.log(`  NO  ${r.article}: ${r.why}`)
console.log('\nWrote reports/area-photos-survey.md and .json')
