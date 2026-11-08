// The page header: section label, the one h1 in plain text, description and actions.
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PageHeader } from '@/components/layouts/PageHeader'

describe('PageHeader', () => {
  it('shows the section label, the title as the one h1, the description and the actions', () => {
    render(
      <PageHeader
        eyebrow="Donor · Your listings"
        title="Your listings"
        description="Food you've shared."
        actions={<button type="button">List surplus food</button>}
      />,
    )

    const heading = screen.getByRole('heading', { level: 1, name: 'Your listings' })
    expect(heading.children).toHaveLength(0) // plain text: no italic or coloured parts
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByText('Donor · Your listings')).toBeInTheDocument()
    expect(screen.getByText("Food you've shared.")).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'List surplus food' })).toBeInTheDocument()
  })

  it('leaves out what it isn’t given', () => {
    const { container } = render(<PageHeader title="Page not found" />)

    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument()
    expect(container.querySelectorAll('p')).toHaveLength(0)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
