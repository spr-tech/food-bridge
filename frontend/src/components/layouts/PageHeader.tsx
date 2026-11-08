// The top of every page, in the dashboard's style: a small amber section label (e.g.
// "Donor · Your listings"), the one h1 as a large serif title in solid black, an optional
// description, and optional actions on the right (stacked below the title on phones).
import type { ReactNode } from 'react'

type PageHeaderProps = {
  title: string
  eyebrow?: ReactNode
  description?: ReactNode
  actions?: ReactNode
}

export function PageHeader({ title, eyebrow, description, actions }: PageHeaderProps) {
  return (
    <header className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-2 text-[11px] font-bold tracking-widest text-accent uppercase">{eyebrow}</p>
        )}
        <h1 className="font-display text-4xl leading-tight tracking-tight wrap-break-word text-text sm:text-5xl">
          {title}
        </h1>
        {description && <p className="mt-3 max-w-2xl text-text-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div>}
    </header>
  )
}
