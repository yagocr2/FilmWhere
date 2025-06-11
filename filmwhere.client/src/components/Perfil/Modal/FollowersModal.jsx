import { X, User, UserCheck, UserPlus, UserMinus } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../context/AuthContext';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const FollowersModal = ({
    isOpen,
    onClose,
    title,
    users,
    currentUserId,
    onFollowToggle,
    getUserIdFromToken
}) => {
    const { theme } = useTheme();
    const [followingStatus, setFollowingStatus] = useState({});
    const [loadingFollow, setLoadingFollow] = useState({});
    const { token } = useAuth();
    const [currentUserIdFromToken, setCurrentUserIdFromToken] = useState(null);

    // Obtener el ID del usuario actual del token
    useEffect(() => {
        if (token) {
            const userId = getUserIdFromToken(token);
            setCurrentUserIdFromToken(userId);
        }
    }, [token]);

    useEffect(() => {
        if (token && users.length > 0) {
            checkFollowingStatus();
        }
    }, [users, token]);

    if (!isOpen) return null;

    const checkFollowingStatus = async () => {
        try {
            const promises = users
                .map(async (user) => {
                    const response = await fetch(`/api/Seguidor/is-following/${user.id}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                        }
                    });
                    if (response.ok) {
                        const data = await response.json();
                        return { userId: user.id, isFollowing: data.isFollowing };
                    }
                    return { userId: user.userId, isFollowing: false };
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

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const getProfileImageUrl = (fotoPerfil) => {
        if (!fotoPerfil) return null;
        if (fotoPerfil.startsWith('http')) return fotoPerfil;
        if (fotoPerfil.startsWith('/')) return `${window.location.origin}${fotoPerfil}`;
        return `${window.location.origin}/${fotoPerfil}`;
    };

    const handleImageError = (e) => {
        e.target.style.display = 'none';
        const backupIcon = e.target.parentNode.querySelector('.backup-icon');
        if (backupIcon) {
            backupIcon.style.display = 'flex';
        }
    };
    const FollowButton = ({ userId }) => {

        const isFollowing = followingStatus[userId];
        const isLoading = loadingFollow[userId];
        if (userId === currentUserIdFromToken || userId.toString() === currentUserIdFromToken?.toString()) {
            return (
                <span className={`
                    px-3 py-1 rounded-full text-xs font-medium
                    ${theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'}
                `}>
                    Tú
                </span>
            );
        }
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

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
            onClick={handleBackdropClick}
        >
            <div className={`
                w-full max-w-md max-h-[80vh] rounded-lg shadow-xl
                ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}
            `}>
                {/* Header del modal */}
                <div className={`
                    flex items-center justify-between p-4 border-b
                    ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}
                `}>
                    <h2 className="text-xl font-semibold">{title}</h2>
                    <button
                        onClick={onClose}
                        className={`
                            p-1 rounded-full transition-colors
                            ${theme === 'dark'
                                ? 'hover:bg-gray-700 text-texto-dark'
                                : 'hover:bg-gray-100 text-texto'
                            }
                        `}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Lista de usuarios */}
                <div className="max-h-96 overflow-y-auto p-4">
                    {users && users.length > 0 ? (
                        <div className="space-y-3">
                            {users.map((user) => (
                                <Link to={`/perfil/${user.id}`}>
                                    <div
                                        key={user.id}
                                        className={`
                                        flex items-center justify-between p-3 rounded-lg transition-colors
                                        ${theme === 'dark'
                                                ? 'hover:bg-gray-700'
                                                : 'hover:bg-gray-50'
                                            }
                                    `}
                                    >
                                        <div className="flex items-center space-x-3">
                                            {/* Avatar */}
                                            <div className={`
                                            w-10 h-10 rounded-full flex items-center justify-center overflow-hidden relative
                                            ${theme === 'dark' ? 'bg-primario' : 'bg-primario-dark'}
                                        `}>
                                                <User
                                                    size={24}
                                                    className={theme === 'dark' ? 'text-black' : 'text-white'}
                                                />

                                            </div>

                                            {/* Información del usuario */}
                                            <div>
                                                <p className="font-medium">
                                                    {user.nombre} {user.apellido}
                                                </p>
                                                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                                    }`}>
                                                    @{user.userName}
                                                </p>
                                            </div>
                                        </div>
                                        <FollowButton userId={user.id} />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className={`
                            text-center py-8
                            ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}
                        `}>
                            <User size={48} className="mx-auto mb-4 opacity-50" />
                            <p>No hay usuarios para mostrar</p>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
};

export default FollowersModal;