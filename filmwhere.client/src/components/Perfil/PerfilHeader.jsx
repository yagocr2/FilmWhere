import { useState } from 'react';
import { UserCircle, User, Mail, Calendar, Edit, Users, UserCheck, UserPlus, UserMinus } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import FollowersModal from './Modal/FollowersModal'

const PerfilHeader = ({
    userProfile,
    onEditProfile,
    currentUserId,
    onFollowToggle, 
    isPerfilP,
    isFollowing,
    getUserIdFromToken,
    idToken
}) => {
    const [loadingFollow, setLoadingFollow] = useState(false);
    const { theme } = useTheme();

    const [modalState, setModalState] = useState({
        isOpen: false,
        type: null, // 'followers' o 'following'
        title: '',
        users: []
    });

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getProfileImageUrl = (fotoPerfil) => {

        if (!fotoPerfil) return null;

        // Si es una URL completa, devolverla tal como está
        if (fotoPerfil.startsWith('http')) {
            return fotoPerfil;
        }

        // Para rutas que empiezan con '/', usar directamente con el origin
        if (fotoPerfil.startsWith('/')) {
            const fullUrl = `${window.location.origin}${fotoPerfil}`;
            return fullUrl;
        }

        // Si es una ruta relativa sin '/', añadir la barra
        const baseUrl = window.location.origin;
        const fullUrl = `${baseUrl}/${fotoPerfil}`;
        return fullUrl;
    };

    const handleImageError = (e) => {
        console.error('Error cargando imagen:', e.target.src);
        // Ocultar la imagen que falló
        e.target.style.display = 'none';
        // Mostrar el ícono de respaldo
        const backupIcon = e.target.parentNode.querySelector('.backup-icon');
        if (backupIcon) {
            backupIcon.style.display = 'flex';
        }
    };


    const openFollowersModal = () => {
        setModalState({
            isOpen: true,
            type: 'followers',
            title: 'Seguidores',
            users: userProfile?.seguidores
        });
    };

    const openFollowingModal = () => {
        setModalState({
            isOpen: true,
            type: 'following',
            title: 'Siguiendo',
            users: userProfile.seguidos
        });
    };

    const closeModal = () => {
        setModalState({
            isOpen: false,
            type: null,
            title: '',
            users: []
        });
    };
    const handleFollowToggle = async () => {
        if (!userProfile?.id || loadingFollow) return;

        setLoadingFollow(true);

        try {
            // Usar la función que viene del hook através de las props
            if (onFollowToggle) {
                await onFollowToggle(userProfile.id);
            }
        } catch (error) {
            console.error('Error en handleFollowToggle:', error);
        } finally {
            setLoadingFollow(false);
        }
    };

    const FollowButton = ({ userId, isFollowing, idToken }) => {
        // Si es el propio usuario, mostrar "Tú"
        if (userId === idToken || userId?.toString() === idToken?.toString()) {
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
            <div className="flex justify-end">
                <button
                    onClick={handleFollowToggle}
                    disabled={loadingFollow}
                    className={`
                        flex items-center gap-2 p-2 rounded-full transition-colors px-3 py-1 text-sm font-medium
                        ${isFollowing
                            ? `${theme === 'dark' ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'} text-white`
                            : `${theme === 'dark' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white`
                        }
                        ${loadingFollow ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}
                    `}
                >
                    {loadingFollow ? (
                        <div className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
                    ) : (
                        <div className="flex items-center">
                            {isFollowing ? <UserMinus size={17} /> : <UserPlus size={18} />}
                            <span className="ml-2 hidden sm:inline">
                                {isFollowing ? 'Siguiendo' : 'Seguir'}
                            </span>
                        </div>
                    )}
                </button>
            </div>
        );
    };

    return (
        <>
            <div className={`rounded-lg p-6 mb-8 relative ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-300'}`}>
                {/* Botón de editar o seguir */}
                {isPerfilP ? (
                    <div className="absolute right-4 top-4">
                        <FollowButton userId={userProfile?.id} isFollowing={isFollowing} idToken={idToken} />
                    </div>
                ) : (
                    <button
                        onClick={onEditProfile}
                        className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${theme === 'dark'
                            ? 'hover:bg-gray-700 text-texto-dark'
                            : 'hover:bg-gray-200 text-texto'
                            }`}
                        title="Editar perfil"
                    >
                        <Edit size={20} />
                    </button>
                )}

                <div className="flex items-center space-x-6">
                    {/* Imagen de perfil */}
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center overflow-hidden relative ${theme === 'dark' ? 'bg-primario' : 'bg-primario-dark'
                        }`}>
                        {userProfile?.fotoPerfil ? (
                            <>
                                <img
                                    src={getProfileImageUrl(userProfile.fotoPerfil)}
                                    alt={`${userProfile.nombre} ${userProfile.apellido}`}
                                    className="h-full w-full object-cover"
                                    onError={handleImageError}
                                />
                                {/* Icono de respaldo */}
                                <div
                                    className="backup-icon absolute inset-0 flex h-full w-full items-center justify-center"
                                    style={{ display: 'none' }}
                                >
                                    <UserCircle
                                        size={80}
                                        className={theme === 'dark' ? 'text-black' : 'text-white'}
                                    />
                                </div>
                            </>
                        ) : (
                            <UserCircle
                                size={80}
                                className={theme === 'dark' ? 'text-black' : 'text-white'}
                            />
                        )}
                    </div>

                    {/* Información del usuario */}
                    <div className="flex-1">
                        <h1 className="mb-2 text-3xl font-bold">
                            {userProfile?.nombre} {userProfile?.apellido}
                        </h1>
                        <div className="flex flex-wrap items-center gap-4 pt-1 text-sm">
                            <div className="flex items-center space-x-1">
                                <User size={16} />
                                <span>@{userProfile?.userName}</span>
                            </div>

                            <button
                                onClick={openFollowersModal}
                                className={`flex items-center space-x-2 transition-colors hover:opacity-80 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                    }`}
                                title="Ver seguidores"
                            >
                                <Users size={18} />
                                <span className="font-semibold">{userProfile?.seguidores?.length || 0}</span>
                                <span className="text-sm">Seguidores</span>
                            </button>

                            <button
                                onClick={openFollowingModal}
                                className={`flex items-center space-x-2 transition-colors hover:opacity-80 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                    }`}
                                title="Ver siguiendo"
                            >
                                <UserCheck size={18} />
                                <span className="font-semibold">{userProfile?.seguidos?.length || 0}</span>
                                <span className="text-sm">Siguiendo</span>
                            </button>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 pt-3 text-sm">
                            {isPerfilP ? null :
                                (
                                    <div className="flex items-center space-x-1">
                                        <Mail size={16} />
                                        <span>{userProfile?.email}</span>
                                    </div>
                                )}
                            <div className="flex items-center space-x-1">
                                <Calendar size={16} />
                                <span>
                                    Miembro desde {
                                        userProfile?.fechaRegistro
                                            ? formatDate(userProfile.fechaRegistro)
                                            : 'Fecha no disponible'
                                    }
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <FollowersModal
                isOpen={modalState.isOpen}
                onClose={closeModal}
                title={modalState.title}
                users={modalState.users}
                currentUserId={currentUserId}
                onFollowToggle={onFollowToggle}
                getUserIdFromToken={getUserIdFromToken}
            />
        </>
    );
};

export default PerfilHeader;