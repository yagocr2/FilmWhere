import React, { useState, useEffect } from 'react';
import { X, Upload, Trash2, User, Check, AlertCircle } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../context/AuthContext';

const ModalEditarPerfil = ({ isOpen, onClose, userProfile, onProfileUpdate }) => {
    const { theme } = useTheme();
    const { token } = useAuth();

    const [formData, setFormData] = useState({
        userName: '',
        nombre: '',
        apellido: '',
        fechaNacimiento: ''
    });

    const [imagePreview, setImagePreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [usernameStatus, setUsernameStatus] = useState({ checking: false, available: null, message: '' });
    const [originalUsername, setOriginalUsername] = useState('');

    // Inicializar formulario cuando se abre el modal
    useEffect(() => {
        if (isOpen && userProfile) {
            setFormData({
                userName: userProfile.userName || '',
                nombre: userProfile.nombre || '',
                apellido: userProfile.apellido || '',
                fechaNacimiento: userProfile.fechaNacimiento || ''
            });
            setOriginalUsername(userProfile.userName || '');
            setErrors({});
            setUsernameStatus({ checking: false, available: null, message: '' });
        }
    }, [isOpen, userProfile]);

    // Verificar disponibilidad del nombre de usuario
    const checkUsernameAvailability = async (username) => {
        if (!username || username === originalUsername) {
            setUsernameStatus({ checking: false, available: null, message: '' });
            return;
        }

        if (username.length < 3) {
            setUsernameStatus({
                checking: false,
                available: false,
                message: 'El nombre de usuario debe tener al menos 3 caracteres'
            });
            return;
        }

        setUsernameStatus({ checking: true, available: null, message: 'Verificando...' });

        try {
            const response = await fetch(`/api/user/check-username/${encodeURIComponent(username)}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setUsernameStatus({
                    checking: false,
                    available: data.available,
                    message: data.available ? 'Disponible' : 'No disponible'
                });
            } else {
                setUsernameStatus({ checking: false, available: null, message: 'Error al verificar' });
            }
        } catch (error) {
            console.error('Error verificando nombre de usuario:', error);
            setUsernameStatus({ checking: false, available: null, message: 'Error al verificar' });
        }
    };

    // Manejar cambios en el formulario con debounce para username
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Limpiar errores cuando el usuario empiece a escribir
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    // Efecto separado para el debounce del username
    useEffect(() => {
        if (formData.userName) {
            const timeoutId = setTimeout(() => {
                checkUsernameAvailability(formData.userName);
            }, 500);
            return () => clearTimeout(timeoutId);
        }
    }, [formData.userName]);

    // Manejar submit del formulario
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        try {
            // Verificar que el username esté disponible si se cambió
            if (formData.userName !== originalUsername && usernameStatus.available !== true) {
                setErrors({ userName: 'El nombre de usuario no está disponible' });
                setLoading(false);
                return;
            }

            // Actualizar perfil
            const response = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                const updatedProfile = await response.json();

                if (onProfileUpdate) {
                    onProfileUpdate(updatedProfile);
                    location.reload();
                }
                onClose();
            } else {
                const errorData = await response.json();
                if (errorData.Errors && Array.isArray(errorData.Errors)) {
                    const newErrors = {};
                    errorData.Errors.forEach(error => {
                        if (error.includes('nombre de usuario')) {
                            newErrors.userName = error;
                        } else if (error.includes('Nombre') && !error.includes('usuario')) {
                            newErrors.nombre = error;
                        } else if (error.includes('Apellido')) {
                            newErrors.apellido = error;
                        } else if (error.includes('fecha')) {
                            newErrors.fechaNacimiento = error;
                        } else {
                            newErrors.general = error;
                        }
                    });
                    setErrors(newErrors);
                } else {
                    setErrors({ general: errorData.Message || 'Error al actualizar el perfil' });
                }
            }
        } catch (error) {
            console.error('Error al actualizar perfil:', error);
            setErrors({ general: 'Error al actualizar el perfil' });
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className={`w-full max-w-md rounded-lg p-6 ${theme === 'dark' ? 'bg-gray-800 text-texto-dark' : 'bg-white text-texto'}`}>
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-2xl font-bold">Editar Perfil</h2>
                    <button
                        onClick={onClose}
                        className={`p-2 rounded-full hover:bg-opacity-20 ${theme === 'dark' ? 'hover:bg-white' : 'hover:bg-gray-500'}`}
                    >
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Nombre de usuario */}
                    <div>
                        <label className="mb-1 block text-sm font-medium">Nombre de usuario</label>
                        <div className="relative">
                            <input
                                type="text"
                                name="userName"
                                value={formData.userName}
                                onChange={handleInputChange}
                                className={`w-full p-3 rounded-lg border transition-colors ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} ${errors.userName || (usernameStatus.available === false) ? 'border-red-500' : ''}`}
                                placeholder="Ingresa tu nombre de usuario"
                                minLength={3}
                                maxLength={50}
                            />
                            {usernameStatus.checking && (
                                <div className="absolute right-3 top-3">
                                    <div className="border-primario h-5 w-5 animate-spin rounded-full border-b-2"></div>
                                </div>
                            )}
                            {!usernameStatus.checking && usernameStatus.available === true && (
                                <Check className="absolute right-3 top-3 text-green-500" size={20} />
                            )}
                            {!usernameStatus.checking && usernameStatus.available === false && (
                                <AlertCircle className="absolute right-3 top-3 text-red-500" size={20} />
                            )}
                        </div>
                        {usernameStatus.message && (
                            <p className={`text-sm mt-1 ${usernameStatus.available === true ? 'text-green-500' : usernameStatus.available === false ? 'text-red-500' : 'text-gray-500'}`}>
                                {usernameStatus.message}
                            </p>
                        )}
                        {errors.userName && <p className="mt-1 text-sm text-red-500">{errors.userName}</p>}
                    </div>

                    {/* Nombre */}
                    <div>
                        <label className="mb-1 block text-sm font-medium">Nombre</label>
                        <input
                            type="text"
                            name="nombre"
                            value={formData.nombre}
                            onChange={handleInputChange}
                            className={`w-full p-3 rounded-lg border transition-colors ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} ${errors.nombre ? 'border-red-500' : ''}`}
                            placeholder="Ingresa tu nombre"
                            required
                            minLength={2}
                            maxLength={50}
                        />
                        {errors.nombre && <p className="mt-1 text-sm text-red-500">{errors.nombre}</p>}
                    </div>

                    {/* Apellido */}
                    <div>
                        <label className="mb-1 block text-sm font-medium">Apellido</label>
                        <input
                            type="text"
                            name="apellido"
                            value={formData.apellido}
                            onChange={handleInputChange}
                            className={`w-full p-3 rounded-lg border transition-colors ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} ${errors.apellido ? 'border-red-500' : ''}`}
                            placeholder="Ingresa tu apellido"
                            required
                            minLength={2}
                            maxLength={50}
                        />
                        {errors.apellido && <p className="mt-1 text-sm text-red-500">{errors.apellido}</p>}
                    </div>

                    {/* Fecha de nacimiento */}
                    <div>
                        <label className="mb-1 block text-sm font-medium">Fecha de nacimiento</label>
                        <input
                            type="date"
                            name="fechaNacimiento"
                            value={formData.fechaNacimiento}
                            onChange={handleInputChange}
                            className={`w-full p-3 rounded-lg border transition-colors ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} ${errors.fechaNacimiento ? 'border-red-500' : ''}`}
                            required
                        />
                        {errors.fechaNacimiento && <p className="mt-1 text-sm text-red-500">{errors.fechaNacimiento}</p>}
                    </div>

                    {errors.general && (
                        <div className="rounded-lg bg-red-50 p-3 text-center text-sm text-red-500 dark:bg-red-900/20">
                            {errors.general}
                        </div>
                    )}

                    {/* Botones */}
                    <div className="flex space-x-4 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className={`flex-1 py-3 rounded-lg border transition-colors ${theme === 'dark' ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-50'} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading || (formData.userName !== originalUsername && usernameStatus.available !== true)}
                            className={`flex-1 py-3 rounded-lg bg-primario text-white hover:bg-primario-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${loading ? 'opacity-50' : ''}`}
                        >
                            {loading ? 'Guardando...' : 'Guardar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ModalEditarPerfil;