import React from 'react';

import { useTheme } from '../context/ThemeContext';

const LoadingSpinner = ({ message = 'Cargando...' }) => {
    const { theme } = useTheme();

    return (
        <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-primario-dark' : 'bg-primario'
            }`}>
            <div className="text-center">
                <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
                <p className={`mt-4 ${theme === 'dark' ? 'text-texto-dark' : 'text-texto'}`}>
                    {message}
                </p>
            </div>
        </div>
    );
};

export default LoadingSpinner;