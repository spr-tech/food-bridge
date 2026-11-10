// Start-up language: the app starts in the language saved on this device, falls back to
// English for anything else, and survives blocked storage. Each test loads a fresh copy of
// the config on its own i18next instance: vi.resetModules alone would not do, because
// packages in node_modules are not reset, so every copy would re-initialise the one shared
// instance (and the earlier copies' listeners would still be on it).
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LANGUAGE_STORAGE_KEY } from '@/utilities/helpers/language'

async function startApp() {
  vi.resetModules()
  vi.doMock('i18next', async () => {
    const actual = await vi.importActual<typeof import('i18next')>('i18next')
    return { ...actual, default: actual.default.createInstance() }
  })
  const { default: i18n } = await import('@/configs/i18nConfig')
  return i18n
}

afterEach(() => {
  vi.doUnmock('i18next')
  vi.restoreAllMocks()
  localStorage.removeItem(LANGUAGE_STORAGE_KEY)
  document.documentElement.lang = 'en'
})

describe('Start-up language', () => {
  it('starts in English when nothing is saved, and saves nothing', async () => {
    const i18n = await startApp()

    expect(i18n.language).toBe('en')
    expect(document.documentElement.lang).toBe('en')
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBeNull()
  })

  it('starts in a saved French', async () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, 'fr')
    const i18n = await startApp()

    expect(i18n.language).toBe('fr')
    expect(i18n.t('nav.findFood')).toBe('Trouver des aliments')
    expect(document.documentElement.lang).toBe('fr')
  })

  it('starts in English when the saved value is not a supported language', async () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, 'klingon')
    const i18n = await startApp()

    expect(i18n.language).toBe('en')
    expect(i18n.t('nav.findFood')).toBe('Find food')
  })

  it('starts in English when storage is blocked, and still changes language', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    const i18n = await startApp()

    expect(i18n.language).toBe('en')
    await expect(i18n.changeLanguage('es')).resolves.toBeDefined()
    expect(i18n.t('nav.findFood')).toBe('Buscar comida')
  })

  it('saves a change made after start-up', async () => {
    const i18n = await startApp()
    await i18n.changeLanguage('es')

    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('es')
  })
})
