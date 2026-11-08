// "Skip to main content": hidden until focused, so keyboard users can jump past the header.
type SkipLinkProps = {
  targetId: string
}

export function SkipLink({ targetId }: SkipLinkProps) {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only rounded-md bg-surface px-4 py-2 font-medium text-text shadow-md focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50"
    >
      Skip to main content
    </a>
  )
}
