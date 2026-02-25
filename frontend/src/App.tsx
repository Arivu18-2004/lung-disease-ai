import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import DashboardPage from './pages/Dashboard'
import PatientPortal from './pages/PatientPortal'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/doctor" replace />} />
          <Route path="/doctor" element={<DashboardPage />} />
          <Route path="/patient/:id" element={<PatientPortal />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
