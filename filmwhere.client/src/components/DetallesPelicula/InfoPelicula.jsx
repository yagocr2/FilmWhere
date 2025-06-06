import React from 'react';
import { Calendar, Star, Users } from 'lucide-react';
import { Link, } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
const InfoPelicula = ({ movie }) => {
    const { theme } = useTheme();

    return (
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
                        <span className="font-semibold">{movie.reviewCount} reseñas</span>
                    </span>
                )}
            </div>

            {/* Géneros */}
            {movie.genres && movie.genres.length > 0 && (
                <div className="mb-6">
                    <div className="flex flex-wrap gap-2">
                        {movie.genres.map((genre, index) => (
                            <Link
                                key={index}
                                to={`/buscar?genres=${genre}`}  
                            >
                                <span
                                    className={`px-3 py-1 rounded-full text-sm font-medium ${theme === 'dark'
                                            ? 'bg-primario text-texto hover:bg-primario-dark hover:text-texto-dark transition-colors duration-200 ease-in-out'
                                            : 'bg-primario-dark text-texto-dark hover:bg-primario hover:text-texto transition-colors duration-200 ease-in-out'
                                        }`}
                                >
                                    {genre}
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default InfoPelicula;