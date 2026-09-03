# Deployment

The site is a Next.js app deployed on Vercel from `main`. Every push to
`main` triggers a production build; nothing needs clicking. The repo builds
without `data.csv`, which is gitignored, because the published set comes from
`data/verified/` — see the note the data validator prints during `prebuild`.

## The build contract

`vercel.json` declares `framework: nextjs`, and vercel.json takes precedence
over the dashboard. That is deliberate: a project setting nobody can see in a
diff should not be able to redirect the build.

Everything else must be left at the framework default. In
**Settings → Build and Deployment**, the Override toggles for Build Command,
Output Directory and Install Command should all be **off**. Next.js writes to
`.next`; do not set an Output Directory, not even `.next`. Vercel's Next.js
builder finds it.

## Environment

| Variable | Type | Environment | Notes |
| --- | --- | --- | --- |
| `SITE_ORIGIN` | Config | Production | Scheme and host, e.g. `https://example.com` |

`SITE_ORIGIN` is read at **build time** — every page is prerendered, so it is
baked into canonical tags, the sitemap and every URL in the JSON-LD. Saving it
in the dashboard does nothing to an existing deployment; it applies to the
next build. Change it, then redeploy or push.

Unset, it defaults to `https://example.invalid`, a reserved name that can
never resolve. That is on purpose: an unconfigured origin should be obviously
wrong in the output rather than plausibly wrong. Closing decision O10 means
setting this and minting a real hostname.

A trailing slash or surrounding whitespace is normalised. A path
(`https://example.com/uk`) or a missing scheme fails the build with a message
naming the fault — see `lib/site/origin.mjs`.

## Failures worth recognising

All three of these actually happened, and each one cost a day of the site not
being live while looking as though it was.

**`No entrypoint found in output directory: "dist"`** — or, once the framework
preset was corrected, `The Next.js output directory "dist" was not found`. The
project carried Output Directory settings left over from a webpack app that
occupied this repo before. Next.js compiled fine and generated every page,
then Vercel looked in the wrong folder. Fix: turn the Output Directory
override off.

The dangerous part was not the error. It was that a failed build does not
replace production, so the last green deployment kept serving — in this case a
Create React App starter, an empty `<div id="app">` with no server-rendered
content, from before the directory existed. Sixteen consecutive builds failed
while the site appeared to be up. If the deployed page is 589 bytes, that is
what you are looking at.

That is the exact failure this project exists to refuse: Rule 1 says every
page renders its full content with JavaScript disabled, and what was being
served rendered nothing either way.

**`SITE_ORIGIN must be ... — got "[REDACTED]"`** — Vercel redacts environment
variable values in build logs, so an error that works by quoting the value it
received is useless in the one place it matters. Messages in
`lib/site/origin.mjs` now name the fault in words instead.

## Checking a deployment is real

Do not trust an HTTP 200. A client-side shell returns 200 for every path,
including ones that do not exist. Check for content:

```
curl -s https://<host>/ | grep -c "Deep Pickleball"     # expect > 0
curl -s https://<host>/pickleball/us/nc/charlotte/ | wc -c   # expect ~25KB, not 589
curl -s https://<host>/sitemap.xml | grep -c "<loc>"    # expect one per published page
curl -s https://<host>/ | grep -c "example.invalid"     # expect 0 once SITE_ORIGIN is set
curl -o /dev/null -w "%{http_code}" https://<host>/pickleball/us/zz/   # expect 404, NEVER 500

The second check is not pedantry. Every unmatched URL under
/pickleball/us/ once returned 500 instead of 404, because the dynamic
routes did not pin `dynamicParams = false`. A 500 tells a crawler to keep
a dead URL and come back; a 404 retires it. Check a deliberately wrong
URL on every deployment, not just a right one.
```

The whole site is `noindex, nofollow` with `Disallow: /` in robots.txt, which
is correct while it is a preview and must be lifted deliberately before
launch. That decision travels with O10.
