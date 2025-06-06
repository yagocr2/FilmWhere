// components/ReviewButton.jsx
import React, { useState, useEffect } from 'react';
import { MessageSquarePlus } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import ReviewModal from '../ReviewModal';
import { useParams } from 'react-router-dom';

const ReviewButton = ({ currentMovie: propMovie }) => {
    const { id } = useParams();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [movie, setMovie] = useState(propMovie);
    const { theme } = useTheme();

    // Sincronizar movie cuando cambia la prop
    useEffect(() => {
        setMovie(propMovie);
    }, [propMovie]);


    const fetchMovie = async () => {
        if (!id) return null;

        try {
            const response = await fetch(`/api/pelicula/${id}`);
            if (!response.ok) {
                throw response.status === 404
                    ? new Error('Película no encontrada')
                    : new Error(`Error ${response.status}: No se pudo obtener la información`);
            }
            return await response.json();
        } catch (err) {
            console.error('Error fetching movie data:', err);
            return null;
        }
    };

    const handleOpenModal = async () => {
        // Abrir modal inmediatamente
        setIsModalOpen(true);

        // Buscar solo si no tenemos movie y existe ID
        if (!movie && id) {
            const movieData = await fetchMovie();
            setMovie(movieData);
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setMovie(null);
    };

    return (
        <>
            <button
                onClick={handleOpenModal}
                className={`fixed bottom-[90px] right-6 z-50 flex items-center space-x-2 px-4 py-3 rounded-full shadow-lg transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-4 ${theme === 'dark'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 focus:ring-blue-500/50'
                    : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 focus:ring-blue-400/50'
                    }`}
                title={movie ? `Reseñar "${movie.title}"` : "Escribir Reseña"}
            >
                <MessageSquarePlus size={20} />
                <span className="hidden font-medium sm:inline">
                    {movie ? 'Reseñar' : 'Nueva Reseña'}
                </span>
            </button>

            <ReviewModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                currentMovie={movie}
            />
        </>
    );
};

export default ReviewButton;