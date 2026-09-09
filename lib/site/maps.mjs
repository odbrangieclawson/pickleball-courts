/*
  STATIC MAPS, BUILT AT BUILD TIME.

  A court directory without a map is a list. This is the map, and it is
  made of nothing but <img> tags.

  WHY NOT A MAP LIBRARY. Rule 1: every page renders its full content with
  JavaScript disabled. Leaflet, MapLibre and every embed worth having are
  scripts, so on a JS-off render they leave a hole exactly where the map
  should be. A grid of positioned <img> tiles with absolutely-positioned
  pins over it is a real map, is styleable, and is whole with JS off.

  WHY NOT A TILE API. A keyed static-map endpoint bills per render and
  would have to be called for every one of the pages this site prerenders.
  A visitor-side embed sends every reader's IP to a third party. Tiles are
  instead fetched ONCE by scripts/maps/fetch-tiles.mjs, committed under
  public/map/tiles, and served from our own origin. Nothing about a
  reader's visit leaves this site, there is no key to leak, and there is no
  bill. The cost is repository size, which is why the viewport is small and
  the zoom is chosen rather than maximal.

  This module is PURE. It computes which tiles a page needs and where each
  pin sits over them; it never touches the network or the disk. That is
  what lets the fetch script ask the views what to download instead of
  guessing, and what lets the whole thing be unit-tested.

  ATTRIBUTION IS NOT OPTIONAL. OpenStreetMap data is ODbL. Every rendered
  map carries "© OpenStreetMap contributors" linking to the copyright page,
  and mapAttribution() below is the single source of that string.
*/

export const TILE_SIZE = 256

/* The upstream tile server, used only by the fetch script, never by a
   reader's browser. Kept here so the URL shape and the on-disk path shape
   are defined in one place and cannot drift apart. */
export const TILE_UPSTREAM = (z, x, y) => `https://tile.openstreetmap.org/${z}/${x}/${y}.png`

/** Where a tile lives once fetched. Public path and repo path agree. */
export const tilePath = (z, x, y) => `/map/tiles/${z}/${x}/${y}.png`

export const mapAttribution = Object.freeze({
  text: '© OpenStreetMap contributors',
  href: 'https://www.openstreetmap.org/copyright',
})

/* ---------------------------------------------------------------- */
/* SLIPPY MAP MATHS                                                  */
/* ---------------------------------------------------------------- */

/*
  Web Mercator, the projection every tile server uses. lonToX and latToY
  return FRACTIONAL tile coordinates: the integer part names the tile, the
  fraction is how far into it the point sits. Multiply by TILE_SIZE and you
  have world pixels at that zoom, which is the coordinate space everything
  below works in.
*/
const lonToX = (lon, z) => ((lon + 180) / 360) * Math.pow(2, z)

const latToY = (lat, z) => {
  const r = (lat * Math.PI) / 180
  return ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * Math.pow(2, z)
}

/** World-pixel position of a coordinate at a zoom. */
const worldPx = (lat, lon, z) => ({
  x: lonToX(lon, z) * TILE_SIZE,
  y: latToY(lat, z) * TILE_SIZE,
})

/* ---------------------------------------------------------------- */

const isNum = n => typeof n === 'number' && Number.isFinite(n)

/**
 * Points with usable coordinates, in input order. A venue with no geocode
 * is not an error and not a pin at (0,0) in the Gulf of Guinea; it simply
 * does not appear on the map, exactly as it does not appear in a count it
 * has no value for.
 */
export const mappable = points =>
  (points ?? []).filter(p => isNum(p?.latitude) && isNum(p?.longitude))

/**
 * Build a static map.
 *
 * @param {object[]} points          {latitude, longitude, name?, href?}
 * @param {object}   [opts]
 * @param {number}   [opts.width]    viewport width in px
 * @param {number}   [opts.height]   viewport height in px
 * @param {number}   [opts.maxZoom]  never zoom in past this
 * @param {number}   [opts.minZoom]  never zoom out past this
 * @param {number}   [opts.padding]  px of breathing room around the pins
 * @returns {null|{width,height,zoom,tiles,pins,attribution}}
 *
 * Returns null when nothing can be drawn, and every caller must handle it.
 * A map of no pins is not a map.
 */
