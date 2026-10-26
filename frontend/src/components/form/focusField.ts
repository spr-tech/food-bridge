// Moves focus to a form field by name, using the data-field attribute every adapter in
// this folder sets.
export function focusField(name: string) {
  document.querySelector<HTMLElement>(`[data-field="${name}"]`)?.focus()
}
