// One idempotency key per form submission (spec section 7): created on the first
// submit, reused on every retry of it, and cleared with reset() after success.
import { useCallback, useRef } from 'react'

export function useIdempotencyKey() {
  const keyRef = useRef<string | null>(null)

  const getKey = useCallback(() => {
    keyRef.current ??= crypto.randomUUID()
    return keyRef.current
  }, [])

  const reset = useCallback(() => {
    keyRef.current = null
  }, [])

  return { getKey, reset }
}
