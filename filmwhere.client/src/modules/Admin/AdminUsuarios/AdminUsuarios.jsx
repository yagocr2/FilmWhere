import React, { useCallback, useState } from 'react';
import {
    Users, UserPlus, Eye, Lock, Unlock, MailCheck, Shield, Calendar,
    Trash2, Save, X, AlertTriangle
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
        resendEmail,
        //rolesDisponibles
    } = useAdminUsers();

    const { showModal, modalType, modalData, openModal, closeModal } = useModal();
    const { cardBgClass, textClass, textSecondaryClass, inputBgClass, borderClass } = useAdminTheme();

    // Estado para el formulario de creación
    const [createFormData, setCreateFormData] = useState({
        userName: '',
        email: '',
        password: '',
        nombre: '',
        apellido: '',
        fechaNacimiento: '',
        emailConfirmed: false,
        roles: []
    });

    const handleResendEmail = async (userId) => {
        resendEmail(userId);
    }

    const [formErrors, setFormErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Roles disponibles (esto debería venir de un endpoint)
    const rolesDisponibles = ['Registrado', 'Administrador'];

    const resetCreateForm = useCallback(() => {
        setCreateFormData({
            userName: '',
            email: '',
            password: '',
            nombre: '',
            apellido: '',
            fechaNacimiento: '',
            emailConfirmed: false,
            roles: []
        });
        setFormErrors({});
    }, []);

    const validateCreateForm = useCallback(() => {
        const errors = {};

        if (!createFormData.userName.trim()) {
            errors.userName = 'El nombre de usuario es obligatorio';
        } else if (createFormData.userName.length < 2) {
            errors.userName = 'El nombre de usuario debe tener al menos 2 caracteres';
        }

        if (!createFormData.email.trim()) {
            errors.email = 'El email es obligatorio';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createFormData.email)) {
            errors.email = 'El formato del email no es válido';
        }

        if (!createFormData.password.trim()) {
            errors.password = 'La contraseña es obligatoria';
        } else if (createFormData.password.length < 6) {
            errors.password = 'La contraseña debe tener al menos 6 caracteres';
        }

        if (!createFormData.nombre.trim()) {
            errors.nombre = 'El nombre es obligatorio';
        }

        if (!createFormData.apellido.trim()) {
            errors.apellido = 'El apellido es obligatorio';
        }

        if (!createFormData.fechaNacimiento) {
            errors.fechaNacimiento = 'La fecha de nacimiento es obligatoria';
        } else {
            const birthDate = new Date(createFormData.fechaNacimiento);
            const today = new Date();
            const age = today.getFullYear() - birthDate.getFullYear();
            if (age < 13) {
                errors.fechaNacimiento = 'Debe ser mayor de 13 años';
            }
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    }, [createFormData]);

    const handleCreateUser = useCallback(async (e) => {
        e.preventDefault();

        if (!validateCreateForm()) {
            return;
        }

        setIsSubmitting(true);
        try {
            // Convertir fecha al formato esperado por el backend
            const formattedData = {
                ...createFormData,
                fechaNacimiento: createFormData.fechaNacimiento
            };

            await createUser(formattedData);
            resetCreateForm();
            closeModal();
            refetch();
        } catch (error) {
            console.error('Error creating user:', error);
        } finally {
            setIsSubmitting(false);
        }
    }, [createFormData, validateCreateForm, createUser, resetCreateForm, closeModal, refetch]);

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
                            onViewUser={handleViewUser}//Funciona
                            onConfirmEmail={confirmUserEmail}//Funciona
                            onToggleBlock={toggleUserBlock}//Funciona
                            onDeleteUser={(user) => openModal('delete', user)}//Funciona
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
                    onSubmit={createUser}
                    avalibleRoles={rolesDisponibles}
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