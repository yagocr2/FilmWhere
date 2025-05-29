import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, PlayCircle, Calendar, Clock, Users, ArrowLeft, Heart, Popcorn } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const DetallePelicula = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { theme } = useTheme();

    const [movie, setMovie] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFavorite, setIsFavorite] = useState(false);

    useEffect(() => {
        const fetchMovieData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Llamar a tu API para obtener los detalles completos de la película
                const response = await fetch(`/api/pelicula/${id}`);

                if (!response.ok) {
                    if (response.status === 404) {
                        throw new Error('Película no encontrada');
                    }
                    throw new Error(`Error ${response.status}: No se pudo obtener la información de la película`);
                }

                const data = await response.json();

                // Los datos ya vienen en el formato correcto desde el nuevo endpoint
                setMovie(data);

                // Aquí podrías verificar si la película está en favoritos del usuario
                // checkIfFavorite(data.id);
                console.log(data)
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

    const handleGoBack = () => {
        navigate(-1);
    };

    const toggleFavorite = async () => {
        try {
            // Implementar lógica para agregar/quitar de favoritos
            // const response = await fetch(`/api/favoritos/${movie.id}`, {
            //     method: isFavorite ? 'DELETE' : 'POST',
            //     headers: {
            //         'Content-Type': 'application/json',
            //         'Authorization': `Bearer ${token}`
            //     }
            // });

            // if (response.ok) {
            //     setIsFavorite(!isFavorite);
            // }

            // Por ahora, solo cambiar el estado local
            setIsFavorite(!isFavorite);
        } catch (err) {
            console.error('Error toggling favorite:', err);
        }
    };

    if (loading) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-primario-dark' : 'bg-primario'
                }`}>
                <div className="text-center">
                    <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
                    <p className={`mt-4 ${theme === 'dark' ? 'text-texto-dark' : 'text-texto'}`}>
                        Cargando información de la película...
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-primario-dark' : 'bg-primario'
                }`}>
                <div className="mx-auto max-w-md text-center bg-white">
                    <div className={`rounded-lg p-6 ${theme === 'dark' ? 'bg-red-900/20 text-red-400' : 'bg-red-100 text-red-600'
                        }`}>
                        <h2 className="mb-2 text-xl font-bold">Error al cargar la película</h2>
                        <p className="mb-4">{error}</p>
                        <div className="space-x-4">
                            <button
                                onClick={handleGoBack}
                                className={`px-4 py-2 rounded-lg transition-colors ${theme === 'dark'
                                    ? 'bg-primario text-texto hover:bg-primario-dark'
                                    : 'bg-primario-dark text-texto-dark hover:bg-primario'
                                    }`}
                            >
                                Volver
                            </button>
                            <button
                                onClick={() => window.location.reload()}
                                className={`px-4 py-2 rounded-lg border transition-colors ${theme === 'dark'
                                    ? 'border-primario text-primario hover:bg-primario hover:text-texto'
                                    : 'border-primario-dark text-primario-dark hover:bg-primario-dark hover:text-texto-dark'
                                    }`}
                            >
                                Reintentar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!movie) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-primario-dark text-texto-dark' : 'bg-primario text-texto'
                }`}>
                <p>No se encontró información de la película</p>
            </div>
        );
    }

    return (
        <div className={`min-h-screen ${theme === 'dark' ? 'bg-primario-dark text-texto-dark' : 'bg-primario text-texto'
            }`}>
            {/* Header con botón de volver */}
            <div className="sticky top-0 z-10 border-b border-gray-700 bg-black/20 backdrop-blur-sm">
                <div className="container mx-auto flex items-center justify-between px-4 py-4">
                    <button
                        onClick={handleGoBack}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${theme === 'dark'
                            ? 'bg-primario text-texto hover:bg-primario-dark hover:text-texto-dark'
                            : 'bg-primario-dark text-texto-dark hover:bg-primario hover:text-texto'
                            }`}
                    >
                        <ArrowLeft size={20} />
                        <span>Volver</span>
                    </button>

                    <button
                        onClick={toggleFavorite}
                        className={`p-2 rounded-full transition-colors ${isFavorite
                            ? 'bg-red-500 text-white hover:bg-red-600'
                            : theme === 'dark'
                                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                            }`}
                    >
                        <Heart size={24} fill={isFavorite ? 'currentColor' : 'none'} />
                    </button>
                </div>
            </div>

            {/* Contenido principal */}
            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col gap-8 md:flex-row">
                    {/* Poster de la película */}
                    <div className="mx-auto flex-shrink-0 md:mx-0">
                        <div className="relative">
                            <img
                                src={movie.posterUrl}
                                alt={movie.title}
                                className="h-96 w-64 rounded-lg object-cover shadow-2xl"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = '/placeholder-movie.jpg';
                                }}
                            />
                            {movie.rating && (
                                <div className="-translate-x-1/2 absolute -bottom-4 left-1/2 flex transform items-center space-x-1 rounded-full bg-yellow-500 px-3 py-1 font-bold text-black">
                                    <Star size={16} fill="currentColor" />
                                    <span>{movie.rating}/10</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Información de la película */}
                    <div className="flex-grow">
                        <h1 className="mb-4 text-4xl font-bold md:text-5xl">{movie.title}</h1>

                        <div className="mb-6 flex flex-wrap items-center gap-4">
                            <span className="flex items-center space-x-1">
                                <Calendar size={20} className="text-blue-400" />
                                <span>{movie.year}</span>
                            </span>

                            {movie.rating && (
                                <span className="flex items-center space-x-1">
                                    <Star size={20} className="text-yellow-400" />
                                    <span className="font-semibold">{movie.rating}/10</span>
                                </span>
                            )}

                            {movie.reviewCount > 0 && (
                                <span className="flex items-center space-x-1">
                                    <Users size={20} className="text-green-400" />
                                    <span>{movie.reviewCount} reseñas</span>
                                </span>
                            )}
                        </div>

                        {/* Géneros */}
                        {movie.genres && movie.genres.length > 0 && (
                            <div className="mb-6">
                                <div className="flex flex-wrap gap-2">
                                    {movie.genres.map((genre, index) => (
                                        <span
                                            key={index}
                                            className={`px-3 py-1 rounded-full text-sm font-medium ${theme === 'dark'
                                                ? 'bg-primario text-texto'
                                                : 'bg-primario-dark text-texto-dark'
                                                }`}
                                        >
                                            {genre}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Información adicional */}
                        <div className="space-y-6">
                            {/*Sinopsis*/}
                            {movie.overview !== '' ? (
                                <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-300'
                                    }`}>
                                    <h3 className="mb-4 flex items-center text-xl font-semibold">
                                        <Popcorn className="mr-2" />
                                        Sinopsis
                                    </h3>
                                    <p>{movie.overview}</p>
                                </div>
                            ) : (
                                <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-300'
                                    }`}>
                                    <h3 className="mb-4 flex items-center text-xl font-semibold">
                                            <Popcorn className="mr-2" />
                                        Dónde ver
                                    </h3>
                                    <p className="text-gray-500">
                                        Información de plataformas próximamente disponible.
                                    </p>
                                </div>
                            )}
                            {/* Plataformas */}
                            {movie.platforms && movie.platforms.length > 0 ? (
                                <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-300'
                                    }`}>
                                    <h3 className="mb-4 flex items-center text-xl font-semibold">
                                        <PlayCircle className="mr-2" />
                                        Dónde ver
                                    </h3>
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                        {movie.platforms.map((platform, index) => (
                                            <div
                                                key={index}
                                                className={`p-4 rounded-lg border transition-colors ${theme === 'dark'
                                                    ? 'border-gray-600 bg-gray-700 hover:bg-gray-600'
                                                    : 'border-gray-300 bg-white hover:bg-gray-50'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h4 className="font-semibold">{platform.name}</h4>
                                                        <p className="text-sm text-gray-500">{platform.type}</p>
                                                    </div>
                                                    {platform.price > 0 && (
                                                        <span className="font-bold text-green-500">
                                                            ${platform.price}
                                                        </span>
                                                    )}
                                                </div>
                                                {platform.url && (
                                                    <a
                                                        href={platform.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className={`mt-2 inline-block text-sm underline ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                                                            }`}
                                                    >
                                                        Ver en {platform.name}
                                                    </a>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-300'
                                    }`}>
                                    <h3 className="mb-4 flex items-center text-xl font-semibold">
                                        <PlayCircle className="mr-2" />
                                        Dónde ver
                                    </h3>
                                    <p className="text-gray-500">
                                        Información de plataformas próximamente disponible.
                                    </p>
                                </div>
                            )}

                            {/* Reseñas */}
                            {movie.reviews && movie.reviews.length > 0 ? (
                                <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-300'
                                    }`}>
                                    <h3 className="mb-4 text-xl font-semibold">
                                        Reseñas ({movie.reviewCount})
                                    </h3>
                                    <div className="space-y-4">
                                        {movie.reviews.map((review) => (
                                            <div
                                                key={review.id}
                                                className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-white'
                                                    }`}
                                            >
                                                <div className="mb-2 flex items-center justify-between">
                                                    <span className="font-semibold">{review.userName}</span>
                                                    <div className="flex items-center space-x-2">
                                                        <div className="flex items-center">
                                                            <Star size={16} className="text-yellow-400" fill="currentColor" />
                                                            <span className="ml-1 text-sm">{review.rating}/10</span>
                                                        </div>
                                                        <span className="text-sm text-gray-500">
                                                            {new Date(review.date).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>
                                                {review.comment && (
                                                    <p className="text-sm">{review.comment}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-300'
                                    }`}>
                                    <h3 className="mb-2 text-xl font-semibold">Reseñas</h3>
                                    <p className="text-gray-500">
                                        Esta película aún no tiene reseñas. ¡Sé el primero en valorarla!
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DetallePelicula;