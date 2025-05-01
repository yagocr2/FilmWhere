// context/AuthContext.jsx
import { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [authState, setAuthState] = useState({
        token: localStorage.getItem('jwtToken'),
        user: null
    });

    const login = (token) => {
        localStorage.setItem('jwtToken', token);
        setAuthState({ token, user: null }); // Puedes decodificar el token aquí
    };

    const logout = () => {
        localStorage.removeItem('jwtToken');
        setAuthState({ token: null, user: null });
    };

    return (
        <AuthContext.Provider value={{ ...authState, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);