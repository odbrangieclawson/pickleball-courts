/*
  The indexing switch (lib/site/origin.mjs).

  SITE_INDEXABLE is the one variable that takes the site from noindex to
  indexable on launch day. Because it is read at import time from the
  environment, each case below runs in a child process with its own
  environment and reads the exported values back as JSON. Three states
  matter: unset (the first thirty-five cities shipped this way), set with a
  real origin (launch), and set without an origin (a misconfiguration that
  must refuse to build rather than index canonicals naming example.invalid).
*/
import test from 'node:test'
import assert from 'node:assert/strict'
import {execFileSync} from 'node:child_process'
import {fileURLToPath} from 'node:url'
import {dirname, join} from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const repo = join(here, '..', '..')

function read(env) {
  const code = "import('./lib/site/origin.mjs').then(m => console.log(JSON.stringify({i: m.INDEXABLE, r: m.PAGE_ROBOTS, o: m.ORIGIN}))).catch(e => { console.log(JSON.stringify({error: e.message})) })"
  const out = execFileSync(process.execPath, ['-e', code], {
    cwd: repo,
    env: Object.fromEntries(Object.entries({...process.env, SITE_ORIGIN: undefined, SITE_INDEXABLE: undefined, ...env}).filter(([, v]) => v !== undefined)),
    encoding: 'utf8',
  })
  return JSON.parse(out.trim().split('\n').pop())
}

test('indexing switch', async t => {
  await t.test('unset: noindex, nofollow everywhere', () => {
    const v = read({})
    assert.equal(v.i, false)
    assert.deepEqual(v.r, {index: false, follow: false})
  })

  await t.test('"false" with a real origin: still noindex', () => {
    const v = read({SITE_ORIGIN: 'https://example.com', SITE_INDEXABLE: 'false'})
    assert.equal(v.i, false)
    assert.deepEqual(v.r, {index: false, follow: false})
  })

  await t.test('"true" with a real origin: index, follow', () => {
    const v = read({SITE_ORIGIN: 'https://example.com', SITE_INDEXABLE: 'true'})
    assert.equal(v.i, true)
    assert.deepEqual(v.r, {index: true, follow: true})
    assert.equal(v.o, 'https://example.com')
  })

  await t.test('"true" with no origin refuses to build', () => {
    const v = read({SITE_INDEXABLE: 'true'})
    assert.match(v.error ?? '', /SITE_ORIGIN is not set/)
  })

  await t.test('a value that is neither true nor false refuses to build', () => {
    const v = read({SITE_ORIGIN: 'https://example.com', SITE_INDEXABLE: 'maybe'})
    assert.match(v.error ?? '', /must be "true" or "false"/)
  })
})
