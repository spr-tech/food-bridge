// Reading and saving the chosen language: only a supported code is trusted, and blocked
// storage never throws.
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  isLanguage,
  LANGUAGE_STORAGE_KEY,
  readSavedLanguage,
  saveLanguage,
} from '@/utilities/helpers/language'

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.removeItem(LANGUAGE_STORAGE_KEY)
})

describe('isLanguage', () => {
  it('accepts the supported codes only', () => {
    expect(isLanguage('en')).toBe(true)
    expect(isLanguage('fr')).toBe(true)
    expect(isLanguage('es')).toBe(true)
    expect(isLanguage('klingon')).toBe(false)
    expect(isLanguage('FR')).toBe(false)
    expect(isLanguage(null)).toBe(false)
    expect(isLanguage(undefined)).toBe(false)
    expect(isLanguage(1)).toBe(false)
  })
})

describe('readSavedLanguage', () => {
  it('returns English when nothing is saved', () => {
    expect(readSavedLanguage()).toBe('en')
  })

  it('returns a saved supported language', () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, 'es')
    expect(readSavedLanguage()).toBe('es')
  })

  it('ignores a saved value that is not a supported language', () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, 'klingon')
    expect(readSavedLanguage()).toBe('en')
  })

  it('returns English when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(readSavedLanguage()).toBe('en')
  })
})

describe('saveLanguage', () => {
  it('saves the language', () => {
    saveLanguage('fr')
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('fr')
  })

  it('carries on quietly when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(() => saveLanguage('fr')).not.toThrow()
  })
})
