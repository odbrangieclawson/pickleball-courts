#!/usr/bin/env node
/*
  What photograph does Wikipedia lead with for each published city, and can
  we publish it?

  Survey only. It downloads nothing and writes one report, because the pick
  needs a human eye before 35 images go on the site: an article's lead image
  is chosen to illustrate an encyclopaedia entry, not a court directory, and
  some of them will be wrong for us.

  Every candidate is reported with its licence, its author and the Commons
  page it came from, which is the same provenance the rest of the site
  demands of a court count.

    node scripts/images/survey-city-photos.mjs
*/
import {writeFileSync} from 'node:fs'
import {join} from 'node:path'
import {REPO_ROOT} from '../lib/load-csv.mjs'
import * as data from '../../lib/site/data.mjs'

const UA = 'FindPickleballCourtsBot/1.0 (https://pickleballcourtsguide.com; images@pickleballcourtsguide.com) node-fetch'
const sleep = ms => new Promise(r => setTimeout(r, ms))
const strip = s => String(s ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()

/*
  Wikimedia answers 429 when asked quickly, and the first version of this
  script caught that and reported "no lead image", which is a different and
  much more misleading thing. Retry on 429 with backoff, and let anything
  else throw so it is reported as the failure it is.
*/
async function get(url, tries = 4) {
  for (let i = 0; i < tries; i++) {
    const r = await fetch(url, {headers: {'User-Agent': UA, accept: 'application/json'}})
    if (r.status === 429) { await sleep(4000 * (i + 1)); continue }
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    return r.json()
  }
  throw new Error('rate limited after retries')
}

/* Wikipedia titles a city article "City, State" except for a handful that
   need no disambiguation. Try the qualified form first, then the bare name. */
async function summaryFor(city, stateName) {
  let lastErr = null
  for (const title of [`${city}, ${stateName}`, city]) {
    try {
      const j = await get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, '_'))}`)
      if (j.type === 'disambiguation') continue
      if (!j.originalimage?.source) continue
      return {title: j.title, image: j.originalimage.source, page: j.content_urls?.desktop?.page ?? null}
    } catch (e) { lastErr = e }
    await sleep(400)
  }
  if (lastErr) throw lastErr
  return null
}

async function commonsMeta(imageUrl) {
  /*
    The summary endpoint sometimes hands back a thumbnail URL, whose last
    path segment carries a "3840px-" style prefix that is not part of the
    file's name on Commons. Asking for that name returns "no such file",
    which the first version of this reported as "image is not on Commons".
  */
  const file = decodeURIComponent(imageUrl.split('/').pop().split('?')[0]).replace(/^\d+px-/, '')
  const j = await get(`https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent('File:' + file)}&prop=imageinfo&iiprop=extmetadata|url|size&format=json&origin=*`)
  const page = Object.values(j.query?.pages ?? {})[0]
  const info = page?.imageinfo?.[0]
  if (!info) return null
  const m = info.extmetadata ?? {}
  const v = k => (m[k] ? strip(m[k].value) : null)
  return {
    file,
    descriptionUrl: info.descriptionurl ?? null,
    width: info.width,
    height: info.height,
    licence: v('LicenseShortName'),
    licenceCode: v('License'),
    licenceUrl: v('LicenseUrl'),
    author: v('Artist'),
    credit: v('Credit'),
    description: v('ImageDescription')?.slice(0, 160) ?? null,
    restrictions: v('Restrictions'),
  }
}

/* Licences we will publish under. Anything else is reported and refused. */
const OK = /^(cc0|cc-by-\d|cc-by-sa-\d|pd|public domain)/i

const cities = data.publishedCities()
const rows = []
for (const c of cities) {
  const stateName = data.stateName(c.state)
  let row = {city: c.city, state: c.state, slug: c.slug, ok: false, why: null}
  try {
    const s = await summaryFor(c.city, stateName)
    if (!s) { row.why = 'no lead image on the Wikipedia article'; rows.push(row); continue }
    await sleep(700)
    const meta = await commonsMeta(s.image)
    if (!meta) { row.why = 'image is not on Commons'; rows.push(row); continue }
    row = {...row, article: s.title, articleUrl: s.page, imageUrl: s.image.split('?')[0], ...meta}
    const code = meta.licenceCode ?? meta.licence ?? ''
    row.ok = OK.test(code) || OK.test(meta.licence ?? '')
    if (!row.ok) row.why = `licence not usable: ${meta.licence ?? 'unknown'}`
    if (meta.restrictions) { row.ok = false; row.why = `restrictions: ${meta.restrictions}` }
  } catch (e) {
    row.why = e.message
  }
  rows.push(row)
  await sleep(900)
}

writeFileSync(join(REPO_ROOT, 'reports', 'city-photos-survey.json'), JSON.stringify(rows, null, 2))

const md = ['# City photo survey', '', 'Candidate lead image from the English Wikipedia article for each published city.', 'Nothing is downloaded. Review the pick before anything ships.', '']
md.push('| City | Usable | Licence | Author | File | Size |')
md.push('| --- | --- | --- | --- | --- | --- |')
for (const r of rows) {
  md.push(`| ${r.city}, ${r.state} | ${r.ok ? 'yes' : 'NO'} | ${r.licence ?? r.why ?? ''} | ${(r.author ?? '').slice(0, 40)} | ${(r.file ?? '').slice(0, 46)} | ${r.width ? r.width + 'x' + r.height : ''} |`)
}
writeFileSync(join(REPO_ROOT, 'reports', 'city-photos-survey.md'), md.join('\n') + '\n')

const good = rows.filter(r => r.ok).length
console.log(`\n${good} of ${rows.length} cities have a usable lead image.`)
for (const r of rows.filter(x => !x.ok)) console.log(`  NO  ${r.city}, ${r.state}: ${r.why}`)
console.log('\nWrote reports/city-photos-survey.md and .json')
