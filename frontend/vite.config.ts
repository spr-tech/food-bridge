// Vite build and Vitest config: React, Tailwind CSS v4 and the "@/" alias for src/.
import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    env: {
      // config/env.ts throws without it; tests never call the API.
      VITE_API_URL: 'http://127.0.0.1:4010',
      // Not Lagos on purpose: date tests fail if formatting uses the device's zone.
      TZ: 'America/New_York',
    },
  },
})
