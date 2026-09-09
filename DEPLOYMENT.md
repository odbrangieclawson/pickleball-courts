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
| `SITE_ORIGIN` | Config | Production | Scheme and host, no trailing slash. Currently `https://pickleball-courts-cyan.vercel.app` |
| `SITE_INDEXABLE` | Config | Production | `true` or `false`. Unset means false. **Unset today: the whole site is noindex.** Refuses to build as `true` while `SITE_ORIGIN` is unset. See "Launch day" below. |
| `CONTACT_EMAIL` | Config | Production | The inbox every "Claim this listing", "Send a correction" and "Add your court" link opens. Read once, in `lib/site/contact.mjs`. Unset it falls back to `claims@example.invalid`, and the build refuses `SITE_INDEXABLE=true` until it is set. **Unset today.** |

**The live origin is `https://pickleball-courts-cyan.vercel.app`,** verified
against the deployed site on 2026-09-04: it is what the canonical tags, the
sitemap and every URL inside the JSON-LD carry, and `example.invalid` appears
nowhere in the output. It is recorded here because it was previously written
down nowhere in this repository — it lived only in a dashboard setting, so
confirming the site was configured at all meant asking a human.

That is the Vercel-generated production domain for this project. If a custom
domain is attached later, `SITE_ORIGIN` must be changed to it and the site
rebuilt, because the value is baked into every prerendered page — see below.

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

## Launch day: the custom domain and the index switch

The site shipped its first thirty-five cities with every page `noindex,
nofollow` and `Disallow: /` in robots.txt, by decision: the hostname a
crawler first sees becomes the URL set that must be redirected forever, and
the only hostname so far is the Vercel-generated one. Everything a crawler
needs — static HTML, canonicals, sitemap, structured data, Open Graph tags,
the parameter disallows — is already built and tested. Two environment
variables and a DNS record are what remain, and none of them is a code
change.

**Prepared in the repo (2026-09-07), with indexing still off:**

- `SITE_INDEXABLE` — one switch in `lib/site/origin.mjs`. Off: robots
  disallows everything and every page carries noindex. On: robots allows the
  site (the parameter disallows and `/internal/` stay disallowed) and every
  publishable page carries `index, follow`. The internal provenance tool,
  the search form and 404 fallbacks keep their own literal noindex in both
  states. `scripts/test/indexing.test.mjs` covers all three states.
- Open Graph and Twitter card tags on every page, carrying that page's own
  title and description (`app/layout.tsx`). No image, deliberately.
- A host redirect in `next.config.ts`: once `SITE_ORIGIN` is anything other
  than the Vercel hostname, every request that arrives on
  `pickleball-courts-cyan.vercel.app` is redirected (308, permanent) to the
  same path on the origin, so the old hostname never serves a duplicate copy.
  While `SITE_ORIGIN` is still the Vercel hostname the rule does not exist.

**On the day, in this order:**

1. Buy the domain. In Vercel → Settings → Domains, add it and follow the DNS
   instructions (an A/ALIAS record for the apex, a CNAME for `www`). Choose
   one form as primary — apex or `www` — and let Vercel redirect the other.
   Wait until Vercel shows the domain as valid with a certificate.
2. In Vercel → Settings → Environment Variables (Production): set
   `SITE_ORIGIN` to `https://<the domain>` (scheme and host only, the
   primary form chosen above), `CONTACT_EMAIL` to the inbox that will
   receive claims and corrections, and `SITE_INDEXABLE` to `true`.
3. Redeploy (push to `main`, or Redeploy in the dashboard). All three variables
   are read at build time; saving them changes nothing until a build runs.
4. Verify against the live domain, with a plain `curl`, not a browser:
   - `/robots.txt` starts `Allow: /` and ends with the sitemap on the domain.
   - Any city page carries `<meta name="robots" content="index, follow">`
     and a canonical on the domain; `/internal/provenance/` still says
     noindex.
   - `/sitemap.xml` lists the domain, not vercel.app.
   - `https://pickleball-courts-cyan.vercel.app/pickleball/us/wa/seattle/`
     answers 308 to the same path on the domain.
   - `node scripts/monitor-404.mjs --live https://<the domain>` passes.
   - **`/search/` answers 200, and `/search/?q=Seattle` returns results.**
     This is the only route rendered on demand, so it is the only one that
     can be broken in production while every other page is fine. It is not
     in the sitemap and not in the 404 monitor, which is exactly how it sat
     broken and unnoticed until 2026-09-09: `lib/data/schema.mjs` read
     `data/schemas/*.json` at module scope, Next never traced those files
     into the function, and every request died with ENOENT at module
     evaluation. Check it by hand at every launch and after any change to
     what the search route imports.
   - A note on `curl` against the Vercel host: it can answer
     `X-Vercel-Mitigated: challenge` to scripted requests, in which case
     you are reading a bot-challenge page rather than the site and every
     grep for page content silently returns nothing. If a check looks
     inexplicably empty, confirm in a browser before believing it.
5. Update this file's origin line and `ci.yml`'s `SITE_ORIGIN` repository
   variable to the domain, so the scheduled production monitor watches the
   right host. Record the date and the hostname in `decisions.md`.
6. Google Search Console: add the domain property (DNS verification), submit
   `/sitemap.xml`, and run the Rich Results test on one city page, one venue
   page and one state page. Bing Webmaster Tools accepts a Search Console
   import.
7. Then wait. Indexing takes days to weeks, and that waiting is Phase 7.

**Rich Results test, run 2026-09-07 in code mode** (the URL mode cannot fetch
a page that robots.txt disallows, which is the intended state until launch;
the JSON-LD of three live pages was pasted instead). Venue page (Welsh Park,
Rockville): 3 valid items — Breadcrumbs, Local businesses
(SportsActivityLocation), Organization; the only warnings are the optional
`priceRange`, `telephone` and `image` fields. City page (Rockville): 2 valid
items — Breadcrumbs and Carousels (the ItemList) — no warnings. State page
(California): 2 valid items — Breadcrumbs and Datasets — with non-critical
warnings on optional Dataset fields. FAQPage is present on every page and
valid, but Google no longer shows FAQ rich results for sites of this kind,
so the test does not list it. Step 6 above repeats this in URL mode on the
real domain, which should report the same items.

**Do not** turn `SITE_INDEXABLE` on while `SITE_ORIGIN` is still the Vercel
hostname. A day of crawling there gains nothing and leaves vercel.app URLs in
the index that the redirect then has to carry forever.

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
curl -s https://<host>/ | grep -c "Find Pickleball Courts"     # expect > 0
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
