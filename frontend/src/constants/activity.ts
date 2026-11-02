// Words for the activity types GET /api/activity returns, as the service records them.
// LISTING_ARCHIVED is the service's soft delete. A type not listed here is shown in
// sentence case rather than hidden, so new service events still appear.
const ACTIVITY_LABELS: Record<string, string> = {
  LISTING_CREATED: 'Listed food',
  LISTING_ARCHIVED: 'Deleted a listing',
  REQUEST_CREATED: 'Requested food',
  REQUEST_APPROVED: 'Approved a request',
  REQUEST_DECLINED: 'Declined a request',
  REQUEST_CANCELLED: 'Cancelled a request',
  COLLECTED: 'Marked food as collected',
  REVERSED: 'Reversed a handover',
}

export function activityLabel(type: string): string {
  const known = ACTIVITY_LABELS[type.toUpperCase()]
  if (known) return known
  const words = type.toLowerCase().replace(/_/g, ' ').trim()
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : 'Activity'
}
