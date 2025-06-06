import React from 'react';
import { Star } from 'lucide-react';

const PosterPelicula = ({ movie }) => {
    return (
        <div className="mx-auto flex-shrink-0 md:mx-0">
            <div className="relative">
                <img
                    src={movie.posterUrl}
                    alt={movie.title}
                    className="h-96 w-64 select-none rounded-lg object-cover shadow-2xl"
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
    );
};

export default PosterPelicula;