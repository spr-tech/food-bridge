// The estimate of food saved: the quantity listed on every completed handover, totalled
// per unit. Units are never added together or converted (45 portions and 12 kg stay two
// figures), and only Collected listings count, so a reversed handover drops out: its
// listing is REVERSED, or AVAILABLE again once the service reopens it.
import type { CompletedHandover } from '@/models/api'

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
