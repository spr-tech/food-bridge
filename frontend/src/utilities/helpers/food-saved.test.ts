// The estimate of food saved: listed quantities of completed handovers, totalled per unit.
import { describe, expect, it } from 'vitest'
import { foodSavedByUnit } from '@/utilities/helpers/food-saved'
import { formatUnit } from '@/utilities/helpers/format'
import type { CompletedHandover } from '@/types/api'

const handover = (quantity: number, unit: string): CompletedHandover => ({
  listingId: `${quantity}-${unit}`,
  foodName: 'Food',
  category: 'cooked-meals',
  quantity,
  unit,
  pickupArea: 'yaba',
  photoUrl: null,
  donorName: "Mama's Oven",
  recipientName: 'Grace Shelter',
  collectedAt: null,
  deadline: '2030-01-01T18:00:00Z',
})

describe('foodSavedByUnit', () => {
  it('totals each unit on its own and never adds different units together', () => {
    expect(
      foodSavedByUnit([handover(30, 'portions'), handover(12, 'boxes'), handover(15, 'portions')]),
    ).toEqual([
      { unit: 'portions', quantity: 45 },
      { unit: 'boxes', quantity: 12 },
    ])
  })

  it('treats the same unit in different cases as one unit', () => {
    expect(foodSavedByUnit([handover(2, 'KG'), handover(3, 'kg')])).toEqual([{ unit: 'KG', quantity: 5 }])
  })

  it('is empty with no handovers', () => {
    expect(foodSavedByUnit([])).toEqual([])
  })
})

describe('formatUnit', () => {
  it('names the unit of a total shown apart from its number', () => {
    expect(formatUnit({ quantity: 45, unit: 'portions' })).toBe('portions')
  })

  it('uses the singular for one', () => {
    expect(formatUnit({ quantity: 1, unit: 'boxes' })).toBe('box')
  })

  it('shows a unit it does not know as sent', () => {
    expect(formatUnit({ quantity: 3, unit: 'crates' })).toBe('crates')
  })
})
