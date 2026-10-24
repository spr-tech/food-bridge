// Environment settings, read once at start-up. A missing value fails loudly here
// instead of as confusing network errors later.
const apiUrl = import.meta.env.VITE_API_URL

if (!apiUrl) {
  throw new Error(
    'VITE_API_URL is not set. Copy .env.example to .env (or set it in the deploy settings) and restart the dev server.',
  )
}

export const env = {
  apiUrl,
} as const
