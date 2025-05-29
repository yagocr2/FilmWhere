// components/ReviewButton.jsx
import React, { useState } from 'react';
import { MessageSquarePlus, Star } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import ReviewModal from './ReviewModal';

const ReviewButton = ({ currentMovie = null }) => {
    const { id } = useParams();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { theme } = useTheme();
    currentMovie = id;

    const handleOpenModal = () => {
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    return (
        <>
            {/* Floating Action Button */}
            <button
                onClick={handleOpenModal}
                className={`fixed bottom-[90px] right-6 z-50 flex items-center space-x-2 px-4 py-3 rounded-full shadow-lg transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-4 ${theme === 'dark'
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 focus:ring-blue-500/50'
                        : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 focus:ring-blue-400/50'
                    }`}
                title={currentMovie ? `Reseñar "${currentMovie.title}"` : "Escribir Reseña"}
            >
                <MessageSquarePlus size={20} />
                <span className="hidden sm:inline font-medium">
                    {currentMovie ? 'Reseñar' : 'Nueva Reseña'}
                </span>
            </button>

            {/* Review Modal */}
            <ReviewModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                currentMovie={currentMovie}
            />
        </>
    );
};

export default ReviewButton;