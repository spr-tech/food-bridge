// Sets the browser tab title, e.g. "Your listings · FoodBridge". Every page calls it.
import { useEffect } from 'react'

export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = `${title} · FoodBridge`
  }, [title])
}
