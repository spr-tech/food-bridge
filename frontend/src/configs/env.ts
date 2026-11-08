// Environment settings, read once at start-up.
const apiUrl = import.meta.env.VITE_API_URL

if (!apiUrl) {
  throw new Error(
    'VITE_API_URL is not set. Copy .env.example to .env (or set it in the deploy settings) and restart the dev server.',
  )
}

export const env = {
  // Keep mocks enabled unless explicitly switched off. This prevents accidentally
  // sending demo users to the real service before the API credentials are ready.
  apiUrl: apiUrl.replace(/\/$/, ''),
useMocks: import.meta.env.MODE === 'test' || import.meta.env.VITE_USE_MOCKS !== 'false',


} as const
