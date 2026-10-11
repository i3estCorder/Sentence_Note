import React from 'react'

interface MatchRange {
  start: number
  end: number
  isPrimary: boolean
}

// Major irregular verbs dictionary for common English verbs
const IRREGULAR_VERBS: Record<string, string[]> = {
  show: ['shows', 'showed', 'shown', 'showing'],
  tuck: ['tucks', 'tucked', 'tucking'],
  stumble: ['stumbles', 'stumbled', 'stumbling'],
  reach: ['reaches', 'reached', 'reaching'],
  breathe: ['breathes', 'breathed', 'breathing'],
  fall: ['falls', 'fell', 'fallen', 'falling'],
  give: ['gives', 'gave', 'given', 'giving'],
  take: ['takes', 'took', 'taken', 'taking'],
  make: ['makes', 'made', 'making'],
  go: ['goes', 'went', 'gone', 'going'],
  come: ['comes', 'came', 'coming'],
  get: ['gets', 'got', 'gotten', 'getting'],
  see: ['sees', 'saw', 'seen', 'seeing'],
  find: ['finds', 'found', 'finding'],
  run: ['runs', 'ran', 'running'],
  speak: ['speaks', 'spoke', 'spoken', 'speaking'],
  break: ['breaks', 'broke', 'broken', 'breaking'],
  bring: ['brings', 'brought', 'bringing'],
  buy: ['buys', 'bought', 'buying'],
  catch: ['catches', 'caught', 'catching'],
  choose: ['chooses', 'chose', 'chosen', 'choosing'],
  do: ['does', 'did', 'done', 'doing'],
  draw: ['draws', 'drew', 'drawn', 'drawing'],
  drive: ['drives', 'drove', 'driven', 'driving'],
  eat: ['eats', 'ate', 'eaten', 'eating'],
  feel: ['feels', 'felt', 'feeling'],
  fly: ['flies', 'flew', 'flown', 'flying'],
  grow: ['grows', 'grew', 'grown', 'growing'],
  have: ['has', 'had', 'having'],
  hear: ['hears', 'heard', 'hearing'],
  hide: ['hides', 'hid', 'hidden', 'hiding'],
  hit: ['hits', 'hitting'],
  hold: ['holds', 'held', 'holding'],
  keep: ['keeps', 'kept', 'keeping'],
  know: ['knows', 'knew', 'known', 'knowing'],
  leave: ['leaves', 'left', 'leaving'],
  let: ['lets', 'letting'],
  lose: ['loses', 'lost', 'losing'],
  meet: ['meets', 'met', 'meeting'],
  pay: ['pays', 'paid', 'paying'],
  put: ['puts', 'putting'],
  read: ['reads', 'reading'],
  say: ['says', 'said', 'saying'],
  send: ['sends', 'sent', 'sending'],
  set: ['sets', 'setting'],
  sit: ['sits', 'sat', 'sitting'],
  sleep: ['sleeps', 'slept', 'sleeping'],
  stand: ['stands', 'stood', 'standing'],
  tell: ['tells', 'told', 'telling'],
  think: ['thinks', 'thought', 'thinking'],
  understand: ['understands', 'understood', 'understanding'],
  wear: ['wears', 'wore', 'worn', 'wearing'],
  win: ['wins', 'won', 'winning'],
  write: ['writes', 'wrote', 'written', 'writing'],
  look: ['looks', 'looked', 'looking'],
  turn: ['turns', 'turned', 'turning'],
  carry: ['carries', 'carried', 'carrying'],
  drop: ['drops', 'dropped', 'dropping'],
  stop: ['stops', 'stopped', 'stopping'],
  pass: ['passes', 'passed', 'passing'],
  step: ['steps', 'stepped', 'stepping'],
}

/**
 * Find base stem candidates for inflected words (e.g. 'showing' -> 'show', 'showed' -> 'show')
 */
