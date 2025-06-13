// modules/Perfil/Perfil.jsx (Refactorizado)
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import FadeContent from '../../Animations/FadeContent/FadeContent';
import LoadingSpinner from '../../components/LoadingSpinner';

// Componentes específicos del perfil
import ProfileHeader from '../../components/Perfil/PerfilHeader';
import ProfileStats from '../../components/Perfil/PerfilStats';
import ProfileTabs from '../../components/Perfil/Secciones/PerfilSecciones';
import ReviewsTab from '../../components/Perfil/Secciones/SeccionReview';
import FavoritesTab from '../../components/Perfil/Secciones/SeccionFavoritos';
import ReviewModal from '../../components/ReviewModal';
import EditProfileModal from '../../components/Perfil/Modal/ModalEditarPerfil';

// Hook personalizado para manejar los datos del perfil
import { useProfileData } from '../../hooks/useDatosPerfil';
import { useParams, Link } from 'react-router-dom';

const Perfil = () => {
    const { token } = useAuth();
    const { theme } = useTheme();
    const { userId } = useParams();
    const [activeTab, setActiveTab] = useState('reseñas');

    // Estados para el modal de edición de reseñas
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [selectedMovieForReview, setSelectedMovieForReview] = useState(null);

    // Estado para el modal de edición de perfil
    const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);

    const {
        userProfile,
        setUserProfile,
        userReviews,
        favoriteMovies,
        favoritesMetadata,
        loading,
        error,
        buildTmdbImageUrl,
        handleDeleteReview,
        handleRemoveFromFavorites,
        refreshUserReviews,
        isFollowing,
        isPerfilP,
        getUserIdFromToken,
        idToken,
        handleFollowToggle 
    } = useProfileData(token, userId);

    // Función para manejar la edición de reseñas
    const handleEditReview = (movieData) => {
        setSelectedMovieForReview(movieData);
        setIsReviewModalOpen(true);
    };

    // Función para cerrar el modal de reseña
    const handleCloseReviewModal = () => {
        setIsReviewModalOpen(false);
        setSelectedMovieForReview(null);
        // Recargar las reseñas del usuario después de cerrar el modal
        // para reflejar cualquier cambio realizado
        if (refreshUserReviews) {
            refreshUserReviews();
        }
    };

    // Función para abrir el modal de edición de perfil
    const handleEditProfile = () => {
        setIsEditProfileModalOpen(true);
    };

    // Función para cerrar el modal de edición de perfil
    const handleCloseEditProfileModal = () => {
        setIsEditProfileModalOpen(false);
    };

    // Función para actualizar el perfil después de la edición
    const handleProfileUpdate = (updatedProfile) => {
        setUserProfile(updatedProfile);
    };

    // Mostrar loading si aún se están cargando los datos del perfil
    if (loading.profile) {
        return <LoadingSpinner message="Cargando perfil..." />;
    }

    // Mostrar error si no se pudieron cargar los datos del perfil
    if (error.profile) {
        return (
            <FadeContent>
                <div className={`min-h-screen ${theme === 'dark' ? 'bg-primario-dark text-texto-dark' : 'bg-primario text-texto'}`}>
                    <div className="container mx-auto px-4 py-8">
                        <div className="py-8 text-center text-red-500">{error.profile}</div>
                    </div>
                </div>
            </FadeContent>
        );
    }

    return (
        <FadeContent>
            <div className={`min-h-screen ${theme === 'dark' ? 'bg-primario-dark text-texto-dark' : 'bg-primario text-texto'}`}>
                <div className="container mx-auto px-4 py-8">
                    {/* Header del perfil */}
                    <ProfileHeader
                        userProfile={userProfile}
                        onEditProfile={handleEditProfile}
                        isPerfilP={isPerfilP}
                        currentUserId={userProfile.id}
                        isFollowing={isFollowing}
                        onFollowToggle={handleFollowToggle}
                        getUserIdFromToken={getUserIdFromToken}
                        idToken={idToken}
                        currentUserId={userProfile.id}
                    />

                    {/* Estadísticas */}
                    <ProfileStats
                        userReviews={userReviews}
                        favoritesMetadata={favoritesMetadata}
                    />

                    {/* Tabs */}
                    <ProfileTabs
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                    />

                    {/* Contenido de las tabs */}
                    {activeTab === 'reseñas' && (
                        <ReviewsTab
                            userReviews={userReviews}
                            loading={loading.reviews}
                            error={error.reviews}
                            onEditReview={handleEditReview}
                            onDeleteReview={handleDeleteReview}
                            buildTmdbImageUrl={buildTmdbImageUrl}
                            idToken={idToken}
                            currentUserId={userProfile.id}
                        />
                    )}

                    {activeTab === 'favoritos' && (
                        <FavoritesTab
                            favoriteMovies={favoriteMovies}
                            loading={loading.favorites}
                            error={error.favorites}
                            onRemoveFromFavorites={handleRemoveFromFavorites}
                            buildTmdbImageUrl={buildTmdbImageUrl}
                            idToken={idToken}
                            currentUserId={userProfile.id}
                        />
                    )}

                    {/* Modal de edición de perfil */}
                    <EditProfileModal
                        isOpen={isEditProfileModalOpen}
                        onClose={handleCloseEditProfileModal}
                        userProfile={userProfile}
                        onProfileUpdate={handleProfileUpdate}
                    />

                    {/* Modal de edición de reseñas */}
                    <ReviewModal
                        isOpen={isReviewModalOpen}
                        onClose={handleCloseReviewModal}
                        currentMovie={selectedMovieForReview}
                        getUserIdFromToken={getUserIdFromToken}
                    />
                </div>
            </div>
        </FadeContent>
    );
};

export default Perfil;