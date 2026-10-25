// The demonstration line says the data is simulated while it is (brief p.3).
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DemoBanner } from '@/components/layout/DemoBanner'

describe('DemoBanner', () => {
  it('says the data is simulated', () => {
    render(<DemoBanner />)

    expect(
      screen.getByText('Demonstration data (simulated) · organisations and people are fictional'),
    ).toBeInTheDocument()
  })
})
