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

    const [profileImage, setProfileImage] = useState(null);
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
            setImagePreview(userProfile.fotoPerfil || null);
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

    // Manejar selección de imagen
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validar tipo de archivo
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
            if (!allowedTypes.includes(file.type)) {
                setErrors(prev => ({ ...prev, image: 'Solo se permiten imágenes (JPEG, PNG, GIF)' }));
                return;
            }

            // Validar tamaño (5MB)
            if (file.size > 5 * 1024 * 1024) {
                setErrors(prev => ({ ...prev, image: 'La imagen debe ser menor a 5MB' }));
                return;
            }

            setProfileImage(file);

            // Crear preview
            const reader = new FileReader();
            reader.onload = (e) => setImagePreview(e.target.result);
            reader.readAsDataURL(file);

            // Limpiar error de imagen
            if (errors.image) {
                setErrors(prev => ({ ...prev, image: '' }));
            }
        }
    };

    // Eliminar imagen de perfil
    const handleDeleteImage = async () => {
        try {
            const response = await fetch('/api/user/delete-profile-picture', {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                setImagePreview(null);
                setProfileImage(null);
                // Actualizar el perfil en el componente padre
                if (onProfileUpdate) {
                    const updatedProfile = { ...userProfile, fotoPerfil: null };
                    onProfileUpdate(updatedProfile);
                }
            } else {
                const errorData = await response.json();
                setErrors(prev => ({ ...prev, image: errorData.Message || 'Error al eliminar imagen' }));
            }
        } catch (error) {
            console.error('Error al eliminar imagen:', error);
            setErrors(prev => ({ ...prev, image: 'Error al eliminar imagen' }));
        }
    };

    // Subir imagen de perfil
    const uploadProfileImage = async () => {
        if (!profileImage) return null;

        const formDataImg = new FormData();
        formDataImg.append('file', profileImage);

        const response = await fetch('/api/user/upload-profile-picture', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formDataImg
        });

        if (response.ok) {
            const data = await response.json();
            return data.fotoPerfil;
        } else {
            const errorData = await response.json();
            throw new Error(errorData.Message || 'Error al subir imagen');
        }
    };

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

            // Subir imagen si hay una nueva
            let newImageUrl = imagePreview;
            if (profileImage) {
                try {
                    newImageUrl = await uploadProfileImage();
                } catch (imageError) {
                    setErrors({ image: imageError.message });
                    setLoading(false);
                    return;
                }
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
                updatedProfile.fotoPerfil = newImageUrl;

                if (onProfileUpdate) {
                    onProfileUpdate(updatedProfile);
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
                    {/* Imagen de perfil */}
                    <div className="mb-6 flex flex-col items-center">
                        <div className="relative mb-4">
                            {imagePreview ? (
                                <img
                                    src={imagePreview}
                                    alt="Perfil"
                                    className="border-primario h-24 w-24 rounded-full border-4 object-cover"
                                />
                            ) : (
                                <div className={`w-24 h-24 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-primario' : 'bg-primario-dark'}`}>
                                    <User size={32} className="text-white" />
                                </div>
                            )}
                            {imagePreview && (
                                <button
                                    type="button"
                                    onClick={handleDeleteImage}
                                    className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>

                        <label className={`cursor-pointer flex items-center space-x-2 px-4 py-2 rounded-lg border-2 border-dashed transition-colors ${theme === 'dark' ? 'border-gray-600 hover:border-primario' : 'border-gray-300 hover:border-primario-dark'}`}>
                            <Upload size={20} />
                            <span>Subir imagen</span>
                            <input
                                type="file"
                                accept="image/jpeg,image/jpg,image/png,image/gif"
                                onChange={handleImageChange}
                                className="hidden"
                            />
                        </label>
                        {errors.image && <p className="mt-1 text-sm text-red-500">{errors.image}</p>}
                    </div>

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