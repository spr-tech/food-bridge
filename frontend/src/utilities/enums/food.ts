// Backend API types — based on Esther's latest Swagger contract.

export type BackendFoodCategory =
  | 'PREPARED_MEALS'
  | 'PRODUCE'
  | 'BAKERY'
  | 'DAIRY'
  | 'PANTRY'
  | 'OTHER'

export type BackendFoodUnit =
  | 'PORTIONS'
  | 'KG'
  | 'LITRES'
  | 'ITEMS'
  | 'BOXES'
