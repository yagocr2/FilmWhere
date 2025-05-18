import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Star, PlayCircle, Calendar, Clock, Users } from 'lucide-react';

// Componente para la vista detallada de una pel�cula
const DetallePelicula = () => {
    const { id } = useParams(); // Obtenemos el ID de la pel�cula desde la URL
    const [movie, setMovie] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Función para obtener los datos de la pel�cula
        const fetchMovieData = async () => {
            try {
                setLoading(true);
                // Aquí deberías reemplazar esto con tu API real
                const response = await fetch(`/api/pelicula/${id}`);
                if (!response.ok) {
                    throw new Error('No se pudo obtener la información de la película');
                }
                const data = await response.json();
                setMovie(data);
                console.log(data);

            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchMovieData();
    }, [id]);

    // Icono para cada plataforma
    const getPlatformIcon = (platformName) => {
        const platformIcons = {
            'Netflix': '/assets/platforms/netflix.png',
            'Amazon Prime': '/assets/platforms/prime.png',
            'Disney+': '/assets/platforms/disney.png',
            'HBO Max': '/assets/platforms/hbo.png',
            'Movistar+': '/assets/platforms/movistar.png',
            'Apple TV+': '/assets/platforms/appletv.png',
            // A�ade m�s plataformas seg�n necesites
        };

        return platformIcons[platformName] || '/assets/platforms/default.png';
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="rounded-lg bg-red-100 p-4 text-center text-red-500">
                    {error}
                </div>
            </div>
        );
    }

    // Datos de ejemplo para visualización (reemplazar con datos reales)
    const exampleMovie = movie || {
        id: 1,
        titulo: "Origen",
        titulo_original: "Inception",
        imagen: "/assets/movies/inception.jpg",
        portada: "/assets/covers/inception-cover.jpg",
        ano: 2010,
        director: "Christopher Nolan",
        generos: ["Ciencia ficci�n", "Acci�n", "Thriller"],
        duracion: 148,
        sinopsis: "Dom Cobb es un ladr�n con una extra�a habilidad para entrar a los sue�os de la gente y robarles los secretos de sus subconscientes. Su habilidad lo ha vuelto muy popular en el mundo del espionaje corporativo, pero ha tenido un gran costo en la gente que ama.",
        calificacion: 8.8,
        plataformas: [
            { nombre: "Netflix", url: "https://www.netflix.com/title/70131314" },
            { nombre: "HBO Max", url: "https://www.hbomax.com/inception" },
            { nombre: "Amazon Prime", url: "https://www.primevideo.com/inception" }
        ],
        reparto: ["Leonardo DiCaprio", "Joseph Gordon-Levitt", "Ellen Page", "Tom Hardy", "Ken Watanabe"]
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            {/* Portada de la pel�cula */}
            <div className="relative h-64 w-full md:h-96">
                <div className="absolute inset-0 z-10 bg-gradient-to-t from-gray-900 to-transparent"></div>
                <img
                    src={exampleMovie.portada}
                    alt={`Portada de ${exampleMovie.titulo}`}
                    className="h-full w-full object-cover"
                />
            </div>

            <div className="container relative z-20 mx-auto -mt-16 px-4 py-8">
                <div className="flex flex-col gap-8 md:flex-row">
                    {/* Poster de la pel�cula */}
                    <div className="flex-shrink-0">
                        <img
                            src={exampleMovie.imagen}
                            alt={exampleMovie.titulo}
                            className="h-72 w-48 rounded-lg object-cover shadow-lg"
                        />
                    </div>

                    {/* Informaci�n de la pel�cula */}
                    <div className="flex-grow">
                        <h1 className="mb-2 text-3xl font-bold md:text-4xl">{exampleMovie.titulo}</h1>
                        <p className="mb-4 text-gray-400">{exampleMovie.titulo_original} ({exampleMovie.ano})</p>

                        <div className="mb-4 flex items-center">
                            <Star className="mr-1 text-yellow-400" />
                            <span className="mr-4 font-semibold">{exampleMovie.calificacion}/10</span>
                            <span className="mr-4 flex items-center">
                                <Calendar className="mr-1 text-gray-400" />
                                <span>{exampleMovie.ano}</span>
                            </span>
                            <span className="mr-4 flex items-center">
                                <Clock className="mr-1 text-gray-400" />
                                <span>{exampleMovie.duracion} min</span>
                            </span>
                        </div>

                        <div className="mb-4">
                            {exampleMovie.generos.map((genero, index) => (
                                <span
                                    key={index}
                                    className="mb-2 mr-2 inline-block rounded-full bg-gray-800 px-3 py-1 text-sm"
                                >
                                    {genero}
                                </span>
                            ))}
                        </div>

                        <p className="mb-6 text-gray-300">{exampleMovie.sinopsis}</p>

                        <div className="mb-4">
                            <h3 className="mb-2 text-xl font-semibold">Director</h3>
                            <p>{exampleMovie.director}</p>
                        </div>

                        <div className="mb-6">
                            <h3 className="mb-2 text-xl font-semibold">Reparto principal</h3>
                            <div className="flex flex-wrap">
                                {exampleMovie.reparto.map((actor, index) => (
                                    <span
                                        key={index}
                                        className="mb-2 mr-2 flex items-center rounded-full bg-gray-800 px-3 py-1 text-sm"
                                    >
                                        <Users className="mr-1 h-4 w-4" />
                                        {actor}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Secci�n de plataformas */}
                <div className="mt-8 rounded-lg bg-gray-800 p-6">
                    <h2 className="mb-4 flex items-center text-2xl font-bold">
                        <PlayCircle className="mr-2" />
                        D�nde ver
                    </h2>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                        {exampleMovie.plataformas.map((plataforma, index) => (
                            <a
                                key={index}
                                href={plataforma.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center rounded-lg bg-gray-700 p-4 transition-colors hover:bg-gray-600"
                            >
                                <img
                                    src={getPlatformIcon(plataforma.nombre)}
                                    alt={plataforma.nombre}
                                    className="mr-3 h-8 w-8"
                                />
                                <span>{plataforma.nombre}</span>
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DetallePelicula;