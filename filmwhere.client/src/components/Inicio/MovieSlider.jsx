// components/MovieSlider.jsx
import { useRef } from "react";
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

const MovieSlider = ({ title, movies, loading, error }) => {
    const sliderRef = useRef(null);
    const { theme } = useTheme();
    const { user } = useAuth();

    const scroll = (direction) => {
        if (sliderRef.current) {
            const { current } = sliderRef;
            const scrollAmount = direction === 'left'
                ? -current.offsetWidth * 0.75
                : current.offsetWidth * 0.75;

            current.scrollBy({
                left: scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    if (loading) return <div className="flex h-44 items-center justify-center">Cargando películas...</div>;
    if (error) return <div className="flex h-44 items-center justify-center text-red-500">{error}</div>;
    if (!movies || movies.length === 0) return <div className="flex h-44 items-center justify-center">No hay películas disponibles</div>;

    return (
        <div className="relative my-4 py-4">
            <div className="mb-4 flex items-center justify-between">
                <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-texto-dark' : 'text-texto'}`}>
                    {title}
                </h2>
                <div className="flex space-x-2">
                    <button
                        onClick={() => scroll('left')}
                        className={`p-1 rounded-full ${theme === 'dark'
                            ? 'bg-primario text-texto hover:bg-primario-dark hover:text-texto-dark'
                            : 'bg-primario-dark text-texto-dark hover:bg-primario hover:text-texto'
                            } transition-all duration-300`}
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <button
                        onClick={() => scroll('right')}
                        className={`p-1 rounded-full ${theme === 'dark'
                            ? 'bg-primario text-texto hover:bg-primario-dark hover:text-texto-dark'
                            : 'bg-primario-dark text-texto-dark hover:bg-primario hover:text-texto'
                            } transition-all duration-300`}
                    >
                        <ChevronRight size={24} />
                    </button>
                </div>
            </div>

            <div
                ref={sliderRef}
                className="scrollbar-hide flex space-x-4 overflow-x-auto pb-4"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {movies.map((movie, index) => {
                    const moviePath = user ? `/pelicula/${movie.id}` : `/pelicula-publica/${movie.id}`;

                    return (
                        <div
                            key={index}
                            className="w-36 flex-shrink-0 transform transition-transform duration-300 hover:scale-105 md:w-44"
                        >
                            <Link to={moviePath}>
                                <div className="relative h-56 overflow-hidden rounded-lg shadow-lg md:h-64">
                                    <img
                                        src={movie.posterUrl}
                                        alt={movie.title || 'Pel�cula'}
                                        className="h-full w-full object-cover"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = '/placeholder-movie.jpg';
                                        }}
                                    />
                                    <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 transition-opacity duration-300 hover:opacity-100">
                                        <p className="truncate text-sm font-bold text-white">{movie.title}</p>
                                        {movie.year && <p className="text-xs text-white">{movie.year}</p>}
                                    </div>
                                </div>
                            </Link>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default MovieSlider;