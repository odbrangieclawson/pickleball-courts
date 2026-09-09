# SEO

Working document for Find Pickleball Courts. Three sections — on-page,
off-page, technical — each split into **what is already built** and **what is
not**. Every claim here names the file, script or gate that enforces it, so
this file can be checked rather than believed.

Companion documents: [decisions.md](./decisions.md) is the constitution and
outranks this file wherever they disagree; [DEPLOYMENT.md](./DEPLOYMENT.md)
holds the launch sequence; [PHASES.md](./PHASES.md) holds phase status.

**Status as of 2026-09-09.** 379 published pages passing all six gates: 35
city, 275 venue, 38 filter, 26 county, 5 state. 385 URLs in the sitemap.

---

## 0. The blocker that makes the rest theoretical

**The site is `noindex` and nothing below matters until it is not.**

`SITE_INDEXABLE` is unset and `SITE_ORIGIN` still points at
`pickleball-courts-cyan.vercel.app`. Every page emits `robots: noindex`, and
`robots.txt` disallows everything. Lighthouse scores perf 95-96, a11y 100,
best-practices 96 — and SEO 69, entirely because of the noindex.

`CONTACT_EMAIL` is also unset, so every claim and correction link on the live
site points at `claims@example.invalid`.

Do **not** set `SITE_INDEXABLE=true` while `SITE_ORIGIN` is the Vercel
hostname. The build refuses it, and a day of crawling there would leave
`vercel.app` URLs in the index that §3 then makes permanent.

The sequence is in DEPLOYMENT.md. In short: attach the domain in Vercel → set
`SITE_ORIGIN` and `CONTACT_EMAIL` → set `SITE_INDEXABLE=true` → redeploy →
curl checks → update `ci.yml` → Search Console + sitemap + Rich Results.

---

## 1. On-page SEO

### Built

- **One primary keyword per URL, enforced at build.** `keyword-map.json` plus
  `scripts/validate-keyword-map.mjs`. The build fails on a collision, so two
  pages cannot compete for the same term (Rule 9).
- **Titles and meta descriptions from one module**, `lib/page/titles.mjs`,
  with a character cap and an overflow ladder per page type. No page writes
  its own title string.
- **Every number on a page comes from `getCounts()`** (Rule 2), and
  `scripts/validate-no-bypass.mjs` fails the build if a route so much as calls
  `.length`. A title physically cannot claim a count the data does not hold.
- **Verified counts only in titles** (D8). A city holding 22 imported rows and
  10 sourced venues puts 10 in the title. The imported number appears nowhere
  a user or a crawler can see it.
- **Word bands, enforced** by `lib/page/words.mjs` and Page Gate 4: city
  800-1,350, venue 400-700, county 600-1,000, filter 400-700, state
  1,500-2,500. Under the floor, the page does not publish.
- **Three specific, non-templatable sentences per page** (Rule 3). Slot-filled
  sentences are fine; a boilerplate paragraph with the city name swapped in is
  not. This is the single biggest quality gap against the incumbents, whose
  venue prose reads "Players in Wichita, Kansas can enjoy pickleball at X."
- **Directory-wide claims are registered and recomputed at build.**
  `data/claims.json` plus `scripts/check-claims.mjs` — 266 claims across 35
  cities. A sentence saying "one of only seven cities with a free court"
  fails the build when it stops being true.
- **One `h1` per page, carrying no number** (`cityH1()` throws if it does).
- **Internal links are minted from the link graph**, `lib/site/links.mjs`. A
  link to an unpublished page cannot be written by hand.
- **Breadcrumbs** on every page, in markup and in JSON-LD.
- **FAQ blocks** on city, venue, county and state pages where real questions
  exist, never an empty node.
- **Images carry real alt text**, and a placeholder says it is a placeholder
  rather than implying we photographed the venue.

### Not built

- **Hours.** The single most-wanted fact and we publish almost none. Wichita's
  live in two City PDFs nobody has read. This is a content gap, not a
  technical one, and it is also an opening: the competitor mostly lacks them.
- **Open-play and league times.** Nobody covers this well. Highest-intent
  query class in the category and the hardest to fake, which suits the method.
