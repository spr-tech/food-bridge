// Two or more views of one list as pill tabs (Your listings / Listing history, Open
// requests / Request history), in the dashboard's style. The page owns which view is
// selected and renders each panel with the matching id.
import { cn } from '@/lib/cn'

export type ViewTab = {
  id: string
  panelId: string
  label: string
  count: number
  selected: boolean
  onSelect: () => void
}

export function ViewTabs({ label, tabs }: { label: string; tabs: ViewTab[] }) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="mb-6 grid auto-cols-fr grid-flow-col gap-1 rounded-full border border-border bg-surface-hover p-1"
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          id={tab.id}
          type="button"
          role="tab"
          aria-selected={tab.selected}
          aria-controls={tab.panelId}
          onClick={tab.onSelect}
          className={cn(
            'flex min-h-11 min-w-0 items-center justify-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
            tab.selected
              ? 'bg-primary text-on-primary shadow-sm'
              : 'bg-transparent text-text-secondary hover:bg-surface hover:text-text',
          )}
        >
          <span className="truncate">{tab.label}</span>
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-xs',
              tab.selected ? 'bg-on-primary/15 text-on-primary' : 'bg-surface text-text-muted',
            )}
          >
            {tab.count}
          </span>
        </button>
      ))}
    </div>
  )
}
