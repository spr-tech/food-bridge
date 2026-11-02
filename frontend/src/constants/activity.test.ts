import { describe, expect, it } from 'vitest'
import { activityLabel } from '@/constants/activity'

describe('activityLabel', () => {
  it.each([
    ['LISTING_CREATED', 'Listed food'],
    ['LISTING_ARCHIVED', 'Deleted a listing'],
    ['REQUEST_APPROVED', 'Approved a request'],
    ['COLLECTED', 'Marked food as collected'],
    ['reversed', 'Reversed a handover'],
  ])('words %s as "%s"', (type, label) => {
    expect(activityLabel(type)).toBe(label)
  })

  it('shows a type it does not know in sentence case', () => {
    expect(activityLabel('LISTING_UPDATED')).toBe('Listing updated')
    expect(activityLabel('')).toBe('Activity')
  })
})
