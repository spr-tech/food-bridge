// Error pattern (spec section 4): what happened in plain words, plus "Try again".
// Pass the spec's message for the screen; raw error text is never shown.
import { Button } from '@/components/ui/button'

type ErrorStateProps = {
  message: string
  onRetry: () => void
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-3 rounded-md border bg-surface px-6 py-6"
    >
      <p className="text-text">{message}</p>
      <Button variant="outline" onClick={onRetry}>
        Try again
      </Button>
    </div>
  )
}
