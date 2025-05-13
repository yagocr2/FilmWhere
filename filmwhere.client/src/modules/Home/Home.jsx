// components/Home.jsx
import { useEffect, useState } from "react";
import ScrollVelocity from "../../TextAnimations/ScrollVelocity/ScrollVelocity";
import Liquid from "../../Backgrounds/LiquidChrome/LiquidChrome.jsx";
import Layout from "../../components/Layout";
import GridMotion from "../../Backgrounds/GridMotion/GridMotion"

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
    if (loading) return <Layout>Loading…</Layout>;
    if (error) return <Layout>{error}</Layout>;
    
    return (
        <Layout>
            <div className="fixed inset-0 z-0 blur-[1.8px] blur-black">
                <GridMotion items={movies} gradientColor={"var(--color-primario)"} />
            </div>

            <div className="-translate-x-1/2 -translate-y-1/2 absolute left-1/2 top-1/2 w-full">
                <ScrollVelocity
                    className="text-shadow text-5xl font-bold text-center text-texto dark:text-texto-dark"
                    texts={['Bienvenido a', 'FilmWhere']}
                    velocity={15}
                    parallaxClassName="w-full"
                />
            </div>
        </Layout>
    );
};
export default Home;