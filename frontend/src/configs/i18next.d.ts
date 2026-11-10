// Types every t() key from the English files, so a mistyped key is a TypeScript error.
// See the i18next TypeScript guide (https://www.i18next.com/overview/typescript).
import type { defaultNS, resources } from '@/configs/i18nConfig'

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: typeof defaultNS
    resources: (typeof resources)['en']
  }
}