- **Phone and website coverage.** 8 of 282 venues carry a phone, 11 a website.
  The venue action panel is built and mostly has nothing to show.
- **Title strategy against a bigger number.** Ours reads
  "Pickleball Courts in Wichita, KS: 10 Venues" against a competitor's
  "46 Best Pickleball Courts in Wichita, KS (2026)". Fix the coverage first;
  until then, consider not leading with the count.
- **Coverage.** The real one. See §4.

---

## 2. Off-page SEO

Nothing here is built, because the site has never been indexed. This section
is a plan, not a report.

### The honest starting position

Zero backlinks, zero domain authority, zero brand queries. The competitor has
10,706 monthly visits from 426 ranking keywords across ~25,000 pages — which
means roughly 98% of their pages rank for nothing, and 84% of their traffic
sits on one Wichita guide. They are not strong. They are early.

### What to do, in order

1. **Search Console and Bing Webmaster Tools** on launch day. Submit
   `/sitemap.xml`. This is not a link, but nothing else can be measured
   without it.
2. **The operators themselves.** Every venue page names the parks authority
   that published its facts and links to that source. Those departments link
   out to court finders. A short, specific note — "your pickleball page is our
   source for these ten venues, here is the page" — is the highest-quality
   link available and the least likely to be refused.
3. **The claim flow as a link engine.** `/add-your-court/` already exists. An
   operator who claims a listing has a reason to link to it. This is the one
   acquisition channel that scales with coverage rather than with outreach.
4. **Local clubs and leagues.** USAPA/USA Pickleball ambassador pages, city
   club sites, Facebook groups' link sections. Per-city, low volume, high
   relevance.
5. **The data as the story.** We hold sourced, dated court counts for whole
   metros — something no competitor can produce, because they cannot say where
   a number came from. A "how many pickleball courts does X actually have, and
   how would you know" piece is genuinely linkable. Do this only once several
   metros are complete.
6. **Reddit and forums: participate, do not drop links.** r/Pickleball and
   local subreddits will remove a directory link on sight, and should.

### What not to do

- No paid links, no directory swaps, no guest-post networks. This site's whole
  value proposition is that its facts can be checked; buying links is the same
  category of lie in a different field.
- No scraping competitors for link targets and mass-mailing them.
- Do not chase links before the pages are worth linking to. A 10-venue Wichita
  page against a 46-venue competitor does not deserve the link yet.

---

## 3. Technical SEO

### Built

- **Every page prerendered as static HTML.** 393 pages generated at build.
- **Full render with JavaScript disabled** (Rule 1), enforced by
  `scripts/check-js-off.mjs` as Page Gate 2: 386/386 pass. Content, links and
  schema are all in the raw HTML. This is why the map is positioned `<img>`
  tiles and not a map library — a library would leave a hole exactly where the
  map belongs.
- **JSON-LD on every page**, checked by Page Gate 3 and
  `scripts/validate-schema.mjs`. Rich Results tested in code mode: venue, city
  and state all valid, warnings only on optional fields. No `AggregateRating`
  is emitted, because no first-party ratings exist to justify one (O2).
- **Canonical URL on every page**, absolute, from `SITE_ORIGIN`.
- **`sitemap.xml`** from `lib/site/sitemap.mjs`, 385 URLs, `lastmod` set to the
  newest `date_checked` among the venues a page covers — a real freshness
  signal rather than the build timestamp.
- **`robots.txt` and per-route robots meta**, both gated by `SITE_INDEXABLE`
  (`lib/site/origin.mjs`), which refuses `true` without a real `SITE_ORIGIN`.
- **`dynamicParams = false` on every dynamic route.** An unmatched URL returns
  404, not 500. A 500 tells a crawler "broken, come back later" and keeps the
  dead URL; a 404 retires it.
- **Permanent URLs** (§3, IMMUTABLE) and a `-2` suffix ban (Rule 10).
  `scripts/identity/audit.mjs` will not re-derive a published slug.
- **A 404 monitor**, `scripts/monitor-404.mjs` against
  `data/monitor/known-urls.json`: 385 URLs ever published, 385 in the sitemap,
  0 dropped, 0 non-200/301. This is what catches a slug change before Google
  does.
