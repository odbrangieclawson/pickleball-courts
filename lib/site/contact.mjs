/*
  WHERE A CLAIM OR A CORRECTION GOES.

  Rule 1 says every page works with JavaScript off, and rule 11 says a claim
  is an identity event that never touches verification. Both point at the
  same, very plain mechanism for the first version of this: an email. A
  mailto: link needs no script and no backend, an inbox is a real queue with
  a date on every message, and the reply thread is where the source URL and
  the checked date get collected before anything changes on the page. A
  form that wrote straight into the data would be the thing rule 11 exists
  to prevent.

  The address is one variable, CONTACT_EMAIL, read here and nowhere else,
  the same shape as SITE_ORIGIN in origin.mjs. Unset, it falls back to a
  reserved name that can never deliver, so an unconfigured build is obviously
  wrong in the output rather than plausibly wrong, and the launch check that
  greps the live site for example.invalid catches it. It refuses to build
  indexable while still the placeholder, for the same reason the origin does.

  Every subject line below starts with a fixed word — Claim, Correction,
  New venue — so an inbox filter can sort the queue without reading it.
*/
import {INDEXABLE} from './origin.mjs'

const RAW = String(process.env.CONTACT_EMAIL ?? '').trim()
const PLACEHOLDER = 'claims@example.invalid'

/* The message names the fault rather than echoing the value: Vercel redacts
   environment variables in build logs, so a quoted value reads [REDACTED]. */
if (RAW && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(RAW)) {
  throw new Error(
    'CONTACT_EMAIL does not look like an email address. It needs one @ with a domain after it ' +
    'and no spaces, for example hello@example.com',
  )
}

/** The address every claim, correction and new-venue link is sent to. */
export const CONTACT_EMAIL = RAW || PLACEHOLDER

/** True while the address is still the placeholder — nothing is launch-ready. */
export const CONTACT_IS_PLACEHOLDER = CONTACT_EMAIL === PLACEHOLDER

if (INDEXABLE && CONTACT_IS_PLACEHOLDER) {
  throw new Error(
    'SITE_INDEXABLE is true but CONTACT_EMAIL is not set, so every claim and correction link ' +
    'on the site would point at the placeholder address. Set CONTACT_EMAIL before turning indexing on.',
  )
}

/** A mailto: URL with the subject and body encoded for the href attribute. */
export function mailto(subject, body) {
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

/**
 * The claim link for one venue. The body asks, in order, for the things a
 * claim needs before anyone acts on it: who is writing, how we can tell
 * they speak for the venue, and what they want changed with a source.
 */
export function claimMailto({name, city, state, url}) {
  const subject = `Claim: ${name}, ${city}, ${state}`
  const body = [
    `I run or represent ${name} in ${city}, ${state}.`,
    `Listing: ${url}`,
    '',
    'My name and role at the venue:',
    '',
    'How you can confirm I speak for the venue (an address on the venue\'s own domain, or a phone number published on the operator\'s page):',
    '',
    'What I would like changed, and where each fact is published:',
    '',
  ].join('\n')
  return mailto(subject, body)
}

/** The correction link for one venue. A correction needs a source and a date, like everything else. */
export function correctionMailto({name, city, state, url}) {
  const subject = `Correction: ${name}, ${city}, ${state}`
  const body = [
    `Listing: ${url}`,
    '',
    'What is wrong:',
    '',
    'What it should say:',
    '',
    'Where that is published (a link to the operator\'s page, if there is one):',
    '',
    'When you last saw it that way (a date):',
    '',
  ].join('\n')
  return mailto(subject, body)
}

/** The link for a court that is not on the site at all. */
export function addVenueMailto() {
  const subject = 'New venue: (venue name), (city), (state)'
  const body = [
    'Venue name:',
    'Full street address:',
    'Number of pickleball courts, and how many are indoor and how many outdoor:',
    'The operator\'s page that lists the courts (a parks department, club or venue page):',
    'Lights, fees and hours, if the operator publishes them:',
    'Your name, and your connection to the venue if any:',
    '',
  ].join('\n')
  return mailto(subject, body)
}
