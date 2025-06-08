import { useState, useEffect } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import {Users,Search,Filter,UserPlus,
    Edit,Lock,Unlock,Mail,MailCheck,
    Eye,Trash2,ChevronLeft,ChevronRight,
    UserCheck,UserX,Calendar,Shield
} from 'lucide-react';

const AdminUsuarios = () => {
    const { theme } = useTheme();
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState(''); // 'view', 'edit', 'create', 'roles'
    const [roles, setRoles] = useState([]);

    const cardBgClass = theme === 'dark' ? 'bg-secundario-dark' : 'bg-white';
    const textClass = theme === 'dark' ? 'text-texto-dark' : 'text-texto';
    const textSecondaryClass = theme === 'dark' ? 'text-gray-300' : 'text-gray-600';
    const inputBgClass = theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50';
    const borderClass = theme === 'dark' ? 'border-gray-600' : 'border-gray-300';

    useEffect(() => {
        fetchUsuarios();
        fetchRoles();
    }, [currentPage, pageSize, searchTerm]);

    const fetchUsuarios = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const params = new URLSearchParams({
                page: currentPage,
                pageSize: pageSize,
                ...(searchTerm && { search: searchTerm })
            });

            const response = await fetch(`/api/admin/usuarios?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) throw new Error('Error al cargar usuarios');

            const data = await response.json();
            setUsuarios(data.users);
            setTotalCount(data.totalCount);
            setTotalPages(data.totalPages);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchRoles = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/admin/roles', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                setRoles(data);
            }
        } catch (err) {
            console.error('Error fetching roles:', err);
        }
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };

    const handleViewUser = async (userId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/admin/usuarios/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const userData = await response.json();
                setSelectedUser(userData);
                setModalType('view');
                setShowModal(true);
            }
        } catch (err) {
            console.error('Error fetching user details:', err);
        }
    };

    const handleToggleBlock = async (userId, isBlocked) => {
        try {
            const token = localStorage.getItem('token');
            const endpoint = isBlocked ? 'desbloquear' : 'bloquear';

            const response = await fetch(`/api/admin/usuarios/${userId}/${endpoint}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: !isBlocked ? JSON.stringify({}) : undefined
            });

            if (response.ok) {
                fetchUsuarios();
            }
        } catch (err) {
            console.error('Error toggling user block:', err);
        }
    };

    const handleConfirmEmail = async (userId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/admin/usuarios/${userId}/confirmar-email`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                fetchUsuarios();
            }
        } catch (err) {
            console.error('Error confirming email:', err);
        }
    };

    const StatusBadge = ({ user }) => {
        if (!user.activo) {
            return (
                <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                    <UserX size={12} className="mr-1" />
                    Bloqueado
                </span>
            );
        }
        if (!user.emailConfirmed) {
            return (
                <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                    <Mail size={12} className="mr-1" />
                    Sin confirmar
                </span>
            );
        }
        return (
            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                <UserCheck size={12} className="mr-1" />
                Activo
            </span>
        );
    };

    const UserModal = () => {
        if (!showModal || !selectedUser) return null;

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                <div className={`${cardBgClass} rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto`}>
                    <div className="p-6">
                        <div className="mb-6 flex items-center justify-between">
                            <h2 className={`${textClass} text-xl font-semibold flex items-center`}>
                                <Eye className="mr-2" size={24} />
                                Detalles del Usuario
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className={`${textSecondaryClass} hover:${textClass} transition-colors`}
                            >
                                ?
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <label className={`${textSecondaryClass} text-sm font-medium block mb-1`}>
                                        Nombre de usuario
                                    </label>
                                    <p className={`${textClass} font-medium`}>{selectedUser.userName}</p>
                                </div>
                                <div>
                                    <label className={`${textSecondaryClass} text-sm font-medium block mb-1`}>
                                        Email
                                    </label>
                                    <p className={`${textClass} font-medium flex items-center`}>
                                        {selectedUser.email}
                                        {selectedUser.emailConfirmed && (
                                            <MailCheck size={16} className="ml-2 text-green-600" />
                                        )}
                                    </p>
                                </div>
                                <div>
                                    <label className={`${textSecondaryClass} text-sm font-medium block mb-1`}>
                                        Nombre completo
                                    </label>
                                    <p className={`${textClass} font-medium`}>
                                        {selectedUser.nombre} {selectedUser.apellido}
                                    </p>
                                </div>
                                <div>
                                    <label className={`${textSecondaryClass} text-sm font-medium block mb-1`}>
                                        Fecha de registro
                                    </label>
                                    <p className={`${textClass} font-medium flex items-center`}>
                                        <Calendar size={16} className="mr-2" />
                                        {new Date(selectedUser.fechaRegistro).toLocaleDateString()}
                                    </p>
                                </div>
                                {selectedUser.fechaNacimiento && (
                                    <div>
                                        <label className={`${textSecondaryClass} text-sm font-medium block mb-1`}>
                                            Fecha de nacimiento
                                        </label>
                                        <p className={`${textClass} font-medium`}>
                                            {new Date(selectedUser.fechaNacimiento).toLocaleDateString()}
                                        </p>
                                    </div>
                                )}
                                <div>
                                    <label className={`${textSecondaryClass} text-sm font-medium block mb-1`}>
                                        Estado
                                    </label>
                                    <StatusBadge user={selectedUser} />
                                </div>
                            </div>

                            <div>
                                <label className={`${textSecondaryClass} text-sm font-medium block mb-2`}>
                                    Roles
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {selectedUser.roles?.map((role) => (
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
                                onClick={() => setShowModal(false)}
                                className={`px-4 py-2 rounded-lg ${inputBgClass} ${textClass} hover:bg-gray-200 transition-colors`}
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="rounded-lg bg-blue-600 p-3">
                        <Users className="text-white" size={24} />
                    </div>
                    <div>
                        <h1 className={`${textClass} text-2xl font-bold`}>Gestión de Usuarios</h1>
                        <p className={`${textSecondaryClass}`}>
                            {totalCount} usuarios registrados
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => {
                        setSelectedUser(null);
                        setModalType('create');
                        setShowModal(true);
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                >
                    <UserPlus size={20} />
                    <span>Nuevo Usuario</span>
                </button>
            </div>

            {/* Filters */}
            <div className={`${cardBgClass} rounded-lg shadow-lg p-6`}>
                <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
                    <div className="flex items-center space-x-4">
                        <div className="relative">
                            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${textSecondaryClass}`} size={20} />
                            <input
                                type="text"
                                placeholder="Buscar usuarios..."
                                value={searchTerm}
                                onChange={handleSearch}
                                className={`${inputBgClass} ${textClass} ${borderClass} border rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            />
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className={`${textSecondaryClass} text-sm`}>Mostrar:</span>
                        <select
                            value={pageSize}
                            onChange={(e) => {
                                setPageSize(Number(e.target.value));
                                setCurrentPage(1);
                            }}
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
                    <div className="p-8 text-center">
                        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
                        <p className={`${textSecondaryClass} mt-2`}>Cargando usuarios...</p>
                    </div>
                ) : error ? (
                    <div className="p-8 text-center">
                        <p className="mb-4 text-red-600">{error}</p>
                        <button
                            onClick={fetchUsuarios}
                            className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
                        >
                            Reintentar
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
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
                                                            onClick={() => handleConfirmEmail(user.id)}
                                                            className="text-green-600 hover:text-green-900 transition-colors"
                                                            title="Confirmar email"
                                                        >
                                                            <MailCheck size={16} />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleToggleBlock(user.id, !user.activo)}
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

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
                                <div className={`${textSecondaryClass} text-sm`}>
                                    Mostrando {((currentPage - 1) * pageSize) + 1} a {Math.min(currentPage * pageSize, totalCount)} de {totalCount} usuarios
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="px-3 py-1 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>

                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        const pageNum = i + Math.max(1, currentPage - 2);
                                        if (pageNum > totalPages) return null;

                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => handlePageChange(pageNum)}
                                                className={`px-3 py-1 rounded-lg transition-colors ${currentPage === pageNum
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                    }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}

                                    <button
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="px-3 py-1 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            <UserModal />
        </div>
    );
};

export default AdminUsuarios;