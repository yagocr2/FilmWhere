// components/Search/FiltroGeneros.jsx
import { useState, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const FiltroGeneros = ({ selectedGenres = [], onGenreChange, onClear }) => {
    const { theme } = useTheme();
    const [genres, setGenres] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const [error, setError] = useState(null);

    // Cargar géneros disponibles
    useEffect(() => {
        const fetchGenres = async () => {
            try {
                setLoading(true);
                const response = await fetch('/api/pelicula/generos');

                if (!response.ok) {
                    throw new Error('Error al cargar géneros');
                }

                const data = await response.json();
                setGenres(data);
            } catch (err) {
                console.error('Error fetching genres:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchGenres();
    }, []);

    // Manejar selección de género
    const handleGenreToggle = (genreName) => {
        const updatedGenres = selectedGenres.includes(genreName)
            ? selectedGenres.filter(g => g !== genreName)
            : [...selectedGenres, genreName];

        onGenreChange(updatedGenres);
    };

    // Limpiar todos los géneros seleccionados
    const handleClearAll = () => {
        onGenreChange([]);
        if (onClear) onClear();
    };

    if (loading) {
        return (
            <div className={`p-4 rounded-lg ${theme === 'dark'
                ? 'bg-gray-800 border-gray-700'
                : 'bg-gray-200 border-gray-200'
                } border`}>
                <div className="text-sm">Cargando géneros...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`p-4 rounded-lg ${theme === 'dark'
                ? 'bg-red-900/20 border-red-700'
                : 'bg-red-50 border-red-200'
                } border`}>
                <div className="text-sm text-red-500">Error: {error}</div>
            </div>
        );
    }

    return (
        <div className="relative">
            {/* Botón para abrir/cerrar dropdown */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-all duration-300 ${theme === 'dark'
                    ? 'bg-gray-800 border-gray-600 text-texto-dark hover:border-gray-500'
                    : 'bg-gray-200 border-gray-300 text-texto hover:border-gray-400'
                    }`}
            >
                <span className="flex items-center space-x-2">
                    <span>Filtrar por género</span>
                    {selectedGenres.length > 0 && (
                        <span className={`px-2 py-1 text-xs rounded-full ${theme === 'dark'
                            ? 'bg-primario text-texto'
                            : 'bg-primario-dark text-texto-dark'
                            }`}>
                            {selectedGenres.length}
                        </span>
                    )}
                </span>
                <ChevronDown
                    className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    size={20}
                />
            </button>

            {/* Géneros seleccionados (chips) */}
            {selectedGenres.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                    {selectedGenres.map((genre) => (
                        <span
                            key={genre}
                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${theme === 'dark'
                                ? 'bg-primario text-texto'
                                : 'bg-primario-dark text-texto-dark'
                                }`}
                        >
                            {genre}
                            <button
                                type="button"
                                onClick={() => handleGenreToggle(genre)}
                                className="ml-2 hover:bg-black/20 rounded-full p-0.5"
                            >
                                <X size={14} />
                            </button>
                        </span>
                    ))}
                    <button
                        type="button"
                        onClick={handleClearAll}
                        className={`px-3 py-1 rounded-full text-sm border transition-colors ${theme === 'dark'
                            ? 'border-gray-600 text-gray-400 hover:text-texto-dark hover:border-gray-400'
                            : 'border-gray-300 text-gray-600 hover:text-texto hover:border-gray-500'
                            }`}
                    >
                        Limpiar todo
                    </button>
                </div>
            )}

            {/* Dropdown de géneros */}
            {isOpen && (
                <div className={`absolute top-full left-0 right-0 mt-2 rounded-lg border shadow-lg z-50 max-h-64 overflow-y-auto ${theme === 'dark'
                    ? 'bg-gray-600 border-gray-500'
                    : 'bg-gray-200 border-gray-100'
                    }`}>
                    <div className="p-2">
                        {genres.map((genre) => (
                            <label
                                key={genre.id}
                                className={`flex items-center space-x-3 p-2 rounded cursor-pointer transition-colors ${theme === 'dark'
                                    ? 'hover:bg-gray-700 text-texto-dark'
                                    : 'hover:bg-gray-100 text-texto'
                                    }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedGenres.includes(genre.name)}
                                    onChange={() => handleGenreToggle(genre.name)}
                                    className="w-4 h-4 text-primario focus:ring-primario border-purple-800 rounded"
                                />
                                <span className="text-sm">{genre.name}</span>
                            </label>
                        ))}
                    </div>
                </div>
            )}

            {/* Overlay para cerrar dropdown */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    );
};

export default FiltroGeneros;