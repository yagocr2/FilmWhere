import { useState, useEffect } from 'react';

export const useAdminUsers = () => {
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [resendingEmails, setResendingEmails] = useState(new Set());


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
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/admin/usuarios', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`, // Si usas autenticación
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            if (!response.ok) {
                const errorData = await response.json();

                // Crear un error personalizado que incluya la información de respuesta
                const error = new Error('Error al crear usuario');
                error.response = {
                    status: response.status,
                    data: errorData
                };
                throw error;
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error in createUser:', error);
            throw error; // Re-throw para que el componente pueda manejarlo
        }
    };
    const editUser = async (userId, userData) => {
        try {
            const token = localStorage.getItem('token');

            // Validate userId
            if (!userId || userId === 'undefined') {
                throw new Error('ID de usuario es requerido');
            }

            console.log('Editing user:', { userId, userData }); // Debug log

            const response = await fetch(`/api/admin/usuarios/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(userData)
            });

            // Check if response is ok first
            if (!response.ok) {
                const errorText = await response.text();
                console.error('HTTP Error:', response.status, errorText);
                throw new Error(`HTTP ${response.status}: ${errorText || 'Error al actualizar usuario'}`);
            }

            // Only try to parse JSON if there's content
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const responseData = await response.json();
                return responseData;
            } else {
                // If no content (204 No Content), return success
                return { success: true };
            }

        } catch (error) {
            console.error('Error in editUser:', error);
            throw error;
        }
    };
    // Also add a separate function for updating roles
    const updateUserRoles = async (userId, rolesData) => {
        try {
            const token = localStorage.getItem('token');
            if (!userId || userId === 'undefined') {
                throw new Error('ID de usuario es requerido');
            }

            console.log('Updating user roles:', { userId, rolesData });

            const response = await fetch(`/api/admin/usuarios/${userId}/roles`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(rolesData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText || 'Error al actualizar roles'}`);
            }

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            }

            return { success: true };
        } catch (error) {
            console.error('Error updating user roles:', error);
            throw error;
        }
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

    const resendConfirmationEmail = async (userId) => {
        try {
            const token = localStorage.getItem('token');
            setResendingEmails(prev => new Set([...prev, userId]));

            const response = await fetch(`/api/admin/usuarios/${userId}/enviar-confirmacion`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al reenviar email de confirmación');
            }

            const result = await response.json();

            // Mostrar notificación de éxito (puedes usar tu sistema de notificaciones)
            console.log('Email reenviado exitosamente:', result.message);

            // Opcional: Mostrar toast o notificación
            // showSuccessToast('Email de confirmación reenviado exitosamente');

            return result;
        } catch (error) {
            console.error('Error al reenviar email:', error);
            // Opcional: Mostrar toast de error
            // showErrorToast(error.message);
            throw error;
        } finally {
            setResendingEmails(prev => {
                const newSet = new Set(prev);
                newSet.delete(userId);
                return newSet;
            });
        }
    };
    const isResendingEmail = (userId) => {
        return resendingEmails.has(userId);
    };

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
        editUser,
        updateUserRoles,
        resendConfirmationEmail,
        isResendingEmail,
        rolesDisponibles
    };
};