export function staticMap(points, opts = {}) {
  const {
    width = 720,
    height = 420,
    maxZoom = 16,
    minZoom = 3,
    padding = 56,
  } = opts

  const pts = mappable(points)
  if (!pts.length) return null

  const lats = pts.map(p => p.latitude)
  const lons = pts.map(p => p.longitude)
  const bounds = {
    north: Math.max(...lats),
    south: Math.min(...lats),
    east: Math.max(...lons),
    west: Math.min(...lons),
  }

  /*
    CHOOSE THE ZOOM BY FITTING, NOT BY GUESSING.

    Walk down from maxZoom and take the first zoom at which every pin fits
    inside the viewport with padding. A single venue never fits-and-shrinks
    — its bounds have zero extent — so it simply takes maxZoom, which is
    the right answer: one court, as close as the tiles go.

    Zoom is chosen rather than maximal because every extra zoom level is
    four times the tiles, and the tiles live in the repository.
  */
  let zoom = minZoom
  for (let z = maxZoom; z >= minZoom; z--) {
    const a = worldPx(bounds.north, bounds.west, z)
    const b = worldPx(bounds.south, bounds.east, z)
    if (Math.abs(b.x - a.x) <= width - padding * 2 && Math.abs(b.y - a.y) <= height - padding * 2) {
      zoom = z
      break
    }
  }

  /* Centre on the middle of the bounding box, in pixels rather than in
     degrees: averaging latitudes is wrong in Mercator. */
  const nw = worldPx(bounds.north, bounds.west, zoom)
  const se = worldPx(bounds.south, bounds.east, zoom)
  const centre = {x: (nw.x + se.x) / 2, y: (nw.y + se.y) / 2}

  /* The viewport, in world pixels. */
  const left = centre.x - width / 2
  const top = centre.y - height / 2

  /* Which tiles that viewport touches. */
  const span = Math.pow(2, zoom)
  const firstX = Math.floor(left / TILE_SIZE)
  const firstY = Math.floor(top / TILE_SIZE)
  const lastX = Math.floor((left + width - 1) / TILE_SIZE)
  const lastY = Math.floor((top + height - 1) / TILE_SIZE)

  const tiles = []
  for (let ty = firstY; ty <= lastY; ty++) {
    /* Above the north pole or below the south there is no tile. Wrapping y
       would repeat Antarctica across the top of the map. */
    if (ty < 0 || ty >= span) continue
    for (let tx = firstX; tx <= lastX; tx++) {
      /* x DOES wrap: the world is a cylinder and the date line is not an
         edge. Only matters for a map spanning it, but it costs one modulo. */
      const wrapped = ((tx % span) + span) % span
      tiles.push({
        z: zoom,
        x: wrapped,
        y: ty,
        src: tilePath(zoom, wrapped, ty),
        /* Position within the viewport, so the renderer needs no maths. */
        left: Math.round(tx * TILE_SIZE - left),
        top: Math.round(ty * TILE_SIZE - top),
      })
    }
  }

  const pins = pts.map((p, i) => {
    const w = worldPx(p.latitude, p.longitude, zoom)
    return {
      key: p.slug ?? `pin-${i}`,
      name: p.name ?? null,
      href: p.href ?? null,
      left: Math.round(w.x - left),
      top: Math.round(w.y - top),
    }
  })

  return {width, height, zoom, tiles, pins, attribution: mapAttribution}
}

/**
 * Every tile every map on the site needs, deduplicated. The fetch script
 * asks for this rather than deciding for itself, so a change to a map's
 * size or zoom cannot leave the tile set stale.
 */
export function tilesNeeded(maps) {
  const seen = new Map()
  for (const m of maps) {
    if (!m) continue
    for (const t of m.tiles) seen.set(`${t.z}/${t.x}/${t.y}`, {z: t.z, x: t.x, y: t.y})
  }
  return [...seen.values()].sort((a, b) => a.z - b.z || a.x - b.x || a.y - b.y)
}
