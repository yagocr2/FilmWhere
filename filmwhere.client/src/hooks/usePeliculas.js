// hooks/useMovies.js
import { useState, useEffect } from 'react';

export const usePeliculas = () => {
    const [movies, setMovies] = useState({
        popular: [],
        action: [],
        horror: [],
        newReleases: [],
        topRated: [],
        fantasia:[],
        animacion:[]
    });

    const [loading, setLoading] = useState({
        popular: true,
        action: true,
        horror: true,
        animacion: true,
        newReleases: true,
        topRated: true,
        fantasia: true
    });

    const [error, setError] = useState({
        popular: null,
        action: null,
        animacion: null,
        horror: null,
        newReleases: null,
        topRated: null,
        fantasia: null
    });

    // Función genérica para fetch de películas
    const fetchMovies = async (endpoint, category) => {
        try {
            const res = await fetch(endpoint);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const responseData = await res.json();
            console.log('Response Data: ',responseData);
            const data = responseData.data || responseData;
            console.log('Data: ',data);
            const formattedData = data.map(m => ({
                id: m.id,
                title: m.title,
                posterUrl: m.posterUrl,
                year: m.year,
                rating: m.rating
            }));
            setMovies(prev => ({ ...prev, [category]: formattedData }));
            setError(prev => ({ ...prev, [category]: null }));
        } catch (err) {
            console.error(`Error loading ${category} movies:`, err);
            setMovies(prev => ({ ...prev, [category]: [] }));
            setError(prev => ({ ...prev, [category]: `No se pudieron cargar las películas de ${category}.` }));
        } finally {
            setLoading(prev => ({ ...prev, [category]: false }));
        }
    };

    // Configuración de endpoints
    const endpoints = {
        popular: "api/Pelicula/populares?page=1&year=0&cantidad=15",
        action: "/api/Pelicula/genero/accion?page=1&cantidad=15",
        fantasia: "/api/Pelicula/genero/fantasia?page=1&cantidad=15",
        animacion: "/api/Pelicula/genero/animacion?page=1&cantidad=15",
        horror: "api/pelicula/genero/Terror?page=1&cantidad=15",
        newReleases: `/api/pelicula/estrenos?year=${new Date().getFullYear()}&cantidad=15`,
        topRated: "/api/pelicula/mejor-valoradas?page=1&cantidad=15",

    };

    // Cargar todas las categorías
    useEffect(() => {
        Object.entries(endpoints).forEach(([category, endpoint]) => {
            fetchMovies(endpoint, category);
        });
    }, []);

    return { movies, loading, error };
};