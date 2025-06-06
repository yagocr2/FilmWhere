// components/Search/SearchHeader.jsx
import { Grid, List, Filter } from 'lucide-react';
import { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import BarraBusqueda from './BarraBusqueda';
import FiltroGeneros from './FiltroGeneros';

const SearchHeader = ({
    isSearching,
    searchQuery,
    searchTerm,
    onSearchTermChange,
    onSubmit,
    onClear,
    viewMode,
    onViewModeChange,
    currentPage,
    totalPages,
    selectedGenres = [],
    onGenreChange,
    onClearFilters
}) => {
    const { theme } = useTheme();
    const [showFilters, setShowFilters] = useState(false);

    const hasActiveFilters = selectedGenres.length > 0;

    return (
        <div className="mb-8">
            {/* T�tulo y controles principales */}
            <div className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div className="mb-4 lg:mb-0">
                    <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-texto-dark' : 'text-texto'
                        }`}>
                        Buscar Películas
                    </h1>
                    {isSearching && searchQuery && (
                        <p className={`text-lg mt-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                            }`}>
                            Resultados para: <span className="font-semibold">"{searchQuery}"</span>
                        </p>
                    )}
                    {hasActiveFilters && (
                        <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                            Filtros activos: {selectedGenres.length} género(s)
                        </p>
                    )}
                </div>

                {/* Controles de vista y filtros */}
                <div className="flex items-center space-x-3">
                    {/* Botón para mostrar/ocultar filtros */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-all duration-300 ${hasActiveFilters
                            ? theme === 'dark'
                                ? 'bg-primario text-texto border-primario'
                                : 'bg-primario-dark text-texto-dark border-primario-dark'
                            : theme === 'dark'
                                ? 'border-gray-600 text-gray-400 hover:text-texto-dark hover:border-gray-400'
                                : 'border-gray-300 text-gray-600 hover:text-texto hover:border-gray-500'
                            }`}
                    >
                        <Filter size={18} />
                        <span className="hidden sm:inline">Filtros</span>
                        {hasActiveFilters && (
                            <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-xs">
                                {selectedGenres.length}
                            </span>
                        )}
                    </button>

                    {/* Controles de vista */}
                    <div className={`flex rounded-lg border ${theme === 'dark'
                        ? 'border-gray-600 bg-gray-800'
                        : 'border-gray-300 bg-gray-100'
                        }`}>
                        <button
                            onClick={() => onViewModeChange('grid')}
                            className={`p-2 rounded-l-lg transition-colors ${viewMode === 'grid'
                                ? theme === 'dark'
                                    ? 'bg-primario text-texto'
                                    : 'bg-primario-dark text-texto-dark'
                                : theme === 'dark'
                                    ? 'text-gray-400 hover:text-texto-dark'
                                    : 'text-gray-600 hover:text-texto'
                                }`}
                        >
                            <Grid size={18} />
                        </button>
                        <button
                            onClick={() => onViewModeChange('list')}
                            className={`p-2 rounded-r-lg transition-colors ${viewMode === 'list'
                                ? theme === 'dark'
                                    ? 'bg-primario text-texto'
                                    : 'bg-primario-dark text-texto-dark'
                                : theme === 'dark'
                                    ? 'text-gray-400 hover:text-texto-dark'
                                    : 'text-gray-600 hover:text-texto'
                                }`}
                        >
                            <List size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Barra de búsqueda */}
            <BarraBusqueda
                searchTerm={searchTerm}
                onSearchTermChange={onSearchTermChange}
                onSubmit={onSubmit}
                onClear={onClear}
                isSearching={isSearching}
            />

            {/* Panel de filtros */}
            {showFilters && (
                <div className={`p-4 rounded-lg border mb-4 transition-all duration-300 ${theme === 'dark'
                    ? 'bg-gray-600/50 border-gray-700'
                    : 'bg-gray-400/50 border-gray-200'
                    }`}>
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        {/* Filtro por géneros */}
                        <div>
                            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-texto-dark' : 'text-texto'
                                }`}>
                                Géneros
                            </label>
                            <FiltroGeneros
                                selectedGenres={selectedGenres}
                                onGenreChange={onGenreChange}
                                onClear={onClearFilters}
                            />
                        </div>

                        {/* Espacio para futuros filtros */}
                        <div className="flex items-end">
                            {hasActiveFilters && (
                                <button
                                    onClick={onClearFilters}
                                    className={`px-4 py-2 rounded-lg border transition-all duration-300 ${theme === 'dark'
                                        ? 'border-red-600 text-red-400 hover:bg-red-900/20'
                                        : 'border-red-300 text-red-600 hover:bg-red-50'
                                        }`}
                                >
                                    Limpiar todos los filtros
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Información de paginación */}
            {isSearching && totalPages > 0 && (
                <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                    Página {currentPage} de {totalPages}
                </div>
            )}
        </div>
    );
};

export default SearchHeader;