import React, { useCallback, useState } from 'react';
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
import { useAdminUsers, useModal, useAdminTheme } from '../../../hooks/useAdmin';
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
            // Separar datos básicos de usuario y roles
            const { roles, ...userBasicData } = formData;

            // Actualizar datos básicos del usuario
            await editUser(userId, userBasicData);

            // Actualizar roles si han cambiado
            if (roles && roles.length > 0) {
                await updateUserRoles(userId, { roles });
            }
            closeModal();
            refetch();
        } catch (error) {
            console.error('Error editing user:', error);
            throw error; // Re-throw para que el modal pueda manejarlo
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