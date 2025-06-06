import { useState, useEffect } from 'react';

export const useDatosPelicula = (id) => {
    const [movie, setMovie] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchMovieData = async () => {
            try {
                setLoading(true);
                setError(null);

                const response = await fetch(`/api/pelicula/${id}`);

                if (!response.ok) {
                    if (response.status === 404) {
                        throw new Error('Película no encontrada');
                    }
                    throw new Error(`Error ${response.status}: No se pudo obtener la información de la película`);
                }

                const data = await response.json();
                setMovie(data);
            } catch (err) {
                console.error('Error fetching movie data:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchMovieData();
        }
    }, [id]);

    return { movie, loading, error };
};