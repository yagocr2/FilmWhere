// components/MovieCard.jsx
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

const CardPelicula = ({ movie, viewMode = 'grid' }) => {
    const { theme } = useTheme();
    const { user } = useAuth();

    const moviePath = user ? `/pelicula/${movie.id}` : `/pelicula-publica/${movie.id}`;

    const handleImageError = (e) => {
        e.target.onerror = null;
        e.target.src = '/placeholder-movie.jpg';
    };

    if (viewMode === 'list') {
        return (
            <Link to={moviePath}>
                <div className={`${theme === 'dark'
                    ? 'bg-gray-800 border-gray-700'
                    : 'bg-gray-200 border-gray-200'
                    } p-4 rounded-lg mb-1 border transition-all duration-300 hover:shadow-lg cursor-pointer hover:scale-[1.02]`}
                >
                    <div className="flex space-x-4">
                        <div className="h-36 w-24 flex-shrink-0">
                            <img
                                src={movie.posterUrl}
                                alt={movie.title}
                                className="h-full w-full rounded-md object-cover"
                                onError={handleImageError}
                            />
                        </div>
                        <div className="flex-1">
                            <h3 className={`text-lg font-bold mb-2 ${theme === 'dark' ? 'text-texto-dark' : 'text-texto'
                                }`}>
                                {movie.title}
                            </h3>
                            <p className={`text-sm mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                                }`}>
                                Año: {movie.year || 'N/A'}
                            </p>
                            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                }`}>
                                Sinopsis: {movie.overview || 'N/A'}
                            </p>
                        </div>
                    </div>
                </div>
            </Link>
        );
    }

    return (
        <div className="w-full transform cursor-pointer transition-transform duration-300 hover:scale-105">
            <Link to={moviePath}>
                <div className="relative h-64 overflow-hidden rounded-lg shadow-lg md:h-80">
                    <img
                        src={movie.posterUrl}
                        alt={movie.title}
                        className="h-full w-full object-cover"
                        onError={handleImageError}
                    />
                    <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 to-transparent p-3 opacity-0 transition-opacity duration-300 hover:opacity-100">
                        <p className="mb-1 line-clamp-2 text-sm font-bold text-white">
                            {movie.title}
                        </p>
                        {movie.year && (
                            <p className="text-xs text-white">{movie.year}</p>
                        )}
                    </div>
                </div>
            </Link>
        </div>
    );
};

export default CardPelicula;