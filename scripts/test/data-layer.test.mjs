/*
  Phase 2 deliverable 5: tests for getCounts(), the slug registry and the
  import gates.

  Run: npm test
*/

import test from 'node:test'
import assert from 'node:assert/strict'

import {isVerified, unverifiedReasons, validateEntity} from '../../lib/data/schema.mjs'
import {getCounts, isCount, renderCount, renderCountOf, meetsThreshold} from '../../lib/data/counts.mjs'
import {makeVenueList} from '../../lib/data/store.mjs'
import {SlugRegistry, slugify, auditSlugs, NumericSuffixError, UnresolvedCollisionError} from '../../lib/data/slugs.mjs'

/** A fully verified venue. Overrides let each test bend one thing. */
const venue = (o = {}) => ({
  slug: o.slug ?? 'elm-park',
  name: o.name ?? 'Elm Park',
  city: o.city ?? 'Springfield',
  state: o.state ?? 'IL',
  county: o.county ?? 'Sangamon',
  postal_code: o.postal_code ?? '62701',
  street_address: o.street_address !== undefined ? o.street_address : '1 Elm St',
  latitude: 39.8, longitude: -89.6,
  total_courts: o.total_courts !== undefined ? o.total_courts : 4,
  indoor_courts: o.indoor_courts !== undefined ? o.indoor_courts : 0,
  outdoor_courts: o.outdoor_courts !== undefined ? o.outdoor_courts : 4,
  surface: null, nets_provided: null,
  covered: o.covered !== undefined ? o.covered : null,
  climate_control: o.climate_control !== undefined ? o.climate_control : null,
  light: o.light !== undefined ? o.light : null,
  access_type: o.access_type ?? 'public',
  fee_type: o.fee_type !== undefined ? o.fee_type : 'free',
  membership_from_usd: null, pricing_notes: null, pricing_details: null,
  play_format: null, level_of_play: null, court_availability: null,
  venue_type: 'public_park',
  restroom: null, pro_shop: null, parking: null, amenities: null,
  website: null, phone: null, hours_of_operation: null,
  rating: null, user_rating: null, review_count: null,
  claimed_or_verified: null,
  source_url: o.source_url !== undefined ? o.source_url : 'https://springfield.gov/parks/elm',
  date_checked: o.date_checked !== undefined ? o.date_checked : '2026-09-02',
  verified_by: o.verified_by !== undefined ? o.verified_by : 'municipal_source',
  status: o.status ?? 'verified',
  claimed_by_owner: o.claimed_by_owner ?? false,
  claim_date: o.claim_date ?? null,
  drop_in_fee_usd: null, source_sport: 'pickleball',
})

const CITY = {type: 'city', city: 'Springfield', state: 'IL'}

/* ================================================================ */
test('isVerified: the gate every count depends on', async t => {
  await t.test('a complete row is verified', () => {
    assert.equal(isVerified(venue()), true)
  })
  await t.test('status pending is never verified', () => {
    assert.equal(isVerified(venue({status: 'pending'})), false)
  })
  await t.test('no source_url is never verified', () => {
    assert.equal(isVerified(venue({source_url: null})), false)
  })
  await t.test('a competitor directory is not a source', () => {
    assert.equal(isVerified(venue({source_url: 'https://www.courtsource.us/x'})), false)
  })
  await t.test('no date_checked is never verified', () => {
    assert.equal(isVerified(venue({date_checked: null})), false)
  })
  await t.test('no court count is never verified', () => {
    assert.equal(isVerified(venue({total_courts: null})), false)
  })
  await t.test('no street_address is never verified', () => {
    assert.equal(isVerified(venue({street_address: null})), false)
  })
})

/* ================================================================ */
test('RULE 11: claimed is not verified', async t => {
  const claimedNoSource = venue({
    slug: 'claimed-park',
    claimed_by_owner: true,
    claim_date: '2026-08-01',
    status: 'pending',
    source_url: null,
    date_checked: null,
    verified_by: null,
  })

  await t.test('a claimed but unsourced venue is not verified', () => {
    assert.equal(isVerified(claimedNoSource), false)
  })

  await t.test('a claim does not appear in the reasons as mitigating', () => {
    const r = unverifiedReasons(claimedNoSource)
    assert.ok(r.includes('no source_url'))
    assert.ok(!r.join(' ').includes('claim'))
  })

  await t.test('a claimed but unsourced venue is excluded from EVERY count', () => {
    const pop = [venue({slug: 'a'}), venue({slug: 'b'}), venue({slug: 'c'}), claimedNoSource]
    const c = getCounts(CITY, pop)

    // Three verified venues, not four.
    assert.equal(c.venues.value, 3)
    // Its 4 courts must not appear anywhere.
    assert.equal(c.courts.value, 12)
    assert.equal(c.outdoor_courts.value, 12)
    assert.equal(c.venues_outdoor.value, 3)
    assert.equal(c.venues_free.value, 3)

    // Every count's denominator excludes it too, except the one that is
    // explicitly about unverified rows.
    for (const [name, count] of Object.entries(c)) {
      if (name === 'venues_unverified') continue
      assert.equal(count.denominator, 3, `${name} denominator leaked the claimed row`)
    }
    // And it IS counted as unverified, against the full population.
    assert.equal(c.venues_unverified.value, 1)
    assert.equal(c.venues_unverified.denominator, 4)
  })
})