function getBaseForms(word: string): string[] {
  const lower = word.toLowerCase().trim()
  if (!lower || lower.length < 2) return [lower]

  const bases = new Set<string>([lower])

  // Inverted irregular verbs lookup (e.g. 'showing', 'showed' -> 'show')
  for (const [base, forms] of Object.entries(IRREGULAR_VERBS)) {
    if (forms.includes(lower)) {
      bases.add(base)
    }
  }

  // Common suffix stemming
  if (lower.endsWith('ies') && lower.length > 4) {
    bases.add(lower.slice(0, -3) + 'y')
  }
  if (lower.endsWith('ied') && lower.length > 4) {
    bases.add(lower.slice(0, -3) + 'y')
  }
  if (lower.endsWith('ing') && lower.length > 4) {
    const stem = lower.slice(0, -3)
    bases.add(stem)
    bases.add(stem + 'e')
    if (stem.length >= 3 && stem[stem.length - 1] === stem[stem.length - 2]) {
      bases.add(stem.slice(0, -1))
    }
  }
  if (lower.endsWith('ed') && lower.length > 3) {
    const stem = lower.slice(0, -2)
    bases.add(stem)
    bases.add(stem + 'e')
    if (stem.length >= 3 && stem[stem.length - 1] === stem[stem.length - 2]) {
      bases.add(stem.slice(0, -1))
    }
  }
  if (lower.endsWith('es') && lower.length > 3) {
    bases.add(lower.slice(0, -2))
    bases.add(lower.slice(0, -1))
  }
  if (lower.endsWith('s') && !lower.endsWith('ss') && lower.length > 2) {
    bases.add(lower.slice(0, -1))
  }

  return Array.from(bases)
}

function expandSingleWordInflections(lower: string): string[] {
  const set = new Set<string>([lower])

  // Check irregular map first
  if (IRREGULAR_VERBS[lower]) {
    IRREGULAR_VERBS[lower].forEach((v) => set.add(v))
  }

  // Regular 3rd person singular (-s, -es, -ies)
  if (lower.endsWith('y') && !/[aeiou]y$/.test(lower)) {
    set.add(lower.slice(0, -1) + 'ies')
    set.add(lower.slice(0, -1) + 'ied')
  } else if (/(?:s|sh|ch|x|z|o)$/.test(lower)) {
    set.add(lower + 'es')
  } else {
    set.add(lower + 's')
  }

  // Regular past / past participle (-ed, -d)
  if (lower.endsWith('e')) {
    set.add(lower + 'd')
  } else {
    // Doubled consonant check (e.g. stop -> stopped, step -> stepped)
    if (/[bcdfghjklmnpqrstvwxyz][aeiou][bcdfghjklmnprstz]$/.test(lower)) {
      const lastChar = lower[lower.length - 1]
      set.add(lower + lastChar + 'ed')
      set.add(lower + lastChar + 'ing')
    }
    set.add(lower + 'ed')
  }

  // Progressive / Gerund (-ing)
  if (lower.endsWith('ie')) {
    set.add(lower.slice(0, -2) + 'ying')
  } else if (lower.endsWith('e') && !lower.endsWith('ee')) {
    set.add(lower.slice(0, -1) + 'ing')
  } else {
    set.add(lower + 'ing')
  }

  return Array.from(set)
}

/**
 * Generate regular and irregular English morphological inflections (present, past, progressive -ing)
 */
export function getWordInflections(word: string): string[] {
  const lower = word.toLowerCase().trim()
  if (!lower || lower.length < 2) return [lower]

  const baseCandidates = getBaseForms(lower)
  const allForms = new Set<string>([lower])

  for (const base of baseCandidates) {
    expandSingleWordInflections(base).forEach((f) => allForms.add(f))
  }

  return Array.from(allForms)
}

/**
 * Detect placeholder tokens like 'N', '~', '...', 'sth', 'sb', '[noun]', etc.
 */
export function isPlaceholderToken(token: string): boolean {
  const clean = token.replace(/^[~…]+|[~…]+$/g, '').trim()
  if (!clean) return true // was just ~ or …
  return /^(?:~+|\.{2,}|n|sb|sth|somebody|someone|something|one's|ones|\[n\]|\(n\)|\[sth\]|\(sth\)|\[sb\]|\(sb\)|\[noun\]|\(noun\))$/i.test(
    clean
  )
}

const PHRASAL_PARTICLES = new Set([
  'about', 'across', 'after', 'against', 'ahead', 'along', 'apart', 'around', 'aside',
  'at', 'away', 'back', 'by', 'down', 'for', 'forth', 'forward', 'from', 'in',
  'into', 'off', 'on', 'onto', 'out', 'over', 'round', 'through', 'to', 'together',
  'towards', 'under', 'up', 'upon', 'with'
])

export interface PhraseMatcher {
  type: 'single' | 'contiguous' | 'split'
  regex: RegExp
}

/**
 * Creates a flexible matcher supporting:
 * 1. Single words with full morphological verb inflection
 * 2. Phrasal verbs with explicit placeholders (e.g. 'Breathed N into ~', 'take N for granted', 'breathe ~ into')
 * 3. Transitive/separable verb idioms allowing intervening noun phrases (e.g. 'breathe into', 'show off')
 * 4. General contiguous multi-word phrases (e.g. 'reached a compromise', 'tucked away')
 */
