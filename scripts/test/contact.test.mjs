/*
  The contact address (lib/site/contact.mjs).

  CONTACT_EMAIL is read at import time, so each case runs in a child process
  with its own environment, the same way indexing.test.mjs exercises
  SITE_INDEXABLE. Four states matter: unset (the placeholder, obviously
  wrong in the output), set (every link carries it), malformed (refuse), and
  indexable-but-unset (refuse: a launched site whose claim links point at
  example.invalid is the failure O10 was about, one variable over).
*/
import test from 'node:test'
import assert from 'node:assert/strict'
import {execFileSync} from 'node:child_process'
import {fileURLToPath} from 'node:url'
import {dirname, join} from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const repo = join(here, '..', '..')

function read(env) {
  const code =
    "import('./lib/site/contact.mjs').then(m => console.log(JSON.stringify({e: m.CONTACT_EMAIL, p: m.CONTACT_IS_PLACEHOLDER, c: m.claimMailto({name: 'Bitter Lake Playfield', city: 'Seattle', state: 'WA', url: 'https://example.com/v/'}), a: m.addVenueMailto()}))).catch(e => { console.log(JSON.stringify({error: e.message})) })"
  const out = execFileSync(process.execPath, ['-e', code], {
    cwd: repo,
    env: Object.fromEntries(Object.entries({...process.env, SITE_ORIGIN: undefined, SITE_INDEXABLE: undefined, CONTACT_EMAIL: undefined, ...env}).filter(([, v]) => v !== undefined)),
    encoding: 'utf8',
  })
  return JSON.parse(out.trim().split('\n').pop())
}

test('contact address', async t => {
  await t.test('unset: the placeholder, flagged as such', () => {
    const v = read({})
    assert.equal(v.e, 'claims@example.invalid')
    assert.equal(v.p, true)
    assert.match(v.c, /^mailto:claims@example\.invalid\?subject=/)
  })

  await t.test('set: every link opens the real inbox with a sortable subject', () => {
    const v = read({CONTACT_EMAIL: 'hello@example.com'})
    assert.equal(v.e, 'hello@example.com')
    assert.equal(v.p, false)
    assert.match(v.c, /^mailto:hello@example\.com\?subject=Claim%3A%20Bitter%20Lake%20Playfield/)
    assert.match(v.c, /body=.*https%3A%2F%2Fexample\.com%2Fv%2F/)
    assert.match(v.a, /subject=New%20venue/)
  })

  await t.test('a value without an @ and a domain refuses to build', () => {
    const v = read({CONTACT_EMAIL: 'not an address'})
    assert.match(v.error ?? '', /does not look like an email address/)
  })

  await t.test('indexable with no address refuses to build', () => {
    const v = read({SITE_ORIGIN: 'https://example.com', SITE_INDEXABLE: 'true'})
    assert.match(v.error ?? '', /CONTACT_EMAIL is not set/)
  })

  await t.test('indexable with an address builds', () => {
    const v = read({SITE_ORIGIN: 'https://example.com', SITE_INDEXABLE: 'true', CONTACT_EMAIL: 'hello@example.com'})
    assert.equal(v.error, undefined)
    assert.equal(v.p, false)
  })
})
