/*
  Two contracts that were unenforced until Portland's data walked into them.
  Both bugs were invisible for five cities because no earlier city produced
  the input that triggers them, which is exactly the kind of bug a test is
  for rather than a code review.

  Run: npm test
*/

import test from 'node:test'
import assert from 'node:assert/strict'

import {venueTitle, TITLE_MAX, TitleError} from '../../lib/page/titles.mjs'
import {FILTERS, PAGEABLE_FILTERS, qualifyingFilters} from '../../lib/page/city-page.mjs'

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
