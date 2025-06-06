// components/FeaturedBanner.jsx
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

const BannerPelicula = ({ movie }) => {
    const { theme } = useTheme();
    const { user } = useAuth();

    if (!movie) return null;

    const moviePath = user ? `/pelicula/${movie.id}` : `/pelicula-publica/${movie.id}`;

    return (
        <div className="relative mb-10 h-64 overflow-hidden rounded-xl md:h-96">
            <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                    backgroundImage: `url(${movie.posterUrl})`,
                    filter: 'blur(2px)'
                }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent"></div>
            <div className="absolute inset-0 flex flex-col justify-center p-8">
                <h2 className="text-shadow text-texto-dark mb-4 text-4xl font-bold md:text-5xl">
                    {movie.title}
                </h2>
                <p className="text-shadow text-texto-dark mb-6 max-w-lg text-xl md:text-2xl">
                    Película destacada de la semana
                </p>
                <Link
                    to={moviePath}
                    className={`inline-block ${theme === 'dark'
                        ? 'bg-primario-dark text-texto-dark hover:bg-primario hover:text-texto'
                        : 'bg-primario text-texto hover:bg-primario-dark hover:text-texto-dark'
                        } py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 text-lg font-bold w-40`}
                >
                    Ver Detalles
                </Link>
            </div>
        </div>
    );
};

export default BannerPelicula;