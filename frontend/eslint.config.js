import js from '@eslint/js'
import betterTailwindcss from 'eslint-plugin-better-tailwindcss'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    // Canonical Tailwind classes only: an arbitrary value only when no standard class
    // gives exactly that value (md:p-6.5, not md:p-[26px]). The copied shared components
    // are left out; their suggestions go to the shared repo.
    files: ['**/*.{ts,tsx}'],
    ignores: ['src/components/ui/**'],
    plugins: { 'better-tailwindcss': betterTailwindcss },
    settings: { 'better-tailwindcss': { entryPoint: 'src/index.css' } },
    rules: {
      // rootFontSize lets it see that 26px is 6.5 spacing steps. collapse is off: merging
      // "text-3xl leading-tight" into "text-3xl/tight" changes the line height wherever a
      // responsive size (sm:text-4xl) follows, so it isn't always the same value.
      'better-tailwindcss/enforce-canonical-classes': ['error', { rootFontSize: 16, collapse: false }],
    },
  },
  {
    // Shared component files are copied unchanged; some export a hook or helpers next
    // to the component (toast.tsx exports useToast).
    files: ['src/components/ui/**/*.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
])
