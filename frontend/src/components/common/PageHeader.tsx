// The top of every page: the one h1, with an optional eyebrow line and description.
import type { ReactNode } from 'react'

type PageHeaderProps = {
  title: string
  eyebrow?: string
  description?: ReactNode
}

export function PageHeader({ title, eyebrow, description }: PageHeaderProps) {
  return (
    <header className="mb-8 flex flex-col gap-2">
      {eyebrow && (
        <p className="text-xs font-semibold tracking-wider text-accent uppercase">{eyebrow}</p>
      )}
      <h1 className="text-3xl leading-tight text-text sm:text-4xl">{title}</h1>
      {description && <p className="text-text-muted">{description}</p>}
    </header>
  )
}
