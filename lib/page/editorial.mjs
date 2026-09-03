/*
  DECISION D3 - TEMPLATE THE SENTENCE, NOT THE PARAGRAPH (decisions.md §8).
  Rule 3: template the sentence, not the paragraph. Every page needs at
  least three specific, non-templatable sentences.

  Two mechanisms, because Rule 3 has two halves.

  ------------------------------------------------------------------
  HALF ONE: slot-filled sentences are FINE
  ------------------------------------------------------------------
  sentence() builds factual prose from data. These are allowed to be
  identical in shape across every city, because their content is a fact
  that differs. "Fort Worth has 6 verified venues" is not boilerplate; it
  is a true sentence that happens to have a shape.

  ------------------------------------------------------------------
  HALF TWO: editorial slots are REQUIRED, and cannot be faked
  ------------------------------------------------------------------
  Four notes must be written per city by someone who knows it: parking,
  peak hours, surface condition, local scene.

  The system refuses to render a page whose editorial slots are empty,
  placeholder, or recycled from another city:

    - a missing slot fails the gate, it does not render as blank
    - text matching a placeholder pattern ("TODO", "TBD", "lorem", "N/A",
      "coming soon") fails
    - text under MIN_EDITORIAL_WORDS fails, because a four-word note is a
      placeholder wearing a sentence
    - text identical to the same slot on another city fails, which is the
      "swap the city name in" failure Rule 3 names directly
    - text that is ONLY slot-fill - every clause traceable to a data field -
      is flagged as templated

  WHY IT IS NOT AUTO-WRITTEN

  Nothing here generates editorial copy. A parking note is a claim about a
  real place: whether the lot fills by 9am, whether street parking is legal
  on match nights. Inventing that is fabricating a fact about the world,
  which the project rules forbid outright and which no amount of fluent
  prose makes acceptable. The slots are inputs, not outputs.
*/

export const EDITORIAL_SLOTS = Object.freeze([
  {key: 'parking', prompt: 'What is parking actually like? Where do people park, when does it fill, is there a fee or a permit?'},
  {key: 'peak_hours', prompt: 'When are the courts busy, and when should someone turn up to get on? Morning leagues, after-work crowds, weekend rotations.'},
  {key: 'surface_condition', prompt: 'What condition are the surfaces in? Recent resurfacing, cracks, faded lines, which venue is best kept.'},
  {key: 'local_scene', prompt: 'What is the pickleball scene like here? Clubs, regular open play, notable groups, how newcomers get into a game.'},
])

/*
  Slots differ by page type. A county is not somewhere you park — it is an
  administrative area covering many places, so asking it for a parking note
  would guarantee either a vague answer or a fabricated one. Each page type
  gets the questions it can actually answer honestly.
*/
export const COUNTY_SLOTS = Object.freeze([
  {key: 'coverage', prompt: 'What have we verified in this county, and what have we not? Which cities are published and which are waiting?'},
  {key: 'distribution', prompt: 'How are the courts spread across the county? Concentrated in one city, spread evenly, clustered along a corridor?'},
  {key: 'gaps', prompt: 'What is missing here, honestly, and what would it take to close it?'},
])

export const STATE_SLOTS = Object.freeze([
  {key: 'coverage', prompt: 'What is verified across the state and what is not?'},
  {key: 'seasonality', prompt: 'What does the weather do to play here, and what does indoor availability look like by season?'},
  {key: 'notable', prompt: 'Which facilities are genuinely notable in this state, and why?'},
  {key: 'growth', prompt: 'How is pickleball provision changing here — new builds, conversions, policy?'},
])

export const SLOTS_FOR = Object.freeze({
  city: EDITORIAL_SLOTS,
  filter: EDITORIAL_SLOTS,
  county: COUNTY_SLOTS,
  state: STATE_SLOTS,
})

export const MIN_EDITORIAL_WORDS = 25

const PLACEHOLDER = /\b(todo|tbd|lorem ipsum|placeholder|coming soon|n\/a|xxx|fill in|write this)\b/i

const wordCount = s => String(s ?? '').trim().split(/\s+/).filter(Boolean).length

/**
 * Validate the editorial notes for one city.
 * @param {Record<string,string>} notes
 * @param {Map<string,Set<string>>} [seenElsewhere] slot -> texts used on other cities
 */
export function checkEditorial(notes, seenElsewhere = new Map(), slots = EDITORIAL_SLOTS) {
  const problems = []
  const ok = []
  for (const slot of slots) {
    const text = notes?.[slot.key]
    if (!text || !String(text).trim()) {
      problems.push(`editorial slot "${slot.key}" is empty — ${slot.prompt}`)
      continue
    }
    const t = String(text).trim()
    if (PLACEHOLDER.test(t)) {
      problems.push(`editorial slot "${slot.key}" contains placeholder text: "${t.slice(0, 60)}"`)
      continue
    }
    if (wordCount(t) < MIN_EDITORIAL_WORDS) {
      problems.push(`editorial slot "${slot.key}" is ${wordCount(t)} words, under the ${MIN_EDITORIAL_WORDS}-word floor — too short to say anything specific`)
      continue
    }
    const others = seenElsewhere.get(slot.key)
    if (others && others.has(normalise(t))) {
      problems.push(`editorial slot "${slot.key}" is recycled from another city — Rule 3 forbids a paragraph with the city name swapped in`)
      continue
    }
    ok.push(slot.key)
  }
  return {pass: problems.length === 0, problems, filled: ok}
}

const normalise = s => String(s).toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim()

/*
  ------------------------------------------------------------------
  THE TEMPLATED-SENTENCE DETECTOR
  ------------------------------------------------------------------
  Answers "which sentences read as templated?" mechanically instead of by
  vibe. A sentence is flagged when, after removing every value that came
  from data, almost nothing is left - meaning the sentence carries no
  authored content, only slot-fill.

  This is a HINT, not a gate. A slot-filled factual sentence is allowed by
  Rule 3; the detector exists so the writer can see how much of the page is
  scaffolding and whether the specific sentences are actually specific.
*/

/**
 * @param {string} text        the rendered prose
 * @param {string[]} dataValues every value that came from a record or a count
 * @returns {{sentence:string, residueWords:number, templated:boolean}[]}
 */
export function findTemplatedSentences(text, dataValues = []) {
  const sentences = String(text)
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 20)

  const values = dataValues
    .filter(v => v !== null && v !== undefined && String(v).length > 1)
    .map(v => String(v))
    .sort((a, b) => b.length - a.length) // longest first, so "Fort Worth" beats "Fort"

  return sentences.map(s => {
    let residue = s
    for (const v of values) {
      residue = residue.split(v).join(' ')
    }
    const residueWords = wordCount(residue.replace(/[^a-zA-Z ]/g, ' '))
    return {
      sentence: s,
      residueWords,
      // Under 8 authored words once data is stripped: it is scaffolding.
      templated: residueWords < 8,
    }
  })
}

/**
 * Rule 3's hard requirement: at least three specific, non-templatable
 * sentences. Counted as sentences whose residue survives the detector AND
 * which came from an editorial slot rather than a data template.
 */
export function countSpecificSentences(editorialNotes, slots = EDITORIAL_SLOTS) {
  let n = 0
  for (const slot of slots) {
    const t = editorialNotes?.[slot.key]
    if (!t) continue
    n += String(t).split(/(?<=[.!?])\s+/).filter(s => wordCount(s) >= 6).length
  }
  return n
}
