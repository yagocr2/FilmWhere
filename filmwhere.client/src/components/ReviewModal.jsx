import React, { useState, useEffect } from 'react';
import { Star, X, Send, Search } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const ReviewModal = ({ isOpen, onClose, preselectedMovie = null }) => {
    const { theme } = useTheme();
    const { user } = useAuth();

    const [selectedMovie, setSelectedMovie] = useState(preselectedMovie);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    // Reset form when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setSelectedMovie(preselectedMovie);
            setSearchTerm('');
            setSearchResults([]);
            setRating(0);
            setHoverRating(0);
            setComment('');
            setError(null);
            setSuccess(false);
        }
    }, [isOpen, preselectedMovie]);

    // Search movies
    const searchMovies = async (term) => {
        if (!term.trim()) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const response = await fetch(`/api/peliculas/buscar?query=${encodeURIComponent(term)}`);
            if (response.ok) {
                const results = await response.json();
                setSearchResults(results);
            }
        } catch (err) {
            console.error('Error searching movies:', err);
        } finally {
            setIsSearching(false);
        }
    };

    // Handle search input change
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchTerm && !preselectedMovie) {
                searchMovies(searchTerm);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchTerm, preselectedMovie]);

    // Submit review
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedMovie) {
            setError('Por favor selecciona una película');
            return;
        }

        if (rating === 0) {
            setError('Por favor califica la película');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const response = await fetch('/api/reseñas', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    peliculaId: selectedMovie.id,
                    calificacion: rating,
                    comentario: comment.trim() || null
                })
            });

            if (response.ok) {
                setSuccess(true);
                setTimeout(() => {
                    onClose();
                }, 1500);
            } else {
                const errorData = await response.json();
                setError(errorData.message || 'Error al enviar la reseña');
            }
        } catch (err) {
            setError('Error de conexión. Inténtalo de nuevo.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const bgClass = theme === 'dark' ? 'bg-primario-dark' : 'bg-white';
    const textClass = theme === 'dark' ? 'text-texto-dark' : 'text-texto';
    const borderClass = theme === 'dark' ? 'border-gray-600' : 'border-gray-300';
    const inputBgClass = theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className={`${bgClass} ${textClass} relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg shadow-xl`}>
                {/* Header */}
                <div className={`sticky top-0 ${bgClass} border-b ${borderClass} px-6 py-4`}>
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold">
                            {preselectedMovie ? 'Reseñar película' : 'Nueva reseña'}
                        </h2>
                        <button
                            onClick={onClose}
                            className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                                }`}
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {success ? (
                        <div className="text-center py-8">
                            <div className="text-green-500 text-6xl mb-4">?</div>
                            <h3 className="text-xl font-semibold mb-2">¡Reseña enviada!</h3>
                            <p className="text-gray-500">Tu reseña ha sido publicada exitosamente.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Movie Selection */}
                            {!preselectedMovie ? (
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Buscar película
                                    </label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                        <input
                                            type="text"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            placeholder="Escribe el nombre de la película..."
                                            className={`w-full pl-10 pr-4 py-3 ${inputBgClass} ${borderClass} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                                        />
                                    </div>

                                    {/* Search Results */}
                                    {searchResults.length > 0 && (
                                        <div className={`mt-2 max-h-48 overflow-y-auto border ${borderClass} rounded-lg`}>
                                            {searchResults.map((movie) => (
                                                <button
                                                    key={movie.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedMovie(movie);
                                                        setSearchTerm(movie.titulo);
                                                        setSearchResults([]);
                                                    }}
                                                    className={`w-full p-3 text-left transition-colors border-b ${borderClass} last:border-b-0 ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                                                        }`}
                                                >
                                                    <div className="flex items-center space-x-3">
                                                        <img
                                                            src={movie.posterUrl}
                                                            alt={movie.titulo}
                                                            className="w-12 h-16 object-cover rounded"
                                                            onError={(e) => {
                                                                e.target.src = '/placeholder-movie.jpg';
                                                            }}
                                                        />
                                                        <div>
                                                            <div className="font-medium">{movie.titulo}</div>
                                                            <div className="text-sm text-gray-500">{movie.año}</div>
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {isSearching && (
                                        <div className="text-center py-4 text-gray-500">
                                            Buscando películas...
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Película seleccionada
                                    </label>
                                    <div className={`p-4 ${inputBgClass} rounded-lg border ${borderClass}`}>
                                        <div className="flex items-center space-x-3">
                                            <img
                                                src={selectedMovie.posterUrl || preselectedMovie.posterUrl}
                                                alt={selectedMovie.titulo || preselectedMovie.title}
                                                className="w-16 h-20 object-cover rounded"
                                                onError={(e) => {
                                                    e.target.src = '/placeholder-movie.jpg';
                                                }}
                                            />
                                            <div>
                                                <div className="font-medium text-lg">
                                                    {selectedMovie.titulo || preselectedMovie.title}
                                                </div>
                                                <div className="text-gray-500">
                                                    {selectedMovie.año || preselectedMovie.year}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Rating */}
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Calificación (obligatorio)
                                </label>
                                <div className="flex items-center space-x-1">
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onMouseEnter={() => setHoverRating(star)}
                                            onMouseLeave={() => setHoverRating(0)}
                                            onClick={() => setRating(star)}
                                            className="p-1 transition-transform hover:scale-110"
                                        >
                                            <Star
                                                size={24}
                                                className={`${star <= (hoverRating || rating)
                                                        ? 'text-yellow-400 fill-current'
                                                        : 'text-gray-400'
                                                    }`}
                                            />
                                        </button>
                                    ))}
                                    <span className="ml-2 text-sm text-gray-500">
                                        {rating > 0 ? `${rating}/10` : 'Sin calificar'}
                                    </span>
                                </div>
                            </div>

                            {/* Comment */}
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Comentario (opcional)
                                </label>
                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="Comparte tu opinión sobre la película..."
                                    rows={4}
                                    maxLength={1000}
                                    className={`w-full px-4 py-3 ${inputBgClass} ${borderClass} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none`}
                                />
                                <div className="text-right text-xs text-gray-500 mt-1">
                                    {comment.length}/1000 caracteres
                                </div>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg">
                                    {error}
                                </div>
                            )}

                            {/* Submit Button */}
                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className={`px-6 py-2 border ${borderClass} rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                                        }`}
                                    disabled={isSubmitting}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !selectedMovie || rating === 0}
                                    className={`px-6 py-2 bg-blue-600 text-white rounded-lg transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2`}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            <span>Enviando...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Send size={16} />
                                            <span>Publicar reseña</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReviewModal;