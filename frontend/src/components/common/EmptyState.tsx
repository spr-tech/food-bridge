// Empty pattern (spec section 4): a title that invites action, one line, one action.
import type { ReactNode } from 'react'

type EmptyStateProps = {
  title: string
  description: string
  // Usually one Button or a Button wrapping a Link.
  action?: ReactNode
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-md border border-dashed bg-surface px-6 py-12 text-center">
      <h2 className="text-xl text-text">{title}</h2>
      <p className="max-w-prose text-text-muted">{description}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
