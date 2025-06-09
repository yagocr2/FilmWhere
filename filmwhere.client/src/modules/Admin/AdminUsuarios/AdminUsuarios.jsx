import React, { useCallback, useState } from 'react';
import {
    Users, UserPlus, Eye, Lock, Unlock, MailCheck, Shield, Calendar,
    Trash2, Save, X, AlertTriangle
} from 'lucide-react';
import { DeleteUserModal, ViewUserModal } from '../../../components/Admin/UsersModal/UsersModal';
import CreateUserModal from '../../../components/Admin/CreateUserModal/CreateUserModal';
import UsersTable from '../../../components/Admin/UsersTable/UsersTable';
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

    const handleDeleteUser = async (userId, userName) => {
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

    //// Modal para crear usuario
    //const UsersTable = () => (
    //    <div className="overflow-x-auto">
    //        <table className="min-w-full divide-y divide-gray-200">
    //            <thead className={`bg-gray-50 dark:bg-gray-800`}>
    //                <tr>
    //                    <th className={`${textClass} px-6 py-3 text-left text-xs font-medium uppercase tracking-wider`}>
    //                        Usuario
    //                    </th>
    //                    <th className={`${textClass} px-6 py-3 text-left text-xs font-medium uppercase tracking-wider`}>
    //                        Email
    //                    </th>
    //                    <th className={`${textClass} px-6 py-3 text-left text-xs font-medium uppercase tracking-wider`}>
    //                        Estado
    //                    </th>
    //                    <th className={`${textClass} px-6 py-3 text-left text-xs font-medium uppercase tracking-wider`}>
    //                        Roles
    //                    </th>
    //                    <th className={`${textClass} px-6 py-3 text-left text-xs font-medium uppercase tracking-wider`}>
    //                        Fecha Registro
    //                    </th>
    //                    <th className={`${textClass} px-6 py-3 text-right text-xs font-medium uppercase tracking-wider`}>
    //                        Acciones
    //                    </th>
    //                </tr>
    //            </thead>
    //            <tbody className={`${cardBgClass} divide-y divide-gray-200`}>
    //                {usuarios.map((user) => (
    //                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
    //                        <td className="px-6 py-4 whitespace-nowrap">
    //                            <div className="flex items-center">
    //                                <div className="h-10 w-10 flex-shrink-0">
    //                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-300">
    //                                        <Users size={20} className="text-gray-600" />
    //                                    </div>
    //                                </div>
    //                                <div className="ml-4">
    //                                    <div className={`${textClass} text-sm font-medium`}>
    //                                        {user.userName}
    //                                    </div>
    //                                    <div className={`${textSecondaryClass} text-sm`}>
    //                                        {user.nombre} {user.apellido}
    //                                    </div>
    //                                </div>
    //                            </div>
    //                        </td>
    //                        <td className="px-6 py-4 whitespace-nowrap">
    //                            <div className={`${textClass} text-sm`}>{user.email}</div>
    //                        </td>
    //                        <td className="px-6 py-4 whitespace-nowrap">
    //                            <StatusBadge user={user} />
    //                        </td>
    //                        <td className="px-6 py-4 whitespace-nowrap">
    //                            <div className="flex flex-wrap gap-1">
    //                                {user.roles?.slice(0, 2).map((role) => (
    //                                    <span
    //                                        key={role}
    //                                        className="inline-flex items-center rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800"
    //                                    >
    //                                        {role}
    //                                    </span>
    //                                ))}
    //                                {user.roles?.length > 2 && (
    //                                    <span className="text-xs text-gray-500">
    //                                        +{user.roles.length - 2}
    //                                    </span>
    //                                )}
    //                            </div>
    //                        </td>
    //                        <td className="px-6 py-4 whitespace-nowrap">
    //                            <div className={`${textSecondaryClass} text-sm`}>
    //                                {new Date(user.fechaRegistro).toLocaleDateString()}
    //                            </div>
    //                        </td>
    //                        <td className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
    //                            <div className="flex items-center justify-end space-x-2">
    //                                <button
    //                                    onClick={() => handleViewUser(user.id)}
    //                                    className="text-blue-600 hover:text-blue-900 transition-colors"
    //                                    title="Ver detalles"
    //                                >
    //                                    <Eye size={16} />
    //                                </button>
    //                                {!user.emailConfirmed && (
    //                                    <button
    //                                        onClick={() => confirmUserEmail(user.id)}
    //                                        className="text-green-600 hover:text-green-900 transition-colors"
    //                                        title="Confirmar email"
    //                                    >
    //                                        <MailCheck size={16} />
    //                                    </button>
    //                                )}
    //                                <button
    //                                    onClick={() => toggleUserBlock(user.id, !user.activo)}
    //                                    className={`${user.activo ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'} transition-colors`}
    //                                    title={user.activo ? 'Bloquear usuario' : 'Desbloquear usuario'}
    //                                >
    //                                    {user.activo ? <Lock size={16} /> : <Unlock size={16} />}
    //                                </button>
    //                                <button
    //                                    onClick={() => openModal('delete', user)}
    //                                    className="text-red-600 hover:text-red-900 transition-colors"
    //                                    title="Eliminar usuario"
    //                                >
    //                                    <Trash2 size={16} />
    //                                </button>
    //                            </div>
    //                        </td>
    //                    </tr>
    //                ))}
    //            </tbody>
    //        </table>
    //    </div>
    //);

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
            <div className={`${cardBgClass} rounded-lg shadow-lg p-6`}>
                <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
                    <SearchBar
                        searchTerm={searchTerm}
                        onSearch={handleSearch}
                        placeholder="Buscar usuarios..."
                    />
                    <div className="flex items-center space-x-2">
                        <span className={`${textSecondaryClass} text-sm`}>Mostrar:</span>
                        <select
                            value={pageSize}
                            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                            className={`${inputBgClass} ${textClass} ${borderClass} border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                    </div>
                </div>
            </div>

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
                            onToggleUserBlock={toggleUserBlock}
                            onDeleteUser={handleDeleteUser}
                            cardBgClass={cardBgClass}
                            textClass={textClass}
                            textSecondaryClass={textSecondaryClass}
                        />
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalCount={totalCount}
                            pageSize={pageSize}
                            onPageChange={handlePageChange}
                            itemName="usuarios"
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