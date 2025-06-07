// components/Home.jsx
import { useEffect, useState } from "react";
import ScrollVelocity from "../../TextAnimations/ScrollVelocity/ScrollVelocity";
import Liquid from "../../Backgrounds/LiquidChrome/LiquidChrome.jsx";
import GridMotion from "../../Backgrounds/GridMotion/GridMotion"
import FadeContent from '../../Animations/FadeContent/FadeContent'
import { Link } from 'react-router-dom';



const Home = () => {
    // Estado para almacenar las películas
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPopular = async () => {
            try {
                const res = await fetch("/api/pelicula/populares?page=1&cantidad=28");
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();
                const items = data.map(m => m.posterUrl);
                setMovies(items);
            } catch (err) {
                console.error(err);
                setError("No se pudieron cargar las películas.");
            } finally {
                setLoading(false);
            }
        };
        fetchPopular();
    }, []);
    
    // Mientras carga o hay error
    if (loading) return <FadeContent>Loading…</FadeContent>;
    if (error) return <FadeContent>{error}</FadeContent>;

    return (
        <FadeContent>
                <div className="blur-black fixed inset-0 z-0 blur-[1.8px]">
                    <GridMotion items={movies} gradientColor={"var(--color-primario)"} />
                </div>

                <div className="-translate-x-1/2 -translate-y-1/2 absolute left-1/2 top-1/2 w-full">
                    <ScrollVelocity
                        className="text-shadow text-texto-dark text-center text-7xl font-extrabold"
                        texts={['Bienvenido a', 'FilmWhere']}
                        velocity={20}
                        parallaxClassName="w-full"
                        scrollerStyle={{
                            textShadow: "0 2px 10px rgba(0,0,0,0.8), 0 2px 20px rgba(0,0,0,0.7)"
                        }}
                    />
                    <div className="flex flex-col items-center space-y-4">
                        <div className="mt-8 inline-block rounded-lg bg-black/50 px-4 py-2 backdrop-blur-sm">
                            <p className="text-shadow text-texto-dark text-center text-2xl font-extrabold">
                                Explora y descubre nuevas películas
                            </p>
                        </div>
                        <Link to="/inicio-publico">
                        <button className="bg-primario text-texto transform rounded-lg px-5
            py-3 text-2xl font-extrabold transition-all
            duration-300 hover:bg-primario-dark

            hover:text-texto-dark hover:shadow-lg hover:scale-105 dark:text-texto-dark dark:bg-primario-dark dark:hover:bg-primario dark:hover:text-texto">
                            Entrar sin cuenta
                        </button>
                        </Link>

                    </div>
                    <div className="mt-5 flex flex-row items-center justify-center space-x-4">
                        <Link to="/register">
                            <button className="bg-primario-dark text-texto-dark rounded-lg p-3
            text-2xl font-extrabold shadow-md transition-all
            duration-300 hover:bg-primario hover:text-texto

            hover:scale-105 hover:shadow-lg dark:text-texto dark:bg-primario dark:hover:bg-primario-dark dark:hover:text-texto-dark">
                                Crear Cuenta
                            </button>
                        </Link>

                        <Link to="/login">
                            <button className="bg-primario-dark text-texto-dark rounded-lg p-3
            text-2xl font-extrabold shadow-md transition-all
            duration-300 hover:bg-primario hover:text-texto
            
            hover:scale-105 hover:shadow-lg dark:text-texto dark:bg-primario dark:hover:bg-primario-dark dark:hover:text-texto-dark">
                                Iniciar Sesión
                            </button>
                        </Link>
                    </div>
                </div>
        </FadeContent>
    );
};
export default Home;