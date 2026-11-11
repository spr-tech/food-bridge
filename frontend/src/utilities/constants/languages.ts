// The languages FoodBridge is translated into, for start-up (configs/i18nConfig.ts) and the
// language switcher. Each name is written in its own language and is never translated: a
// French speaker looks for "Français" whatever language the page is in. That makes these
// names the one exception to "constants hold translation keys, not words".
export const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'Français' },
  { code: 'es', name: 'Español' },
] as const

export type Language = (typeof LANGUAGES)[number]['code']
