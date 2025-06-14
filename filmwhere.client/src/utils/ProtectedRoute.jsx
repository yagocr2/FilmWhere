﻿import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AdminLayout from '../components/Layouts/AdminLayout';
import AuthLayout from '../components/Layouts/AuthLayout';

// Component for routes that require authentication
export const ProtectedRoute = () => {
    const { isAuthenticated, isAdmin, loading } = useAuth();

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

    // Use AdminLayout for administrators, AuthLayout for regular users
    const Layout = isAdmin() ? AdminLayout : AuthLayout;

    return (
        <Layout>
            <Outlet />
        </Layout>
    );
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

// Component for admin routes - requires Administrador role
export const AdminRoute = () => {
    const { isAuthenticated, isAdmin, loading } = useAuth();

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

    // Redirect to inicio if authenticated but not admin
    if (!isAdmin()) {
        return <Navigate to="/inicio" />;
    }

    // Render the child routes if admin
    return <Outlet />;
};

// Component for registered user routes - requires Registrado or Administrador role
export const RegisteredRoute = () => {
    const { isAuthenticated, isRegistered, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center">
                <div className="border-primario h-16 w-16 animate-spin rounded-full border-b-2 border-t-2"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }

    if (!isRegistered()) {
        return <Navigate to="/inicio" />;
    }

    return <Outlet />;
};

// Higher-order component for role-based access control
export const RoleBasedRoute = ({ allowedRoles, redirectTo = "/inicio", children }) => {
    const { isAuthenticated, hasRole, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center">
                <div className="border-primario h-16 w-16 animate-spin rounded-full border-b-2 border-t-2"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }

    // Check if user has any of the allowed roles
    const hasAccess = allowedRoles.some(role => hasRole(role));

    if (!hasAccess) {
        return <Navigate to={redirectTo} />;
    }

    return children || <Outlet />;
};