- **A link crawl**, `scripts/crawl-report.mjs`: no dead internal links,
  click depth 0-2 from the homepage.
- **308 redirect from the `vercel.app` host** to the custom domain, live as
  soon as `SITE_ORIGIN` is not the Vercel hostname (`next.config.ts`).
- **Open Graph and Twitter cards**, with `summary_large_image` on city, county
  and state pages. The card image is a pickleball court, never a landmark, so
  a shared link or a result thumbnail shows the thing the page is about.
- **Five indexable filter pages per city and no more** (Rule 4): indoor,
  outdoor, free, public, lights. Every other facet is a noindex query
  parameter. This is what stops the crawl-budget bloat that gave a competitor
  5,750 dead city pages.
- **A three-venue threshold** (Rule 8). No thin pages, by construction.
- **Core Web Vitals**: Lighthouse perf 95-96 on live pages. Images carry
  explicit width and height; the hero is `fetchPriority="high"`; everything
  below the fold is lazy.
- **Map tiles served from our own origin** (`public/map/tiles`, 322 files,
  8.5 MB), so no reader's IP reaches a tile server, there is no key, and there
  is no per-render bill.

### Not built

- **Search Console.** Cannot be set up until the domain exists. Then: verify,
  submit the sitemap, watch Coverage for anything unexpectedly excluded, and
  check the Core Web Vitals report against real field data rather than lab.
- **IndexNow / Bing URL submission** on redeploy. Cheap, worth doing once
  pages change regularly.
- **Log-file analysis.** Once crawling starts, check what Googlebot actually
  fetches. With 379 pages this is a small job and worth doing early.
- **`hreflang`** — not applicable, US-only, single language.
- **Pagination** — not applicable yet. The largest grid is 49 venue cards on
  the Washington state page. Revisit past a few hundred.
- **A state-level filter facet.** Rule 4 caps indexable filter pages at five
  per city, so state filters cannot be pages. The sanctioned route is a
  noindex query parameter on `/search/`, which needs `lib/site/search.mjs`
  changed so a filter and a state query combine instead of the filter
  short-circuiting. No locked rule is involved.

---

## 4. The thing that actually decides it

Coverage, and it is not a technical problem.

In Wichita the competitor lists 46 venues; we list 10. Discount their
duplicates, their form-placeholder "venue", and the school that is in a
different town, and they still hold real venues we do not: a 10-court
eatertainment complex, a 12-court indoor facility, a health club, two country
clubs, four YMCAs.

The cause is that Wichita was sourced from `wichita.gov` alone. Those
operators publish their own court counts on their own sites, which is a
tier-1 source under our existing rules. Widening the source set from "the
municipal page" to "the municipal page plus each operator's own site" roughly
triples Wichita **without touching a gate, a threshold or a rule** — and fills
the phone numbers, websites and hours the venue panel currently has nothing to
show.

Ranked order of work:

1. Domain, `SITE_ORIGIN`, `CONTACT_EMAIL`, `SITE_INDEXABLE` — the blocker.
2. Widen sources per city to the operators. Wichita first, as the proof city.
3. Hours, starting with the two Wichita drop-in PDFs.
4. Then, and only then, off-page.

Page count is an output, never a target. Anything that would publish an
unsourced row to raise it is refused — see `prove-before-scale` and §5 of
decisions.md.

---

## 5. Commands

```
npm run build            # prebuild runs validate: keyword map, no-bypass, data, claims
npm run check:js-off     # Page Gate 2 across every built page
npm run gates:ci         # all six gates, every published page
npm run validate:schema  # JSON-LD, and the AggregateRating refusal
npm run crawl            # internal links and click depth
npm run monitor:404      # every URL ever published still resolves
npm run report:keywords  # keyword coverage report
npm test                 # 91 tests
```

## 6. Change log

| Date | Change |
| --- | --- |
| 2026-09-09 | File created. Current state recorded across on-page, off-page and technical, with the noindex blocker and the coverage gap named as the two things that decide the outcome. |
