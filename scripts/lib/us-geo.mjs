/*
  Coarse US geographic reference constants.

  WHAT THIS IS FOR: detecting GROSS errors - a venue in Ohio with Californian
  coordinates, a Florida ZIP on a Maine row. It is a tripwire, not a
  geocoder.

  WHAT IT IS NOT: these are axis-aligned BOUNDING BOXES, not state polygons.
  A point can sit inside a state's box and still be in a neighbouring state,
  especially for states with concave borders or long panhandles. So:

      inside the box  -> proves nothing
      outside the box -> definitely wrong, worth flagging

  Only the second direction is used. Nothing here is ever used to CORRECT a
  coordinate, only to flag one for human checking.

  Boxes are padded slightly outward so a genuine coastal or border venue is
  not flagged for a rounding difference.
*/

/** [latMin, latMax, lonMin, lonMax] */
export const STATE_BBOX = {
  AL: [30.1, 35.1, -88.6, -84.8], AK: [51.0, 71.6, -179.2, -129.9],
  AZ: [31.3, 37.1, -114.9, -109.0], AR: [32.9, 36.6, -94.7, -89.6],
  CA: [32.4, 42.1, -124.5, -114.1], CO: [36.9, 41.1, -109.1, -102.0],
  CT: [40.9, 42.1, -73.8, -71.7], DE: [38.4, 39.9, -75.9, -75.0],
  DC: [38.7, 39.1, -77.2, -76.8], FL: [24.3, 31.1, -87.7, -79.9],
  GA: [30.3, 35.1, -85.7, -80.7], HI: [18.8, 22.3, -160.3, -154.7],
  ID: [41.9, 49.1, -117.3, -110.9], IL: [36.9, 42.6, -91.6, -87.0],
  IN: [37.7, 41.8, -88.2, -84.7], IA: [40.3, 43.6, -96.7, -90.1],
  KS: [36.9, 40.1, -102.1, -94.5], KY: [36.4, 39.2, -89.6, -81.9],
  LA: [28.8, 33.1, -94.1, -88.7], ME: [42.9, 47.5, -71.2, -66.9],
  MD: [37.8, 39.8, -79.6, -75.0], MA: [41.1, 43.0, -73.6, -69.8],
  MI: [41.6, 48.4, -90.5, -82.3], MN: [43.4, 49.5, -97.3, -89.4],
  MS: [30.1, 35.1, -91.7, -88.0], MO: [35.9, 40.7, -95.8, -89.0],
  MT: [44.3, 49.1, -116.1, -103.9], NE: [39.9, 43.1, -104.1, -95.2],
  NV: [34.9, 42.1, -120.1, -113.9], NH: [42.6, 45.4, -72.6, -70.6],
  NJ: [38.8, 41.4, -75.6, -73.8], NM: [31.2, 37.1, -109.1, -102.9],
  NY: [40.4, 45.1, -79.8, -71.8], NC: [33.7, 36.7, -84.4, -75.4],
  ND: [45.8, 49.1, -104.1, -96.5], OH: [38.3, 42.4, -84.9, -80.4],
  OK: [33.5, 37.1, -103.1, -94.4], OR: [41.9, 46.4, -124.6, -116.4],
  PA: [39.6, 42.4, -80.6, -74.6], RI: [41.1, 42.1, -71.9, -71.0],
  SC: [31.9, 35.3, -83.4, -78.4], SD: [42.4, 46.0, -104.1, -96.4],
  TN: [34.9, 36.8, -90.4, -81.6], TX: [25.7, 36.6, -106.7, -93.4],
  UT: [36.9, 42.1, -114.1, -108.9], VT: [42.6, 45.1, -73.5, -71.4],
  VA: [36.4, 39.5, -83.8, -75.1], WA: [45.4, 49.1, -124.9, -116.8],
  WV: [37.1, 40.7, -82.7, -77.6], WI: [42.4, 47.4, -93.0, -86.7],
  WY: [40.9, 45.1, -111.1, -103.9], PR: [17.8, 18.6, -68.0, -65.1],
  VI: [17.6, 18.5, -65.1, -64.5], GU: [13.2, 13.7, 144.6, 145.0],
}

/*
  ZIP3 prefix ranges by state. Standard USPS allocation.

  Same asymmetry as the bounding boxes: a ZIP inside the state's range is
  weak confirmation, a ZIP outside it is a real disagreement worth flagging.

  This checks ZIP against STATE only. Checking ZIP against CITY needs a real
  ZIP-to-place table, which this repo does not have - that check is reported
  as NOT PERFORMED rather than approximated.
*/
export const STATE_ZIP3 = {
  AL: [[350, 369]], AK: [[995, 999]], AZ: [[850, 865]], AR: [[716, 729]],
  CA: [[900, 961]], CO: [[800, 816]], CT: [[60, 69]], DE: [[197, 199]],
  DC: [[200, 205], [569, 569]], FL: [[320, 349]], GA: [[300, 319], [398, 399]],
  HI: [[967, 968]], ID: [[832, 838]], IL: [[600, 629]], IN: [[460, 479]],
  IA: [[500, 528]], KS: [[660, 679]], KY: [[400, 427]], LA: [[700, 714]],
  ME: [[39, 49]], MD: [[206, 219]], MA: [[10, 27], [55, 55]],
  MI: [[480, 499]], MN: [[550, 567]], MS: [[386, 397]], MO: [[630, 658]],
  MT: [[590, 599]], NE: [[680, 693]], NV: [[889, 898]], NH: [[30, 38]],
  NJ: [[70, 89]], NM: [[870, 884]], NY: [[100, 149], [5, 6]],
  NC: [[270, 289]], ND: [[580, 588]], OH: [[430, 459]], OK: [[730, 749]],
  OR: [[970, 979]], PA: [[150, 196]], RI: [[28, 29]], SC: [[290, 299]],
  SD: [[570, 577]], TN: [[370, 385]], TX: [[750, 799], [885, 885]],
  UT: [[840, 847]], VT: [[50, 59]], VA: [[201, 201], [220, 246]],
  WA: [[980, 994]], WV: [[247, 268]], WI: [[530, 549]], WY: [[820, 831]],
  PR: [[6, 9]], VI: [[8, 8]], GU: [[969, 969]],
}

export const US_STATES = Object.keys(STATE_BBOX)

/** true = definitely outside the state's box. null = cannot tell. */
export function isOutsideState(state, lat, lon) {
  const box = STATE_BBOX[state]
  if (!box || lat === null || lon === null) return null
  const [latMin, latMax, lonMin, lonMax] = box
  return lat < latMin || lat > latMax || lon < lonMin || lon > lonMax
}

/** true = ZIP prefix does not belong to the state. null = cannot tell. */
export function zipDisagreesWithState(state, zip) {
  const ranges = STATE_ZIP3[state]
  if (!ranges || !zip) return null
  const m = String(zip).match(/^(\d{3})/)
  if (!m) return null
  const p = Number(m[1])
  return !ranges.some(([lo, hi]) => p >= lo && p <= hi)
}

/** Great-circle distance in kilometres. Used for proximity de-duplication. */
export function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371
  const toRad = d => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}