/* ================================================================ */
test('getCounts', async t => {
  await t.test('returns Counts, not numbers', () => {
    const c = getCounts(CITY, [venue()])
    assert.equal(isCount(c.venues), true)
    assert.notEqual(typeof c.venues, 'number')
  })

  await t.test('renderCount rejects a bare number', () => {
    assert.throws(() => renderCount(15), /bare number 15/)
    assert.throws(() => renderCount({value: 15}), /must come from getCounts/)
  })

  await t.test('renderCount accepts a real Count', () => {
    const c = getCounts(CITY, [venue()])
    assert.equal(renderCount(c.venues), '1')
  })

  await t.test('unverified venues are excluded from every count', () => {
    const pop = [venue({slug: 'a'}), venue({slug: 'b', status: 'pending'})]
    const c = getCounts(CITY, pop)
    assert.equal(c.venues.value, 1)
    assert.equal(c.courts.value, 4)
  })

  await t.test('denominators let a page avoid implying a negative', () => {
    // 3 verified: one lit, one explicitly unlit, one unknown.
    const pop = [
      venue({slug: 'a', light: true}),
      venue({slug: 'b', light: false}),
      venue({slug: 'c', light: null}),
    ]
    const c = getCounts(CITY, pop)
    assert.equal(c.venues_lit.value, 1)
    assert.equal(c.venues_lit.denominator, 3)
    assert.equal(c.venues_lit.known, 2)   // only two stated anything
    assert.equal(c.venues_lit.unknown, 1) // one is genuinely unknown
    assert.match(renderCountOf(c.venues_lit, 'venues'), /1 of 2 venues that report it \(1 not verified yet\)/)
  })

  await t.test('RULE 6: a null boolean is never counted as false', () => {
    const c = getCounts(CITY, [venue({light: null})])
    assert.equal(c.venues_lit.value, 0)
    assert.equal(c.venues_lit.known, 0)
    // The page must not be able to conclude "0 of 1 have lights".
    assert.equal(c.venues_lit.unknown, 1)
  })

  await t.test('RULE 14: covered and climate_control never feed indoor', () => {
    const pop = [venue({slug: 'a', indoor_courts: 0, outdoor_courts: 4, covered: true, climate_control: true})]
    const c = getCounts(CITY, pop)
    assert.equal(c.venues_indoor.value, 0)
    assert.equal(c.venues_covered.value, 1)
    assert.equal(c.venues_climate.value, 1)
  })

  await t.test('court sums skip venues that do not state a figure', () => {
    const pop = [venue({slug: 'a', total_courts: 4}), venue({slug: 'b', total_courts: 6})]
    const c = getCounts(CITY, pop)
    assert.equal(c.courts.value, 10)
    assert.equal(c.courts.known, 2)
  })

  await t.test('scope filters correctly', () => {
    const pop = [venue({slug: 'a'}), venue({slug: 'b', city: 'Peoria'})]
    assert.equal(getCounts(CITY, pop).venues.value, 1)
    assert.equal(getCounts({type: 'state', state: 'IL'}, pop).venues.value, 2)
    assert.equal(getCounts({type: 'county', county: 'Sangamon', state: 'IL'}, pop).venues.value, 2)
  })

  await t.test('an unknown scope throws rather than counting everything', () => {
    assert.throws(() => getCounts({type: 'planet'}, [venue()]), /Unknown scope/)
  })

  await t.test('RULE 8: the 3-venue threshold reads from getCounts', () => {
    assert.equal(meetsThreshold(getCounts(CITY, [venue({slug: 'a'}), venue({slug: 'b'})])), false)
    assert.equal(meetsThreshold(getCounts(CITY, [venue({slug: 'a'}), venue({slug: 'b'}), venue({slug: 'c'})])), true)
    assert.throws(() => meetsThreshold({venues: 3}), /requires the object returned by getCounts/)
  })
})

