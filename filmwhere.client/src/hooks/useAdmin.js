import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext'; 

// Hook para estadísticas del dashboard
export const useAdminStats = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchEstadisticas = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch('/api/admin/estadisticas', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Error al cargar las estadísticas');
            }

            const data = await response.json();
            setStats(data);
        } catch (err) {
            setError(err.message);
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEstadisticas();
    }, []);

    return { stats, loading, error, refetch: fetchEstadisticas };
};

// Hook para gestión de roles
export const useAdminRoles = () => {
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

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

    const createRole = async (roleData) => {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/admin/roles', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(roleData),
        });

        if (!response.ok) throw new Error('Error al crear el rol');
        await fetchRoles();
    };

    const updateRole = async (roleId, roleData) => {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/admin/roles/${roleId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(roleData),
        });

        if (!response.ok) throw new Error('Error al actualizar el rol');
        await fetchRoles();
    };
    
    const deleteRole = async (roleId) => {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/admin/roles/${roleId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) throw new Error('Error al eliminar el rol');
        await fetchRoles();
    };

    useEffect(() => {
        fetchRoles();
    }, []);

    return {
        roles,
        loading,
        error,
        createRole,
        updateRole,
        deleteRole,
        refetch: fetchRoles
    };
};

// Hook para gestión de usuarios
export const useAdminUsers = () => {
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [totalCount, setTotalCount] = useState(0);

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
            const response = await fetch(`/api/admin/roles`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            console.log('Respuesta', response.json());
            return await response.json();
        } catch (error) {
            console.log('Error al cargar roles')
        }
    }
    const rolesDisponibles = async () => {
        const promesa = await fetchRoles();
        const resultado = promesa
        return resultado;

    }
    const fetchUserById = async (userId) => {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/admin/usuarios/${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) throw new Error('Error al cargar usuario');
        return await response.json();
    };
    const createUser = async (userData) => {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/admin/usuarios', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
        });

        if (!response.ok) throw new Error('Error al crear usuario');
        await fetchUsuarios();
    };
    const deleteUser = async (userId) => {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/admin/usuarios/${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) throw new Error('Error al eliminar usuario');
        return await response.json();
    }
    const toggleUserBlock = async (userId, isBlocked) => {
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

        if (!response.ok) throw new Error('Error al cambiar estado del usuario');
        await fetchUsuarios();
    };

    const resendEmail = async (userId) => {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/admin/usuarios/${userId}/enviar-confirmacion`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) throw new Error('Error al reenviar email');
        await fetchUsuarios();
    }

    const confirmUserEmail = async (userId) => {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/admin/usuarios/${userId}/confirmar-email`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) throw new Error('Error al confirmar email');
        await fetchUsuarios();
    };

    const handleSearch = (term) => {
        setSearchTerm(term);
        setCurrentPage(1);
    };

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };

    const handlePageSizeChange = (newSize) => {
        setPageSize(newSize);
        setCurrentPage(1);
    };

    useEffect(() => {
        fetchUsuarios();
    }, [currentPage, pageSize, searchTerm]);

    return {
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
        refetch: fetchUsuarios,
        deleteUser,
        createUser,
        resendEmail,
        rolesDisponibles
    };
};

// Hook para modales genéricos
export const useModal = () => {
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('');
    const [modalData, setModalData] = useState(null);

    const openModal = (type, data = null) => {
        setModalType(type);
        setModalData(data);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setModalType('');
        setModalData(null);
    };

    return {
        showModal,
        modalType,
        modalData,
        openModal,
        closeModal
    };
};

// Hook para temas compartido
export const useAdminTheme = () => {
    const { theme } = useTheme();

    return {
        cardBgClass: theme === 'dark' ? 'bg-gray-900' : 'bg-white',
        textClass: theme === 'dark' ? 'text-texto-dark' : 'text-texto',
        textSecondaryClass: theme === 'dark' ? 'text-gray-300' : 'text-gray-600',
        inputBgClass: theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50',
        borderClass: theme === 'dark' ? 'border-gray-700' : 'border-gray-300',
        hoverClass: theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
    };
};