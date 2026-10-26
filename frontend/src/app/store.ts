// The Redux store. Server data lives in the RTK Query cache under api.reducerPath.
import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import { api } from '@/services/api'

// A fresh store; the app uses one, and each test makes its own so caches never leak.
export function makeStore() {
  return configureStore({
    reducer: {
      [api.reducerPath]: api.reducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(api.middleware),
  })
}

export const store = makeStore()

// Lets refetchOnFocus and refetchOnReconnect work.
setupListeners(store.dispatch)

export type AppStore = ReturnType<typeof makeStore>
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch']
