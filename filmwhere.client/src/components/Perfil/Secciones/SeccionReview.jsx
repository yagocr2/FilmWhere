// components/ReviewsTab.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Star, Trash2, Pencil } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';


const EmptyState = ({ icon: Icon, title, subtitle }) => (
    <div className="py-8 text-center">
        <Icon size={48} className="mx-auto mb-4 opacity-50" />
        <p className="mb-2 text-lg">{title}</p>
        <p className="opacity-70">{subtitle}</p>
    </div>
);

const StarRating = ({ rating, theme }) => {
    return (
        <div className="mt-1 flex items-center space-x-1">
            {Array.from({ length: 10 }, (_, i) => (
                <Star
                    key={i}
                    size={16}
                    className={`${i < rating
                        ? `text-yellow-400 fill-current ${theme === 'dark' ? '' : 'stroke-black stroke-1'}`
                        : theme === 'dark' ? 'text-gray-400' : 'text-gray-700'
                        } `}

                />
            ))}
            <span className="ml-2 font-semibold">{rating}/10</span>
        </div>
    );
};


const ReviewCard = ({ review, onDelete, onEdit, theme, buildTmdbImageUrl, idToken, currentUserId }) => {
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

    };
    const handleEdit = () => {
        // Formatear los datos de la película para el modal
        const movieData = {
            id: review.peliculaId,
            title: review.pelicula?.titulo || 'Película no encontrada',
            posterUrl: buildTmdbImageUrl(review.pelicula?.posterUrl),
            year: review.pelicula?.year || new Date().getFullYear() // Fallback si no hay año
        };

        onEdit(movieData);
    };

    return (
        <div className={`rounded-lg px-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-300'}`}>
            <div className="flex items-start justify-between gap-10">
                <div className="flex w-full items-center space-x-4 py-3">
                    <img
                        src={buildTmdbImageUrl(review.pelicula?.posterUrl)}
                        alt={review.pelicula?.titulo}
                        className="h-32 select-none rounded object-cover"
                        onError={(e) => {
                            e.target.src = '/placeholder-movie.jpg';
                        }}
                        draggable="false"
                    />
                    <div className="flex w-full flex-col">
                        <Link
                            to={`/pelicula/${review.peliculaId}`}
                            className="text-lg font-bold hover:underline"
                        >
                            {review.pelicula?.titulo || 'Película no encontrada'}
                        </Link>
                        <StarRating rating={review.calificacion} theme={theme} />
                        <p className="text-sm italic opacity-70">
                            {formatDate(review.fecha)}
                        </p>
                        {review.comentario && (
                            <div className={`px-2 pt-3 pb-3 mt-4 rounded-lg  ${theme === 'dark' ? 'bg-primario-dark' : 'bg-primario'}`}>
                                <p className="leading-relaxed">{review.comentario}</p>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-3 space-x-2 py-4">
                    {(currentUserId === idToken) ?
                        <>
                    <button
                        onClick={() => onEdit(handleEdit)}
                        className="text-blue-500 hover:bg-blue-500/10 rounded-full transition-colors"
                        title="Editar reseña"
                    >
                        <Pencil size={16} />
                    </button>
                    <button
                        onClick={() => onDelete(review.id)}
                        className="text-red-500 hover:bg-red-500/10 rounded-full transition-color "
                        title="Eliminar reseña"
                    >
                        <Trash2 size={16} />
                    </button>
                        </>
                            :
                    null
                    }
                </div>

            </div>
        </div>
    );
};

const ReviewsTab = ({ userReviews, loading, error, onDeleteReview, onEditReview, buildTmdbImageUrl, idToken, currentUserId }) => {
    const { theme } = useTheme();
    if (loading) {
        return <div className="py-8 text-center">Cargando reseñas...</div>;
    }

    if (error) {
        return <div className="py-8 text-center text-red-500">{error}</div>;
    }

    if (userReviews.length === 0) {
        return (
            <EmptyState
                icon={MessageSquare}
                title="No has escrito ninguna reseña aún"
                subtitle="¡Empieza a compartir tus opiniones sobre películas!"
            />
        );
    }

    return (
        <div className="space-y-4">
            {userReviews.map((review) => (
                <ReviewCard
                    key={review.id}
                    review={review}
                    onDelete={onDeleteReview}
                    onEdit={onEditReview}
                    theme={theme}
                    buildTmdbImageUrl={buildTmdbImageUrl}
                    idToken={idToken}
                    currentUserId={currentUserId}
                />
            ))}
        </div>
    );
};

export default ReviewsTab;