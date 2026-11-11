import { describe, expect, it } from 'vitest'
import { letterDelay, parseAccentHeading, wordDirection } from '@/utilities/helpers/accent-heading'

describe('parseAccentHeading', () => {
  it('splits the words before the marker from the accented letters', () => {
    const heading = parseAccentHeading('Tonight, let nothing good <accent>go to waste.</accent>')

    expect(heading.text).toBe('Tonight, let nothing good go to waste.')
    expect(heading.words).toEqual(['Tonight,', 'let', 'nothing', 'good'])
    expect(heading.accent).toEqual([['g', 'o'], ['t', 'o'], ['w', 'a', 's', 't', 'e', '.']])
  })

  it.each([
    ['no marker', 'Ce soir, ne laissez rien de bon se perdre.'],
    ['an unclosed marker', 'Ce soir, ne laissez rien de bon <accent>se perdre.'],
    ['a marker not at the end', 'Ce soir, ne laissez <accent>rien</accent> de bon se perdre.'],
  ])('with %s, shows the whole sentence as flying words and no tag', (_case, source) => {
    const heading = parseAccentHeading(source)

    expect(heading.text).toBe('Ce soir, ne laissez rien de bon se perdre.')
    expect(heading.words.join(' ')).toBe(heading.text)
    expect(heading.accent).toEqual([])
  })

  it('keeps accented letters whole, even when written as letter plus accent', () => {
    const heading = parseAccentHeading('Hoy <accent>está aquí come\u0301</accent>')

    expect(heading.accent).toEqual([['e', 's', 't', 'á'], ['a', 'q', 'u', 'í'], ['c', 'o', 'm', 'é']])
  })
})

describe('wordDirection', () => {
  const directions = (count: number) => Array.from({ length: count }, (_, i) => wordDirection(i, count))

  it('gives four words the four sides', () => {
    expect(directions(4)).toEqual(['left', 'top', 'bottom', 'right'])
  })

  it('starts left, ends right and alternates in between for any count', () => {
    expect(directions(1)).toEqual(['left'])
    expect(directions(2)).toEqual(['left', 'right'])
    expect(directions(7)).toEqual(['left', 'top', 'bottom', 'top', 'bottom', 'top', 'right'])
  })
})

describe('letterDelay', () => {
  it('keeps one step per letter up to 12 positions', () => {
    expect(letterDelay(11, 12)).toBe(11)
  })

  it('fits a longer accent into the same window', () => {
    expect(letterDelay(19, 20)).toBe(11)
  })
})
