/*
  The site's origin, in one place.

  WHY THIS FILE EXISTS

  This value was defined four separate times — in app/layout.tsx, in
  lib/site/sitemap.mjs, in lib/site/views.mjs and in lib/page/schema-ld.mjs
  — and only the first two read the environment. The other two were a
  hardcoded 'https://example.invalid'.

  The effect was a site that looked configured and was not. Setting
  SITE_ORIGIN fixed the canonical tags and the sitemap, while every
  breadcrumb, ItemList and SportsActivityLocation node in the JSON-LD went on
  naming example.invalid — fourteen times on a single city page. Nothing
  failed, nothing warned; the structured data just quietly pointed at a
  domain that does not exist, which is worse than an obvious placeholder
  because it survives the moment somebody thinks they have dealt with it.

  So there is one definition and everything imports it. Decision O10 is
  closed by setting one environment variable, and closed everywhere.

  WHAT THE VALUE MUST LOOK LIKE

  Scheme and host, NO trailing slash: https://example.com

  Every caller builds URLs as `${ORIGIN}${path}` and every path in this
  codebase already begins with a slash, so a trailing slash here produces
  https://example.com//pickleball/us/ — a real URL, a different page, and a
  duplicate of the one that was meant. The check below refuses it rather than
  letting it reach a canonical tag.
*/

const RAW = process.env.SITE_ORIGIN ?? 'https://example.invalid'

if (!/^https?:\/\/[^/]+$/.test(RAW)) {
  throw new Error(
    `SITE_ORIGIN must be a scheme and host with no path or trailing slash, e.g. https://example.com — got "${RAW}".`,
  )
}

/**
 * The origin every absolute URL on this site is built from.
 *
 * Defaults to https://example.invalid, which is a reserved name that can
 * never resolve. That is deliberate: an unset origin should be obviously
 * wrong in the output rather than plausibly wrong.
 */
export const ORIGIN = RAW

/** True while the origin is still the placeholder — nothing is launch-ready. */
export const ORIGIN_IS_PLACEHOLDER = ORIGIN === 'https://example.invalid'