/* ================================================================ */
test('the store hands out nothing countable', async t => {
  const list = makeVenueList([venue({slug: 'a'}), venue({slug: 'b'})])

  await t.test('no .length', () => assert.equal(list.length, undefined))
  await t.test('no .filter', () => assert.equal(list.filter, undefined))
  await t.test('no .reduce', () => assert.equal(list.reduce, undefined))
  await t.test('spreading throws rather than yielding an array', () => {
    assert.throws(() => [...list], /not iterable/)
  })
  await t.test('map still works for rendering', () => {
    assert.deepEqual(list.map(v => v.slug), ['a', 'b'])
  })
})

/* ================================================================ */
test('slug registry', async t => {
  await t.test('slugify handles the awkward cases', () => {
    assert.equal(slugify("Prince George's Park"), 'prince-georges-park')
    assert.equal(slugify('St. Louis Rec & Fitness'), 'st-louis-rec-and-fitness')
    assert.equal(slugify('Doña Ana Courts'), 'dona-ana-courts')
  })

  await t.test('REFUSES a numeric suffix outright', () => {
    const r = new SlugRegistry()
    assert.throws(() => r.register('martz-field-2', venue()), NumericSuffixError)
    assert.throws(() => r.register('waldstein-park-2', venue()), NumericSuffixError)
  })

  await t.test('a first registration is unchanged', () => {
    const r = new SlugRegistry()
    assert.equal(r.register('elm-park', venue()), 'elm-park')
  })

  await t.test('a collision resolves on real data, never a counter', () => {
    const r = new SlugRegistry()
    r.register('elm-park', venue({street_address: '1 Elm St'}))
    const second = r.register('elm-park', venue({street_address: '900 Oak Avenue'}))
    assert.equal(second, 'elm-park-oak-avenue')
    assert.doesNotMatch(second, /-\d+$/)
  })

  await t.test('neighbourhood is preferred over street', () => {
    const r = new SlugRegistry()
    r.register('elm-park', venue())
    const v = venue({street_address: '900 Oak Ave'})
    v.neighbourhood = 'Northside'
    assert.equal(r.register('elm-park', v), 'elm-park-northside')
  })

  await t.test('the street number is dropped, the street kept', () => {
    const r = new SlugRegistry()
    r.register('x', venue())
    assert.equal(r.register('x', venue({street_address: '8533 Acanthus Drive'})), 'x-acanthus-drive')
  })

  await t.test('an unresolvable collision throws instead of numbering', () => {
    const r = new SlugRegistry()
    const bare = {name: 'Same', city: 'X', state: 'IL', street_address: null, county: null, venue_type: null, postal_code: null}
    r.register('same', bare)
    assert.throws(() => r.register('same', {...bare}), UnresolvedCollisionError)
  })

  await t.test('no disambiguator can produce a numeric suffix', () => {
    const r = new SlugRegistry()
    r.register('p', venue({postal_code: '62701'}))
    // postal_code alone would give "p-62701", which ends in digits and is refused.
    const v = {name: 'P', city: 'X', state: 'IL', street_address: null, county: null, venue_type: null, postal_code: '62702'}
    assert.throws(() => r.register('p', v), UnresolvedCollisionError)
  })

  await t.test('auditSlugs finds numeric suffixes and collisions', () => {
    const a = auditSlugs([
      venue({slug: 'a'}), venue({slug: 'a'}),
      venue({slug: 'martz-field-2'}),
    ])
    assert.equal(a.collisions.length, 1)
    assert.equal(a.numeric_suffix.length, 1)
  })
})

/* ================================================================ */
test('schema validation', async t => {
  await t.test('a good venue validates', () => {
    assert.equal(validateEntity('venue', venue()).valid, true)
  })
  await t.test('a numeric-suffix slug fails the schema', () => {
    assert.equal(validateEntity('venue', venue({slug: 'martz-field-2'})).valid, false)
  })
  await t.test('an unknown status fails', () => {
    assert.equal(validateEntity('venue', venue({status: 'live'})).valid, false)
  })
  await t.test('a bad verified_by fails', () => {
    assert.equal(validateEntity('venue', venue({verified_by: 'scraped'})).valid, false)
  })
  await t.test('claim fields are part of the model', () => {
    const v = venue({claimed_by_owner: true, claim_date: '2026-08-01'})
    assert.equal(validateEntity('venue', v).valid, true)
  })
})
