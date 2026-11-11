// Reads an animated heading written as one translation, e.g.
// "Tonight, let nothing good <accent>go to waste.</accent>": the words before the marker
// fly in one by one, the accented end drops in letter by letter. Translators choose which
// words are accented. A missing or broken marker never shows the raw tag and never throws:
// the whole sentence then flies in word by word, with no letter drop.

export type WordDirection = 'left' | 'top' | 'bottom' | 'right'

export interface AccentHeading {
  /** The sentence as plain text, for screen readers. */
  text: string
  /** Words that fly in from the sides. */
  words: string[]
  /** The accented end, as words split into letters; empty when there is no valid marker. */
  accent: string[][]
}

// The accent must close the sentence (only spaces may follow it).
const MARKED = /^([\s\S]*?)<accent>([\s\S]*?)<\/accent>\s*$/
const ANY_TAG = /<\/?[a-z][^>]*>/gi

const splitWords = (text: string) => text.split(/\s+/).filter(Boolean)

// NFC first, so "é" written as e + combining accent becomes one letter; Array.from keeps
// characters outside the basic plane whole.
const splitLetters = (word: string) => Array.from(word.normalize('NFC'))

export function parseAccentHeading(source: string): AccentHeading {
  const match = MARKED.exec(source)
  const lead = match ? match[1] : source.replace(ANY_TAG, ' ')
  const accentText = match ? match[2].replace(ANY_TAG, ' ') : ''
  const words = splitWords(lead.replace(ANY_TAG, ' '))
  const accentWords = splitWords(accentText)
  return {
    text: [...words, ...accentWords].join(' '),
    words,
    accent: accentWords.map(splitLetters),
  }
}

// First word from the left, last from the right, the ones between alternate top and
// bottom. Four words give left, top, bottom, right.
export function wordDirection(index: number, count: number): WordDirection {
  if (index === 0) return 'left'
  if (index === count - 1) return 'right'
  return index % 2 === 1 ? 'top' : 'bottom'
}

// The letter drop has room for 12 positions (letters and spaces) at 3% of the scroll each;
// a longer accent spreads its letters closer together so the last one still lands.
const LETTER_SLOTS = 12

export function letterDelay(position: number, positions: number): number {
  return positions > LETTER_SLOTS ? (position * (LETTER_SLOTS - 1)) / (positions - 1) : position
}