export function createPhraseMatcher(phrase: string): PhraseMatcher | null {
  const normalized = phrase
    .replace(/~/g, ' ~ ')
    .replace(/\.{3,}/g, ' ... ')
    .trim()
  if (!normalized) return null

  const rawTokens = normalized.split(/\s+/).filter(Boolean)
  if (rawTokens.length === 0) return null

  // Trim leading/trailing placeholders (e.g. trailing '~', '...', etc.)
  while (rawTokens.length > 0 && isPlaceholderToken(rawTokens[0])) {
    rawTokens.shift()
  }
  while (rawTokens.length > 0 && isPlaceholderToken(rawTokens[rawTokens.length - 1])) {
    rawTokens.pop()
  }
  if (rawTokens.length === 0) return null

  const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  // Case 1: Single word
  if (rawTokens.length === 1) {
    const inflections = getWordInflections(rawTokens[0]).map(escapeRegex)
    inflections.sort((a, b) => b.length - a.length)
    return {
      type: 'single',
      regex: new RegExp(`\\b(${inflections.join('|')})\\b`, 'gi'),
    }
  }

  // Check for middle placeholder (e.g. 'Breathed N into ~', 'take N for granted', 'breathe ~ into')
  const placeholderIdx = rawTokens.findIndex(isPlaceholderToken)

  if (placeholderIdx !== -1) {
    const seg1 = rawTokens.slice(0, placeholderIdx)
    const seg2 = rawTokens.slice(placeholderIdx + 1).filter((t) => !isPlaceholderToken(t))

    if (seg1.length > 0 && seg2.length > 0) {
      const headInflections = getWordInflections(seg1[0]).map(escapeRegex)
      headInflections.sort((a, b) => b.length - a.length)

      const restSeg1 = seg1.slice(1).map(escapeRegex).join('\\s+')
      const seg1Pattern = restSeg1
        ? `\\b(?:${headInflections.join('|')})\\s+${restSeg1}\\b`
        : `\\b(?:${headInflections.join('|')})\\b`

      const seg2HeadInflections = getWordInflections(seg2[0]).map(escapeRegex)
      seg2HeadInflections.sort((a, b) => b.length - a.length)
      const restSeg2 = seg2.slice(1).map(escapeRegex).join('\\s+')
      const seg2Pattern = restSeg2
        ? `\\b(?:${seg2HeadInflections.join('|')})\\s+${restSeg2}\\b`
        : `\\b(?:${seg2HeadInflections.join('|')})\\b`

      // Intervening gap allows 1 to 5 words (e.g. "new life", "fresh energy")
      const regex = new RegExp(
        `(${seg1Pattern})(?:\\s+((?:[a-zA-Z0-9’'-]+\\s+){0,4}[a-zA-Z0-9’'-]+))?\\s+(${seg2Pattern})`,
        'gi'
      )
      return { type: 'split', regex }
    }
  }

  // Case 2: 2-word phrase without explicit placeholder, but second token is a phrasal particle
  // (e.g. 'breathe into', 'show off', 'turn on')
  if (rawTokens.length === 2 && PHRASAL_PARTICLES.has(rawTokens[1].toLowerCase())) {
    const headInflections = getWordInflections(rawTokens[0]).map(escapeRegex)
    headInflections.sort((a, b) => b.length - a.length)

    const particlePattern = `\\b${escapeRegex(rawTokens[1])}\\b`
    const regex = new RegExp(
      `(\\b(?:${headInflections.join('|')})\\b)(?:\\s+((?:[a-zA-Z0-9’'-]+\\s+){0,4}[a-zA-Z0-9’'-]+))?\\s+(${particlePattern})`,
      'gi'
    )
    return { type: 'split', regex }
  }

  // Case 3: General contiguous multi-word phrase (e.g. 'reached a compromise', 'tucked away')
  const headInflections = getWordInflections(rawTokens[0]).map(escapeRegex)
  headInflections.sort((a, b) => b.length - a.length)
  const restPhrase = rawTokens.slice(1).map(escapeRegex).join('\\s+')

  return {
    type: 'contiguous',
    regex: new RegExp(`\\b(${headInflections.join('|')})\\s+${restPhrase}\\b`, 'gi'),
  }
}

export function buildPhraseRegex(phrase: string): RegExp | null {
  return createPhraseMatcher(phrase)?.regex || null
}

/**
 * Find match ranges in sentence for a given phrase (with verb tense/inflection & split placeholder support)
 */
