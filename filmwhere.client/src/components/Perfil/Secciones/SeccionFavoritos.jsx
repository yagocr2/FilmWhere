// components/FavoritesTab.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';

const EmptyState = ({ icon: Icon, title, subtitle }) => (
    <div className="py-8 text-center">
        <Icon size={48} className="mx-auto mb-4 opacity-50" />
        <p className="mb-2 text-lg">{title}</p>
        <p className="opacity-70">{subtitle}</p>
    </div>
);

const MovieCard = ({ movie, onRemoveFromFavorites, buildTmdbImageUrl, currentUserId, idToken }) => (
    <div key={movie.id} className="group relative">
        <Link to={`/pelicula/${movie.id}`}>
            <div className="relative transform overflow-hidden rounded-lg shadow-lg transition-transform duration-300 hover:scale-105">
                <img
                    src={buildTmdbImageUrl(movie.posterUrl)}
                    alt={movie.title}
                    className="h-64 w-full object-cover"
                    onError={(e) => {
                        e.target.src = '/placeholder-movie.jpg';
                    }}
                />
                <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 to-transparent p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <p className="truncate text-sm font-bold text-white">{movie.title}</p>
                    {movie.year && <p className="text-xs text-white">{movie.year}</p>}
                </div>
            </div>
        </Link>
        {currentUserId === idToken ? (
            <>
                <button
                    onClick={() => onRemoveFromFavorites(movie.id)}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-red-600"
                    title="Eliminar de favoritos"
                >
                    <Heart size={16} fill="currentColor" />
                </button>
            </>
        ) : null
        }
    </div>
);

const FavoritesTab = ({ favoriteMovies, loading, error, onRemoveFromFavorites, buildTmdbImageUrl, idToken, currentUserId }) => {
    const { theme } = useTheme();
    console.log('Favoritos', favoriteMovies)

    if (loading) {
        return <div className="py-8 text-center">Cargando favoritos...</div>;
    }

    if (error) {
        return <div className="py-8 text-center text-red-500">{error}</div>;
    }

    if (favoriteMovies.length === 0) {
        return (
            <EmptyState
                icon={Heart}
                title="No tienes películas favoritas aún"
                subtitle="¡Explora y agrega películas a tus favoritos!"
            />
        );
    }

    return (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
            {favoriteMovies.map((movie) => (
                <MovieCard
                    key={movie.id}
                    movie={movie}
                    onRemoveFromFavorites={onRemoveFromFavorites}
                    buildTmdbImageUrl={buildTmdbImageUrl}
                    idToken={idToken}
                    currentUserId={currentUserId}

                />
            ))}
        </div>
    );
};

export default FavoritesTab;