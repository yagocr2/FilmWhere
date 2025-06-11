import React, { useState, useEffect } from 'react';
import { Star, UserPlus, UserMinus, Flag} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useProfileData } from '../../hooks/useDatosPerfil';

import { Link } from 'react-router-dom';

const ListaReviews = ({ reviews }) => {
    const { theme } = useTheme();
    const { token } = useAuth();
    const [followingStatus, setFollowingStatus] = useState({});
    const [loadingFollow, setLoadingFollow] = useState({});
    const { userProfile } = useProfileData(token);

    // Verificar el estado de seguimiento para cada usuario
    useEffect(() => {
        if (token && reviews.length > 0) {
            checkFollowingStatus();
        }
    }, [reviews, token]);

    const checkFollowingStatus = async () => {
        try {
            const promises = reviews
                .filter(review => review.userId !== userProfile?.id) // No verificar el propio usuario
                .map(async (review) => {
                    const response = await fetch(`/api/Seguidor/is-following/${review.userId}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                        }
                    });
                    if (response.ok) {
                        const data = await response.json();
                        return { userId: review.userId, isFollowing: data.isFollowing };
                    }
                    return { userId: review.userId, isFollowing: false };
                });

            const results = await Promise.all(promises);
            const statusMap = {};
            results.forEach(result => {
                statusMap[result.userId] = result.isFollowing;
            });
            setFollowingStatus(statusMap);
        } catch (error) {
            console.error('Error al verificar estado de seguimiento:', error);
        }
    };
    const handleDenunciar = async (userId) => {
        const response = await fetch(`/api/user/denunciar/${userId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        if (response.ok) {
            alert('Review denunciada');
        } else {
            alert('Error al denunciar la review');
        }
    };
    const handleFollowToggle = async (userId) => {
        if (!token) return;

        setLoadingFollow(prev => ({ ...prev, [userId]: true }));

        try {
            const isCurrentlyFollowing = followingStatus[userId];
            const endpoint = isCurrentlyFollowing
                ? `/api/Seguidor/unfollow/${userId}`
                : `/api/Seguidor/follow/${userId}`;

            const method = isCurrentlyFollowing ? 'DELETE' : 'POST';

            const response = await fetch(endpoint, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                setFollowingStatus(prev => ({
                    ...prev,
                    [userId]: !isCurrentlyFollowing
                }));
            } else {
                const errorData = await response.json();
                console.error('Error al cambiar seguimiento:', errorData);
            }
        } catch (error) {
            console.error('Error al cambiar seguimiento:', error);
        } finally {
            setLoadingFollow(prev => ({ ...prev, [userId]: false }));
        }
    };

    const FollowButton = ({ userId }) => {
        // No mostrar botón para el propio usuario o si no está autenticado
        if (!token || userId === userProfile?.id) { return null; }

        const isFollowing = followingStatus[userId];
        const isLoading = loadingFollow[userId];

        return (
            <button
                onClick={(e) => {
                    e.preventDefault(); // Evitar navegación del Link
                    handleFollowToggle(userId);
                }}
                disabled={isLoading}
                className={`
                    flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium transition-colors
                    ${isFollowing
                        ? `${theme === 'dark' ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'} text-white`
                        : `${theme === 'dark' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white`
                    }
                    ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}
                `}
            >
                {isLoading ? (
                    <div className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
                ) : (
                    <>
                        {isFollowing ? <UserMinus size={12} /> : <UserPlus size={12} />}
                        <span>{isFollowing ? 'Siguiendo' : 'Seguir'}</span>
                    </>
                )}
            </button>
        );
    };
    const DenunciarButton = ({ userId }) => {
        if (userId === userProfile?.id) { return null }
        return (
            <button
                onClick={() => handleDenunciar(userId)}
                className="text-sm font-medium text-red-500 hover:text-red-700"
                title="Denunciar"
            >
                <Flag size={16} />
            </button>
        );
    };

    return (
        <div className="space-y-4">
            {reviews.map((review) => (
                <div
                    key={review.id}
                    className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-white'
                        }`}
                >
                    <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <Link
                                to={`/perfil/${review.userId}`}
                                className="hover:underline"
                            >
                                <span className="font-semibold">{review.userName}</span>
                            </Link>
                            <FollowButton userId={review.userId} userName={review.userName} />
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="flex items-center">
                                <Star size={16} className="text-yellow-400" fill="currentColor" />
                                <span className="ml-1 text-sm">{review.rating}/10</span>
                            </div>
                            <span className="text-sm text-gray-500">
                                {new Date(review.date).toLocaleDateString()}
                            </span>
                            <DenunciarButton userId={review.userId} />
                        </div>
                    </div>
                    {review.comment && (
                        <p className="text-sm">{review.comment}</p>
                    )}
                </div>
            ))}
        </div>
    );
};

export default ListaReviews;