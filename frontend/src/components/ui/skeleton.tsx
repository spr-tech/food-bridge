// shadcn/ui Skeleton (generated), adjusted for FoodBridge: design tokens,
// the global focus outline instead of shadcn's ring, and no dark mode.
import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }
