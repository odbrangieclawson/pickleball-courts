#!/usr/bin/env node
/*
  Download the city and court photographs, and record where each one came
  from.

  WHY THESE IMAGES AND NOT ANY OTHERS

  Every file here comes from Wikimedia Commons under a licence that permits
  commercial republication with attribution. That is a licence, not a
  courtesy: a credit line on an image nobody licensed to us would not make
  publishing it lawful, and this project does not publish a fact without a
  source or an image without one either. The author, the licence, the
  licence URL and the Commons file page are written into
  data/images/photos.json and rendered under the picture.

  WHAT A CITY PHOTO CLAIMS, AND WHAT A COURT PHOTO DOES NOT

  A photograph of Seattle on the Seattle card is a photograph of Seattle, so
  it needs no disclaimer. A photograph of somebody else's pickleball courts
  on a Bitter Lake Playfield card is NOT a photograph of Bitter Lake
  Playfield, so those keep the "No photo yet" marker they have always had.
  The client asked for variety and colour, which this gives; what it must
  never give is the impression that we have been to 275 courts.

    node scripts/images/fetch-photos.mjs
*/
import {writeFileSync, mkdirSync, existsSync, readFileSync} from 'node:fs'
import {join} from 'node:path'
import sharp from 'sharp'
import {REPO_ROOT} from '../lib/load-csv.mjs'
import * as data from '../../lib/site/data.mjs'

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

/* Everything we need to publish an image legally and honestly. */
async function metaFor(fileName) {
  const j = await api(`https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent('File:' + fileName)}&prop=imageinfo&iiprop=extmetadata|url|size&format=json`)
  const page = Object.values(j.query?.pages ?? {})[0]
  const info = page?.imageinfo?.[0]
  if (!info) throw new Error(`not on Commons: ${fileName}`)
  const m = info.extmetadata ?? {}
  const v = k => (m[k] ? strip(m[k].value) : null)
  return {
    file: fileName,
    source: info.url,
    filePage: info.descriptionurl,
    author: v('Artist'),
    licence: v('LicenseShortName'),
    licenceCode: v('License'),
    licenceUrl: v('LicenseUrl'),
    restrictions: v('Restrictions'),
  }
}

/*
  Displayed author, with the Commons string kept for the record.

  Commons treats a space and an underscore in a file name as the same
  character, and this project's own records use both: the survey stores the
  underscored form, the overrides above are written with spaces. Matching on
  the raw string silently missed, so the key is normalised first.
*/
const fileKey = f => String(f ?? '').replace(/_/g, ' ')
const authorFor = meta => {
  const override = Object.entries(AUTHOR_OVERRIDES)
    .find(([k]) => fileKey(k) === fileKey(meta.file))?.[1]
  return {
    author: override ?? meta.author,
    authorRaw: override ? meta.author : undefined,
  }
}

const OK = /^(cc0|cc-by-\d|cc-by-sa-\d|pd|public domain)/i

/* The binary host rate limits too, and harder than the API does. */
async function grab(meta, outPath, width, tries = 5) {
  let buf = null
  for (let i = 0; i < tries; i++) {
    const r = await fetch(meta.source, {headers: {'User-Agent': UA}})
    if (r.status === 429) { await sleep(5000 * (i + 1)); continue }
    if (!r.ok) throw new Error(`download ${r.status}`)
    buf = Buffer.from(await r.arrayBuffer())
    break
  }
  if (!buf) throw new Error('download rate limited after retries')
  await sharp(buf)
    .rotate()
    .resize({width, withoutEnlargement: true})
    .jpeg({quality: 78, mozjpeg: true, progressive: true})
    .toFile(outPath)
  const s = await sharp(outPath).metadata()
  return {width: s.width, height: s.height}
}

/*
  Overrides. The survey's automatic pick is an article's lead image, chosen
  to illustrate an encyclopaedia entry rather than a directory, and two of
  them were wrong for us: Madison led with an aerial of the university
  campus, and Mount Pleasant with Boone Hall, a former plantation. Both are
  replaced with a photograph of the place a visitor would recognise.
*/
const CITY_OVERRIDES = {
  'WI/madison': 'Madison, Wisconsin skyline 10-26-2011 7485 (6933357277).jpg',
  'SC/mount-pleasant': 'Shem Creek, Mount Pleasant, SC.jpg',
  /*
    These three were never surveyed: Wikimedia rate limited that run, which
    reported them as having no candidate. Picked by hand from Commons rather
    than re-running the survey for three rows.
  */
  'TX/austin': 'Austin, Texas Skyline 2018.jpg',
  'NV/las-vegas': 'Las Vegas Strip at night, 2012.jpg',
  'IL/naperville': 'Naperville, Illinois Riverwalk Downtown Water Street.jpg',
  /* The article's lead image is 'Copyrighted free use', a non-standard tag
     this project would rather not rely on. A plain CC photograph instead. */
  'CA/long-beach': 'Downtown, Long Beach from Queen Mary (Dusk).JPG',
  /*
    Rockville's lead image is a montage built from several files, so Commons
    records its author as a run-on list of contributors and filenames. The
    credit was accurate and unreadable. One photograph by one photographer
    instead.
  */
  'MD/rockville': 'Rockville MD Town Center 2021-11-27 11-12-19 1.jpg',
}

