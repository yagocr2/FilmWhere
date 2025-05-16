// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Verificar el token al iniciar
    useEffect(() => {
        const checkToken = async () => {
            if (token) {
                try {
                    // Opcional: Validar el token con el backend
                    // const response = await fetch('/api/auth/validate-token', {
                    //   headers: {
                    //     Authorization: `Bearer ${token}`
                    //   }
                    // });
                    // 
                    // if (!response.ok) {
                    //   throw new Error('Token inválido');
                    // }
                    // 
                    // const data = await response.json();
                    // setUser(data.user);

                    // Por ahora, simplemente asumimos que el token es válido
                    // En una implementación real, decodificarías el JWT aquí
                    // Si tienes jwt-decode instalado:
                    // import jwt_decode from 'jwt-decode';
                    // const decoded = jwt_decode(token);
                    // setUser({ id: decoded.sub, email: decoded.email });

                    setUser({ isAuthenticated: true });
                } catch (error) {
                    console.error('Error validando token:', error);
                    logout();
                }
            }
            setLoading(false);
        };

        checkToken();
    }, [token]);

    const login = (newToken) => {
        localStorage.setItem('token', newToken);
        setToken(newToken);
        // El usuario se establecerá en el useEffect
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    const value = {
        token,
        user,
        login,
        logout,
        isAuthenticated: !!token,
        loading
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe ser usado dentro de un AuthProvider');
    }
    return context;
};