// The app's browser router, built from the route table in routes.tsx.
import { createBrowserRouter } from 'react-router'
import { routes } from '@/app/routes'

export const router = createBrowserRouter(routes)
