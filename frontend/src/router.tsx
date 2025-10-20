import { createBrowserRouter } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import ProtectedRoute from './components/ProtectedRoute'
import { Button } from './components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card'

function HomePage() {
    const { t } = useTranslation()

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="max-w-4xl w-full">
                <Card className="max-w-2xl mx-auto">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl">Welcome to BiosAI</CardTitle>
                        <CardDescription>
                            Your comprehensive healthcare management platform
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-center text-gray-600">
                            {t('common.comingSoon')}
                        </p>
                        <div className="flex justify-center space-x-4">
                            <Button variant="default" size="lg">
                                Login
                            </Button>

                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export const router = createBrowserRouter([
    {
        path: "/",
        Component: HomePage,
    },
    {
        path: "/dashboard",
        Component: () => (
            <ProtectedRoute >
                <div className="min-h-screen bg-background p-8">
                </div>
            </ProtectedRoute >
        ),
    },
    {
        path: "/login",
        Component: () => <div className="p-8"><h1 className="text-2xl font-bold">Login</h1></div>,
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
