import {
    Users, UserPlus, Eye, Lock, Unlock, MailCheck, Shield, Calendar,
    Trash2, Save, X, AlertTriangle, Edit
} from 'lucide-react';
import { DeleteUserModal, ViewUserModal } from '../../../components/Admin/UsersModal/UsersModal';
import CreateUserModal from '../../../components/Admin/CreateUserModal/CreateUserModal';
import UsersTable from '../../../components/Admin/UsersTable/UsersTable';
import UserFilters from '../../../components/Admin/UserFilters/UserFilters';
import {
    PageHeader,
    SearchBar,
    StatusBadge,
    LoadingSpinner,
    ErrorDisplay,
    Pagination,
    Modal
} from '../../../components/Admin/AdminComponents';
import { useAdminUsers } from '../../../hooks/Admin/useAdminUsers';
import { useAdminTheme } from '../../../hooks/Admin/useAdminTheme';
import { useModal } from '../../../hooks/useModal';
import EditUserModal from '../../../components/Admin/EditUserModal/EditUserModal';

const AdminUsuarios = () => {
    const {
        usuarios,
        loading,
        error,
        searchTerm,
        currentPage,
        pageSize,
        totalPages,
        totalCount,
        fetchUserById,
        toggleUserBlock,
        confirmUserEmail,
        createUser,
        deleteUser,
        handleSearch,
        handlePageChange,
        handlePageSizeChange,
        refetch,
        resendConfirmationEmail,
        isResendingEmail,
        editUser,
        updateUserRoles
        //rolesDisponibles
    } = useAdminUsers();

    const { showModal, modalType, modalData, openModal, closeModal } = useModal();
    const { cardBgClass, textClass, textSecondaryClass, inputBgClass, borderClass } = useAdminTheme();

    // Roles disponibles (esto debería venir de un endpoint)
    const rolesDisponibles = ['Registrado', 'Administrador'];

    const handleCreateUser = async (formData) => {
        try {
            await createUser(formData);
            closeModal();
            refetch();
        } catch (error) {
            console.error('Error creating user:', error);
            throw error; // Re-throw para que el modal pueda manejarlo
        }
    };

    const handleEditUser = async (userId, formData) => {
        try {
            // Debug: Log the data being sent
            console.log('handleEditUser called with:', { userId, formData });

            // Validate userId
            if (!userId || userId === 'undefined') {
                throw new Error('ID de usuario es requerido');
            }

            // Separar datos básicos de usuario y roles
            const { roles, ...userBasicData } = formData;

            // Actualizar datos básicos del usuario
            console.log('Updating basic user data:', userBasicData);
            await editUser(userId, userBasicData);

            // Actualizar roles si han cambiado
            if (roles && Array.isArray(roles)) {
                console.log('Updating user roles:', roles);
                // Make sure you have the updateUserRoles function available
                await updateUserRoles(userId, { roles });
            }

            closeModal();
            refetch();
        } catch (error) {
            console.error('Error editing user:', error);
            // Don't re-throw here, let the modal handle the error display
            // Show user-friendly error message
            alert(`Error al actualizar usuario: ${error.message}`);
        }
    };

    const handleDeleteUser = async (userId) => {
        try {
            await deleteUser(userId);
            closeModal();
            refetch();
        } catch (error) {
            console.error('Error deleting user:', error);
        }
    };

    const handleViewUser = async (userId) => {
        try {
            const userData = await fetchUserById(userId);
            openModal('view', userData);
        } catch (err) {
            console.error('Error fetching user details:', err);
        }
    };

    // Nueva función para abrir el modal de edición
    const handleOpenEditUser = async (userId) => {
        try {
            const userData = await fetchUserById(userId);
            openModal('edit', userData);
        } catch (err) {
            console.error('Error fetching user details:', err);
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                icon={{
                    component: <Users />,
                    bgColor: "bg-blue-600",
                    size: 24
                }}
                title="Gestión de Usuarios"
                subtitle={`${totalCount} usuarios registrados`}
                actionButton={
                    <button
                        onClick={() => openModal('create')}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                    >
                        <UserPlus size={20} />
                        <span>Nuevo Usuario</span>
                    </button>
                }
            />

            {/* Filters */}
            <UserFilters
                searchTerm={searchTerm}
                onSearch={handleSearch}
                pageSize={pageSize}
                onPageSizeChange={handlePageSizeChange}
                cardBgClass={cardBgClass}
                textClass={textClass}
                textSecondaryClass={textSecondaryClass}
                inputBgClass={inputBgClass}
                borderClass={borderClass}
            />

            {/* Users Table */}
            <div className={`${cardBgClass} rounded-lg shadow-lg overflow-hidden`}>
                {loading ? (
                    <LoadingSpinner text="Cargando usuarios..." />
                ) : error ? (
                    <ErrorDisplay
                        error={error}
                        onRetry={refetch}
                        retryText="Reintentar"
                    />
                ) : (
                    <>
                        <UsersTable
                            usuarios={usuarios}
                            onViewUser={handleViewUser}
                            onEditUser={handleOpenEditUser} // Agregar esta nueva prop
                            onConfirmEmail={confirmUserEmail}
                            onToggleBlock={toggleUserBlock}
                            onResendEmail={resendConfirmationEmail}
                            isResendingEmail={isResendingEmail}
                            onDeleteUser={(user) => openModal('delete', user)}
                            cardBgClass={cardBgClass}
                            textClass={textClass}
                            textSecondaryClass={textSecondaryClass}
                        />
                    </>
                )}
            </div>

            {/* Modal para crear usuario */}
            {showModal && modalType === 'create' && (
                <CreateUserModal
                    show={showModal}
                    onClose={closeModal}
                    onSubmit={handleCreateUser}
                    availableRoles={rolesDisponibles}
                    textSecondaryClass={textSecondaryClass}
                    inputBgClass={inputBgClass}
                    textClass={textClass}
                    borderClass={borderClass}
                />
            )}

            {/* Modal para ver usuario */}
            {showModal && modalType === 'view' && modalData && (
                <ViewUserModal
                    show={showModal}
                    onClose={closeModal}
                    user={modalData}
                    textSecondaryClass={textSecondaryClass}
                    inputBgClass={inputBgClass}
                    textClass={textClass}
                />
            )}

            {/* Modal para editar usuario - CORREGIDO */}
            {showModal && modalType === 'edit' && modalData && (
                <EditUserModal
                    show={showModal}
                    onClose={closeModal}
                    user={modalData}
                    onSubmit={handleEditUser} // Cambiar de handleCreateUser a handleEditUser
                    availableRoles={rolesDisponibles} // Agregar esta prop que faltaba
                    textSecondaryClass={textSecondaryClass}
                    inputBgClass={inputBgClass}
                    textClass={textClass}
                    borderClass={borderClass} // Agregar esta prop que faltaba
                />
            )}

            {/* Modal para confirmar eliminación */}
            {showModal && modalType === 'delete' && modalData && (
                <DeleteUserModal
                    show={showModal}
                    onClose={closeModal}
                    onConfirm={handleDeleteUser}
                    user={modalData}
                    textSecondaryClass={textSecondaryClass}
                    inputBgClass={inputBgClass}
                    textClass={textClass}
                />
            )}
        </div>
    );
};

export default AdminUsuarios;