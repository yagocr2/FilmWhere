// modules/Inicio/Inicio.jsx - Versión refactorizada
import FadeContent from '../../Animations/FadeContent/FadeContent';
import { useTheme } from '../../context/ThemeContext';
import { LiquidChrome } from '../../Backgrounds/LiquidChrome/LiquidChrome';
import { usePeliculas } from '../../hooks/usePeliculas';
import MovieSlider from '../../components/Inicio/MovieSlider';
import FeaturedBanner from '../../components/Inicio/BannerPelicula';

const Inicio = () => {
    const { theme } = useTheme();
    const { movies, loading, error } = usePeliculas();

    // Configuración de secciones de películas
    const movieSections = [
        { key: 'popular', title: 'Películas Populares' },
        { key: 'action', title: 'Acción y Aventura' },
        { key: 'fantasia', title: 'Fantasia' },
        { key: 'animacion', title: 'Animación' },
        { key: 'horror', title: 'Terror y Suspense' },
        { key: 'newReleases', title: 'Estrenos' },
        { key: 'topRated', title: 'Mejor Valoradas' }
    ];

    return (
        <FadeContent>
            <div className="fixed inset-0 z-0">
                <LiquidChrome
                    baseColor={theme === 'dark' ? [0.1, 0, 0.2] : [0.9, 0.8, 1]}
                    amplitude={0.5}
                    speed={0.06}
                    frequencyX={3}
                    frequencyY={2}
                    interactive={false}
                />
            </div>

            <div className={`container mx-auto px-4 py-8 relative z-10 ${theme === 'dark' ? 'text-texto-dark' : 'text-texto'} relative inset-1 z-1`}>
                {/* Header */}
                <div className="mb-8">
                    <h1 className="mb-2 text-4xl font-bold">Explora FilmWhere</h1>
                    <p className="text-lg opacity-80">Descubre películas por categorías y encuentra dónde verlas</p>
                </div>

                {/* Featured Banner */}
                <FeaturedBanner
                    movie={!loading.popular && movies.popular.length > 0 ? movies.popular[0] : null}
                />

                {/* Movie Sections */}
                {movieSections.map(({ key, title }) => (
                    <MovieSlider
                        key={key}
                        title={title}
                        movies={movies[key]}
                        loading={loading[key]}
                        error={error[key]}
                    />
                ))}
            </div>
        </FadeContent>
    );
};

export default Inicio;