/*
  ATTRIBUTION TIDIED, NEVER INVENTED.

  Commons stores the author as free text and some of it is malformed. This
  file's Artist field reads, verbatim:

    "Charles Delano of LouisvilleUSACE - Louisville District of the US Army
     Corp of Engineers"

  which is a photographer's name run into the Flickr account name
  ("louisvilleusace") with no separator, plus a misspelling of Corps. It is
  the right people, written badly, and rendering it as-is put an unreadable
  credit and a stray dash on the Louisville page.

  So the displayed credit is corrected here and the untouched Commons string
  is kept beside it as authorRaw, which is what makes this a presentation
  fix rather than a rewrite of somebody's attribution. Only add an entry
  where the correct reading is not in doubt.
*/
const AUTHOR_OVERRIDES = {
  'Louisville Skyline 2021 (3).jpg': 'Charles Delano, U.S. Army Corps of Engineers Louisville District',
}

/*
  Court photographs for the venue cards, discovered rather than listed. An
  earlier version hardcoded filenames read off a search result and three of
  them did not exist, because a search result's title is not always the
  file's name. Asking Commons for them each run also means the set can grow
  as people upload more.

  None of these is a photograph of any venue on this site, which is why the
  "No photo yet" marker stays on every one.
*/
/*
  Not every file matching "pickleball court" shows one. The first run took
  seven frames of the Round Rock courts DURING CONSTRUCTION, so a third of
  the venue cards were a muddy field with survey pegs in it. A search match
  is not a usable picture, and there is no way to tell from the metadata, so
  the ones that fail on sight are named here.
*/
const COURT_DENY = [
  /^RR Pickleball Court/i,      // a construction site, not a court
  /construction|groundbreaking/i,
  /paddle\b/i,                  // equipment close-ups, not a court
  /*
    One shoot of a tiled patio with a portable net, uploaded under five
    slightly different names, so the series cap below could not group them.
    Five of fourteen cards came from it. Denied outright; the search has
    forty-odd usable files and can spare them.
  */
  /^Outdoor (blue|white|temporary).*net/i,
  /*
    Rejected on sight after looking at the set as a contact sheet, which is
    the only way to catch these. The Metairie frames are shot from across a
    road, one of them centred on an electricity substation behind a "Danger,
    keep out" sign; Salinas Park is a distant roadside view with the court
    barely visible; and the Harmony of the Seas court is on a cruise ship,
    which is not what somebody looking for a park expects to see.
  */
  /Metairie/i,
  /Salinas Park/i,
  /Harmony of the Seas/i,
]

async function findCourtFiles(want = 14) {
  const j = await api('https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=' +
    encodeURIComponent('pickleball court') +
    '&gsrnamespace=6&gsrlimit=50&prop=imageinfo&iiprop=extmetadata|size|url&format=json')
  const pages = Object.values(j.query?.pages ?? {})
  const out = []
  const seen = new Map()
  for (const p of pages) {
    const i = p.imageinfo?.[0]
    if (!i) continue
    const m = i.extmetadata ?? {}
    const lic = m.LicenseShortName ? strip(m.LicenseShortName.value) : ''
    const code = m.License ? strip(m.License.value) : ''
    if (!OK.test(code) && !OK.test(lic)) continue
    /* extmetadata carries a Restrictions KEY on almost every file, usually
       with an empty value. Testing the object rather than its value skipped
       every candidate and reported "0 court photos" with no error. */
    if (m.Restrictions && strip(m.Restrictions.value)) continue
    /* Landscape and large enough to crop into a card without softening. */
    if (i.width < 1400 || i.width <= i.height) continue
    const name = p.title.replace(/^File:/, '')
    if (COURT_DENY.some(rx => rx.test(name))) continue
    /*
      Cap each series at two. Commons uploads come in runs from one shoot,
      and the first curated set took five near-identical frames of the same
      tiled court, which defeats the whole point of varying the picture.
      The series key is the name with trailing numbering removed.
    */
    const series = name.toLowerCase().replace(/\.[a-z]+$/, '').replace(/[\s\d]+$/, '').slice(0, 26)
    const taken = seen.get(series) ?? 0
    if (taken >= 2) continue
    seen.set(series, taken + 1)
    out.push(name)
    if (out.length >= want) break
  }
  return out
}

