// hooks/useSearchMovies.js
import { useState, useCallback } from 'react';

const useSearchMovies = () => {
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [totalPages, setTotalPages] = useState(0);
    const [isSearching, setIsSearching] = useState(false);

    const fetchMovies = useCallback(async (query = '', page = 1, selectedGenres = []) => {
        // Si no hay query ni géneros seleccionados, limpiar resultados
        if (!query.trim() && selectedGenres.length === 0) {
            setMovies([]);
            setTotalPages(0);
            setIsSearching(false);
            return;
        }

        setLoading(true);
        setError(null);
        setIsSearching(true);

        try {
            let url;
            let searchParams = new URLSearchParams();

            // Determinar el endpoint según los filtros
            if (selectedGenres.length > 0 && !query.trim()) {
                // Solo filtro por género
                const genreName = selectedGenres[0]; // Por simplicidad, usar el primer género
                url = `/api/pelicula/genero/${encodeURIComponent(genreName)}`;
                searchParams.append('cantidad', '48');
                searchParams.append('page', page.toString());
            } else if (query.trim() && selectedGenres.length === 0) {
                // Solo búsqueda por texto
                url = '/api/pelicula/buscar';
                searchParams.append('query', query.trim());
                searchParams.append('page', page.toString());
            } else if (query.trim() && selectedGenres.length > 0) {
                // Búsqueda avanzada (texto + géneros)
                url = '/api/pelicula/busqueda-avanzada';
                searchParams.append('title', query.trim());
                searchParams.append('genre', selectedGenres[0]); // Usar el primer género
                searchParams.append('page', page.toString());
            } else {
                // Búsqueda general si no hay criterios específicos
                url = '/api/pelicula/populares';
                searchParams.append('page', page.toString());
                searchParams.append('cantidad', '48');
            }

            const fullUrl = `${url}?${searchParams.toString()}`;

            const response = await fetch(fullUrl);

            if (!response.ok) {
                if (response.status === 404) {
                    // No se encontraron resultados
                    setMovies([]);
                    setTotalPages(0);
                    return;
                }
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            // Manejar diferentes formatos de respuesta
            let moviesData = [];
            let totalPagesData = 1;

            if (Array.isArray(data)) {
                // Respuesta directa de array
                moviesData = data;
                totalPagesData = Math.ceil(data.length / 20) || 1;
            } else if (data.results && Array.isArray(data.results)) {
                // Respuesta con formato de paginación
                moviesData = data.results;
                totalPagesData = data.totalPages || Math.ceil(data.total_results / 20) || 1;
            } else if (data.movies && Array.isArray(data.movies)) {
                // Otro formato posible
                moviesData = data.movies;
                totalPagesData = data.totalPages || 1;
            } else if (data.data && Array.isArray(data.data)) {
                moviesData = data.data; // Asumiendo que data.data contiene los
                totalPagesData = data.totalPages
            }

            // Filtrar películas duplicadas por ID
            const uniqueMovies = moviesData.filter((movie, index, self) =>
                index === self.findIndex(m => m.id === movie.id)
            );

            setMovies(uniqueMovies);
            setTotalPages(Math.max(totalPagesData, 1));

        } catch (err) {
            console.error('Error fetching movies:', err);
            setError(err.message || 'Error al buscar películas');
            setMovies([]);
            setTotalPages(0);
        } finally {
            setLoading(false);
        }
    }, []);

    // Método específico para búsqueda por género
    const fetchMoviesByGenre = useCallback(async (genreName, cantidad = 48) => {
        setLoading(true);
        setError(null);
        setIsSearching(true);

        try {
            const response = await fetch(`/api/pelicula/genero/${encodeURIComponent(genreName)}?page=1&cantidad=${cantidad}`);

            if (!response.ok) {
                if (response.status === 404) {
                    setMovies([]);
                    setTotalPages(0);
                    return;
                }
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            const moviesData = Array.isArray(data.data) ? data.data : [];

            setMovies(moviesData);
            setTotalPages(1); // Para búsqueda por género, por simplicidad usar 1 página

        } catch (err) {
            console.error('Error fetching movies by genre:', err);
            setError(err.message || 'Error al buscar películas por género');
            setMovies([]);
            setTotalPages(0);
        } finally {
            setLoading(false);
        }
    }, []);

    // Método para limpiar la búsqueda
    const clearSearch = useCallback(() => {
        setMovies([]);
        setTotalPages(0);
        setIsSearching(false);
        setError(null);
    }, []);

    return {
        movies,
        loading,
        error,
        totalPages,
        isSearching,
        fetchMovies,
        fetchMoviesByGenre,
        clearSearch
    };
};

export default useSearchMovies;