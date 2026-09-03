/*
  Three contracts that were unenforced until a new city's data walked into
  them. Each was invisible for five or six cities because no earlier city
  produced the input that triggers it — a venue name one character too long,
  the first populated access_type, the first pair of cities far enough apart
  to make "nearest" absurd. That is exactly the kind of bug a test is for
  rather than a code review.

  Run: npm test
*/

import test from 'node:test'
import assert from 'node:assert/strict'

import {venueTitle, TITLE_MAX, TitleError} from '../../lib/page/titles.mjs'
import {FILTERS, PAGEABLE_FILTERS, qualifyingFilters} from '../../lib/page/city-page.mjs'
import {nearestCities, NEAREST_CITIES_MAX_KM} from '../../lib/site/links.mjs'

/* ------------------------------------------------------------------ */
/* A long venue name degrades the title; it does not fail the build.   */
/* ------------------------------------------------------------------ */

test('venueTitle: a name that overruns drops the state rather than throwing', () => {
  /*
    "East Portland Community Center - Pickleball Courts in Portland, OR"
    is 66 characters, one over the hard maximum, and Portland Parks &
    Recreation uses no shorter name for the venue. Before the token list
    was declared properly this threw TitleError and took the whole build
    down at the prerender step.
  */
  const t = venueTitle({
    name: 'East Portland Community Center', city: 'Portland', state: 'OR',
  })
  assert.ok(t.length <= TITLE_MAX, `title is ${t.length} chars`)
  assert.ok(t.startsWith('East Portland Community Center'), 'the name survives whole')
  assert.ok(t.includes('Portland'), 'the city survives the first drop')
  assert.equal(t, 'East Portland Community Center - Pickleball Courts in Portland')
})

test('venueTitle: a name that fits keeps the state', () => {
  assert.equal(
    venueTitle({name: 'Columbia Park', city: 'Portland', state: 'OR'}),
    'Columbia Park - Pickleball Courts in Portland, OR',
  )
})

test('venueTitle: the name is never truncated, however long', () => {
  /*
    The degradation ladder must run out rather than start cutting the
    name. A 90-character venue name still fails loudly — that is the
    intended behaviour, because a name cut mid-word is worse than a build
    error somebody has to look at.
  */
  const absurd = 'The Extremely Long Memorial Community Recreation And Aquatics Center Of Somewhere'
  assert.throws(
    () => venueTitle({name: absurd, city: 'Portland', state: 'OR'}),
    TitleError,
  )
})

/* ------------------------------------------------------------------ */
/* The nav and sitemap must never offer a filter that has no page.     */
/* ------------------------------------------------------------------ */

test('qualifyingFilters never offers /public/, which filterView refuses to render', () => {
  /*
    Decision O1 is open: access_type drives the /public/ filter and has no
    controlled vocabulary, so filterView() returns null for it and no page
    is built. qualifyingFilters() feeds both the sitemap and the city
    page's filter nav, and it used to match on access_type === 'public' —
    so the first city to populate access_type (Portland, ten venues) put a
    hard 404 in an internal link and in the sitemap at the same time.
  */
  const venues = Array.from({length: 8}, (_, i) => ({
    slug: `v${i}`,
    access_type: 'public',
    venue_type: 'public_park',
    outdoor_courts: 4,
    indoor_courts: null,
    fee_type: 'free',
    light: null,
  }))

  const q = qualifyingFilters(venues)
  assert.ok(!('public' in q), 'public must not qualify while O1 is open')
  assert.ok('outdoor' in q && 'free' in q, 'the filters that do have pages still qualify')
  assert.ok(!('lights' in q), 'a null light must not qualify a venue for the lights page')
})

test('PAGEABLE_FILTERS is FILTERS minus exactly the ones with no page', () => {
  assert.deepEqual(PAGEABLE_FILTERS, FILTERS.filter(f => f !== 'public'))
  assert.ok(FILTERS.includes('public'), 'public is still a real facet of the data')
})

