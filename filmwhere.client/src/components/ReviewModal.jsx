// components/ReviewModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Search, Star, Send, Film, Edit } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useParams } from 'react-router-dom';

const ReviewModal = ({ isOpen, onClose, currentMovie }) => {
    const { id } = useParams();
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
    const [existingReview, setExistingReview] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [checkingExistingReview, setCheckingExistingReview] = useState(false);
    const { token } = useAuth();

    // Reset modal state when movie ID changes (page change)
    useEffect(() => {
        // Reset everything when movie ID changes (navigating to different movie page)
        setSelectedMovie(null);
        setStep('search');
        setSearchQuery('');
        setSearchResults([]);
        setRating(0);
        setHoverRating(0);
        setComment('');
        setExistingReview(null);
        setIsEditing(false);
        setLoading(false);
        setSubmitting(false);
        setCheckingExistingReview(false);
    }, [id]);

    // Set initial state when modal opens
    useEffect(() => {
        if (isOpen) {
            if (currentMovie) {
                setSelectedMovie(currentMovie);
                setStep('review');
                // Check for existing review when we have a current movie
                checkExistingReview(currentMovie.id);
            } else {
                // Only reset search if we don't have a selected movie already
                if (!selectedMovie) {
                    setStep('search');
                }
            }
            // Reset review form fields when modal opens (they'll be set by checkExistingReview if needed)
            if (!currentMovie) {
                setRating(0);
                setHoverRating(0);
                setComment('');
                setExistingReview(null);
                setIsEditing(false);
            }
        }
    }, [isOpen, currentMovie, selectedMovie]);

    // Function to check if user has an existing review for the selected movie
    const checkExistingReview = async (movieId) => {
        if (!movieId || !token) return;

        setCheckingExistingReview(true);
        try {
            const response = await fetch(`/api/reviews/usuario/propia?peliculaId=${movieId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const review = await response.json();
                setExistingReview(review);
                setIsEditing(true);
                setRating(review.calificacion);
                setComment(review.comentario || '');
            } else if (response.status === 404) {
                // No existing review
                setExistingReview(null);
                setIsEditing(false);
                setRating(0);
                setComment('');
            } else {
                console.error('Error checking existing review:', response.status);
            }
        } catch (error) {
            console.error('Error checking existing review:', error);
        } finally {
            setCheckingExistingReview(false);
        }
    };

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
            setSearchResults(formattedMovies || []);
        } catch (error) {
            console.error('Error searching movies:', error);
            setSearchResults([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectMovie = async (movie) => {
        setSelectedMovie(movie);
        setStep('review');
        // Check for existing review when selecting a movie
        await checkExistingReview(movie.id);
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

            let url, method;

            if (isEditing && existingReview) {
                url = `/api/reviews/${existingReview.id}`;
                method = 'PUT';
                delete reviewData.peliculaId;
                delete reviewData.tituloPelicula;
            } else {
                url = '/api/reviews';
                method = 'POST';
            }

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(reviewData)
            });

            if (response.ok) {
                const result = await response.json();
                alert(isEditing ? '¡Reseña actualizada con éxito!' : '¡Reseña enviada con éxito!');
                onClose();
            } else {
                const errorText = await response.text();
                throw new Error(`Error ${response.status}: ${errorText}`);
            }
        } catch (error) {
            console.error('Error submitting review:', error);
            alert(`Hubo un error al ${isEditing ? 'actualizar' : 'enviar'} tu reseña. Por favor, inténtalo de nuevo.`);
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
        setExistingReview(null);
        setIsEditing(false);
    };

    const handleClose = () => {
        setRating(0);
        setHoverRating(0);
        setComment('');
        setSubmitting(false);
        setExistingReview(null);
        setIsEditing(false);
        onClose();
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
                            : isEditing
                                ? `Editar Reseña - ${selectedMovie?.title || ''}`
                                : `Escribir Reseña sobre ${selectedMovie?.title || ''}`}
                    </h2>
                    <button
                        onClick={handleClose}
                        className={`p-2 rounded-full transition-colors ${theme === 'dark'
                            ? 'hover:bg-gray-700 text-gray-400 hover:text-white'
                            : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="max-h-[calc(90vh-150px)] overflow-y-auto p-6">
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
                                        className="rounded-lg bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? (
                                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
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
                                    <div className="max-h-96 space-y-2 overflow-y-auto">
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
                                                    className="h-16 w-12 rounded object-cover"
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
                                <div className="py-8 text-center">
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
                            {/* Loading existing review */}
                            {checkingExistingReview && (
                                <div className={`flex items-center justify-center p-4 rounded-lg border ${theme === 'dark' ? 'border-gray-700 bg-gray-700/30' : 'border-gray-200 bg-gray-50'
                                    }`}>
                                    <div className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                                    <span className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                        Verificando si ya tienes una reseña...
                                    </span>
                                </div>
                            )}

                            {/* Existing review indicator */}
                            {isEditing && existingReview && !checkingExistingReview && (
                                <div className={`flex items-center p-4 rounded-lg border ${theme === 'dark' ? 'border-yellow-600 bg-yellow-900/20' : 'border-yellow-400 bg-yellow-50'
                                    }`}>
                                    <Edit size={20} className="mr-3 text-yellow-500" />
                                    <div className="flex-1">
                                        <p className={`font-medium ${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-800'}`}>
                                            Editando reseña existente
                                        </p>
                                        <p className={`text-sm ${theme === 'dark' ? 'text-yellow-300' : 'text-yellow-700'}`}>
                                            Creada el {new Date(existingReview.fecha).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Selected Movie Info */}
                            <div className={`flex items-center space-x-4 p-4 rounded-lg border ${theme === 'dark' ? 'border-gray-700 bg-gray-700/50' : 'border-gray-200 bg-gray-50'
                                }`}>
                                <img
                                    src={selectedMovie.posterUrl || '/placeholder-movie.jpg'}
                                    alt={selectedMovie.title}
                                    className="h-20 w-16 rounded object-cover"
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
                                disabled={rating === 0 || submitting || checkingExistingReview}
                                className="flex w-full items-center justify-center space-x-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 text-white transition-all duration-200 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting ? (
                                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                ) : (
                                    <>
                                        {isEditing ? <Edit size={20} /> : <Send size={20} />}
                                        <span className="font-medium">
                                            {isEditing ? 'Actualizar Reseña' : 'Enviar Reseña'}
                                        </span>
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