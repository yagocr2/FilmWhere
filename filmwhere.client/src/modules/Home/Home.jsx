// components/Home.jsx
import { useEffect, useState } from "react";
import ScrollVelocity from "../../TextAnimations/ScrollVelocity/ScrollVelocity";
import Liquid from "../../Backgrounds/LiquidChrome/LiquidChrome.jsx";
import Layout from "../../components/Layout";
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
                const res = await fetch("/api/PopularMovies?page=1&cantidad=28");
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();
                console.log("Datos de la API:", data); // <- Ver esto en consola
                // Data viene como array de { id, title, posterUrl, year }
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
    console.log(movies)
    // Mientras carga o hay error
    if (loading) return <FadeContent><Layout>Loading…</Layout></FadeContent>;
    if (error) return <FadeContent><Layout>{error}</Layout></FadeContent>;

    return (
        <FadeContent>
            <Layout>
                <div className="fixed inset-0 z-0 blur-[1.8px] blur-black">
                    <GridMotion items={movies} gradientColor={"var(--color-primario)"} />
                </div>

                <div className="-translate-x-1/2 -translate-y-1/2 absolute left-1/2 top-1/2 w-full">
                    <ScrollVelocity
                        className="text-shadow text-7xl font-extrabold text-center text-texto-dark"
                        texts={['Bienvenido a', 'FilmWhere']}
                        velocity={20}
                        parallaxClassName="w-full"
                        scrollerStyle={{
                            textShadow: "0 2px 10px rgba(0,0,0,0.8), 0 2px 20px rgba(0,0,0,0.7)"
                        }}
                    />
                    <div className="flex flex-col items-center space-y-4">
                        <div className="backdrop-blur-sm bg-black/50 px-4 py-2 rounded-lg inline-block mt-8">
                            <p className="text-shadow text-2xl font-extrabold text-center text-texto-dark">
                                Explora y descubre nuevas películas
                            </p>
                        </div>
                        <button className="text-2xl font-extrabold py-3 px-5 rounded-lg transition-all duration-300 
            text-texto bg-primario 
            hover:bg-primario-dark hover:text-texto-dark 

            dark:text-texto-dark dark:bg-primario-dark 
            dark:hover:bg-primario dark:hover:text-texto 
            hover:shadow-lg transform hover:scale-105">
                            Entrar sin cuenta
                        </button>

                    </div>
                    <div className="flex flex-row items-center justify-center space-x-4 mt-5">
                        <Link to="/register">
                            <button className="text-2xl font-extrabold p-3 rounded-lg transition-all duration-300 
            text-texto-dark bg-primario-dark 
            hover:bg-primario hover:text-texto hover:scale-105 

            dark:text-texto dark:bg-primario 
            dark:hover:bg-primario-dark dark:hover:text-texto-dark
            shadow-md hover:shadow-lg">
                                Crear Cuenta
                            </button>
                        </Link>

                        <Link to="/login">
                            <button className="text-2xl font-extrabold p-3 rounded-lg transition-all duration-300 
            text-texto-dark bg-primario-dark 
            hover:bg-primario hover:text-texto hover:scale-105
            
            dark:text-texto dark:bg-primario 
            dark:hover:bg-primario-dark dark:hover:text-texto-dark
            shadow-md hover:shadow-lg">
                                Iniciar Sesión
                            </button>
                        </Link>
                    </div>
                </div>

            </Layout>
        </FadeContent>
    );
};
export default Home;