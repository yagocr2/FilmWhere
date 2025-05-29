// components/ReviewModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Search, Star, Send, Film } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';


const ReviewModal = ({ isOpen, onClose, currentMovie }) => {
    const { theme } = useTheme();
    const [step, setStep] = useState(currentMovie ? 'review' : 'search');
    const [selectedMovie, setSelectedMovie] = useState(currentMovie);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const { token } = useAuth();

    // Reset modal state when it opens/closes
    useEffect(() => {
        if (isOpen) {
            if (currentMovie) {
                setSelectedMovie(currentMovie);
                setStep('review');
            } else {
                setSelectedMovie(null);
                setStep('search');
                setSearchQuery('');
                setSearchResults([]);
            }
            setRating(0);
            setHoverRating(0);
            setComment('');
        }
    }, [isOpen, currentMovie]);

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        setLoading(true);
        try {
            const response = await fetch(`/api/pelicula/buscar?query=${encodeURIComponent(searchQuery)}&page=1`);

            const data = await response.json();
            const formattedMovies = data.map(movie => ({
                id: movie.id,
                title: movie.title,
                posterUrl: movie.posterUrl,
                year: movie.year
            }));
            console.log(formattedMovies)
            setSearchResults(formattedMovies || []);
        } catch (error) {
            console.error('Error searching movies:', error);
            setSearchResults([]);
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        console.log('selectedMovie ha cambiado:', selectedMovie);
    }, [selectedMovie]);
    const handleSelectMovie = (movie) => {
        setSelectedMovie(movie);
        setStep('review');
    };

    const handleSubmitReview = async () => {
        if (!selectedMovie || rating === 0) return;

        setSubmitting(true);
        try {
            const reviewData = {
                peliculaId: selectedMovie.id,
                calificacion: rating,
                comentario: comment.trim() || "",
                tituloPelicula: selectedMovie.title,
            };

            const response = await fetch('/api/reseñas', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(reviewData)
            });

            if (response.ok) {
                // Success feedback
                alert('¡Reseña enviada con éxito!');
                onClose();
            } else {
                throw new Error('Error al enviar la reseña');
            }
        } catch (error) {
            console.error('Error submitting review:', error);
            alert('Hubo un error al enviar tu reseña. Por favor, inténtalo de nuevo.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleBackToSearch = () => {
        setSelectedMovie(null);
        setStep('search');
        setRating(0);
        setHoverRating(0);
        setComment('');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className={`relative w-full max-w-3xl max-h-[100vh] m-4 rounded-lg shadow-2xl overflow-hidden ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                }`}>
                {/* Header */}
                <div className={`flex items-center justify-between p-6 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                    }`}>
                    <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {step === 'search'
                            ? 'Buscar Película'
                            : `Escribir Reseña sobre ${selectedMovie?.title || ''}`}
                    </h2>
                    <button
                        onClick={onClose}
                        className={`p-2 rounded-full transition-colors ${theme === 'dark'
                            ? 'hover:bg-gray-700 text-gray-400 hover:text-white'
                            : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-150px)]">
                    {step === 'search' && (
                        <div className="space-y-6">
                            {/* Search Input */}
                            <div className="space-y-4">
                                <div className="flex space-x-2">
                                    <input
                                        type="text"
                                        placeholder="Buscar película por título..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                        className={`flex-1 px-4 py-3 rounded-lg border transition-colors ${theme === 'dark'
                                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500'
                                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                                            } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                                    />
                                    <button
                                        onClick={handleSearch}
                                        disabled={loading || !searchQuery.trim()}
                                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {loading ? (
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <Search size={20} />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Search Results */}
                            {searchResults.length > 0 && (
                                <div className="space-y-4">
                                    <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                                        }`}>
                                        Resultados de búsqueda
                                    </h3>
                                    <div className="space-y-2 max-h-96 overflow-y-auto">
                                        {searchResults.map((movie) => (
                                            <div
                                                key={movie.id}
                                                onClick={() => handleSelectMovie(movie)}
                                                className={`flex items-center space-x-4 p-3 rounded-lg cursor-pointer transition-colors ${theme === 'dark'
                                                    ? 'hover:bg-gray-700 border border-gray-700'
                                                    : 'hover:bg-gray-50 border border-gray-200'
                                                    }`}
                                            >
                                                <img
                                                    src={movie.posterUrl || '/placeholder-movie.jpg'}
                                                    alt={movie.title}
                                                    className="w-12 h-16 object-cover rounded"
                                                    onError={(e) => {
                                                        e.target.src = '/placeholder-movie.jpg';
                                                    }}
                                                />
                                                <div className="flex-1">
                                                    <h4 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                                                        }`}>
                                                        {movie.title}
                                                    </h4>
                                                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                                        }`}>
                                                        {movie.year}
                                                    </p>
                                                </div>
                                                <Film size={20} className="text-blue-500" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {searchQuery && searchResults.length === 0 && !loading && (
                                <div className="text-center py-8">
                                    <Film size={48} className={`mx-auto mb-4 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                                        }`} />
                                    <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                        }`}>
                                        No se encontraron películas con ese título
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 'review' && selectedMovie && (
                        <div className="space-y-6">
                            {/* Selected Movie Info */}
                            <div className={`flex items-center space-x-4 p-4 rounded-lg border ${theme === 'dark' ? 'border-gray-700 bg-gray-700/50' : 'border-gray-200 bg-gray-50'
                                }`}>
                                <img
                                    src={selectedMovie.posterUrl || '/placeholder-movie.jpg'}
                                    alt={selectedMovie.title}
                                    className="w-16 h-20 object-cover rounded"
                                    onError={(e) => {
                                        e.target.src = '/placeholder-movie.jpg';
                                    }}
                                />
                                <div className="flex-1">
                                    <h3 className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                                        }`}>
                                        {selectedMovie.title}
                                    </h3>
                                    <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                        }`}>
                                        {selectedMovie.year}
                                    </p>
                                </div>
                                {!currentMovie && (
                                    <button
                                        onClick={handleBackToSearch}
                                        className={`px-3 py-1 text-sm rounded transition-colors ${theme === 'dark'
                                            ? 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                            }`}
                                    >
                                        Cambiar
                                    </button>
                                )}
                            </div>

                            {/* Rating */}
                            <div className="space-y-2">
                                <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                                    }`}>
                                    Calificación *
                                </label>
                                <div className="flex items-center space-x-2">
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                                        <button
                                            key={star}
                                            onClick={() => setRating(star)}
                                            onMouseEnter={() => setHoverRating(star)}
                                            onMouseLeave={() => setHoverRating(0)}
                                            className="transition-transform hover:scale-110"
                                        >
                                            <Star
                                                size={21}
                                                className={`${star <= (hoverRating || rating)
                                                    ? 'text-yellow-400 fill-current'
                                                    : theme === 'dark'
                                                        ? 'text-gray-600'
                                                        : 'text-gray-300'
                                                    }`}
                                            />
                                        </button>
                                    ))}
                                    <span className={`ml-4 text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                                        }`}>
                                        {hoverRating || rating}/10
                                    </span>
                                </div>
                            </div>

                            {/* Comment */}
                            <div className="space-y-2">
                                <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                                    }`}>
                                    Comentario (opcional)
                                </label>
                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="Comparte tu opinión sobre esta película..."
                                    rows={4}
                                    className={`w-full px-4 py-3 rounded-lg border transition-colors resize-none ${theme === 'dark'
                                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500'
                                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                                        } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                                    maxLength={500}
                                />
                                <div className={`text-sm text-right ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                    }`}>
                                    {comment.length}/500
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                onClick={handleSubmitReview}
                                disabled={rating === 0 || submitting}
                                className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                            >
                                {submitting ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Send size={20} />
                                        <span className="font-medium">Enviar Reseña</span>
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReviewModal;