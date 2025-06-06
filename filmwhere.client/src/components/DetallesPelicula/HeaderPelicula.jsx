import React from 'react';
import { ArrowLeft, Heart } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const HeaderPelicula = ({
    onGoBack,
    onToggleFavorite,
    isFavorite,
    checkingFavorite,
    showFavoriteButton,
    loadingHeart
}) => {
    const { theme } = useTheme();

    return (
        <div className="sticky top-0 z-10 border-b border-gray-700 bg-black/20 backdrop-blur-sm">
            <div className="container mx-auto flex items-center justify-between px-4 py-4">
                <button
                    onClick={onGoBack}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${theme === 'dark'
                        ? 'bg-primario text-texto hover:bg-primario-dark hover:text-texto-dark'
                        : 'bg-primario-dark text-texto-dark hover:bg-primario hover:text-texto'
                        }`}
                >
                    <ArrowLeft size={20} />
                    <span>Volver</span>
                </button>

                {showFavoriteButton && (
                    <button
                        onClick={onToggleFavorite}
                        disabled={checkingFavorite}
                        className={`p-2 rounded-full transition-colors ${isFavorite
                                ? 'bg-red-500 text-white hover:bg-red-600'
                                : theme === 'dark'
                                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                            } ${checkingFavorite ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                    >
                        {/* Condición unificada para spinner */}
                        {loadingHeart ? (
                            <div className=" h-5 w-5 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
                        ) : (
                            <Heart size={24} fill={isFavorite ? 'currentColor' : 'none'} />
                        )}
                    </button>
                )}
            </div>
        </div>
    );
};

export default HeaderPelicula;