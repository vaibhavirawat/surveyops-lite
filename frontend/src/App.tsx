import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AppLayout } from './layouts/AppLayout'
import { DashboardPage } from './pages/DashboardPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { VillagesPage } from './pages/VillagesPage'

// The router maps a URL to a page. Every page renders inside AppLayout (sidebar + top bar).
// "handle.title" is what the top bar shows.
const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <DashboardPage />, handle: { title: 'Dashboard' } },
      { path: '/villages', element: <VillagesPage />, handle: { title: 'Villages' } },
      { path: '*', element: <NotFoundPage />, handle: { title: 'Not found' } },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
