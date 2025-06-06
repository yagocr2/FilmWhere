
import { useEffect } from "react";

import { useParams, useNavigate } from 'react-router-dom';
import { PlayCircle, Popcorn } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

import LoadingSpinner from '../../components/LoadingSpinner';
import MensajeError from '../../components/MensajeError';
import HeaderPelicula from '../../components/DetallesPelicula/HeaderPelicula';
import PosterPelicula from '../../components/DetallesPelicula/PosterPelicula';
import InfoPelicula from '../../components/DetallesPelicula/InfoPelicula';
import SeccionPelicula from '../../components/DetallesPelicula/SeccionPelicula';
import ListaPlataformas from '../../components/DetallesPelicula/ListaPlataformas';
import ListaReviews from '../../components/DetallesPelicula/ListaReviews';

// Hooks personalizados
import { usePeliculaFavorita } from '../../hooks/usePeliculaFavorita';
import { useDatosPelicula } from '../../hooks/useDatosPelicula';

const DetallePelicula = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { theme } = useTheme();
    const { token } = useAuth();

    const {
        isFavorite,
        checkingFavorite,
        loadingF,
        checkIfFavorite,
        toggleFavorite
    } = usePeliculaFavorita(token);

    const { movie, loading, error } = useDatosPelicula(id, token, checkIfFavorite);
    useEffect(() => {
        if (movie && movie.id) {
            checkIfFavorite(movie.id);
        }
    }, [movie, checkIfFavorite]);
    const handleGoBack = () => navigate(-1);
    const handleRetry = () => window.location.reload();
    const handleToggleFavorite = () => toggleFavorite(movie.id);

    // Estados de carga
    if (loading) {
        return <LoadingSpinner message="Cargando información de la película..." />;
    }

    if (error) {
        return (
            <MensajeError
                error={error}
                onGoBack={handleGoBack}
                onRetry={handleRetry}
            />
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
            {/* Header */}
            <HeaderPelicula
                onGoBack={handleGoBack}
                onToggleFavorite={handleToggleFavorite}
                isFavorite={isFavorite}
                checkingFavorite={checkingFavorite}
                showFavoriteButton={!!token}
                loadingHeart={loadingF}
            />

            {/* Contenido principal */}
            <div className="container mx-auto px-4 py-5">
                <div className="flex flex-col gap-8 md:flex-row">
                    {/* Poster */}
                    <PosterPelicula movie={movie} />

                    {/* Información de la película */}
                    <InfoPelicula movie={movie} />
                </div>

                {/* Secciones adicionales */}
                <div className="mt-8 space-y-6">
                    {/* Sinopsis */}
                    {movie.overview && (
                        <SeccionPelicula title="Sinopsis" icon={Popcorn}>
                            <p>{movie.overview}</p>
                        </SeccionPelicula>
                    )}

                    {/* Plataformas */}
                    <SeccionPelicula title="Dónde ver" icon={PlayCircle}>
                        {movie.platforms && movie.platforms.length > 0 ? (
                            <ListaPlataformas platforms={movie.platforms} />
                        ) : (
                            <p className="text-gray-500">
                                Información de plataformas próximamente disponible.
                            </p>
                        )}
                    </SeccionPelicula>

                    {/* Reseñas */}
                    <SeccionPelicula title={`Reseñas ${movie.reviewCount ? `(${movie.reviewCount})` : ''}`}>
                        {movie.reviews && movie.reviews.length > 0 ? (
                            <ListaReviews reviews={movie.reviews} />
                        ) : (
                            <p className="text-gray-500">
                                Esta película aún no tiene reseñas. ¡Sé el primero en valorarla!
                            </p>
                        )}
                    </SeccionPelicula>
                </div>
            </div>
        </div>
    );
};

export default DetallePelicula;