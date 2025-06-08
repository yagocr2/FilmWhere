// hooks/useDatosPerfil.js - Versión con debugging y correcciones
import { useState, useEffect, useCallback } from 'react';

export const useProfileData = (token, userId) => {
    const [userProfile, setUserProfile] = useState(null);
    const [userReviews, setUserReviews] = useState([]);
    const [favoriteMovies, setFavoriteMovies] = useState([]);
    const [isFollowing, setIsFollowing] = useState(false);
    const [favoritesMetadata, setFavoritesMetadata] = useState({ totalCount: 0 });
    const [isPerfilP, setIsPerfilP] = useState(false);
    const [currentUserIdFromToken, setCurrentUserIdFromToken] = useState(null);

    const [loading, setLoading] = useState({
        profile: true,
        reviews: false, // Cambiado a false inicialmente
        favorites: false // Cambiado a false inicialmente
    });

    const [error, setError] = useState({
        profile: null,
        reviews: null,
        favorites: null
    });

    // Función para decodificar token - con mejor manejo de errores
    const getUserIdFromToken = useCallback((token) => {
        try {
            if (!token) {
                return null;
            }

            const parts = token.split('.');
            if (parts.length !== 3) {
                return null;
            }

            const payload = JSON.parse(atob(parts[1]));

            const userId = payload.sub || payload.userId || payload.id || payload.nameid || payload.user_id;

            return userId;
        } catch (error) {
            console.error('getUserIdFromToken: Error al decodificar el token:', error);
            return null;
        }
    }, []);

    // Calcular idToken una sola vez
    const idToken = getUserIdFromToken(token);

    // Función para construir URL de imagen
    const buildTmdbImageUrl = useCallback((posterPath, size = 'w500') => {
        if (!posterPath) return '/placeholder-movie.jpg';
        if (posterPath.startsWith('http')) return posterPath;
        return `https://image.tmdb.org/t/p/${size}/${posterPath}`;
    }, []);

    // Verificar estado de seguimiento
    const checkFollowingStatus = useCallback(async () => {
        if (!token || !userId) return;

        try {
            const response = await fetch(`/api/Seguidor/is-following/${userId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setIsFollowing(data.isFollowing);
            }
        } catch (error) {
            console.error('Error al verificar seguimiento:', error);
        }
    }, [token, userId]);

    // Función para cargar perfil de otro usuario
    const loadUserProfile = useCallback(async () => {
        if (!userId) return;


        try {
            setLoading(prev => ({ ...prev, profile: true }));
            setError(prev => ({ ...prev, profile: null }));

            const response = await fetch(`/api/User/profile/${userId}`);

            if (response.ok) {
                const data = await response.json();
                setUserProfile(data);

                // Verificar si es el mismo usuario logueado
                if (idToken && userId === idToken) {
                    window.location.href = '/perfil';
                    return;
                }
            } else {
                const errorText = await response.text();
                console.error('loadUserProfile: Error response:', errorText);
                setError(prev => ({ ...prev, profile: 'Usuario no encontrado' }));
            }
        } catch (error) {
            console.error('loadUserProfile: Error:', error);
            setError(prev => ({ ...prev, profile: 'Error al cargar el perfil' }));
        } finally {
            setLoading(prev => ({ ...prev, profile: false }));
        }
    }, [userId, idToken]);

    // Toggle de seguimiento
    const handleFollowToggle = useCallback(async (targetUserId) => {
        if (!token || !targetUserId) {
            console.error('handleFollowToggle - Faltan token o targetUserId');
            return;
        }

        try {
            const endpoint = isFollowing
                ? `/api/Seguidor/unfollow/${targetUserId}`
                : `/api/Seguidor/follow/${targetUserId}`;

            const method = isFollowing ? 'DELETE' : 'POST';

            const response = await fetch(endpoint, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const newFollowingState = !isFollowing;
                setIsFollowing(newFollowingState);

                // Actualizar conteo en el perfil
                setUserProfile(prev => {
                    if (!prev) return prev;

                    const currentCount = prev.seguidores?.length || 0;
                    const newCount = isFollowing
                        ? Math.max(0, currentCount - 1)
                        : currentCount + 1;

                    return {
                        ...prev,
                        seguidores: Array(newCount).fill({})
                    };
                });
            }
        } catch (error) {
            console.error('handleFollowToggle - Error:', error);
        }
    }, [token, isFollowing]);

    // Refrescar reseñas
    const refreshUserReviews = useCallback(async () => {
        if (!token) return;

        try {
            setLoading(prev => ({ ...prev, reviews: true }));
            const url = userId ? `/api/user/profile/${userId}/reviews` : '/api/reviews/usuario';

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setUserReviews(data);
            }
        } catch (err) {
            console.error('Error refreshing user reviews:', err);
        } finally {
            setLoading(prev => ({ ...prev, reviews: false }));
        }
    }, [token, userId]);

    // Eliminar reseña
    const handleDeleteReview = useCallback(async (reviewId) => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar esta reseña?')) {
            return;
        }

        try {
            const response = await fetch(`/api/reviews/${reviewId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                setUserReviews(prev => prev.filter(review => review.id !== reviewId));
            } else {
                throw new Error('Error al eliminar la reseña');
            }
        } catch (err) {
            console.error('Error deleting review:', err);
            alert('No se pudo eliminar la reseña');
        }
    }, [token]);

    // Eliminar de favoritos
    const handleRemoveFromFavorites = useCallback(async (movieId) => {
        try {
            const response = await fetch(`/api/favoritos/${movieId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                setFavoriteMovies(prev => prev.filter(movie => movie.id !== movieId));
                setFavoritesMetadata(prev => ({
                    ...prev,
                    totalCount: Math.max(0, prev.totalCount - 1)
                }));
            } else {
                throw new Error('Error al eliminar de favoritos');
            }
        } catch (err) {
            console.error('Error removing from favorites:', err);
            alert('No se pudo eliminar de favoritos');
        }
    }, [token]);

    // Effect para determinar tipo de perfil - SIMPLIFICADO
    useEffect(() => {

        if (token) {
            const tokenUserId = getUserIdFromToken(token);
            setCurrentUserIdFromToken(tokenUserId);

            if (userId) {
                setIsPerfilP(true);
            } else {
                setIsPerfilP(false);
            }
        }
    }, [token, userId, getUserIdFromToken]);

    // Effect para cargar perfil propio - CON DEBUGGING
    useEffect(() => {

        if (!token) {
            return;
        }

        if (userId) {
            return;
        }


        const fetchUserProfile = async () => {
            try {
                setLoading(prev => ({ ...prev, profile: true }));
                setError(prev => ({ ...prev, profile: null }));

                const response = await fetch('/api/user/profile', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setUserProfile(data);
                } else {
                    const errorText = await response.text();
                    console.error('fetchUserProfile: Error response:', errorText);
                    throw new Error('Error al cargar el perfil');
                }
            } catch (err) {
                console.error('fetchUserProfile: Error:', err);
                setError(prev => ({ ...prev, profile: 'No se pudieron cargar los datos del perfil' }));
            } finally {
                setLoading(prev => ({ ...prev, profile: false }));
            }
        };

        fetchUserProfile();
    }, [token, userId]);

    // Effect para cargar perfil de otro usuario
    useEffect(() => {

        if (userId && token)
            loadUserProfile();
    }, [userId, token, loadUserProfile]);

    // Effect para verificar seguimiento
    useEffect(() => {
        if (userId && token && userProfile?.id) {
            checkFollowingStatus();
        }
    }, [userId, token, userProfile?.id, checkFollowingStatus]);

    // Effect para cargar reseñas - SOLO CUANDO SE TENGA EL PERFIL
    useEffect(() => {

        if (!token || !userProfile) {
            return;
        }

        const fetchUserReviews = async () => {
            try {
                setLoading(prev => ({ ...prev, reviews: true }));
                setError(prev => ({ ...prev, reviews: null }));

                const url = userId ? `/api/user/profile/${userId}/reviews` : '/api/reviews/usuario';

                const response = await fetch(url, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setUserReviews(data);
                } else {
                    throw new Error('Error al cargar las reseñas');
                }
            } catch (err) {
                console.error('fetchUserReviews: Error:', err);
                setError(prev => ({ ...prev, reviews: 'No se pudieron cargar las reseñas' }));
            } finally {
                setLoading(prev => ({ ...prev, reviews: false }));
            }
        };

        fetchUserReviews();
    }, [token, userId, userProfile]); // Agregado userProfile como dependencia

    // Effect para cargar favoritos - SOLO CUANDO SE TENGA EL PERFIL
    useEffect(() => {

        if (!token || !userProfile) {
            return;
        }

        const fetchFavoriteMovies = async () => {
            try {
                setLoading(prev => ({ ...prev, favorites: true }));
                setError(prev => ({ ...prev, favorites: null }));

                const url = userId ? `/api/user/profile/${userId}/favorites` : '/api/favoritos';

                const response = await fetch(url, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setFavoriteMovies(data.movies || []);
                    setFavoritesMetadata({
                        totalCount: data.totalCount || 0,
                        page: data.page || 1,
                        pageSize: data.pageSize || 20,
                        totalPages: data.totalPages || 0
                    });
                } else {
                    throw new Error('Error al cargar favoritos');
                }
            } catch (err) {
                console.error('fetchFavoriteMovies: Error:', err);
                setError(prev => ({ ...prev, favorites: 'No se pudieron cargar las películas favoritas' }));
            } finally {
                setLoading(prev => ({ ...prev, favorites: false }));
            }
        };

        fetchFavoriteMovies();
    }, [token, userId, userProfile]); // Agregado userProfile como dependencia

    return {
        userProfile,
        setUserProfile,
        userReviews,
        favoriteMovies,
        favoritesMetadata,
        isPerfilP,
        loading,
        error,
        isFollowing,
        buildTmdbImageUrl,
        handleDeleteReview,
        handleRemoveFromFavorites,
        refreshUserReviews,
        getUserIdFromToken,
        idToken,
        handleFollowToggle
    };
};