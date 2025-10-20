import { RouterProvider } from 'react-router-dom'
import { SupabaseProvider } from './contexts/SupabaseContext'
import { AuthProvider } from './contexts/AuthContext'
import { MenuProvider } from './contexts/MenuContext'
import { router } from './router'

function AppContent() {
  return <RouterProvider router={router} />
}

function App() {
  return (
    <SupabaseProvider>
      <AuthProvider>
        <MenuProvider>
          <AppContent />
        </MenuProvider>
      </AuthProvider>
    </SupabaseProvider>
  )
}

export default App
