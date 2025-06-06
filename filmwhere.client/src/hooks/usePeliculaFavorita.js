import { useState, useCallback } from 'react';

export const usePeliculaFavorita = (token) => {
    const [isFavorite, setIsFavorite] = useState(false);
    const [checkingFavorite, setCheckingFavorite] = useState(false);
    const [loadingF, setLoadingF] = useState(false);

    const checkIfFavorite = useCallback(async (movieId) => {
        if (!token) return;

        try {
            setCheckingFavorite(true);
            const response = await fetch(`/api/favoritos/check/${movieId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setIsFavorite(data.isFavorite);
            }
        } catch (err) {
            console.error('Error checking if movie is favorite:', err);
        } finally {
            setCheckingFavorite(false);
        }
    }, [token]);

    const toggleFavorite = useCallback(async (movieId) => {
        if (!token) return;

        try {
            if (!isFavorite) 
                setLoadingF(true);

            const response = await fetch(`/api/favoritos/${movieId}`, {
                method: isFavorite ? 'DELETE' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setIsFavorite(data.isFavorite);
            } else {
                console.error('Error toggling favorite:', response.statusText);
            }
        } catch (err) {
            console.error('Error toggling favorite:', err);
        } finally {
            setLoadingF(false);
        }
    }, [token, isFavorite]);

    return {
        isFavorite,
        checkingFavorite,
        loadingF,
        checkIfFavorite,
        toggleFavorite
    };
};