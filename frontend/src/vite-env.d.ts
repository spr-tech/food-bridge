// Types for the environment variables Vite exposes on import.meta.env.
declare global {
  interface ImportMetaEnv {
    readonly VITE_API_URL?: string
    readonly VITE_USE_MOCKS?: string
  }
}

export {}
