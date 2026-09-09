/*
  Tests for lib/site/maps.mjs — the static-map maths.

  Worth testing because the failure mode is silent and expensive: a wrong
  projection or a wrong offset does not throw, it renders a map with the
  pins in the wrong place, and nobody notices until somebody drives to the
  wrong park. Every assertion here is about agreement between the tiles and
  the pins drawn over them.

  Run: npm test
*/

import test from 'node:test'
import assert from 'node:assert/strict'

import {staticMap, tilesNeeded, mappable, tilePath, TILE_SIZE} from '../../lib/site/maps.mjs'

const at = (latitude, longitude, extra = {}) => ({latitude, longitude, ...extra})

/* Wichita's Riverside Tennis Center and Edgemoor Park, roughly. */
const RIVERSIDE = at(37.7010, -97.3600, {slug: 'riverside', name: 'Riverside'})
const EDGEMOOR = at(37.7010, -97.2696, {slug: 'edgemoor', name: 'Edgemoor'})

test('a map of nothing is null, not an empty map', () => {
  assert.equal(staticMap([]), null)
  assert.equal(staticMap(null), null)
  /* Points with no geocode are not points. */
  assert.equal(staticMap([{name: 'No coordinates'}]), null)
})

test('venues without a geocode are dropped, not placed at zero', () => {
  const pts = [RIVERSIDE, {name: 'Ungeocoded'}, EDGEMOOR]
  assert.equal(mappable(pts).length, 2)
  const m = staticMap(pts)
  assert.equal(m.pins.length, 2, 'the third venue must not become a pin')
  /* (0,0) is in the Atlantic. Nothing may land there by accident. */
  for (const p of m.pins) {
    assert.ok(Number.isFinite(p.left) && Number.isFinite(p.top))
  }
})

test('a single venue takes the closest zoom offered', () => {
  const m = staticMap([RIVERSIDE], {width: 300, height: 220, maxZoom: 16})
  assert.equal(m.zoom, 16, 'zero-extent bounds fit at every zoom, so the cap wins')
  assert.equal(m.pins.length, 1)
})

test('the zoom is chosen so every pin fits inside the viewport', () => {
  const m = staticMap([RIVERSIDE, EDGEMOOR], {width: 720, height: 400, maxZoom: 16, padding: 56})
  for (const p of m.pins) {
    assert.ok(p.left >= 0 && p.left <= m.width, `pin left ${p.left} outside 0..${m.width}`)
    assert.ok(p.top >= 0 && p.top <= m.height, `pin top ${p.top} outside 0..${m.height}`)
  }
  assert.ok(m.zoom < 16, 'two venues 8km apart cannot both fit at zoom 16')
})

test('the tiles cover the whole viewport, with no gap at any edge', () => {
  const m = staticMap([RIVERSIDE, EDGEMOOR], {width: 720, height: 400})
  const left = Math.min(...m.tiles.map(t => t.left))
  const top = Math.min(...m.tiles.map(t => t.top))
  const right = Math.max(...m.tiles.map(t => t.left + TILE_SIZE))
  const bottom = Math.max(...m.tiles.map(t => t.top + TILE_SIZE))
  assert.ok(left <= 0, `gap at the left edge: first tile starts at ${left}`)
  assert.ok(top <= 0, `gap at the top edge: first tile starts at ${top}`)
  assert.ok(right >= m.width, `gap at the right edge: tiles end at ${right}, need ${m.width}`)
  assert.ok(bottom >= m.height, `gap at the bottom edge: tiles end at ${bottom}, need ${m.height}`)
})

test('west is left and north is up', () => {
  /* Riverside is west of Edgemoor and they share a latitude. If the
     projection is mirrored this is the assertion that catches it. */
  const m = staticMap([RIVERSIDE, EDGEMOOR], {width: 720, height: 400})
  const byName = Object.fromEntries(m.pins.map(p => [p.name, p]))
  assert.ok(byName.Riverside.left < byName.Edgemoor.left, 'the western venue must be further left')

  const north = at(38.2, -97.3, {name: 'North'})
  const south = at(37.2, -97.3, {name: 'South'})
  const n = staticMap([north, south], {width: 720, height: 400})
  const p = Object.fromEntries(n.pins.map(x => [x.name, x]))
  assert.ok(p.North.top < p.South.top, 'the northern venue must be higher up the page')
})

test('every tile a map references has a servable path under our own origin', () => {
  const m = staticMap([RIVERSIDE, EDGEMOOR])
  for (const t of m.tiles) {
    assert.equal(t.src, tilePath(t.z, t.x, t.y))
    assert.ok(t.src.startsWith('/map/tiles/'), 'tiles must be served from this site, never a tile server')
    assert.ok(t.x >= 0 && t.x < Math.pow(2, t.z), `tile x ${t.x} out of range at zoom ${t.z}`)
    assert.ok(t.y >= 0 && t.y < Math.pow(2, t.z), `tile y ${t.y} out of range at zoom ${t.z}`)
  }
})

test('attribution rides on every map, because ODbL requires it', () => {
  const m = staticMap([RIVERSIDE])
  assert.match(m.attribution.text, /OpenStreetMap/)
  assert.ok(m.attribution.href.startsWith('https://'))
})

test('tilesNeeded deduplicates across maps and ignores the null ones', () => {
  const a = staticMap([RIVERSIDE])
  const b = staticMap([RIVERSIDE])
  const one = tilesNeeded([a])
  const both = tilesNeeded([a, b, null])
  assert.deepEqual(both, one, 'the same map twice must not double the download')
  assert.ok(one.length > 0)
})
