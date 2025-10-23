import { createBrowserRouter } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/Auth/Login'

export const router = createBrowserRouter([
    {
        path: "/",
        Component: LoginPage,
    },
    {
        path: "/dashboard",
        Component: () => (
            <ProtectedRoute >
                <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
                    test
                </div>
            </ProtectedRoute >
        ),
        children: [
            {
                path: "/dashboard/doctor",
                Component: () => <div className="p-8"><h1 className="text-2xl font-bold">Dashboard</h1></div>,
            },
        ],
    },
    {
        path: "/auth/callback",
        Component: () => <div className="p-8"><h1 className="text-2xl font-bold">Callback</h1></div>,
    },
    {
        path: "/unauthorized",
        Component: () => (
            <div className="p-8 text-center">
                <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
                <p className="text-gray-600">You don't have permission to access this page.</p>
            </div>
        ),
    },
    {
        path: "*",
        Component: () => <div className="p-8"><h1 className="text-2xl font-bold">404 - Page Not Found</h1></div>,
    },
])
