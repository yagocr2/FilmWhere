// modules/Search/Search.jsx
import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Search as SearchIcon, Filter, Grid, List } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import FadeContent from '../../Animations/FadeContent/FadeContent';
import LiquidChrome from "../../Backgrounds/LiquidChrome/LiquidChrome";

const MovieCard = ({ movie, viewMode }) => {
    const { theme } = useTheme();

    if (viewMode === 'list') {
        return (
            <div className={`${theme === 'dark' ? 'bg-secundario-dark border-gray-700' : 'bg-secundario border-gray-200'} 
                p-4 rounded-lg border transition-all duration-300 hover:shadow-lg cursor-pointer`}>
                <div className="flex space-x-4">
                    <div className="h-36 w-24 flex-shrink-0">
                        <img
                            src={movie.posterUrl}
                            alt={movie.title}
                            className="h-full w-full rounded-md object-cover"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '/placeholder-movie.jpg';
                            }}
                        />
                    </div>
                    <div className="flex-1">
                        <h3 className={`text-lg font-bold mb-2 ${theme === 'dark' ? 'text-texto-dark' : 'text-texto'}`}>
                            {movie.title}
                        </h3>
                        <p className={`text-sm mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                            Año: {movie.year || 'N/A'}
                        </p>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                            ID: {movie.id}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full transform cursor-pointer transition-transform duration-300 hover:scale-105">
            <div className="relative h-64 overflow-hidden rounded-lg shadow-lg md:h-80">
                <img
                    src={movie.posterUrl}
                    alt={movie.title}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/placeholder-movie.jpg';
                    }}
                />
                <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 to-transparent p-3 opacity-0 transition-opacity duration-300 hover:opacity-100">
                    <p className="mb-1 line-clamp-2 text-sm font-bold text-white">{movie.title}</p>
                    {movie.year && <p className="text-xs text-white">{movie.year}</p>}
                </div>
            </div>
        </div>
    );
};

const Pagination = ({ currentPage, totalPages, onPageChange, isSearching }) => {
    const { theme } = useTheme();
    const maxPages = isSearching ? 2 : totalPages;

    const getVisiblePages = () => {
        const delta = 2;
        const range = [];
        const rangeWithDots = [];

        for (let i = Math.max(2, currentPage - delta);
            i <= Math.min(maxPages - 1, currentPage + delta);
            i++) {
            range.push(i);
        }

        if (currentPage - delta > 2) {
            rangeWithDots.push(1, '...');
        } else {
            rangeWithDots.push(1);
        }

        rangeWithDots.push(...range);

        if (currentPage + delta < maxPages - 1) {
            rangeWithDots.push('...', maxPages);
        } else if (maxPages > 1) {
            rangeWithDots.push(maxPages);
        }

        return rangeWithDots;
    };

    if (maxPages <= 1) return null;

    const buttonClass = `px-3 py-2 rounded-md transition-all duration-300 ${theme === 'dark'
        ? 'bg-secundario-dark text-texto-dark hover:bg-primario hover:text-texto border-gray-600'
        : 'bg-secundario text-texto hover:bg-primario-dark hover:text-texto-dark border-gray-300'
        } border`;

    const activeButtonClass = `px-3 py-2 rounded-md ${theme === 'dark'
        ? 'bg-primario text-texto'
        : 'bg-primario-dark text-texto-dark'
        }`;

    return (
        <div className="mt-8 flex items-center justify-center space-x-2">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className={`${buttonClass} disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1`}
            >
                <ChevronLeft size={16} />
                <span>Anterior</span>
            </button>

            {getVisiblePages().map((page, index) => (
                <button
                    key={index}
                    onClick={() => typeof page === 'number' ? onPageChange(page) : null}
                    disabled={page === '...'}
                    className={
                        page === currentPage
                            ? activeButtonClass
                            : page === '...'
                                ? 'px-3 py-2 cursor-default'
                                : buttonClass
                    }
                >
                    {page}
                </button>
            ))}

            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= maxPages}
                className={`${buttonClass} disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1`}
            >
                <span>Siguiente</span>
                <ChevronRight size={16} />
            </button>
        </div>
    );
};

const Search = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const { theme } = useTheme();

    // Estados
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
    const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page')) || 1);
    const [totalPages, setTotalPages] = useState(10); // Por defecto 10 páginas
    const [isSearching, setIsSearching] = useState(!!searchParams.get('q'));
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

    // Función para realizar búsqueda o cargar populares
    const fetchMovies = useCallback(async (query = '', page = 1) => {
        setLoading(true);
        setError(null);

        try {
            let url;
            if (query.trim()) {
                // B�squeda específica - solo 2 páginas máximo
                url = `/api/SearchMovies?query=${encodeURIComponent(query)}&page=${page}`;
                setIsSearching(true);
                setTotalPages(3);
            } else {
                // Carga popular - 10 páginas con 50 películas cada una
                url = `/api/PopularMovies?page=${page}&cantidad=48`;
                setIsSearching(false);
                setTotalPages(10);
            }

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            // Formatear datos
            const formattedMovies = data.map(movie => ({
                id: movie.id,
                title: movie.title,
                posterUrl: movie.posterUrl,
                year: movie.year
            }));

            setMovies(formattedMovies);
        } catch (err) {
            console.error('Error fetching movies:', err);
            setError(err.message || 'Error al cargar las películas');
            setMovies([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Cargar películas al montar el componente o cambiar parámetros
    useEffect(() => {
        const query = searchParams.get('q') || '';
        const page = parseInt(searchParams.get('page')) || 1;

        setSearchTerm(query);
        setCurrentPage(page);
        fetchMovies(query, page);
    }, [searchParams, fetchMovies]);

    // Manejar búsqueda
    const handleSearch = (e) => {
        e.preventDefault();
        const newSearchParams = new URLSearchParams();

        if (searchTerm.trim()) {
            newSearchParams.set('q', searchTerm.trim());
        }
        newSearchParams.set('page', '1');

        setSearchParams(newSearchParams);
    };

    // Manejar cambio de p�gina
    const handlePageChange = (newPage) => {
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.set('page', newPage.toString());
        setSearchParams(newSearchParams);
    };

    // Limpiar búsqueda
    const clearSearch = () => {
        setSearchTerm('');
        setSearchParams({ page: '1' });
    };

    return (
        <FadeContent>
            <div className="z-1 fixed inset-0">
                <LiquidChrome
                    baseColor={theme === 'dark' ? [0.05, 0.02, 0.15] : [0.9, 0.8, 1]}
                    amplitude={0.3}
                    speed={0.15}
                    interactive={false}
                />
            </div>
            <div className={`min-h-screen ${theme === 'dark' ? 'bg-bg-primario-dark text-texto-dark' : 'bg-bg-primario text-texto'} relative z-10`}>
                <div className="container mx-auto px-4 py-8">
                    {/* Header de búsqueda */}
                    <div className="mb-8">
                        <h1 className="mb-4 text-4xl font-bold">
                            {isSearching ? `Resultados para: "${searchParams.get('q')}"` : 'Explorar Películas'}
                        </h1>

                        {/* Barra de búsqueda */}
                        <form onSubmit={handleSearch} className="mb-6">
                            <div className="flex space-x-2">
                                <div className="relative flex-1">
                                    <SearchIcon
                                        className="-translate-y-1/2 absolute left-3 top-1/2 transform text-black dark:text-white"
                                        size={20}
                                    />
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Buscar películas..."
                                        className={`w-full pl-10 pr-4 py-3 rounded-lg border ${theme === 'dark'
                                            ? 'bg-secundario-dark border-gray-600 text-texto-dark placeholder-gray-400'
                                            : 'bg-secundario border-gray-300 text-texto placeholder-gray-500'
                                            } focus:ring-2 focus:ring-primario focus:border-transparent`}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${theme === 'dark'
                                        ? 'bg-primario text-texto hover:bg-primario-dark hover:text-texto-dark'
                                        : 'bg-primario-dark text-texto-dark hover:bg-primario hover:text-texto'
                                        }`}
                                >
                                    Buscar
                                </button>
                                {isSearching && (
                                    <button
                                        type="button"
                                        onClick={clearSearch}
                                        className={`px-4 py-3 rounded-lg border transition-all duration-300 ${theme === 'dark'
                                            ? 'border-gray-600 text-gray-400 hover:text-texto-dark hover:border-gray-400'
                                            : 'border-gray-300 text-gray-600 hover:text-texto hover:border-gray-500'
                                            }`}
                                    >
                                        Limpiar
                                    </button>
                                )}
                            </div>
                        </form>

                        {/* Controles de vista */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded-md transition-all duration-300 ${viewMode === 'grid'
                                        ? theme === 'dark'
                                            ? 'bg-primario text-texto'
                                            : 'bg-primario-dark text-texto-dark'
                                        : theme === 'dark'
                                            ? 'bg-secundario-dark text-texto-dark hover:bg-primario hover:text-texto'
                                            : 'bg-secundario text-texto hover:bg-primario-dark hover:text-texto-dark'
                                        }`}
                                >
                                    <Grid size={20} />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded-md transition-all duration-300 ${viewMode === 'list'
                                        ? theme === 'dark'
                                            ? 'bg-primario text-texto'
                                            : 'bg-primario-dark text-texto-dark'
                                        : theme === 'dark'
                                            ? 'bg-secundario-dark text-texto-dark hover:bg-primario hover:text-texto'
                                            : 'bg-secundario text-texto hover:bg-primario-dark hover:text-texto-dark'
                                        }`}
                                >
                                    <List size={20} />
                                </button>
                            </div>

                            <p className="text-sm opacity-70">
                                Página {currentPage} de {isSearching ? Math.min(totalPages, 2) : totalPages}
                                {isSearching && ' (máximo 2 páginas en búsquedas)'}
                            </p>
                        </div>
                    </div>

                    {/* Contenido */}
                    {loading ? (
                        <div className="flex h-64 items-center justify-center">
                            <div className="text-xl">Cargando películas...</div>
                        </div>
                    ) : error ? (
                        <div className="flex h-64 items-center justify-center">
                            <div className="text-xl text-red-500">{error}</div>
                        </div>
                    ) : movies.length === 0 ? (
                        <div className="flex h-64 items-center justify-center">
                            <div className="text-xl opacity-70">
                                {isSearching ? 'No se encontraron películas' : 'No hay películas disponibles'}
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Grid de películas */}
                            <div className={
                                viewMode === 'grid'
                                    ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
                                    : "space-y-4"
                            }>
                                {movies.map((movie, index) => (
                                    <MovieCard
                                        key={`${movie.id}-${index}`}
                                        movie={movie}
                                        viewMode={viewMode}
                                    />
                                ))}
                            </div>

                            {/* Paginación */}
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={handlePageChange}
                                isSearching={isSearching}
                            />
                        </>
                    )}
                </div>
            </div>
        </FadeContent>
    );
};

export default Search;