import { createContext, useContext, useState, useEffect } from 'react';
import { decodeToken } from '../utils/auth';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initializeAuth = () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const decodedToken = decodeToken(token);

                    // Verificar si el token ha expirado
                    if (decodedToken.exp * 1000 < Date.now()) {
                        logout();
                        return;
                    }

                    // Extraer información del usuario del token
                    const userData = {
                        id: decodedToken.nameid || decodedToken.sub,
                        email: decodedToken.email,
                        userName: decodedToken.unique_name,
                        nombre: decodedToken.nombre,
                        apellido: decodedToken.apellido,
                        roles: decodedToken.role ? (Array.isArray(decodedToken.role) ? decodedToken.role : [decodedToken.role]) : []
                    }

                    setUser(userData);
                    setIsAuthenticated(true);
                } catch (error) {
                    console.error('Error decoding token:', error);
                    logout();
                }
            }
            setLoading(false);
        };

        initializeAuth();
    }, []);

    const login = (token, userData) => {
        localStorage.setItem('token', token);

        // Si se proporciona userData del servidor, usarla
        if (userData) {
            setUser({
                id: userData.Id,
                email: userData.Email,
                userName: userData.UserName,
                nombre: userData.Nombre,
                apellido: userData.Apellido,
                roles: userData.Roles || []
            });
        } else {
            // Si no, decodificar del token
            try {
                const decodedToken = decodeToken(token);
                const userFromToken = {
                    id: decodedToken.nameid || decodedToken.sub,
                    email: decodedToken.email,
                    userName: decodedToken.unique_name,
                    nombre: decodedToken.nombre,
                    apellido: decodedToken.apellido,
                    roles: decodedToken.role ? (Array.isArray(decodedToken.role) ? decodedToken.role : [decodedToken.role]) : []
                };
                setUser(userFromToken);
            } catch (error) {
                console.error('Error decoding token on login:', error);
            }
        }

        setIsAuthenticated(true);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        setIsAuthenticated(false);
    };

    // Funciones de utilidad para verificar roles
    const hasRole = (role) => {
        return user?.roles?.includes(role) || false;
    };

    const isAdmin = () => {
        return hasRole('Administrador');
    };

    const isRegistered = () => {
        return hasRole('Registrado') || hasRole('Administrador');
    };

    // Función para obtener el token con verificación de expiración
    const getValidToken = () => {
        const token = localStorage.getItem('token');
        if (!token) return null;

        try {
            const decodedToken = decodeToken(token);
            if (decodedToken.exp * 1000 < Date.now()) {
                logout();
                return null;
            }
            return token;
        } catch (error) {
            logout();
            return null;
        }
    };
    const token = getValidToken();

    const value = {
        user,
        isAuthenticated,
        loading,
        login,
        logout,
        hasRole,
        isAdmin,
        isRegistered,
        getValidToken,
        token
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};