/*
  FETCH THE MAP TILES THE SITE ACTUALLY ASKS FOR.

  Run once per batch of new cities, never at request time:

      npm run map:tiles

  It asks the views which tiles their maps reference, subtracts what is
  already on disk, and downloads the difference into public/map/tiles.
  Tiles are then committed and served from our own origin, so no reader's
  browser ever contacts a tile server and there is no key and no bill.

  THE TILE USAGE POLICY IS A CONTRACT, NOT A SUGGESTION.
  https://operations.osmfoundation.org/policies/tiles/

  What that policy asks of a consumer, and what this script does:

    - A valid identifying User-Agent. Set below, naming the site and a
      contact route, so the OSMF can reach a human rather than block a
      mystery client.
    - No bulk downloading. This fetches ONE TILE AT A TIME with a pause
      between requests, and only tiles a published page renders. There is
      no crawl, no prefetch of neighbouring zooms and no speculative area.
    - Cache. Every tile is fetched exactly once, ever: the file is
      committed, and a re-run downloads nothing. Adding a city downloads
      only that city's tiles.
    - Attribution. Rendered on every map by lib/site/maps.mjs.

  The 1 req/s pace and the single sequential chain are the same discipline
  the Nominatim geocoding runs use, for the same reason: politeness to a
  volunteer-funded service is not optional, and two processes racing is
  how a project gets its whole IP range banned.

  If this ever needs to grow past a few thousand tiles, that is the signal
  to move to a paid tile provider or self-hosted rendering, not the signal
  to remove the sleep.
*/
import {mkdir, writeFile, access} from 'node:fs/promises'
import {dirname, join} from 'node:path'
import {REPO_ROOT} from '../lib/load-csv.mjs'
import {allCityParams, cityView, allLeafParams, venueView} from '../../lib/site/views.mjs'
import {tilesNeeded, TILE_UPSTREAM, tilePath} from '../../lib/site/maps.mjs'

const UA = 'FindPickleballCourts/1.0 (static site tile cache; +https://github.com/odbrangieclawson/pickleball-courts)'
const PAUSE_MS = 1100
const sleep = ms => new Promise(r => setTimeout(r, ms))

const exists = async p => { try { await access(p); return true } catch { return false } }

async function main() {
  /* Ask the pages, do not guess. If a map's size or zoom changes, the
     needed set changes with it and this stays correct without editing. */
  const maps = []
  for (const p of allCityParams()) {
    const v = cityView(p.state, p.city)
    if (v?.map) maps.push(v.map)
  }
  for (const p of allLeafParams()) {
    const v = venueView(p.state, p.city, p.slug)
    if (v?.map) maps.push(v.map)
  }

  const wanted = tilesNeeded(maps)
  console.log(`${maps.length} map(s) reference ${wanted.length} distinct tile(s).`)

  const missing = []
  for (const t of wanted) {
    const file = join(REPO_ROOT, 'public', tilePath(t.z, t.x, t.y))
    if (!(await exists(file))) missing.push({...t, file})
  }

  if (!missing.length) {
    console.log('Every tile is already on disk. Nothing to download.')
    return
  }

  const mins = Math.ceil((missing.length * PAUSE_MS) / 60000)
  console.log(`${missing.length} to fetch, one at a time, about ${mins} minute(s).\n`)

  let ok = 0
  const failed = []
  for (const [i, t] of missing.entries()) {
    const url = TILE_UPSTREAM(t.z, t.x, t.y)
    try {
      const res = await fetch(url, {headers: {'User-Agent': UA, Accept: 'image/png'}})
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const buf = Buffer.from(await res.arrayBuffer())
      /* A tile server under load can answer 200 with an error page. A PNG
         starts with the eight-byte signature; anything else is not a tile
         and must not be written as one. */
      if (buf.length < 8 || buf[0] !== 0x89 || buf[1] !== 0x50) {
        throw new Error(`not a PNG (${buf.length} bytes)`)
      }
      await mkdir(dirname(t.file), {recursive: true})
      await writeFile(t.file, buf)
      ok++
      if ((i + 1) % 25 === 0 || i === missing.length - 1) {
        console.log(`  ${i + 1}/${missing.length} …`)
      }
    } catch (e) {
      failed.push({tile: `${t.z}/${t.x}/${t.y}`, why: String(e.message ?? e)})
    }
    /* Pause after every request including the last: the next run should
       not start hot either. */
    await sleep(PAUSE_MS)
  }

  console.log(`\nFetched ${ok}. Failed ${failed.length}.`)
  for (const f of failed.slice(0, 20)) console.log(`  MISS ${f.tile} — ${f.why}`)
  if (failed.length) {
    console.log('\nRe-run to retry only the misses; everything already on disk is skipped.')
    process.exitCode = 1
  }
}

main().catch(e => { console.error(e); process.exit(1) })
