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

const RAW = String(process.env.SITE_ORIGIN ?? 'https://example.invalid').trim()

/*
  A TRAILING SLASH IS FIXED, NOT REFUSED.

  The first version of this threw on one, and it failed a real deployment for
  something the code can correct without guessing. "https://example.com/" and
  "https://example.com" name the same origin; normalising is not inference.
  Refusing it just moves work onto whoever is typing into a settings panel.

  A PATH IS STILL REFUSED, because it is not the same thing. Nobody can tell
  whether "https://example.com/uk" means the site lives under /uk or whether a
  path was pasted in by mistake, and guessing wrong puts a broken canonical on
  every page.

  THE MESSAGE MUST NAME THE FAULT, NOT ECHO THE VALUE.

  This is the part that actually bit. The old message worked by quoting what
  it received — and Vercel redacts environment variable values in build logs,
  so the deployment failed with `got "[REDACTED]"`, which tells the reader
  nothing at all. An error that only makes sense when you can see the secret
  is useless in exactly the place errors matter most. So each branch below
  says what is wrong in words.
*/
const withoutTrailingSlash = RAW.replace(/\/+$/, '')

if (!/^https?:\/\//i.test(withoutTrailingSlash)) {
  throw new Error(
    'SITE_ORIGIN must start with http:// or https://. It appears to be missing a scheme. ' +
    'Set it to scheme and host only, for example https://example.com',
  )
}
if (/^https?:\/\/[^/]+\/.+/i.test(withoutTrailingSlash)) {
  throw new Error(
    'SITE_ORIGIN must be a scheme and host only, with no path after the hostname. ' +
    'It looks like a path was included. Every URL on this site is built as origin + path, ' +
    'and each path already begins with a slash. Set it to something like https://example.com',
  )
}
if (/\s/.test(withoutTrailingSlash)) {
  throw new Error('SITE_ORIGIN contains whitespace. Set it to scheme and host only, for example https://example.com')
}

/**
 * The origin every absolute URL on this site is built from.
 *
 * Defaults to https://example.invalid, which is a reserved name that can
 * never resolve. That is deliberate: an unset origin should be obviously
 * wrong in the output rather than plausibly wrong.
 */
export const ORIGIN = withoutTrailingSlash

/** True while the origin is still the placeholder — nothing is launch-ready. */
export const ORIGIN_IS_PLACEHOLDER = ORIGIN === 'https://example.invalid'

/*
  INDEXING IS A SECOND SWITCH, SEPARATE FROM THE ORIGIN.

  The site was built noindex and stayed that way through thirty-five cities,
  by decision, not by accident: the hostname a crawler first sees becomes the
  URL set that must be redirected forever, and the only hostname so far is
  a vercel.app subdomain. Flipping index on used to mean editing robots.ts
  and every route's generateMetadata by hand. Now it is one variable,
  SITE_INDEXABLE=true, read here and nowhere else.

  It refuses to turn on while the origin is still the placeholder. Indexing
  a site whose canonicals name example.invalid would be the same silent
  failure O10 was about, so the two switches are tied.

  Set it, set SITE_ORIGIN to the real domain, redeploy. Nothing in the code
  changes on launch day.
*/
const INDEX_RAW = String(process.env.SITE_INDEXABLE ?? '').trim().toLowerCase()
if (INDEX_RAW && !['true', 'false', '1', '0', 'yes', 'no'].includes(INDEX_RAW)) {
  throw new Error('SITE_INDEXABLE must be "true" or "false" (or unset, which means false).')
}
if (['true', '1', 'yes'].includes(INDEX_RAW) && ORIGIN_IS_PLACEHOLDER) {
  throw new Error(
    'SITE_INDEXABLE is true but SITE_ORIGIN is not set, so every canonical would name the ' +
    'placeholder origin. Set SITE_ORIGIN to the real domain before turning indexing on.',
  )
}

/** True only when the owner has switched indexing on for a real origin. */
export const INDEXABLE = ['true', '1', 'yes'].includes(INDEX_RAW) && !ORIGIN_IS_PLACEHOLDER

/**
 * The robots directive every publishable page declares. Pages that are
 * never for indexing (internal tooling, the search form, 404 fallbacks)
 * keep their own literal noindex and do not use this.
 */
export const PAGE_ROBOTS = INDEXABLE
  ? {index: true, follow: true}
  : {index: false, follow: false}
