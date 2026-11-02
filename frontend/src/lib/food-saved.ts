// The estimate of food saved: the quantity listed on every completed handover, totalled
// per unit. Units are never added together or converted ("45 portions · 12 kg"), and only
// Collected listings count, so a reversed handover (its listing now REVERSED) drops out.
import { formatListingQuantity } from '@/lib/format'
import type { CompletedHandover } from '@/types/api'

export type UnitTotal = { unit: string; quantity: number }

// Largest total first; ties keep the order the units were first seen in.
export function foodSavedByUnit(handovers: CompletedHandover[]): UnitTotal[] {
  const totals = new Map<string, UnitTotal>()

  for (const handover of handovers) {
    const key = handover.unit.toUpperCase()
    const total = totals.get(key) ?? { unit: handover.unit, quantity: 0 }
    total.quantity += handover.quantity
    totals.set(key, total)
  }

  return [...totals.values()].sort((a, b) => b.quantity - a.quantity)
}

// "45 portions · 12 kg", or null when nothing has been collected yet.
export function formatFoodSaved(handovers: CompletedHandover[]): string | null {
  const totals = foodSavedByUnit(handovers)
  return totals.length > 0 ? totals.map(formatListingQuantity).join(' · ') : null
}
