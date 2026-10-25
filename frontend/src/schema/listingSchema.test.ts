// The Share food schema's own rules, checked without the form (which the service also
// backs up): the combined deadline must be later than now, and quantities are whole
// numbers of 1 or more.
import { describe, expect, it } from 'vitest'
import { ValidationError } from 'yup'
import { lagosToday } from '@/lib/deadline'
import { listingSchema, type ListingFormValues } from '@/schema/listingSchema'

const DAY = 24 * 60 * 60 * 1000

const valid = (): ListingFormValues => ({
  foodName: 'Puff-puff',
  description: '',
  category: 'pastries',
  quantity: '30',
  unit: 'pieces',
  pickupArea: 'yaba',
  collectionDate: lagosToday(new Date(Date.now() + DAY)),
  collectionTime: '12:00',
  photo: null,
})

async function errorsFor(values: ListingFormValues): Promise<Record<string, string>> {
  try {
    await listingSchema.validate(values, { abortEarly: false })
    return {}
  } catch (error) {
    if (!(error instanceof ValidationError)) throw error
    return Object.fromEntries(error.inner.map((issue) => [issue.path ?? '', issue.message]))
  }
}

describe('listingSchema', () => {
  it('accepts a complete listing with a deadline tomorrow', async () => {
    expect(await errorsFor(valid())).toEqual({})
  })

  it('refuses a deadline in the past, on the time field', async () => {
    const values = { ...valid(), collectionDate: lagosToday(new Date(Date.now() - DAY)) }

    expect(await errorsFor(values)).toEqual({ collectionTime: 'The deadline must be later than now' })
  })

  it.each(['0', '-2', '2.5', 'ten'])('refuses the quantity "%s"', async (quantity) => {
    expect(await errorsFor({ ...valid(), quantity })).toEqual({ quantity: 'Enter a quantity of 1 or more' })
  })

  it.each(['ab', 'x'.repeat(81)])('refuses a food name of %#', async (foodName) => {
    expect(await errorsFor({ ...valid(), foodName })).toEqual({ foodName: 'Enter the food name' })
  })
})
