// Choices for the listing form and filters.
// Live mode uses the service's allowed category and unit values (Esther's contract);
// mock mode keeps the original lists.
import { env } from '@/config/env'

export type Option = {
  value: string
  label: string
}

// The on-screen label for a value, e.g. "yaba" gives "Yaba"; an unknown value is shown as sent.
export function optionLabel(options: Option[], value: string): string {
  return options.find((option) => option.value === value)?.label ?? value
}

export type UnitOption = Option & {
  singular: string
}

const MOCK_CATEGORIES: Option[] = [
  { value: 'bakery', label: 'Bakery' },
  { value: 'cooked-meals', label: 'Cooked meals' },
  { value: 'produce', label: 'Produce' },
  { value: 'pastries', label: 'Pastries' },
]

// label is the plural, used for any quantity other than 1.
const MOCK_UNITS: UnitOption[] = [
  { value: 'loaves', label: 'loaves', singular: 'loaf' },
  { value: 'portions', label: 'portions', singular: 'portion' },
  { value: 'trays', label: 'trays', singular: 'tray' },
  { value: 'baskets', label: 'baskets', singular: 'basket' },
  { value: 'pieces', label: 'pieces', singular: 'piece' },
  { value: 'boxes', label: 'boxes', singular: 'box' },
]

const LIVE_CATEGORIES: Option[] = [
  { value: 'PREPARED_MEALS', label: 'Prepared meals' },
  { value: 'PRODUCE', label: 'Produce' },
  { value: 'BAKERY', label: 'Bakery' },
  { value: 'DAIRY', label: 'Dairy' },
  { value: 'PANTRY', label: 'Pantry' },
  { value: 'OTHER', label: 'Other' },
]

const LIVE_UNITS: UnitOption[] = [
  { value: 'PORTIONS', label: 'portions', singular: 'portion' },
  { value: 'KG', label: 'kg', singular: 'kg' },
  { value: 'LITRES', label: 'litres', singular: 'litre' },
  { value: 'ITEMS', label: 'items', singular: 'item' },
  { value: 'BOXES', label: 'boxes', singular: 'box' },
]

export const CATEGORIES: Option[] = env.useMocks ? MOCK_CATEGORIES : LIVE_CATEGORIES
export const UNITS: UnitOption[] = env.useMocks ? MOCK_UNITS : LIVE_UNITS

export const PICKUP_AREAS: Option[] = [
  { value: 'yaba', label: 'Yaba' },
  { value: 'surulere', label: 'Surulere' },
  { value: 'ikeja', label: 'Ikeja' },
  { value: 'lekki', label: 'Lekki' },
  { value: 'ajegunle', label: 'Ajegunle' },
]

// ---------------------------------------------------------------------------
// Explanation
// - The service only accepts these category values: PREPARED_MEALS, PRODUCE, BAKERY,
//   DAIRY, PANTRY, OTHER, and these units: PORTIONS, KG, LITRES, ITEMS, BOXES. Anything
//   else is rejected with a 400, so in live mode the form offers exactly those values.
// - Mock mode keeps the old lists so the simulated data and the tests still work.
// - Pickup areas are free text in the contract, so that list is unchanged.