// A compact row of figures under a page's heading (Your listings, Your requests,
// Requests), in the dashboard's card style but smaller, so it never competes with the
// page title. Each figure is its label then its value, with an optional short hint.
// Phones keep the figures in one row, without icons or hints; tablets drop the icons.
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export type SummaryFigure = {
  label: string
  value: number
  hint?: string
  icon?: ReactNode
}

export function SummaryStrip({ label, figures }: { label: string; figures: SummaryFigure[] }) {
  return (
    <ul
      aria-label={label}
      className={cn('mb-6 grid gap-2 sm:gap-3', figures.length === 2 ? 'grid-cols-2' : 'grid-cols-3')}
    >
      {figures.map((figure) => (
        <li
          key={figure.label}
          className="flex min-w-0 items-center gap-3 rounded-2xl border border-border bg-surface px-3 py-2.5 shadow-card sm:px-4 sm:py-3"
        >
          {figure.icon && (
            <span aria-hidden="true" className="hidden size-9 shrink-0 place-items-center rounded-xl bg-cream text-primary lg:grid">
              {figure.icon}
            </span>
          )}
          <div className="min-w-0">
            <p className="text-xs leading-snug font-semibold text-text-muted sm:text-[13px]">{figure.label}</p>
            <p className="font-display text-2xl leading-tight text-text">{figure.value.toLocaleString('en-GB')}</p>
            {figure.hint && <p className="hidden text-xs leading-snug text-text-muted sm:block">{figure.hint}</p>}
          </div>
        </li>
      ))}
    </ul>
  )
}
