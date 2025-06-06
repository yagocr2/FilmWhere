// hooks/useProfileData.js
import { useState, useEffect } from 'react';

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
        reviews: true,
        favorites: true
    });

    const [error, setError] = useState({
        profile: null,
        reviews: null,
        favorites: null
    });

    const getUserIdFromToken = (token) => {
        try {
            if (!token) return null;

            // Dividir el token en sus partes
            const parts = token.split('.');
            if (parts.length !== 3) return null;

            // Decodificar la parte del payload (segunda parte)
            const payload = JSON.parse(atob(parts[1]));
            // El ID puede estar en diferentes campos dependiendo de cómo se genere el token
            // Comúnmente está en 'sub', 'userId', 'id', 'nameid', etc.
            return payload.sub || payload.userId || payload.id || payload.nameid || payload.user_id;
        } catch (error) {
            console.error('Error al decodificar el token:', error);
            return null;
        }
    };
    const idToken = getUserIdFromToken(token);

    // Función para construir la URL completa de TMDB
    const buildTmdbImageUrl = (posterPath, size = 'w500') => {
        if (!posterPath) return '/placeholder-movie.jpg';
        if (posterPath.startsWith('http')) return posterPath;
        return `https://image.tmdb.org/t/p/${size}/${posterPath}`;
    };

    const checkFollowingStatus = async () => {
        if (!token || !userId) return;

        try {
            const response = await fetch(`/api/Seguidor/is-following/${userId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                console.log('checkFollowingStatus - Resultado:', data.isFollowing);
                setIsFollowing(data.isFollowing);
            }
        } catch (error) {
            console.error('Error al verificar seguimiento:', error);
        }
    };

    // Función para cargar perfil de usuario (movida fuera del useEffect)
    const loadUserProfile = async () => {
        try {
            const idToken = getUserIdFromToken(token);
            setCurrentUserIdFromToken(idToken)
            if (userId === currentUserIdFromToken)
                window.location.href = '/perfil';

            setLoading(prev => ({ ...prev, profile: true }));
            const response = await fetch(`/api/User/profile/${userId}`);



            if (response.ok) {
                const data = await response.json();
                setUserProfile(data);
            } else {
                setError(prev => ({ ...prev, profile: 'Usuario no encontrado' }));
            }
        } catch (error) {
            console.error('Error:', error);
            setError(prev => ({ ...prev, profile: 'Error al cargar el perfil' }));
        } finally {
            setLoading(prev => ({ ...prev, profile: false }));
        }
    };

    const handleFollowToggle = async (targetUserId) => {
        if (!token || !targetUserId) {
            console.error('handleFollowToggle - Faltan token o targetUserId');
            return;
        }

        console.log('handleFollowToggle - Estado actual isFollowing:', isFollowing);
        console.log('handleFollowToggle - targetUserId:', targetUserId);

        try {
            const endpoint = isFollowing
                ? `/api/Seguidor/unfollow/${targetUserId}`
                : `/api/Seguidor/follow/${targetUserId}`;

            const method = isFollowing ? 'DELETE' : 'POST';

            console.log('handleFollowToggle - Llamando a:', endpoint, 'con método:', method);

            const response = await fetch(endpoint, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                console.log('handleFollowToggle - Respuesta exitosa');
                // Actualizar el estado inmediatamente
                const newFollowingState = !isFollowing;
                setIsFollowing(newFollowingState);
                console.log('handleFollowToggle - Nuevo estado isFollowing:', newFollowingState);

                // Opcional: Actualizar también el conteo en el perfil
                setUserProfile(prev => {
                    if (!prev) return prev;

                    const currentCount = prev.seguidores?.length || 0;
                    const newCount = isFollowing
                        ? Math.max(0, currentCount - 1)
                        : currentCount + 1;

                    return {
                        ...prev,
                        seguidores: Array(newCount).fill({}) // Placeholder
                    };
                });
            } else {
                const errorData = await response.json();
                console.error('handleFollowToggle - Error en respuesta:', errorData);
            }
        } catch (error) {
            console.error('handleFollowToggle - Error:', error);
        }
    };

    // Cargar datos del perfil propio (cuando no hay userId en params)
    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const response = await fetch('/api/user/profile', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setUserProfile(data);
                    setIsPerfilP(false);
                } else {
                    throw new Error('Error al cargar el perfil');
                }
            } catch (err) {
                console.error('Error fetching user profile:', err);
                setError(prev => ({ ...prev, profile: 'No se pudieron cargar los datos del perfil' }));
            } finally {
                setLoading(prev => ({ ...prev, profile: false }));
            }
        };

        // Solo ejecutar si hay token pero NO hay userId (perfil propio)
        if (token && !userId) {
            fetchUserProfile();
        }
    }, [token, userId]);

    // Cargar perfil de otro usuario y verificar seguimiento
    useEffect(() => {
        if (userId) {
            loadUserProfile();
            setIsPerfilP(true);
        }
    }, [userId]); // Solo depende de userId

    // Verificar estado de seguimiento por separado
    useEffect(() => {
        if (userId && token && userProfile) {
            checkFollowingStatus();
        }
    }, [userId, token, userProfile?.id]); // Depende de userId, token y el id del perfil cargado

    // Cargar reseñas del usuario
    useEffect(() => {
        const fetchUserReviews = async () => {
            try {

                setLoading(prev => ({ ...prev, reviews: true }));
                setError(prev => ({ ...prev, reviews: null }));

                const url = (userId) ? `/api/user/profile/${userId}/reviews` : '/api/reviews/usuario'
                
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
                console.error('Error fetching user reviews:', err);
                setError(prev => ({ ...prev, reviews: 'No se pudieron cargar las reseñas' }));
            } finally {
                setLoading(prev => ({ ...prev, reviews: false }));
            }
        };

        if (token) fetchUserReviews();
    }, [token, userId]);

    // Cargar películas favoritas
    useEffect(() => {
        const fetchFavoriteMovies = async () => {
            try {
                const url = (userId) ? `/api/user/profile/${userId}/favorites` : '/api/favoritos'
                const response = await fetch(url, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log(data.movies);
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
                console.error('Error fetching favorite movies:', err);
                setError(prev => ({ ...prev, favorites: 'No se pudieron cargar las películas favoritas' }));
            } finally {
                setLoading(prev => ({ ...prev, favorites: false }));
            }
        };

        if (token) fetchFavoriteMovies();
    }, [token, userId]);

    // Función para refrescar reseñas (para usar después de editar/eliminar)
    const refreshUserReviews = async () => {
        try {
            setLoading(prev => ({ ...prev, reviews: true }));
            const response = await fetch('/api/reviews/usuario', {
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
    };

    // Eliminar reseña
    const handleDeleteReview = async (reviewId) => {
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
    };

    // Eliminar de favoritos
    const handleRemoveFromFavorites = async (movieId) => {
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
    };

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