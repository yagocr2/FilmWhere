// modules/Search/Search.jsx
import { useEffect, useState } from "react";
import { useSearchParams } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import FadeContent from '../../Animations/FadeContent/FadeContent';
import useSearchMovies from '../../hooks/useSearchMovies';
import SearchHeader from '../../components/Search/SearchHeader';
import CardPelicula from '../../components/Search/CardPelicula';
import Paginacion from '../../components/Layouts/Paginacion';

const Search = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const { theme } = useTheme();
    const { movies, loading, error, totalPages, isSearching, fetchMovies, clearSearch } = useSearchMovies();

    // Estados locales
    const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
    const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page')) || 1);
    const [viewMode, setViewMode] = useState('grid');
    const [selectedGenres, setSelectedGenres] = useState(() => {
        const genresParam = searchParams.get('genres');
        return genresParam ? genresParam.split(',').filter(g => g.trim()) : [];
    });

    // Cargar películas al montar el componente o cambiar parámetros
    useEffect(() => {
        const query = searchParams.get('q') || '';
        const page = parseInt(searchParams.get('page')) || 1;
        const genresParam = searchParams.get('genres');
        const genres = genresParam ? genresParam.split(',').filter(g => g.trim()) : [];

        setSearchTerm(query);
        setCurrentPage(page);
        setSelectedGenres(genres);

        // Realizar búsqueda si hay query o géneros
        if (query.trim() || genres.length > 0) {
            fetchMovies(query, page, genres);
        } else {
            clearSearch();
        }
    }, [searchParams, fetchMovies, clearSearch]);

    // Manejar búsqueda
    const handleSearch = () => {
        updateSearchParams(searchTerm, 1, selectedGenres);
    };

    // Manejar cambio de página
    const handlePageChange = (newPage) => {
        updateSearchParams(searchParams.get('q') || '', newPage, selectedGenres);
    };
    const handleGenreChange = (newGenres) => {
        setSelectedGenres(newGenres);
        updateSearchParams(searchTerm, 1, newGenres);
    };
    // Limpiar búsqueda
    const handleClearSearch = () => {
        setSearchTerm('');
        setSelectedGenres([]);
        setSearchParams({});
        clearSearch();
    };
    const handleClearFilters = () => {
        setSelectedGenres([]);
        updateSearchParams(searchTerm, 1, []);
    };
    const updateSearchParams = (query, page, genres) => {
        const newSearchParams = new URLSearchParams();

        if (query.trim()) {
            newSearchParams.set('q', query.trim());
        }

        if (genres.length > 0) {
            newSearchParams.set('genres', genres.join(','));
        }

        if (page > 1) {
            newSearchParams.set('page', page.toString());
        }

        setSearchParams(newSearchParams);
    };

    // Renderizar contenido principal
    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex h-64 items-center justify-center">
                    <div className="text-xl">Cargando películas...</div>
                </div>
            );
        }

        if (error) {
            return (
                <div className="flex h-64 items-center justify-center">
                    <div className="text-xl text-red-500">{error}</div>
                </div>
            );
        }
        if (!isSearching && !searchTerm && selectedGenres.length === 0) {
            return (
                <div className="flex h-64 items-center justify-center">
                    <div className={`text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        <div className="mb-4 text-6xl">🎬</div>
                        <div className="mb-2 text-xl">Busca tu película favorita</div>
                        <div className="text-sm">Usa la barra de búsqueda o filtra por géneros</div>
                    </div>
                </div>
            );
        }
        // Verificar si hay películas
        if (!movies || movies.length === 0) {
            return (
                <div className="flex h-64 items-center justify-center">
                    <div className={`text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        <div className="mb-4 text-6xl">🔍</div>
                        <div className="mb-2 text-xl">No se encontraron películas</div>
                        <div className="text-sm">
                            {searchTerm && selectedGenres.length > 0
                                ? `Intenta con otros términos de búsqueda o géneros`
                                : searchTerm
                                    ? `Intenta con otros términos de búsqueda`
                                    : `Intenta con otros géneros`
                            }
                        </div>
                    </div>
                </div>
            );
        }

        // Filtrar películas duplicadas basándose en el ID
        const uniqueMovies = movies.filter((movie, index, self) =>
            index === self.findIndex(m => m.id === movie.id)
        );

        return (
            <>
                {/* Renderizar grid o lista de películas */}
                <div className={`mb-8 ${viewMode === 'grid'
                    ? 'grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
                    : 'space-y-4'
                    }`}>
                    {uniqueMovies.map((movie, index) => (
                        <CardPelicula
                            key={`${movie.id}-${index}`}
                            movie={movie}
                            viewMode={viewMode}
                        />
                    ))}
                </div>

                <Paginacion
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    isSearching={isSearching}
                />
            </>
        );
    };

    return (
        <FadeContent>
            <div className={`min-h-screen ${theme === 'dark'
                ? 'bg-primario-dark text-texto-dark'
                : 'bg-primario text-texto'
                } relative z-10`}>
                <div className="container mx-auto px-4 py-8">
                    <SearchHeader
                        isSearching={isSearching}
                        searchQuery={searchParams.get('q')}
                        searchTerm={searchTerm}
                        onSearchTermChange={setSearchTerm}
                        onSubmit={handleSearch}
                        onClear={handleClearSearch}
                        viewMode={viewMode}
                        onViewModeChange={setViewMode}
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onGenreChange={handleGenreChange}
                        onClearFilters={handleClearFilters}
                    />

                    {renderContent()}
                </div>
            </div>
        </FadeContent>
    );
};

export default Search;