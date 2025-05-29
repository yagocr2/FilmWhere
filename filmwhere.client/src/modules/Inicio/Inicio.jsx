// modules/Inicio/Inicio.jsx
import { useEffect, useState, useRef } from "react";
import Layout from "../../components/Layout";
import FadeContent from '../../Animations/FadeContent/FadeContent';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { LiquidChrome } from '../../Backgrounds/LiquidChrome/LiquidChrome'

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
                <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-texto-dark' : 'text-texto'}`}>{title}</h2>
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
                    // Determinar la ruta según si el usuario está autenticado
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
                                        alt={movie.title || 'Película'}
                                        className="h-full w-full object-cover"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = '/placeholder-movie.jpg'; // Imagen por defecto
                                        }}
                                    />
                                    <div className="bg-gradient-to-t to-transparent absolute inset-0 flex flex-col justify-end from-black/70 p-2 opacity-0 transition-opacity duration-300 hover:opacity-100">
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

const Inicio = () => {
    // Estados para las diferentes categorías
    const [popularMovies, setPopularMovies] = useState([]);
    const [actionMovies, setActionMovies] = useState([]);
    const [horrorMovies, setHorrorMovies] = useState([]);
    const [newReleases, setNewReleases] = useState([]);
    const [topRated, setTopRated] = useState([]);

    const [loading, setLoading] = useState({
        popular: true,
        action: true,
        horror: true,
        newReleases: true,
        topRated: true
    });

    const [error, setError] = useState({
        popular: null,
        action: null,
        horror: null,
        newReleases: null,
        topRated: null
    });

    const { theme } = useTheme();

    // Función genérica para actualizar estados de carga y error
    const updateState = (category, data, err = null) => {
        if (category === 'popular') {
            setPopularMovies(data);
        } else if (category === 'action') {
            setActionMovies(data);
        } else if (category === 'horror') {
            setHorrorMovies(data);
        } else if (category === 'newReleases') {
            setNewReleases(data);
        } else if (category === 'topRated') {
            setTopRated(data);
        }

        setLoading(prev => ({ ...prev, [category]: false }));
        setError(prev => ({ ...prev, [category]: err }));
    };

    // Efecto para cargar películas populares
    useEffect(() => {
        const fetchPopular = async () => {
            try {
                const res = await fetch("/api/pelicula/populares?page=1&cantidad=15");
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();

                // Transformar datos para incluir id y título
                const formattedData = data.map(m => ({
                    id: m.id,
                    title: m.title,
                    posterUrl: m.posterUrl,
                    year: m.year
                }));

                updateState('popular', formattedData);
            } catch (err) {
                console.error("Error loading popular movies:", err);
                updateState('popular', [], "No se pudieron cargar las películas populares.");
            }
        };

        fetchPopular();
    }, []);

    // Efecto para cargar películas de acción (ejemplo, ajustar endpoint según tu API)
    useEffect(() => {
        // Simulación para mostrar películas de acción
        // Reemplazar con tu endpoint real
        const fetchActionMovies = async () => {
            try {
                // Esto es un placeholder. En un escenario real, deberías tener un endpoint específico
                const res = await fetch("/api/pelicula/genero/Acción?page=1&cantidad=15");
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();

                const formattedData = data.map(m => ({
                    id: m.id,
                    title: m.title,
                    posterUrl: m.posterUrl,
                    year: m.year
                }));

                updateState('action', formattedData);
            } catch (err) {
                console.error("Error loading action movies:", err);
                updateState('action', [], "No se pudieron cargar las películas de acción.");
            }
        };

        fetchActionMovies();
    }, []);

    // Efecto para cargar películas de terror
    useEffect(() => {
        // Simulación para mostrar películas de terror
        const fetchHorrorMovies = async () => {
            try {
                // Placeholder - ajustar con tu endpoint real
                const res = await fetch("/api/pelicula/genero/Terror?page=1&cantidad=15");
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();

                const formattedData = data.map(m => ({
                    id: m.id,
                    title: m.title,
                    posterUrl: m.posterUrl,
                    year: m.year
                }));

                updateState('horror', formattedData);
            } catch (err) {
                console.error("Error loading horror movies:", err);
                updateState('horror', [], "No se pudieron cargar las películas de terror.");
            }
        };

        fetchHorrorMovies();
    }, []);
    //ROldan020503*
    // Efecto para cargar películas recién estrenadas
    useEffect(() => {
        const fetchNewReleases = async () => {
            try {
                // Ajustar con el endpoint que devuelva películas por año actual
                const currentYear = new Date().getFullYear();
                const res = await fetch(`/api/pelicula/estrenos?year=${currentYear}&cantidad=15`);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();

                const formattedData = data.map(m => ({
                    id: m.id,
                    title: m.title,
                    posterUrl: m.posterUrl,
                    year: m.year
                }));

                updateState('newReleases', formattedData);
            } catch (err) {
                console.error("Error loading new releases:", err);
                updateState('newReleases', [], "No se pudieron cargar los estrenos.");
            }
        };

        fetchNewReleases();
    }, []);

    // Efecto para cargar películas mejor valoradas
    useEffect(() => {
        const fetchTopRated = async () => {
            try {
                // Este es un placeholder - ajustar según tu API
                const res = await fetch("/api/pelicula/mejor-valoradas?page=1&cantidad=15");
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();

                const formattedData = data.map(m => ({
                    id: m.id,
                    title: m.title,
                    posterUrl: m.posterUrl,
                    year: m.year,
                    rating: m.rating
                }));

                updateState('topRated', formattedData);
            } catch (err) {
                console.error("Error loading top rated movies:", err);
                updateState('topRated', [], "No se pudieron cargar las películas mejor valoradas.");
            }
        };

        fetchTopRated();
    }, []);

    return (
        <FadeContent>
                <div className="fixed inset-0 z-0">
                        <LiquidChrome
                            baseColor={theme === 'dark' ? [0.05, 0.02, 0.15] : [0.9, 0.8, 1]}
                            amplitude={0.3}
                            speed={0.06}
                            interactive={false}
                    />
                </div>
                    <div className={`container mx-auto px-4 py-8 relative z-10 ${theme === 'dark' ? 'text-texto-dark' : 'text-texto'} relative inset-1 z-1`}>
                    <div className="mb-8">
                        <h1 className="mb-2 text-4xl font-bold">Explora FilmWhere</h1>
                        <p className="text-lg opacity-80">Descubre películas por categorías y encuentra dónde verlas</p>
                    </div>

                    {/* Destacados - Banner de la película principal */}
                    {!loading.popular && popularMovies.length > 0 && (
                        <div className="relative mb-10 h-64 overflow-hidden rounded-xl md:h-96">
                            <div
                                className="absolute inset-0 bg-cover bg-center"
                                style={{
                                    backgroundImage: `url(${popularMovies[0].posterUrl})`,
                                    filter: 'blur(2px)'
                                }}
                            ></div>
                            <div className="bg-gradient-to-r to-transparent absolute inset-0 from-black/80 via-black/50"></div>
                            <div className="absolute inset-0 flex flex-col justify-center p-8">
                                <h2 className="text-shadow mb-4 text-4xl font-bold text-texto-dark md:text-5xl">
                                    {popularMovies[0].title}
                                </h2>
                                <p className="text-shadow mb-6 max-w-lg text-xl text-texto-dark md:text-2xl">
                                    Película destacada de la semana
                                </p>
                                <Link
                                    to={`/pelicula/${popularMovies[0].id}`}
                                    className={`inline-block ${theme === 'dark'
                                        ? 'bg-primario-dark text-texto-dark hover:bg-primario hover:text-texto'
                                        : 'bg-primario text-texto hover:bg-primario-dark hover:text-texto-dark'
                                        } py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 text-lg font-bold w-40`}
                                >
                                    Ver Detalles
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* Secciones de películas */}
                    <MovieSlider
                        title="Películas Populares"
                        movies={popularMovies}
                        loading={loading.popular}
                        error={error.popular}
                    />

                    <MovieSlider
                        title="Acción y Aventura"
                        movies={actionMovies}
                        loading={loading.action}
                        error={error.action}
                    />

                    <MovieSlider
                        title="Terror y Suspense"
                        movies={horrorMovies}
                        loading={loading.horror}
                        error={error.horror}
                    />

                    <MovieSlider
                        title="Estrenos"
                        movies={newReleases}
                        loading={loading.newReleases}
                        error={error.newReleases}
                    />

                    <MovieSlider
                        title="Mejor Valoradas"
                        movies={topRated}
                        loading={loading.topRated}
                        error={error.topRated}
                    />
                </div>
        </FadeContent>
    );
};

export default Inicio;