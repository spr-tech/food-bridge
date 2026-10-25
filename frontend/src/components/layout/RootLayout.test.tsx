// RootLayout provides the shared ToastProvider, so any page can call useToast().
// Without the provider, useToast() throws and the page fails to render.
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'
import { RootLayout } from '@/components/layout/RootLayout'
import { useToast } from '@/components/ui/toast'

function PageThatToasts() {
  const { toast } = useToast()
  return (
    <button type="button" onClick={() => toast({ variant: 'success', title: 'Listing published' })}>
      Publish
    </button>
  )
}

describe('RootLayout', () => {
  it('shows a toast raised by a page', async () => {
    const user = userEvent.setup()
    const router = createMemoryRouter([
      { element: <RootLayout />, children: [{ path: '/', element: <PageThatToasts /> }] },
    ])
    render(<RouterProvider router={router} />)

    await user.click(await screen.findByRole('button', { name: 'Publish' }))

    expect(await screen.findByText('Listing published')).toBeInTheDocument()
  })
})
