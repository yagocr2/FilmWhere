import { useState, useEffect } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import {
    Shield,
    Plus,
    Edit,
    Trash2,
    Users,
    Save,
    X,
    AlertTriangle
} from 'lucide-react';

const AdminRoles = () => {
    const { theme } = useTheme();
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState(''); // 'create', 'edit', 'delete'
    const [selectedRole, setSelectedRole] = useState(null);
    const [formData, setFormData] = useState({ name: '', description: '' });

    const cardBgClass = theme === 'dark' ? 'bg-secundario-dark' : 'bg-white';
    const textClass = theme === 'dark' ? 'text-texto-dark' : 'text-texto';
    const textSecondaryClass = theme === 'dark' ? 'text-gray-300' : 'text-gray-600';
    const inputBgClass = theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50';
    const borderClass = theme === 'dark' ? 'border-gray-600' : 'border-gray-300';

    useEffect(() => {
        fetchRoles();
    }, []);

    const fetchRoles = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch('/api/admin/roles', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) throw new Error('Error al cargar roles');

            const data = await response.json();
            setRoles(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRole = () => {
        setFormData({ name: '', description: '' });
        setModalType('create');
        setShowModal(true);
    };

    const handleEditRole = (role) => {
        setSelectedRole(role);
        setFormData({ name: role.name, description: role.description || '' });
        setModalType('edit');
        setShowModal(true);
    };

    const handleDeleteRole = (role) => {
        setSelectedRole(role);
        setModalType('delete');
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const url = modalType === 'create' ? '/api/admin/roles' : `/api/admin/roles/${selectedRole.id}`;
            const method = modalType === 'create' ? 'POST' : 'PUT';

            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                setShowModal(false);
                fetchRoles();
            } else {
                throw new Error('Error al guardar el rol');
            }
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDelete = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/admin/roles/${selectedRole.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                setShowModal(false);
                fetchRoles();
            } else {
                throw new Error('Error al eliminar el rol');
            }
        } catch (err) {
            setError(err.message);
        }
    };

    const Modal = () => {
        if (!showModal) return null;

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                <div className={`${cardBgClass} rounded-lg shadow-xl max-w-md w-full`}>
                    <div className="p-6">
                        <div className="mb-6 flex items-center justify-between">
                            <h2 className={`${textClass} text-xl font-semibold flex items-center`}>
                                {modalType === 'create' && <><Plus className="mr-2" size={24} />Crear Rol</>}
                                {modalType === 'edit' && <><Edit className="mr-2" size={24} />Editar Rol</>}
                                {modalType === 'delete' && <><Trash2 className="mr-2" size={24} />Eliminar Rol</>}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className={`${textSecondaryClass} hover:${textClass} transition-colors`}
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {modalType === 'delete' ? (
                            <div>
                                <div className="mb-4 flex items-center text-red-600">
                                    <AlertTriangle className="mr-2" size={24} />
                                    <span className="text-lg font-medium">�Confirmar eliminaci�n?</span>
                                </div>
                                <p className={`${textSecondaryClass} mb-6`}>
                                    �Est�s seguro de que deseas eliminar el rol "{selectedRole?.name}"?
                                    Esta acción no se puede deshacer.
                                </p>
                                <div className="flex justify-end space-x-3">
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className={`px-4 py-2 rounded-lg ${inputBgClass} ${textClass} hover:bg-gray-200 transition-colors`}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        className="rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit}>
                                <div className="space-y-4">
                                    <div>
                                        <label className={`${textClass} block text-sm font-medium mb-1`}>
                                            Nombre del Rol
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className={`${inputBgClass} ${textClass} ${borderClass} w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className={`${textClass} block text-sm font-medium mb-1`}>
                                            Descripción
                                        </label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            className={`${inputBgClass} ${textClass} ${borderClass} w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                            rows="3"
                                        />
                                    </div>
                                </div>
                                <div className="mt-6 flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className={`px-4 py-2 rounded-lg ${inputBgClass} ${textClass} hover:bg-gray-200 transition-colors`}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
                                    >
                                        <Save size={16} />
                                        <span>Guardar</span>
                                    </button>
                                </div>
                            </form>
                        )}
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
                    <div className="rounded-lg bg-purple-600 p-3">
                        <Shield className="text-white" size={24} />
                    </div>
                    <div>
                        <h1 className={`${textClass} text-2xl font-bold`}>Gestión de Roles</h1>
                        <p className={`${textSecondaryClass}`}>
                            Administra los roles y permisos del sistema
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleCreateRole}
                    className="flex items-center space-x-2 rounded-lg bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700"
                >
                    <Plus size={20} />
                    <span>Nuevo Rol</span>
                </button>
            </div>

            {/* Roles List */}
            <div className={`${cardBgClass} rounded-lg shadow-lg`}>
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-purple-600"></div>
                        <p className={`${textSecondaryClass} mt-2`}>Cargando roles...</p>
                    </div>
                ) : error ? (
                    <div className="p-8 text-center">
                        <p className="mb-4 text-red-600">{error}</p>
                        <button
                            onClick={fetchRoles}
                            className="rounded-lg bg-purple-600 px-4 py-2 text-white transition-colors hover:bg-purple-700"
                        >
                            Reintentar
                        </button>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200">
                        {roles.map((role) => (
                            <div key={role} className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <div className="rounded-lg bg-purple-100 p-3">
                                            <Shield className="text-purple-600" size={24} />
                                        </div>
                                        <div>
                                            <h3 className={`${textClass} text-lg font-semibold`}>{role}</h3>
                                            <p className={`${textSecondaryClass} text-sm`}>
                                                Rol del sistema FilmWhere
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => handleEditRole({ name: role, id: role })}
                                            className="text-blue-600 hover:text-blue-900 transition-colors p-2 rounded-lg hover:bg-blue-50"
                                            title="Editar rol"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        {!['Administrador', 'Registrado'].includes(role) && (
                                            <button
                                                onClick={() => handleDeleteRole({ name: role, id: role })}
                                                className="text-red-600 hover:text-red-900 transition-colors p-2 rounded-lg hover:bg-red-50"
                                                title="Eliminar rol"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <Modal />
        </div>
    );
};

export default AdminRoles;