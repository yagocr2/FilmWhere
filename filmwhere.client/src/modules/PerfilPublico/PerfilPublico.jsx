import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, UserPlus, UserMinus, Users, Heart } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import FadeContent from '../../Animations/FadeContent/FadeContent';
import LoadingSpinner from '../../components/LoadingSpinner';


const PerfilPublico = () => {
    const { userId } = useParams();
    const { token, user } = useAuth();
    const { theme } = useTheme();

    // Estados del perfil p�blico
    const [userProfile, setUserProfile] = useState(null);
    const [userReviews, setUserReviews] = useState([]);
    const [userFavorites, setUserFavorites] = useState([]);
    const [followStats, setFollowStats] = useState({ followersCount: 0, followingCount: 0 });
    const [isFollowing, setIsFollowing] = useState(false);
    const [activeTab, setActiveTab] = useState('reseñas');

    // Estados de carga
    const [loading, setLoading] = useState({
        profile: true,
        reviews: false,
        favorites: false,
        follow: false
    });
    const [error, setError] = useState(null);

    // Cargar datos del perfil
    useEffect(() => {
        if (userId) {
            loadUserProfile();
            loadFollowStats();
            if (token) {
                checkFollowingStatus();
            }
        }
        console.log(userId);
    }, [userId, token]);

    // Cargar datos de la tab activa
    useEffect(() => {
        if (activeTab === 'reseñas' && userReviews.length === 0) {
            loadUserReviews();
        } else if (activeTab === 'favoritos' && userFavorites.length === 0) {
            loadUserFavorites();
        }
    }, [activeTab]);

    const loadUserProfile = async () => {
        try {
            setLoading(prev => ({ ...prev, profile: true }));
            const response = await fetch(`/api/User/profile/${userId}`);
            if (response.ok) {
                const data = await response.json();
                setUserProfile(data);
            } else {
                setError('Usuario no encontrado');
            }
        } catch (error) {
            setError('Error al cargar el perfil');
            console.error('Error:', error);
        } finally {
            setLoading(prev => ({ ...prev, profile: false }));
        }
    };

    const loadUserReviews = async () => {
        try {
            setLoading(prev => ({ ...prev, reviews: true }));
            const response = await fetch(`/api/User/profile/${userId}/reviews`);
            if (response.ok) {
                const data = await response.json();
                setUserReviews(data);
            }
        } catch (error) {
            console.error('Error al cargar reseñas:', error);
        } finally {
            setLoading(prev => ({ ...prev, reviews: false }));
        }
    };

    const loadUserFavorites = async () => {
        try {
            setLoading(prev => ({ ...prev, favorites: true }));
            const response = await fetch(`/api/User/profile/${userId}/favorites`);
            if (response.ok) {
                const data = await response.json();
                setUserFavorites(data);
            }
        } catch (error) {
            console.error('Error al cargar favoritos:', error);
        } finally {
            setLoading(prev => ({ ...prev, favorites: false }));
        }
    };

    const loadFollowStats = async () => {
        try {
            const response = await fetch(`/api/Seguidor/stats/${userId}`);
            if (response.ok) {
                const data = await response.json();
                setFollowStats(data);
            }
        } catch (error) {
            console.error('Error al cargar estadísticas:', error);
        }
    };

    const checkFollowingStatus = async () => {
        if (!token || userId === user?.id) return;

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
    };

    const handleFollowToggle = async () => {
        if (!token) return;

        setLoading(prev => ({ ...prev, follow: true }));
        try {
            const endpoint = isFollowing
                ? `/api/Seguidor/unfollow/${userId}`
                : `/api/Seguidor/follow/${userId}`;

            const method = isFollowing ? 'DELETE' : 'POST';

            const response = await fetch(endpoint, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                setIsFollowing(!isFollowing);
                // Actualizar contador de seguidores
                setFollowStats(prev => ({
                    ...prev,
                    followersCount: isFollowing
                        ? prev.followersCount - 1
                        : prev.followersCount + 1
                }));
            }
        } catch (error) {
            console.error('Error al cambiar seguimiento:', error);
        } finally {
            setLoading(prev => ({ ...prev, follow: false }));
        }
    };

    const buildTmdbImageUrl = (posterPath, size = 'w500') => {
        if (!posterPath) return '/placeholder-movie.jpg';
        if (posterPath.startsWith('http')) return posterPath;
        return `https://image.tmdb.org/t/p/${size}/${posterPath}`;
    };

    if (loading.profile) {
        return <LoadingSpinner message="Cargando perfil..." />;
    }

    if (error) {
        return (
            <FadeContent>
                <div className={`min-h-screen ${theme === 'dark' ? 'bg-primario-dark text-texto-dark' : 'bg-primario text-texto'}`}>
                    <div className="container mx-auto px-4 py-8">
                        <div className="py-8 text-center text-red-500">{error}</div>
                    </div>
                </div>
            </FadeContent>
        );
    }

    return (
        <FadeContent>
            <div className={`min-h-screen ${theme === 'dark' ? 'bg-primario-dark text-texto-dark' : 'bg-primario text-texto'}`}>
                <div className="container mx-auto px-4 py-8">
                    {/* Header del perfil */}
                    <div className={`p-6 rounded-lg mb-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
                        <div className="flex flex-col items-center space-y-4 md:flex-row md:space-y-0 md:space-x-6">
                            {/* Foto de perfil */}
                            <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-full bg-gray-300">
                                {userProfile?.fotoPerfil ? (
                                    <img
                                        src={userProfile.fotoPerfil}
                                        alt="Foto de perfil"
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center bg-blue-500 text-2xl font-bold text-white">
                                        {userProfile?.nombre?.[0]?.toUpperCase() || '?'}
                                    </div>
                                )}
                            </div>

                            {/* Información del usuario */}
                            <div className="flex-1 text-center md:text-left">
                                <h1 className="text-2xl font-bold">
                                    {userProfile?.nombre} {userProfile?.apellido}
                                </h1>
                                <p className="text-gray-500">@{userProfile?.userName}</p>
                                <p className="mt-2 text-sm text-gray-400">
                                    Miembro desde {new Date(userProfile?.fechaRegistro).toLocaleDateString()}
                                </p>
                            </div>

                            {/* Botón de seguir (solo si no es el propio perfil y está autenticado) */}
                            {token && userId !== user?.id && (
                                <button
                                    onClick={handleFollowToggle}
                                    disabled={loading.follow}
                                    className={`
                                        flex items-center space-x-2 px-6 py-2 rounded-full font-medium transition-colors
                                        ${isFollowing
                                            ? `${theme === 'dark' ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'} text-white`
                                            : `${theme === 'dark' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white`
                                        }
                                        ${loading.follow ? 'opacity-50 cursor-not-allowed' : ''}
                                    `}
                                >
                                    {loading.follow ? (
                                        <div className="h-4 w-4 animate-spin rounded-full border border-white border-t-transparent" />
                                    ) : (
                                        <>
                                            {isFollowing ? <UserMinus size={16} /> : <UserPlus size={16} />}
                                            <span>{isFollowing ? 'Siguiendo' : 'Seguir'}</span>
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Estadísticas */}
                    <div className={`p-4 rounded-lg mb-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
                        <div className="grid grid-cols-2 gap-4 text-center md:grid-cols-4">
                            <div>
                                <div className="text-2xl font-bold">{userReviews.length}</div>
                                <div className="text-sm text-gray-500">Rese�as</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold">{userFavorites.length}</div>
                                <div className="text-sm text-gray-500">Favoritos</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold">{followStats.followersCount}</div>
                                <div className="text-sm text-gray-500">Seguidores</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold">{followStats.followingCount}</div>
                                <div className="text-sm text-gray-500">Siguiendo</div>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className={`rounded-lg mb-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
                        <div className="flex">
                            <button
                                onClick={() => setActiveTab('reseñas')}
                                className={`flex-1 px-4 py-3 text-center font-medium rounded-tl-lg ${activeTab === 'reseñas'
                                    ? `${theme === 'dark' ? 'bg-blue-600' : 'bg-blue-500'} text-white`
                                    : `${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`
                                    }`}
                            >
                                <Star size={16} className="mr-2 inline" />
                                Rese�as
                            </button>
                            <button
                                onClick={() => setActiveTab('favoritos')}
                                className={`flex-1 px-4 py-3 text-center font-medium rounded-tr-lg ${activeTab === 'favoritos'
                                    ? `${theme === 'dark' ? 'bg-blue-600' : 'bg-blue-500'} text-white`
                                    : `${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`
                                    }`}
                            >
                                <Heart size={16} className="mr-2 inline" />
                                Favoritos
                            </button>
                        </div>
                    </div>

                    {/* Contenido de las tabs */}
                    {activeTab === 'reseñas' && (
                        <div className={`rounded-lg p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
                            {loading.reviews ? (
                                <LoadingSpinner message="Cargando reseñas..." />
                            ) : userReviews.length > 0 ? (
                                <div className="space-y-4">
                                    {userReviews.map((review) => (
                                        <div
                                            key={review.id}
                                            className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}
                                        >
                                            <div className="flex items-start space-x-4">
                                                <img
                                                    src={buildTmdbImageUrl(review.pelicula.posterUrl)}
                                                    alt={review.pelicula.titulo}
                                                    className="h-24 w-16 rounded object-cover"
                                                />
                                                <div className="flex-1">
                                                    <h3 className="text-lg font-semibold">
                                                        {review.pelicula.titulo} ({review.pelicula.año})
                                                    </h3>
                                                    <div className="my-2 flex items-center space-x-2">
                                                        <Star size={16} className="text-yellow-400" fill="currentColor" />
                                                        <span>{review.calificacion}/10</span>
                                                        <span className="text-sm text-gray-500">
                                                            {new Date(review.fecha).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    {review.comentario && (
                                                        <p className="mt-2 text-sm">{review.comentario}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="py-8 text-center text-gray-500">
                                    Este usuario aún no ha escrito reseñas.
                                </p>
                            )}
                        </div>
                    )}

                    {activeTab === 'favoritos' && (
                        <div className={`rounded-lg p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
                            {loading.favorites ? (
                                <LoadingSpinner message="Cargando favoritos..." />
                            ) : userFavorites.length > 0 ? (
                                <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
                                    {userFavorites.map((favorite) => (
                                        <Link>
                                            <div key={favorite.peliculaId} className="text-center">
                                                <img
                                                    src={buildTmdbImageUrl(favorite.pelicula.posterUrl)}
                                                    alt={favorite.pelicula.titulo}
                                                    className="h-auto w-full rounded-lg shadow-md transition-shadow hover:shadow-lg"
                                                />
                                                <h3 className="mt-2 line-clamp-2 text-sm font-medium">
                                                    {favorite.pelicula.titulo}
                                                </h3>
                                                <p className="text-xs text-gray-500">
                                                    {favorite.pelicula.año}
                                                </p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <p className="py-8 text-center text-gray-500">
                                    Este usuario a�n no tiene películas favoritas.
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </FadeContent>
    );
};

export default PerfilPublico;