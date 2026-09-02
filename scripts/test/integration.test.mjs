/*
  The seam test.

  Phases 1, 1B and 2 were each tested in isolation. Nothing tested the join:
  can a row actually travel the whole way from an imported pending record,
  through source attachment, to a number on a page?

  That is the only question that matters for "are we good", because every
  phase passing its own tests while the joins leak is exactly how a pipeline
  looks fine and produces nothing.

  The journey under test:

    data.csv row
      -> mapper.mjs            v4 record, status=pending
      -> SourceDocument.fact() municipal facts with provenance attached
      -> applyFacts()          conflict resolution, change log
      -> promoteToVerified()   the four gates, all or nothing
      -> isVerified()          Phase 2 agrees it is verified
      -> getCounts()           it appears in a number
*/

import test from 'node:test'
import assert from 'node:assert/strict'

import {SourceDocument, passesI2} from '../verify/provenance.mjs'
import {applyFacts} from '../verify/conflict.mjs'
import {isVerified, unverifiedReasons} from '../../lib/data/schema.mjs'
import {getCounts, meetsThreshold} from '../../lib/data/counts.mjs'
import {promoteToVerified} from '../../lib/data/promote.mjs'

/** An imported row as the Phase 1 mapper leaves it: pending, no provenance. */
const importedRow = (o = {}) => ({
  slug: o.slug ?? 'chisholm-trail-park',
  name: 'Chisholm Trail Park',
  city: 'Fort Worth', state: 'TX', county: 'Tarrant',
  postal_code: '76133', street_address: '4899 Sycamore School Rd',
  latitude: 32.63, longitude: -97.36,
  total_courts: o.total_courts !== undefined ? o.total_courts : 4,
  indoor_courts: 0, outdoor_courts: o.outdoor_courts !== undefined ? o.outdoor_courts : 4,
  surface: null, nets_provided: null, covered: null, climate_control: null,
  light: null,
  access_type: 'public', fee_type: 'free',
  membership_from_usd: null, pricing_notes: null, pricing_details: null,
  play_format: null, level_of_play: null, court_availability: null,
  venue_type: 'public_park',
  restroom: null, pro_shop: null, parking: null, amenities: null,
  website: null, phone: null, hours_of_operation: null,
  rating: null, user_rating: null, review_count: null,
  claimed_or_verified: 'FALSE',
  // The Phase 1 reality: a competitor URL, no date, status pending.
  source_url: 'https://www.courtsource.us/pickleball/tx/fort-worth/chisholm-trail-park',
  date_checked: null, verified_by: null, status: 'pending',
  claimed_by_owner: false, claim_date: null,
  drop_in_fee_usd: null, source_sport: 'pickleball',
})

const municipal = (url = 'https://www.fortworthtexas.gov/parks/chisholm-trail') =>
  new SourceDocument({url, retrieved_at: '2026-09-02', tier: 1, publisher: 'Fort Worth Parks & Recreation'})

test('an imported row starts unpublishable', () => {
  const v = importedRow()
  assert.equal(isVerified(v), false)
  const r = unverifiedReasons(v)
  assert.ok(r.some(x => x.includes('competitor')), `expected the competitor URL to be called out, got: ${r.join(' | ')}`)
})

