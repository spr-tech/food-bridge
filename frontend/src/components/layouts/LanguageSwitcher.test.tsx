// The language switcher on its own: named "Language", shows the current language in its
// own name, lists every language in its own name, and choosing one changes and saves it.
// The test setup puts English back and clears the saved language afterwards.
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import i18next from '@/configs/i18nConfig'
import { LanguageSwitcher } from '@/components/layouts/LanguageSwitcher'
import { LANGUAGE_STORAGE_KEY } from '@/utilities/helpers/language'

describe('LanguageSwitcher', () => {
  it('shows the current language and lists each language in its own name', async () => {
    const user = userEvent.setup()
    render(<LanguageSwitcher variant="light" />)

    const trigger = screen.getByRole('combobox', { name: 'Language' })
    expect(trigger).toHaveTextContent('English')

    await user.click(trigger)
    const options = await screen.findAllByRole('option')
    expect(options.map((option) => option.textContent)).toEqual(['English', 'Français', 'Español'])
  })

  it('switches and saves the chosen language, and its own label follows', async () => {
    const user = userEvent.setup()
    render(<LanguageSwitcher variant="dark" iconOnlyBelow="sm" />)

    await user.click(screen.getByRole('combobox', { name: 'Language' }))
    await user.click(await screen.findByRole('option', { name: 'Español' }))

    expect(i18next.language).toBe('es')
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('es')
    expect(document.documentElement.lang).toBe('es')
    expect(screen.getByRole('combobox', { name: 'Idioma' })).toHaveTextContent('Español')
  })
})
