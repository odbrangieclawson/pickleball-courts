#!/usr/bin/env node
/*
  Sweep Wikimedia Commons (and, tag-only, Flickr's public feed) for openly
  licensed photographs of every published venue.

  ============================================================
  WHY AN IMAGE IS TREATED LIKE A FACT
  ============================================================

  This site publishes nothing it cannot source, and a photograph is a claim
  twice over: that the picture shows this venue, and that we may publish it.
  A photo lifted from a city website or a search result fails the second
  claim - municipal sites are not public domain - and a stock photo of "a
  pickleball court" captioned with a venue name fails the first. So an image
  needs the same thing a court count needs: a source URL, a licence, an
  author, and a date it was checked.

  Commons is searched two ways per venue, because each misses things:

    geosearch   files geotagged within GEO_RADIUS_M of the resolved
                address. This is the strongest evidence a photo is OF the
                venue - the camera was standing in it - but many uploads
                carry no coordinates.
    search      full-text search for the venue name and the city. Catches
                un-geotagged uploads; also catches the wrong park with the
                same name, so the city is required in the query.

  Every hit is then read for its licence (extmetadata). Only Creative
  Commons and public-domain licences are kept; "All rights reserved" and
  anything unrecognised is listed as refused, with the reason.

  Flickr's API needs a key to filter by licence. Without one, the public
  feed can only be asked for tags, and it does not return a licence, so
  Flickr results are listed as LEADS ONLY - a human must open each one and
  read the licence before it can be used. That limit is stated, not hidden.

  USAGE
    node scripts/images/sweep-commons.mjs              # all published venues
    node scripts/images/sweep-commons.mjs tampa-fl     # one verified file

  Writes reports/images-sweep.json and reports/images-sweep.md.
*/

import {readFileSync, readdirSync, writeFileSync} from 'node:fs'
import {join} from 'node:path'
import {REPO_ROOT} from '../lib/load-csv.mjs'

const UA = 'FindPickleballCourts/1.0 (image provenance sweep; https://pickleball-courts-cyan.vercel.app)'
const COMMONS = 'https://commons.wikimedia.org/w/api.php'
const GEO_RADIUS_M = 350
const MIN_INTERVAL_MS = 350

const ACCEPTED_LICENCES = /^(cc-by(-sa)?(-[0-9.]+)?|cc0|pd|public domain|cc by(-sa)?( [0-9.]+)?)/i
const REFUSED_LICENCES = /(cc-by-nc|cc by-nc|nc-|-nd|noncommercial|all rights reserved|fair use|copyright)/i

const only = process.argv[2] ?? null

let last = 0
async function get(url) {
  const wait = MIN_INTERVAL_MS - (Date.now() - last)
  if (wait > 0) await new Promise(r => setTimeout(r, wait))
  last = Date.now()
  const res = await fetch(url, {headers: {'User-Agent': UA}})
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  return res.json()
}

const api = params => {
  const u = new URL(COMMONS)
  for (const [k, v] of Object.entries({format: 'json', ...params})) u.searchParams.set(k, v)
  return get(u.toString())
}

/* ---------------------------------------------------------------- */

const dir = join(REPO_ROOT, 'data', 'verified')
const files = readdirSync(dir).filter(f => f.endsWith('.json') && (!only || f.startsWith(only))).sort()

const venues = []
for (const f of files) {
  const doc = JSON.parse(readFileSync(join(dir, f), 'utf8'))
  for (const [slug, e] of Object.entries(doc.venues ?? {})) {
    const id = e.identity ?? {}
    venues.push({
      file: f, slug, name: e.patch?.name ?? id.name ?? slug,
      city: id.city ?? doc.city, state: id.state ?? doc.state,
      lat: id.latitude ?? null, lon: id.longitude ?? null,
    })
  }
}
console.log(`${venues.length} venues across ${files.length} files`)

