// Choices for the listing form and filters.
// TODO: all three lists are TBC with the service engineers (spec S2).
export type Option = {
  value: string
  label: string
}

export type UnitOption = Option & {
  singular: string
}

export const CATEGORIES: Option[] = [
  { value: 'bakery', label: 'Bakery' },
  { value: 'cooked-meals', label: 'Cooked meals' },
  { value: 'produce', label: 'Produce' },
  { value: 'pastries', label: 'Pastries' },
]

// label is the plural, used for any quantity other than 1.
export const UNITS: UnitOption[] = [
  { value: 'loaves', label: 'loaves', singular: 'loaf' },
  { value: 'portions', label: 'portions', singular: 'portion' },
  { value: 'trays', label: 'trays', singular: 'tray' },
  { value: 'baskets', label: 'baskets', singular: 'basket' },
  { value: 'pieces', label: 'pieces', singular: 'piece' },
  { value: 'boxes', label: 'boxes', singular: 'box' },
]

export const PICKUP_AREAS: Option[] = [
  { value: 'yaba', label: 'Yaba' },
  { value: 'surulere', label: 'Surulere' },
  { value: 'ikeja', label: 'Ikeja' },
  { value: 'lekki', label: 'Lekki' },
  { value: 'ajegunle', label: 'Ajegunle' },
]