const CITY_DIR = join(REPO_ROOT, 'public', 'city')
const COURT_DIR = join(REPO_ROOT, 'public', 'court')
mkdirSync(CITY_DIR, {recursive: true})
mkdirSync(COURT_DIR, {recursive: true})
mkdirSync(join(REPO_ROOT, 'data', 'images'), {recursive: true})

const survey = JSON.parse(readFileSync(join(REPO_ROOT, 'reports', 'city-photos-survey.json'), 'utf8'))
const byCity = new Map(survey.map(r => [`${r.state}/${r.slug}`, r]))

const prevPath = join(REPO_ROOT, 'data', 'images', 'photos.json')
const prev = existsSync(prevPath) ? JSON.parse(readFileSync(prevPath, 'utf8')) : {cities: {}, courts: []}
const out = {retrieved: new Date().toISOString().slice(0, 10), cities: {...prev.cities}, courts: [...prev.courts]}
const failed = []

/* ---- cities ---- */
for (const c of data.publishedCities()) {
  const key = `${c.state}/${c.slug}`
  if (out.cities[key] && existsSync(join(REPO_ROOT, 'public', out.cities[key].src.slice(1)))) { console.log(`  skip  ${key}`); continue }
  const chosen = CITY_OVERRIDES[key] ?? byCity.get(key)?.file
  if (!chosen) { failed.push(`${key}: no candidate`); continue }
  try {
    const meta = await metaFor(chosen)
    if (!OK.test(meta.licenceCode ?? '') && !OK.test(meta.licence ?? '')) throw new Error(`licence ${meta.licence}`)
    if (meta.restrictions) throw new Error(`restrictions: ${meta.restrictions}`)
    const rel = `/city/${c.state.toLowerCase()}-${c.slug}.jpg`
    const dims = await grab(meta, join(REPO_ROOT, 'public', rel.slice(1)), 1400)
    out.cities[key] = {
      src: rel, ...dims,
      /* The place in words, so the credits page can name it rather than
         printing the internal "ST/slug" key at a reader. */
      label: `${c.city}, ${c.state}`,
      alt: `${c.city}, ${c.state}.`,
      ...authorFor(meta), licence: meta.licence, licenceUrl: meta.licenceUrl,
      filePage: meta.filePage, file: meta.file,
      overridden: Boolean(CITY_OVERRIDES[key]),
    }
    console.log(`  city  ${key.padEnd(24)} ${meta.licence}`)
  } catch (e) {
    failed.push(`${key}: ${e.message}`)
  }
  await sleep(1500)
}

/* ---- courts ---- */
let n = out.courts.length
const COURT_FILES = await findCourtFiles()
console.log(`
court candidates: ${COURT_FILES.length}`)
for (const f of COURT_FILES) {
  try {
    if (out.courts.some(x => x.file === f)) { continue }
    const meta = await metaFor(f)
    if (!OK.test(meta.licenceCode ?? '') && !OK.test(meta.licence ?? '')) throw new Error(`licence ${meta.licence}`)
    if (meta.restrictions) throw new Error(`restrictions: ${meta.restrictions}`)
    n += 1
    const rel = `/court/${String(n).padStart(2, '0')}.jpg`
    const dims = await grab(meta, join(REPO_ROOT, 'public', rel.slice(1)), 1400)
    out.courts.push({
      src: rel, ...dims,
      ...authorFor(meta), licence: meta.licence, licenceUrl: meta.licenceUrl,
      filePage: meta.filePage, file: meta.file,
    })
    console.log(`  court ${rel.padEnd(24)} ${meta.licence}`)
  } catch (e) {
    failed.push(`court ${f}: ${e.message}`)
  }
  await sleep(1500)
}

writeFileSync(join(REPO_ROOT, 'data', 'images', 'photos.json'), JSON.stringify(out, null, 2) + '\n')

console.log(`\n${Object.keys(out.cities).length} city photos, ${out.courts.length} court photos.`)
if (failed.length) { console.log('\nnot taken:'); failed.forEach(f => console.log('  ' + f)) }
console.log('\nWrote data/images/photos.json')
