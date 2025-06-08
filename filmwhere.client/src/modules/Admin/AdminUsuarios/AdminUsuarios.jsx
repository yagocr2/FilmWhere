import React from 'react';
import { Users, UserPlus, Eye, Lock, Unlock, MailCheck, Shield, Calendar } from 'lucide-react';
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
        handleSearch,
        handlePageChange,
        handlePageSizeChange,
        refetch
    } = useAdminUsers();

    const { showModal, modalType, modalData, openModal, closeModal } = useModal();
    const { cardBgClass, textClass, textSecondaryClass, inputBgClass, borderClass } = useAdminTheme();

    const handleViewUser = async (userId) => {
        try {
            const userData = await fetchUserById(userId);
            openModal('view', userData);
        } catch (err) {
            console.error('Error fetching user details:', err);
        }
    };

    const UserModal = () => {
        if (!showModal || modalType !== 'view' || !modalData) return null;

        return (
            <Modal
                show={showModal}
                onClose={closeModal}
                title="Detalles del Usuario"
                icon={<Eye />}
                size="max-w-2xl"
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                            <label className={`${textSecondaryClass} text-sm font-medium block mb-1`}>
                                Nombre de usuario
                            </label>
                            <p className={`${textClass} font-medium`}>{modalData.userName}</p>
                        </div>
                        <div>
                            <label className={`${textSecondaryClass} text-sm font-medium block mb-1`}>
                                Email
                            </label>
                            <p className={`${textClass} font-medium flex items-center`}>
                                {modalData.email}
                                {modalData.emailConfirmed && (
                                    <MailCheck size={16} className="ml-2 text-green-600" />
                                )}
                            </p>
                        </div>
                        <div>
                            <label className={`${textSecondaryClass} text-sm font-medium block mb-1`}>
                                Nombre completo
                            </label>
                            <p className={`${textClass} font-medium`}>
                                {modalData.nombre} {modalData.apellido}
                            </p>
                        </div>
                        <div>
                            <label className={`${textSecondaryClass} text-sm font-medium block mb-1`}>
                                Fecha de registro
                            </label>
                            <p className={`${textClass} font-medium flex items-center`}>
                                <Calendar size={16} className="mr-2" />
                                {new Date(modalData.fechaRegistro).toLocaleDateString()}
                            </p>
                        </div>
                        {modalData.fechaNacimiento && (
                            <div>
                                <label className={`${textSecondaryClass} text-sm font-medium block mb-1`}>
                                    Fecha de nacimiento
                                </label>
                                <p className={`${textClass} font-medium`}>
                                    {new Date(modalData.fechaNacimiento).toLocaleDateString()}
                                </p>
                            </div>
                        )}
                        <div>
                            <label className={`${textSecondaryClass} text-sm font-medium block mb-1`}>
                                Estado
                            </label>
                            <StatusBadge user={modalData} />
                        </div>
                    </div>

                    <div>
                        <label className={`${textSecondaryClass} text-sm font-medium block mb-2`}>
                            Roles
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {modalData.roles?.map((role) => (
                                <span
                                    key={role}
                                    className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800"
                                >
                                    <Shield size={12} className="mr-1" />
                                    {role}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3 border-t border-gray-200 pt-6">
                    <button
                        onClick={closeModal}
                        className={`px-4 py-2 rounded-lg ${inputBgClass} ${textClass} hover:bg-gray-200 transition-colors`}
                    >
                        Cerrar
                    </button>
                </div>
            </Modal>
        );
    };

    const UsersTable = () => (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className={`bg-gray-50 dark:bg-gray-700`}>
                    <tr>
                        <th className={`${textClass} px-6 py-3 text-left text-xs font-medium uppercase tracking-wider`}>
                            Usuario
                        </th>
                        <th className={`${textClass} px-6 py-3 text-left text-xs font-medium uppercase tracking-wider`}>
                            Email
                        </th>
                        <th className={`${textClass} px-6 py-3 text-left text-xs font-medium uppercase tracking-wider`}>
                            Estado
                        </th>
                        <th className={`${textClass} px-6 py-3 text-left text-xs font-medium uppercase tracking-wider`}>
                            Roles
                        </th>
                        <th className={`${textClass} px-6 py-3 text-left text-xs font-medium uppercase tracking-wider`}>
                            Fecha Registro
                        </th>
                        <th className={`${textClass} px-6 py-3 text-right text-xs font-medium uppercase tracking-wider`}>
                            Acciones
                        </th>
                    </tr>
                </thead>
                <tbody className={`${cardBgClass} divide-y divide-gray-200`}>
                    {usuarios.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="whitespace-nowrap px-6 py-4">
                                <div className="flex items-center">
                                    <div className="h-10 w-10 flex-shrink-0">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-300">
                                            <Users size={20} className="text-gray-600" />
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <div className={`${textClass} text-sm font-medium`}>
                                            {user.userName}
                                        </div>
                                        <div className={`${textSecondaryClass} text-sm`}>
                                            {user.nombre} {user.apellido}
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                                <div className={`${textClass} text-sm`}>{user.email}</div>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                                <StatusBadge user={user} />
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                                <div className="flex flex-wrap gap-1">
                                    {user.roles?.slice(0, 2).map((role) => (
                                        <span
                                            key={role}
                                            className="inline-flex items-center rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800"
                                        >
                                            {role}
                                        </span>
                                    ))}
                                    {user.roles?.length > 2 && (
                                        <span className="text-xs text-gray-500">
                                            +{user.roles.length - 2}
                                        </span>
                                    )}
                                </div>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                                <div className={`${textSecondaryClass} text-sm`}>
                                    {new Date(user.fechaRegistro).toLocaleDateString()}
                                </div>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                <div className="flex items-center justify-end space-x-2">
                                    <button
                                        onClick={() => handleViewUser(user.id)}
                                        className="text-blue-600 hover:text-blue-900 transition-colors"
                                        title="Ver detalles"
                                    >
                                        <Eye size={16} />
                                    </button>
                                    {!user.emailConfirmed && (
                                        <button
                                            onClick={() => confirmUserEmail(user.id)}
                                            className="text-green-600 hover:text-green-900 transition-colors"
                                            title="Confirmar email"
                                        >
                                            <MailCheck size={16} />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => toggleUserBlock(user.id, !user.activo)}
                                        className={`${user.activo ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'} transition-colors`}
                                        title={user.activo ? 'Bloquear usuario' : 'Desbloquear usuario'}
                                    >
                                        {user.activo ? <Lock size={16} /> : <Unlock size={16} />}
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

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
                        <UsersTable />
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

            <UserModal />
        </div>
    );
};

export default AdminUsuarios;