const strip = s => String(s ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

async function imageInfo(titles) {
  const out = []
  for (let i = 0; i < titles.length; i += 50) {
    const batch = titles.slice(i, i + 50)
    const r = await api({
      action: 'query', titles: batch.join('|'), prop: 'imageinfo',
      iiprop: 'url|size|extmetadata',
      iiextmetadatafilter: 'License|LicenseShortName|LicenseUrl|Artist|ImageDescription|DateTimeOriginal|Credit|Attribution|Categories',
    })
    for (const p of Object.values(r.query?.pages ?? {})) {
      const ii = p.imageinfo?.[0]
      if (!ii) continue
      const m = ii.extmetadata ?? {}
      out.push({
        title: p.title,
        url: ii.descriptionurl, file_url: ii.url, width: ii.width, height: ii.height,
        licence: strip(m.LicenseShortName?.value ?? m.License?.value),
        licence_url: strip(m.LicenseUrl?.value) || null,
        author: strip(m.Artist?.value) || strip(m.Credit?.value) || null,
        description: strip(m.ImageDescription?.value).slice(0, 300) || null,
        taken: strip(m.DateTimeOriginal?.value) || null,
        categories: strip(m.Categories?.value).slice(0, 200) || null,
      })
    }
  }
  return out
}

const results = []
let n = 0
for (const v of venues) {
  n++
  const hits = new Map() // title -> how found
  try {
    if (v.lat != null && v.lon != null) {
      const g = await api({action: 'query', list: 'geosearch', gscoord: `${v.lat}|${v.lon}`, gsradius: GEO_RADIUS_M, gsnamespace: 6, gslimit: 50})
      for (const h of g.query?.geosearch ?? []) hits.set(h.title, {how: 'geotag', dist_m: Math.round(h.dist)})
    }
    const q = `"${v.name}" ${v.city}`
    const s = await api({action: 'query', list: 'search', srsearch: q, srnamespace: 6, srlimit: 20})
    for (const h of s.query?.search ?? []) if (!hits.has(h.title)) hits.set(h.title, {how: 'name search'})
  } catch (e) {
    results.push({...v, error: String(e.message)})
    console.log(`  ${String(n).padStart(3)} ${v.city}: ${v.name} — ERROR ${e.message}`)
    continue
  }
  const titles = [...hits.keys()].filter(t => /\.(jpe?g|png|webp|tiff?)$/i.test(t))
  const info = titles.length ? await imageInfo(titles) : []
  const candidates = info.map(i => {
    const text = `${i.title} ${i.description ?? ''} ${i.categories ?? ''}`.toLowerCase()
    const lic = i.licence ?? ''
    const accepted = ACCEPTED_LICENCES.test(lic) && !REFUSED_LICENCES.test(lic)
    return {
      ...i, ...hits.get(i.title),
      licence_ok: accepted,
      mentions_pickleball: /pickleball/.test(text),
      mentions_court: /\b(court|tennis)\b/.test(text),
      mentions_venue: text.includes(v.name.toLowerCase().split(' ')[0]),
    }
  })
  const usable = candidates.filter(c => c.licence_ok)
  results.push({...v, hits: candidates.length, usable: usable.length, pickleball: usable.filter(c => c.mentions_pickleball).length, candidates})
  console.log(`  ${String(n).padStart(3)} ${v.city}: ${v.name} — ${candidates.length} hit(s), ${usable.length} openly licensed, ${usable.filter(c => c.mentions_pickleball).length} mention pickleball`)
}

/*
  Flickr, tag-only, one probe per city. The public feed carries no licence,
  so each item's own page is fetched and the licence id read out of it.
  Flickr's ids: 0 all rights reserved; 1 BY-NC-SA; 2 BY-NC; 3 BY-NC-ND;
  4 BY; 5 BY-SA; 6 BY-ND; 7 no known restrictions; 8 US Government work;
  9 CC0; 10 Public Domain Mark. Only 4-10 are usable here.
*/
const FLICKR_LICENCES = {0: 'All rights reserved', 1: 'CC BY-NC-SA 2.0', 2: 'CC BY-NC 2.0', 3: 'CC BY-NC-ND 2.0', 4: 'CC BY 2.0', 5: 'CC BY-SA 2.0', 6: 'CC BY-ND 2.0', 7: 'No known copyright restrictions', 8: 'US Government work', 9: 'CC0', 10: 'Public Domain Mark'}
const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36'

async function flickrLicence(link) {
  const wait = MIN_INTERVAL_MS - (Date.now() - last)
  if (wait > 0) await new Promise(r => setTimeout(r, wait))
  last = Date.now()
  const res = await fetch(link, {headers: {'User-Agent': BROWSER_UA}})
  if (!res.ok) return {licence_id: null, licence: `HTTP ${res.status}`}
  const html = await res.text()
  const m = html.match(/"license":(\d+)/)
  const id = m ? Number(m[1]) : null
  const og = html.match(/<meta property="og:image" content="([^"]+)"/)
  return {licence_id: id, licence: id == null ? 'not read' : FLICKR_LICENCES[id] ?? `id ${id}`, licence_ok: id != null && id >= 4 && id <= 10, image: og?.[1] ?? null}
}

