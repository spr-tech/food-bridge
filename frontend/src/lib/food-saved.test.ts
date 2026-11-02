// The estimate of food saved: listed quantities of completed handovers, totalled per unit.
import { describe, expect, it } from 'vitest'
import { foodSavedByUnit, formatFoodSaved } from '@/lib/food-saved'
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

describe('formatFoodSaved', () => {
  it('lists the largest total first, joined with a dot', () => {
    expect(formatFoodSaved([handover(12, 'boxes'), handover(45, 'portions')])).toBe('45 portions · 12 boxes')
  })

  it('uses the singular for one', () => {
    expect(formatFoodSaved([handover(1, 'boxes')])).toBe('1 box')
  })

  it('is null when nothing has been collected', () => {
    expect(formatFoodSaved([])).toBeNull()
  })
})
