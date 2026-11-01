// Yup schema for the Share food form (spec S2). Messages are the spec's, word for word.
// Collection date and Time are combined into one deadline, which must be later than now;
// that message shows under Time.
import * as Yup from 'yup'
import { combineDeadline, isLaterThanNow } from '@/lib/deadline'

export const PHOTO_TYPES = ['image/jpeg', 'image/png']
export const PHOTO_MAX_BYTES = 5 * 1024 * 1024
const PHOTO_MESSAGE = 'Choose a JPG or PNG photo of 5 MB or less.'

export const DESCRIPTION_MAX = 500

export type ListingFormValues = {
  foodName: string
  description: string
  category: string
  quantity: string
  unit: string
  pickupArea: string
  collectionDate: string
  collectionTime: string
  photo: File | null
}

export const listingSchema = Yup.object({
  foodName: Yup.string().trim().required('Enter the food name').min(3, 'Enter the food name').max(80, 'Enter the food name'),
  description: Yup.string().max(DESCRIPTION_MAX),
  category: Yup.string().required('Choose a category'),
quantity: Yup.string()
    .required('Enter a quantity of 1 or more')
    .matches(/^\s*\d+\s*$/, 'Enter a quantity of 1 or more')
    .test('at-least-one', 'Enter a quantity of 1 or more', (value) => Number(value) >= 1),
  unit: Yup.string().required('Choose a unit'),
  pickupArea: Yup.string().required('Choose a pickup area'),
  collectionDate: Yup.string().required('Choose a collection date'),
  collectionTime: Yup.string()
    .required('Choose a collection time')
    .test('later-than-now', 'The deadline must be later than now', function (time) {
      const deadline = combineDeadline(this.parent.collectionDate ?? '', time ?? '')
      // A missing date has its own message on the date field.
      return deadline === null || isLaterThanNow(deadline)
    }),
  photo: Yup.mixed<File>()
    .nullable()
    .test('photo', PHOTO_MESSAGE, (file) => !file || (PHOTO_TYPES.includes(file.type) && file.size <= PHOTO_MAX_BYTES)),
})