export function findPhraseMatches(
  sentenceText: string,
  phrase: string,
  isPrimary: boolean
): MatchRange[] {
  const ranges: MatchRange[] = []
  if (!sentenceText || !phrase.trim()) return ranges

  // 1. Try flexible regex matching for verb tenses, placeholders, and inflections
  const matcher = createPhraseMatcher(phrase)
  if (matcher) {
    let match: RegExpExecArray | null
    while ((match = matcher.regex.exec(sentenceText)) !== null) {
      if (matcher.type === 'split') {
        const seg1Text = match[1] // e.g. "breathed"
        const gapText = match[2]  // e.g. "new life"
        const seg2Text = match[3] // e.g. "into"

        if (gapText && gapText.trim()) {
          // Separated by intervening gap: highlight both parts individually
          // Part 1: verb
          ranges.push({
            start: match.index,
            end: match.index + seg1Text.length,
            isPrimary,
          })
          // Part 2: preposition/particle
          const seg2Start = match.index + match[0].length - seg2Text.length
          ranges.push({
            start: seg2Start,
            end: seg2Start + seg2Text.length,
            isPrimary,
          })
        } else {
          // Contiguous (no intervening gap): highlight the entire span
          ranges.push({
            start: match.index,
            end: match.index + match[0].length,
            isPrimary,
          })
        }
      } else {
        ranges.push({
          start: match.index,
          end: match.index + match[0].length,
          isPrimary,
        })
      }
    }
  }

  // 2. Fallback: literal substring search if regex didn't catch anything
  if (ranges.length === 0) {
    const lowerSentence = sentenceText.toLowerCase()
    const lowerPhrase = phrase.toLowerCase().trim()
    let start = 0
    while (start < lowerSentence.length) {
      const idx = lowerSentence.indexOf(lowerPhrase, start)
      if (idx === -1) break
      ranges.push({
        start: idx,
        end: idx + lowerPhrase.length,
        isPrimary,
      })
      start = idx + lowerPhrase.length
    }
  }

  return ranges
}

/**
 * Highlights the primary index phrase (in yellow) and other co-registered index phrases (in sky blue)
 * within the given sentence text, with automatic verb tense (ing, ed, s, etc.) support.
 */
export function highlightMultiPhrases(
  text: string,
  primaryPhrase: string,
  otherPhrases: string[] = []
): React.ReactNode {
  if (!text) return null
  const ranges: MatchRange[] = []

  // 1. Find matches for the primary phrase (including showing off, showed off, etc.)
  if (primaryPhrase.trim()) {
    const primaryMatches = findPhraseMatches(text, primaryPhrase, true)
    ranges.push(...primaryMatches)
  }

  // 2. Find matches for other secondary phrases
  for (const other of otherPhrases) {
    if (!other.trim() || other.toLowerCase().trim() === primaryPhrase.toLowerCase().trim()) {
      continue
    }

    const otherMatches = findPhraseMatches(text, other, false)
    for (const match of otherMatches) {
      // Avoid overlapping with already registered ranges
      const overlaps = ranges.some(
        (r) => Math.max(r.start, match.start) < Math.min(r.end, match.end)
      )
      if (!overlaps) {
        ranges.push(match)
      }
    }
  }

  // 3. Sort ranges by starting index
  ranges.sort((a, b) => a.start - b.start)

  // 4. Assemble React node fragments
  const fragments: React.ReactNode[] = []
  let cursor = 0

  ranges.forEach((range, idx) => {
    if (range.start > cursor) {
      fragments.push(text.substring(cursor, range.start))
    }

    const matchedStr = text.substring(range.start, range.end)
    if (range.isPrimary) {
      fragments.push(
        <mark
          key={`prim-${idx}-${range.start}`}
          className="bg-[#fef08a] text-[#12382c] px-2 py-0.5 rounded-md font-bold not-italic shadow-2xs ring-1 ring-amber-300/80"
          title="현재 인덱스"
        >
          {matchedStr}
        </mark>
      )
    } else {
      fragments.push(
        <mark
          key={`sec-${idx}-${range.start}`}
          className="bg-[#bae6fd] text-[#0369a1] px-2 py-0.5 rounded-md font-bold not-italic shadow-2xs ring-1 ring-sky-300/80"
          title="함께 등록된 다른 인덱스"
        >
          {matchedStr}
        </mark>
      )
    }

    cursor = range.end
  })

  if (cursor < text.length) {
    fragments.push(text.substring(cursor))
  }

  return <>{fragments}</>
}
