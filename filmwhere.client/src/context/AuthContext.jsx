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
                    //   throw new Error('Token inv�lido');
                    // }
                    // 
                    // const data = await response.json();
                    // setUser(data.user);

                    // Por ahora, simplemente asumimos que el token es v�lido
                    // En una implementaci�n real, decodificar�as el JWT aqu�
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
        // El usuario se establecer� en el useEffect
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