const cities = [...new Map(venues.map(v => [`${v.city}|${v.state}`, v])).values()]
const flickr = []
for (const c of cities) {
  try {
    const u = new URL('https://www.flickr.com/services/feeds/photos_public.gne')
    u.searchParams.set('tags', `pickleball,${c.city.toLowerCase().replace(/\s+/g, '')}`)
    u.searchParams.set('tagmode', 'all')
    u.searchParams.set('format', 'json')
    u.searchParams.set('nojsoncallback', '1')
    const r = await get(u.toString())
    const items = []
    for (const i of (r.items ?? []).slice(0, 20)) {
      const lic = await flickrLicence(i.link)
      items.push({title: i.title, link: i.link, author: i.author, date: i.date_taken, tags: i.tags, ...lic})
    }
    flickr.push({city: c.city, state: c.state, items})
    console.log(`  Flickr ${c.city}: ${items.length} item(s), ${items.filter(i => i.licence_ok).length} openly licensed`)
  } catch (e) {
    flickr.push({city: c.city, state: c.state, error: String(e.message)})
  }
}

const out = {swept: new Date().toISOString().slice(0, 10), geo_radius_m: GEO_RADIUS_M, venues: results, flickr}
writeFileSync(join(REPO_ROOT, 'reports', 'images-sweep.json'), JSON.stringify(out, null, 2) + '\n')

const withUsable = results.filter(r => r.usable > 0)
const withPb = results.filter(r => r.pickleball > 0)
const lines = [
  '# Openly licensed photographs of published venues — Commons and Flickr sweep', '',
  `Swept ${out.swept}. ${results.length} venues; Commons searched by geotag (${GEO_RADIUS_M} m of the resolved address) and by name.`, '',
  `- venues with at least one openly licensed Commons photo of any kind: **${withUsable.length}**`,
  `- venues where such a photo's title, description or categories mention pickleball: **${withPb.length}**`,
  `- Flickr: tag-only probe per city, licence unknown until each item is opened (no API key)`, '',
  '## What "usable" means here', '',
  'A Commons file counts as usable only if its licence reads as CC BY, CC BY-SA, CC0 or public domain. Non-commercial, no-derivatives and',
  'all-rights-reserved files are listed but marked refused. A usable licence still does not prove the photo shows these courts: every',
  'candidate must be opened and looked at before it is attached to a venue, and the ones that mention pickleball in their own text are',
  'the place to start.', '',
  '## Venues with a pickleball-mentioning open photo', '',
  ...(withPb.length ? withPb.flatMap(r => [
    `### ${r.name}, ${r.city} ${r.state}`,
    ...r.candidates.filter(c => c.licence_ok && c.mentions_pickleball).map(c => `- [${c.title}](${c.url}) — ${c.licence}${c.author ? `, ${c.author}` : ''}${c.taken ? `, taken ${c.taken}` : ''} — found by ${c.how}${c.dist_m != null ? ` (${c.dist_m} m)` : ''}${c.description ? ` — "${c.description.slice(0, 140)}"` : ''}`),
    '',
  ]) : ['_None._', '']),
  '## Venues with an open photo that does not mention pickleball', '',
  ...withUsable.filter(r => r.pickleball === 0).map(r => `- **${r.name}, ${r.city}** — ${r.usable} file(s): ${r.candidates.filter(c => c.licence_ok).slice(0, 4).map(c => `[${c.title.replace(/^File:/, '')}](${c.url}) (${c.licence}, ${c.how}${c.dist_m != null ? ` ${c.dist_m} m` : ''})`).join('; ')}${r.usable > 4 ? ` … +${r.usable - 4}` : ''}`),
  '',
  '## Venues with hits refused on licence', '',
  ...results.filter(r => r.hits > 0 && r.usable === 0).map(r => `- ${r.name}, ${r.city}: ${r.candidates.slice(0, 3).map(c => `${c.title.replace(/^File:/, '')} (${c.licence || 'no licence read'})`).join('; ')}`),
  '',
  `## Venues with no Commons hit at all (${results.filter(r => r.hits === 0 && !r.error).length})`, '',
  results.filter(r => r.hits === 0 && !r.error).map(r => `${r.name} (${r.city})`).join(', '), '',
  '## Flickr, tag probe per city, licence read from each photo page', '',
  'Tags searched: `pickleball` + the city name. A tag is a lead, not a venue match: each openly licensed item still has to be',
  'opened and matched to a published venue by what it shows and says.', '',
  ...flickr.map(f => f.error ? `- ${f.city}: error ${f.error}` : `- **${f.city}, ${f.state}**: ${f.items.length} item(s), ${f.items.filter(i => i.licence_ok).length} openly licensed${f.items.filter(i => i.licence_ok).length ? ' — ' + f.items.filter(i => i.licence_ok).map(i => `[${i.title || 'untitled'}](${i.link}) (${i.licence}, ${String(i.author).replace(/.*\("(.*)"\)/, '$1')})`).join('; ') : ''}`),
  '',
]
writeFileSync(join(REPO_ROOT, 'reports', 'images-sweep.md'), lines.join('\n'))
console.log(`\nWrote reports/images-sweep.json and reports/images-sweep.md — ${withUsable.length} venues with an open photo, ${withPb.length} mentioning pickleball.`)
