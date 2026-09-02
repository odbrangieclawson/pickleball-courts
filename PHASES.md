# PHASES.md

Phase status for the Deep Pickleball directory.

This file records **where the work is**. [`decisions.md`](./decisions.md)
records **what the rules are**. When they disagree, `decisions.md` wins.

Each completed phase is marked with an annotated git tag, so any phase
boundary can be checked out or diffed:

```bash
git tag -n                  # list phases with their annotations
git show phase-0            # what shipped, and why
git diff phase-0..HEAD      # everything since
```

---

## Phase 0 — Foundation ✅ COMPLETE

**Tagged `phase-0`. Shipped 2026-09-02.**

Locked the things that are expensive to change later. No pages, no content,
no imported data — by constraint.

| Delivered | Where |
| --- | --- |
| Next.js 16 App Router, static generation | `app/`, `next.config.ts` |
| Locked decisions, sections 1–7 verbatim | `decisions.md` |
| One primary keyword per URL + build-time validator | `keyword-map.json`, `scripts/validate-keyword-map.mjs` |
| v4 data model, 5 entities | `data/schemas/` |
| 4 controlled vocabularies, definition per value | `data/vocabularies/` |
| Page Gate 2 enforcement | `scripts/check-js-off.mjs` |
| Build / validator / gates / JS-off docs | `README.md` |

**Why the stack changed.** The repo began as a Create New App webpack SPA
whose built `index.html` was an empty `<div id="app">`, with a `vercel.json`
rewriting every URL to that shell. It failed Rule 1 on every page,
permanently. That was replaced, not patched.

**Gate status at tag:** Page Gate 2 PASS (automated). Page Gate 3 PARTIAL —
BreadcrumbList enforced, the rest have nothing to attach to. Gates 1, 4, 5, 6
are N/A with no data. Import Gates I1–I4: none enforced; partially encoded in
the schemas.

---

## Phase 1 and onward — NOT YET DEFINED

**The owner has not specified phases 1 through 6.** They are deliberately
left blank rather than guessed at. Two things are known about them:

**Phase 7 is the proof checkpoint**, named in the sequencing rules. Scaling
past 50–100 metros before it passes is a rule violation, not a judgement
call.

**Whatever Phase 1 is, it is bounded by O11.** All 18,038 imported rows lack
`source_url` and `date_checked`. Rule 12 therefore makes every row
`status=pending`, and Rule 8 keeps pending rows out of the 3-verified-venue
threshold. **Publishable inventory is currently zero.** No city, county or
filter page can lawfully exist until verification work happens, so page
building cannot come first regardless of how the phases are numbered.

### Known entry blockers

| Blocker | Where tracked | Effect |
| --- | --- | --- |
| The eight decisions were never supplied | `decisions.md` §8 | Section reserved and BLOCKING. D1–D8 left unused across the codebase. |
| O11 — where verification data comes from | `decisions.md` §9 | Gates all publishing. |
| O1 — no controlled vocabulary for `access_type` | `decisions.md` §9 | `/public/` is a LOCKED filter slug with no lawful data driver. |
| O10 — canonical hostname | `decisions.md` §9 | Schema `@id`, canonicals and sitemap all still use `example.invalid`. |

---

## The sequencing rules that bound every phase

Reproduced from `decisions.md`. These are not scheduling advice.

1. **Verify and publish 50–100 metros to a complete standard, prove the
   template ranks, and only then release more of the dataset in waves.** All
   three competitors scaled before proving, which is why 20,000+ pages
   produce so little for two of them.
2. **Page count is an output, never a target.** Publishing unsourced rows,
   lowering the 3-venue threshold, or putting an imported row count where a
   verified count belongs is refused, not negotiated.

## Tagging convention

One annotated tag per completed phase: `phase-0`, `phase-1`, … The tag lands
on the commit where that phase's work and its documentation are both present,
so checking out a tag gives a coherent snapshot rather than code without its
record.