test('qualifyingFilters respects the three-venue threshold', () => {
  const two = [
    {slug: 'a', outdoor_courts: 2, indoor_courts: null, fee_type: 'free', light: true, access_type: 'public'},
    {slug: 'b', outdoor_courts: 2, indoor_courts: null, fee_type: 'free', light: true, access_type: 'public'},
  ]
  assert.deepEqual(qualifyingFilters(two), {}, 'two venues qualify for nothing')
})

/* ------------------------------------------------------------------ */
/* "Nearby" must mean nearby, not merely least-distant.                */
/* ------------------------------------------------------------------ */

test('nearestCities excludes cities beyond the radius, even when nothing else is closer', () => {
  /*
    With seven cities in a national directory, the five "closest" spanned
    the continent: Vancouver, WA's page listed Charlotte NC at 3,669 km,
    then Cary and Apex at ~3,800 km, under the heading "Nearby cities we
    publish". Three of five entries were suggestions to drive across
    America.
  */
  const city = (state, slug, name, lat, lng) => [`${state}/${slug}`, {
    state, slug, city: name,
    venues: [{slug: 'v', latitude: lat, longitude: lng}],
  }]

  const graph = {
    publishedCities: new Map([
      city('WA', 'vancouver', 'Vancouver', 45.63, -122.55),
      city('OR', 'portland', 'Portland', 45.52, -122.65),
      city('WA', 'seattle', 'Seattle', 47.61, -122.33),
      city('NC', 'charlotte', 'Charlotte', 35.23, -80.84),
    ]),
  }

  const near = nearestCities(graph, 'WA', 'vancouver')
  const labels = near.map(n => n.label)
  assert.ok(labels.includes('Portland, OR'), 'the city 14 km away is nearby')
  assert.ok(!labels.some(l => l.endsWith(', NC')), 'a city 3,669 km away is not nearby')
  assert.ok(near.every(n => n.km <= NEAREST_CITIES_MAX_KM))
})

test('nearestCities returns nothing rather than the least-distant continent', () => {
  const graph = {
    publishedCities: new Map([
      ['WA/spokane', {state: 'WA', slug: 'spokane', city: 'Spokane',
        venues: [{slug: 'v', latitude: 47.66, longitude: -117.43}]}],
      ['NC/charlotte', {state: 'NC', slug: 'charlotte', city: 'Charlotte',
        venues: [{slug: 'v', latitude: 35.23, longitude: -80.84}]}],
    ]),
  }
  assert.deepEqual(nearestCities(graph, 'WA', 'spokane'), [],
    'an isolated city gets the empty state the page already has copy for')
})

/* ------------------------------------------------------------------ */
/* A URL we did not build must 404, not 500.                           */
/* ------------------------------------------------------------------ */

test('every dynamic route pins dynamicParams = false', async () => {
  /*
    Without it, Next renders any param outside generateStaticParams() on
    demand, and in production that render failed: /pickleball/us/zz/,
    /pickleball/us/or/nosuchcity/, a mistyped venue slug and
    /{city}/public/ all returned 500 instead of 404. A 500 tells a crawler
    the page is temporarily broken and to keep the URL; a 404 retires it.

    This is a source check rather than an HTTP one because asserting it
    needs a built server, and the property worth protecting is the export
    itself — it is one line, in three files, and deleting any of them
    silently reopens the whole dynamic tree.
  */
  const {readFile} = await import('node:fs/promises')
  const routes = [
    'app/pickleball/us/[state]/page.tsx',
    'app/pickleball/us/[state]/[city]/page.tsx',
    'app/pickleball/us/[state]/[city]/[slug]/page.tsx',
  ]
  for (const r of routes) {
    const src = await readFile(new URL(`../../${r}`, import.meta.url), 'utf8')
    assert.match(src, /export const dynamicParams = false/,
      `${r} must pin dynamicParams = false, or unbuilt URLs under it 500 instead of 404`)
    assert.match(src, /export function generateStaticParams/,
      `${r} enumerates its own pages`)
  }
})