test('the full journey: imported row -> verified -> counted', async t => {
  const doc = municipal()
  const imported = importedRow()

  const applied = applyFacts(imported, [
    doc.fact('total_courts', 6, {evidence: 'Pickleball courts: 6'}),
    doc.fact('outdoor_courts', 6),
    doc.fact('indoor_courts', 0),
    doc.fact('light', true, {evidence: 'Lighted until 10pm'}),
    doc.fact('street_address', '4899 Sycamore School Rd'),
  ])

  await t.test('the competitor URL is replaced by the municipal one', () => {
    assert.equal(applied.venue.source_url, 'https://www.fortworthtexas.gov/parks/chisholm-trail')
  })

  await t.test('the change log records the disagreement with both sources', () => {
    const courts = applied.changelog.find(e => e.field === 'total_courts')
    assert.equal(courts.outcome, 'overridden')
    assert.equal(courts.old_value, 4)
    assert.equal(courts.new_value, 6)
    assert.match(courts.old_source.url, /courtsource\.us/)
    assert.match(courts.new_source.url, /fortworthtexas\.gov/)
  })

  await t.test('I2 now passes', () => {
    assert.equal(passesI2(applied.venue, {today: '2026-09-02'}).pass, true)
  })

  /*
    THE GAP THIS TEST WAS WRITTEN TO FIND.

    applyFacts sets source_url, date_checked and verified_by, but nothing in
    Phase 1B ever moved status off "pending". So a fully sourced row was
    still invisible to Phase 2, because isVerified() requires
    status === 'verified'. The two phases agreed on every field except the
    one that decides whether a page exists.

    promoteToVerified() closes it, and refuses to promote unless all four
    gates pass - so status can never be set by hand or by optimism.
  */
  await t.test('applying facts alone does NOT make a row verified', () => {
    assert.equal(applied.venue.status, 'pending')
    assert.equal(isVerified(applied.venue), false)
  })

  await t.test('promoteToVerified promotes it once the gates pass', () => {
    const p = promoteToVerified(applied.venue)
    assert.equal(p.promoted, true, p.reasons.join('; '))
    assert.equal(p.venue.status, 'verified')
    assert.equal(isVerified(p.venue), true)
  })

  await t.test('it now appears in a count, with the MUNICIPAL number', () => {
    const p = promoteToVerified(applied.venue)
    const c = getCounts({type: 'city', city: 'Fort Worth', state: 'TX'}, [p.venue])
    assert.equal(c.venues.value, 1)
    assert.equal(c.courts.value, 6)      // 6 from the city, not 4 from the import
    assert.equal(c.venues_lit.value, 1)
    assert.equal(c.venues_lit.known, 1)
  })
})

test('promotion refuses anything short of all four gates', async t => {
  const doc = municipal()

  await t.test('no source: refused', () => {
    const p = promoteToVerified(importedRow())
    assert.equal(p.promoted, false)
    assert.ok(p.reasons.length > 0)
  })

  await t.test('sourced but no court count: refused', () => {
    const a = applyFacts(importedRow({total_courts: null}), [doc.fact('street_address', '1 X St')])
    const p = promoteToVerified({...a.venue, total_courts: null})
    assert.equal(p.promoted, false)
    assert.ok(p.reasons.some(r => /court count/i.test(r)), p.reasons.join('; '))
  })

  await t.test('court arithmetic broken: refused (Rule 13)', () => {
    const a = applyFacts(importedRow(), [doc.fact('total_courts', 9)]) // 9 != 0 + 4
    const p = promoteToVerified(a.venue)
    assert.equal(p.promoted, false)
    assert.ok(p.reasons.some(r => /Rule 13/.test(r)), p.reasons.join('; '))
  })

  await t.test('a numeric-suffix slug: refused (Rule 10)', () => {
    const a = applyFacts(importedRow({slug: 'martz-field-2'}), [doc.fact('street_address', '1 X St')])
    const p = promoteToVerified(a.venue)
    assert.equal(p.promoted, false)
    assert.ok(p.reasons.some(r => /numeric suffix/i.test(r)), p.reasons.join('; '))
  })

  await t.test('a claim does not promote anything (Rule 11)', () => {
    const claimed = {...importedRow(), claimed_by_owner: true, claim_date: '2026-08-01'}
    const p = promoteToVerified(claimed)
    assert.equal(p.promoted, false)
  })
})

test('three verified venues clear the Rule 8 threshold, two do not', () => {
  const mk = slug => {
    const doc = municipal(`https://www.fortworthtexas.gov/parks/${slug}`)
    const a = applyFacts(importedRow({slug}), [
      doc.fact('total_courts', 4), doc.fact('indoor_courts', 0), doc.fact('outdoor_courts', 4),
      doc.fact('street_address', '1 Example St'),
    ])
    const p = promoteToVerified(a.venue)
    assert.equal(p.promoted, true, p.reasons.join('; '))
    return p.venue
  }
  const scope = {type: 'city', city: 'Fort Worth', state: 'TX'}
  assert.equal(meetsThreshold(getCounts(scope, [mk('a'), mk('b')])), false)
  assert.equal(meetsThreshold(getCounts(scope, [mk('a'), mk('b'), mk('c')])), true)
})
