/*
  Rule 5 / Page Gate 4: word bands, enforced.

  Closes open decision O8, which asked not just for a checker but for a
  DEFINITION of what counts as a word. Without that the band is unfalsifiable.

  WHAT COUNTS

  Prose the reader actually reads, in the page body:
    headings, paragraphs, list items, table cells, figure captions,
    the editorial notes, the gap disclosure, the FAQ.

  WHAT DOES NOT COUNT, and why

    site navigation and footer   present on every page; counting them would
                                 let boilerplate inflate a thin page into the
                                 band. This is the single biggest way a word
                                 count lies.
    JSON-LD                      machine-readable, never read by a human
    the provenance line          "Source: … Checked: 2026-09-02" is metadata.
                                 Rule 7 requires it on every fact, so counting
                                 it would reward attaching more sources rather
                                 than writing more substance.
    venue names and addresses    data, not prose. A city with 40 venues would
                                 otherwise clear the band on its address list
                                 alone - exactly the PlayPickleball failure of
                                 5,751 pages that "have content" and say
                                 nothing.
    numbers rendered from counts they are data. Counted as one word each only
                                 when embedded in a sentence, never as a bare
                                 table column.

  The rule of thumb behind all of it: if deleting every venue from the page
  would not change the sentence, it counts. If the sentence only exists
  because a row exists, it does not.
*/

export const WORD_BANDS = Object.freeze({
  city: [1200, 2000],
  venue: [700, 1200],
  county: [900, 1500],
  filter: [600, 1000],
  state: [3000, 5000],
})

/** Marker attributes the template uses to tell the counter what is prose. */
export const PROSE_ATTR = 'data-prose'
export const NOT_PROSE_ATTR = 'data-not-prose'

/**
 * Count words in an HTML fragment.
 * Only elements carrying data-prose are counted, and anything inside a
 * data-not-prose subtree is removed first. Opt-in, so a new component
 * cannot silently inflate the count by existing.
 */
export function countWords(html) {
  let s = String(html)
  // Remove machine-readable and explicitly excluded regions.
  s = s.replace(/<script[\s\S]*?<\/script>/gi, ' ')
  s = s.replace(/<style[\s\S]*?<\/style>/gi, ' ')
  s = s.replace(new RegExp(`<([a-z]+)[^>]*\\b${NOT_PROSE_ATTR}\\b[\\s\\S]*?<\\/\\1>`, 'gi'), ' ')

  // Keep only data-prose regions.
  const prose = [...s.matchAll(new RegExp(`<([a-z]+)[^>]*\\b${PROSE_ATTR}\\b[^>]*>([\\s\\S]*?)<\\/\\1>`, 'gi'))]
    .map(m => m[2])
    .join(' ')

  return wordsIn(prose)
}

export function wordsIn(fragment) {
  const text = String(fragment)
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!text) return 0
  return text.split(' ').filter(w => /[a-z0-9]/i.test(w)).length
}

/**
 * @returns {{pass:boolean, words:number, band:[number,number], verdict:string}}
 */
export function checkBand(pageType, html) {
  const band = WORD_BANDS[pageType]
  if (!band) throw new Error(`No word band defined for page type "${pageType}"`)
  const words = countWords(html)
  const [min, max] = band
  const pass = words >= min && words <= max
  const verdict = pass
    ? `${words} words, inside the ${min}-${max} band`
    : words < min
      ? `${words} words, ${min - words} SHORT of the ${min}-word minimum`
      : `${words} words, ${words - max} OVER the ${max}-word maximum`
  return {pass, words, band, verdict}
}
