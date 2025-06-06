import React from 'react';

import { useTheme } from '../context/ThemeContext';

const MensajeError = ({ error, onGoBack, onRetry }) => {
    const { theme } = useTheme();

    return (
        <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-primario-dark' : 'bg-primario'
            }`}>
            <div className="mx-auto max-w-md bg-white text-center">
                <div className={`rounded-lg p-6 ${theme === 'dark' ? 'bg-red-900/20 text-red-400' : 'bg-red-100 text-red-600'
                    }`}>
                    <h2 className="mb-2 text-xl font-bold">Error al cargar la película</h2>
                    <p className="mb-4">{error}</p>
                    <div className="space-x-4">
                        <button
                            onClick={onGoBack}
                            className={`px-4 py-2 rounded-lg transition-colors ${theme === 'dark'
                                    ? 'bg-primario text-texto hover:bg-primario-dark'
                                    : 'bg-primario-dark text-texto-dark hover:bg-primario'
                                }`}
                        >
                            Volver
                        </button>
                        <button
                            onClick={onRetry}
                            className={`px-4 py-2 rounded-lg border transition-colors ${theme === 'dark'
                                    ? 'border-primario text-primario hover:bg-primario hover:text-texto'
                                    : 'border-primario-dark text-primario-dark hover:bg-primario-dark hover:text-texto-dark'
                                }`}
                        >
                            Reintentar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MensajeError;