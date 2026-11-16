import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { queryClient } from '../api/queries'
import { ToastProvider } from '../components/ui/Toast'
import { AppFrame } from './AppFrame'
import { router } from './router'

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppFrame>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </AppFrame>
    </QueryClientProvider>
  )
}
