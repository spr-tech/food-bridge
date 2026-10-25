// AccountMenu (phone): the avatar opens a panel with the organisation, role and Sign out;
// Escape and a tap outside close it, and Escape puts focus back on the avatar.
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AccountMenu } from '@/components/layout/AccountMenu'

function renderMenu(onSignOut = vi.fn()) {
  render(
    <>
      <AccountMenu organisationName="Hope Community Kitchen" roleLabel="Recipient" onSignOut={onSignOut} />
      <p>Page content</p>
    </>,
  )
  return screen.getByRole('button', { name: 'Account, Hope Community Kitchen' })
}

describe('AccountMenu', () => {
  it('shows the initials and opens to the organisation, role and Sign out', async () => {
    const user = userEvent.setup()
    const avatar = renderMenu()

    expect(avatar).toHaveTextContent('HC')
    expect(avatar).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('button', { name: 'Sign out' })).not.toBeInTheDocument()

    await user.click(avatar)

    expect(avatar).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Recipient')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument()
  })

  it('closes on Escape and returns focus to the avatar', async () => {
    const user = userEvent.setup()
    const avatar = renderMenu()

    await user.click(avatar)
    await user.tab()
    expect(screen.getByRole('button', { name: 'Sign out' })).toHaveFocus()

    await user.keyboard('{Escape}')

    expect(avatar).toHaveAttribute('aria-expanded', 'false')
    expect(avatar).toHaveFocus()
  })

  it('closes on a tap outside', async () => {
    const user = userEvent.setup()
    const avatar = renderMenu()

    await user.click(avatar)
    fireEvent.pointerDown(screen.getByText('Page content'))

    expect(avatar).toHaveAttribute('aria-expanded', 'false')
  })

  it('signs out from the menu', async () => {
    const user = userEvent.setup()
    const onSignOut = vi.fn()
    const avatar = renderMenu(onSignOut)

    await user.click(avatar)
    await user.click(screen.getByRole('button', { name: 'Sign out' }))

    expect(onSignOut).toHaveBeenCalledOnce()
  })
})
