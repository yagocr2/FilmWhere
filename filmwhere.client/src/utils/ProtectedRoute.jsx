import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Component for routes that require authentication
export const ProtectedRoute = () => {
    const { isAuthenticated, loading } = useAuth();

    // Show loading state while checking authentication
    if (loading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center">
                <div className="border-primario h-16 w-16 animate-spin rounded-full border-b-2 border-t-2"></div>
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }

    // Render the child routes if authenticated
    return <Outlet />;
};

// Component for routes that should redirect logged-in users
export const AnonymousRoute = () => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center">
                <div className="border-primario h-16 w-16 animate-spin rounded-full border-b-2 border-t-2"></div>
            </div>
        );
    }

    // Redirect to home/inicio if already authenticated
    if (isAuthenticated) {
        return <Navigate to="/inicio" />;
    }

    return <Outlet />;
};